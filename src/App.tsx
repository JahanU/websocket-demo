import { useEffect, useRef, useState } from "react";

import "./App.css";
const SERVER = `ws://localhost:3001/ws`;

type connection = 'Connected' | 'Disconnected' | 'Error';

type rowData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

function App() {

  const [status, setStatus] = useState<connection>('Disconnected');
  const [data, setData] = useState<rowData[]>([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(SERVER);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected');
    }

    socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type !== "snapshot" && type !== "tick") return;
      console.log(type, data);
      setData(data);
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
          {data && data.map((row) => {
            return (
              <li key={row.symbol + row.timestamp}>{row.symbol} {row.price}</li>
            )
          })}
        </ul>

      </div>
    </>
  );
}

export default App;
