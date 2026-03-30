"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  context: string; // e.g., "Company: Apple, Module: Inventory"
  data?: any;      // Current page data for the AI to analyze
}

export default function AIChat({ context, data }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          data,
          messages: [...messages, userMessage],
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}`);
      }

      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        const assistantMessage: Message = {
          role: "assistant",
          content: result.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response from AI gateway");
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Analysis Error: ${error.message || "Failed to process data."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 transition-all duration-300 z-50 ${isExpanded ? 'bottom-6' : 'bottom-6'}`}>
      <div className={`bg-card border border-accent/30 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden transition-all duration-300 ${isExpanded ? 'h-80' : 'h-16'}`}>
        
        {isExpanded && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">AI Market Analyst</span>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-muted-foreground hover:text-accent p-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-10 italic">
                  Ask me about this {context.toLowerCase()} data...
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'bg-muted text-foreground border border-border'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-border rounded-xl px-3 py-2 text-xs text-accent animate-pulse">
                    Analyzing...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="absolute bottom-0 left-0 w-full p-2 bg-card">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={isExpanded ? "Ask a specific question..." : "Ask AI Analyst about this data..."}
              className="w-full bg-muted border border-border rounded-xl py-3 pl-4 pr-12 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsExpanded(true)}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 text-accent hover:scale-110 transition-transform disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
