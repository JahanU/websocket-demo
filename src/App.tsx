import { useEffect, useRef, useState } from "react";

import "./App.css";
const SERVER = `ws://localhost:3001/ws`;

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
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(SERVER);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected');
    }

    socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === "snapshot") {
        setQuotes(Object.fromEntries(data.map((tick: Tick) => [tick.symbol, tick])));
        setSymbols(data.map((tick: Tick) => tick.symbol));
        setSubscribed(data.map((tick: Tick) => tick.symbol));
      } else if (type === "tick") {
        // Ticks arrive one symbol at a time, so merge rather than replace.
        setQuotes((prev) => {
          const next = { ...prev };
          for (const tick of data as Tick[])
            next[tick.symbol] = tick;
          return next;
        });
      } else if (type === "subscribed") {
        setSubscribed(data);
      }
    }

    socket.onclose = () => setStatus('Disconnected');
    socket.onerror = () => setStatus('Error');

    return () => socket.close();
  }, []);

  const toggle = (symbol: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: subscribed.includes(symbol) ? "unsubscribe" : "subscribe",
      symbols: [symbol],
    }));
  };

  const rows = subscribed.map((symbol) => quotes[symbol]).filter(Boolean);

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
                checked={subscribed.includes(symbol)}
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
