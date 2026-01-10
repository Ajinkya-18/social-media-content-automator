"use client";

import { useState } from "react";
// Correct relative path to actions.ts based on your directory structure
import { generatePost } from "../../actions"; 
import { useGoogleDrive } from "../../hooks/useGoogleDrive"; 
import AfterGlowToast from "../../components/AfterGlowToast"; 
import { PenTool, Sparkles, Save, Copy } from "lucide-react";

export default function WriterPage() {
  const [topic, setTopic] = useState("");
  const [vibe, setVibe] = useState("Professional");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  
  // New: Script Title for the file name
  const [scriptTitle, setScriptTitle] = useState(""); 

  // Initialize the Drive Hook
  const { 
    saveScriptToDrive, 
    isSaving, 
    saveSuccessLink, 
    resetSaveState 
  } = useGoogleDrive();

  const handleGenerate = async () => {
    if (!topic) return;
    setIsLoading(true);
    setResult(""); 

    try {
      // THE REAL LLM CALL
      const response = await generatePost(`${vibe} post about ${topic}`);
      
      if (response.success) {
        setResult(response.content);
        // Auto-generate a title if one isn't set
        if (!scriptTitle) {
          setScriptTitle(`${vibe} Post: ${topic.substring(0, 20)}...`);
        }
      } else {
        alert("Failed to generate content");
      }
    } catch (error) {
      console.error("Error generating:", error);
      setResult("Something went wrong. Please check your API keys.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <PenTool className="text-purple-400 w-8 h-8" />
            The Synapse
          </h2>
          <p className="text-slate-400 mt-1">AI-Powered Screenplay Architect.</p>
        </div>
        
        {/* Title Input (For File Name) */}
        <div className="flex items-center gap-4">
           <input 
             type="text" 
             value={scriptTitle}
             onChange={(e) => setScriptTitle(e.target.value)}
             className="bg-transparent border-b border-white/20 text-right text-white focus:border-purple-500 outline-none px-2 py-1 placeholder-slate-600 w-64"
             placeholder="Name your script (for Drive)..."
           />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Controls */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5">
              <label className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">Input Source</label>
              <textarea 
                className="w-full mt-3 bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-slate-200 h-32 focus:border-cyan-500 outline-none resize-none text-sm placeholder-slate-600"
                placeholder="Describe your vision..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              {/* Vibe Selector */}
              <div className="mt-6">
                <label className="text-sm text-purple-400 font-semibold uppercase tracking-wider">Tone</label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Professional", "Casual", "Viral", "Storytelling"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVibe(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        vibe === v
                          ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                          : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className={`w-full mt-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 ${
                  isLoading || !topic ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? "Synthesizing..." : "Generate Script"}
              </button>
           </div>
        </div>

        {/* RIGHT: Editor & Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl ring-1 ring-white/5 min-h-[500px] relative bg-slate-900/50 flex flex-col">
            
            {/* Output Header */}
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
               <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Output Stream</span>
               {result && <span className="text-xs text-green-400 flex items-center gap-1">● Active</span>}
            </div>

            {/* The Text Area */}
            {result ? (
               <textarea 
                 value={result}
                 onChange={(e) => setResult(e.target.value)}
                 className="w-full flex-grow bg-transparent outline-none text-slate-300 font-mono resize-none leading-relaxed text-sm p-2 focus:bg-slate-950/30 rounded-lg transition-colors"
               />
            ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50 pointer-events-none">
                 <PenTool className="w-12 h-12 mb-4" />
                 <p className="font-mono text-sm tracking-widest uppercase">Awaiting Data</p>
               </div>
            )}
          </div>

          {/* Action Bar (Copy & Save) */}
          <div className="flex justify-end gap-3">
             <button 
               onClick={() => navigator.clipboard.writeText(result)}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
             >
               <Copy className="w-4 h-4" /> Copy
             </button>

             {/* The Standardized Save Button */}
             <button 
               onClick={() => saveScriptToDrive(result, scriptTitle || topic || "Untitled Script")}
               disabled={isSaving || !result}
               className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all border border-white/10
                 ${isSaving 
                   ? "bg-purple-900/40 text-purple-300 cursor-wait" 
                   : "bg-slate-800 text-white hover:bg-slate-700 hover:border-purple-500"
                 }`}
             >
               {isSaving ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-purple-400 rounded-full animate-spin" />
                   Saving...
                 </>
               ) : (
                 <>
                   <Save className="w-4 h-4" /> Save to Drive
                 </>
               )}
             </button>
          </div>
        </div>
      </div>

      {/* The Aesthetic Toast */}
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