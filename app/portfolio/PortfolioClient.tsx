"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface Holding {
  id: string; // unique holding id
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  amount: number;
  buyPrice: number;
}

type SortKey =
  | "name"
  | "amount"
  | "buyPrice"
  | "currentPrice"
  | "value"
  | "pnl"
  | "pnlPercent"
  | "change24h"
  | "allocation";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "markethub_portfolio";

function loadHoldings(): Holding[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch {
    /* quota exceeded or private mode */
  }
}

function fmt(n: number, decimals = 2) {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(decimals);
}

function fmtUsd(n: number) {
  return "$" + fmt(n);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ------------------------------------------------------------------ */
/*  SVG Pie Chart helpers                                              */
/* ------------------------------------------------------------------ */

const PIE_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#eab308",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#d946ef",
  "#84cc16",
  "#22d3ee",
  "#fb923c",
];

function polarToCartesian(r: number, angle: number) {
  return {
    x: r * Math.cos(angle - Math.PI / 2),
    y: r * Math.sin(angle - Math.PI / 2),
  };
}

function getArcPath(
  startAngle: number,
  endAngle: number,
  outerR: number,
  innerR: number
): string {
  const oStart = polarToCartesian(outerR, startAngle);
  const oEnd = polarToCartesian(outerR, endAngle);
  const iStart = polarToCartesian(innerR, startAngle);
  const iEnd = polarToCartesian(innerR, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
    "Z",
  ].join(" ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortfolioClient() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [priceMap, setPriceMap] = useState<
    Record<string, { price: number; change24h: number }>
  >({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // form
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<CoinMarket | null>(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // sort
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortAsc, setSortAsc] = useState(false);

  /* ---- Load holdings from localStorage ---- */
  useEffect(() => {
    setHoldings(loadHoldings());
  }, []);

  /* ---- Fetch coin list ---- */
  const fetchCoins = useCallback(async () => {
    try {
      const res = await fetch("/api/crypto?action=markets");
      if (!res.ok) return;
      const data: CoinMarket[] = await res.json();
      setCoins(data);
      const map: Record<string, { price: number; change24h: number }> = {};
      data.forEach((c) => {
        map[c.id] = {
          price: c.current_price,
          change24h: c.price_change_percentage_24h,
        };
      });
      setPriceMap(map);
      setLastUpdated(new Date());
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const iv = setInterval(fetchCoins, 60_000);
    return () => clearInterval(iv);
  }, [fetchCoins]);

  /* ---- Seconds-ago ticker ---- */
  useEffect(() => {
    const iv = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdated]);

  /* ---- Close dropdown on outside click ---- */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---- Persist holdings ---- */
  useEffect(() => {
    if (holdings.length || localStorage.getItem(STORAGE_KEY)) {
      saveHoldings(holdings);
    }
  }, [holdings]);

  /* ---- Add holding ---- */
  function addHolding() {
    if (!selectedCoin || !amount || parseFloat(amount) <= 0) return;
    const newHolding: Holding = {
      id: uid(),
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      image: selectedCoin.image,
      amount: parseFloat(amount),
      buyPrice: buyPrice ? parseFloat(buyPrice) : selectedCoin.current_price,
    };
    setHoldings((prev) => [...prev, newHolding]);
    setSelectedCoin(null);
    setSearch("");
    setAmount("");
    setBuyPrice("");
    setShowForm(false);
  }

  function removeHolding(id: string) {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  function clearAll() {
    if (confirm("Are you sure you want to clear all holdings?")) {
      setHoldings([]);
    }
  }

  /* ---- Export CSV ---- */
  function exportCSV() {
    const header = "Coin,Symbol,Amount,Buy Price,Current Price,Value,P&L,P&L%\n";
    const rows = holdings
      .map((h) => {
        const price = priceMap[h.coinId]?.price ?? 0;
        const value = h.amount * price;
        const cost = h.amount * h.buyPrice;
        const pnl = value - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        return `${h.name},${h.symbol.toUpperCase()},${h.amount},${h.buyPrice},${price},${value.toFixed(2)},${pnl.toFixed(2)},${pnlPct.toFixed(2)}%`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Computed portfolio data ---- */
  const portfolioData = useMemo(() => {
    return holdings.map((h) => {
      const currentPrice = priceMap[h.coinId]?.price ?? 0;
      const change24h = priceMap[h.coinId]?.change24h ?? 0;
      const value = h.amount * currentPrice;
      const cost = h.amount * h.buyPrice;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, currentPrice, change24h, value, cost, pnl, pnlPercent };
    });
  }, [holdings, priceMap]);

  const totalValue = portfolioData.reduce((s, h) => s + h.value, 0);
  const totalCost = portfolioData.reduce((s, h) => s + h.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const bestPerformer = portfolioData.length
    ? portfolioData.reduce((best, h) =>
        h.pnlPercent > best.pnlPercent ? h : best
      )
    : null;
  const worstPerformer = portfolioData.length
    ? portfolioData.reduce((worst, h) =>
        h.pnlPercent < worst.pnlPercent ? h : worst
      )
    : null;

  /* ---- Sorting ---- */
  const sorted = useMemo(() => {
    const arr = [...portfolioData];
    arr.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case "name":
          va = a.name.toLowerCase();
          vb = b.name.toLowerCase();
          break;
        case "amount":
          va = a.amount;
          vb = b.amount;
          break;
        case "buyPrice":
          va = a.buyPrice;
          vb = b.buyPrice;
          break;
        case "currentPrice":
          va = a.currentPrice;
          vb = b.currentPrice;
          break;
        case "value":
          va = a.value;
          vb = b.value;
          break;
        case "pnl":
          va = a.pnl;
          vb = b.pnl;
          break;
        case "pnlPercent":
          va = a.pnlPercent;
          vb = b.pnlPercent;
          break;
        case "change24h":
          va = a.change24h;
          vb = b.change24h;
          break;
        case "allocation":
          va = a.value;
          vb = b.value;
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return arr;
  }, [portfolioData, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  /* ---- Filtered coins for dropdown ---- */
  const filteredCoins = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  /* ---- Pie chart slices ---- */
  const pieSlices = useMemo(() => {
    if (totalValue === 0) return [];
    let angle = 0;
    return portfolioData
      .filter((h) => h.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((h, i) => {
        const fraction = h.value / totalValue;
        const startAngle = angle;
        const sliceAngle = fraction * Math.PI * 2;
        angle += sliceAngle;
        return {
          ...h,
          startAngle,
          endAngle: startAngle + sliceAngle,
          color: PIE_COLORS[i % PIE_COLORS.length],
          percent: fraction * 100,
        };
      });
  }, [portfolioData, totalValue]);

  /* ---- Render ---- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Portfolio Tracker
          </h1>
          <p className="text-gray-400 mt-1">
            Track your crypto holdings locally — no account needed
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {lastUpdated && <span>Last updated: {secondsAgo}s ago</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Value" value={fmtUsd(totalValue)} />
        <SummaryCard label="Total Cost" value={fmtUsd(totalCost)} />
        <SummaryCard
          label="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}${fmtUsd(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
          color={totalPnl >= 0 ? "text-green-400" : "text-red-400"}
        />
        <SummaryCard
          label="Best Performer"
          value={bestPerformer ? bestPerformer.symbol.toUpperCase() : "—"}
          sub={
            bestPerformer
              ? `${bestPerformer.pnlPercent >= 0 ? "+" : ""}${bestPerformer.pnlPercent.toFixed(2)}%`
              : ""
          }
          color="text-green-400"
        />
        <SummaryCard
          label="Worst Performer"
          value={worstPerformer ? worstPerformer.symbol.toUpperCase() : "—"}
          sub={
            worstPerformer
              ? `${worstPerformer.pnlPercent >= 0 ? "+" : ""}${worstPerformer.pnlPercent.toFixed(2)}%`
              : ""
          }
          color="text-red-400"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-medium transition-colors"
        >
          + Add Holding
        </button>
        {holdings.length > 0 && (
          <>
            <button
              onClick={exportCSV}
              className="rounded-lg border border-white/10 bg-[#111827] hover:bg-white/5 px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={clearAll}
              className="rounded-lg border border-red-500/30 bg-[#111827] hover:bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors"
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Add Holding Form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-semibold">Add Holding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Coin selector */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs text-gray-400 mb-1">Coin</label>
              <input
                type="text"
                placeholder="Search coin..."
                value={selectedCoin ? selectedCoin.name : search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCoin(null);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
              {dropdownOpen && !selectedCoin && search.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#111827] shadow-xl">
                  {filteredCoins.slice(0, 50).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCoin(c);
                        setSearch("");
                        setDropdownOpen(false);
                        if (!buyPrice) setBuyPrice(c.current_price.toString());
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-5 w-5 rounded-full"
                      />
                      <span className="text-white">{c.name}</span>
                      <span className="text-gray-500">
                        {c.symbol.toUpperCase()}
                      </span>
                    </button>
                  ))}
                  {filteredCoins.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      No coins found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
            </div>

            {/* Buy Price */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Buy Price (USD, optional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Current price if empty"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                onClick={addHolding}
                disabled={!selectedCoin || !amount || parseFloat(amount) <= 0}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content: table + chart */}
      {holdings.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-16 text-center">
          <p className="text-gray-400 text-lg">Your portfolio is empty</p>
          <p className="text-gray-500 text-sm mt-2">
            Click &quot;Add Holding&quot; to start tracking your crypto
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings Table */}
          <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <Th label="Coin" sortKey="name" current={sortKey} onSort={handleSort} icon={sortIcon} />
                  <Th label="Amount" sortKey="amount" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="Buy Price" sortKey="buyPrice" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="Price" sortKey="currentPrice" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="Value" sortKey="value" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="P&L" sortKey="pnl" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="P&L%" sortKey="pnlPercent" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="24h" sortKey="change24h" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <Th label="Alloc" sortKey="allocation" current={sortKey} onSort={handleSort} icon={sortIcon} right />
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((h) => {
                  const alloc =
                    totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                  return (
                    <tr
                      key={h.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={h.image}
                            alt={h.name}
                            className="h-6 w-6 rounded-full"
                          />
                          <span className="font-medium text-white">
                            {h.name}
                          </span>
                          <span className="text-gray-500">
                            {h.symbol.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {h.amount}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        ${fmt(h.buyPrice)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        ${fmt(h.currentPrice)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                        {fmtUsd(h.value)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right whitespace-nowrap font-medium ${h.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {h.pnl >= 0 ? "+" : ""}
                        {fmtUsd(h.pnl)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right whitespace-nowrap ${h.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {h.pnlPercent >= 0 ? "+" : ""}
                        {h.pnlPercent.toFixed(2)}%
                      </td>
                      <td
                        className={`px-3 py-3 text-right whitespace-nowrap ${h.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {h.change24h >= 0 ? "+" : ""}
                        {h.change24h.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {alloc.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => removeHolding(h.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Allocation Pie Chart */}
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <h3 className="text-lg font-semibold mb-4">Allocation</h3>
            {pieSlices.length > 0 ? (
              <div className="flex flex-col items-center gap-6">
                <svg viewBox="-110 -110 220 220" className="w-full max-w-[240px]">
                  {pieSlices.map((s, i) => {
                    // If only one holding, draw full circle
                    if (pieSlices.length === 1) {
                      return (
                        <circle
                          key={i}
                          cx={0}
                          cy={0}
                          r={95}
                          fill="none"
                          stroke={s.color}
                          strokeWidth={30}
                        />
                      );
                    }
                    // Small gap between slices
                    const gap = 0.01;
                    const sa = s.startAngle + gap;
                    const ea = s.endAngle - gap;
                    if (ea <= sa) return null;
                    return (
                      <path
                        key={i}
                        d={getArcPath(sa, ea, 100, 60)}
                        fill={s.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    );
                  })}
                </svg>
                {/* Legend */}
                <div className="w-full space-y-2">
                  {pieSlices.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-gray-300">
                          {s.symbol.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {s.percent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No allocation data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? "text-white"}`}>{value}</p>
      {sub && (
        <p className={`text-sm mt-0.5 ${color ?? "text-gray-400"}`}>{sub}</p>
      )}
    </div>
  );
}

function Th({
  label,
  sortKey,
  current,
  onSort,
  icon,
  right,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  icon: (k: SortKey) => string;
  right?: boolean;
}) {
  return (
    <th
      className={`px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap hover:text-white transition-colors ${right ? "text-right" : "text-left"}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {icon(sortKey)}
    </th>
  );
}
