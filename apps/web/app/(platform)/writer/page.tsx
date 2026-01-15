"use client";

import { useState } from "react";
import { PenTool, Loader2, Wand2, Copy, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function WriterPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("engaging");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/generate-script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, tone })
        });
        
        const data = await res.json();
        if (res.ok) {
            setOutput(data.script);
        } else {
            alert("Generation failed. Please try again.");
        }
    } catch (e) {
        console.error(e);
        alert("Server error");
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <PenTool className="w-8 h-8 text-cyan-400" />
            Ghost<span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Writer</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Powered by Llama 3 on Groq</p>
        </div>
        
        <div className="flex bg-[#0b1121] rounded-lg p-1 border border-white/10">
            {['engaging', 'professional', 'funny'].map((m) => (
                <button 
                    key={m}
                    onClick={() => setTone(m)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tone === m ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    {m}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
        
        {/* Input */}
        <div className="flex flex-col gap-4">
            <div className="flex-1 relative group">
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your video idea... (e.g., A 60-second vertical script about the history of coffee)"
                    className="w-full h-full bg-[#0b1121] border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none font-mono text-sm leading-relaxed transition-all"
                />
            </div>
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(8,145,178,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Wand2 className="w-5 h-5" /> Generate Script</>}
            </button>
        </div>

        {/* Output */}
        <div className="relative bg-[#0b1121] border border-white/10 rounded-2xl p-6 overflow-hidden group flex flex-col">
            {output ? (
                <>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={copyToClipboard} className="p-2 bg-white/10 hover:bg-cyan-500 hover:text-white rounded-lg transition-colors border border-white/5">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-mono text-slate-300">
                            {output}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                    <PenTool className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-mono">AI Output will appear here</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}