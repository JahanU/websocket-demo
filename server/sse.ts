import { SYMBOLS, currentTicks, type Tick } from "./tickers.ts";

type Listener = (ticks: Tick[]) => void;

// Every open SSE stream registers here; the shared clock in index.ts feeds them.
const listeners = new Set<Listener>();

export const sseListenerCount = () => listeners.size;

export const broadcastToStreams = (ticks: Tick[]) => {
  for (const listener of listeners) listener(ticks);
};

export const sseResponse = (url: URL): Response => {
  // No `symbols` param means everything; an empty one means nothing.
  const param = url.searchParams.get("symbols");
  const wanted = param === null ? SYMBOLS : param.split(",").filter((s) => SYMBOLS.includes(s));

  const encoder = new TextEncoder();
  let listener: Listener;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        // The client may vanish between ticks; drop the stream if the write fails.
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          return true;
        } catch {
          listeners.delete(listener);
          return false;
        }
      };

      // Tell the browser how long to wait before auto-reconnecting.
      controller.enqueue(encoder.encode("retry: 2000\n\n"));
      send("snapshot", currentTicks().filter((t) => wanted.includes(t.symbol)));

      listener = (ticks) => send("tick", ticks.filter((t) => wanted.includes(t.symbol)));
      listeners.add(listener);

      console.log(`sse stream opened for ${wanted.length} symbols (${listeners.size} total)`);
    },
    cancel() {
      listeners.delete(listener);
      console.log(`sse stream closed (${listeners.size} left)`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      // EventSource enforces CORS; the WebSocket handshake does not.
      "Access-Control-Allow-Origin": "*",
    },
  });
};
