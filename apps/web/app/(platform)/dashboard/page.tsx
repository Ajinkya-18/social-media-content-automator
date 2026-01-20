"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useCredits } from "../../components/CreditsContext"; 
import { 
  LayoutDashboard, Users, Eye, Video, Activity, ExternalLink, 
  Loader2, LogOut, Wand2, X, Image as ImageIcon, Youtube,
  Instagram, Flame, ArrowRight, Target, RefreshCw, PieChart,
  TrendingUp, Palette, Linkedin, MousePointer, Clock, BarChart3
} from "lucide-react";

// --- COMPONENTS ---

function StatCard({ icon, label, value, subtext, color }: { icon: any, label: string, value: string, subtext?: string, color?: string }) {
    return (
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-start gap-5 hover:border-white/10 hover:bg-white/5 transition-all group relative overflow-hidden bg-[#0b1121]">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
               {icon}
            </div>
            <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ${color?.replace('text-', 'text-opacity-80 ')}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h4 className="text-2xl font-bold text-white group-hover:text-cyan-50 transition-colors">{value}</h4>
                {subtext && <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>}
            </div>
        </div>
    )
}

function DashboardContent() {
  const { user } = useUser();
  const { credits, tier } = useCredits();
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  
  // YouTube
  const [ytStats, setYtStats] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [ytEmail, setYtEmail] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<any>(null); // Color Psychographics

  // LinkedIn
  const [liStats, setLiStats] = useState<any>(null);
  const [liCompanies, setLiCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [liLoading, setLiLoading] = useState(false);
  const [liConnected, setLiConnected] = useState(false);

  // Instagram
  const [instaStats, setInstaStats] = useState<any>(null);
  const [instaId, setInstaId] = useState<string | null>(null);

  // TrendStream
  const [niche, setNiche] = useState("");
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [hasNiche, setHasNiche] = useState(false);

  // Bridge (Thumbnail)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [canvaDesigns, setCanvaDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // --- 1. INITIALIZATION & AUTH CHECKS ---
  useEffect(() => {
    // Check Local Storage
    const storedYt = localStorage.getItem('yt_email');
    if (storedYt) setYtEmail(storedYt);

    const storedLi = localStorage.getItem('linkedin_id');
    if (storedLi) {
        setLiConnected(true);
        fetchLinkedinCompanies(storedLi);
    }

    const storedInsta = localStorage.getItem('insta_id');
    if (storedInsta) setInstaId(storedInsta);

    // Check URL Params (Callbacks)
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const emailParam = searchParams.get('email');
    const liIdParam = searchParams.get('linkedin_id');
    const instaIdParam = searchParams.get('instagram_id');

    if (status === 'connected') {
        if (emailParam) { // YouTube
            setYtEmail(emailParam);
            localStorage.setItem('yt_email', emailParam);
        }
        if (provider === 'linkedin' && liIdParam) { // LinkedIn
            setLiConnected(true);
            localStorage.setItem('linkedin_id', liIdParam);
            fetchLinkedinCompanies(liIdParam);
        }
        if (instaIdParam) { // Instagram
            setInstaId(instaIdParam);
            localStorage.setItem('insta_id', instaIdParam);
        }
        // Clean URL
        router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // --- 2. DATA FETCHING ---
  
  // Fetch YouTube Data
  useEffect(() => {
    if (ytEmail) fetchYoutubeData();
  }, [ytEmail]);

  // Fetch Instagram Data
  useEffect(() => {
    if (instaId) fetchInstaStats();
  }, [instaId]);

  const fetchYoutubeData = async () => {
      setLoading(true);
      try {
          // 1. Stats (New format)
          const statsRes = await fetch(`${apiUrl}/api/analytics/youtube?email=${ytEmail}`);
          if (statsRes.ok) setYtStats(await statsRes.json());

          // 2. Recent Videos
          const videosRes = await fetch(`${apiUrl}/youtube/videos?email=${ytEmail}`);
          if (videosRes.ok) setVideos(await videosRes.json());

          // 3. Intelligence (Colors)
          const intRes = await fetch(`${apiUrl}/api/analytics/intelligence?email=${ytEmail}`);
          if (intRes.ok) {
              const data = await intRes.json();
              setIntelligence(data.analysis || data); 
          }
      } catch (e) { console.error("YT Fetch Error", e); }
      finally { setLoading(false); }
  };

  const fetchLinkedinCompanies = async (id: string) => {
      try {
          const res = await fetch(`${apiUrl}/api/linkedin/companies?linkedin_id=${id}`);
          const data = await res.json();
          if (data.companies) {
              setLiCompanies(data.companies);
              // Default to Personal Profile ("") if no companies, or just let user choose
              // We don't auto-select a company anymore to allow Personal Profile as default option
              fetchLinkedinStats(id, ""); 
          }
      } catch (e) { console.error("LI Companies Error", e); }
  };

  const fetchLinkedinStats = async (id: string, urn: string) => {
      setLiLoading(true);
      try {
          // If urn is empty, it fetches personal profile info (but maybe no stats if API limited)
          const res = await fetch(`${apiUrl}/api/analytics/linkedin?linkedin_id=${id}&company_urn=${urn}`);
          if (res.ok) setLiStats(await res.json());
      } catch (e) { console.error("LI Stats Error", e); }
      finally { setLiLoading(false); }
  };

  const fetchInstaStats = async () => {
      try {
          const res = await fetch(`${apiUrl}/instagram/stats?instagram_id=${instaId}`);
          if (res.ok) setInstaStats(await res.json());
      } catch (e) { console.error("IG Fetch Error", e); }
  };

  // --- 3. HANDLERS ---

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const urn = e.target.value;
      setSelectedCompany(urn);
      const liId = localStorage.getItem('linkedin_id');
      if (liId) fetchLinkedinStats(liId, urn);
  };

  const handleTrendGen = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      setLoadingTrends(true);
      try {
          // If niche hasn't been set in backend, set it first
          if (niche && !hasNiche) {
             await fetch(`${apiUrl}/api/trends/set-niche`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress, niche })
             });
             setHasNiche(true);
          }
          
          const res = await fetch(`${apiUrl}/api/trends/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress })
          });
          const data = await res.json();
          if (Array.isArray(data)) setTrends(data);
      } catch (e) { console.error(e); }
      finally { setLoadingTrends(false); }
  };

  const openThumbnailPicker = async (videoId: string) => {
    setSelectedVideo(videoId);
    setPickerOpen(true);
    const canvaId = localStorage.getItem('canva_id'); // Assuming stored from Studio
    
    if (canvaDesigns.length === 0 && canvaId) {
        setLoadingDesigns(true);
        try {
            const res = await fetch(`${apiUrl}/canva/designs?canva_id=${canvaId}`);
            const data = await res.json();
            if (data.items) setCanvaDesigns(data.items);
        } catch (e) { console.error(e); } 
        finally { setLoadingDesigns(false); }
    }
  };

  const applyThumbnail = async (designId: string) => {
      const canvaId = localStorage.getItem('canva_id');
      if (!ytEmail || !selectedVideo || !canvaId) return;
      setProcessingId(designId);
      try {
          const res = await fetch(`${apiUrl}/bridge/thumbnail`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ video_id: selectedVideo, canva_design_id: designId, youtube_email: ytEmail, canva_user_id: canvaId })
          });
          if (res.ok) { alert("Thumbnail Updated!"); setPickerOpen(false); fetchYoutubeData(); }
          else { alert("Update failed."); }
      } catch (e) { console.error(e); }
      finally { setProcessingId(null); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative pb-20">
      
      {/* HEADER & CREDITS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <LayoutDashboard className="text-cyan-400 w-8 h-8" />
                Command Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">Multi-platform analytics & intelligence.</p>
        </div>
        
        {/* GLOBAL CREDITS BADGE */}
        <div className="flex items-center gap-4 bg-[#0b1121] border border-white/10 px-5 py-2.5 rounded-xl shadow-lg">
            <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{tier || 'Free'} Plan</div>
                <div className="text-sm font-mono text-orange-400 flex items-center gap-2 justify-end">
                    <span className="font-bold text-lg">{credits || 0}</span> Credits
                </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Activity className="w-5 h-5" />
            </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'youtube', label: 'YouTube Studio', icon: Youtube },
              { id: 'linkedin', label: 'LinkedIn Intelligence', icon: Linkedin },
              { id: 'instagram', label: 'Instagram', icon: Instagram },
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap rounded-t-lg
                    ${activeTab === tab.id 
                        ? 'border-cyan-500 text-white bg-white/5' 
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                `}
              >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-400' : ''}`} /> {tab.label}
              </button>
          ))}
      </div>

      {/* --- TAB CONTENT: OVERVIEW --- */}
      {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              {/* Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* YouTube Summary */}
                  <StatCard 
                    icon={<Eye className="w-6 h-6 text-red-400"/>} 
                    label="YT Views (30d)" 
                    value={ytStats?.overview?.views?.toLocaleString() || "--"} 
                    color="text-red-400"
                  />
                  <StatCard 
                    icon={<Users className="w-6 h-6 text-red-400"/>} 
                    label="Subscribers" 
                    value={ytStats?.overview?.total_subs?.toLocaleString() || "--"} 
                    color="text-red-400"
                  />
                  
                  {/* LinkedIn Summary */}
                  <StatCard 
                    icon={<BarChart3 className="w-6 h-6 text-blue-400"/>} 
                    label="LI Impressions" 
                    value={liStats?.overview?.impressions?.toLocaleString() || "--"} 
                    color="text-blue-400"
                  />
                  <StatCard 
                    icon={<MousePointer className="w-6 h-6 text-blue-400"/>} 
                    label="LI Clicks" 
                    value={liStats?.overview?.clicks?.toLocaleString() || "--"} 
                    color="text-blue-400"
                  />
              </div>

              {/* TrendStream Widget (Ideation) */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-orange-900/10 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Flame className="w-32 h-32 text-orange-500" />
                  </div>
                  <div className="relative z-10">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" /> TrendStream Engine
                      </h3>
                      <p className="text-slate-400 text-sm mb-6 max-w-xl">AI-powered ideation. Generate viral concepts based on your niche.</p>

                      <div className="flex flex-wrap gap-4 items-end mb-6">
                          <div className="flex-1 min-w-[200px]">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Your Niche</label>
                              <div className="relative">
                                  <Target className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                  <input 
                                      type="text" 
                                      value={niche}
                                      onChange={(e) => setNiche(e.target.value)}
                                      placeholder="e.g. 'SaaS Marketing', 'Vegan Cooking'"
                                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-orange-500 outline-none transition-all text-sm"
                                  />
                              </div>
                          </div>
                          <button onClick={handleTrendGen} disabled={loadingTrends || !niche} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                              {loadingTrends ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>} 
                              Generate Ideas
                          </button>
                      </div>

                      {trends.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {trends.map((trend, i) => (
                                  <div key={i} className="bg-black/40 border border-white/5 p-5 rounded-xl hover:border-orange-500/50 transition-all group flex flex-col">
                                      <div className="flex justify-between items-start mb-3">
                                          <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded text-slate-400 uppercase tracking-wider">{trend.type}</span>
                                          <button onClick={() => router.push(`/writer?prompt=${encodeURIComponent(trend.title)}`)} className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500 hover:text-white transition-colors" title="Create Script"><Wand2 className="w-3 h-3" /></button>
                                      </div>
                                      <h4 className="text-white font-bold text-sm leading-snug mb-2 group-hover:text-orange-100">{trend.title}</h4>
                                      <p className="text-[10px] text-slate-500 mt-auto">{trend.angle}</p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB CONTENT: YOUTUBE --- */}
      {activeTab === 'youtube' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {!ytEmail ? (
                  <div className="text-center py-20 bg-[#0b1121] rounded-3xl border border-white/5 border-dashed">
                      <Youtube className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Connect YouTube</h3>
                      <button onClick={() => window.location.href = `${apiUrl}/auth/youtube/login`} className="px-6 py-2 mt-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">Sync Channel</button>
                  </div>
              ) : (
                  <>
                    {/* YouTube Header & Disconnect */}
                    <div className="flex justify-between items-center bg-[#0b1121] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Youtube className="w-6 h-6 text-red-500" />
                            <span className="text-white font-bold text-sm">
                                {ytStats?.channel_name || "Connected Channel"}
                            </span>
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('yt_email');
                                setYtEmail(null);
                                setYtStats(null);
                            }} 
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>

                    {/* YT Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<Eye/>} label="30-Day Views" value={ytStats?.overview?.views?.toLocaleString() || "0"} color="text-red-400" />
                        <StatCard icon={<Clock/>} label="Watch Time" value={`${ytStats?.overview?.watch_time_hours || 0} hrs`} color="text-red-400" />
                        <StatCard icon={<TrendingUp/>} label="Avg Likes" value={ytStats?.overview?.likes?.toLocaleString() || "0"} color="text-green-400" />
                    </div>

                    {/* Color Psychographics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-[#0b1121] border border-white/5 rounded-2xl p-6 relative">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-purple-500"/> Color Psychographics</h3>
                                {intelligence && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: intelligence.best_performing_color}}/><span className="text-xs text-slate-400">Top Color</span></div>}
                            </div>
                            <div className="h-[200px] w-full flex items-end justify-between gap-2 px-2 border-b border-white/5 pb-4">
                                {intelligence?.data?.map((item: any, i: number) => {
                                    const max = Math.max(...intelligence.data.map((d: any) => d.views));
                                    return (
                                        <div key={i} className="group relative flex flex-col items-center w-full">
                                            <div className="w-full max-w-[40px] rounded-t-sm transition-all hover:opacity-80" style={{height: `${(item.views/max)*100}%`, backgroundColor: item.color}}/>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Bridge / Recent Videos */}
                        <div className="bg-[#0b1121] border border-white/5 rounded-2xl p-6 h-full overflow-y-auto max-h-[400px] custom-scrollbar">
                            <h3 className="text-lg font-bold text-white mb-4">Recent Uploads</h3>
                            <div className="space-y-4">
                                {videos.map(v => (
                                    <div key={v.id} className="flex gap-3 items-center group">
                                        <img src={v.thumbnail} alt={`Thumbnail for ${v.title}`} className="w-20 rounded-md opacity-70 group-hover:opacity-100 transition-opacity"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate font-medium">{v.title}</p>
                                            <button onClick={() => openThumbnailPicker(v.id)} className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1"><Wand2 className="w-3 h-3"/> Edit Thumb</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </>
              )}
          </div>
      )}

      {/* --- TAB CONTENT: LINKEDIN --- */}
      {activeTab === 'linkedin' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {!liConnected ? (
                  <div className="text-center py-20 bg-[#0b1121] rounded-3xl border border-white/5 border-dashed">
                      <Linkedin className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Connect LinkedIn</h3>
                      <button onClick={() => window.location.href = `${apiUrl}/auth/linkedin/login`} className="px-6 py-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Connect Page</button>
                  </div>
              ) : (
                  <>
                    <div className="flex justify-between items-center bg-[#0b1121] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Linkedin className="w-6 h-6 text-blue-500" />
                            <select value={selectedCompany} onChange={handleCompanyChange} aria-label="Select LinkedIn company" className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none min-w-[200px]">
                                <option value="">Personal Profile</option> {/* Added Personal Profile Option */}
                                {liCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={() => { localStorage.removeItem('linkedin_id'); setLiConnected(false); }} className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
                    </div>

                    {liStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard icon={<Eye/>} label="Impressions" value={liStats.overview?.impressions?.toLocaleString() || "0"} color="text-blue-400" />
                            <StatCard icon={<MousePointer/>} label="Clicks" value={liStats.overview?.clicks?.toLocaleString() || "0"} color="text-purple-400" />
                            <StatCard icon={<TrendingUp/>} label="Engagement" value={liStats.overview?.engagements?.toLocaleString() || "0"} color="text-green-400" />
                            <StatCard icon={<Users/>} label="Likes" value={liStats.overview?.likes?.toLocaleString() || "0"} color="text-blue-400" />
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                            {liLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500"/> : "Select a company or profile to view intelligence."}
                        </div>
                    )}
                  </>
              )}
          </div>
      )}

      {/* --- TAB CONTENT: INSTAGRAM --- */}
      {activeTab === 'instagram' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {!instaId ? (
                  <div className="text-center py-20 bg-[#0b1121] rounded-3xl border border-white/5 border-dashed">
                      <Instagram className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Connect Instagram</h3>
                      <button onClick={() => window.location.href = `${apiUrl}/auth/instagram/login`} className="px-6 py-2 mt-4 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold">Connect Business Account</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard icon={<Users/>} label="Followers" value={instaStats?.followers?.toLocaleString() || "0"} color="text-pink-400" />
                      <StatCard icon={<ImageIcon/>} label="Media Count" value={instaStats?.posts?.toLocaleString() || "0"} color="text-purple-400" />
                      <StatCard icon={<Activity/>} label="Status" value="Active" color="text-green-400" />
                  </div>
              )}
          </div>
      )}

      {/* --- THUMBNAIL PICKER MODAL --- */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1121] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon className="text-orange-400 w-5 h-5" /> Select Canva Design</h3>
                    <button onClick={() => setPickerOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white" aria-label="Close thumbnail picker"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loadingDesigns ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-orange-500 animate-spin"/></div> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {canvaDesigns.map((design) => (
                                <button key={design.id} disabled={!!processingId} onClick={() => applyThumbnail(design.id)} className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/5 hover:border-orange-500 transition-all">
                                    {design.thumbnail?.url ? <img src={design.thumbnail.url} alt={`Canva design thumbnail`} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-600" /></div>}
                                    {processingId === design.id && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-8 h-8 text-orange-400 animate-spin"/></div>}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-black"><Loader2 className="w-10 h-10 text-orange-500 animate-spin"/></div>}>
      <DashboardContent />
    </Suspense>
  );
}