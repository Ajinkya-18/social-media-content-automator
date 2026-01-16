"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Video, Loader2, Sparkles, Download, Play, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VideoPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) return; //removed { router.push("/sign-in"); }

    setLoading(true);
    // setError(null);
    // setVideoUrl(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress, // <--- SENT
          prompt: prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed");
      setVideoUrl(data.video_url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            ZEROSCOPE v2 MODEL READY
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          <span className="text-slate-500">AI</span> Video <span className="bg-gradient-to-r from-orange-400 to-amber-600 text-transparent bg-clip-text">Forge</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Describe your vision. The engine renders it. Cost: <span className="text-cyan-400 font-bold">20 Credits</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* INPUT: Dark Tech Feel */}
        <div className="p-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5">
            <div className="bg-[#0b1121] p-8 rounded-xl border border-white/5 h-full">
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">Prompt Input</label>
                        <textarea 
                            required
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A cyberpunk city street at night with neon rain, 4k, cinematic lighting..."
                            className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none transition-all font-mono text-sm leading-relaxed"
                        />
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono">
                            ERROR: {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="animate-pulse">Rendering...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Generate Sequence
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>

        {/* OUTPUT: Cinema Feel */}
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-1000" />
            <div className="relative bg-[#020617] rounded-2xl border border-white/10 aspect-video flex items-center justify-center overflow-hidden">
                
                {loading ? (
                    <div className="text-center space-y-6">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-t-4 border-orange-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-r-4 border-cyan-500 rounded-full animate-spin reverse"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-bold tracking-widest text-sm">INITIALIZING RENDER</p>
                            <p className="text-slate-500 text-xs font-mono">Allocating GPU Cluster...</p>
                        </div>
                    </div>
                ) : videoUrl ? (
                    <div className="w-full h-full relative group/video">
                        <video 
                            src={videoUrl} 
                            controls 
                            autoPlay 
                            loop
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
                             <a href={videoUrl} download target="_blank" className="p-2 bg-black/60 hover:bg-orange-600 text-white rounded-lg backdrop-blur-md transition-colors">
                                <Download className="w-4 h-4" />
                             </a>
                             <button onClick={() => setVideoUrl(null)} className="p-2 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors">
                                <Sparkles className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Play className="w-8 h-8 text-slate-700 ml-1" />
                        </div>
                        <p className="text-slate-600 font-mono text-sm">Awaiting Input Stream</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}