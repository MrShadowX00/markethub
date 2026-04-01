import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "./analytics-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://market.toollo.org"),
  title: {
    default: "Market Toollo — Free Crypto, Forex & Stock Analysis",
    template: "%s | Market Toollo",
  },
  description:
    "Free real-time crypto, forex, and stock market analysis. Live prices, technical analysis charts, currency converter, fear & greed index, portfolio tracker and more.",
  keywords: [
    "crypto",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "forex",
    "foreign exchange",
    "stocks",
    "stock market",
    "technical analysis",
    "trading",
    "market analysis",
    "price chart",
    "candlestick",
    "RSI",
    "MACD",
    "moving average",
    "currency converter",
    "fear and greed index",
    "portfolio tracker",
    "real-time prices",
    "market cap",
    "DeFi",
    "altcoins",
    "USD",
    "UZS",
    "EUR",
    "GBP",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://market.toollo.org",
    siteName: "Market Toollo",
    title: "Market Toollo — Free Crypto, Forex & Stock Analysis",
    description:
      "Free real-time crypto, forex, and stock market analysis with live prices, charts, and tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Market Toollo — Free Crypto, Forex & Stock Analysis",
    description:
      "Free real-time crypto, forex, and stock market analysis with live prices, charts, and tools.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://market.toollo.org" },
};

const navItems = [
  { href: "/crypto", label: "Crypto" },
  { href: "/forex", label: "Forex" },
  { href: "/stocks", label: "Stocks" },
  { href: "/technical-analysis", label: "Technical Analysis" },
  { href: "/converter", label: "Converter" },
  { href: "/fear-greed", label: "Fear & Greed" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7668896830420502"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-gray-200">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#1f2937] bg-[#0b0f19]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2 text-white">
              <svg
                className="h-7 w-7 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13l4-4 4 4 4-8 4 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 17h18"
                />
              </svg>
              <span className="text-lg font-bold tracking-tight">
                Market Toollo
              </span>
            </a>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1f2937] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#1f2937] bg-[#0b0f19]">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Markets
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/crypto" className="hover:text-white">
                      Cryptocurrency
                    </a>
                  </li>
                  <li>
                    <a href="/forex" className="hover:text-white">
                      Forex
                    </a>
                  </li>
                  <li>
                    <a href="/stocks" className="hover:text-white">
                      Stocks
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">Tools</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/technical-analysis" className="hover:text-white">
                      Technical Analysis
                    </a>
                  </li>
                  <li>
                    <a href="/converter" className="hover:text-white">
                      Currency Converter
                    </a>
                  </li>
                  <li>
                    <a href="/fear-greed" className="hover:text-white">
                      Fear & Greed Index
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Portfolio
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/portfolio" className="hover:text-white">
                      Portfolio Tracker
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Toollo
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a
                      href="https://toollo.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      toollo.org
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-[#1f2937] pt-6 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Market Toollo. Part of{" "}
              <a
                href="https://toollo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                toollo.org
              </a>
            </div>
          </div>
        </footer>

        {/* Firebase Analytics */}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
