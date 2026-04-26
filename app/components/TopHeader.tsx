"use client";

import { useAuthStore } from "../store/authStore";
import { Search, Bell, Sun, Moon, Menu, X, LayoutGrid, Briefcase, Star, Zap, Crown, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchCompany {
  symbol: string;
  name: string;
}

export default function TopHeader() {
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/research", icon: LayoutGrid },
    { name: "Portfolio", href: "/portfolio", icon: Briefcase },
    { name: "Nova AI", href: "/nova-ai", icon: Star },
  ];

  const getSubIcon = () => {
    const tier = (user?.subscription || 'NONE').toUpperCase();
    if (tier === 'GO') return Zap;
    if (tier === 'PLUS') return Star;
    if (tier === 'PRO') return Crown;
    return Star;
  };

  const SubIcon = getSubIcon();

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
      const normalized = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      const items = normalized
        .map((item: any) => ({
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

  const handleSelectCompany = (symbol: string) => {
    setSearchOpen(false);
    router.push(`/research/${symbol}`);
  };

  let pageTitle = "DASHBOARD";
  let greeting = `Good evening, ${userName}.`;
  if (pathname.includes("/portfolio")) {
    pageTitle = "PORTFOLIO";
    greeting = "Portfolio Performance";
  } else if (pathname.includes("/nova-ai")) {
    pageTitle = "NOVA AI";
    greeting = "DeepSeek-V3 Intelligence";
  } else if (pathname.includes("/research/")) {
    pageTitle = "RESEARCH";
    greeting = "Asset Analysis";
  }

  return (
    <>
    <header className={`h-24 px-4 md:px-8 flex items-center justify-between ${isMobileMenuOpen ? 'bg-background' : 'bg-background/60 border-b border-border/40'} backdrop-blur-3xl sticky top-0 z-[60] shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300`}>
      
      {/* Left Section: Menu & Title */}
      <div className="flex items-center gap-4 w-[280px] md:w-[320px]">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex mobile-ui:hidden w-11 h-11 rounded-xl items-center justify-center transition-all cursor-pointer relative z-[70] ${isMobileMenuOpen ? 'bg-transparent text-accent' : 'bg-foreground/5 backdrop-blur-md border border-foreground/10 text-muted-foreground hover:text-accent'}`}
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="hidden mobile-ui:flex flex-col justify-center">
          <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{pageTitle}</h2>
          <h1 className="text-sm lg:text-lg font-extrabold text-foreground tracking-tight drop-shadow-sm truncate">{greeting}</h1>
        </div>
      </div>

      {/* Middle: Search (Desktop Only position) */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Search markets..." 
          value={searchQuery}
          onFocus={() => { setSearchOpen(true); loadSearchItems(); }}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); loadSearchItems(); }}
          className="w-full bg-foreground/5 backdrop-blur-md border border-foreground/10 rounded-full py-2.5 pl-12 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
        />
        <AnimatePresence>
          {searchOpen && searchQuery.trim().length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} ref={dropdownRef} className="absolute top-full left-0 mt-2 w-full bg-background/95 backdrop-blur-3xl border border-border/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 max-h-72 overflow-y-auto">
              {searchLoading ? <div className="px-4 py-3 text-xs text-muted-foreground">Syncing...</div> : filteredSearchItems.length > 0 ? filteredSearchItems.map((item, index) => (
                  <button key={index} onClick={() => handleSelectCompany(item.symbol)} className="w-full text-left px-5 py-4 hover:bg-foreground/5 border-b border-foreground/5 last:border-b-0 transition-colors group">
                    <div className="flex justify-between items-center"><span className="font-bold text-foreground group-hover:text-accent transition-colors">{item.symbol}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                  </button>
                )) : <div className="px-4 py-3 text-xs text-muted-foreground">No matches found.</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4 justify-end w-[280px] md:w-[320px]">
        <div className="hidden sm:flex items-center gap-3 border-r border-foreground/5 pr-4 mr-2">
           <button className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/5 flex items-center justify-center text-muted-foreground hover:text-accent transition-all relative group">
             <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-danger rounded-full shadow-[0_0_8px_rgba(255,23,68,0.8)]"></span>
           </button>
           <button onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/5 flex items-center justify-center text-muted-foreground hover:text-accent transition-all">
             {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
           </button>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] text-xs border border-foreground/10 overflow-hidden">
               <span className="relative z-10">{initials}</span>
            </div>
          </div>
        )}
      </div>
    </header>

    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'calc(100dvh - 6rem)' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
          className="absolute top-24 left-0 w-full bg-background backdrop-blur-3xl border-b border-border/40 z-[56] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-y-auto scrollbar-hide mobile-ui:hidden"
        >
          <div className="p-6 space-y-8 border-t border-border/40">
             <nav className="grid grid-cols-1 gap-2">
                {navItems.map((item, i) => {
                  const isActive = pathname === item.href || (item.name === "Overview" && (pathname === "/research" || pathname.startsWith("/research/")));
                  const Icon = item.icon;
                  return (
                    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + (i * 0.05) }} key={item.name} onClick={() => router.push(item.href)} className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all group active:scale-[0.98] ${isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground/60 hover:bg-foreground/5'}`}><div className="flex items-center gap-4"><Icon className={`w-5 h-5 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'opacity-70'}`} /><span className="font-bold uppercase tracking-[0.2em] text-[11px]">{item.name}</span></div><ChevronDown className="w-4 h-4 -rotate-90 opacity-20 group-hover:opacity-100 transition-opacity" /></motion.button>
                  );
                })}
             </nav>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}