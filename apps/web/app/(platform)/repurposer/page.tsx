"use client";

import { useState } from "react";
import { Upload, Loader2, Scissors, Download, Youtube, Instagram, Sparkles, Zap } from "lucide-react";

export default function RepurposerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        setFile(file);
        setStatus('uploading');
        // Simulate Upload & Processing Steps
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setProgress(p);
            
            // Switch from uploading to processing halfway
            if (p > 30 && status !== 'processing') setStatus('processing');
            
            if (p >= 100) {
                clearInterval(interval);
                setStatus('done');
            }
        }, 100); // 5 second simulation
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            AGENTIC VIDEO EDITOR
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Content <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 text-transparent bg-clip-text">Alchemy</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload one long-form video. The AI extracts <span className="text-orange-400 font-bold">3 Viral Shorts</span> automatically.
        </p>
      </div>

      <div className="glass-panel p-1 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 max-w-4xl mx-auto">
        <div className="bg-[#0b1121] rounded-[22px] min-h-[500px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            
            {/* STATE 1: IDLE / UPLOAD */}
            {status === 'idle' && (
                <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative w-32 h-32 rounded-full bg-[#0f172a] border-2 border-dashed border-slate-700 group-hover:border-orange-500 flex items-center justify-center transition-all">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleUpload} accept="video/*" />
                            <Upload className="w-12 h-12 text-slate-500 group-hover:text-orange-400 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Drop your Source File</h3>
                        <p className="text-slate-500 mt-2">MP4, MOV • Up to 1GB</p>
                    </div>
                </div>
            )}

            {/* STATE 2: PROCESSING */}
            {(status === 'uploading' || status === 'processing') && (
                <div className="w-full max-w-md space-y-10 text-center relative z-10">
                     <div className="relative w-40 h-40 mx-auto">
                        {/* Circular Progress */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#1e293b" strokeWidth="8" />
                            <circle 
                                cx="80" cy="80" r="70" fill="none" stroke="url(#gradient)" strokeWidth="8" 
                                strokeDasharray="440" 
                                strokeDashoffset={440 - (440 * progress / 100)} 
                                strokeLinecap="round"
                                className="transition-all duration-300 ease-linear" 
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{progress}%</span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white animate-pulse">
                            {status === 'uploading' ? 'Uploading Source...' : 'AI Processing...'}
                        </h3>
                        <div className="flex justify-center gap-2 text-sm font-mono text-cyan-400 bg-cyan-900/10 py-1 px-3 rounded-full mx-auto w-fit border border-cyan-500/20">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {progress < 40 ? 'Transcribing Audio...' : progress < 70 ? 'Detecting Viral Hooks...' : 'Reframing to 9:16...'}
                        </div>
                     </div>
                </div>
            )}

            {/* STATE 3: RESULTS */}
            {status === 'done' && (
                <div className="w-full animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Scissors className="w-6 h-6 text-orange-400" /> 
                                <span className="bg-gradient-to-r from-orange-400 to-amber-500 text-transparent bg-clip-text">3 Clips Generated</span>
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">AI Score: 98/100 Viral Potential</p>
                        </div>
                        <button onClick={() => setStatus('idle')} className="text-sm font-bold text-slate-500 hover:text-white transition-colors px-4 py-2 hover:bg-white/5 rounded-lg">
                            Process New Video
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Fake Generated Clips */}
                        {[
                            { title: "The Plot Twist", score: 98, color: "text-green-400", border: "border-green-500/50" },
                            { title: "Funniest Moment", score: 92, color: "text-cyan-400", border: "border-cyan-500/50" },
                            { title: "Hot Take", score: 89, color: "text-orange-400", border: "border-orange-500/50" }
                        ].map((clip, i) => (
                            <div key={i} className={`group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all shadow-2xl`}>
                                {/* Thumbnail Placeholder */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-700">
                                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
                                </div>

                                {/* Viral Badge */}
                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                    <span className={`inline-block px-2 py-1 bg-black/60 backdrop-blur-md rounded border ${clip.border} ${clip.color} text-xs font-bold`}>
                                        VIRAL SCORE: {clip.score}
                                    </span>
                                </div>

                                {/* Actions Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h4 className="text-white font-bold text-lg mb-4 leading-tight">"{clip.title}"</h4>
                                    
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                            <Download className="w-4 h-4" /> Download 4K
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2.5 bg-[#ff0000] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-600 transition-colors">
                                                <Youtube className="w-4 h-4" /> Shorts
                                            </button>
                                            <button className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                                <Instagram className="w-4 h-4" /> Reels
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}