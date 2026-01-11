"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Video, Loader2, Sparkles, Download, Play } from "lucide-react";
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
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          prompt: prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
            if(confirm("Insufficient credits! Would you like to buy more?")) {
                router.push("/pricing");
            }
        }
        throw new Error(data.detail || "Generation failed");
      }

      setVideoUrl(data.video_url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-4">
          <Video className="w-10 h-10 text-cyan-400" />
          AI Video <span className="text-purple-500">Studio</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Transform text into cinematic clips. Cost: <span className="text-cyan-400 font-bold">20 Credits</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* INPUT SECTION */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/5">
            <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Prompt</label>
                    <textarea 
                        required
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk city street at night with neon rain, 4k, cinematic lighting..."
                        className="w-full h-40 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all"
                    />
                </div>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button 
                    type="button" // Change to submit if form handles it, but button click works too
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Scene...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Video
                        </>
                    )}
                </button>
                <p className="text-xs text-center text-slate-500">
                    Generations typically take 15-30 seconds.
                </p>
            </form>
        </div>

        {/* OUTPUT SECTION */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-black/40 min-h-[400px] flex items-center justify-center relative overflow-hidden group">
            
            {loading ? (
                <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-cyan-400 font-medium animate-pulse">Dreaming up pixels...</p>
                </div>
            ) : videoUrl ? (
                <div className="w-full h-full flex flex-col items-center">
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop
                        className="w-full rounded-xl shadow-2xl border border-white/10"
                    />
                    <div className="flex gap-4 mt-6">
                        <a 
                            href={videoUrl} 
                            download 
                            target="_blank"
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download
                        </a>
                        <button 
                             onClick={() => setVideoUrl(null)}
                             className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-600">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Your generated video will appear here.</p>
                </div>
            )}
            
            {/* Background Glow */}
            {!videoUrl && !loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
            )}
        </div>

      </div>
    </div>
  );
}