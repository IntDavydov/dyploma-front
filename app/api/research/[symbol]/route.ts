import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  
  const basePrice = Math.random() * 500 + 50;
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: basePrice + Math.random() * 40 - 20
  }));

  const data = {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corporation`,
    price: history[29].price,
    change: history[29].price - history[28].price,
    changePercent: ((history[29].price - history[28].price) / history[28].price) * 100,
    history,
    headlines: [
      `${symbol} announces breakthrough in their latest product line.`,
      `Market analysts predict strong Q4 earnings for ${symbol}.`,
      `${symbol}'s CEO addresses supply chain concerns in recent interview.`,
      `Competitors struggle to keep pace with ${symbol}'s innovation.`,
      `New regulatory framework might impact ${symbol}'s operations in Europe.`
    ],
    news: [
      {
        title: `${symbol.toUpperCase()} announces breakthrough in their latest product line`,
        publisher: "Financial Times",
        link: "https://www.ft.com"
      },
      {
        title: `Market analysts predict strong Q4 earnings for ${symbol.toUpperCase()}`,
        publisher: "Reuters",
        link: "https://www.reuters.com"
      },
      {
        title: `${symbol.toUpperCase()}'s CEO addresses supply chain concerns in recent interview`,
        publisher: "Bloomberg",
        link: "https://www.bloomberg.com"
      },
      {
        title: `Competitors struggle to keep pace with ${symbol.toUpperCase()}'s innovation`,
        publisher: "CNBC",
        link: "https://www.cnbc.com"
      },
      {
        title: `New regulatory framework might impact ${symbol.toUpperCase()}'s operations in Europe`,
        publisher: "MarketWatch",
        link: "https://www.marketwatch.com"
      }
    ]
  };

  return NextResponse.json(data);
}
