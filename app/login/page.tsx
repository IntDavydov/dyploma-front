"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { LineChart, Briefcase, Activity } from "lucide-react";

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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Authentication failed");

      login(data.user, data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/research");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (credentialResponse: any) => {
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Google authentication failed");

      login(data.user, data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/research");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 bg-card rounded-3xl border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-6">
            <LineChart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Global Shop-Sync</h1>
          <p className="text-muted-foreground text-center">Enterprise Market & Logistics Gateway</p>
        </div>

        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-3 text-sm text-foreground mb-2">
              <Briefcase className="w-4 h-4 text-accent" />
              <span>Real-time portfolio management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Activity className="w-4 h-4 text-accent" />
              <span>AI-driven market sentiment</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {isLoginMode ? "Sign In" : "Create Account"}
              </label>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            </div>

            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl transition-all"
            >
              {loading ? "Loading..." : (isLoginMode ? "Sign In" : "Create Account")}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError("");
                setUsername("");
                setPassword("");
              }}
              className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors"
            >
              {isLoginMode ? "Need an account? Register" : "Already have an account? Sign In"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center py-4 relative z-10">
            <div className="opacity-90 hover:opacity-100 transition-opacity">
               <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => {
                    setError("Google login failed. Please try again.");
                  }}
                  theme="filled_black"
                  shape="pill"
                  text="continue_with"
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
