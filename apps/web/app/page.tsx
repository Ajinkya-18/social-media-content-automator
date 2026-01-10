import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // Import redirect
import { ArrowRight, Youtube, Palette } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  // FIX: Auto-redirect to Dashboard if user is already logged in
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20">
        
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-purple-600 text-transparent bg-clip-text pb-2">
            AfterGlow
          </h1>
          <p className="text-xl text-slate-400">
            The bridge between your design studio and your audience. 
            Seamlessly publish Canva designs directly to YouTube.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <button className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="px-8 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20 max-w-4xl w-full">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition-colors">
                <Palette className="w-10 h-10 text-orange-500 mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Canva Studio</h3>
                <p className="text-slate-400">Manage, edit, and export your designs without leaving the app.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors">
                <Youtube className="w-10 h-10 text-red-500 mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">YouTube Command</h3>
                <p className="text-slate-400">Track analytics and update video thumbnails instantly.</p>
            </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-600 text-sm">
        © 2026 AfterGlow Inc.
      </footer>
    </div>
  );
}