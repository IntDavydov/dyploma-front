"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import Loading from "../components/Loading";

const tiers = [
  {
    name: "GO",
    price: "$10",
    description: "Perfect for casual traders looking for an edge.",
    features: [
      "Real-time AI Risk Signals",
      "Advanced Market Screener",
      "Live Historical Charts",
      "Email Alert Support"
    ],
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    sub: "GO"
  },
  {
    name: "PLUS",
    price: "$100",
    description: "Our most popular plan for active researchers.",
    features: [
      "Everything in GO",
      "Nova AI Chat Integration",
      "30 Messages per chat session",
      "1 Chat session per month",
      "Priority API Access"
    ],
    icon: Star,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    sub: "PLUS",
    popular: true
  },
  {
    name: "PRO",
    price: "$250",
    description: "The ultimate power for professional analysts.",
    features: [
      "Everything in PLUS",
      "50 Messages per chat session",
      "3 Chat recreations per month",
      "Deep-dive Financial Reports",
      "24/7 Concierge Support"
    ],
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    sub: "PRO"
  }
];

export default function UpgradePage() {
  const { user, updateSubscription, setUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleUpgrade = async (tier: any) => {
    setLoading(tier.sub);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${apiUrl}/api/user/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: tier.sub.toLowerCase() })
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const errorText = !contentType?.includes("application/json") ? "Backend error (non-JSON)" : (await res.json()).error;
        throw new Error(errorText || "Upgrade failed");
      }

      const data = await res.json();

      if (res.ok) {
        // Fetch fresh profile from /me as requested to ensure perfect sync
        const meRes = await fetch(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const meContentType = meRes.headers.get("content-type");
        if (meRes.ok && meContentType && meContentType.includes("application/json")) {
          const remoteUser = await meRes.json();
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
          // Fallback if /me fails or returns HTML
          updateSubscription(tier.sub);
        }
        
        router.push('/research');
      } else {
        console.error("Upgrade failed:", data.error);
        alert(`Upgrade failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Network error during upgrade:", err);
    } finally {
      setLoading(null);
    }
  };

  if (pageLoading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h2 className="text-accent font-bold tracking-[0.3em] uppercase text-sm mb-4">Pricing Plans</h2>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
          Unleash the power of Nova
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the plan that fits your trading strategy. All plans include 30-second live polling and basic ledger tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {tiers.map((tier, i) => {
          const Icon = tier.icon;
          const isCurrent = user?.subscription === tier.sub;

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card/40 backdrop-blur-xl border ${tier.borderColor} rounded-3xl p-8 shadow-2xl flex flex-col h-full group hover:border-accent/40 transition-colors duration-500 ${tier.popular ? 'ring-2 ring-accent ring-offset-4 ring-offset-background' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl ${tier.bgColor} ${tier.color} flex items-center justify-center mb-6`}>
                <Icon className="w-6 h-6" />
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground font-medium">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{tier.description}</p>

              <div className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 ${tier.color} mt-0.5 shrink-0`} />
                    <span className="text-sm text-foreground/80 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(tier)}
                disabled={isCurrent || loading !== null}
                className={`w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                  isCurrent 
                  ? 'bg-muted text-muted-foreground cursor-default'
                  : 'bg-accent text-accent-foreground hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] cursor-pointer'
                }`}
              >
                {loading === tier.sub ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block"></span>
                ) : isCurrent ? "Current Plan" : `Upgrade to ${tier.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 bg-card/20 border border-border/50 rounded-3xl p-8 text-center max-w-3xl mx-auto backdrop-blur-md">
         <h4 className="text-foreground font-bold mb-2">Need a Custom Enterprise Solution?</h4>
         <p className="text-sm text-muted-foreground mb-6">Contact our sales team for unlimited API access, multi-seat licenses, and high-frequency trading dedicated endpoints.</p>
         <button className="text-accent font-bold uppercase tracking-widest text-xs hover:underline cursor-pointer">
           Talk to Sales &rarr;
         </button>
      </div>
    </div>
  );
}
