"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Database, FileText, Image as ImageIcon, Video, Layers, 
  Search, Trash2, Copy, ExternalLink, Calendar, Loader2 
} from "lucide-react";

export default function VaultPage() {
  const { user } = useUser();
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchAssets();
    }
  }, [user, filter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vault/list?email=${email}&asset_type=${filter}`
      );
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this asset permanently?")) return;
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vault/delete?asset_id=${id}`, { method: 'DELETE' });
        setAssets(assets.filter(a => a.id !== id));
    } catch(e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            The <span className="bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">Vault</span>
          </h1>
          <p className="text-slate-400 mt-2">Your centralized asset library. Everything you create lives here.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#0b1121] p-1 rounded-xl border border-white/10">
            {[
                { id: 'all', icon: Search, label: 'All' },
                { id: 'script', icon: FileText, label: 'Scripts' },
                { id: 'image', icon: ImageIcon, label: 'Visuals' },
                { id: 'video', icon: Video, label: 'Videos' },
                { id: 'social_mix', icon: Layers, label: 'Social' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filter === tab.id 
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-cyan-500 animate-spin" /></div>
      ) : assets.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1121] rounded-3xl border border-white/5">
              <Database className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">The Vault is empty. Start creating!</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
              ))}
          </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDelete }: any) {
    const isMedia = asset.asset_type === 'image' || asset.asset_type === 'video';
    const contentPreview = isMedia ? asset.content : asset.content.substring(0, 150) + "...";

    return (
        <div className="group bg-[#0b1121] border border-white/5 hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-900/10 flex flex-col h-[300px]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <AssetIcon type={asset.asset_type} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{asset.asset_type}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(asset.created_at).toLocaleDateString()}
                </span>
            </div>

            {/* Content Preview */}
            <div className="flex-1 overflow-hidden relative bg-black/20">
                {asset.asset_type === 'image' ? (
                    <img src={asset.content} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Asset" />
                ) : asset.asset_type === 'video' ? (
                    <video src={asset.content} className="w-full h-full object-cover" controls />
                ) : (
                    <div className="p-4 text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {contentPreview}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 flex gap-2">
                <button 
                    onClick={() => navigator.clipboard.writeText(asset.content)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
                >
                    <Copy className="w-3 h-3" /> Copy
                </button>
                {isMedia && (
                    <a 
                        href={asset.content} 
                        target="_blank"
                        className="p-2 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                <button 
                    onClick={() => onDelete(asset.id)}
                    className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

function AssetIcon({ type }: { type: string }) {
    switch(type) {
        case 'script': return <FileText className="w-4 h-4 text-blue-400" />;
        case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
        case 'video': return <Video className="w-4 h-4 text-orange-400" />;
        case 'social_mix': return <Layers className="w-4 h-4 text-pink-400" />;
        default: return <Database className="w-4 h-4 text-slate-400" />;
    }
}