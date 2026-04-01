"use client";

import { useEffect, useState, useCallback } from "react";
import { initAnalytics, trackPageView } from "../firebase";

/* ---------- currency metadata ---------- */

const CURRENCIES = [
  "USD","EUR","GBP","JPY","CHF","CAD","AUD","NZD","CNY","INR",
  "RUB","TRY","UZS","KRW","BRL","MXN","ZAR","SEK","NOK","SGD",
  "HKD","PLN","CZK","HUF","THB","IDR","MYR","PHP","AED","SAR",
] as const;

type CurrencyCode = (typeof CURRENCIES)[number];

const FLAG_MAP: Record<CurrencyCode, string> = {
  USD: "\u{1F1FA}\u{1F1F8}", EUR: "\u{1F1EA}\u{1F1FA}", GBP: "\u{1F1EC}\u{1F1E7}",
  JPY: "\u{1F1EF}\u{1F1F5}", CHF: "\u{1F1E8}\u{1F1ED}", CAD: "\u{1F1E8}\u{1F1E6}",
  AUD: "\u{1F1E6}\u{1F1FA}", NZD: "\u{1F1F3}\u{1F1FF}", CNY: "\u{1F1E8}\u{1F1F3}",
  INR: "\u{1F1EE}\u{1F1F3}", RUB: "\u{1F1F7}\u{1F1FA}", TRY: "\u{1F1F9}\u{1F1F7}",
  UZS: "\u{1F1FA}\u{1F1FF}", KRW: "\u{1F1F0}\u{1F1F7}", BRL: "\u{1F1E7}\u{1F1F7}",
  MXN: "\u{1F1F2}\u{1F1FD}", ZAR: "\u{1F1FF}\u{1F1E6}", SEK: "\u{1F1F8}\u{1F1EA}",
  NOK: "\u{1F1F3}\u{1F1F4}", SGD: "\u{1F1F8}\u{1F1EC}", HKD: "\u{1F1ED}\u{1F1F0}",
  PLN: "\u{1F1F5}\u{1F1F1}", CZK: "\u{1F1E8}\u{1F1FF}", HUF: "\u{1F1ED}\u{1F1FA}",
  THB: "\u{1F1F9}\u{1F1ED}", IDR: "\u{1F1EE}\u{1F1E9}", MYR: "\u{1F1F2}\u{1F1FE}",
  PHP: "\u{1F1F5}\u{1F1ED}", AED: "\u{1F1E6}\u{1F1EA}", SAR: "\u{1F1F8}\u{1F1E6}",
};

const NAME_MAP: Record<CurrencyCode, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  CHF: "Swiss Franc", CAD: "Canadian Dollar", AUD: "Australian Dollar",
  NZD: "New Zealand Dollar", CNY: "Chinese Yuan", INR: "Indian Rupee",
  RUB: "Russian Ruble", TRY: "Turkish Lira", UZS: "Uzbekistani Som",
  KRW: "South Korean Won", BRL: "Brazilian Real", MXN: "Mexican Peso",
  ZAR: "South African Rand", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", PLN: "Polish Zloty",
  CZK: "Czech Koruna", HUF: "Hungarian Forint", THB: "Thai Baht",
  IDR: "Indonesian Rupiah", MYR: "Malaysian Ringgit", PHP: "Philippine Peso",
  AED: "UAE Dirham", SAR: "Saudi Riyal",
};

const POPULAR_PAIRS: [CurrencyCode, CurrencyCode][] = [
  ["EUR", "USD"], ["GBP", "USD"], ["USD", "JPY"],
  ["USD", "UZS"], ["USD", "RUB"], ["USD", "TRY"],
];

/* ---------- helpers ---------- */

function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toFixed(4);
  return rate.toFixed(6);
}

/* ---------- SVG Line Chart ---------- */

