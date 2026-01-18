"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

type CreditsContextType = {
  credits: number | null;
  tier: string;
  refreshCredits: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string>("free");

  const fetchCredits = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      // Add a timestamp to prevent browser caching
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/credits?email=${user.primaryEmailAddress.emailAddress}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits_balance);
        setTier(data.subscription_tier);
      }
    } catch (e) {
      console.error("Failed to fetch credits:", e);
    }
  };

  // Initial fetch when user loads
  useEffect(() => {
    fetchCredits();
  }, [user]);

  return (
    <CreditsContext.Provider value={{ credits, tier, refreshCredits: fetchCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}