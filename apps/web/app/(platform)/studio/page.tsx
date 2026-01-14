"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Palette, ExternalLink, Layout, PlusCircle, Link as LinkIcon, 
  Loader2, Presentation, FileText, Instagram, LogOut, Wand2 
} from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';

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
        if (data.error) { alert(`Error: ${data.error}`); return; }

        const editUrl = data.design?.urls?.edit_url || data.urls?.edit_url || data.url;
        if (editUrl) {
            window.open(editUrl, '_blank');
            fetchDesigns(); 
        }
    } catch (error) {
        alert("Failed to connect to server.");
    } finally {
        setCreating(null);
    }
  };

  const handleLogout = () => {
    if (confirm("Disconnect Canva account?")) {
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
            <Palette className="text-orange-500 w-8 h-8" />
            Design Matrix
          </h2>
          <p className="text-slate-400 mt-1">Direct link to Canva's design engine.</p>
        </div>

        {isConnected && (
           <button 
             onClick={handleLogout}
             className="group flex items-center gap-3 pl-4 pr-2 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-full transition-all"
           >
              <div className="text-right hidden sm:block">
                  <span className="block text-xs text-slate-400 group-hover:text-red-400 transition-colors">Connected</span>
                  <span className="block text-sm text-white font-medium leading-tight">Canva Account</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-2 border-white/10 group-hover:border-red-500 transition-colors">
                 <span className="font-bold text-white text-xs">CA</span>
              </div>
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Design List */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-[#0b1121] min-h-[400px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-2xl font-bold text-white">Recent Artifacts</h3>
                <button onClick={() => fetchDesigns()} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                    <Layout className="w-3 h-3" /> REFRESH
                </button>
            </div>
            
            {!isConnected ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Palette className="w-12 h-12 mb-4 opacity-20" />
                    <p>Connect Canva to view your designs.</p>
                 </div>
            ) : loading ? (
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                 </div>
            ) : designs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    {designs.map((design: any) => (
                        <div key={design.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex gap-4 items-center group">
                            <div className="w-20 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                {design.thumbnail?.url ? (
                                    <img src={design.thumbnail.url} alt={design.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Palette className="w-4 h-4 text-slate-600" /></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate group-hover:text-cyan-400 transition-colors">{design.title || "Untitled Design"}</h4>
                                <p className="text-slate-500 text-xs mt-1">
                                    Last edited: {new Date(design.updated_at * 1000).toLocaleDateString()}
                                </p>
                            </div>
                            <a 
                                href={design.urls?.edit_url} 
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/20 rounded-lg transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>No recent designs found.</p>
                </div>
            )}
          </div>
        </div>

        {/* Right: Action Area */}
        <div className="flex flex-col space-y-6 sticky top-28">
            
            {!isConnected ? (
              <button
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/canva/login`}
                className="group relative w-full max-w-md mx-auto h-64 rounded-2xl border border-white/10 bg-[#0b1121] hover:border-cyan-500/50 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10 z-10">
                   <LinkIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-xl font-bold text-white z-10">Initialize Connection</h4>
                <p className="text-slate-500 mt-2 text-sm z-10">Grant access to Canva designs</p>
              </button>
            ) : (
              <div className="w-full max-w-md mx-auto space-y-4">
                 <CreateButton 
                    label="Presentation" 
                    sub="16:9 Format"
                    icon={<Presentation />} 
                    color="text-orange-500"
                    loading={creating === 'presentation'}
                    onClick={() => handleCreate('presentation')}
                 />
                 <CreateButton 
                    label="Social Post" 
                    sub="1080x1080 • Instagram"
                    icon={<Instagram />} 
                    color="text-purple-500"
                    loading={creating === 'social'}
                    onClick={() => handleCreate('social')}
                 />
                 <CreateButton 
                    label="Document" 
                    sub="Vertical • A4"
                    icon={<FileText />} 
                    color="text-blue-500"
                    loading={creating === 'doc'}
                    onClick={() => handleCreate('doc')}
                 />
                 
                 <div className="mt-6 p-4 rounded-xl bg-cyan-900/10 border border-cyan-500/20 text-center">
                    <p className="text-cyan-400 text-xs font-bold tracking-wide">
                        {designs.length} DESIGNS SYNCED
                    </p>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function CreateButton({ label, sub, icon, color, loading, onClick }: any) {
    return (
        <button
            disabled={loading}
            onClick={onClick}
            className="w-full h-24 rounded-xl flex items-center px-6 gap-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
        >
            <div className={`w-12 h-12 rounded-xl bg-[#030712] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform z-10 ${color}`}>
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : icon}
            </div>
            <div className="text-left z-10">
                <span className="block text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{label}</span>
                <span className="text-xs text-slate-500">{sub}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 group-hover:w-full transition-all duration-700" />
        </button>
    )
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin"/>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}