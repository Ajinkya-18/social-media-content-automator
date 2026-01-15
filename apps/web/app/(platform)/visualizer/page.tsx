"use client";

import { useState } from "react";
// Keep your existing working action
import { generateImage } from "../../actions/image"; 
// Keep your existing working hooks/components
import { useGoogleDriveImage } from "../../hooks/useGoogleDriveImage";
import AfterGlowToast from '../../components/AfterGlowToast';

import { 
  Eye, Loader2, Image as ImageIcon, Download, 
  Sparkles, Wand2, Share2, Layers 
} from "lucide-react";

export default function VisualizerPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Destructure your Drive hook
  const { 
    saveImageToDrive, 
    isUploading, 
    uploadSuccessLink, 
    resetUploadState 
  } = useGoogleDriveImage();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setLoading(true);
    setResult(null);

    try {
      // Calling your actual V1 action
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      
      {/* V2 Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            FLUX SCHNELL MODEL
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Idea <span className="bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">Visualizer</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Turn abstract concepts into concrete storyboards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* INPUT PANEL (Left Column) */}
        <div className="lg:col-span-1 bg-[#0b1121] p-6 rounded-3xl border border-white/5 flex flex-col shadow-2xl relative overflow-hidden h-full">
            <form onSubmit={handleGenerate} className="space-y-6 relative z-10 flex-1 flex flex-col">
                
                {/* Prompt Area */}
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                        <Wand2 className="w-4 h-4" /> Vision Prompt
                    </label>
                    <textarea 
                        required
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A cyberpunk city with neon rain, cinematic lighting, 8k..."
                        className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all text-sm leading-relaxed font-light"
                    />
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                        <Layers className="w-4 h-4" /> Dimensions
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: "16:9", desc: "YouTube" },
                            { label: "1:1", desc: "Social" },
                            { label: "9:16", desc: "Story" }
                        ].map((ratio) => (
                            <button
                                type="button"
                                key={ratio.label}
                                onClick={() => setAspectRatio(ratio.label)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                    aspectRatio === ratio.label
                                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                                    : "bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <span className="font-bold text-sm">{ratio.label}</span>
                                <span className="text-[10px] opacity-70">{ratio.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Generate Button */}
                <button 
                    type="submit"
                    disabled={loading || !prompt}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                    {loading ? "Synthesizing..." : "Generate Visual"}
                </button>
            </form>
        </div>

        {/* OUTPUT PANEL (Right Column - Spans 2) */}
        <div className="lg:col-span-2 aspect-square lg:aspect-auto min-h-[500px] rounded-3xl bg-[#0b1121] border border-white/5 flex items-center justify-center relative overflow-hidden group/output shadow-2xl">
            
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            
            {loading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-cyan-500/30 rounded-full animate-ping absolute inset-0" />
                        <Loader2 className="w-20 h-20 text-cyan-400 animate-spin relative z-10" />
                    </div>
                    <p className="text-cyan-400 font-mono text-sm mt-8 animate-pulse tracking-widest uppercase">Rendering Pixels...</p>
                 </div>
            ) : result ? (
                <>
                    {/* The Generated Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={result} 
                        alt="Generated" 
                        className="w-full h-full object-contain transition-transform duration-1000 group-hover/output:scale-105 relative z-10" 
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover/output:translate-y-0 transition-transform duration-300 z-20 flex justify-center gap-4">
                         
                         {/* Download Button */}
                         <a 
                            href={result} 
                            download="afterglow_flux.png"
                            target="_blank"
                            className="px-6 py-3 bg-white text-black hover:bg-cyan-50 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
                         >
                            <Download className="w-4 h-4" /> Download
                         </a>

                         {/* Save to Drive Button (Your Existing Logic) */}
                         <button 
                            onClick={() => result && saveImageToDrive(result, prompt || "AfterGlow Visual")}
                            disabled={isUploading}
                            className={`
                                px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border
                                ${isUploading 
                                    ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50 cursor-wait' 
                                    : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/10'
                                }
                            `}
                         >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    {/* Google Drive Icon SVG */}
                                    <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l-13.65-23.65c-.5-1-.8-2.1-.9-3.3 0-2.3 1.1-4.2 2.8-5.5l4.7 22.5" fill="#0066da"/>
                                        <path d="m43.65 25-13.65-23.65c-1.3.8-2.4 1.9-3.2 3.3l-9.5 16.5c-.8 1.4-1.2 3-1.2 4.65h27.55z" fill="#00ac47"/>
                                        <path d="m73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l9.5-16.5c.8-1.4 1.2-3 1.2-4.65h-27.55l13.65 24.45" fill="#ea4335"/>
                                        <path d="m43.65 25 13.65 23.65c1.3-.8 2.4-1.9 3.2-3.3l9.5-16.5c.8-1.4 1.2-3 1.2-4.65h-27.55z" fill="#ffba00"/>
                                    </svg>
                                    Save to Drive
                                </>
                            )}
                         </button>
                    </div>
                </>
            ) : (
                <div className="text-center text-slate-600 p-8 border-2 border-dashed border-white/5 rounded-2xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">Your imagination is empty.</p>
                    <p className="text-sm mt-2 opacity-50">Enter a prompt to start dreaming.</p>
                </div>
            )}
        </div>

      </div>

      {/* Success Toast (Your Existing Logic) */}
      {uploadSuccessLink && (
        <AfterGlowToast 
          fileLink={uploadSuccessLink} 
          onClose={resetUploadState} 
          type="Visual"
        />
      )}

    </div>
  );
}