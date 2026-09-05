import { beforeEach, describe, expect, it } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

class MockWebSocket {
  static OPEN = 1;
  static last: MockWebSocket | null = null;

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1;
  closed = false;
  sent: string[] = [];

  constructor() {
    MockWebSocket.last = this;
  }

  send(message: string) {
    this.sent.push(message);
  }

  close() {
    this.closed = true;
  }
}

const socket = () => MockWebSocket.last!;

const receive = (payload: unknown) =>
  act(() => socket().onmessage?.({ data: JSON.stringify(payload) }));

const lastSent = () => JSON.parse(socket().sent.at(-1)!);

const rows = () =>
  screen.queryAllByRole("listitem").map((li) => ({
    symbol: li.querySelector(".quote-symbol")?.textContent,
    price: li.querySelector(".quote-price")?.textContent,
  }));

const tick = (symbol: string, price: number) => ({
  symbol,
  price,
  change: 0,
  changePercent: 0,
  volume: 100,
  timestamp: Date.now(),
});

const snapshot = () =>
  receive({ type: "snapshot", data: [tick("AAPL", 227.52), tick("MSFT", 441.18)] });

beforeEach(() => {
  MockWebSocket.last = null;
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

describe("App", () => {
  it("starts disconnected", () => {
    render(<App />);
    expect(screen.getByText("Disconnected")).toHaveAttribute("data-status", "Disconnected");
  });

  it("reports connected once the socket opens", () => {
    render(<App />);
    act(() => socket().onopen?.());
    expect(screen.getByText("Connected")).toHaveAttribute("data-status", "Connected");
  });

  it("renders rows and subscribes to everything from the snapshot", () => {
    render(<App />);
    snapshot();

    expect(rows()).toEqual([
      { symbol: "AAPL", price: "227.52" },
      { symbol: "MSFT", price: "441.18" },
    ]);
    expect(screen.getByLabelText("AAPL")).toBeChecked();
  });

  it("merges single-symbol ticks instead of replacing the table", () => {
    render(<App />);
    snapshot();
    const before = screen.getAllByRole("listitem")[0];

    receive({ type: "tick", data: [tick("AAPL", 228.10)] });

    // MSFT is untouched by an AAPL-only tick.
    expect(rows()).toEqual([
      { symbol: "AAPL", price: "228.10" },
      { symbol: "MSFT", price: "441.18" },
    ]);
    // Same DOM node kept across ticks: the key is the symbol, not the timestamp.
    expect(screen.getAllByRole("listitem")[0]).toBe(before);
  });

  it("sends an unsubscribe when a checked symbol is toggled off", async () => {
    const user = userEvent.setup();
    render(<App />);
    snapshot();

    await user.click(screen.getByLabelText("AAPL"));

    expect(lastSent()).toEqual({ type: "unsubscribe", symbols: ["AAPL"] });
  });

  it("sends a subscribe when an unchecked symbol is toggled on", async () => {
    const user = userEvent.setup();
    render(<App />);
    snapshot();
    receive({ type: "subscribed", data: ["MSFT"] });

    await user.click(screen.getByLabelText("AAPL"));

    expect(lastSent()).toEqual({ type: "subscribe", symbols: ["AAPL"] });
  });

  it("hides rows the server says are no longer subscribed", () => {
    render(<App />);
    snapshot();

    receive({ type: "subscribed", data: ["MSFT"] });

    expect(rows()).toEqual([{ symbol: "MSFT", price: "441.18" }]);
    // The checkbox stays so it can be turned back on.
    expect(screen.getByLabelText("AAPL")).not.toBeChecked();
  });

  it("ignores messages that are not price updates", () => {
    render(<App />);
    snapshot();
    receive({ type: "pong" });

    expect(rows()).toHaveLength(2);
  });

  it("closes the socket on unmount", () => {
    const { unmount } = render(<App />);
    const ws = socket();
    unmount();
    expect(ws.closed).toBe(true);
  });
});
