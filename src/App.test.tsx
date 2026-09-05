import { beforeEach, describe, expect, it } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

class MockEventSource {
  static CLOSED = 2;
  static last: MockEventSource | null = null;
  static opened: string[] = [];

  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1;
  closed = false;

  private handlers = new Map<string, (event: { data: string }) => void>();

  constructor(url: string) {
    MockEventSource.last = this;
    MockEventSource.opened.push(url);
  }

  addEventListener(name: string, handler: (event: { data: string }) => void) {
    this.handlers.set(name, handler);
  }

  emit(name: string, data: unknown) {
    this.handlers.get(name)?.({ data: JSON.stringify(data) });
  }

  close() {
    this.closed = true;
  }
}

const source = () => MockEventSource.last!;

const receive = (name: string, data: unknown) => act(() => source().emit(name, data));

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
  receive("snapshot", [tick("AAPL", 227.52), tick("MSFT", 441.18)]);

beforeEach(() => {
  MockEventSource.last = null;
  MockEventSource.opened = [];
  globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
});

describe("App", () => {
  it("starts disconnected", () => {
    render(<App />);
    expect(screen.getByText("Disconnected")).toHaveAttribute("data-status", "Disconnected");
  });

  it("reports connected once the stream opens", () => {
    render(<App />);
    act(() => source().onopen?.());
    expect(screen.getByText("Connected")).toHaveAttribute("data-status", "Connected");
  });

  it("opens without a symbols filter before the first snapshot", () => {
    render(<App />);
    expect(MockEventSource.opened).toEqual(["http://localhost:3001/sse"]);
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

  it("merges ticks instead of replacing the table", () => {
    render(<App />);
    snapshot();
    const before = screen.getAllByRole("listitem")[0];

    receive("tick", [tick("AAPL", 228.10)]);

    // MSFT is untouched by an AAPL-only tick.
    expect(rows()).toEqual([
      { symbol: "AAPL", price: "228.10" },
      { symbol: "MSFT", price: "441.18" },
    ]);
    // Same DOM node kept across ticks: the key is the symbol, not the timestamp.
    expect(screen.getAllByRole("listitem")[0]).toBe(before);
  });

  it("reopens the stream with a symbols filter when a box is unticked", async () => {
    const user = userEvent.setup();
    render(<App />);
    snapshot();
    const first = source();

    await user.click(screen.getByLabelText("AAPL"));

    expect(first.closed).toBe(true);
    expect(MockEventSource.opened.at(-1)).toBe("http://localhost:3001/sse?symbols=MSFT");
    expect(rows()).toEqual([{ symbol: "MSFT", price: "441.18" }]);
    // The checkbox stays so it can be turned back on.
    expect(screen.getByLabelText("AAPL")).not.toBeChecked();
  });

  it("reopens with an empty filter when everything is unticked", async () => {
    const user = userEvent.setup();
    render(<App />);
    snapshot();

    await user.click(screen.getByLabelText("AAPL"));
    await user.click(screen.getByLabelText("MSFT"));

    expect(MockEventSource.opened.at(-1)).toBe("http://localhost:3001/sse?symbols=");
    expect(rows()).toEqual([]);
  });

  it("closes the stream on unmount", () => {
    const { unmount } = render(<App />);
    const es = source();
    unmount();
    expect(es.closed).toBe(true);
  });
});
