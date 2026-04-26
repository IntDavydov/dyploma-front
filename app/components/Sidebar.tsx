"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  TrendingUp, 
  Briefcase, 
  Search, 
  FileText, 
  Star, 
  Settings, 
  ChevronLeft,
  LogOut,
  Zap,
  Crown
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
    const tier = user?.subscription || 'NONE';
    if (tier === 'GO') return Zap;
    if (tier === 'PLUS') return Star;
    if (tier === 'PRO') return Crown;
    return Star; // Default
  };

  const SubIcon = getSubIcon();

  return (
    <aside className="w-20 xl-desktop:w-64 h-full bg-sidebar/80 backdrop-blur-3xl border-r border-border hidden mobile-ui:flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 transition-all duration-300">
      {/* Logo */}
      <div className="h-24 flex items-center justify-center xl-desktop:justify-start xl-desktop:px-6 border-b border-border/50">
        <Link href="/research" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all duration-500 shrink-0">
             <Star className="w-5 h-5 text-white" />
          </div>
          <div className="hidden xl-desktop:flex flex-col">
            <span className="text-xl font-bold text-foreground leading-none tracking-tight">Nova</span>
            <span className="text-[10px] font-bold text-accent tracking-[0.3em] mt-0.5 opacity-80">INVEST</span>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <div className="flex-1 px-3 xl-desktop:px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = 
            pathname === item.href || 
            (item.name === "Overview" && (pathname === "/research" || pathname.startsWith("/research/")));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative block"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeSidebarTab"
                  className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-xl shadow-[inset_0_0_12px_rgba(0,229,255,0.1)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`relative z-10 flex items-center justify-center xl-desktop:justify-start gap-3 px-3 xl-desktop:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive 
                ? 'text-foreground font-bold' 
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}>
                <Icon className={`w-5 h-5 transition-colors duration-300 shrink-0 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'opacity-70 group-hover:text-accent'}`} />
                <span className="hidden xl-desktop:inline">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 xl-desktop:p-4 space-y-4">
        {/* Nova Pro Banner */}
        <div 
          onClick={() => router.push('/upgrade')}
          className="group bg-gradient-to-br from-[#0f172a] via-accent/20 to-purple-900/40 border border-accent/40 hover:border-accent rounded-2xl p-3 xl-desktop:p-5 shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] relative overflow-hidden transition-all duration-500 cursor-pointer transform hover:-translate-y-1 flex flex-col items-center xl-desktop:items-start"
        >
           {/* Shimmer animation on background */}
           <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,229,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>
           
           <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/40 blur-[30px] rounded-full group-hover:bg-accent/60 transition-colors duration-500"></div>
           <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/30 blur-[30px] rounded-full group-hover:bg-purple-500/50 transition-colors duration-500"></div>
           
           <div className="relative z-10 flex items-center gap-2 mb-1">
             <h4 className="text-sm font-bold text-foreground drop-shadow-[0_0_5px_rgba(0,229,255,0.5)] hidden xl-desktop:block">
               Nova {user?.subscription !== 'NONE' ? user?.subscription : 'Pro'}
             </h4>
             <SubIcon className={`w-4 h-4 text-accent animate-pulse ${user?.subscription === 'NONE' ? '' : 'xl-desktop:w-3 xl-desktop:h-3'}`} />
           </div>

           <p className="text-[10px] text-foreground/80 font-medium mb-4 relative z-10 leading-relaxed hidden xl-desktop:block">
             {user?.subscription === 'NONE' ? 'AI signals, real-time data & options flow.' : 'Enjoying your premium trading experience.'}
           </p>
           
           <button className="w-full bg-accent hover:bg-accent/80 text-accent-foreground border border-accent/50 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] cursor-pointer hidden xl-desktop:block">
             {user?.subscription === 'NONE' ? 'Upgrade' : 'Manage Plan'}
           </button>
        </div>

        <Link href="#" className="flex items-center justify-center xl-desktop:justify-start gap-3 px-3 xl-desktop:px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-300 group">
          <Settings className="w-5 h-5 opacity-70 group-hover:text-accent transition-colors shrink-0" />
          <span className="hidden xl-desktop:inline">Settings</span>
        </Link>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center xl-desktop:justify-start gap-3 px-3 xl-desktop:px-4 py-3 rounded-xl border border-border/50 text-muted-foreground hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all duration-300 cursor-pointer group"
        >
           <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-colors shrink-0" />
           <span className="text-sm font-medium hidden xl-desktop:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
