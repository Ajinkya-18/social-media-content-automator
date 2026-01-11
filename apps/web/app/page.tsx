import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Youtube, Palette, Zap } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-white overflow-hidden relative">
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 relative z-10">
        
        <div className="space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Zap className="w-3 h-3 fill-current" />
            <span>The AI Content Engine is Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight pb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              AfterGlow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop switching tabs. The only platform that bridges 
            <span className="text-white font-semibold"> Canva Design</span> directly to 
            <span className="text-white font-semibold"> YouTube Command</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24 max-w-5xl w-full">
            <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all hover:bg-gradient-to-br hover:from-white/5 hover:to-cyan-500/10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <Palette className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Canva Studio</h3>
                <p className="text-slate-400">Sync designs, generate smart formats, and edit without leaving your dashboard.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all hover:bg-gradient-to-br hover:from-white/5 hover:to-purple-500/10">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <Youtube className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">YouTube Command</h3>
                <p className="text-slate-400">Real-time analytics, instant thumbnail updates, and content scheduling.</p>
            </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-600 text-sm relative z-10 border-t border-white/5 bg-[#030712]">
        © 2026 AfterGlow Inc.
      </footer>
    </div>
  );
}