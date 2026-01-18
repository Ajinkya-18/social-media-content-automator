"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { 
  Layers, Twitter, Linkedin, Instagram, Copy, Repeat, Loader2, 
  Sparkles, CalendarPlus, Check, Upload, PenTool, Send 
} from "lucide-react";

export default function RepurposerPage() {
  const router = useRouter();
  const { user } = useUser();
  const [inputContent, setInputContent] = useState("");
  const [activeTab, setActiveTab] = useState("twitter");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tone, setTone] = useState("engaging");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const [isPosting, setIsPosting] = useState(false);
  
  const [results, setResults] = useState({
    twitter: "",
    linkedin: "",
    instagram: ""
  });
  
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parse-document`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");
        setInputContent(data.content);
    } catch (error: any) { alert(error.message); } 
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleRemix = async () => {
    if (!inputContent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress, script: inputContent, tone: tone }),
      });
      if (!res.ok) throw new Error("Processing failed");
      const data = await res.json();
      setResults({ twitter: data.twitter, linkedin: data.linkedin, instagram: data.instagram });
    } catch (error) { console.error(error); alert("AI Processing failed."); } 
    finally { setIsLoading(false); }
  };

  const handleSchedule = async () => {
    const content = results[activeTab as keyof typeof results];
    if (!content || !user?.primaryEmailAddress?.emailAddress) return;
    setIsScheduling(true);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress, title: `[${activeTab.toUpperCase()}] Content Release`, description: content, date: tomorrow.toISOString().split('T')[0] })
        });
        if (res.ok) { setScheduleSuccess(true); setTimeout(() => setScheduleSuccess(false), 3000); }
    } catch (e) { console.error(e); } finally { setIsScheduling(false); }
  };

  // --- BRIDGE: SEND TO WRITER ---
  const handleToWriter = () => {
      const content = results[activeTab as keyof typeof results];
      if (!content) return;
      router.push(`/writer?prompt=${encodeURIComponent("Expand this into a full script: " + content)}`);
  };

  // --- DIRECT POSTING FUNCTION ---
  const handlePostToLinkedIn = async () => {
      const content = results['linkedin'];
      if (!content) return;
      
      // Attempt to retrieve ID from storage (set by Dashboard)
      const linkedinId = localStorage.getItem('linkedin_id');
      
      if (!linkedinId) {
          alert("To post, we need your LinkedIn URN. Please connect LinkedIn in the Dashboard first.");
          return;
      }

      setIsPosting(true);
      
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/post`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  linkedin_id: linkedinId,
                  text: content
              })
          });

          const data = await res.json();

          if (res.ok) {
             alert("Posted to LinkedIn successfully! 🚀");
          } else {
             alert(`Failed: ${data.detail || 'Unknown error'}`);
          }

      } catch (e) {
          console.error(e);
          alert("Failed to connect to server.");
      } finally {
          setIsPosting(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider mb-3"><Sparkles className="w-3 h-3" /> CONTENT ALCHEMY v2</div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3"><Layers className="w-8 h-8 text-purple-500" /> Repurposer <span className="text-slate-500">Engine</span></h1>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* INPUT COLUMN */}
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Script / Text</label>
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.docx" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-purple-300 rounded-lg border border-purple-500/30 transition-all disabled:opacity-50">
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {isUploading ? "Reading..." : "Import File"}
                    </button>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="bg-[#0b1121] border border-white/10 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-purple-500">
                        <option value="engaging">Engaging</option>
                        <option value="professional">Professional</option>
                        <option value="witty">Witty</option>
                    </select>
                </div>
            </div>
            <textarea value={inputContent} onChange={(e) => setInputContent(e.target.value)} placeholder="Paste your script here OR upload a .docx/.txt file..." className="flex-1 bg-[#0b1121] border border-white/10 rounded-2xl p-6 text-slate-300 focus:border-purple-500 outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar transition-all" />
            <button onClick={handleRemix} disabled={isLoading || !inputContent} className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 group">
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Transmuting...</> : <><Repeat className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Generate 3 Variations</>}
            </button>
        </div>

        {/* OUTPUT COLUMN */}
        <div className="bg-[#0b1121] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20">
                {[{ id: 'twitter', icon: Twitter, label: 'Twitter' }, { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' }, { id: 'instagram', icon: Instagram, label: 'Instagram' }].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id ? `border-purple-500 bg-white/5 text-white` : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}>
                        <tab.icon className={`w-4 h-4`} /> <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative bg-[#0b1121]">
                {results[activeTab as keyof typeof results] ? <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">{results[activeTab as keyof typeof results]}</div> : <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50"><Layers className="w-12 h-12 mb-4" /><p className="text-sm">AI Output will appear here</p></div>}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">{results[activeTab as keyof typeof results] ? `${results[activeTab as keyof typeof results].length} chars` : '0 chars'}</span>
                
                <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(results[activeTab as keyof typeof results] || ""); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} disabled={!results[activeTab as keyof typeof results]} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                        {copySuccess ? "Copied!" : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                    
                    {/* BRIDGE: To Writer */}
                    <button onClick={handleToWriter} disabled={!results[activeTab as keyof typeof results]} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-bold flex items-center gap-2 border border-cyan-500/30 disabled:opacity-50">
                        <PenTool className="w-3 h-3" /> To Writer
                    </button>

                    {/* NEW: LinkedIn Post Button */}
                    {activeTab === 'linkedin' && (
                        <button 
                            onClick={handlePostToLinkedIn}
                            disabled={isPosting || !results['linkedin']}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                        >
                            {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Post Now
                        </button>
                    )}

                    {/* Schedule Button */}
                    <button onClick={handleSchedule} disabled={isScheduling || !results[activeTab as keyof typeof results]} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${scheduleSuccess ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50"} disabled:opacity-50`}>
                        {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : scheduleSuccess ? <Check className="w-3 h-3" /> : <CalendarPlus className="w-3 h-3" />}
                        {scheduleSuccess ? "Added" : "Schedule"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}