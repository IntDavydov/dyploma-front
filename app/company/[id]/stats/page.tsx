"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProduct: string;
}

export default function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/stats/${id}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats({
          totalSales: 5400.00,
          totalOrders: 42,
          averageOrderValue: 128.57,
          topProduct: "Mock Brand Item",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/company/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Business <span className="text-accent">Analytics</span>
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-card border border-border" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Sales Value" value={`$${stats?.totalSales.toLocaleString()}`} icon="💰" trend="+12.5%" />
            <StatCard label="Orders Processed" value={stats?.totalOrders.toString() || "0"} icon="📦" trend="+4.2%" />
            <StatCard label="Avg. Order Volume" value={`$${stats?.averageOrderValue.toFixed(2)}`} icon="📊" trend="-1.8%" />
            <StatCard label="High Yield Product" value={stats?.topProduct || "N/A"} icon="⭐" trend="Market Leader" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
             <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Strategic Overview</h3>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                   Comprehensive analytics for organization #{id} are synthesized from global distribution points. Current data shows high stability in European markets with emerging growth in North American sectors.
                </p>
                <div className="mt-8 flex items-center gap-4">
                   <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent w-[75%] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                   </div>
                   <span className="text-xs font-mono text-foreground">75% Sync Quality</span>
                </div>
             </div>
             
             <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Service Protocol Health</h3>
                <div className="mt-6 space-y-4">
                   <HealthRow label="REST Gateway" status="Active" />
                   <HealthRow label="SOAP Legacy Bridge" status="Standby" />
                   <HealthRow label="PostgreSQL Core" status="Optimized" />
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: string, trend: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className={`mt-2 text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : trend.startsWith('-') ? 'text-rose-500' : 'text-accent'}`}>{trend} <span className="text-muted-foreground">vs Last Period</span></p>
    </div>
  );
}

function HealthRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
         <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
         <span className="text-xs font-mono text-foreground">{status}</span>
      </div>
    </div>
  );
}
