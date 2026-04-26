"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Star, Zap } from "lucide-react";
import Loading from "../components/Loading";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NovaAIPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, incrementMessageCount, updateUsage, deleteChat } =
    useAuthStore();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  const sub = user?.subscription || "NONE";
  const hasAccess = sub === "PLUS" || sub === "PRO";

  const MAX_MESSAGES = sub === "PRO" ? 50 : 30;
  const currentMessages = user?.messageCount || 0;
  const isLimitReached = currentMessages >= MAX_MESSAGES;

  const canRecreate = sub === "PRO" && (user?.chatsCreated || 0) < 3;

  const createNewChat = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Analysis" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveChatId(data.id);
        return data.id;
      }
    } catch (err) {
      console.error("Failed to create new chat session", err);
    }
    return null;
  };

  const handleDeleteChat = async () => {
    if (!canRecreate) return;

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      // First delete current history
      const res = await fetch(`${apiUrl}/api/chat/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        deleteChat();
        setMessages([]);
        // Then initialize a fresh session ID
        await createNewChat();
      }
    } catch (err) {
      console.error("Failed to reset chat session", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight + 1000,
            behavior:
              isInitialLoad.current && messages.length > 0 ? "auto" : "smooth",
          });
          if (messages.length > 0) {
            isInitialLoad.current = false;
          }
        }
      }, 150);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function initChat() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      try {
        // 1. Fetch existing chats to find the active one
        const chatsRes = await fetch(`${apiUrl}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let targetId = null;
        if (chatsRes.ok) {
          const chats = await chatsRes.json();
          if (chats && chats.length > 0) {
            targetId = chats[0].id; // Use the most recent chat
            setActiveChatId(targetId);
          }
        }

        // 2. If no chat exists, create one
        if (!targetId) {
          targetId = await createNewChat();
        }

        // 3. Load history for the active chat
        if (targetId) {
          const historyRes = await fetch(
            `${apiUrl}/api/chat/${targetId}/history`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (historyRes.ok) {
            const history = await historyRes.json();
            setMessages(history);
          }
        }
      } catch (err) {
        console.error("Failed to initialize AI session", err);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isLimitReached) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createNewChat();
    }
    if (!chatId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    incrementMessageCount();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/api/chat/${chatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage.content }],
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch AI response");

      // Real-Time Sync: Use backend's accountant response to update usage instantly
      if (
        result.messageCount !== undefined ||
        result.message_count !== undefined
      ) {
        const count = Number(result.messageCount ?? result.message_count);
        const resets = result.chatsCreated ?? result.chats_created;
        updateUsage(count, resets);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            result.content ||
            result.message?.content ||
            result.choices?.[0]?.message?.content ||
            "Error: No content received",
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message || "Something went wrong."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-md mx-auto"
        >
          <div className="w-24 h-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,229,255,0.2)] border border-accent/20">
            <Star className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter mb-4">
            Nova AI is Restricted
          </h1>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Intelligent market analysis is a premium feature. Please upgrade to{" "}
            <span className="text-foreground font-bold underline decoration-accent/50 underline-offset-4">
              Nova PLUS
            </span>{" "}
            or{" "}
            <span className="text-foreground font-bold underline decoration-purple-400/50 underline-offset-4">
              PRO
            </span>{" "}
            to unlock full access to DeepSeek-V3 intelligence.
          </p>
          <button
            onClick={() => router.push("/upgrade")}
            className="bg-accent text-accent-foreground px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,229,255,0.4)] hover:shadow-[0_10px_50px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Explore Plans
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 flex flex-col overflow-y-auto scroll-smooth"
    >
      <div className="flex-1 flex flex-col relative max-w-4xl mx-auto w-full min-h-full">
        <div
          className={`flex-1 p-6 md:p-8 space-y-6 pb-24 transition-all duration-700`}
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Bot className="w-20 h-20 text-accent mb-6" />
              <p className="text-lg font-medium">
                How can I assist your portfolio today?
              </p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-lg ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground font-medium"
                      : "bg-foreground/5 backdrop-blur-md text-foreground border border-foreground/10"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-foreground/5 backdrop-blur-md border border-foreground/10 rounded-2xl px-6 py-4 text-sm text-accent animate-pulse">
                Nova is thinking...
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="sticky bottom-0 w-full pb-8 flex flex-col items-center justify-end pointer-events-none z-30">
          <AnimatePresence>
            {isLimitReached && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="mb-4 px-6 py-4 bg-danger/20 backdrop-blur-xl border border-danger/50 text-danger rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] pointer-events-auto max-w-sm text-center"
              >
                <p className="text-sm font-bold mb-2">
                  Chat session messages count exceeded
                </p>
                <p className="text-[10px] opacity-80 leading-relaxed mb-4">
                  {sub === "PRO"
                    ? "Please delete this chat to create a new one."
                    : "Please update your subscription for more messages per chat."}
                </p>
                {canRecreate && (
                  <button
                    onClick={handleDeleteChat}
                    className="bg-danger text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Delete & Reset Chat
                  </button>
                )}
                {!canRecreate && (
                  <button
                    onClick={() => router.push("/upgrade")}
                    className="bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Upgrade Plan
                  </button>
                )}
              </motion.div>
            )}

            {input.length > 300 && !isLimitReached && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="mb-3 px-4 py-2 bg-danger/20 backdrop-blur-md border border-danger/50 text-danger text-xs font-bold rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)] pointer-events-auto"
              >
                Message is too long (Max 300 characters)
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSend}
            className={`relative z-30 flex items-center w-[75%] focus-within:w-[95%] transition-all duration-300 ease-in-out px-2 pointer-events-auto ${!hasAccess || isLimitReached ? "blur-md pointer-events-none opacity-50" : ""}`}
          >
            {/* Embedded Actions (Left) */}
            <div className="absolute left-6 z-10 flex items-center gap-3">
              {sub === "PRO" && (
                <button
                  type="button"
                  onClick={handleDeleteChat}
                  disabled={!canRecreate || messages.length === 0}
                  className="p-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl border border-foreground/10 transition-all active:scale-90 disabled:opacity-20 cursor-pointer"
                  title="Reset Session"
                >
                  <Zap className="w-3.5 h-3.5 text-accent" />
                </button>
              )}
              {hasAccess && (
                <div className="bg-foreground/5 border border-foreground/10 px-3 py-1 rounded-lg">
                  <span
                    className={`text-[10px] font-mono font-bold ${isLimitReached ? "text-danger" : "text-accent"}`}
                  >
                    {currentMessages}/{MAX_MESSAGES}
                  </span>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              disabled={!hasAccess || isLimitReached}
              type="text"
              placeholder={isLimitReached ? "Limit Reached" : "Message"}
              className={`w-full bg-background/60 backdrop-blur-xl border ${input.length > 300 ? "border-danger/50 ring-1 ring-danger/50 bg-danger/5" : "border-foreground/10"} rounded-full py-5 ${sub === "PRO" ? "pl-36" : "pl-26"} pr-24 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.2)]`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div
              className={`absolute right-16 text-[10px] font-mono font-medium transition-opacity duration-300 pointer-events-none ${input.length > 250 ? "opacity-100" : "opacity-0"} ${input.length > 300 ? "text-danger drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" : "text-muted-foreground"}`}
            >
              {input.length}/300
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !input.trim() ||
                input.length > 300 ||
                !hasAccess ||
                isLimitReached
              }
              className={`absolute right-4 p-2.5 rounded-full transition-all cursor-pointer ${
                input.length > 300 || isLimitReached
                  ? "bg-danger/10 text-danger opacity-50 cursor-not-allowed"
                  : "bg-transparent text-muted-foreground hover:text-accent hover:bg-accent/10 disabled:opacity-20"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          {/* THE OVERLAY: Absolute at bottom, high Z-index to hide messages */}
          <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none z-20 overflow-hidden">
            {/* LAYER 1: The standard vertical fade for the whole width */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* LAYER 2: The Right-Side Anchor with a VERTICAL fade added */}
            {/* We use a linear-gradient to go from solid #0c0f1b at the bottom to transparent at the top */}
            <div
              className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0c0f1b] to-transparent"
              style={{
                maskImage:
                  "linear-gradient(to top, black 20%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 20%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
