"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Mover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export default function MarketMovers() {
  const router = useRouter();
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const sparklineCache = useRef<Map<string, {val: number}[]>>(new Map());

  useEffect(() => {
    async function fetchMovers() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/market/movers`);
        const data = await res.json();
        setMovers(data);
      } catch (err) {
        console.error("Error fetching movers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovers();
  }, []);

  const getSparkline = (symbol: string, isBullish: boolean) => {
    if (!sparklineCache.current.has(symbol)) {
      const data = Array.from({ length: 20 }, (_, i) => ({
        val: isBullish ? i + Math.random() * 5 : 20 - i + Math.random() * 5
      }));
      sparklineCache.current.set(symbol, data);
    }
    return sparklineCache.current.get(symbol)!;
  };

  if (loading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-card border border-border" />)}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-6">
      {movers.map((stock) => {
        const isBullish = stock.changePercent >= 0;
        const chartData = getSparkline(stock.symbol, isBullish);

        return (
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={stock.symbol} 
            onClick={() => router.push(`/research/${stock.symbol}`)}
            className="group bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 mobile-ui:p-5 cursor-pointer hover:border-accent/50 hover:bg-card/60 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(0,229,255,0.15)] flex flex-col relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-2 mobile-ui:mb-3 relative z-10">
              <div className="flex items-center gap-2 mobile-ui:gap-3">
                <div className="w-7 h-7 mobile-ui:w-8 mobile-ui:h-8 rounded-lg bg-muted/80 border border-border flex items-center justify-center text-[10px] mobile-ui:text-[11px] font-bold text-foreground shadow-inner group-hover:border-accent/30 transition-colors">
                  {stock.symbol[0]}
                </div>
                <div>
                  <h3 className="text-sm mobile-ui:text-base font-bold text-foreground tracking-tight leading-none mb-1">{stock.symbol}</h3>
                  <p className="text-[9px] mobile-ui:text-[10px] text-muted-foreground truncate max-w-[80px] mobile-ui:max-w-[100px] font-medium leading-none">{stock.name}</p>
                </div>
              </div>
              <div className={`p-1 mobile-ui:p-1.5 rounded-lg ${isBullish ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                <TrendingUp className="w-3.5 h-3.5 mobile-ui:w-4 mobile-ui:h-4" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1.5 mobile-ui:gap-2 mt-0.5 mobile-ui:mt-1 relative z-10">
              <span className="text-xl mobile-ui:text-2xl font-bold text-foreground tracking-tight drop-shadow-sm">${stock.price.toFixed(2)}</span>
              <span className={`text-[10px] mobile-ui:text-xs font-bold flex items-center ${isBullish ? 'text-success drop-shadow-[0_0_5px_rgba(0,230,118,0.5)]' : 'text-danger drop-shadow-[0_0_5px_rgba(255,23,68,0.5)]'}`}>
                {isBullish ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>

            <div className="h-12 w-full mt-4 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke={isBullish ? 'var(--color-success)' : 'var(--color-danger)'} 
                    strokeWidth={2.5} 
                    dot={false} 
                    style={{ filter: `drop-shadow(0 0 4px ${isBullish ? 'var(--color-success)' : 'var(--color-danger)'})` }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}