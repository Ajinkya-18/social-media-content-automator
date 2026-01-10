"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Eye, Video, Activity, ExternalLink, 
  Loader2, PlayCircle, LogOut, Wand2, X, Check, Image as ImageIcon 
} from "lucide-react";

// 1. Rename the main logic component to DashboardContent
function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  
  // --- BRIDGE STATE ---
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [canvaDesigns, setCanvaDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
      localStorage.setItem('yt_email', urlEmail);
      router.replace('/dashboard');
    } else {
      const storedEmail = localStorage.getItem('yt_email');
      if (storedEmail) setEmail(storedEmail);
      else setLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (email) fetchData();
  }, [email]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const [statsRes, videosRes] = await Promise.all([
        fetch(`${apiUrl}/youtube/stats?email=${email}`),
        fetch(`${apiUrl}/youtube/videos?email=${email}`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (videosRes.ok) setVideos(await videosRes.json());
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Disconnect YouTube?")) {
        localStorage.removeItem('yt_email');
        setEmail(null);
        setStats(null);
        setVideos([]);
        router.refresh();
    }
  };

  // --- BRIDGE FUNCTIONS ---
  const openThumbnailPicker = async (videoId: string) => {
    setSelectedVideo(videoId);
    setPickerOpen(true);
    
    // Fetch Canva designs fresh to ensure we have the latest
    const canvaId = localStorage.getItem('canva_id');
    if (!canvaId) {
        alert("Please connect Canva in the Studio tab first.");
        setPickerOpen(false);
        return;
    }

    if (canvaDesigns.length === 0) {
        setLoadingDesigns(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/canva/designs?canva_id=${canvaId}`);
            const data = await res.json();
            if (data.items) setCanvaDesigns(data.items);
        } catch (e) {
            console.error("Canva fetch error", e);
        } finally {
            setLoadingDesigns(false);
        }
    }
  };

  const applyThumbnail = async (designId: string) => {
    const canvaId = localStorage.getItem('canva_id');
    if (!email || !selectedVideo || !canvaId) return;

    setProcessingId(designId);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/bridge/thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: selectedVideo,
                canva_design_id: designId,
                youtube_email: email,
                canva_user_id: canvaId
            })
        });

        const result = await res.json();
        
        if (res.ok) {
            alert("Success! Thumbnail updated on YouTube.");
            setPickerOpen(false);
            fetchData(); 
        } else {
            alert(`Error: ${result.detail || 'Upload failed'}`);
        }

    } catch (error) {
        alert("Failed to connect to server");
    } finally {
        setProcessingId(null);
    }
  };


  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-white">Connect YouTube</h2>
        <button
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/youtube/login`}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
        >
            <Video className="w-5 h-5" /> Connect Channel
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-red-500 w-8 h-8" />
            Command Center
          </h2>
          <p className="text-slate-400 mt-1">Live analytics from {stats?.channel_name || 'YouTube'}</p>
        </div>
        
        {/* FIX: Show logout button if email exists, even if stats failed to load */}
        {email && (
           stats ? (
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full hover:bg-red-900/20 transition-colors group">
                <span className="text-sm font-medium text-white group-hover:text-red-400">{stats.channel_name}</span>
                <img src={stats.thumbnail} alt="Channel" className="w-8 h-8 rounded-full" />
                <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-500" />
             </button>
           ) : (
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
             </button>
           )
        )}
      </div>

      {loading && !stats ? (
         <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-red-500 animate-spin"/></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Users className="text-blue-400" />} label="Subscribers" value={parseInt(stats?.subscribers || '0').toLocaleString()} />
            <StatCard icon={<Eye className="text-green-400" />} label="Total Views" value={parseInt(stats?.views || '0').toLocaleString()} />
            <StatCard icon={<Video className="text-red-400" />} label="Total Videos" value={stats?.video_count || '0'} />
          </div>

          {/* Recent Videos List */}
          <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-slate-900/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" /> Recent Uploads
            </h3>
            <div className="space-y-4">
                {videos.map((video) => (
                    <div key={video.id} className="flex gap-4 items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-slate-800">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate text-lg">{video.title}</h4>
                            <p className="text-slate-400 text-xs mt-1">Published: {new Date(video.published_at).toLocaleDateString()}</p>
                        </div>
                        
                        {/* --- BRIDGE BUTTON --- */}
                        <button 
                            onClick={() => openThumbnailPicker(video.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg transition-all text-xs font-bold border border-orange-500/20"
                        >
                            <Wand2 className="w-3 h-3" /> Update Thumbnail
                        </button>
                        
                        <a href={`https://youtu.be/${video.id}`} target="_blank" className="p-2 text-slate-400 hover:text-white"><ExternalLink className="w-5 h-5" /></a>
                    </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* --- THUMBNAIL PICKER MODAL --- */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="text-orange-400 w-5 h-5" /> Select Canva Design
                        </h3>
                        <p className="text-slate-400 text-sm">Choose a design to use as your thumbnail</p>
                    </div>
                    <button onClick={() => setPickerOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loadingDesigns ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                            <p className="text-slate-500">Fetching designs from Canva...</p>
                        </div>
                    ) : canvaDesigns.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No designs found. Create one in the Studio first!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {canvaDesigns.map((design) => (
                                <button 
                                    key={design.id}
                                    disabled={!!processingId}
                                    onClick={() => applyThumbnail(design.id)}
                                    className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/5 hover:border-orange-500 transition-all text-left"
                                >
                                    {design.thumbnail?.url ? (
                                        <img src={design.thumbnail.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-600" /></div>
                                    )}
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <span className="text-white text-xs font-bold truncate">{design.title}</span>
                                    </div>

                                    {/* Processing State */}
                                    {processingId === design.id && (
                                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                                            <span className="text-xs text-orange-400 font-bold">Uploading...</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium">{label}</p>
                <h4 className="text-2xl font-bold text-white">{value}</h4>
            </div>
        </div>
    )
}

// 2. Export the Wrapped Component as Default
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin"/>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}