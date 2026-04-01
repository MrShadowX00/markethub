"use client";

import { useState, useEffect } from "react";
import { initAnalytics, trackPageView } from "../firebase";

/* ---------- data ---------- */

interface IndexInfo {
  name: string;
  symbol: string;
  description: string;
  range: string;
  region: string;
}

const INDICES: IndexInfo[] = [
  {
    name: "S&P 500",
    symbol: "SPX",
    description: "Tracks 500 of the largest US publicly traded companies by market capitalization.",
    range: "4,800 — 6,100",
    region: "US",
  },
  {
    name: "NASDAQ Composite",
    symbol: "IXIC",
    description: "Technology-heavy index tracking over 3,000 stocks listed on the NASDAQ exchange.",
    range: "15,000 — 20,000",
    region: "US",
  },
  {
    name: "Dow Jones Industrial Average",
    symbol: "DJI",
    description: "Price-weighted index of 30 prominent US companies, one of the oldest market indicators.",
    range: "37,000 — 44,000",
    region: "US",
  },
  {
    name: "FTSE 100",
    symbol: "FTSE",
    description: "Tracks the 100 largest companies listed on the London Stock Exchange by market cap.",
    range: "7,400 — 8,400",
    region: "UK",
  },
  {
    name: "Nikkei 225",
    symbol: "N225",
    description: "Japan's premier stock index tracking 225 top-rated companies on the Tokyo Stock Exchange.",
    range: "32,000 — 42,000",
    region: "Japan",
  },
  {
    name: "DAX",
    symbol: "DAX",
    description: "Germany's blue-chip index comprising 40 major companies on the Frankfurt Stock Exchange.",
    range: "17,000 — 22,000",
    region: "Germany",
  },
];

interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  weekRange52: string;
}

const STOCKS: StockInfo[] = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", marketCap: "$3.4T", weekRange52: "$164 — $260" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", marketCap: "$3.1T", weekRange52: "$385 — $470" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", marketCap: "$2.1T", weekRange52: "$140 — $205" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Technology", marketCap: "$2.0T", weekRange52: "$155 — $235" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", marketCap: "$3.3T", weekRange52: "$75 — $155" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer", marketCap: "$800B", weekRange52: "$140 — $490" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", marketCap: "$1.5T", weekRange52: "$440 — $640" },
  { ticker: "BRK.B", name: "Berkshire Hathaway", sector: "Finance", marketCap: "$1.0T", weekRange52: "$400 — $500" },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance", marketCap: "$650B", weekRange52: "$185 — $260" },
  { ticker: "V", name: "Visa Inc.", sector: "Finance", marketCap: "$580B", weekRange52: "$255 — $340" },
];

type Sector = "All" | "Technology" | "Finance" | "Healthcare" | "Energy" | "Consumer";

const SECTORS: Sector[] = ["All", "Technology", "Finance", "Healthcare", "Energy", "Consumer"];

const SECTOR_STOCKS: Record<Exclude<Sector, "All">, { ticker: string; name: string; cap: string }[]> = {
  Technology: [
    { ticker: "AAPL", name: "Apple", cap: "Mega" },
    { ticker: "MSFT", name: "Microsoft", cap: "Mega" },
    { ticker: "GOOGL", name: "Alphabet", cap: "Mega" },
    { ticker: "NVDA", name: "NVIDIA", cap: "Mega" },
    { ticker: "META", name: "Meta", cap: "Mega" },
    { ticker: "AVGO", name: "Broadcom", cap: "Large" },
    { ticker: "CRM", name: "Salesforce", cap: "Large" },
    { ticker: "ADBE", name: "Adobe", cap: "Large" },
  ],
  Finance: [
    { ticker: "BRK.B", name: "Berkshire Hathaway", cap: "Mega" },
    { ticker: "JPM", name: "JPMorgan Chase", cap: "Mega" },
    { ticker: "V", name: "Visa", cap: "Mega" },
    { ticker: "MA", name: "Mastercard", cap: "Large" },
    { ticker: "BAC", name: "Bank of America", cap: "Large" },
    { ticker: "GS", name: "Goldman Sachs", cap: "Large" },
  ],
  Healthcare: [
    { ticker: "UNH", name: "UnitedHealth", cap: "Mega" },
    { ticker: "JNJ", name: "Johnson & Johnson", cap: "Large" },
    { ticker: "LLY", name: "Eli Lilly", cap: "Mega" },
    { ticker: "PFE", name: "Pfizer", cap: "Large" },
    { ticker: "ABBV", name: "AbbVie", cap: "Large" },
    { ticker: "MRK", name: "Merck", cap: "Large" },
  ],
  Energy: [
    { ticker: "XOM", name: "ExxonMobil", cap: "Mega" },
    { ticker: "CVX", name: "Chevron", cap: "Large" },
    { ticker: "COP", name: "ConocoPhillips", cap: "Large" },
    { ticker: "SLB", name: "Schlumberger", cap: "Large" },
    { ticker: "EOG", name: "EOG Resources", cap: "Mid" },
  ],
  Consumer: [
    { ticker: "AMZN", name: "Amazon", cap: "Mega" },
    { ticker: "TSLA", name: "Tesla", cap: "Mega" },
    { ticker: "WMT", name: "Walmart", cap: "Mega" },
    { ticker: "PG", name: "Procter & Gamble", cap: "Large" },
    { ticker: "KO", name: "Coca-Cola", cap: "Large" },
    { ticker: "NKE", name: "Nike", cap: "Large" },
  ],
};

