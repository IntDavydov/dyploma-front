"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  description?: string;
  region?: string;
  skus?: number;
  status?: "Synced" | "Pending" | "Offline";
}

interface PaginatedResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Home() {
  const [companyData, setCompanyData] = useState<PaginatedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCompanies = async (page: number) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/companies?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const result: PaginatedResponse = await res.json();
      
      // Enhance data with design properties
      const enhancedData = result.data.map((c: any) => ({
          ...c,
          region: c.region || ["North America", "Europe", "Asia Pacific", "Latin America"][Math.floor(Math.random() * 4)],
          skus: c.skus || Math.floor(Math.random() * 50000) + 5000,
          status: c.status || ["Synced", "Pending", "Offline"][Math.floor(Math.random() * 3)]
      }));
      
      setCompanyData({ ...result, data: enhancedData });
    } catch (err) {
      console.error("Error fetching companies:", err);
      // Fallback for demo
      const mockData: Company[] = [
        { id: 1, name: "Apple", region: "North America", skus: 24300, status: "Synced" as const },
        { id: 2, name: "Samsung", region: "Asia Pacific", skus: 41200, status: "Pending" as const },
        { id: 3, name: "Gucci", region: "Europe", skus: 18700, status: "Synced" as const },
      ];
      setCompanyData({ data: mockData, total: 3, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(currentPage);
  }, [currentPage]);

  const filteredCompanies = companyData?.data.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Select a <span className="text-accent">Company</span>
        </h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          Choose an organization to begin syncing inventory across your global supply chain ({companyData?.total || 0} brands available).
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
             <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </div>
          <input
            type="text"
            placeholder="Search companies on this page..."
            className="block w-full rounded-lg border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
           <FilterButton label="All" active />
           <FilterButton label="North America" />
           <FilterButton label="Europe" />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {filteredCompanies.length} of {companyData?.total || 0} companies</p>
          <p className="text-xs font-mono text-accent uppercase tracking-widest">Page {currentPage} of {companyData?.totalPages || 1}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-accent hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                     <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M3 7v1h18V7M3 7l9-4 9 4M5 21V8m14 13V8M9 21v-7h6v7" />
                     </svg>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`h-2 w-2 rounded-full ${
                       company.status === 'Synced' ? 'bg-emerald-500' : 
                       company.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                     }`} />
                     <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {company.status}
                     </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">{company.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                     <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                        {company.region}
                     </div>
                     <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {company.skus?.toLocaleString()} SKUs
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-16 flex items-center justify-center gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
            >
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
            </button>
            
            <div className="flex items-center gap-2">
               {[...Array(companyData?.totalPages || 0)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-10 w-10 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 
                      ? 'bg-accent text-accent-foreground shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                      : 'border border-border bg-card text-muted-foreground hover:border-accent hover:text-accent'
                    }`}
                  >
                    {i + 1}
                  </button>
               ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(companyData?.totalPages || 1, p + 1))}
              disabled={currentPage === (companyData?.totalPages || 1) || loading}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
            >
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FilterButton({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
      active 
      ? 'bg-accent text-accent-foreground shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
      : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground'
    }`}>
      {label}
    </button>
  );
}
