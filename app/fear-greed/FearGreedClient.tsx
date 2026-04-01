"use client";

import { useState, useEffect } from "react";

type FearGreedEntry = {
  value: string;
  value_classification: string;
  timestamp: string;
};

function getClassification(value: number) {
  if (value <= 24) return { label: "Extreme Fear", color: "#ef4444" };
  if (value <= 49) return { label: "Fear", color: "#f97316" };
  if (value === 50) return { label: "Neutral", color: "#eab308" };
  if (value <= 74) return { label: "Greed", color: "#84cc16" };
  return { label: "Extreme Greed", color: "#22c55e" };
}

function getBarColor(value: number): string {
  if (value <= 24) return "#ef4444";
  if (value <= 49) return "#f97316";
  if (value <= 50) return "#eab308";
  if (value <= 74) return "#84cc16";
  return "#22c55e";
}

/* ─── SVG Semicircular Gauge ─── */
function FearGreedGauge({ value }: { value: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const { label, color } = getClassification(clampedValue);

  // Arc from -180deg to 0deg (left to right)
  const cx = 150;
  const cy = 140;
  const r = 110;

  // Needle angle: 0 = far left (-180deg), 100 = far right (0deg)
  const angle = -180 + (clampedValue / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleLen = 90;
  const nx = cx + needleLen * Math.cos(rad);
  const ny = cy + needleLen * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 170" className="w-full max-w-sm">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1f2937"
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* Labels */}
        <text x="25" y={cy + 24} fill="#6b7280" fontSize="10" textAnchor="start">
          0
        </text>
        <text x="275" y={cy + 24} fill="#6b7280" fontSize="10" textAnchor="end">
          100
        </text>

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill={color} />

        {/* Center value */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill="white"
          fontSize="40"
          fontWeight="bold"
        >
          {clampedValue}
        </text>
      </svg>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

export default function FearGreedClient() {
  const [data, setData] = useState<FearGreedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/crypto?action=fear");
        if (!res.ok) throw new Error("Failed to fetch Fear & Greed data");
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayValue = data.length > 0 ? parseInt(data[0].value, 10) : 50;

  // Reverse for chronological order (API gives newest first)
  const chronological = [...data].reverse();

  // Find max value for bar chart scaling
  const maxVal = 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Gauge */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-400">
          Today&apos;s Market Sentiment
        </h2>
        <FearGreedGauge value={todayValue} />
      </div>

      {/* Historical Bar Chart */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold">Last 30 Days</h2>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${Math.max(chronological.length * 22, 300)} 160`}
            className="w-full min-w-[600px]"
            preserveAspectRatio="none"
          >
            {chronological.map((entry, i) => {
              const val = parseInt(entry.value, 10);
              const barHeight = (val / maxVal) * 120;
              const x = i * 22 + 4;
              const y = 130 - barHeight;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={16}
                    height={barHeight}
                    rx={3}
                    fill={getBarColor(val)}
                    opacity={0.85}
                  />
                  <text
                    x={x + 8}
                    y={145}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="6"
                  >
                    {new Date(parseInt(entry.timestamp, 10) * 1000).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </text>
                  <text
                    x={x + 8}
                    y={y - 4}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="7"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* What Does This Mean? */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold">What Does This Mean?</h2>
        <div className="space-y-3">
          {[
            {
              range: "0 - 24",
              label: "Extreme Fear",
              color: "#ef4444",
              desc: "Investors are very worried. Could be a buying opportunity.",
            },
            {
              range: "25 - 49",
              label: "Fear",
              color: "#f97316",
              desc: "Market sentiment is negative.",
            },
            {
              range: "50",
              label: "Neutral",
              color: "#eab308",
              desc: "Market is balanced.",
            },
            {
              range: "51 - 74",
              label: "Greed",
              color: "#84cc16",
              desc: "Investors are getting greedy. Be cautious.",
            },
            {
              range: "75 - 100",
              label: "Extreme Greed",
              color: "#22c55e",
              desc: "Market may be due for a correction.",
            },
          ].map((item) => (
            <div
              key={item.range}
              className="flex items-center gap-4 rounded-lg border border-gray-800 bg-[#0b0f19] p-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
                style={{ backgroundColor: item.color }}
              >
                {item.range.split(" ")[0]}
              </div>
              <div>
                <p className="font-semibold" style={{ color: item.color }}>
                  {item.label}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({item.range})
                  </span>
                </p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Is It Calculated? */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold">How Is It Calculated?</h2>
        <p className="mb-4 text-sm text-gray-400">
          The index is based on multiple data sources, each contributing a
          weighted portion to the final score:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Volatility",
              pct: 25,
              desc: "Current volatility vs. 30/90-day averages",
            },
            {
              name: "Market Volume",
              pct: 25,
              desc: "Current volume vs. 30/90-day averages",
            },
            {
              name: "Social Media",
              pct: 15,
              desc: "Crypto mentions and engagement rates",
            },
            {
              name: "Surveys",
              pct: 15,
              desc: "Weekly crypto polling surveys",
            },
            {
              name: "Bitcoin Dominance",
              pct: 10,
              desc: "BTC market cap share changes",
            },
            {
              name: "Google Trends",
              pct: 10,
              desc: "Search queries for crypto terms",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-gray-800 bg-[#0b0f19] p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-blue-400">
                  {item.pct}%
                </span>
              </div>
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
