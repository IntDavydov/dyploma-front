import { TrendingUp } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <div className="relative">
        {/* Animated outer ring */}
        <div className="w-16 h-16 border-2 border-slate-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-accent rounded-full animate-spin"></div>
        
        {/* Pulsing Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-accent animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] animate-pulse">
        Market Syncing...
      </p>
    </div>
  );
}