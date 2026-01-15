"use client";

import { useState } from "react";
// Ensure you have the useUser hook for email
import { useUser } from "@clerk/nextjs";
import { Layers, Twitter, Linkedin, Instagram, ArrowRight, Save, Copy, Repeat, Loader2, Sparkles, CalendarPlus, Check } from "lucide-react";
import AfterGlowToast from "../../components/AfterGlowToast";

export default function RepurposerPage() {
  const { user } = useUser(); // Get User for Calendar Sync
  const [inputContent, setInputContent] = useState("");
  const [activeTab, setActiveTab] = useState("twitter");
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState("engaging");
  
  // Scheduling State
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  
  const [results, setResults] = useState({
    twitter: "",
    linkedin: "",
    instagram: ""
  });

  const [copySuccess, setCopySuccess] = useState(false);

  const handleRemix = async () => {
    if (!inputContent) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            script: inputContent,
            tone: tone
        }),
      });

      if (!res.ok) throw new Error("Processing failed");

      const data = await res.json();
      
      setResults({
        twitter: data.twitter,
        linkedin: data.linkedin,
        instagram: data.instagram
      });

    } catch (error) {
      console.error(error);
      alert("AI Processing failed. Please check your backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = results[activeTab as keyof typeof results];
    if (text) {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // --- NEW: SCHEDULE FUNCTION ---
  const handleSchedule = async () => {
    const content = results[activeTab as keyof typeof results];
    if (!content) return;
    if (!user?.primaryEmailAddress?.emailAddress) {
        alert("Please sign in to schedule posts.");
        return;
    }

    setIsScheduling(true);

    // Default to scheduling for "Tomorrow at 10 AM" for simplicity
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.primaryEmailAddress.emailAddress,
                title: `[${activeTab.toUpperCase()}] Content Release`,
                description: content, // The AI generated text goes into the event description
                date: dateStr
            })
        });

        if (res.ok) {
            setScheduleSuccess(true);
            setTimeout(() => setScheduleSuccess(false), 3000);
        } else {
            alert("Failed to sync with Calendar. Check your permissions.");
        }
    } catch (e) {
        console.error("Schedule Error", e);
        alert("Failed to connect to scheduler.");
    } finally {
        setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider mb-3">
                <Sparkles className="w-3 h-3" />
                CONTENT ALCHEMY v2
            </div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-500" />
            Repurposer <span className="text-slate-500">Engine</span>
            </h1>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* LEFT: INPUT */}
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Script / Text</label>
                <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="bg-[#0b1121] border border-white/10 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-purple-500"
                >
                    <option value="engaging">Engaging</option>
                    <option value="professional">Professional</option>
                    <option value="witty">Witty</option>
                    <option value="controversial">Controversial</option>
                </select>
            </div>
            <textarea 
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Paste your video script, blog post, or rough notes here..."
                className="flex-1 bg-[#0b1121] border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar transition-all"
            />
            <button 
                onClick={handleRemix}
                disabled={isLoading || !inputContent}
                className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        Transmuting...
                    </>
                ) : (
                    <>
                        <Repeat className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
                        Generate 3 Variations
                    </>
                )}
            </button>
        </div>

        {/* RIGHT: OUTPUT TABS */}
        <div className="bg-[#0b1121] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20">
                {[
                    { id: 'twitter', icon: Twitter, label: 'Twitter Thread', color: 'text-blue-400' },
                    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
                    { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all border-b-2 ${
                            activeTab === tab.id 
                            ? `border-purple-500 bg-white/5 text-white` 
                            : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Output Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative bg-[#0b1121]">
                {results[activeTab as keyof typeof results] ? (
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                        {results[activeTab as keyof typeof results]}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <Layers className="w-12 h-12 mb-4" />
                        <p className="text-sm">AI Output will appear here</p>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">
                    {results[activeTab as keyof typeof results] ? `${results[activeTab as keyof typeof results].length} characters` : '0 chars'}
                </span>
                
                <div className="flex gap-2">
                    <button 
                        onClick={copyToClipboard}
                        disabled={!results[activeTab as keyof typeof results]}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {copySuccess ? "Copied!" : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                    
                    {/* NEW: SCHEDULE BUTTON */}
                    <button 
                        onClick={handleSchedule}
                        disabled={isScheduling || !results[activeTab as keyof typeof results]}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            scheduleSuccess 
                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isScheduling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : scheduleSuccess ? (
                            <Check className="w-3 h-3" />
                        ) : (
                            <CalendarPlus className="w-3 h-3" />
                        )}
                        {scheduleSuccess ? "Added to Timeline" : "Schedule"}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}