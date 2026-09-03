export interface Tick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

const seed = [
  { symbol: "AAPL", price: 227.52 },
  { symbol: "MSFT", price: 441.18 },
  { symbol: "NVDA", price: 118.94 },
  { symbol: "TSLA", price: 249.03 },
  { symbol: "AMZN", price: 186.41 },
  { symbol: "BTC-USD", price: 63104.22 },
];

const state = seed.map((s) => ({ ...s, open: s.price }));

// Random walk: each tick nudges the price by up to +/-0.4%.
export const nextTicks = (): Tick[] =>
  state.map((s) => {
    s.price = Math.max(0.01, s.price * (1 + (Math.random() - 0.5) * 0.008));
    const change = s.price - s.open;

    return {
      symbol: s.symbol,
      price: Number(s.price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(((change / s.open) * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 50_000) + 1_000,
      timestamp: Date.now(),
    };
  });
