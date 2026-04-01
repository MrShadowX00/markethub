import type { Metadata } from "next";
import ConverterClient from "./ConverterClient";

export const metadata: Metadata = {
  title: "Crypto & Currency Converter — BTC to USD, ETH to EUR",
  description:
    "Convert between cryptocurrencies and fiat currencies. Real-time exchange rates for Bitcoin, Ethereum, and 150+ currencies. Free converter.",
  alternates: { canonical: "https://market.toollo.org/converter" },
};

export default function ConverterPage() {
  return <ConverterClient />;
}
