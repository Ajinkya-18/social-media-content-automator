"use client";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import CreditsDisplay from "./CreditsDisplay";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between transition-all duration-300">
      
      {/* Brand: Fire & Ice Gradient */}
      <div className="flex items-center gap-2">
        <Link href="/" className="text-2xl font-bold tracking-tight group">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text group-hover:to-orange-500 transition-all duration-500">
            AfterGlow
          </span>
          {/* <span className="text-xs text-orange-500 font-mono ml-1 align-top">v2</span> */}
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8">
        {isSignedIn && (
          <>
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>Command Center</NavLink>
            <NavLink href="/video" active={pathname === "/video"}>Video Suite</NavLink>
            <NavLink href="/repurposer" active={pathname === "/repurposer"}>Repurposer</NavLink>
            <NavLink href="/visualizer" active={pathname === "/visualizer"}>Visualizer</NavLink>
            <NavLink href="/writer" active={pathname === "/writer"}>Writer</NavLink>
            <NavLink href="/vault" active={pathname === "/vault"}>Content Vault</NavLink>
            <NavLink href="/scheduler" active={pathname === "/scheduler"}>Scheduler</NavLink>
            <NavLink href="/studio" active={pathname === "/studio"}>Studio</NavLink>
            <NavLink href="/pricing" active={pathname === "/pricing"}>Pricing</NavLink>
          </>
        )}
      </div>

      {/* Auth / Actions */}
      <div className="flex items-center gap-4">
        {!isLoaded ? (
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        ) : isSignedIn ? (
          <div className="flex items-center gap-4">
            {/* <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-200">PRO</span>
            </div> */}
            <CreditsDisplay />
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-white/10 hover:border-orange-500 transition-colors"
                }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <button className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-sm font-bold rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-105">
                Get Started
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-all relative ${
        active ? "text-white" : "text-slate-400 hover:text-cyan-400"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-6 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-orange-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      )}
    </Link>
  )
}