const TERMS: { term: string; definition: string }[] = [
  {
    term: "P/E Ratio (Price-to-Earnings)",
    definition:
      "Measures a company's stock price relative to its earnings per share. A high P/E may indicate growth expectations; a low P/E may suggest undervaluation or slow growth.",
  },
  {
    term: "Market Capitalization",
    definition:
      "The total value of a company's outstanding shares, calculated by multiplying the stock price by the number of shares. Categories: Mega Cap ($200B+), Large Cap ($10B-$200B), Mid Cap ($2B-$10B), Small Cap (under $2B).",
  },
  {
    term: "EPS (Earnings Per Share)",
    definition:
      "A company's net profit divided by its outstanding shares. Higher EPS generally indicates greater profitability and is used to calculate the P/E ratio.",
  },
  {
    term: "Dividend Yield",
    definition:
      "The annual dividend payment divided by the stock price, expressed as a percentage. A 3% dividend yield means you earn $3 annually for every $100 invested.",
  },
  {
    term: "Volume",
    definition:
      "The number of shares traded during a given period. High volume often confirms price trends, while low volume may indicate uncertainty.",
  },
  {
    term: "52-Week Range",
    definition:
      "The lowest and highest prices at which a stock has traded over the past 52 weeks. Helps gauge current price relative to recent history.",
  },
];

const EXCHANGES: { name: string; location: string; hours: string; notable: string }[] = [
  { name: "NYSE", location: "New York, USA", hours: "9:30 AM — 4:00 PM ET", notable: "Largest exchange by market cap" },
  { name: "NASDAQ", location: "New York, USA", hours: "9:30 AM — 4:00 PM ET", notable: "Tech-focused, fully electronic" },
  { name: "LSE", location: "London, UK", hours: "8:00 AM — 4:30 PM GMT", notable: "Europe's largest exchange" },
  { name: "TSE", location: "Tokyo, Japan", hours: "9:00 AM — 3:00 PM JST", notable: "Asia's largest exchange" },
  { name: "SSE", location: "Shanghai, China", hours: "9:30 AM — 3:00 PM CST", notable: "China's primary exchange" },
  { name: "HKEX", location: "Hong Kong", hours: "9:30 AM — 4:00 PM HKT", notable: "Gateway to Chinese markets" },
];

const CAP_COLORS: Record<string, string> = {
  Mega: "text-purple-400 bg-purple-400/10",
  Large: "text-blue-400 bg-blue-400/10",
  Mid: "text-emerald-400 bg-emerald-400/10",
  Small: "text-yellow-400 bg-yellow-400/10",
};

/* ---------- Component ---------- */

