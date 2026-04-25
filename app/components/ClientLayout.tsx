"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { login, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        login(u, token);
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, [login]);

  if (!mounted) return null;

  const isLogin = pathname === '/login';
  const isNovaAI = pathname === '/research/nova-ai';

  if (isLogin) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground relative selection:bg-accent/30 selection:text-accent">
      {/* Spaceship Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <TopHeader />
          <main className={`flex-1 overflow-y-auto scroll-smooth relative z-10 ${isNovaAI ? '' : 'p-6 md:p-8'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
