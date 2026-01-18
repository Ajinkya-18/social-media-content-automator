"use client";

import { Coins, Crown, Zap, Shield } from "lucide-react";
import { useCredits } from "./CreditsContext"; // Import hook

export default function CreditsDisplay() {
  // Use the shared state
  const { credits, tier } = useCredits();

  if (credits === null) return null; // or a loading skeleton

  return (
    <div className="flex items-center gap-3 bg-[#0b1121] border border-white/10 px-3 py-1.5 rounded-full shadow-lg ml-4">
      {/* Tier Badge */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
        tier === 'pro' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
        tier === 'standard' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
      }`}>
        {tier === 'pro' ? <Crown className="w-3 h-3" /> : tier === 'standard' ? <Zap className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
        {tier}
      </div>

      {/* Credits Balance */}
      <div className="flex items-center gap-1.5 text-orange-400">
        <Coins className="w-3.5 h-3.5" />
        <span className="text-sm font-bold font-mono">{credits}</span>
      </div>
    </div>
  );
}