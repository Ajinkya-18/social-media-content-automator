"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { 
  LayoutDashboard, Users, Eye, Video, Activity, ExternalLink, 
  Loader2, LogOut, Wand2, X, Image as ImageIcon, 
  Instagram, Flame, ArrowRight, Target, RefreshCw} from "lucide-react";

function DashboardContent() {
  const { user } = useUser();
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

  // --- INSTAGRAM STATE ---
  const [instaStats, setInstaStats] = useState<any>(null);
  const [instaId, setInstaId] = useState<string | null>(null);

  // --- TRENDSTREAM STATE ---
  const [niche, setNiche] = useState("");
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [hasNiche, setHasNiche] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Define API URL globally
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // 1. INSTAGRAM AUTH CHECK
  useEffect(() => {
    const urlInstaId = searchParams.get('instagram_id');
    if (urlInstaId) {
        setInstaId(urlInstaId);
        localStorage.setItem('insta_id', urlInstaId);
        router.replace('/dashboard');
    } else {
        const stored = localStorage.getItem('insta_id');
        if (stored) setInstaId(stored);
    }
  }, [searchParams, router]);

  // 2. FETCH INSTAGRAM STATS
  useEffect(() => {
    if (instaId) fetchInstaStats();
  }, [instaId]);

  const fetchInstaStats = async () => {
    try {
        const res = await fetch(`${apiUrl}/instagram/stats?instagram_id=${instaId}`);
        if (res.ok) {
            setInstaStats(await res.json());
        }
    } catch (e) {
        console.error("IG Fetch Error", e);
    }
  };

  const handleInstaDisconnect = () => {
      localStorage.removeItem('insta_id');
      setInstaStats(null);
      setInstaId(null);
  };

  // 3. YOUTUBE AUTH CHECK
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

  // 4. FETCH YOUTUBE DATA
  useEffect(() => {
    if (email) fetchData();
  }, [email]);

  const fetchData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
        checkNiche();
    }
  }, [user]);

  const checkNiche = async () => {
      // We assume /user/credits endpoint (or a new /user/profile endpoint) returns the niche
      // For now, let's just assume we prompt them if trends are empty
  };

  const handleSetNiche = async () => {
      if (!niche || !user?.primaryEmailAddress?.emailAddress) return;
      try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trends/set-niche`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress, niche })
          });
          setHasNiche(true);
          generateTrends();
      } catch (e) { console.error(e); }
  };

  const generateTrends = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      setLoadingTrends(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trends/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress })
          });
          const data = await res.json();
          if (Array.isArray(data)) setTrends(data);
      } catch (e) { console.error(e); }
      finally { setLoadingTrends(false); }
  };

  const handleUseTrend = (title: string) => {
      // Redirect to Writer with the prompt
      router.push(`/writer?prompt=${encodeURIComponent(title)}`);
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
    
    const canvaId = localStorage.getItem('canva_id');
    if (!canvaId) {
        alert("Please connect Canva in the Studio tab first.");
        setPickerOpen(false);
        return;
    }

    if (canvaDesigns.length === 0) {
        setLoadingDesigns(true);
        try {
            const res = await fetch(`${apiUrl}/canva/designs?canva_id=${canvaId}`);
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
        const res = await fetch(`${apiUrl}/bridge/thumbnail`, {
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
            onClick={() => window.location.href = `${apiUrl}/auth/youtube/login`}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-full font-bold transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-105"
        >
            <Video className="w-5 h-5" /> Sync Channel
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
            <LayoutDashboard className="text-cyan-400 w-8 h-8" />
            Command Center
          </h2>
          <p className="text-slate-400 mt-1">Live analytics from {stats?.channel_name || 'YouTube'}</p>
        </div>
        
        {email && (
           stats ? (
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full hover:bg-orange-500/10 transition-colors group border border-white/5 hover:border-orange-500/30">
                <span className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">{stats.channel_name}</span>
                <img src={stats.thumbnail} alt="Channel" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all" />
                <LogOut className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
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
         <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-orange-500 animate-spin"/></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Users className="text-cyan-400" />} label="Subscribers" value={parseInt(stats?.subscribers || '0').toLocaleString()} />
            <StatCard icon={<Eye className="text-blue-400" />} label="Total Views" value={parseInt(stats?.views || '0').toLocaleString()} />
            <StatCard icon={<Video className="text-orange-400" />} label="Total Videos" value={stats?.video_count || '0'} />
          </div>

          {/* --- NEW: TRENDSTREAM WIDGET --- */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-orange-900/10 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Flame className="w-32 h-32 text-orange-500" />
              </div>

              <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                      <Flame className="w-6 h-6 text-orange-500 fill-orange-500" /> 
                      TrendStream
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-xl">
                      AI-powered ideation engine. Stop staring at a blank page.
                  </p>

                  {!hasNiche && trends.length === 0 ? (
                      <div className="flex items-center gap-4 max-w-md">
                          <div className="relative flex-1">
                              <Target className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                              <input 
                                  type="text" 
                                  value={niche}
                                  onChange={(e) => setNiche(e.target.value)}
                                  placeholder="Enter your niche (e.g., 'Tech', 'Cooking')"
                                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-orange-500 outline-none transition-all"
                              />
                          </div>
                          <button 
                              onClick={handleSetNiche}
                              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all"
                          >
                              Start
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {loadingTrends ? (
                              <div className="flex items-center gap-3 text-orange-400 animate-pulse">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span className="font-mono text-sm">SCANNING THE ETHER...</span>
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {trends.map((trend, i) => (
                                      <div key={i} className="bg-black/40 border border-white/5 p-5 rounded-xl hover:border-orange-500/50 transition-all group flex flex-col">
                                          <div className="flex justify-between items-start mb-3">
                                              <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded text-slate-400 uppercase tracking-wider">{trend.type}</span>
                                              <button 
                                                  onClick={() => handleUseTrend(trend.title)}
                                                  className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500 hover:text-white transition-colors"
                                                  title="Write this Script"
                                              >
                                                  <Wand2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                          <h4 className="text-white font-bold leading-tight mb-2 group-hover:text-orange-100">{trend.title}</h4>
                                          <p className="text-xs text-slate-500 mt-auto">{trend.angle}</p>
                                      </div>
                                  ))}
                              </div>
                          )}
                          
                          {!loadingTrends && trends.length > 0 && (
                              <div className="flex justify-end">
                                  <button 
                                      onClick={generateTrends}
                                      className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1"
                                  >
                                      <RefreshCw className="w-3 h-3" /> Refresh Ideas
                                  </button>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>

          {/* Recent Videos List */}
          <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-slate-900/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" /> Recent Uploads
            </h3>
            <div className="space-y-4">
                {videos.map((video) => (
                    <div key={video.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group border border-transparent hover:border-white/5">
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-slate-800 shadow-lg">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate text-lg group-hover:text-cyan-400 transition-colors">{video.title}</h4>
                            <p className="text-slate-400 text-xs mt-1">Published: {new Date(video.published_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => openThumbnailPicker(video.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg transition-all text-xs font-bold border border-orange-500/20"
                            >
                                <Wand2 className="w-3 h-3" /> Update Thumbnail
                            </button>
                            
                            <a href={`https://youtu.be/${video.id}`} target="_blank" className="p-2 text-slate-500 hover:text-white transition-colors" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* --- INSTAGRAM SECTION --- */}
      <div className="mt-12 border-t border-white/5 pt-8">
          <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Instagram className="text-purple-400 w-8 h-8" />
                    Instagram Analytics
                </h3>
                <p className="text-slate-400 mt-1">
                    {instaStats ? `Stats for @${instaStats.username}` : 'Connect your Business Account'}
                </p>
              </div>

              {!instaId ? (
                  <button
                    onClick={() => window.location.href = `${apiUrl}/auth/instagram/login`}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                  >
                      <Instagram className="w-5 h-5" /> Connect Instagram
                  </button>
              ) : (
                  <button onClick={handleInstaDisconnect} className="text-sm text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4">
                      Disconnect
                  </button>
              )}
          </div>

          {instaStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                <StatCard 
                    icon={<Users className="text-purple-400" />} 
                    label="Followers" 
                    value={instaStats.followers.toLocaleString()} 
                />
                <StatCard 
                    icon={<ImageIcon className="text-cyan-400" />} 
                    label="Total Posts" 
                    value={instaStats.posts.toLocaleString()} 
                />
                <StatCard 
                    icon={<Activity className="text-green-400" />} 
                    label="Account Status" 
                    value="Active" 
                />
            </div>
          )}
      </div>

      {/* --- THUMBNAIL PICKER MODAL --- */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1121] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl shadow-black/50">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
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

                <div className="flex-1 overflow-y-auto p-6 bg-[#030712]">
                    {loadingDesigns ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            <p className="text-slate-500 font-mono text-sm">Fetching designs from Canva...</p>
                        </div>
                    ) : canvaDesigns.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <p>No designs found. Create one in the Studio first!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {canvaDesigns.map((design) => (
                                <button 
                                    key={design.id}
                                    disabled={!!processingId}
                                    onClick={() => applyThumbnail(design.id)}
                                    className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/5 hover:border-orange-500 transition-all text-left shadow-lg"
                                >
                                    {design.thumbnail?.url ? (
                                        <img src={design.thumbnail.url} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-600" /></div>
                                    )}
                                    
                                    {processingId === design.id && (
                                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                                            <span className="text-xs text-orange-400 font-bold tracking-widest">UPLOADING...</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <span className="text-white text-sm font-bold truncate">{design.title}</span>
                                        <span className="text-orange-400 text-xs mt-1">Click to Apply</span>
                                    </div>
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
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center gap-5 hover:border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
                <h4 className="text-3xl font-bold text-white mt-1 group-hover:text-cyan-100 transition-colors">{value}</h4>
            </div>
        </div>
    )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin"/>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
