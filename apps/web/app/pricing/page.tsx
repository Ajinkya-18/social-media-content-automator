"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Zap, Crown, Sparkles, CreditCard } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const router = useRouter();

  // Fetch current credits on load
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
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);

    try {
      // 1. Load SDK
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // 2. Create Order on Backend
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          plan_type: planType,
        }),
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      // 3. Initialize Razorpay Payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add this to your .env.local!
        amount: order.amount,
        currency: order.currency,
        name: "AfterGlow",
        description: `Purchase: ${planType.toUpperCase()}`,
        order_id: order.id,
        handler: async function (response: any) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          // Refresh credits
          if (user?.primaryEmailAddress?.emailAddress) {
             await fetchCredits(user.primaryEmailAddress.emailAddress);
          }
        },
        prefill: {
          email: user?.primaryEmailAddress?.emailAddress,
        },
        theme: {
          color: "#ea580c", // Orange-600
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Fuel Your <span className="text-orange-500">Creativity</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Choose a plan that fits your workflow. From casual posting to power-user automation.
        </p>
        
        {/* Credit Balance Badge */}
        {isSignedIn && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 text-sm">Your Balance:</span>
                <span className="text-white font-bold">{currentCredits ?? '...'} Credits</span>
            </div>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        
        {/* STARTER */}
        <PricingCard 
            title="Starter" 
            price="₹500" 
            period="/month"
            credits="500 Credits"
            features={["Basic AI Writer", "Standard Visualizer", "50 Video Seconds", "Email Support"]}
            icon={<Zap className="w-6 h-6 text-blue-400" />}
            onBuy={() => handleBuy('starter')}
            loading={loading}
        />

        {/* PRO (Highlighted) */}
        <div className="relative transform md:-translate-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500 to-red-600 rounded-2xl blur-sm opacity-50" />
            <PricingCard 
                title="Pro" 
                price="₹1500" 
                period="/month"
                credits="2000 Credits"
                features={["Advanced GPT-4 Writer", "HD Visualizer", "Unlimited Video Gen", "Priority Support", "Early Access Features"]}
                icon={<Crown className="w-6 h-6 text-yellow-400" />}
                highlighted
                onBuy={() => handleBuy('pro')}
                loading={loading}
            />
        </div>

        {/* TOP UP */}
        <PricingCard 
            title="Credit Top-Up" 
            price="₹100" 
            period=" one-time"
            credits="100 Credits"
            features={["Does not expire", "Add to existing plan", "Good for quick tasks"]}
            icon={<CreditCard className="w-6 h-6 text-green-400" />}
            onBuy={() => handleBuy('credits_100')}
            loading={loading}
            buttonText="Top Up Now"
        />

      </div>

      {/* FAQ / Trust Section */}
      <div className="text-center border-t border-white/5 pt-12">
        <p className="text-slate-500 text-sm">
            Payments are secured by Razorpay. <br/>
            Need a custom enterprise plan? <a href="#" className="text-orange-400 hover:underline">Contact Sales</a>
        </p>
      </div>

    </div>
  );
}

function PricingCard({ title, price, period, credits, features, icon, highlighted = false, onBuy, loading, buttonText = "Choose Plan" }: any) {
    return (
        <div className={`relative h-full flex flex-col p-8 rounded-2xl border ${highlighted ? 'bg-slate-900 border-orange-500' : 'bg-black/40 border-white/10'} transition-transform hover:scale-105 duration-300`}>
            
            <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${highlighted ? 'bg-orange-500/20' : 'bg-white/5'}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{price}</span>
                    <span className="text-slate-500 text-sm">{period}</span>
                </div>
                <div className="mt-4 px-3 py-1.5 bg-white/5 rounded-lg inline-block">
                    <span className="text-white font-bold text-sm">💎 {credits}</span>
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
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white' 
                    : 'bg-white text-black hover:bg-slate-200'
                }`}
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : buttonText}
            </button>
        </div>
    )
}