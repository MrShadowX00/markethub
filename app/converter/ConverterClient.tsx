"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ---------- constants ---------- */
const CRYPTO_LIST = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon" },
];

const FIAT_FOR_CRYPTO = [
  "USD", "EUR", "GBP", "JPY", "TRY", "RUB", "UZS", "KRW", "CNY", "INR",
];

const FIAT_LIST = [
  "USD", "EUR", "GBP", "JPY", "TRY", "RUB", "UZS", "KRW", "CNY", "INR",
  "AUD", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON",
  "BGN", "HRK", "BRL", "MXN", "ARS", "CLP", "COP", "PEN", "ZAR", "EGP",
  "AED", "SAR", "THB", "SGD", "MYR", "IDR", "PHP", "VND", "PKR", "BDT",
];

const POPULAR_PAIRS = [
  { from: "USD", to: "UZS" },
  { from: "EUR", to: "USD" },
  { from: "GBP", to: "USD" },
  { from: "USD", to: "JPY" },
  { from: "USD", to: "RUB" },
  { from: "USD", to: "TRY" },
];

interface CryptoMarketData {
  id: string;
  symbol: string;
  current_price: number;
}

/* ---------- component ---------- */
export default function ConverterClient() {
  // --- crypto converter state ---
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [cryptoFrom, setCryptoFrom] = useState("bitcoin");
  const [cryptoTo, setCryptoTo] = useState("USD");
  const [cryptoAmount, setCryptoAmount] = useState("1");
  const [cryptoUpdated, setCryptoUpdated] = useState<Date | null>(null);
  const [copiedCrypto, setCopiedCrypto] = useState(false);

  // --- fiat converter state ---
  const [fiatFrom, setFiatFrom] = useState("USD");
  const [fiatTo, setFiatTo] = useState("UZS");
  const [fiatAmount, setFiatAmount] = useState("100");
  const [fiatRate, setFiatRate] = useState<number | null>(null);
  const [fiatLoading, setFiatLoading] = useState(false);
  const [fiatUpdated, setFiatUpdated] = useState<Date | null>(null);
  const [copiedFiat, setCopiedFiat] = useState(false);

  // --- FAQ state ---
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch crypto market data
  useEffect(() => {
    fetch("/api/crypto?action=markets")
      .then((r) => r.json())
      .then((data: CryptoMarketData[]) => {
        const map: Record<string, number> = {};
        for (const coin of data) {
          map[coin.id] = coin.current_price;
        }
        setCryptoPrices(map);
        setCryptoUpdated(new Date());
      })
      .catch(console.error);
  }, []);

  // Fetch fiat rate
  const fetchFiatRate = useCallback(() => {
    if (fiatFrom === fiatTo) {
      setFiatRate(1);
      setFiatUpdated(new Date());
      return;
    }
    setFiatLoading(true);
    fetch(`/api/forex?action=convert&from=${fiatFrom}&to=${fiatTo}&amount=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rate) {
          setFiatRate(d.rate);
        } else if (d.result) {
          setFiatRate(d.result);
        }
        setFiatUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setFiatLoading(false));
  }, [fiatFrom, fiatTo]);

  useEffect(() => {
    fetchFiatRate();
  }, [fetchFiatRate]);

  // --- crypto calculations ---
  const cryptoPrice = cryptoPrices[cryptoFrom] ?? 0;
  const cryptoNumericAmount = parseFloat(cryptoAmount) || 0;
  const cryptoResult = cryptoNumericAmount * cryptoPrice;
  const selectedCrypto = CRYPTO_LIST.find((c) => c.id === cryptoFrom);

  // --- fiat calculations ---
  const fiatNumericAmount = parseFloat(fiatAmount) || 0;
  const fiatResult = fiatRate !== null ? fiatNumericAmount * fiatRate : 0;

  // --- swap handlers ---
  const swapCrypto = () => {
    // For crypto swap we just reset amount to result in fiat
    // Since crypto<->fiat are different types, we invert: set amount to 1/price
    if (cryptoPrice > 0) {
      setCryptoAmount(String((1 / cryptoPrice).toFixed(8)));
    }
  };

  const swapFiat = () => {
    setFiatFrom(fiatTo);
    setFiatTo(fiatFrom);
  };

  const selectPopularPair = (from: string, to: string) => {
    setFiatFrom(from);
    setFiatTo(to);
    setFiatAmount("100");
  };

  // --- copy handlers ---
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatNum = (n: number, maxDecimals = 2) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });

  const formatTimestamp = (d: Date | null) =>
    d
      ? d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "";

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors mb-4 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Crypto &amp; Currency Converter</h1>
          <p className="text-gray-400 mt-2">
            Convert between cryptocurrencies and fiat currencies with real-time exchange rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* ========== Panel 1: Crypto Converter ========== */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Crypto Converter
            </h2>

            {/* From */}
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">From</label>
            <div className="flex gap-2 mt-1 mb-4">
              <input
                type="number"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-3 text-lg tabular-nums focus:outline-none focus:border-blue-500 transition-colors"
                min="0"
                step="any"
              />
              <select
                value={cryptoFrom}
                onChange={(e) => setCryptoFrom(e.target.value)}
                className="bg-[#0b0f19] border border-gray-700 rounded-lg px-3 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors min-w-[120px]"
              >
                {CRYPTO_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap */}
            <div className="flex justify-center my-2">
              <button
                onClick={swapCrypto}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Swap"
              >
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To */}
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">To</label>
            <div className="flex gap-2 mt-1 mb-4">
              <input
                type="text"
                readOnly
                value={cryptoPrice > 0 ? formatNum(cryptoResult, cryptoResult < 1 ? 8 : 2) : "..."}
                className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-3 text-lg tabular-nums text-gray-300"
              />
              <select
                value={cryptoTo}
                onChange={(e) => setCryptoTo(e.target.value)}
                className="bg-[#0b0f19] border border-gray-700 rounded-lg px-3 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors min-w-[120px]"
              >
                {FIAT_FOR_CRYPTO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate + copy */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                1 {selectedCrypto?.symbol} = ${formatNum(cryptoPrice)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    copyToClipboard(
                      cryptoPrice > 0 ? formatNum(cryptoResult, cryptoResult < 1 ? 8 : 2) : "0",
                      setCopiedCrypto
                    )
                  }
                  className="text-blue-500 hover:text-blue-400 text-xs font-medium"
                >
                  {copiedCrypto ? "Copied!" : "Copy"}
                </button>
                {cryptoUpdated && (
                  <span className="text-gray-600 text-xs">
                    Updated {formatTimestamp(cryptoUpdated)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========== Panel 2: Fiat Currency Converter ========== */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Fiat Currency Converter
            </h2>

            {/* From */}
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">From</label>
            <div className="flex gap-2 mt-1 mb-4">
              <input
                type="number"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-3 text-lg tabular-nums focus:outline-none focus:border-blue-500 transition-colors"
                min="0"
                step="any"
              />
              <select
                value={fiatFrom}
                onChange={(e) => setFiatFrom(e.target.value)}
                className="bg-[#0b0f19] border border-gray-700 rounded-lg px-3 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors min-w-[120px]"
              >
                {FIAT_LIST.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap */}
            <div className="flex justify-center my-2">
              <button
                onClick={swapFiat}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Swap"
              >
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To */}
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">To</label>
            <div className="flex gap-2 mt-1 mb-4">
              <input
                type="text"
                readOnly
                value={fiatRate !== null && !fiatLoading ? formatNum(fiatResult, 2) : "..."}
                className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-3 text-lg tabular-nums text-gray-300"
              />
              <select
                value={fiatTo}
                onChange={(e) => setFiatTo(e.target.value)}
                className="bg-[#0b0f19] border border-gray-700 rounded-lg px-3 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors min-w-[120px]"
              >
                {FIAT_LIST.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate + inverse + copy */}
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="text-gray-400 space-y-0.5">
                {fiatRate !== null && (
                  <>
                    <div>
                      1 {fiatFrom} = {formatNum(fiatRate, fiatRate < 1 ? 6 : 2)} {fiatTo}
                    </div>
                    <div className="text-xs text-gray-600">
                      1 {fiatTo} = {formatNum(1 / fiatRate, 1 / fiatRate < 1 ? 6 : 2)} {fiatFrom}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    copyToClipboard(
                      fiatRate !== null ? formatNum(fiatResult, 2) : "0",
                      setCopiedFiat
                    )
                  }
                  className="text-blue-500 hover:text-blue-400 text-xs font-medium"
                >
                  {copiedFiat ? "Copied!" : "Copy"}
                </button>
                {fiatUpdated && (
                  <span className="text-gray-600 text-xs">
                    Updated {formatTimestamp(fiatUpdated)}
                  </span>
                )}
              </div>
            </div>

            {/* Popular pairs */}
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Popular Pairs
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {POPULAR_PAIRS.map((p) => (
                  <button
                    key={`${p.from}${p.to}`}
                    onClick={() => selectPopularPair(p.from, p.to)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      fiatFrom === p.from && fiatTo === p.to
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                        : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border border-transparent"
                    }`}
                  >
                    {p.from}/{p.to}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========== FAQ ========== */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-200 hover:bg-gray-800/50 transition-colors"
                >
                  {item.q}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- FAQ data ---------- */
const FAQ_ITEMS = [
  {
    q: "How is the crypto exchange rate calculated?",
    a: "Crypto exchange rates are fetched in real-time from aggregated market data through our API. The rate reflects the current spot price of the cryptocurrency in USD, which is then used to calculate conversions to your selected fiat currency.",
  },
  {
    q: "How often are rates updated?",
    a: "Cryptocurrency prices are updated every time you load the converter page, reflecting the latest market data. Fiat currency exchange rates are sourced from financial data providers and are typically updated multiple times per day.",
  },
  {
    q: "Can I convert between two cryptocurrencies?",
    a: "Currently, the converter supports crypto-to-fiat conversions. To convert between two cryptocurrencies (e.g., BTC to ETH), you can convert the first crypto to USD and then USD to the second crypto using the displayed rates. We plan to add direct crypto-to-crypto conversion in a future update.",
  },
];
