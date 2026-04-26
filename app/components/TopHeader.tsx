"use client";

import { useAuthStore } from "../store/authStore";
import { Search, Bell, Sun, Moon, Menu, X, LayoutGrid, Briefcase, Star, Zap, Crown, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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

  return (
    <>
    <header className={`h-24 px-4 md:px-8 flex items-center justify-between ${isMobileMenuOpen ? 'bg-background' : 'bg-background/60 border-b border-border/40'} backdrop-blur-3xl sticky top-0 z-[60] shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300`}>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex mobile-ui:hidden w-11 h-11 rounded-xl items-center justify-center transition-all cursor-pointer relative z-[70] ${isMobileMenuOpen ? 'bg-transparent text-accent' : 'bg-foreground/5 backdrop-blur-md border border-foreground/10 text-muted-foreground hover:text-accent'}`}
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="hidden mobile-ui:flex flex-col justify-center">
          <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{pageTitle}</h2>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight drop-shadow-sm">{greeting}</h1>
        </div>
      </div>

      <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-4 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Search markets..." 
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
          className="w-full bg-foreground/5 backdrop-blur-md border border-foreground/10 rounded-full py-2.5 pl-12 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
        />
        
        <AnimatePresence>
          {searchOpen && searchQuery.trim().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              ref={dropdownRef} 
              className="absolute top-full left-0 mt-2 w-full bg-background/95 backdrop-blur-3xl border border-border/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 max-h-72 overflow-y-auto"
            >
              {searchLoading ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">Syncing data...</div>
              ) : filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item, index) => (
                  <button
                    key={`${item.symbol}-${index}`}
                    onClick={() => handleSelectCompany(item.symbol)}
                    className="w-full text-left px-5 py-4 hover:bg-foreground/5 border-b border-foreground/5 last:border-b-0 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground group-hover:text-accent transition-colors">{item.symbol}</span>
                      <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50 -rotate-90" />
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-muted-foreground">No matches found.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
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
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
              <span className="relative z-10">{initials}</span>
            </div>
            <div className="hidden xl-desktop:block">
              <p className="text-xs font-bold text-foreground leading-tight">{userName}</p>
              <p className="text-[9px] font-black text-accent uppercase tracking-widest">{user.subscription} TIER</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 6rem)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
            className="absolute top-full left-0 w-full bg-background backdrop-blur-3xl border-b border-border/40 z-[56] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-y-auto scrollbar-hide mobile-ui:hidden"
          >
             <div className="p-6 space-y-8 border-t border-border/40">
               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-4 pb-6 border-b border-foreground/5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(0,229,255,0.3)] border border-foreground/10 relative overflow-hidden"><div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div><span className="relative z-10 text-sm">{initials}</span></div>
                  <div><p className="text-sm font-bold text-foreground tracking-tight">{userName}</p><div className="flex items-center gap-2 mt-0.5"><SubIcon className="w-3 h-3 text-accent" /><span className="text-[10px] font-black text-accent uppercase tracking-widest">{user?.subscription} TIER</span></div></div>
               </motion.div>
               <nav className="grid grid-cols-1 gap-2">
                  {navItems.map((item, i) => {
                    const isActive = pathname === item.href || (item.name === "Overview" && (pathname === "/research" || pathname.startsWith("/research/")));
                    const Icon = item.icon;
                    return (
                      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + (i * 0.05) }} key={item.name} onClick={() => router.push(item.href)} className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all group active:scale-[0.98] ${isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground/60 hover:bg-foreground/5'}`}><div className="flex items-center gap-4"><Icon className={`w-5 h-5 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'opacity-70'}`} /><span className="font-bold uppercase tracking-[0.2em] text-[11px]">{item.name}</span></div><ChevronDown className="w-4 h-4 -rotate-90 opacity-20 group-hover:opacity-100 transition-opacity" /></motion.button>
                    );
                  })}
               </nav>
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} onClick={() => router.push('/upgrade')} className="relative p-5 rounded-[2rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-foreground/10 shadow-2xl group cursor-pointer overflow-hidden active:scale-95 transition-transform">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 blur-[30px] rounded-full group-hover:bg-accent/40 transition-colors duration-500"></div>
                  <div className="relative z-10 flex items-center justify-between">
                     <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]"><SubIcon className="w-5 h-5 text-accent animate-pulse" /></div><div><p className="text-[10px] font-black text-accent uppercase tracking-widest">Membership Status</p><p className="text-base font-bold text-white tracking-tight">Nova {user?.subscription}</p></div></div>
                     <button className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.4)]">Manage</button>
                  </div>
               </motion.div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="pt-2"><button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20 cursor-pointer active:scale-95"><LogOut className="w-4 h-4" /><span className="font-bold uppercase tracking-widest text-[10px]">Establish Disconnect</span></button></motion.div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-[55] mobile-ui:hidden"
        />
      )}
    </AnimatePresence>
    </>
  );
}
