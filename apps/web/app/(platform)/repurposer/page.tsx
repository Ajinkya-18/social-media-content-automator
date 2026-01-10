"use client";

import { useState } from "react";
import { repurposeContent } from "../../actions"; // Import the new action
import { useGoogleDrive } from "../../hooks/useGoogleDrive"; // Reuse our hook
import AfterGlowToast from "../../components/AfterGlowToast"; // Reuse our Toast
import { Layers, Twitter, Linkedin, Instagram, ArrowRight, Save, Copy, Repeat } from "lucide-react";

export default function RepurposerPage() {
  const [inputContent, setInputContent] = useState("");
  const [activeTab, setActiveTab] = useState("Twitter");
  const [isLoading, setIsLoading] = useState(false);
  
  // Store results for each platform separately so we don't lose them when switching tabs
  const [results, setResults] = useState({
    Twitter: "",
    LinkedIn: "",
    Instagram: ""
  });

  const { saveScriptToDrive, isSaving, saveSuccessLink, resetSaveState } = useGoogleDrive();

  const handleRemix = async () => {
    if (!inputContent) return;
    setIsLoading(true);

    const response = await repurposeContent(inputContent, activeTab);
    
    if (response.success) {
      setResults(prev => ({ ...prev, [activeTab]: response.content }));
    } else {
      alert("Remix failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    const contentToSave = results[activeTab as keyof typeof results];
    if (contentToSave) {
      // Dynamic Name: "AfterGlow_Script_Twitter_Remix_..."
      saveScriptToDrive(contentToSave, `${activeTab} Remix`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Layers className="text-pink-400 w-8 h-8" />
          The Prism
        </h2>
        <p className="text-slate-400 mt-1">Multi-Platform Content Refraction Engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: Input Source */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5 h-[600px] flex flex-col">
            <label className="text-sm text-pink-400 font-semibold uppercase tracking-wider mb-4">
              Master Content
            </label>
            <textarea 
              className="w-full flex-grow bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:border-pink-500 outline-none resize-none text-sm placeholder-slate-600 leading-relaxed"
              placeholder="Paste your script, article, or raw thoughts here..."
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT: Output Variations */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5 h-[600px] flex flex-col relative bg-slate-900/50">
            
            {/* Platform Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: "Twitter", icon: Twitter, color: "hover:text-sky-400" },
                { id: "LinkedIn", icon: Linkedin, color: "hover:text-blue-400" },
                { id: "Instagram", icon: Instagram, color: "hover:text-pink-400" },
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    activeTab === platform.id
                      ? "bg-slate-800 text-white border-white/20 shadow-lg"
                      : "bg-transparent text-slate-500 border-transparent hover:bg-slate-800/50"
                  } ${platform.color}`}
                >
                  <platform.icon className="w-4 h-4" />
                  {platform.id}
                </button>
              ))}
            </div>

            {/* Output Area */}
            <div className="flex-grow relative bg-slate-950/30 rounded-xl border border-white/5 p-1">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400 gap-3">
                  <Repeat className="w-8 h-8 animate-spin" />
                  <span className="font-mono text-xs uppercase tracking-widest">Refracting...</span>
                </div>
              ) : results[activeTab as keyof typeof results] ? (
                <textarea 
                  readOnly
                  value={results[activeTab as keyof typeof results]}
                  className="w-full h-full bg-transparent p-4 outline-none text-slate-300 font-mono text-sm leading-relaxed resize-none"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <ArrowRight className="w-8 h-8 mb-2" />
                  <p className="text-xs uppercase tracking-widest">Ready to Remix</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button 
                onClick={handleRemix}
                disabled={isLoading || !inputContent}
                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : `Generate ${activeTab} Version`}
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => navigator.clipboard.writeText(results[activeTab as keyof typeof results])}
                  className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Copy"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || !results[activeTab as keyof typeof results]}
                  className="p-3 rounded-xl bg-slate-800 text-pink-400 hover:bg-slate-700 hover:text-pink-300 border border-transparent hover:border-pink-500/50 transition-all"
                  title="Save to Drive"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-pink-400 rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccessLink && (
        <AfterGlowToast 
          fileLink={saveSuccessLink} 
          onClose={resetSaveState}
          type="Script"
        />
      )}

    </div>
  );
}