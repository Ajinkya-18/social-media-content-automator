"use client";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-[#030712]/80 backdrop-blur-md text-white border-b border-white/10">
      
      {/* Brand Name */}
      <div className="text-xl font-bold tracking-tight">
        <Link href="/" className="hover:text-cyan-400 transition-colors bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">
          AfterGlow
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-8">
        
        {/* <NavLink href="/" active={pathname === "/"}>Home</NavLink> */}
        
        {isSignedIn && (
          <>
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>Dashboard</NavLink>
            <NavLink href="/studio" active={pathname === "/studio"}>Designer</NavLink>
            <NavLink href="/repurposer" active={pathname === "/repurposer"}>Repurposer</NavLink>
            <NavLink href="/visualizer" active={pathname === "/visualizer"}>Visualizer</NavLink>
            <NavLink href="/video" active={pathname === "/video"}>Video Suite</NavLink>
            <NavLink href="/writer" active={pathname === "/writer"}>Writer</NavLink>
            <NavLink href="/scheduler" active={pathname === "/scheduler"}>Scheduler</NavLink>
            <NavLink href="/pricing" active={pathname === "/pricing"}>Pricing</NavLink>
          </>
        )}

        {/* Auth Buttons */}
        <div className="ml-4 pl-4 border-l border-white/10">
          {!isLoaded ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : isSignedIn ? (
            // FIX: Replaced deprecated props with appearance customization
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-white/10 hover:border-cyan-500 transition-colors"
                }
              }}
            />
          ) : (
            <div className="space-x-4">
              <Link href="/sign-in">
                <button className="text-sm hover:text-white text-slate-300 transition-colors">Sign In</button>
              </Link>
              <Link href="/sign-up">
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm transition-colors font-bold shadow-lg shadow-blue-900/20">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors relative group ${
        active ? "text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
      {/* Active Indicator Dot */}
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      )}
    </Link>
  )
}