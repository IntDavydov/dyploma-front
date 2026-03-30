"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
}

export default function CompanyDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/companies`);
        const companies: Company[] = await res.json();
        const found = companies.find(c => c.id.toString() === id);
        if (found) setCompany(found);
      } catch {
        const mockMap: Record<string, string> = {
          "1": "Apple", "2": "Samsung", "3": "Gucci", "4": "Dior", "5": "Chanel"
        };
        setCompany({ id: parseInt(id), name: mockMap[id] || "Unknown Company" });
      }
    }
    fetchCompany();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Companies
      </Link>
      
      <div className="mt-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {company?.name} <span className="text-accent">Gateway</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Select an operational module to begin management.</p>
      </div>
      
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DashboardCard 
          href={`/company/${id}/inventory`}
          title="Manage Inventory"
          description="Real-time stock tracking and SKU management."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <DashboardCard 
          href={`/company/${id}/stats`}
          title="Business Analytics"
          description="Sales performance and global distribution metrics."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

function DashboardCard({ href, title, description, icon }: { href: string, title: string, description: string, icon: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-8 transition-all hover:border-accent hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]"
    >
      <div className="mb-4 h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
         Open Module
         <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
         </svg>
      </div>
    </Link>
  );
}
