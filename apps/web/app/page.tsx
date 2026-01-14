import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Youtube, Palette, Zap, Layers } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-10 relative z-10">
        
        <div className="space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 tracking-wide uppercase">
            <Zap className="w-3 h-3 fill-current" />
            <span>AfterGlow v2 is Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight pb-2 leading-tight">
            The Operating System for <br/>
            <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              Creators
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop switching tabs. The only platform that bridges 
            <span className="text-cyan-400 font-semibold"> Canva Design</span> directly to 
            <span className="text-orange-400 font-semibold"> YouTube Performance</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up">
              <button className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-full font-bold transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-105">
                Start Creating Free <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                Login
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full text-left">
            <div className="group p-8 rounded-3xl bg-[#0b1121] border border-white/5 hover:border-orange-500/50 transition-all hover:bg-gradient-to-br hover:from-white/5 hover:to-orange-500/10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Design Matrix</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Sync designs from Canva, generate smart formats, and edit without leaving your dashboard.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-[#0b1121] border border-white/5 hover:border-cyan-500/50 transition-all hover:bg-gradient-to-br hover:from-white/5 hover:to-cyan-500/10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Youtube className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Command Center</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Real-time YouTube analytics, instant thumbnail updates, and performance prediction.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-[#0b1121] border border-white/5 hover:border-purple-500/50 transition-all hover:bg-gradient-to-br hover:from-white/5 hover:to-purple-500/10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Video Forge</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Turn text into cinematic video clips using our hosted Zeroscope v2 AI engine.</p>
            </div>
        </div>
      </main>
    </div>
  );
}