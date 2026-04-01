import { NextRequest } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "global") {
      const res = await fetch(`${COINGECKO_BASE}/global`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
      const json = await res.json();
      return Response.json(json);
    }

    if (action === "markets") {
      const page = request.nextUrl.searchParams.get("page") || "1";
      const res = await fetch(
        `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
      const json = await res.json();
      return Response.json(json);
    }

    if (action === "chart") {
      const id = request.nextUrl.searchParams.get("id") || "bitcoin";
      const days = request.nextUrl.searchParams.get("days") || "30";
      const res = await fetch(
        `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
      const json = await res.json();
      return Response.json(json);
    }

    if (action === "fear") {
      const res = await fetch(
        "https://api.alternative.me/fng/?limit=30&format=json",
        { next: { revalidate: 300 } }
      );
      if (!res.ok) throw new Error(`Fear&Greed API responded ${res.status}`);
      const json = await res.json();
      return Response.json(json);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
