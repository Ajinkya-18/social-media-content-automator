"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCredits } from "../../components/CreditsContext";
import { 
  Layers, Twitter, Linkedin, Instagram, Copy, Repeat, Loader2, 
  Sparkles, CalendarPlus, Check, Upload, PenTool, Send, ChevronDown, 
  Building2, User, Coins, Image as ImageIcon, X 
} from "lucide-react";

export default function RepurposerPage() {
  const { refreshCredits } = useCredits();
  const { user } = useUser();
  
  // Input State
  const [inputContent, setInputContent] = useState("");
  const [activeTab, setActiveTab] = useState("twitter");
  const [tone, setTone] = useState("engaging");
  
  // Processing State
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Data State
  const [results, setResults] = useState({ twitter: "", linkedin: "", instagram: "" });
  const [copySuccess, setCopySuccess] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // --- LINKEDIN SPECIFIC STATE ---
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>(""); 
  const [selectedAuthorName, setSelectedAuthorName] = useState<string>("Personal Profile");
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  
  // --- VAULT / IMAGE STATE ---
  const [vaultImages, setVaultImages] = useState<any[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // URL of attached image

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. FETCH COMPANIES (On Tab Change)
  useEffect(() => {
      if (activeTab === 'linkedin') {
          const linkedinId = localStorage.getItem('linkedin_id');
          if (linkedinId) {
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/companies?linkedin_id=${linkedinId}`)
              .then(res => res.json())
              .then(data => { if (data.companies) setCompanies(data.companies); })
              .catch(err => console.error("Failed to fetch companies", err));
          }
      }
  }, [activeTab]);

  // 2. FETCH VAULT IMAGES (When Modal Opens)
  const handleOpenVault = async () => {
      setShowVault(true);
      if (vaultImages.length === 0 && user?.primaryEmailAddress?.emailAddress) {
          try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vault/images?email=${user.primaryEmailAddress.emailAddress}`);
              const data = await res.json();
              setVaultImages(data.images || []);
          } catch(e) { console.error(e); }
      }
  };

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
      await refreshCredits();
    } catch (error) { console.error(error); alert("AI Processing failed."); } 
    finally { setIsLoading(false); }
  };

  // --- EDITING LOGIC ---
  // Allow user to edit the output directly
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setResults(prev => ({ ...prev, [activeTab]: e.target.value }));
  };

  const handlePostToLinkedIn = async () => {
      const content = results['linkedin'];
      if (!content) return;
      
      const linkedinId = localStorage.getItem('linkedin_id');
      if (!linkedinId) {
          alert("Please connect LinkedIn in the Dashboard first.");
          return;
      }

      setIsPosting(true);
      const finalAuthorUrn = selectedAuthor || `urn:li:person:${linkedinId}`;

      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/post`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  linkedin_id: linkedinId,
                  author_urn: finalAuthorUrn,
                  text: content,
                  image_url: selectedImage // Sending the image URL too!
              })
          });

          const data = await res.json();
          if (res.ok) {
             alert(`Posted to LinkedIn as ${selectedAuthorName} successfully! 🚀`);
             setSelectedImage(null); // Reset after post
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

  const handleSchedule = async () => {
    // Basic schedule logic (omitted image for now in Calendar, can be added later)
    const content = results[activeTab as keyof typeof results];
    if (!content || !user?.primaryEmailAddress?.emailAddress) return;
    setIsScheduling(true);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendar/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: user.primaryEmailAddress.emailAddress, 
                title: `[${activeTab.toUpperCase()}] Content Release`, 
                description: content + (selectedImage ? `\n\n[Asset]: ${selectedImage}` : ""), 
                date: tomorrow.toISOString().split('T')[0] 
            })
        });
        if (res.ok) { setScheduleSuccess(true); setTimeout(() => setScheduleSuccess(false), 3000); }
    } catch (e) { console.error(e); } finally { setIsScheduling(false); }
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
        {/* LEFT: INPUT COLUMN */}
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
            
            <div className="flex flex-col gap-2">
                <button onClick={handleRemix} disabled={isLoading || !inputContent} className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 group">
                    {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Transmuting...</> : <><Repeat className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Generate 3 Variations</>}
                </button>
                <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    <Coins className="w-3 h-3 text-orange-400" /> Cost: <span className="text-orange-400 font-bold">5 Credits</span>
                </div>
            </div>
        </div>

        {/* RIGHT: OUTPUT EDITOR */}
        <div className="bg-[#0b1121] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-full shadow-2xl relative">
            
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20 shrink-0">
                {[{ id: 'twitter', icon: Twitter, label: 'Twitter' }, { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' }, { id: 'instagram', icon: Instagram, label: 'Instagram' }].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id ? `border-purple-500 bg-white/5 text-white` : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}>
                        <tab.icon className={`w-4 h-4`} /> <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Editable Content Area */}
            <div className="flex-1 flex flex-col relative bg-[#0b1121] overflow-hidden">
                
                {/* 1. Image Attachment Preview */}
                {selectedImage && activeTab === 'linkedin' && (
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-black/50 overflow-hidden border border-white/10">
                                <img src={selectedImage} alt="Attachment" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-xs text-white font-bold">Image Attached</p>
                                <p className="text-[10px] text-slate-500">Ready to post</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* 2. Text Editor */}
                <textarea 
                    value={results[activeTab as keyof typeof results] || ""} 
                    onChange={handleContentChange}
                    placeholder="AI Output will appear here. You can edit this text..." 
                    className="flex-1 w-full bg-transparent p-6 text-slate-300 focus:outline-none resize-none font-sans text-sm leading-relaxed custom-scrollbar"
                />
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                
                {/* Left: Metadata */}
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    {results[activeTab as keyof typeof results]?.length || 0} chars
                </span>
                
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    
                    {/* VAULT BUTTON (Only for LinkedIn currently) */}
                    {activeTab === 'linkedin' && (
                        <button 
                            onClick={handleOpenVault}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${selectedImage ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
                        >
                           <ImageIcon className="w-3 h-3" /> {selectedImage ? "Change" : "Add Media"}
                        </button>
                    )}

                    <button onClick={() => { navigator.clipboard.writeText(results[activeTab as keyof typeof results] || ""); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} disabled={!results[activeTab as keyof typeof results]} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                        {copySuccess ? "Copied!" : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                    
                    {/* LINKEDIN POSTING CONTROLS */}
                    {activeTab === 'linkedin' && (
                        <div className="flex items-center gap-2">
                             {/* Account Dropdown */}
                            <div className="relative">
                                <button onClick={() => setShowAuthorMenu(!showAuthorMenu)} className="px-3 py-2 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 rounded-lg text-xs font-bold flex items-center gap-2 border border-blue-500/30">
                                    {selectedAuthor ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                {showAuthorMenu && (
                                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-[#0b1121] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                        <div className="p-2 border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase">Post as...</div>
                                        <button onClick={() => { setSelectedAuthor(""); setSelectedAuthorName("Personal Profile"); setShowAuthorMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"><User className="w-3 h-3" /> Personal Profile</button>
                                        {companies.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedAuthor(c.id); setSelectedAuthorName(c.name); setShowAuthorMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2"><Building2 className="w-3 h-3" /> {c.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Post Button */}
                            <button onClick={handlePostToLinkedIn} disabled={isPosting || !results['linkedin']} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50">
                                {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Post
                            </button>
                        </div>
                    )}

                    {/* Schedule Button */}
                    {activeTab !== 'linkedin' && (
                        <button onClick={handleSchedule} disabled={isScheduling || !results[activeTab as keyof typeof results]} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${scheduleSuccess ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50"} disabled:opacity-50`}>
                            {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : scheduleSuccess ? <Check className="w-3 h-3" /> : <CalendarPlus className="w-3 h-3" />}
                            {scheduleSuccess ? "Added" : "Schedule"}
                        </button>
                    )}
                </div>
            </div>

            {/* --- VAULT MODAL --- */}
            {showVault && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-[#0b1121] border border-white/10 rounded-2xl w-full h-full max-h-[500px] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-400"/> Select from Vault</h3>
                            <button onClick={() => setShowVault(false)}><X className="w-5 h-5 text-slate-400 hover:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                            {vaultImages.map((img: any) => (
                                <button key={img.id} onClick={() => { setSelectedImage(img.content); setShowVault(false); }} className="relative aspect-video rounded-lg overflow-hidden border border-white/5 hover:border-purple-500 transition-all group">
                                    <img src={img.content} alt="Vault Asset" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-xs font-bold text-white bg-purple-600 px-2 py-1 rounded">Select</span>
                                    </div>
                                </button>
                            ))}
                            {vaultImages.length === 0 && <div className="col-span-3 text-center text-slate-500 text-xs py-10">No images found in your Vault. Generate some in the Studio!</div>}
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}