"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, AreaSeriesPartialOptions, Time } from "lightweight-charts";

/* ---------- types ---------- */
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: { usd: number };
    atl: { usd: number };
    ath_date: { usd: string };
  };
}

type ChartPoint = [number, number]; // [timestamp_ms, price]

const TIME_RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
  { label: "All", days: "max" as const },
];

/* ---------- helpers ---------- */
function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "N/A";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCompact(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmt(n)}`;
}

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Use the last (period) changes for initial averages
  const recentChanges = changes.slice(-period);
  let gainSum = 0;
  let lossSum = 0;

  for (const c of recentChanges) {
    if (c > 0) gainSum += c;
    else lossSum += Math.abs(c);
  }

  const avgGain = gainSum / period;
  const avgLoss = lossSum / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function getSignal(
  rsi: number | null,
  sma20: number | null,
  sma50: number | null,
  currentPrice: number
): { label: string; color: string } {
  let score = 0;

  if (rsi !== null) {
    if (rsi < 30) score += 1; // oversold = buy signal
    else if (rsi > 70) score -= 1; // overbought = sell signal
  }

  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) score += 1; // bullish crossover
    else if (sma20 < sma50) score -= 1; // bearish crossover
  }

  if (sma20 !== null) {
    if (currentPrice > sma20) score += 1;
    else score -= 1;
  }

  if (score >= 2) return { label: "Buy", color: "text-green-400" };
  if (score <= -2) return { label: "Sell", color: "text-red-400" };
  return { label: "Neutral", color: "text-yellow-400" };
}

/* ---------- component ---------- */
export default function CoinDetail({ id }: { id: string }) {
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activeDays, setActiveDays] = useState<number | "max">(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  // Fetch coin info
  useEffect(() => {
    setLoading(true);
    fetch(`/api/crypto?action=coin&id=${id}`)
      .then((r) => r.json())
      .then((d) => setCoin(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch chart data
  const fetchChart = useCallback(
    (days: number | "max") => {
      setChartLoading(true);
      fetch(`/api/crypto?action=chart&id=${id}&days=${days}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.prices) setChartData(d.prices);
        })
        .catch(console.error)
        .finally(() => setChartLoading(false));
    },
    [id]
  );

  useEffect(() => {
    fetchChart(activeDays);
  }, [activeDays, fetchChart]);

  // Render chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: container.clientWidth,
      height: 400,
      crosshair: {
        horzLine: { color: "#374151" },
        vertLine: { color: "#374151" },
      },
      rightPriceScale: {
        borderColor: "#1f2937",
      },
      timeScale: {
        borderColor: "#1f2937",
        timeVisible: true,
      },
    });

    const areaSeriesOptions: AreaSeriesPartialOptions = {
      lineColor: "#3b82f6",
      topColor: "rgba(59, 130, 246, 0.3)",
      bottomColor: "rgba(59, 130, 246, 0.01)",
      lineWidth: 2,
    };

    const series = chart.addSeries(AreaSeries, areaSeriesOptions);
    series.setData(
      chartData.map(([time, value]) => ({
        time: Math.floor(time / 1000) as Time,
        value,
      }))
    );
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [chartData]);

  // Technical analysis from chart data
  const prices = chartData.map(([, v]) => v);
  const currentPrice = coin?.market_data?.current_price?.usd ?? prices[prices.length - 1] ?? 0;
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const rsi = calculateRSI(prices, 14);
  const signal = getSignal(rsi, sma20, sma50, currentPrice);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading coin data...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400 text-lg">Coin not found</div>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const md = coin.market_data;
  const change24h = md.price_change_percentage_24h;
  const isPositive = change24h >= 0;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={coin.image?.large || coin.image?.small}
            alt={coin.name}
            className="w-14 h-14 rounded-full"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{coin.name}</h1>
              <span className="text-gray-500 text-lg uppercase font-medium">
                {coin.symbol}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-bold tabular-nums">
                ${fmt(md.current_price.usd, md.current_price.usd < 1 ? 6 : 2)}
              </span>
              <span
                className={`text-lg font-semibold tabular-nums ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {change24h?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Price Chart</h2>
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setActiveDays(r.days)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeDays === r.days
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            {chartLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/80 z-10 rounded-lg">
                <span className="text-gray-400">Loading chart...</span>
              </div>
            )}
            <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Market Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatItem label="Market Cap" value={fmtCompact(md.market_cap?.usd)} />
            <StatItem label="24h Volume" value={fmtCompact(md.total_volume?.usd)} />
            <StatItem
              label="Circulating Supply"
              value={`${fmt(md.circulating_supply, 0)} ${coin.symbol.toUpperCase()}`}
            />
            <StatItem
              label="Total Supply"
              value={md.total_supply ? `${fmt(md.total_supply, 0)}` : "N/A"}
            />
            <StatItem
              label="Max Supply"
              value={md.max_supply ? `${fmt(md.max_supply, 0)}` : "Unlimited"}
            />
            <StatItem label="All-Time High" value={`$${fmt(md.ath?.usd)}`} />
            <StatItem label="All-Time Low" value={`$${fmt(md.atl?.usd, md.atl?.usd < 1 ? 6 : 2)}`} />
            <StatItem
              label="ATH Date"
              value={
                md.ath_date?.usd
                  ? new Date(md.ath_date.usd).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"
              }
            />
          </div>
        </div>

        {/* Technical Signals */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Technical Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SMA */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                Moving Averages
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">SMA (20)</span>
                <span className="tabular-nums font-medium">
                  {sma20 !== null ? `$${fmt(sma20, sma20 < 1 ? 6 : 2)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">SMA (50)</span>
                <span className="tabular-nums font-medium">
                  {sma50 !== null ? `$${fmt(sma50, sma50 < 1 ? 6 : 2)}` : "N/A"}
                </span>
              </div>
              {sma20 !== null && sma50 !== null && (
                <div className="text-xs text-gray-500 pt-1">
                  {sma20 > sma50 ? (
                    <span className="text-green-400">SMA 20 above SMA 50 (Bullish)</span>
                  ) : (
                    <span className="text-red-400">SMA 20 below SMA 50 (Bearish)</span>
                  )}
                </div>
              )}
            </div>

            {/* RSI */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                RSI (14)
              </h3>
              <div className="text-3xl font-bold tabular-nums">
                {rsi !== null ? rsi.toFixed(1) : "N/A"}
              </div>
              {rsi !== null && (
                <>
                  {/* RSI gauge bar */}
                  <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, rsi))}%`,
                        backgroundColor:
                          rsi < 30 ? "#4ade80" : rsi > 70 ? "#f87171" : "#facc15",
                      }}
                    />
                    {/* Markers at 30 and 70 */}
                    <div className="absolute top-0 left-[30%] w-px h-full bg-gray-500" />
                    <div className="absolute top-0 left-[70%] w-px h-full bg-gray-500" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Oversold</span>
                    <span>Neutral</span>
                    <span>Overbought</span>
                  </div>
                </>
              )}
            </div>

            {/* Signal */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                Overall Signal
              </h3>
              <div className={`text-3xl font-bold ${signal.color}`}>
                {signal.label}
              </div>
              <p className="text-xs text-gray-500">
                Based on RSI (14) and SMA crossover (20/50)
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- sub-component ---------- */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
