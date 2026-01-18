"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Coins, Crown, Zap, Shield } from "lucide-react";

export default function CreditsDisplay() {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/credits?email=${user?.primaryEmailAddress?.emailAddress}`);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits_balance);
        setTier(data.subscription_tier);
      }
    } catch (e) { console.error(e); }
  };

  if (credits === null) return null;

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