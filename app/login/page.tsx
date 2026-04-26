"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Star, User, Lock, ArrowRight, ShieldCheck, Globe, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const errorText = !contentType?.includes("application/json") ? "System maintenance (Non-JSON response)" : (await res.json()).error;
        throw new Error(errorText || "Authentication failed");
      }

      const data = await res.json();

      const normalizedUser = {
        ...data.user,
        name: data.user.username || data.user.name,
        subscription: (data.user.subscriptionTier || data.user.subscription || 'NONE').toUpperCase(),
        messageCount: Number(data.user.messageCount ?? data.user.message_count ?? 0),
        chatsCreated: Number(data.user.chatsCreated ?? data.user.chats_created ?? 0)
      };

      login(normalizedUser, data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      router.push("/research");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Google authentication failed (Invalid backend response)");
      }

      const data = await res.json();
      
      const normalizedUser = {
        ...data.user,
        name: data.user.username || data.user.name,
        subscription: (data.user.subscriptionTier || data.user.subscription || 'NONE').toUpperCase(),
        messageCount: Number(data.user.messageCount ?? data.user.message_count ?? 0),
        chatsCreated: Number(data.user.chatsCreated ?? data.user.chats_created ?? 0)
      };

      login(normalizedUser, data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      router.push("/research");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access
  const handleDemoBypass = () => {
    const demoUser = {
      id: "demo-user",
      name: "Demo Investor",
      email: "demo@nova-invest.io",
      picture: "",
      balance: 100000,
      subscription: 'PRO' as const
    };
    login(demoUser, "demo-token");
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify(demoUser));
    router.push("/research");
  };

  return (
    <div 
      className="flex-1 min-h-screen w-full flex flex-col items-center justify-center bg-[#090E17] relative overflow-hidden selection:bg-accent/30 selection:text-accent"
      style={{ minHeight: '100dvh' }}
    >
      
      {/* Spaceship Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[50%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] relative z-10 px-4 m-auto"
      >
        <div className="bg-[#111827]/60 backdrop-blur-3xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
          {/* Subtle Shimmer edge */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_5s_infinite] pointer-events-none"></div>

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6 md:mb-10 text-center relative z-10">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)] mb-4 md:mb-8 relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
               <Star className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 md:mb-3 flex items-center gap-2">
              Nova <span className="text-accent drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">Invest</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-wide uppercase flex items-center gap-2">
               <Globe className="w-3.5 h-3.5" /> Next-Gen Trading Terminal
            </p>
          </div>

          <div className="space-y-5 md:space-y-8 relative z-10">
            {/* Feature Badges */}
            <div className="flex justify-center gap-3">
               <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-bold text-foreground/80 uppercase tracking-widest shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-accent" /> Secure
               </div>
               <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-bold text-foreground/80 uppercase tracking-widest shadow-sm">
                  <Zap className="w-3 h-3 text-emerald-400" /> Real-time
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 md:p-4 bg-danger/10 border border-danger/20 rounded-xl md:rounded-2xl text-danger text-xs font-bold flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0"></div>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 md:space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <input
                    type="text"
                    placeholder="Operator Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#090E17]/60 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <input
                    type="password"
                    placeholder="Access Key"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#090E17]/60 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group h-12 md:h-14 overflow-hidden rounded-xl md:rounded-2xl bg-accent text-accent-foreground font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,229,255,0.3)] hover:shadow-[0_10px_40px_rgba(0,229,255,0.5)] transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-45deg]"></div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Authorizing..." : (isLoginMode ? "Establish Link" : "Initialize Account")}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError("");
                  setUsername("");
                  setPassword("");
                }}
                className="w-full text-[9px] md:text-[10px] text-muted-foreground hover:text-white font-bold uppercase tracking-[0.25em] transition-colors pt-1"
              >
                {isLoginMode ? "Request New Credential &rarr;" : "Return to Login Console &rarr;"}
              </button>
            </form>

            <div className="relative flex items-center py-1 md:py-2">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Auth</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 relative z-10">
              <div className="opacity-90 hover:opacity-100 transition-opacity flex justify-center scale-105 md:scale-110">
                 <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => setError("Google protocol failed.")}
                    theme="filled_black"
                    shape="pill"
                    text="continue_with"
                  />
               </div>

               <button 
                  onClick={handleDemoBypass}
                  className="w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-2"
               >
                 <ArrowRight className="w-3 h-3 text-accent" /> System Demo Bypass
               </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 md:mt-8 text-center text-[9px] md:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.4em]">
           &copy; 2026 Nova Global Shop-Sync Gateway
        </p>
      </motion.div>
    </div>
  );
}
