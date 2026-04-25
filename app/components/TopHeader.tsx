"use client";

import { useAuthStore } from "../store/authStore";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SearchCompany {
  symbol: string;
  name: string;
}

export default function TopHeader() {
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState<SearchCompany[]>([]);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const userName = user?.name || "Trader";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TR";

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSearchItems = async () => {
    if (searchLoaded || searchLoading) return;
    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiUrl}/api/research`, { headers });
      const payload = await res.json();
      if (!res.ok) throw new Error("Failed to load search companies");

      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const items = normalized
        .map((item: Record<string, unknown>) => ({
          symbol: String(item.symbol || "").toUpperCase(),
          name: String(item.name || ""),
        }))
        .filter((item: SearchCompany) => item.symbol && item.name);

      setSearchItems(items);
      setSearchLoaded(true);
    } catch (err) {
      console.error("Failed to load search companies", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchItems.filter((item) =>
      item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  }, [searchItems, searchQuery]);

  useEffect(() => {
    setActiveIndex(filteredSearchItems.length > 0 ? 0 : -1);
  }, [searchQuery, filteredSearchItems.length]);

  useEffect(() => {
    if (activeIndex < 0 || !dropdownRef.current) return;
    const activeItem = dropdownRef.current.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
    setIsDark(!isDark);
  };

  // Determine Title based on pathname
  let pageTitle = "DASHBOARD";
  let greeting = `Good evening, ${userName}.`;

  if (pathname.includes("/portfolio")) {
    pageTitle = "PORTFOLIO";
    greeting = "Your Portfolio Performance";
  } else if (pathname.includes("/research/")) {
    pageTitle = "RESEARCH";
    greeting = "Asset Analysis";
  }

  const handleSelectCompany = (symbol: string) => {
    setSearchOpen(false);
    router.push(`/research/${symbol}`);
  };

  return (
    <header className="h-24 px-6 md:px-8 flex items-center justify-between border-b border-border/40 bg-background/40 backdrop-blur-2xl sticky top-0 z-40 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col justify-center">
        <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{pageTitle}</h2>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight drop-shadow-sm">{greeting}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div ref={searchContainerRef} className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search ticker, company, news..." 
            value={searchQuery}
            onFocus={() => {
              setSearchOpen(true);
              loadSearchItems();
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
              loadSearchItems();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
                return;
              }

              if (!searchOpen || filteredSearchItems.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % filteredSearchItems.length);
                return;
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev <= 0 ? filteredSearchItems.length - 1 : prev - 1));
                return;
              }

              if (e.key === "Enter") {
                e.preventDefault();
                const nextIndex = activeIndex >= 0 ? activeIndex : 0;
                const selected = filteredSearchItems[nextIndex];
                if (selected) {
                  handleSelectCompany(selected.symbol);
                }
              }
            }}
            className="bg-card/50 backdrop-blur-md border border-border/50 rounded-full py-2.5 pl-12 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 focus:bg-card w-80 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
             <kbd className="bg-muted/80 border border-border/50 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 shadow-sm">
               <span className="text-[11px]">⌘</span>K
             </kbd>
          </div>

          {searchOpen && searchQuery.trim().length > 0 && (
            <div ref={dropdownRef} className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] ring-1 ring-black/20 z-50 max-h-72 overflow-y-auto">
              {searchLoading ? (
                <div className="px-4 py-3 text-xs text-muted-foreground bg-muted/20">Loading companies...</div>
              ) : filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item, index) => (
                  <button
                    key={`${item.symbol}-${item.name}-${index}`}
                    type="button"
                    data-search-index={index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectCompany(item.symbol)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full text-left px-4 py-3 transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${
                      index === activeIndex ? "bg-accent/15" : "hover:bg-muted/35"
                    }`}
                  >
                    <div className={`text-sm font-bold ${index === activeIndex ? "text-accent" : "text-foreground"}`}>{item.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-muted-foreground bg-muted/20">No companies found.</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-l border-border/50 pl-5">
          <button className="w-11 h-11 rounded-xl bg-card/50 backdrop-blur-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/50 hover:bg-card transition-all duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative group">
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-danger rounded-full border-[1.5px] border-background shadow-[0_0_8px_rgba(255,23,68,0.8)]"></span>
          </button>
          
          <button 
            onClick={toggleTheme} 
            className="w-16 h-11 rounded-xl bg-card/50 backdrop-blur-md border border-border/50 flex items-center justify-between px-1.5 text-muted-foreground hover:border-accent/30 transition-all duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          >
            <div className={`w-6 h-8 flex items-center justify-center rounded-lg transition-all duration-500 ${!isDark ? 'bg-accent text-accent-foreground shadow-[0_0_10px_rgba(0,229,255,0.4)]' : ''}`}>
              <Sun className="w-4 h-4" />
            </div>
            <div className={`w-6 h-8 flex items-center justify-center rounded-lg transition-all duration-500 ${isDark ? 'bg-accent text-accent-foreground shadow-[0_0_10px_rgba(0,229,255,0.4)]' : ''}`}>
              <Moon className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Profile */}
        {user && (
          <div className="flex items-center gap-3 pl-5">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] text-sm border border-white/10 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
              <span className="relative z-10">{initials}</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-foreground leading-tight">{userName}</p>
              <p className="text-[10px] font-bold text-accent tracking-wider uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Pro Trader</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
