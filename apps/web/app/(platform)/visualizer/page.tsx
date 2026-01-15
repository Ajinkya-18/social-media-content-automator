"use client";

import { useState } from "react";
import { generateImage } from "../../actions/image"; 
import { useUser } from "@clerk/nextjs";
import AfterGlowToast from '../../components/AfterGlowToast';
import { Eye, Loader2, Image as ImageIcon, Download, Sparkles, Wand2, Layers, Save } from "lucide-react";

export default function VisualizerPage() {
  const { user } = useUser();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // New Drive State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessLink, setUploadSuccessLink] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await generateImage(prompt, aspectRatio);
      if (response.success && response.imageUrl) {
        setResult(response.imageUrl);
      } else {
        alert("Generation failed. Please check your credits.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!result) return;
    if (!user?.primaryEmailAddress?.emailAddress) {
        alert("Please sign in.");
        return;
    }
    
    setIsUploading(true);
    try {
        // 1. Fetch image as blob/base64 from URL (since it's an external replicate URL)
        const imgRes = await fetch(result);
        const blob = await imgRes.blob();
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            // 2. Send to Backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/save-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.primaryEmailAddress!.emailAddress,
                    image_data: base64data,
                    file_name: `AfterGlow_${Date.now()}`
                })
            });

            const data = await res.json();
            if (res.ok) {
                setUploadSuccessLink(data.link);
            } else {
                alert("Upload failed: " + data.detail);
            }
            setIsUploading(false);
        };
    } catch (e) {
        console.error(e);
        alert("Failed to save image.");
        setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      {/* ... Header and Input Form (Same as before) ... */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-1 bg-[#0b1121] p-6 rounded-3xl border border-white/5 flex flex-col shadow-2xl relative overflow-hidden h-full">
            <form onSubmit={handleGenerate} className="space-y-6 relative z-10 flex-1 flex flex-col">
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                        <Wand2 className="w-4 h-4" /> Vision Prompt
                    </label>
                    <textarea 
                        required
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk city with neon rain..."
                        className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none resize-none transition-all text-sm"
                    />
                </div>
                {/* ... Aspect Ratio Code ... */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                        <Layers className="w-4 h-4" /> Dimensions
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ label: "16:9", desc: "YouTube" }, { label: "1:1", desc: "Social" }, { label: "9:16", desc: "Story" }].map((ratio) => (
                            <button type="button" key={ratio.label} onClick={() => setAspectRatio(ratio.label)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${aspectRatio === ratio.label ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-white"}`}>
                                <span className="font-bold text-sm">{ratio.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={loading || !prompt} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 mt-auto">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                    {loading ? "Synthesizing..." : "Generate Visual"}
                </button>
            </form>
        </div>

        {/* OUTPUT PANEL */}
        <div className="lg:col-span-2 aspect-square lg:aspect-auto min-h-[500px] rounded-3xl bg-[#0b1121] border border-white/5 flex items-center justify-center relative overflow-hidden group/output shadow-2xl">
            {loading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                    <Loader2 className="w-20 h-20 text-cyan-400 animate-spin" />
                    <p className="text-cyan-400 font-mono text-sm mt-8 animate-pulse tracking-widest uppercase">Rendering Pixels...</p>
                 </div>
            ) : result ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result} alt="Generated" className="w-full h-full object-contain transition-transform duration-1000 group-hover/output:scale-105 relative z-10" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover/output:translate-y-0 transition-transform duration-300 z-20 flex justify-center gap-4">
                         <a href={result} download="afterglow.png" target="_blank" className="px-6 py-3 bg-white text-black hover:bg-cyan-50 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg cursor-pointer">
                            <Download className="w-4 h-4" /> Download
                         </a>
                         <button onClick={handleSaveToDrive} disabled={isUploading} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/10">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save to Drive
                         </button>
                    </div>
                </>
            ) : (
                <div className="text-center text-slate-600">
                    <ImageIcon className="w-10 h-10 opacity-40 mx-auto mb-4" />
                    <p>Enter a prompt to start dreaming.</p>
                </div>
            )}
        </div>
      </div>

      {uploadSuccessLink && (
        <AfterGlowToast fileLink={uploadSuccessLink} onClose={() => setUploadSuccessLink(null)} type="Visual" />
      )}
    </div>
  );
}