export default function StocksClient() {
  const [selectedSector, setSelectedSector] = useState<Sector>("All");

  const filteredScreener =
    selectedSector === "All"
      ? Object.entries(SECTOR_STOCKS).flatMap(([sector, stocks]) =>
          stocks.map((s) => ({ ...s, sector }))
        )
      : (SECTOR_STOCKS[selectedSector] || []).map((s) => ({
          ...s,
          sector: selectedSector,
        }));

  return (
    <div className="space-y-12">
      {/* Major Indices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Major Indices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDICES.map((idx) => (
            <div
              key={idx.symbol}
              className="bg-[#111827] border border-gray-800 rounded-xl px-5 py-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{idx.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {idx.region}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {idx.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">Approximate Range</span>
                <span className="text-sm font-medium text-white tabular-nums">
                  {idx.range}
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">
                Real-time data coming soon
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Stocks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          Popular Stocks Quick Reference
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[700px] text-sm bg-[#111827]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Ticker", "Company", "Sector", "Market Cap", "52-Week Range"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 text-left"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {STOCKS.map((s) => (
                <tr
                  key={s.ticker}
                  className="border-t border-gray-800/50 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-blue-400">
                    {s.ticker}
                  </td>
                  <td className="px-4 py-3 text-white">{s.name}</td>
                  <td className="px-4 py-3 text-gray-400">{s.sector}</td>
                  <td className="px-4 py-3 text-white tabular-nums">
                    {s.marketCap}
                  </td>
                  <td className="px-4 py-3 text-gray-300 tabular-nums">
                    {s.weekRange52}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stock Screener Lite */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          Stock Screener Lite
        </h2>
        <p className="text-gray-400 text-sm">
          Filter stocks by sector and market cap category.
        </p>

        {/* Sector tabs */}
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSector === s
                  ? "bg-blue-600 text-white"
                  : "bg-[#111827] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Screener results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredScreener.map((s) => (
            <div
              key={`${s.sector}-${s.ticker}`}
              className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-white">{s.ticker}</span>
                <span className="text-gray-500 text-sm ml-2">{s.name}</span>
                {selectedSector === "All" && (
                  <span className="text-gray-600 text-xs ml-2">
                    {s.sector}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  CAP_COLORS[s.cap] || "text-gray-400 bg-gray-800"
                }`}
              >
                {s.cap} Cap
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stock Market Education */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">
          Stock Market Education
        </h2>

        {/* How to Read Stock Charts */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl px-6 py-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">
            How to Read Stock Charts
          </h3>
          <div className="text-gray-400 leading-relaxed space-y-3 text-sm">
            <p>
              Stock charts display price movements over time and are essential
              tools for investors. Here are the key elements:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-gray-300">Candlestick Charts:</strong>{" "}
                Each candle shows the open, high, low, and close prices for a
                period. Green (or white) candles indicate the price closed higher
                than it opened; red (or black) candles indicate it closed lower.
              </li>
              <li>
                <strong className="text-gray-300">Volume Bars:</strong> Bars at
                the bottom of the chart show trading volume. High volume confirms
                the strength of a price move.
              </li>
              <li>
                <strong className="text-gray-300">Moving Averages:</strong>{" "}
                Lines showing average prices over periods (e.g., 50-day, 200-day).
                When the shorter-term average crosses above the longer-term, it
                is often considered bullish.
              </li>
              <li>
                <strong className="text-gray-300">Support & Resistance:</strong>{" "}
                Price levels where a stock tends to stop falling (support) or
                rising (resistance). These levels help identify entry and exit
                points.
              </li>
            </ul>
          </div>
        </div>

        {/* Key Terms */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl px-6 py-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Key Stock Market Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TERMS.map((t) => (
              <div key={t.term} className="space-y-1">
                <p className="text-sm font-semibold text-blue-400">{t.term}</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Major Exchanges */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl px-6 py-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Major Stock Exchanges
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Exchange", "Location", "Trading Hours", "Notable"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 text-left"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {EXCHANGES.map((ex) => (
                  <tr
                    key={ex.name}
                    className="border-t border-gray-800/50"
                  >
                    <td className="px-3 py-2 font-semibold text-white">
                      {ex.name}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{ex.location}</td>
                    <td className="px-3 py-2 text-gray-300 tabular-nums">
                      {ex.hours}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{ex.notable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#111827] border border-gray-800 rounded-xl px-6 py-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Real-Time Stock Data Resources
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          For real-time stock quotes, advanced charts, and detailed financial
          analysis, we recommend these trusted platforms:
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "Yahoo Finance", url: "https://finance.yahoo.com" },
            { name: "Google Finance", url: "https://www.google.com/finance" },
            { name: "TradingView", url: "https://www.tradingview.com" },
          ].map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-600/20 transition-colors"
            >
              {link.name}
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
