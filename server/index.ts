import type { ServerWebSocket } from "bun";
import { SYMBOLS, currentTicks, nextTicks } from "./tickers.ts";

const PORT = Number(process.env.PORT ?? 3001);
const INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 1000);

// One pub/sub topic per symbol, so each client only receives what it asked for.
const topic = (symbol: string) => `price:${symbol}`;

const subscriptionsOf = (ws: ServerWebSocket<unknown>) =>
  SYMBOLS.filter((symbol) => ws.isSubscribed(topic(symbol)));

let clients = 0;

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const { pathname } = new URL(req.url);

    if (pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }

    if (pathname === "/health") {
      return Response.json({ ok: true, clients });
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      clients++;
      // Everything is subscribed by default; the client narrows it down.
      for (const symbol of SYMBOLS) ws.subscribe(topic(symbol));
      // Send a full snapshot immediately so a new client isn't blank.
      ws.send(JSON.stringify({ type: "snapshot", data: currentTicks() }));
      console.log(`client connected (${clients} total)`);
    },
    close() {
      clients--;
      console.log(`client disconnected (${clients} left)`);
    },
    message(ws, message) {
      if (message === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }
      console.log('message back', message);
      let msg;
      try {
        msg = JSON.parse(String(message));
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      if (msg.type !== "subscribe" && msg.type !== "unsubscribe") {
        ws.send(JSON.stringify({ type: "error", message: `Unknown type: ${msg.type}` }));
        return;
      }

      const requested: string[] = Array.isArray(msg.symbols) ? msg.symbols : [];
      for (const symbol of requested.filter((s) => SYMBOLS.includes(s))) {
        if (msg.type === "subscribe")
          ws.subscribe(topic(symbol));
        else
          ws.unsubscribe(topic(symbol));
      }

      // Ack with the authoritative list so the client never guesses its own state.
      ws.send(JSON.stringify({ type: "subscribed", data: subscriptionsOf(ws) }));
    },
  },
});

setInterval(() => {
  if (clients === 0) return;
  for (const tick of nextTicks()) {
    server.publish(topic(tick.symbol), JSON.stringify({ type: "tick", data: [tick] }));
  }
}, INTERVAL_MS);

console.log(`WebSocket server on ws://localhost:${PORT}/ws`);
