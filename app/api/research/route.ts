import { NextResponse } from "next/server";

export async function GET() {
  const data = [
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 199.88, change: -2.18, changePercent: -1.08, marketCap: "4.86T", sector: "Electronic Tech", volume: "107.94M" },
    { symbol: "GOOG", name: "Alphabet Inc.", price: 330.47, change: -4.93, changePercent: -1.47, marketCap: "4.01T", sector: "Tech Services", volume: "14.62M" },
    { symbol: "AAPL", name: "Apple Inc.", price: 266.17, change: -6.88, changePercent: -2.52, marketCap: "3.91T", sector: "Electronic Tech", volume: "50.21M" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 424.16, change: 6.09, changePercent: 1.46, marketCap: "3.15T", sector: "Tech Services", volume: "32.05M" },
    { symbol: "AMZN", name: "Amazon.com", price: 249.91, change: 1.63, changePercent: 0.66, marketCap: "2.69T", sector: "Retail Trade", volume: "42.92M" },
    { symbol: "AVGO", name: "Broadcom", price: 402.17, change: 2.54, changePercent: 0.64, marketCap: "1.90T", sector: "Electronic Tech", volume: "16.27M" },
    { symbol: "META", name: "Meta Platforms", price: 668.84, change: -2.07, changePercent: -0.31, marketCap: "1.69T", sector: "Tech Services", volume: "8.66M" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 386.42, change: -6.08, changePercent: -1.55, marketCap: "1.45T", sector: "Consumer Durables", volume: "50.53M" },
    { symbol: "WMT", name: "Walmart Inc.", price: 129.60, change: 1.68, changePercent: 1.31, marketCap: "1.03T", sector: "Retail Trade", volume: "17.31M" },
    { symbol: "TCGL", name: "TechCreate Group", price: 172.84, change: 86.48, changePercent: 100.14, marketCap: "50.2B", sector: "Tech Services", volume: "5.4M" },
  ];
  return NextResponse.json(data);
}
