"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Palette, ExternalLink, Layout, PlusCircle, Link as LinkIcon, 
  Loader2, Presentation, FileText, Instagram, LogOut 
} from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';

// 1. Rename the logic component to StudioContent
function StudioContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [canvaId, setCanvaId] = useState<string | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // --- 1. AUTH & INIT ---
  useEffect(() => {
    const status = searchParams.get('status');
    const id = searchParams.get('canva_id');

    if (status === 'connected' && id) {
      setIsConnected(true);
      setCanvaId(id);
      localStorage.setItem('canva_connected', 'true');
      localStorage.setItem('canva_id', id);
      router.replace('/studio');
    } else {
      const storedConnected = localStorage.getItem('canva_connected');
      const storedId = localStorage.getItem('canva_id');
        
      if (storedConnected && storedId) {
          setIsConnected(true);
          setCanvaId(storedId);
      }
    }
  }, [searchParams, router]);

  // --- 2. FETCH DESIGNS ---
  useEffect(() => {
    if (isConnected && canvaId) {
        fetchDesigns();
    }
  }, [isConnected, canvaId]);

  const fetchDesigns = async () => {
    try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/canva/designs?canva_id=${canvaId}`);
        const data = await res.json();
        
        if (data.items) {
            setDesigns(data.items);
        }
    } catch (error) {
        console.error("Failed to fetch designs", error);
    } finally {
        setLoading(false);
    }
  };

  // --- 3. CREATE HANDLER ---
  const handleCreate = async (type: 'presentation' | 'social' | 'doc') => {
    if (!canvaId) return;
    
    try {
        setCreating(type);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/canva/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                canva_id: canvaId,
                design_type: type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
            })
        });
        
        const data = await res.json();
        
        if (data.error) {
             alert(`Error: ${data.error}`);
             return;
        }

        const editUrl = data.design?.urls?.edit_url || data.urls?.edit_url || data.url;
        
        if (editUrl) {
            window.open(editUrl, '_blank');
            fetchDesigns(); 
        } else {
            console.error("Unexpected response structure:", data);
            alert("Design created, but could not find the URL to open.");
        }
        
    } catch (error) {
        console.error("Creation failed", error);
        alert("Failed to connect to server.");
    } finally {
        setCreating(null);
    }
  };

  // --- 4. LOGOUT HANDLER ---
  const handleLogout = () => {
    if (confirm("Are you sure you want to disconnect your Canva account?")) {
        localStorage.removeItem('canva_connected');
        localStorage.removeItem('canva_id');
        setIsConnected(false);
        setCanvaId(null);
        setDesigns([]);
        router.refresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Palette className="text-orange-400 w-8 h-8" />
            The Studio
          </h2>
          <p className="text-slate-400 mt-1">Professional Design Suite powered by Canva.</p>
        </div>

        {isConnected && (
           <button 
             onClick={handleLogout}
             className="group flex items-center gap-3 pl-4 pr-2 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-full transition-all cursor-pointer"
             title="Click to Disconnect"
           >
              <div className="text-right hidden sm:block">
                  <span className="block text-xs text-slate-400 group-hover:text-red-400 transition-colors">Connected</span>
                  <span className="block text-sm text-white font-medium leading-tight">Canva Account</span>
              </div>
              <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-2 border-white/10 group-hover:border-red-500 transition-colors shadow-lg">
                        <span className="font-bold text-white text-sm">CA</span>
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <LogOut className="w-4 h-4 text-white" />
                  </div>
              </div>
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Design List */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl ring-1 ring-white/5 bg-gradient-to-br from-orange-500/10 to-transparent min-h-[400px]">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Designs</h3>
            
            {!isConnected ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Palette className="w-12 h-12 mb-4 opacity-20" />
                    <p>Connect Canva to view your designs.</p>
                 </div>
            ) : loading ? (
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                 </div>
            ) : designs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {designs.map((design: any) => (
                        <div key={design.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex gap-4 items-center group">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 shadow-sm">
                                {design.thumbnail?.url ? (
                                    <img src={design.thumbnail.url} alt={design.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                        <Palette className="w-6 h-6 text-slate-500" />
                                    </div>
                                )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{design.title || "Untitled Design"}</h4>
                                <p className="text-slate-400 text-xs mt-1">
                                    Last edited: {new Date(design.updated_at * 1000).toLocaleDateString()}
                                </p>
                            </div>
                            {/* Edit Button */}
                            <a 
                                href={design.urls?.edit_url} 
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 text-xs font-bold text-slate-900 bg-orange-400 hover:bg-orange-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                            >
                                Edit
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>No recent designs found.</p>
                    <button onClick={() => fetchDesigns()} className="mt-4 text-orange-400 hover:underline text-sm">Refresh List</button>
                </div>
            )}
          </div>
        </div>

        {/* Right: Action Area */}
        <div className="flex flex-col items-center justify-center space-y-6 sticky top-8">
            
            {!isConnected ? (
              <button
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/canva/login`}
                className="group relative w-full max-w-md h-64 glass-panel rounded-2xl ring-1 ring-white/10 hover:ring-orange-500/50 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden bg-slate-900 cursor-pointer shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                   <LinkIcon className="w-8 h-8 text-slate-400 group-hover:text-white" />
                </div>
                <h4 className="text-2xl font-bold text-white">Connect Canva</h4>
                <p className="text-slate-500 mt-2 text-sm">Grant permission to access designs</p>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors pointer-events-none" />
              </button>
            ) : (
              <div className="w-full max-w-md space-y-4">
                 <button
                   disabled={!!creating}
                   onClick={() => handleCreate('presentation')}
                   className="w-full h-24 glass-panel rounded-xl flex items-center px-6 gap-4 hover:bg-orange-500/10 transition-all border border-white/5 group relative overflow-hidden"
                 >
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors z-10">
                        {creating === 'presentation' ? <Loader2 className="animate-spin w-6 h-6" /> : <Presentation className="w-6 h-6 text-orange-500 group-hover:text-white" />}
                    </div>
                    <div className="text-left z-10">
                        <span className="block text-lg font-bold text-white">New Presentation</span>
                        <span className="text-xs text-slate-400">16:9 Format • Slides</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                 </button>

                 <button
                   disabled={!!creating}
                   onClick={() => handleCreate('social')}
                   className="w-full h-24 glass-panel rounded-xl flex items-center px-6 gap-4 hover:bg-purple-500/10 transition-all border border-white/5 group relative overflow-hidden"
                 >
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors z-10">
                        {creating === 'social' ? <Loader2 className="animate-spin w-6 h-6" /> : <Instagram className="w-6 h-6 text-purple-500 group-hover:text-white" />}
                    </div>
                    <div className="text-left z-10">
                        <span className="block text-lg font-bold text-white">New Social Post</span>
                        <span className="text-xs text-slate-400">1080x1080 • Instagram/LinkedIn</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                 </button>

                 <button
                   disabled={!!creating}
                   onClick={() => handleCreate('doc')}
                   className="w-full h-24 glass-panel rounded-xl flex items-center px-6 gap-4 hover:bg-blue-500/10 transition-all border border-white/5 group relative overflow-hidden"
                 >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors z-10">
                        {creating === 'doc' ? <Loader2 className="animate-spin w-6 h-6" /> : <FileText className="w-6 h-6 text-blue-500 group-hover:text-white" />}
                    </div>
                    <div className="text-left z-10">
                        <span className="block text-lg font-bold text-white">New Doc</span>
                        <span className="text-xs text-slate-400">Vertical Document • Reports</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                 </button>
                 
                 <div className="mt-4 text-center">
                    <span className="text-xs text-slate-600 flex items-center justify-center gap-2">
                        <Layout className="w-3 h-3" />
                        {designs.length} designs synced
                    </span>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// 2. Export the Wrapped Component
export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin"/>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}