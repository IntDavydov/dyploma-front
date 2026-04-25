"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AIChat from "@/app/components/AIChat";
import Loading from "@/app/components/Loading";

// Interfaces
interface Company { id: number; name: string; }
interface Stats { totalSales: number; totalOrders: number; averageOrderValue: number; topProduct: string; }
interface Product { id: number; name: string; price: number; stock: number; }
interface RiskData { level: "Low" | "Medium" | "High"; recommendation: string; summary: string; }
interface MarketData { price: number; status: "Bullish" | "Bearish"; }
interface MarketHistory { date: string; price: number; }
interface Rates { [key: string]: number }
interface Health { postgres: string; shipping: string; soap: string; }
interface ShippingResult { rate: number; provider: string; type: string; }

export default function UnifiedDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Global/Top Bar State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState<Rates>({ USD: 1, EUR: 0.92, UAH: 39.5, JPY: 150 });
  const [health, setHealth] = useState<Health>({ postgres: "Operational", shipping: "Operational", soap: "Standby" });
  
  // Company Specific State
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [history, setHistory] = useState<MarketHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Shipping State
  const [shippingType, setShippingType] = useState<"rest" | "soap">("rest");
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Helper: Format Price with Currency
  const formatPrice = (amount: number) => {
    const converted = amount * (rates[currency] || 1);
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(converted);
  };

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch top bar data (in parallel)
        const [companiesRes, ratesRes, healthRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/companies?limit=100`).then(r => r.json()),
          fetch(`${apiUrl}/api/rates`).then(r => r.json()),
          fetch(`${apiUrl}/api/health`).then(r => r.json())
        ]);

        if (companiesRes.status === "fulfilled" && companiesRes.value.data) {
          setCompanies(companiesRes.value.data);
        } else {
          setCompanies([{ id: 1, name: "Apple" }, { id: 2, name: "Samsung" }]);
        }

        if (ratesRes.status === "fulfilled" && ratesRes.value.rates) {
          setRates(ratesRes.value.rates);
        }

        if (healthRes.status === "fulfilled" && healthRes.value) {
          setHealth({
             postgres: healthRes.value.postgres || "Operational",
             shipping: healthRes.value.shippingService || "Operational",
             soap: healthRes.value.soapInterface || "Standby"
          });
        }

        // Fetch company specific data (in parallel)
        const [statsRes, productsRes, riskRes, marketRes, historyRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/stats/${id}`).then(r => r.json()),
          fetch(`${apiUrl}/api/products/${id}`).then(r => r.json()),
          fetch(`${apiUrl}/api/risk/${id}`).then(r => r.json()),
          fetch(`${apiUrl}/api/market/${id}`).then(r => r.json()),
          fetch(`${apiUrl}/api/market/history/${id}`).then(r => r.json())
        ]);

        // Process Stats
        if (statsRes.status === "fulfilled" && statsRes.value && statsRes.value.totalSales !== undefined) {
          setStats(statsRes.value);
        } else {
          setStats({ totalSales: 15400, totalOrders: 82, averageOrderValue: 187.80, topProduct: "Flagship Device" });
        }

        // Process Products
        if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value) && productsRes.value.length > 0) {
          setProducts(productsRes.value);
        } else {
          setProducts([
            { id: 101, name: "Premium Device", price: 999.99, stock: 12 },
            { id: 102, name: "Standard Model", price: 499.99, stock: 45 },
            { id: 103, name: "Accessory Pack", price: 29.99, stock: 150 },
          ]);
        }

        // Process Risk
        if (riskRes.status === "fulfilled" && riskRes.value && riskRes.value.level) {
          setRisk(riskRes.value);
        } else {
          setRisk({ 
            level: "High", 
            recommendation: "Stockpile immediately.", 
            summary: "Recent geopolitical tensions in the primary manufacturing region may cause shipping delays." 
          });
        }

        // Process Market
        if (marketRes.status === "fulfilled" && marketRes.value && marketRes.value.price !== undefined) {
          setMarket(marketRes.value);
        } else {
          setMarket({ price: 184.25, status: "Bullish" });
        }

        // Process History
        if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value) && historyRes.value.length > 0) {
          setHistory(historyRes.value);
        } else {
          // Generate mock 30-day history
          const mockHistory = [];
          let currentPrice = 150;
          for(let i=30; i>=0; i--) {
            currentPrice += (Math.random() * 10 - 4);
            mockHistory.push({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: Number(currentPrice.toFixed(2))
            });
          }
          setHistory(mockHistory);
        }

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, [id, apiUrl]);

  useEffect(() => {
    let isCancelled = false;
    async function loadConversionRate() {
      try {
        const res = await fetch(`${apiUrl}/api/convert?amount=1&to=${encodeURIComponent(currency)}`);
        if (!res.ok) return;
        const data = await res.json();
        const convertedValue = Number(
          data.convertedAmount ??
          data.converted ??
          data.result ??
          data.value ??
          data.amount
        );
        if (!isCancelled && Number.isFinite(convertedValue) && convertedValue > 0) {
          setRates((prev) => ({ ...prev, [currency]: convertedValue }));
        }
      } catch (err) {
        console.error("Currency conversion fetch failed:", err);
      }
    }

    loadConversionRate();
    return () => {
      isCancelled = true;
    };
  }, [apiUrl, currency]);

  const handleShippingCalculation = async () => {
    setCalculatingShipping(true);
    try {
      const res = await fetch(`${apiUrl}/api/shipping/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: shippingType === "rest" ? "modern-rest" : "legacy-soap", companyId: id })
      });
      const data = await res.json();
      if (res.ok) {
        setShippingResult({
          rate: data.rate || 45.50,
          provider: shippingType === "rest" ? "Modern REST Provider" : "Legacy Enterprise SOAP",
          type: shippingType === "rest" ? "JSON Response" : "Parsed XML Response"
        });
      } else {
         throw new Error("Failed");
      }
    } catch {
      // Mock fallback
      setShippingResult({
        rate: shippingType === "rest" ? 42.50 : 48.75,
        provider: shippingType === "rest" ? "FastShip REST API" : "GlobalFreigh XML-RPC",
        type: shippingType === "rest" ? "JSON Payload" : "SOAP Envelope Decoded"
      });
    } finally {
      setCalculatingShipping(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const currentCompany = companies.find(c => c.id.toString() === id) || { name: "Selected Company" };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-24">
      
      {/* TOP BAR: Selector | Currency | Health */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-muted rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <select 
            className="bg-background border border-border text-foreground text-sm rounded-lg focus:ring-accent focus:border-accent block w-48 p-2.5 cursor-pointer"
            value={id}
            onChange={(e) => router.push(`/company/${e.target.value}`)}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-muted-foreground">Currency:</span>
            <select 
              className="bg-background border border-border text-foreground text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 cursor-pointer"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {Object.keys(rates).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center gap-4 border-l border-border pl-6">
             <HealthDot label="Postgres" status={health.postgres} />
             <HealthDot label="Shipping" status={health.shipping} />
             <HealthDot label="SOAP" status={health.soap} />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (30%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Risk Card */}
          <div className={`rounded-2xl border bg-card p-6 shadow-lg ${risk?.level === 'High' ? 'border-danger shadow-danger/10' : 'border-border'}`}>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                 <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Geopolitical Risk
               </h3>
               <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                 risk?.level === 'High' ? 'bg-danger/20 text-danger' : 
                 risk?.level === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-success/20 text-success'
               }`}>{risk?.level}</span>
             </div>
             {risk?.level === 'High' && (
               <div className="mb-4 bg-danger text-danger-foreground text-xs font-bold p-3 rounded-lg uppercase tracking-wider text-center">
                 {risk.recommendation}
               </div>
             )}
             <p className="text-sm text-foreground leading-relaxed">"{risk?.summary}"</p>
          </div>

          {/* Stock Price Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
             <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Live Market Eval</h3>
             <div className="flex items-end gap-3">
               <span className="text-4xl font-bold text-foreground">{formatPrice(market?.price || 0)}</span>
               <span className={`text-sm font-bold mb-1 ${market?.status === 'Bullish' ? 'text-success' : 'text-danger'}`}>
                 {market?.status}
               </span>
             </div>
          </div>

          {/* Line Chart */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg h-[300px]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">30-Day Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={10} minTickGap={30} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val}`} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#22d3ee' }}
                  formatter={(value: any) => [formatPrice(Number(value)), 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={market?.status === 'Bullish' ? 'var(--color-success)' : 'var(--color-danger)'} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#090e1a', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT COLUMN (70%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Total Sales" value={formatPrice(stats?.totalSales || 0)} icon="💰" />
            <StatCard label="Orders Processed" value={(stats?.totalOrders || 0).toString()} icon="📦" />
            <StatCard label="Avg Order Value" value={formatPrice(stats?.averageOrderValue || 0)} icon="📊" />
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden flex flex-col h-[calc(100%-140px)]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Local Postgres Inventory</h3>
              <span className="text-xs font-mono text-accent bg-accent/10 px-3 py-1 rounded-full">Synced via Internal API</span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Product</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Price</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-accent">#{product.id}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-foreground">{product.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-foreground">{formatPrice(product.price)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`h-1.5 w-1.5 rounded-full ${product.stock < 20 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                           <span className="text-sm font-medium text-foreground">{product.stock} Units</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: Legacy Logistics Bridge */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg mt-6 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Legacy Logistics <span className="text-accent">Bridge</span></h2>
              <p className="mt-2 text-sm text-muted-foreground">Select a provider pattern to calculate estimated shipping to regional hubs.</p>
            </div>
            
            <div className="flex bg-background border border-border rounded-xl p-1">
              <button 
                onClick={() => setShippingType("rest")}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${shippingType === 'rest' ? 'bg-accent text-accent-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Modern REST
              </button>
              <button 
                onClick={() => setShippingType("soap")}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${shippingType === 'soap' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Legacy SOAP (XML)
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <button 
              onClick={handleShippingCalculation}
              disabled={calculatingShipping}
              className={`px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[200px] ${
                shippingType === 'rest' 
                ? 'bg-accent/10 text-accent border border-accent hover:bg-accent hover:text-accent-foreground' 
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              {calculatingShipping ? 'Transmitting...' : 'Calculate Rate'}
            </button>

            {shippingResult && (
              <div className="flex-1 w-full bg-background border border-border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">{shippingResult.type}</p>
                  <p className="text-sm font-bold text-foreground">{shippingResult.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Estimated Cost</p>
                  <p className={`text-3xl font-bold ${shippingType === 'rest' ? 'text-accent' : 'text-indigo-400'}`}>
                    {formatPrice(shippingResult.rate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIChat 
        context={`Unified Dashboard for ${currentCompany.name} (ID ${id})`} 
        data={{ stats, risk, market }} 
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function HealthDot({ label, status }: { label: string, status: string }) {
  const isOk = status === "Operational";
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOk ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOk ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}
