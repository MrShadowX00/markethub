import type { Metadata } from "next";
import StocksClient from "./StocksClient";

export const metadata: Metadata = {
  title: "Stock Market Tracker — Live Prices & Analysis",
  description:
    "Track major stock market indices and popular stocks. S&P 500, NASDAQ, Dow Jones, and top tech stocks with real-time data. Free stock tracker.",
  alternates: { canonical: "https://market.toollo.org/stocks" },
};

const faqItems = [
  {
    question: "How do I start investing in stocks?",
    answer:
      "To start investing in stocks, open a brokerage account with a reputable broker (such as Fidelity, Charles Schwab, or Interactive Brokers), fund your account, and begin researching companies you want to invest in. Start with diversified index funds like S&P 500 ETFs if you are new to investing. Always invest money you can afford to lose and consider your long-term financial goals.",
  },
  {
    question: "What is a stock market index?",
    answer:
      "A stock market index is a statistical measure that tracks the performance of a group of stocks representing a particular market or sector. For example, the S&P 500 tracks 500 of the largest US companies, the NASDAQ Composite focuses on technology stocks, and the Dow Jones Industrial Average follows 30 major US companies. Indices help investors gauge overall market performance.",
  },
  {
    question: "What time does the stock market open and close?",
    answer:
      "The major US stock exchanges (NYSE and NASDAQ) are open Monday through Friday, from 9:30 AM to 4:00 PM Eastern Time (ET). Pre-market trading begins at 4:00 AM ET and after-hours trading runs until 8:00 PM ET. Other major exchanges have different hours: the London Stock Exchange operates 8:00 AM to 4:30 PM GMT, and the Tokyo Stock Exchange runs 9:00 AM to 3:00 PM JST.",
  },
];

export default function StocksPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Stock Market Tracker
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Explore major stock market indices, popular stocks, and educational
            resources to help you understand the financial markets.
          </p>
        </header>

        <StocksClient />

        {/* FAQ Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-[#111827] border border-gray-800 rounded-xl"
              >
                <summary className="cursor-pointer px-6 py-4 text-white font-medium flex items-center justify-between">
                  {item.question}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    &#9662;
                  </span>
                </summary>
                <p className="px-6 pb-4 text-gray-400 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
