import { useEffect, useState } from "react";

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
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    const socket = new WebSocket(SERVER);

    socket.onopen = () => {
      setStatus('Connected');
    }

    socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type !== "snapshot" && type !== "tick") return;
      console.log(type, data);
      setTicks(data);
    }

    socket.onclose = () => setStatus('Disconnected');
    socket.onerror = () => setStatus('Error');

    return () => socket.close();
  }, []);

  return (
    <>
      <div className="card">
        <span>Connection: {status}</span>

        <ul>
          {ticks.map((row) => {
            return (
              <li key={row.symbol}>{row.symbol} {row.price}</li>
            )
          })}
        </ul>

      </div>
    </>
  );
}

export default App;
