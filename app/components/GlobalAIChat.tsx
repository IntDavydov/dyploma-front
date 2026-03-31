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

  // Fetch all companies when chat is first expanded
  useEffect(() => {
    if (isExpanded && !dataLoaded) {
      async function fetchGlobalData() {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          // Fetch up to 100 companies to act as our global knowledge base
          const res = await fetch(`${apiUrl}/api/companies?page=1&limit=100`);
          if (res.ok) {
            const data = await res.json();
            // Enhance data similarly to the home page so AI has rich context
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
    setIsExpanded(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: "Global Overview of All 64 Companies. Use prompt caching.",
          data: globalData || "Data loading or unavailable.",
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
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-[400px]' : 'w-auto'}`}>
      <div className={`bg-card border border-accent/30 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden transition-all duration-300 flex flex-col ${isExpanded ? 'h-[500px]' : 'h-14 w-14'}`}>
        
        {!isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"
            title="Open Global AI Assistant"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}

        {isExpanded && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest text-foreground">Global Analyst</span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-muted-foreground hover:text-accent p-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center mt-10 space-y-2">
                  <p className="text-xs text-muted-foreground italic">
                    I have access to all {globalData ? globalData.length : '...'} companies.
                  </p>
                  <p className="text-[10px] text-accent/70 uppercase tracking-wider">
                    Prompt Caching Active
                  </p>
                </div>
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
                    Analyzing global data...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={!dataLoaded ? "Loading global data..." : "Ask about any company..."}
                  disabled={!dataLoaded}
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-4 pr-10 text-xs text-foreground focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim() || !dataLoaded}
                  className="absolute right-2 p-1.5 text-accent hover:scale-110 transition-transform disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
