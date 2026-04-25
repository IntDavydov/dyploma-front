"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart, Activity } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Loading from "../components/Loading";

interface Holding {
  qty: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface HoldingsMap {
  [symbol: string]: Holding;
}

interface Transaction {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  price: string | number;
  timestamp: string;
}

interface PortfolioHoldingPayload {
  symbol?: string;
  qty?: number;
  quantity?: number;
  avgPrice?: number;
  averagePrice?: number;
  currentPrice?: number;
  price?: number;
  totalValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

interface PortfolioPayload {
  balance?: number;
  buyingPower?: number;
  totalAccountValue?: number;
  totalValue?: number;
  holdings?: PortfolioHoldingPayload[] | Record<string, PortfolioHoldingPayload>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function PortfolioPage() {
  const router = useRouter();
  const { user, updateBalance } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [holdings, setHoldings] = useState<HoldingsMap>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");
  const [loading, setLoading] = useState(true);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchPortfolio = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${apiUrl}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload: any = await res.json();
        if (!res.ok) throw new Error("Failed to load portfolio");

        const balance = Number(payload.balance ?? payload.buyingPower ?? user.balance);
        if (Number.isFinite(balance)) {
          updateBalance(balance);
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            parsedUser.balance = balance;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }

        const normalizedHoldings: HoldingsMap = {};
        const sourceHoldings = Array.isArray(payload.holdings)
          ? payload.holdings
          : payload.holdings
            ? Object.entries(payload.holdings).map(([symbol, value]) => ({ ...(value as any), symbol }))
            : [];

        for (const item of sourceHoldings) {
          const symbol = String(item.symbol || "").toUpperCase();
          if (!symbol) continue;

          const qty = Number(item.qty ?? item.quantity ?? 0);
          const avgPrice = Number(item.avgPrice ?? item.averagePrice ?? item.price ?? 0);
          const currentPrice = Number(item.currentPrice ?? item.price ?? avgPrice);
          const totalValue = Number(item.currentValue ?? item.totalValue ?? (currentPrice * qty));
          const costBasis = avgPrice * qty;
          const gainLoss = totalValue - costBasis;
          const gainLossPercent = Number(item.returnPercent ?? item.gainLossPercent ?? (costBasis > 0 ? (gainLoss / costBasis) * 100 : 0));

          normalizedHoldings[symbol] = {
            qty,
            avgPrice,
            currentPrice,
            totalValue,
            gainLoss,
            gainLossPercent,
          };
        }

        setHoldings(normalizedHoldings);

        try {
          const histRes = await fetch(`${apiUrl}/api/portfolio/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (histRes.ok) {
            const histData = await histRes.json();
            const txArray = Array.isArray(histData) ? histData : (histData.data || histData.history || []);
            setTransactions(txArray);
          }
        } catch (histErr) {
          console.error("Failed to load history", histErr);
        }
      } catch (err) {
        console.error("Failed to load portfolio", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
    
    // Live polling every 30 seconds to get real prices from the backend
    const intervalId = setInterval(() => {
      fetchPortfolio();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [apiUrl, router, updateBalance]); // removed user to prevent infinite loop on balance update

  const handleTopUp = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/portfolio/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: 50000 }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Top-up failed");
      }

      const nextBalance = Number(payload.balance ?? payload.buyingPower);
      if (Number.isFinite(nextBalance)) {
        updateBalance(nextBalance);
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          parsedUser.balance = nextBalance;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
      }
    } catch (err) {
      console.error("Top-up failed", err);
    }
  };

  if (loading || !user) {
    return <Loading />;
  }

  const holdingsList = Object.entries(holdings);
  const todaysPnl = Object.values(holdings).reduce((acc, h) => acc + h.gainLoss, 0);
  const totalHoldingsValue = Object.values(holdings).reduce((acc, h) => acc + h.totalValue, 0);
  const totalAccountValue = (user?.balance || 0) + totalHoldingsValue;
  const pnlPercent = (todaysPnl / (totalAccountValue - todaysPnl)) * 100 || 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] w-full mx-auto space-y-8 relative z-10"
    >
      {/* Top Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Account Value */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
             <PieChart className="w-32 h-32 text-accent drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
           </div>
           <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
             <Wallet className="w-4 h-4 text-accent drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" /> Account Value
           </h2>
           <div className="text-5xl font-mono font-bold text-foreground mb-3 tracking-tight drop-shadow-sm relative z-10">
             ${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </div>
           <div className={`flex items-center gap-1.5 text-sm font-bold relative z-10 ${todaysPnl >= 0 ? 'text-success drop-shadow-[0_0_5px_rgba(0,230,118,0.3)]' : 'text-danger drop-shadow-[0_0_5px_rgba(255,23,68,0.3)]'}`}>
             {todaysPnl >= 0 ? '+' : ''}${todaysPnl.toFixed(2)} ({todaysPnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
             <span className="text-muted-foreground font-normal ml-1 text-[10px] uppercase tracking-wider">All Time</span>
           </div>
        </div>

        {/* Buying Power */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <div className="relative z-10">
             <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Buying Power</h2>
             <div className="text-4xl font-mono font-bold text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.3)] tracking-tight">
               ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
           </div>
           <button 
             onClick={handleTopUp} 
             className="mt-6 bg-muted/50 hover:bg-accent/20 text-foreground hover:text-accent text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all duration-300 border border-border/50 hover:border-accent/50 shadow-sm hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer active:scale-95 relative z-10"
            >
              Add Cash ($50k)
            </button>
        </div>

        {/* Quick Action */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col justify-center items-center text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
           <Activity className="w-10 h-10 text-indigo-400 mb-4 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)] group-hover:scale-110 transition-transform duration-500 relative z-10" />
           <h3 className="text-base font-bold text-indigo-100 mb-2 relative z-10 tracking-tight">Discover Opportunities</h3>
           <p className="text-xs text-indigo-300/80 mb-5 relative z-10 font-medium">Use Nova AI to find your next trade.</p>
           <button 
             onClick={() => router.push('/research')} 
             className="bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/50 hover:border-indigo-400 text-xs font-bold uppercase tracking-widest py-2.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer active:scale-95 relative z-10"
           >
             Go to Screener
           </button>
        </div>

      </motion.div>

      {/* Data Table */}
      <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="flex border-b border-border/50 bg-background/30">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`px-6 py-5 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "holdings"
                ? "text-accent border-accent bg-accent/5"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
            }`}
          >
            Active Positions
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-5 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "history"
                ? "text-accent border-accent bg-accent/5"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
            }`}
          >
            Trade History
          </button>
        </div>

        {activeTab === "holdings" ? (
          holdingsList.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-muted-foreground text-sm mb-4">You have no active holdings.</p>
            <button 
              onClick={() => router.push('/research')} 
              className="text-accent hover:text-accent-foreground hover:bg-accent/10 px-6 py-2.5 rounded-xl border border-accent/30 hover:border-accent transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_10px_rgba(0,229,255,0.1)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/20 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-bold">Symbol</th>
                  <th className="px-6 py-4 font-bold text-right">Qty</th>
                  <th className="px-6 py-4 font-bold text-right">Avg Cost</th>
                  <th className="px-6 py-4 font-bold text-right">Current Price</th>
                  <th className="px-6 py-4 font-bold text-right">Total Value</th>
                  <th className="px-6 py-4 font-bold text-right">Total Return</th>
                  <th className="px-6 py-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {holdingsList.map(([symbol, holding]) => {
                  const isPositive = holding.gainLoss >= 0;
                  return (
                    <tr key={symbol} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border flex items-center justify-center text-sm font-bold text-foreground shadow-inner group-hover:border-accent/30 transition-colors">
                            {symbol[0]}
                          </div>
                          <span className="font-bold text-foreground tracking-tight">{symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-foreground">{holding.qty}</td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-muted-foreground opacity-80">${holding.avgPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-foreground drop-shadow-sm">${holding.currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-foreground drop-shadow-md">${holding.totalValue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex flex-col items-end ${isPositive ? 'text-success drop-shadow-[0_0_3px_rgba(0,230,118,0.3)]' : 'text-danger drop-shadow-[0_0_3px_rgba(255,23,68,0.3)]'}`}>
                          <span className="font-bold flex items-center gap-1 tracking-tight">
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? '+' : ''}${Math.abs(holding.gainLoss).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold opacity-80 mt-0.5 bg-background/50 px-1.5 py-0.5 rounded border border-border/50">
                            {isPositive ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => router.push(`/research/${symbol}`)}
                          className="text-[10px] font-bold uppercase tracking-widest bg-card border border-border/50 hover:bg-accent/10 hover:border-accent/50 hover:text-accent text-foreground py-2 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer active:scale-95"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-muted-foreground text-sm mb-4">You have no trade history.</p>
            <button 
              onClick={() => router.push('/research')} 
              className="text-accent hover:text-accent-foreground hover:bg-accent/10 px-6 py-2.5 rounded-xl border border-accent/30 hover:border-accent transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_10px_rgba(0,229,255,0.1)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/20 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Symbol</th>
                  <th className="px-6 py-4 font-bold text-center">Type</th>
                  <th className="px-6 py-4 font-bold text-right">Qty</th>
                  <th className="px-6 py-4 font-bold text-right">Price</th>
                  <th className="px-6 py-4 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {transactions.map((tx) => {
                  const isBuy = tx.type.toLowerCase() === 'buy';
                  const total = tx.quantity * Number(tx.price);
                  const dateObj = new Date(tx.timestamp);
                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-muted-foreground text-xs">
                        {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground tracking-tight">{tx.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isBuy ? 'bg-success/20 text-success border border-success/30 shadow-[0_0_10px_rgba(0,230,118,0.1)]' : 'bg-danger/20 text-danger border border-danger/30 shadow-[0_0_10px_rgba(255,23,68,0.1)]'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-foreground">{tx.quantity}</td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-muted-foreground opacity-80">${Number(tx.price).toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-right drop-shadow-md">
                        <span className={isBuy ? "text-danger" : "text-success"}>
                          {isBuy ? '-' : '+'}${total.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
