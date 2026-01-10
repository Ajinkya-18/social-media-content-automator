"use client";

import { useState } from "react";
// Assuming image.ts is in actions folder inside app
import { generateImage } from "../../actions/image"; 
import { Download, Image as ImageIcon, Layers } from "lucide-react";
// Fixed Import Path (Sibling folder)
import { useGoogleDriveImage } from "../../hooks/useGoogleDriveImage";
// Fixed Import Path (Sibling folder)
import AfterGlowToast from '../../components/AfterGlowToast';


export default function VisualizerPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Destructure the hook
  const { 
    saveImageToDrive, 
    isUploading, // Use this instead of 'isSaving'
    uploadSuccessLink, 
    resetUploadState 
  } = useGoogleDriveImage();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null); 

    try {
      const result = await generateImage(prompt, aspectRatio);
      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        alert("Failed to generate image. Check API credits/token.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <ImageIcon className="text-cyan-400 w-8 h-8" />
          The Visualizer
        </h2>
        <p className="text-slate-400 mt-1">Flux-Powered Text-to-Image Engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Prompt Input */}
          <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5">
            <label className="block text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
              Visual Description
            </label>
            <textarea
              className="w-full h-32 p-4 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition resize-none text-slate-200 placeholder-slate-600 text-sm"
              placeholder="E.g. A cyberpunk city with neon rain, cinematic lighting, 8k..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5">
            <label className="block text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "16:9", desc: "YouTube" },
                { label: "1:1", desc: "Insta/Post" },
                { label: "9:16", desc: "Reel/Story" }
              ].map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio.label)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    aspectRatio === ratio.label
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                      : "bg-slate-800/40 border-white/5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
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
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-lg ${
              isGenerating || !prompt
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-900/20"
            }`}
          >
            {isGenerating ? "Rendering..." : "Generate Visual"}
          </button>
        </div>

        {/* RIGHT COLUMN: The Stage */}
        <div className="lg:col-span-2">
          <div className="glass-panel w-full h-[600px] rounded-2xl ring-1 ring-white/5 relative flex items-center justify-center overflow-hidden bg-slate-950/30 group">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
                <p className="text-cyan-400 font-mono text-sm animate-pulse">SYNTHESIZING PIXELS...</p>
              </div>
            ) : generatedImage ? (
              <>
                {/* The Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={generatedImage} 
                  alt="Generated AI" 
                  className="w-full h-full object-contain z-10 animate-in fade-in zoom-in duration-500"
                />
                
                {/* Overlay Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex justify-center gap-4">
                  <a 
                    href={generatedImage} 
                    target="_blank" 
                    download="afterglow_flux.png"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                  
                  {/* Save to Drive Button */}
                  <button 
                  // Pass the image AND the prompt (for naming)
                  onClick={() => generatedImage && saveImageToDrive(generatedImage, prompt || "AfterGlow Visual")}
                  disabled={isUploading}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-white/10 transition-colors
                    ${isUploading 
                      ? 'bg-cyan-900/50 text-cyan-300 cursor-wait' 
                      : 'bg-slate-800 text-white hover:bg-slate-700 hover:border-cyan-400'
                    }
                  `}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
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
              <div className="text-center text-slate-600 z-10">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-mono text-sm uppercase tracking-widest opacity-50">No Signal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the Custom Toast when upload succeeds */}
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
