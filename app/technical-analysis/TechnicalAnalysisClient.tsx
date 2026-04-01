"use client";

import { useState, useEffect, useCallback } from "react";
import { initAnalytics, trackPageView } from "../firebase";

/* ─── coin & timeframe options ─── */
const COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
];

const TIMEFRAMES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

/* ─── math helpers ─── */
function calcSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      result.push(sum / period);
    }
  }
  return result;
}

function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  // seed with SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sum += data[i];
      result.push(NaN);
    } else if (i === period - 1) {
      sum += data[i];
      result.push(sum / period);
    } else {
      const prev = result[i - 1];
      result.push(data[i] * k + prev * (1 - k));
    }
  }
  return result;
}

function calcRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return NaN;
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // smoothed with Wilder's method for remaining
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcStdDev(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

type Signal = "Buy" | "Sell" | "Neutral";

function signalBadge(signal: Signal) {
  const colors: Record<Signal, string> = {
    Buy: "bg-green-500/20 text-green-400 border-green-500/30",
    Sell: "bg-red-500/20 text-red-400 border-red-500/30",
    Neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold uppercase ${colors[signal]}`}
    >
      {signal}
    </span>
  );
}

function formatNum(n: number, digits = 2): string {
  if (isNaN(n)) return "—";
  if (Math.abs(n) >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: digits });
  return n.toPrecision(4);
}

/* ─── component ─── */
export default function TechnicalAnalysisClient() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [days, setDays] = useState(30);
  const [prices, setPrices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/crypto?action=chart&id=${coinId}&days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const json = await res.json();
      // json.prices = [[timestamp, price], ...]
      const p: number[] = (json.prices || []).map((pt: [number, number]) => pt[1]);
      if (p.length === 0) throw new Error("No price data returned");
      setPrices(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [coinId, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── calculations ─── */
  const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
  const sma20Arr = calcSMA(prices, 20);
  const sma50Arr = calcSMA(prices, 50);
  const sma20 = sma20Arr.length > 0 ? sma20Arr[sma20Arr.length - 1] : NaN;
  const sma50 = sma50Arr.length > 0 ? sma50Arr[sma50Arr.length - 1] : NaN;
  const ema12Arr = calcEMA(prices, 12);
  const ema26Arr = calcEMA(prices, 26);
  const ema12 = ema12Arr.length > 0 ? ema12Arr[ema12Arr.length - 1] : NaN;
  const ema26 = ema26Arr.length > 0 ? ema26Arr[ema26Arr.length - 1] : NaN;

  // MA signal
  const maSignal: Signal =
    isNaN(sma20) || isNaN(sma50) ? "Neutral" : sma20 > sma50 ? "Buy" : "Sell";

  // RSI
  const rsi = calcRSI(prices, 14);
  const rsiSignal: Signal = isNaN(rsi)
    ? "Neutral"
    : rsi < 30
    ? "Buy"
    : rsi > 70
    ? "Sell"
    : "Neutral";

  // MACD
  const macdLine = !isNaN(ema12) && !isNaN(ema26) ? ema12 - ema26 : NaN;
  // Build MACD line series for signal line (EMA9 of MACD)
  const macdSeries: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const e12 = ema12Arr[i];
    const e26 = ema26Arr[i];
    macdSeries.push(!isNaN(e12) && !isNaN(e26) ? e12 - e26 : NaN);
  }
  // Filter out leading NaN for signal line calc
  const validMacd = macdSeries.filter((v) => !isNaN(v));
  const signalLineArr = calcEMA(validMacd, 9);
  const signalLine = signalLineArr.length > 0 ? signalLineArr[signalLineArr.length - 1] : NaN;
  const histogram = !isNaN(macdLine) && !isNaN(signalLine) ? macdLine - signalLine : NaN;
  const macdSignal: Signal =
    isNaN(macdLine) || isNaN(signalLine)
      ? "Neutral"
      : macdLine > signalLine
      ? "Buy"
      : "Sell";

  // Bollinger Bands
  const stdDev20 = calcStdDev(prices, 20);
  const bbMiddle = sma20;
  const bbUpper = !isNaN(sma20) ? sma20 + 2 * stdDev20 : NaN;
  const bbLower = !isNaN(sma20) ? sma20 - 2 * stdDev20 : NaN;
  const bbRange = !isNaN(bbUpper) && !isNaN(bbLower) ? bbUpper - bbLower : 1;
  const bbPosition = !isNaN(bbLower) ? (currentPrice - bbLower) / bbRange : 0.5;
  const bbSignal: Signal =
    isNaN(bbUpper) || isNaN(bbLower)
      ? "Neutral"
      : bbPosition < 0.2
      ? "Buy"
      : bbPosition > 0.8
      ? "Sell"
      : "Neutral";

  // Overall summary
  const signals = [maSignal, rsiSignal, macdSignal, bbSignal];
  const buyCount = signals.filter((s) => s === "Buy").length;
  const sellCount = signals.filter((s) => s === "Sell").length;
  let overallSignal: string;
  let overallColor: string;
  if (buyCount === 4) {
    overallSignal = "Strong Buy";
    overallColor = "bg-green-500/20 border-green-500/40 text-green-400";
  } else if (buyCount >= 3) {
    overallSignal = "Buy";
    overallColor = "bg-green-500/15 border-green-500/30 text-green-400";
  } else if (sellCount === 4) {
    overallSignal = "Strong Sell";
    overallColor = "bg-red-500/20 border-red-500/40 text-red-400";
  } else if (sellCount >= 3) {
    overallSignal = "Sell";
    overallColor = "bg-red-500/15 border-red-500/30 text-red-400";
  } else {
    overallSignal = "Neutral";
    overallColor = "bg-gray-500/15 border-gray-500/30 text-gray-400";
  }

  const selectedCoin = COINS.find((c) => c.id === coinId)!;

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={coinId}
          onChange={(e) => setCoinId(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#111827] px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          {COINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.symbol})
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-lg border border-gray-700 bg-[#111827] p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.days}
              onClick={() => setDays(tf.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === tf.days
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Overall Signal */}
          <div
            className={`rounded-2xl border p-6 text-center ${overallColor}`}
          >
            <p className="mb-1 text-sm font-medium uppercase tracking-widest opacity-70">
              Overall Signal for {selectedCoin.name}
            </p>
            <p className="text-4xl font-extrabold">{overallSignal}</p>
            <p className="mt-2 text-sm opacity-60">
              Based on {signals.length} indicators &middot; {buyCount} Buy, {sellCount} Sell,{" "}
              {signals.length - buyCount - sellCount} Neutral
            </p>
          </div>

          {/* Current Price */}
          <div className="rounded-xl border border-gray-800 bg-[#111827] p-4 text-center">
            <p className="text-sm text-gray-400">Current Price</p>
            <p className="text-2xl font-bold">${formatNum(currentPrice)}</p>
          </div>

          {/* Indicators Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Moving Averages */}
            <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Moving Averages</h3>
                {signalBadge(maSignal)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">SMA 20</span>
                  <span className="font-mono">${formatNum(sma20)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SMA 50</span>
                  <span className="font-mono">${formatNum(sma50)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMA 12</span>
                  <span className="font-mono">${formatNum(ema12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMA 26</span>
                  <span className="font-mono">${formatNum(ema26)}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {maSignal === "Buy"
                    ? "SMA 20 is above SMA 50 — Bullish crossover"
                    : maSignal === "Sell"
                    ? "SMA 20 is below SMA 50 — Bearish crossover"
                    : "Insufficient data for signal"}
                </p>
              </div>
            </div>

            {/* RSI */}
            <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">RSI (14)</h3>
                {signalBadge(rsiSignal)}
              </div>
              <div className="mb-3 text-center">
                <span className="text-3xl font-bold">
                  {isNaN(rsi) ? "—" : rsi.toFixed(1)}
                </span>
              </div>
              {/* Gauge bar */}
              <div className="relative h-4 w-full overflow-hidden rounded-full">
                <div className="absolute inset-0 flex">
                  <div className="h-full w-[30%] bg-green-600" />
                  <div className="h-full w-[40%] bg-gray-600" />
                  <div className="h-full w-[30%] bg-red-600" />
                </div>
                {!isNaN(rsi) && (
                  <div
                    className="absolute top-0 h-full w-1 -translate-x-1/2 bg-white shadow-lg"
                    style={{ left: `${Math.min(100, Math.max(0, rsi))}%` }}
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>0 — Oversold</span>
                <span>50</span>
                <span>Overbought — 100</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {rsi < 30
                  ? "RSI is below 30 — asset may be oversold, potential buying opportunity."
                  : rsi > 70
                  ? "RSI is above 70 — asset may be overbought, consider taking profits."
                  : "RSI is in the neutral zone — no strong momentum signal."}
              </p>
            </div>

            {/* MACD */}
            <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">MACD</h3>
                {signalBadge(macdSignal)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD Line</span>
                  <span className="font-mono">{formatNum(macdLine, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Signal Line</span>
                  <span className="font-mono">{formatNum(signalLine, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Histogram</span>
                  <span
                    className={`font-mono ${
                      !isNaN(histogram)
                        ? histogram >= 0
                          ? "text-green-400"
                          : "text-red-400"
                        : ""
                    }`}
                  >
                    {formatNum(histogram, 4)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {macdSignal === "Buy"
                    ? "MACD is above Signal line — Bullish momentum"
                    : macdSignal === "Sell"
                    ? "MACD is below Signal line — Bearish momentum"
                    : "Insufficient data for signal"}
                </p>
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Bollinger Bands</h3>
                {signalBadge(bbSignal)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Upper Band</span>
                  <span className="font-mono">${formatNum(bbUpper)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Middle Band (SMA 20)</span>
                  <span className="font-mono">${formatNum(bbMiddle)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lower Band</span>
                  <span className="font-mono">${formatNum(bbLower)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Position</span>
                  <span className="font-mono">
                    {isNaN(bbPosition) ? "—" : `${(bbPosition * 100).toFixed(1)}%`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {bbSignal === "Buy"
                    ? "Price is near the lower band — potential buying opportunity."
                    : bbSignal === "Sell"
                    ? "Price is near the upper band — potential selling opportunity."
                    : "Price is within normal range of Bollinger Bands."}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center text-sm text-yellow-400/80">
            Technical analysis is not financial advice. Always do your own research
            before making investment decisions.
          </div>

          {/* Indicator Education */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Understanding the Indicators</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
                <h3 className="mb-2 font-semibold text-blue-400">
                  Moving Averages (SMA & EMA)
                </h3>
                <p className="text-sm text-gray-400">
                  Moving averages smooth price data to identify trend direction.
                  SMA gives equal weight to all periods, while EMA gives more
                  weight to recent prices. When a shorter-term MA crosses above a
                  longer-term MA, it signals a potential uptrend (Golden Cross),
                  and vice versa (Death Cross).
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
                <h3 className="mb-2 font-semibold text-blue-400">
                  RSI (Relative Strength Index)
                </h3>
                <p className="text-sm text-gray-400">
                  RSI measures the speed and magnitude of price changes on a
                  0-100 scale. Values below 30 suggest the asset is oversold and
                  may bounce, while values above 70 suggest it is overbought and
                  may pull back. It is most useful in ranging markets.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
                <h3 className="mb-2 font-semibold text-blue-400">
                  MACD (Moving Average Convergence Divergence)
                </h3>
                <p className="text-sm text-gray-400">
                  MACD shows the relationship between EMA 12 and EMA 26. When the
                  MACD line crosses above the signal line, it indicates bullish
                  momentum. A positive and growing histogram confirms strong
                  upward momentum. MACD works best in trending markets.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#111827] p-5">
                <h3 className="mb-2 font-semibold text-blue-400">
                  Bollinger Bands
                </h3>
                <p className="text-sm text-gray-400">
                  Bollinger Bands consist of a middle SMA and upper/lower bands
                  set at 2 standard deviations. When price touches the lower
                  band, it may be oversold; near the upper band, it may be
                  overbought. Band width narrows during low volatility
                  ("squeeze") and often precedes a breakout.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
