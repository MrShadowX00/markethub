import type { Metadata } from "next";
import CoinDetail from "./CoinDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
  return {
    title: `${name} Price, Chart & Analysis`,
    description: `Live ${name} price, interactive chart, technical analysis, and market data. Track ${name} with real-time updates.`,
  };
}

export default async function CoinPage({ params }: Props) {
  const { id } = await params;
  return <CoinDetail id={id} />;
}
