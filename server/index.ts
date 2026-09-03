import { nextTicks } from "./tickers.ts";

const PORT = Number(process.env.PORT ?? 3001);
const INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 1000);
const TOPIC = "prices";

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const { pathname } = new URL(req.url);

    if (pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }

    if (pathname === "/health") {
      return Response.json({ ok: true, clients: server.subscriberCount(TOPIC) });
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.subscribe(TOPIC);
      // Send a full snapshot immediately so a new client isn't blank.
      ws.send(JSON.stringify({ type: "snapshot", data: nextTicks() }));
      console.log(`client connected (${server.subscriberCount(TOPIC)} total)`);
    },
    close() {
      console.log(`client disconnected (${server.subscriberCount(TOPIC)} left)`);
    },
    message(ws, message) {
      // Not needed for the feed, but lets the client verify the socket is alive.
      if (message === "ping") ws.send(JSON.stringify({ type: "pong" }));
    },
  },
});

setInterval(() => {
  if (server.subscriberCount(TOPIC) === 0) return;
  server.publish(TOPIC, JSON.stringify({ type: "tick", data: nextTicks() }));
}, INTERVAL_MS);

console.log(`WebSocket server on ws://localhost:${PORT}/ws`);
