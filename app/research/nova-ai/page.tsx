"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send } from "lucide-react";
import Loading from "../../components/Loading";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NovaAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight + 1000,
            behavior: isInitialLoad.current && messages.length > 0 ? "auto" : "smooth",
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
    async function loadHistory() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/chat/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const history = await res.json();
          setMessages(history);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch AI response");

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

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 flex flex-col overflow-y-auto scroll-smooth"
    >
      <div className="flex-1 flex flex-col relative max-w-4xl mx-auto w-full min-h-full">
        {/* Scrollable area - moved overflow to the parent to move scrollbar to screen edge */}
        <div className="flex-1 p-6 md:p-8 space-y-6 pb-24">
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
                      : "bg-white/5 backdrop-blur-md text-foreground border border-white/10"
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
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-sm text-accent animate-pulse">
                Nova is thinking...
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Input Area */}
        {/*sticky bottom-0 w-full pt-4 pb-8 flex justify-center pointer-events-none from-background via-background to-transparent"*/}
        <div className="sticky bottom-0 w-full pt-4 pb-2 flex flex-col items-center justify-end pointer-events-none from-background via-background to-transparent">
          <AnimatePresence>
            {input.length > 300 && (
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
            className="relative flex items-center w-[75%] focus-within:w-[95%] transition-all duration-300 ease-in-out px-2 pointer-events-auto"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Message"
              className={`w-full bg-[#181e29]/80 backdrop-blur-xl border ${input.length > 300 ? "border-danger/50 ring-1 ring-danger/50 bg-danger/5" : "border-transparent"} rounded-full py-5 pl-7 pr-24 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 ${input.length > 300 ? "focus:ring-danger/50" : "focus:ring-accent/50"} transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]`}
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
              disabled={isLoading || !input.trim() || input.length > 300}
              className={`absolute right-4 p-2.5 rounded-full transition-all cursor-pointer ${
                input.length > 300
                  ? "bg-danger/10 text-danger opacity-50 cursor-not-allowed"
                  : "bg-transparent text-muted-foreground hover:text-accent hover:bg-accent/10 disabled:opacity-20"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
