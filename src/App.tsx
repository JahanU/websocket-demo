import { useEffect, useState } from "react";

import "./App.css";
const SERVER = `http://localhost:3001/sse`;

type ConnectionStatus = 'Connected' | 'Disconnected' | 'Error';

type Tick = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

function App() {

  const [status, setStatus] = useState<ConnectionStatus>('Disconnected');
  const [quotes, setQuotes] = useState<Record<string, Tick>>({});
  const [symbols, setSymbols] = useState<string[]>([]);
  // null means "everything" — we don't know the symbol list until the first snapshot.
  const [subscribed, setSubscribed] = useState<string[] | null>(null);

  useEffect(() => {
    // SSE is server-to-client only, so the subscription rides on the URL and
    // changing it means reopening the stream.
    const url = subscribed === null ? SERVER : `${SERVER}?symbols=${subscribed.join(",")}`;
    const source = new EventSource(url);

    source.onopen = () => setStatus('Connected');

    source.addEventListener("snapshot", (event) => {
      const data: Tick[] = JSON.parse(event.data);
      setQuotes(Object.fromEntries(data.map((tick) => [tick.symbol, tick])));
      setSymbols((prev) => (prev.length ? prev : data.map((tick) => tick.symbol)));
    });

    source.addEventListener("tick", (event) => {
      const data: Tick[] = JSON.parse(event.data);
      setQuotes((prev) => {
        const next = { ...prev };
        for (const tick of data) next[tick.symbol] = tick;
        return next;
      });
    });

    // EventSource reconnects on its own; this only reflects the current state.
    source.onerror = () => setStatus(source.readyState === EventSource.CLOSED ? 'Error' : 'Disconnected');

    return () => source.close();
  }, [subscribed]);

  const active = subscribed ?? symbols;

  const toggle = (symbol: string) => {
    setSubscribed(active.includes(symbol)
      ? active.filter((s) => s !== symbol)
      : [...active, symbol]);
  };

  const rows = active.map((symbol) => quotes[symbol]).filter(Boolean);

  return (
    <>
      <div className="card">
        <span className="status" data-status={status}>{status}</span>

        <fieldset className="subscriptions">
          <legend>Subscriptions</legend>
          {symbols.map((symbol) => (
            <label key={symbol}>
              <input
                type="checkbox"
                checked={active.includes(symbol)}
                onChange={() => toggle(symbol)}
              />
              {symbol}
            </label>
          ))}
        </fieldset>

        <ul className="quotes">
          {rows.map((row) => {
            return (
              <li className="quote" key={row.symbol}>
                <span className="quote-symbol">{row.symbol}</span>
                <span className="quote-price">{row.price.toFixed(2)}</span>
              </li>
            )
          })}
        </ul>

      </div>
    </>
  );
}

export default App;
