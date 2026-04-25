"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { Search, Briefcase, Activity, LogOut, ArrowUpRight, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

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

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link href="/research" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30 group-hover:bg-accent/30 transition-colors">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Nova<span className="text-accent font-light">Invest</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
          <Link 
            href="/research" 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/research') ? 'bg-card text-card-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Research
          </Link>
          <Link 
            href="/portfolio" 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/portfolio') ? 'bg-card text-card-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Portfolio
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search ticker, company..." 
            className="bg-card border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 w-64 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
             <kbd className="hidden sm:inline-block bg-muted border border-border rounded px-1.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </div>
        </div>

        <button 
          onClick={toggleTheme} 
          className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user ? (
          <div className="flex items-center gap-4 pl-6 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Buying Power</p>
              <p className="text-sm font-mono font-bold text-foreground flex items-center justify-end gap-1">
                 <span className="text-accent">$</span>
                 {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <button onClick={handleLogout} className="text-xs text-danger hover:text-danger/80 flex items-center gap-1 transition-colors">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login" className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-accent/20">
            Sign In <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}
