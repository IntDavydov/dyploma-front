"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function GlobalAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [globalData, setGlobalData] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  useEffect(() => {
    if (isExpanded && !dataLoaded) {
      async function fetchGlobalData() {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          const res = await fetch(`${apiUrl}/api/companies?page=1&limit=100`);
          if (res.ok) {
            const data = await res.json();
            const enhancedData = data.data?.map((c: any) => ({
              id: c.id,
              name: c.name,
              region: c.region || ["North America", "Europe", "Asia Pacific", "Latin America"][Math.floor(Math.random() * 4)],
              skus: c.skus || Math.floor(Math.random() * 50000) + 5000,
              status: c.status || ["Synced", "Pending", "Offline"][Math.floor(Math.random() * 3)]
            })) || data;
            
            setGlobalData(enhancedData);
            setDataLoaded(true);
          }
        } catch (err) {
          console.error("Failed to load global data for AI:", err);
        }
      }
      fetchGlobalData();
    }
  }, [isExpanded, dataLoaded]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "Global Overview of All 64 Companies. Use prompt caching.",
          data: globalData || "Data loading or unavailable.",
          messages: [...messages, userMessage],
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error ${response.status}`);

      if (result.choices?.[0]?.message) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: result.choices[0].message.content,
        }]);
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: `Analysis Error: ${error.message || "Failed to process data."}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-[calc(100vw-2rem)] md:w-[400px]' : 'w-auto'}`}>
      <div className={`bg-card/90 backdrop-blur-xl border border-accent/30 rounded-3xl shadow-[0_0_40px_rgba(34,211,238,0.2)] overflow-hidden transition-all duration-300 flex flex-col ${isExpanded ? 'h-[75vh] md:h-[550px]' : 'h-16 w-16'}`}>
        
        {!isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center text-accent hover:bg-accent/10 transition-colors cursor-pointer active:scale-90"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}

        {isExpanded && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">Global Analyst</span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)} 
                className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-accent cursor-pointer active:scale-90 transition-transform"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center mt-12 space-y-3 opacity-50">
                  <p className="text-sm italic">Accessing database of {globalData?.length || '64'} companies...</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest">System Ready</p>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-accent text-accent-foreground font-semibold shadow-lg shadow-accent/10' 
                    : 'bg-muted/80 text-foreground border border-border shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/80 border border-border rounded-2xl px-4 py-3 text-sm text-accent animate-pulse">
                    Synthesizing response...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-5 bg-card/50 border-t border-border">
              <div className="relative flex items-center gap-3">
                <input
                  type="text"
                  placeholder={!dataLoaded ? "Syncing data..." : "Ask a question..."}
                  disabled={!dataLoaded}
                  /* 
                     CRITICAL MOBILE FIX: 
                     Font size must be 16px (text-base) to prevent iOS auto-zoom 
                  */
                  className="flex-1 bg-background border border-border rounded-2xl py-3.5 px-5 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim() || !dataLoaded}
                  className="h-12 w-12 flex items-center justify-center bg-accent text-accent-foreground rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 cursor-pointer shadow-lg shadow-accent/20"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
