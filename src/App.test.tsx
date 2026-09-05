import { beforeEach, describe, expect, it } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import App from "./App";

class MockWebSocket {
  static last: MockWebSocket | null = null;

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor() {
    MockWebSocket.last = this;
  }

  close() {
    this.closed = true;
  }
}

const socket = () => MockWebSocket.last!;

const send = (payload: unknown) =>
  act(() => socket().onmessage?.({ data: JSON.stringify(payload) }));

const tick = (symbol: string, price: number) => ({
  symbol,
  price,
  change: 0,
  changePercent: 0,
  volume: 100,
  timestamp: Date.now(),
});

beforeEach(() => {
  MockWebSocket.last = null;
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

describe("App", () => {
  it("starts disconnected", () => {
    render(<App />);
    expect(screen.getByText(/Connection: Disconnected/)).toBeInTheDocument();
  });

  it("reports connected once the socket opens", () => {
    render(<App />);
    act(() => socket().onopen?.());
    expect(screen.getByText(/Connection: Connected/)).toBeInTheDocument();
  });

  it("renders rows from a snapshot", () => {
    render(<App />);
    send({ type: "snapshot", data: [tick("AAPL", 227.52), tick("MSFT", 441.18)] });

    expect(screen.getByText(/AAPL 227.52/)).toBeInTheDocument();
    expect(screen.getByText(/MSFT 441.18/)).toBeInTheDocument();
  });

  it("replaces rows on each tick and reuses list items by symbol", () => {
    render(<App />);
    send({ type: "snapshot", data: [tick("AAPL", 227.52)] });
    const before = screen.getByRole("listitem");

    send({ type: "tick", data: [tick("AAPL", 228.10)] });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText(/AAPL 228.1/)).toBeInTheDocument();
    // Same DOM node kept across ticks: the key is the symbol, not the timestamp.
    expect(screen.getByRole("listitem")).toBe(before);
  });

  it("ignores messages that are not price updates", () => {
    render(<App />);
    send({ type: "snapshot", data: [tick("AAPL", 227.52)] });
    send({ type: "pong" });

    expect(screen.getByText(/AAPL 227.52/)).toBeInTheDocument();
  });

  it("closes the socket on unmount", () => {
    const { unmount } = render(<App />);
    const ws = socket();
    unmount();
    expect(ws.closed).toBe(true);
  });
});
