"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Zap, Crown, Sparkles, CreditCard, Box } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchCredits(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const fetchCredits = async (email: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/credits?email=${email}`);
      const data = await res.json();
      setCurrentCredits(data.credits_balance);
    } catch (e) {
      console.error("Failed to fetch credits", e);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuy = async (planType: string) => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    setLoading(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) { alert("Razorpay SDK failed to load."); return; }

      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress, plan_type: planType }),
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "AfterGlow v2",
        description: `Upgrade: ${planType.toUpperCase()}`,
        order_id: order.id,
        handler: async function (response: any) {
          alert(`Success! Payment ID: ${response.razorpay_payment_id}`);
          if (user?.primaryEmailAddress?.emailAddress) await fetchCredits(user.primaryEmailAddress.emailAddress);
        },
        prefill: { email: user?.primaryEmailAddress?.emailAddress },
        theme: { color: "#f97316" }, // Orange-500
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Invest in <span className="bg-gradient-to-r from-orange-400 to-amber-600 text-transparent bg-clip-text">Performance</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Credits subscription for AI generation and AfterGlow.
        </p>
        
        {isSignedIn && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/30">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-orange-200 text-sm font-bold tracking-wide">BALANCE:</span>
                <span className="text-white font-mono font-bold">{currentCredits ?? '...'} CREDITS</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        
        {/* STARTER */}
        <PricingCard 
            title="Starter" 
            price="₹999" 
            period="/mo"
            credits="250"
            features={["Basic Analytics", "Standard Sync", "Email Support"]}
            icon={<Box className="w-6 h-6 text-cyan-400" />}
            onBuy={() => handleBuy('starter')}
            loading={loading}
        />

        {/* PRO (Highlighted - Orange/Amber) */}
        <div className="relative transform md:-translate-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500 to-red-600 rounded-2xl blur opacity-30" />
            <PricingCard 
                title="Pro Suite" 
                price="₹2499" 
                period="/mo"
                credits="500"
                features={["Advanced AI Models", "Priority Rendering", "Unlimited Sync", "Agentic Features (Beta)"]}
                icon={<Crown className="w-6 h-6 text-amber-400" />}
                highlighted
                onBuy={() => handleBuy('pro')}
                loading={loading}
            />
        </div>

        {/* TOP UP */}
        <PricingCard 
            title="Credit Top-Up" 
            price="₹499" 
            period=""
            credits="100"
            features={["Never Expires", "Add to any plan", "Pay as you go"]}
            icon={<CreditCard className="w-6 h-6 text-green-400" />}
            onBuy={() => handleBuy('credits_100')}
            loading={loading}
            buttonText="Top Up"
        />

      </div>
    </div>
  );
}

function PricingCard({ title, price, period, credits, features, icon, highlighted = false, onBuy, loading, buttonText = "Choose Plan" }: any) {
    return (
        <div className={`relative h-full flex flex-col p-8 rounded-2xl border ${highlighted ? 'bg-[#0f172a] border-orange-500 shadow-2xl shadow-orange-900/20' : 'bg-white/5 border-white/10'} transition-all hover:scale-105 duration-300`}>
            
            <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${highlighted ? 'bg-orange-500/20' : 'bg-white/5'}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{price}</span>
                    <span className="text-slate-500 text-sm">{period}</span>
                </div>
                <div className="mt-4 px-3 py-1.5 bg-white/5 rounded-lg inline-block border border-white/5">
                    <span className="text-cyan-300 font-bold text-sm">💎 {credits} Credits</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 ${highlighted ? 'text-orange-400' : 'text-slate-500'}`} />
                        {feat}
                    </li>
                ))}
            </ul>

            <button 
                onClick={onBuy}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    highlighted 
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg' 
                    : 'bg-white text-black hover:bg-slate-200'
                }`}
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : buttonText}
            </button>
        </div>
    )
}