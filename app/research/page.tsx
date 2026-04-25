"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, Filter } from "lucide-react";
import { motion, Variants } from "framer-motion";
import MarketMovers from "../components/MarketMovers";
import Loading from "../components/Loading";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string | number;
  sector: string;
  volume: string | number;
  type: string;
  rating: string;
}

const PAGE_SIZE = 20;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function parseNumericValue(input: string | number | undefined | null): number | null {
  if (typeof input === "number") return input;
  if (!input) return null;
  const match = String(input).match(/^([\d.]+)([KMBT]?)$/i);
  if (!match) return null;
  const base = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  const UNIT_MULTIPLIER: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000, T: 1_000_000_000_000 };
  return unit ? base * UNIT_MULTIPLIER[unit] : base;
}

function toCompactValue(input: string | number): string {
  const value = parseNumericValue(input);
  if (value === null) return String(input);
  const abs = Math.abs(value);
  const withSuffix = (scaled: number, suffix: "K" | "M" | "B" | "T") =>
    `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}${suffix}`;
  if (abs >= 1_000_000_000_000) return withSuffix(value / 1_000_000_000_000, "T");
  if (abs >= 1_000_000_000) return withSuffix(value / 1_000_000_000, "B");
  if (abs >= 1_000_000) return withSuffix(value / 1_000_000, "M");
  if (abs >= 1_000) return withSuffix(value / 1_000, "K");
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function getActionLabel(ratingRaw: string) {
  const parts = ratingRaw.split("-");
  const label = parts.length > 1 ? parts[1].trim() : ratingRaw;
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("strong buy")) return { label: "Strong Buy", className: "bg-success/20 text-success border-success/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]" };
  if (lowerLabel.includes("buy")) return { label: "Buy", className: "bg-accent/20 text-accent border-accent/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]" };
  if (lowerLabel.includes("strong sell")) return { label: "Strong Sell", className: "bg-danger/30 text-danger border-danger/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]" };
  if (lowerLabel.includes("sell")) return { label: "Sell", className: "bg-danger/20 text-danger border-danger/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]" };
  return { label: "Hold", className: "bg-muted/30 text-muted-foreground border-border/50" };
}

export default function ResearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleTableScroll = () => {
    if (!tableContainerRef.current || loadingMore || !hasNextPage) return;
    
    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    async function fetchResearch() {
      try {
        const res = await fetch(`${apiUrl}/api/research?page=${currentPage}&limit=${PAGE_SIZE}`);
        const payload: any = await res.json();
        const normalized: Asset[] = (payload.data || []).map((item: any) => ({
          symbol: String(item.symbol ?? ""),
          name: String(item.name ?? ""),
          price: Number(item.price ?? 0),
          change: Number(item.change ?? 0),
          changePercent: Number(item.changePercent ?? 0),
          volume: item.volume,
          marketCap: item.marketCap,
          type: String(item.type ?? ""),
          rating: String(item.rating ?? "Hold"),
        }));
        setAssets(prev => currentPage === 1 ? normalized : [...prev, ...normalized]);
        setHasNextPage(payload.page < payload.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
    fetchResearch();
  }, [user, router, currentPage, apiUrl]);

  if (!user || loading) return <Loading />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] w-full mx-auto space-y-8 relative z-10 p-6">
      <motion.div variants={itemVariants}><MarketMovers /></motion.div>
      <motion.div variants={itemVariants} className="flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] h-[60vh]">
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-background/30">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Stock Screener</h2>
          <button className="flex items-center gap-2 bg-card border border-border/50 hover:bg-muted text-foreground text-xs px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
        
        {/* Header sits outside the scrolling container */}
        <div className="border-b border-border/50">
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-[#0b131e]">
              <tr>
                <th className="px-6 py-4 font-bold w-[20%]">Ticker</th>
                <th className="px-6 py-4 font-bold text-right w-[15%]">Price</th>
                <th className="px-6 py-4 font-bold text-right w-[20%]">Chg %</th>
                <th className="px-6 py-4 font-bold text-right w-[15%]">Volume</th>
                <th className="px-6 py-4 font-bold text-right w-[15%]">Mkt Cap</th>
                <th className="px-6 py-4 font-bold text-center w-[15%]">Action</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div ref={tableContainerRef} onScroll={handleTableScroll} className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <tbody className="divide-y divide-border/30">
              {assets.map((asset, index) => {
                const isBullish = asset.changePercent >= 0;
                return (
                  <tr key={`${asset.symbol}-${index}`} onClick={() => router.push(`/research/${asset.symbol}`)} className="hover:bg-muted/30 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 w-[20%]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground tracking-tight">{asset.symbol}</span>
                        <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block bg-background/50 px-2 py-0.5 rounded-md border border-border/50">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-right text-foreground w-[15%]">${asset.price.toFixed(2)}</td>
                    <td className={`px-6 py-4 font-bold text-right w-[20%] ${isBullish ? 'text-success' : 'text-danger'}`}>
                      {isBullish ? <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 inline mr-1" />}
                      {Math.abs(asset.changePercent).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 font-mono text-right text-muted-foreground opacity-80 w-[15%]">{toCompactValue(asset.volume)}</td>
                    <td className="px-6 py-4 font-mono text-right text-muted-foreground opacity-80 w-[15%]">{toCompactValue(asset.marketCap)}</td>
                    <td className="px-6 py-4 text-center w-[15%]">
                      <div className="flex justify-center">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border inline-flex items-center justify-center min-w-[75px] ${getActionLabel(asset.rating).className}`}>
                          {getActionLabel(asset.rating).label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}