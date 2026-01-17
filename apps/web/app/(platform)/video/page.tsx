"use client";

import { useState, useEffect, Suspense } from "react"; // Added Suspense
import { useUser } from "@clerk/nextjs";
import { Video, Loader2, Sparkles, Download, Play, AlertCircle } from "lucide-react";
import { useSearchParams } from 'next/navigation'; // Added

function VideoContent() {
  const searchParams = useSearchParams(); // Added
  const { user } = useUser();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // --- BRIDGE: RECEIVE PROMPT FROM WRITER ---
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
        setPrompt(promptParam);
    }
  }, [searchParams]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !user?.primaryEmailAddress?.emailAddress) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
          prompt: prompt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVideoUrl(data.video_url);
      } else {
        alert("Generation failed: " + (data.detail || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to Video Engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
       <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider mb-4">
            <Sparkles className="w-3 h-3" /> ZEROSCOPE XL MODEL
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Video <span className="bg-gradient-to-r from-orange-400 to-red-600 text-transparent bg-clip-text">Forge</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Text-to-Video generation powered by Replicate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        <div className="bg-[#0b1121] p-8 rounded-3xl border border-white/5 flex flex-col shadow-2xl relative">
            <form onSubmit={handleGenerate} className="space-y-8 relative z-10 h-full flex flex-col">
                <div className="flex-1">
                    <label className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4 block">
                        Director's Prompt
                    </label>
                    <textarea 
                        required
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cinematic drone shot of a futuristic cyberpunk city, neon lights, rain, 4k..."
                        className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:border-orange-500 outline-none resize-none text-lg leading-relaxed font-light"
                    />
                </div>
                <button type="submit" disabled={loading || !prompt} className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 text-lg disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Video className="w-6 h-6" />}
                    {loading ? "Rendering..." : "Generate Video"}
                </button>
            </form>
        </div>

        <div className="aspect-video rounded-3xl bg-[#0b1121] border border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {loading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                    <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                    <p className="text-orange-400 font-mono text-sm mt-6 animate-pulse tracking-widest uppercase">Synthesizing Frames...</p>
                 </div>
            ) : videoUrl ? (
                <div className="relative w-full h-full group">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={videoUrl} download target="_blank" className="p-3 bg-black/50 hover:bg-orange-600 text-white rounded-full backdrop-blur-md transition-colors block">
                            <Download className="w-5 h-5" />
                         </a>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-600">
                    <Play className="w-16 h-16 opacity-20 mx-auto mb-4" />
                    <p>Ready to Render</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function VideoPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#030712]"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>}>
            <VideoContent />
        </Suspense>
    )
}