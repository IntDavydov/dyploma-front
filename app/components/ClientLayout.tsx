"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { login, setUser, user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");
    if (storedToken && storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        login(u, storedToken);
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, [login]);

  // Sync user profile from backend
  useEffect(() => {
    if (!token) return;

    async function syncProfile() {
      try {
        const res = await fetch(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const remoteUser = await res.json();
          // Map backend fields to frontend interface
          const normalizedUser = {
            ...remoteUser,
            name: remoteUser.username || remoteUser.name,
            subscription: (remoteUser.subscriptionTier || remoteUser.subscription || 'NONE').toUpperCase(),
            messageCount: Number(remoteUser.messageCount ?? remoteUser.message_count ?? 0),
            chatsCreated: Number(remoteUser.chatsCreated ?? remoteUser.chats_created ?? 0)
          };
          setUser(normalizedUser);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
        } else {
          console.warn("Skipping profile sync: Backend returned non-JSON or error response.");
        }
      } catch (err) {
        console.error("Failed to sync profile", err);
      }
    }

    syncProfile();
  }, [token, apiUrl, setUser]);

  if (!mounted) return null;

  const isLogin = pathname === '/login';
  const isNovaAI = pathname === '/nova-ai';
  const isCompanyDetail = pathname.startsWith('/research/') && pathname !== '/research' && !isNovaAI;

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
          <main className={`flex-1 overflow-y-auto scroll-smooth relative z-10 ${isNovaAI || isCompanyDetail ? 'px-0 py-4 mobile-ui:p-8' : 'p-4 mobile-ui:p-8'}`}>
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
