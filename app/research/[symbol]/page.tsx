"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Filter,
  Star,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import MarketMovers from "../../components/MarketMovers";
import Loading from "../../components/Loading";

interface HistoryData {
  date: string;
  price: number;
}

interface ResearchData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: HistoryData[];
  headlines: { title: string; link: string }[];
  profile: {
    sector: string;
    industry: string;
    employees: number;
    description: string;
  };
  valuation: {
    forwardPE: number;
    priceToBook: number;
    pegRatio: number;
  };
  profitability: {
    profitMargins: number;
    returnOnEquity: number;
  };
  financials: {
    totalRevenue: number;
  };
}

interface RiskData {
  level: "Low" | "Medium" | "High";
  sentiment: "Bullish" | "Bearish";
  summary: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function parseNumericValue(
  input: string | number | undefined | null,
): number | null {
  if (typeof input === "number") return input;
  if (!input) return null;
  const match = String(input).match(/^([\d.]+)([KMBT]?)$/i);
  if (!match) return null;
  const base = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  const UNIT_MULTIPLIER: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
    T: 1_000_000_000_000,
  };
  return unit ? base * UNIT_MULTIPLIER[unit] : base;
}

function toCompactValue(input: string | number): string {
  const value = parseNumericValue(input);
  if (value === null) return String(input);
  const abs = Math.abs(value);
  const withSuffix = (scaled: number, suffix: "K" | "M" | "B" | "T") =>
    `${scaled
      .toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1")}${suffix}`;
  if (abs >= 1_000_000_000_000)
    return withSuffix(value / 1_000_000_000_000, "T");
  if (abs >= 1_000_000_000) return withSuffix(value / 1_000_000_000, "B");
  if (abs >= 1_000_000) return withSuffix(value / 1_000_000, "M");
  if (abs >= 1_000) return withSuffix(value / 1_000, "K");
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function getActionLabel(ratingRaw: string) {
  const parts = ratingRaw.split("-");
  const label = parts.length > 1 ? parts[1].trim() : ratingRaw;
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("strong buy"))
    return {
      label: "Strong Buy",
      className:
        "bg-success/20 text-success border-success/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    };
  if (lowerLabel.includes("buy"))
    return {
      label: "Buy",
      className:
        "bg-accent/20 text-accent border-accent/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]",
    };
  if (lowerLabel.includes("strong sell"))
    return {
      label: "Strong Sell",
      className:
        "bg-danger/30 text-danger border-danger/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    };
  if (lowerLabel.includes("sell"))
    return {
      label: "Sell",
      className:
        "bg-danger/20 text-danger border-danger/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
    };
  return {
    label: "Hold",
    className: "bg-muted/30 text-muted-foreground border-border/50",
  };
}

export default function CompanyResearchPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const router = useRouter();
  const { user, updateBalance } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [data, setData] = useState<ResearchData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  const [livePrice, setLivePrice] = useState(0);
  const [liveHistory, setLiveHistory] = useState<HistoryData[]>([]);

  const [quantity, setQuantity] = useState<number | string>("");
  const [ownedShares, setOwnedShares] = useState<number>(0);
  const [avgCost, setAvgCost] = useState<number>(0);
  const [loadingAction, setLoadingAction] = useState<"buy" | "sell" | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Nova AI Chat State
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const isChatInitialLoad = useRef(true);

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatScrollRef.current) {
        const isInitial = isChatInitialLoad.current && chatMessages.length > 0;
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight + 9999,
          behavior: isInitial ? "auto" : "smooth",
        });
        if (chatMessages.length > 0) {
          isChatInitialLoad.current = false;
        }
      }
    };

    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 150);
    const t2 = setTimeout(scrollToBottom, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [chatMessages, isChatLoading]);

  // Focus mini chat input on Enter press globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        document.activeElement !== chatInputRef.current &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load global chat history for the mini chat
  useEffect(() => {
    async function loadHistory() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiUrl}/api/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const history = await res.json();
          setChatMessages(history);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    }
    loadHistory();
  }, [apiUrl]);

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = { role: "user" as const, content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          context: `Company Deep Dive: ${data?.name} (${symbol})`,
          data: data,
          messages: [...chatMessages, userMsg],
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch AI response");

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            result.content ||
            result.message?.content ||
            result.choices?.[0]?.message?.content ||
            "No response generated.",
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper to refresh owned shares
  const fetchOwnedShares = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${apiUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        const holdings = Array.isArray(payload.holdings)
          ? payload.holdings
          : payload.holdings
            ? Object.entries(payload.holdings).map(([s, v]: any) => ({
                ...v,
                symbol: s,
              }))
            : [];
        const currentHolding = holdings.find((h: any) => h.symbol === symbol);
        setOwnedShares(
          currentHolding
            ? Number(currentHolding.qty || currentHolding.quantity || 0)
            : 0,
        );
        setAvgCost(
          currentHolding
            ? Number(currentHolding.avgPrice || currentHolding.averagePrice || currentHolding.price || 0)
            : 0,
        );
      }
    } catch (err) {
      console.error("Failed to load portfolio", err);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        const [researchRes, _] = await Promise.all([
          fetch(`${apiUrl}/api/research/${symbol}`),
          fetchOwnedShares(),
        ]);

        if (!researchRes.ok) throw new Error("Failed to load research details");

        const data = await researchRes.json();
        
        // Calculate smart AI signal based on fetched data
        const posKeywords = ["breakthrough", "strong", "growth", "surpassed", "innovative", "expansion", "profit", "bullish", "acquisition", "partnership", "success"];
        const negKeywords = ["concern", "struggle", "regulatory", "impact", "lawsuit", "deficit", "decline", "bearish", "missed", "risk", "investigation", "warning"];
        
        let posCount = 0;
        let negCount = 0;
        
        (data.news || []).forEach((n: any) => {
          const text = (n.title || "").toLowerCase();
          posCount += posKeywords.filter(word => text.includes(word)).length;
          negCount += negKeywords.filter(word => text.includes(word)).length;
        });

        let trendScore = 0;
        if (data.chart && data.chart.length >= 5) {
          const recent = data.chart.slice(-5);
          const startPrice = Number(recent[0].close || recent[0].price || 0);
          const endPrice = Number(recent[recent.length - 1].close || recent[recent.length - 1].price || 0);
          if (endPrice > startPrice) trendScore += 2;
          else if (endPrice < startPrice) trendScore -= 2;
        }
        
        const totalScore = posCount - negCount + trendScore;
        const derivedSentiment = (totalScore > 0 ? "Bullish" : totalScore < 0 ? "Bearish" : "Neutral") as "Bullish" | "Bearish" | "Neutral";
        const derivedLevel = (Math.abs(totalScore) > 3 ? "High" : Math.abs(totalScore) > 1 ? "Medium" : "Low") as "High" | "Medium" | "Low";
        
        let derivedSummary = `Analysis of recent market trends and news indicates a ${derivedSentiment.toLowerCase()} outlook.`;
        if (posCount > negCount && trendScore > 0) {
          derivedSummary = `Strong positive news momentum combined with an upward market trend signals a highly bullish outlook for ${data.symbol}.`;
        } else if (negCount > posCount && trendScore < 0) {
          derivedSummary = `Negative headlines and recent downward market performance highlight a bearish trend for ${data.symbol}.`;
        } else if (posCount > negCount) {
          derivedSummary = `Despite mixed market performance, positive news coverage suggests underlying strength for ${data.symbol}.`;
        } else if (negCount > posCount) {
          derivedSummary = `Negative sentiment in recent headlines indicates potential headwinds for ${data.symbol}, despite current market positioning.`;
        } else if (trendScore > 0) {
          derivedSummary = `Market data shows an upward trend for ${data.symbol}, though recent news remains relatively neutral.`;
        } else if (trendScore < 0) {
          derivedSummary = `Market data shows a downward trend for ${data.symbol}, suggesting caution despite neutral news coverage.`;
        }

        const riskData = {
          level: derivedLevel as "Low" | "Medium" | "High",
          sentiment: derivedSentiment as any, // bypassing strict "Bullish" | "Bearish" if interface doesn't have Neutral
          summary: derivedSummary
        };

        const history = (data.chart || []).map((point: any) => ({
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          price: Number(point.close ?? point.price ?? 0),
        }));

        setData({
          symbol: data.symbol,
          name: data.name,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          history: history,
          headlines:
            data.news?.map((n: any) => ({ title: n.title, link: n.link })) ||
            [],
          profile: data.profile || {
            sector: "N/A",
            industry: "N/A",
            employees: 0,
            description: "No description available.",
          },
          valuation: data.valuation || {
            forwardPE: 0,
            priceToBook: 0,
            pegRatio: 0,
          },
          profitability: data.profitability || {
            profitMargins: 0,
            returnOnEquity: 0,
          },
          financials: data.financials || { totalRevenue: 0 },
        });

        setRisk(riskData);
        setLivePrice(data.price);
        setLiveHistory(history);
      } catch (err) {
        console.error("Failed to load research data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const pollInterval = setInterval(fetchData, 30000);
    return () => clearInterval(pollInterval);
  }, [symbol, user, router, apiUrl]);

  const handleTrade = async (type: "buy" | "sell") => {
    if (!user || !data || !quantity || Number(quantity) <= 0) return;
    const qty = Number(quantity);
    const totalCost = qty * livePrice;

    if (type === "buy" && user.balance < totalCost) {
      setToast({ message: "Insufficient buying power.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoadingAction(type);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token");

      const res = await fetch(`${apiUrl}/api/portfolio/trade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: data.symbol,
          type,
          quantity: qty,
          price: livePrice,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Trade failed");

      // Attempt to sync balance from payload
      const nextBalance = Number(payload.balance ?? payload.buyingPower);
      if (Number.isFinite(nextBalance)) {
        updateBalance(nextBalance);
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          parsedUser.balance = nextBalance;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
      } else {
        // Fallback local update if backend doesn't return balance
        updateBalance(
          type === "buy" ? user.balance - totalCost : user.balance + totalCost,
        );
      }

      setToast({
        message: `Successfully ${type === "buy" ? "purchased" : "sold"} ${qty} shares of ${data!.symbol}`,
        type: "success",
      });
      setQuantity("");
      await fetchOwnedShares();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Trade failed", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) return <Loading />;
  if (!data || !risk)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load data.
      </div>
    );

  const isBullish = risk.sentiment === "Bullish";
  const displayChange = livePrice - data.history[data.history.length - 2].price;
  const displayChangePercent =
    (displayChange / data.history[data.history.length - 2].price) * 100;
  const isDisplayPositive = displayChange >= 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] w-full mx-auto space-y-8 relative z-10 p-6"
    >
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Screener
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <motion.div
            variants={itemVariants}
            className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border flex items-center justify-center font-bold text-foreground shadow-inner">
                    {data.symbol[0]}
                  </div>
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight drop-shadow-sm">
                    {data.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted/80 text-muted-foreground border border-border/80 shadow-sm">
                    {data.symbol}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm ml-13 font-medium">
                  Nasdaq Stock Market
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-4xl font-mono font-bold text-foreground tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                  ${livePrice.toFixed(2)}
                </div>
                <div
                  className={`flex items-center md:justify-end gap-1.5 text-sm font-semibold mt-1 ${isDisplayPositive ? "text-success drop-shadow-[0_0_5px_rgba(0,230,118,0.3)]" : "text-danger drop-shadow-[0_0_5px_rgba(255,23,68,0.3)]"}`}
                >
                  {isDisplayPositive ? "+" : ""}
                  {displayChange.toFixed(2)} ({isDisplayPositive ? "+" : ""}
                  {displayChangePercent.toFixed(2)}%)
                  <span className="text-muted-foreground text-[10px] ml-2 font-bold uppercase tracking-widest">
                    Today
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickMargin={10}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickFormatter={(val) => `$${val}`}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px -3px rgb(0 0 0 / 0.5)",
                      backdropFilter: "blur(10px)",
                    }}
                    itemStyle={{
                      color: "var(--color-accent)",
                      fontWeight: "bold",
                    }}
                    labelStyle={{
                      color: "var(--color-muted-foreground)",
                      marginBottom: "4px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [
                      `$${Number(value).toFixed(2)}`,
                      "Price",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={
                      isDisplayPositive
                        ? "var(--color-success)"
                        : "var(--color-danger)"
                    }
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "var(--color-card)",
                      stroke: isDisplayPositive
                        ? "var(--color-success)"
                        : "var(--color-danger)",
                      strokeWidth: 3,
                    }}
                    animationDuration={300}
                    style={{
                      filter: `drop-shadow(0 0 6px ${isDisplayPositive ? "var(--color-success)" : "var(--color-danger)"})`,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-[#0f172a] via-accent/20 to-purple-900/40 backdrop-blur-xl border border-accent/40 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] relative overflow-hidden group hover:border-accent transition-all duration-700 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,229,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/40 blur-[40px] rounded-full group-hover:bg-accent/60 transition-colors duration-700"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 blur-[40px] rounded-full group-hover:bg-purple-500/50 transition-colors duration-700"></div>
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-all duration-1000 ease-out transform group-hover:scale-125 group-hover:rotate-12 origin-center">
                <Star className="w-32 h-32 text-accent drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                  <Star className="w-4 h-4 animate-pulse" /> Nova AI Signal
                </h2>
                <div className="mb-5">
                  <span
                    className={`text-xl font-bold px-4 py-2 rounded-xl border shadow-[0_0_15px_rgba(0,0,0,0.2)] inline-block ${isBullish ? "bg-success/20 text-success border-success/40" : "bg-danger/20 text-danger border-danger/40"}`}
                  >
                    {risk.sentiment} / {risk.level} Risk
                  </span>
                </div>
                <p className="text-foreground text-sm leading-relaxed font-medium drop-shadow-sm">
                  {risk.summary}
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">
                Company Fundamentals
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Revenue
                  </p>
                  <p className="font-mono font-bold text-foreground">
                    {toCompactValue(data.financials.totalRevenue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Forward P/E
                  </p>
                  <p className="font-mono font-bold text-foreground">
                    {data.valuation.forwardPE.toFixed(2)}x
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Profit Margin
                  </p>
                  <p className="font-mono font-bold text-foreground">
                    {(data.profitability.profitMargins * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    ROE
                  </p>
                  <p className="font-mono font-bold text-foreground">
                    {(data.profitability.returnOnEquity * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col gap-6">
            {/* News Headlines (Top) */}
            <motion.div
              variants={itemVariants}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-border transition-colors duration-300"
            >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">
                Latest Headlines
              </h2>
              <div className="space-y-4">
                {data.headlines.map((headline, i) => {
                  const text = headline.title.toLowerCase();
                  const posKeywords = [
                    "breakthrough",
                    "strong",
                    "growth",
                    "surpassed",
                    "innovative",
                    "expansion",
                    "profit",
                    "bullish",
                    "acquisition",
                    "partnership",
                    "success",
                  ];
                  const negKeywords = [
                    "concern",
                    "struggle",
                    "regulatory",
                    "impact",
                    "lawsuit",
                    "deficit",
                    "decline",
                    "bearish",
                    "missed",
                    "risk",
                    "investigation",
                    "warning",
                  ];
                  const posCount = posKeywords.filter((word) =>
                    text.includes(word),
                  ).length;
                  const negCount = negKeywords.filter((word) =>
                    text.includes(word),
                  ).length;
                  const dotColor =
                    posCount > negCount
                      ? "bg-success"
                      : negCount > posCount
                        ? "bg-danger"
                        : "bg-muted-foreground";

                  return (
                    <a
                      key={i}
                      href={headline.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 group cursor-pointer items-start"
                    >
                      <div
                        className={`w-1.5 h-1.5 mt-1.5 rounded-full ${dotColor} group-hover:shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-all duration-300 shrink-0`}
                      ></div>
                      <p className="text-sm text-foreground/80 group-hover:text-accent transition-colors leading-snug">
                        {headline.title}
                      </p>
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* Company Profile */}
            <motion.div
              variants={itemVariants}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">
                Company Profile
              </h2>
              <div className="text-sm text-foreground/80 leading-relaxed space-y-4">
                {data.profile.description.split(". ").map((sentence, index) => (
                  <p key={index}>
                    {sentence}
                    {sentence.endsWith(".") ? "" : "."}
                  </p>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border/50 flex gap-6 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                    Sector
                  </span>
                  <span className="text-accent font-bold">
                    {data.profile.sector}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                    Industry
                  </span>
                  <span className="text-foreground font-medium">
                    {data.profile.industry}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                    Employees
                  </span>
                  <span className="text-foreground font-medium">
                    {data.profile.employees.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-4 h-[calc(100vh-220px)] sticky top-6 flex flex-col gap-6 min-h-0">
          <motion.div
            variants={itemVariants}
            className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0 w-full relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10">
              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className={`overflow-hidden px-4 py-3 mb-4 rounded-xl flex items-center gap-2 border ${toast.type === "success" ? "bg-success/20 text-success border-success/50" : "bg-danger/20 text-danger border-danger/50"}`}
                  >
                    {toast.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                    )}
                    <span className="text-xs font-bold tracking-wide">
                      {toast.message}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 className="text-xl font-bold text-foreground tracking-tight mb-6 flex items-center gap-2">
                Trade{" "}
                <span className="px-2 py-0.5 bg-muted/80 text-foreground text-sm rounded border border-border/50">
                  {data.symbol}
                </span>
              </h2>

              <div className="bg-muted/30 rounded-xl p-5 mb-6 border border-border/50 shadow-inner flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Buying Power
                  </p>
                  <p className="text-2xl lg:text-3xl font-mono font-bold text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.2)] tracking-tight">
                    $
                    {user?.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-right border-l border-border/50 pl-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                      Shares Owned
                    </p>
                    <p className="text-xl lg:text-2xl font-mono font-bold text-foreground tracking-tight">
                      {ownedShares}
                    </p>
                  </div>
                  {ownedShares > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                        Avg Cost
                      </p>
                      <p className="text-xs font-mono font-bold text-accent tracking-tight">
                        ${avgCost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Quantity (Shares)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-background border border-border/80 rounded-xl py-3.5 pl-5 pr-14 text-xl font-mono font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold tracking-widest">
                      QTY
                    </span>
                  </div>
                </div>

                <div
                  className={`flex justify-between items-center px-1 transition-all duration-300 ${Number(quantity) > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    Estimated Cost
                  </span>
                  <span className="text-lg font-mono font-bold text-foreground tracking-tight">
                    ${(Number(quantity) * livePrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTrade("buy")}
                  disabled={
                    !quantity || Number(quantity) <= 0 || loadingAction !== null
                  }
                  className="bg-success flex items-center justify-center hover:bg-success/80 text-success-foreground font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)] hover:shadow-[0_0_25px_rgba(0,230,118,0.4)] disabled:opacity-50 disabled:shadow-none active:scale-95 cursor-pointer border border-success/50"
                >
                  {loadingAction === "buy" ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="text-lg tracking-wide uppercase">Buy</span>
                  )}
                </button>
                <button
                  onClick={() => handleTrade("sell")}
                  disabled={
                    !quantity || Number(quantity) <= 0 || loadingAction !== null
                  }
                  className="bg-danger flex items-center justify-center hover:bg-danger/80 text-danger-foreground font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,23,68,0.2)] hover:shadow-[0_0_25px_rgba(255,23,68,0.4)] disabled:opacity-50 disabled:shadow-none active:scale-95 cursor-pointer border border-danger/50"
                >
                  {loadingAction === "sell" ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="text-lg tracking-wide uppercase">
                      Sell
                    </span>
                  )}
                </button>
              </div>

              <p className="text-[10px] font-medium text-center text-muted-foreground mt-6 leading-relaxed">
                Market orders are executed immediately at the live simulated
                price.
              </p>
            </div>
          </motion.div>

          {/* Mini Nova AI Chat */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#0f172a] via-accent/10 to-purple-900/30 backdrop-blur-xl border border-accent/40 rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col flex-1 min-h-0 w-full relative overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-background/50 backdrop-blur-md relative z-10 shrink-0">
              <Star className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                Nova AI
              </span>
            </div>

            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 scrollbar-hide relative z-10"
            >
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <p className="text-[11px] font-medium leading-relaxed">
                    Ask me to analyze {data.symbol}'s market position...
                  </p>
                </div>
              )}
              <AnimatePresence>
                {chatMessages.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-lg ${
                        m.role === "user"
                          ? "bg-accent text-accent-foreground font-medium"
                          : "bg-white/5 backdrop-blur-md text-foreground border border-white/10"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isChatLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-accent animate-pulse">
                    Thinking...
                  </div>
                </motion.div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 w-full pt-28 pb-8 flex flex-col items-center justify-end pointer-events-none bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-20">
              <AnimatePresence>
                {chatInput.length > 300 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="mb-3 px-4 py-2 bg-danger/20 backdrop-blur-md border border-danger/50 text-danger text-[10px] font-bold rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)] pointer-events-auto"
                  >
                    Message is too long (Max 300 characters)
                  </motion.div>
                )}
              </AnimatePresence>
              <form
                onSubmit={handleChatSend}
                className="relative flex items-center w-[75%] focus-within:w-[95%] transition-all duration-300 ease-in-out px-2 pointer-events-auto"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Message"
                  className={`w-full bg-[#1e293b] backdrop-blur-xl border ${chatInput.length > 300 ? "border-danger/50 ring-1 ring-danger/50 bg-danger/5" : "border-white/10"} rounded-full py-4 pl-6 pr-20 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 ${chatInput.length > 300 ? "focus:ring-danger/50" : "focus:ring-accent/50"} transition-all shadow-[0_10px_40px_rgba(0,0,0,0.6)]`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />

                <div
                  className={`absolute right-12 text-[9px] font-mono font-medium transition-opacity duration-300 pointer-events-none ${chatInput.length > 250 ? "opacity-100" : "opacity-0"} ${chatInput.length > 300 ? "text-danger drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" : "text-muted-foreground"}`}
                >
                  {chatInput.length}/300
                </div>

                <button
                  type="submit"
                  disabled={
                    isChatLoading || !chatInput.trim() || chatInput.length > 300
                  }
                  className={`absolute right-2.5 p-1.5 rounded-full transition-all cursor-pointer ${
                    chatInput.length > 300
                      ? "bg-danger/10 text-danger opacity-50 cursor-not-allowed"
                      : "bg-transparent text-muted-foreground hover:text-accent hover:bg-accent/10 disabled:opacity-20"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
