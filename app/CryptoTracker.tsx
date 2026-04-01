"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { initAnalytics, trackPageView } from "./firebase";

/* ---------- types ---------- */
interface GlobalData {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    active_cryptocurrencies: number;
  };
}

interface Coin {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: { price: number[] };
}

type SortKey =
  | "market_cap_rank"
  | "current_price"
  | "price_change_percentage_1h_in_currency"
  | "price_change_percentage_24h_in_currency"
  | "price_change_percentage_7d_in_currency"
  | "market_cap"
  | "total_volume";

/* ---------- helpers ---------- */

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

function formatPrice(p: number): string {
  if (p >= 1) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function formatPct(v: number | null): { text: string; color: string } {
  if (v == null) return { text: "—", color: "text-gray-500" };
  const sign = v >= 0 ? "+" : "";
  return {
    text: `${sign}${v.toFixed(2)}%`,
    color: v >= 0 ? "text-emerald-400" : "text-red-400",
  };
}

/* ---------- Sparkline SVG ---------- */
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;

  const width = 120;
  const height = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isUp = data[data.length - 1] >= data[0];

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#34d399" : "#f87171"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Loading Skeleton ---------- */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* global stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
      {/* table skeleton */}
      <div className="bg-[#111827] rounded-xl overflow-hidden">
        <div className="h-10 bg-white/5" />
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-white/5 bg-white/[0.02]" />
        ))}
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function CryptoTracker() {
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [gRes, mRes] = await Promise.all([
        fetch("/api/crypto?action=global"),
        fetch("/api/crypto?action=markets"),
      ]);
      if (gRes.ok) {
        const g = await gRes.json();
        setGlobal(g);
      }
      if (mRes.ok) {
        const m = await mRes.json();
        if (Array.isArray(m)) setCoins(m);
      }
    } catch {
      /* silently retry next interval */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* sort + filter */
  const filtered = useMemo(() => {
    let list = [...coins];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = (a[sortKey] as number) ?? 0;
      const bv = (b[sortKey] as number) ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [coins, search, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "market_cap_rank");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return <span className="ml-1 text-[10px]">{sortAsc ? "▲" : "▼"}</span>;
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <Skeleton />
      </div>
    );
  }

  const gd = global?.data;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* ---------- Global Stats ---------- */}
      {gd && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Market Cap", value: formatCompact(gd.total_market_cap?.usd ?? 0) },
            { label: "24h Volume", value: formatCompact(gd.total_volume?.usd ?? 0) },
            { label: "BTC Dominance", value: `${(gd.market_cap_percentage?.btc ?? 0).toFixed(1)}%` },
            { label: "Total Coins", value: (gd.active_cryptocurrencies ?? 0).toLocaleString() },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111827] rounded-xl px-5 py-4 border border-white/5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-semibold text-white mt-1 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Search ---------- */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search coins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs bg-[#111827] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <span className="text-xs text-gray-500">
          {filtered.length} coin{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ---------- Coin Table ---------- */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full min-w-[900px] text-sm bg-[#111827]">
          <thead>
            <tr className="border-b border-white/5">
              {(
                [
                  { key: "market_cap_rank" as SortKey, label: "#", align: "text-center", width: "w-12" },
                  { key: null, label: "Coin", align: "text-left", width: "min-w-[200px]" },
                  { key: "current_price" as SortKey, label: "Price", align: "text-right", width: "" },
                  { key: "price_change_percentage_1h_in_currency" as SortKey, label: "1h %", align: "text-right", width: "" },
                  { key: "price_change_percentage_24h_in_currency" as SortKey, label: "24h %", align: "text-right", width: "" },
                  { key: "price_change_percentage_7d_in_currency" as SortKey, label: "7d %", align: "text-right", width: "" },
                  { key: "market_cap" as SortKey, label: "Market Cap", align: "text-right", width: "" },
                  { key: "total_volume" as SortKey, label: "Volume 24h", align: "text-right", width: "" },
                  { key: null, label: "Last 7 Days", align: "text-right", width: "w-[140px]" },
                ] as const
              ).map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${col.align} ${col.width} ${col.key ? "cursor-pointer select-none hover:text-gray-300" : ""}`}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                >
                  {col.label}
                  {col.key && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((coin) => {
              const h1 = formatPct(coin.price_change_percentage_1h_in_currency);
              const h24 = formatPct(coin.price_change_percentage_24h_in_currency);
              const d7 = formatPct(coin.price_change_percentage_7d_in_currency);

              return (
                <tr
                  key={coin.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-gray-400 tabular-nums">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coin.image}
                        alt={coin.name}
                        width={28}
                        height={28}
                        className="rounded-full"
                        loading="lazy"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{coin.name}</span>
                        <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white tabular-nums">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${h1.color}`}>{h1.text}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${h24.color}`}>{h24.text}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d7.color}`}>{d7.text}</td>
                  <td className="px-4 py-3 text-right text-white tabular-nums">
                    {formatCompact(coin.market_cap)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 tabular-nums">
                    {formatCompact(coin.total_volume)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Sparkline data={coin.sparkline_in_7d?.price ?? []} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  No coins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
