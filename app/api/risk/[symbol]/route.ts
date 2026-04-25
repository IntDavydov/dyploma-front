import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  
  // Randomly return Bullish or Bearish to simulate AI sentiment
  const isBullish = Math.random() > 0.5;

  return NextResponse.json({
    level: isBullish ? "Low" : "High",
    sentiment: isBullish ? "Bullish" : "Bearish",
    summary: isBullish 
      ? `AI analysis of recent headlines suggests strong positive momentum for ${symbol.toUpperCase()} due to strategic expansions.`
      : `AI detects potential volatility for ${symbol.toUpperCase()} resulting from upcoming regulatory scrutiny.`
  });
}