function LineChart({ data }: { data: { date: string; rate: number }[] }) {
  if (data.length < 2) return <p className="text-gray-500 text-sm">Not enough data</p>;

  const W = 700;
  const H = 280;
  const PAD_X = 60;
  const PAD_Y = 30;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  const rates = data.map((d) => d.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * chartW,
    y: PAD_Y + chartH - ((d.rate - min) / range) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const isUp = rates[rates.length - 1] >= rates[0];
  const color = isUp ? "#10b981" : "#ef4444";

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = PAD_Y + chartH - ((val - min) / range) * chartH;
    return { val, y };
  });

  // X-axis labels
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => ({
    label: data[i].date.slice(5),
    x: points[i].x,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[700px]"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* grid lines */}
      {yTicks.map((t) => (
        <g key={t.val}>
          <line
            x1={PAD_X} y1={t.y} x2={W - PAD_X} y2={t.y}
            stroke="#1f2937" strokeWidth="1"
          />
          <text x={PAD_X - 8} y={t.y + 4} textAnchor="end" fill="#6b7280" fontSize="11">
            {formatRate(t.val)}
          </text>
        </g>
      ))}
      {/* x labels */}
      {xLabels.map((l) => (
        <text key={l.label} x={l.x} y={H - 5} textAnchor="middle" fill="#6b7280" fontSize="11">
          {l.label}
        </text>
      ))}
      {/* area fill */}
      <path
        d={`${pathD} L${points[points.length - 1].x},${PAD_Y + chartH} L${points[0].x},${PAD_Y + chartH} Z`}
        fill={color}
        fillOpacity="0.08"
      />
      {/* line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Loading Skeleton ---------- */

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */

interface LatestResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface HistoryResponse {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export default function ForexClient() {
  const [base, setBase] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<CurrencyCode | null>(null);
  const [historyData, setHistoryData] = useState<{ date: string; rate: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchRates = useCallback(async (b: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forex?action=latest&base=${b}`);
      if (res.ok) {
        const json: LatestResponse = await res.json();
        setRates(json.rates || {});
      }
    } catch {
      /* retry on next interval */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates(base);
    const id = setInterval(() => fetchRates(base), 300_000);
    return () => clearInterval(id);
  }, [base, fetchRates]);

  const fetchHistory = useCallback(async (b: string, target: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/forex?action=history&base=${b}&target=${target}&days=30`
      );
      if (res.ok) {
        const json: HistoryResponse = await res.json();
        const entries = Object.entries(json.rates || {})
          .map(([date, r]) => ({ date, rate: r[target] }))
          .filter((e) => e.rate != null)
          .sort((a, b) => a.date.localeCompare(b.date));
        setHistoryData(entries);
      }
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  function handleCardClick(code: CurrencyCode) {
    setSelectedTarget(code);
    fetchHistory(base, code);
  }

  function handleBaseChange(newBase: CurrencyCode) {
    setBase(newBase);
    setSelectedTarget(null);
    setHistoryData([]);
  }

  if (loading && Object.keys(rates).length === 0) {
    return <Skeleton />;
  }

  const availableCurrencies = CURRENCIES.filter((c) => c !== base);

  return (
    <div className="space-y-10">
      {/* Base Currency Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400 font-medium">Base Currency:</label>
        <select
          value={base}
          onChange={(e) => handleBaseChange(e.target.value as CurrencyCode)}
          className="bg-[#111827] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {FLAG_MAP[c]} {c} — {NAME_MAP[c]}
            </option>
          ))}
        </select>
        {loading && (
          <span className="text-xs text-gray-500 animate-pulse">Updating...</span>
        )}
      </div>

      {/* Popular Pairs Quick View */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Popular Pairs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {POPULAR_PAIRS.map(([from, to]) => {
            // Calculate the pair rate relative to current base
            const fromRate = from === base ? 1 : rates[from];
            const toRate = to === base ? 1 : rates[to];
            const pairRate =
              fromRate != null && toRate != null && fromRate !== 0
                ? toRate / fromRate
                : null;

            return (
              <button
                key={`${from}${to}`}
                onClick={() => {
                  if (from !== base) handleBaseChange(from);
                  setSelectedTarget(to);
                  fetchHistory(from, to);
                }}
                className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-left hover:border-blue-500/40 transition-colors"
              >
                <p className="text-xs text-gray-500 font-medium">
                  {from}/{to}
                </p>
                <p className="text-white font-semibold tabular-nums mt-1">
                  {pairRate != null ? formatRate(pairRate) : "—"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Currency Rate Cards Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          All Currencies vs {FLAG_MAP[base]} {base}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableCurrencies.map((code) => {
            const rate = rates[code];
            const isSelected = selectedTarget === code;

            return (
              <button
                key={code}
                onClick={() => handleCardClick(code)}
                className={`bg-[#111827] border rounded-xl px-4 py-4 text-left transition-colors ${
                  isSelected
                    ? "border-blue-500 ring-1 ring-blue-500/30"
                    : "border-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{FLAG_MAP[code]}</span>
                  <span className="font-semibold text-white">{code}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1 truncate">{NAME_MAP[code]}</p>
                <p className="text-lg font-semibold text-white tabular-nums">
                  {rate != null ? formatRate(rate) : "—"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Historical Chart */}
      {selectedTarget && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            {FLAG_MAP[base]} {base} / {FLAG_MAP[selectedTarget]} {selectedTarget}{" "}
            — 30 Day Chart
          </h2>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
            {historyLoading ? (
              <div className="h-[280px] flex items-center justify-center">
                <span className="text-gray-500 animate-pulse">Loading chart...</span>
              </div>
            ) : historyData.length > 0 ? (
              <LineChart data={historyData} />
            ) : (
              <p className="text-gray-500 text-sm">
                No historical data available for this pair.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
