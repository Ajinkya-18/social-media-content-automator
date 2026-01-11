"use client";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation"; // To highlight active link

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    // FIX 1: Added 'fixed top-0 w-full z-50' to make it sticky and stay on top
    // Added 'backdrop-blur-md' so content behind it looks nice when scrolling
    <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md text-white border-b border-white/10">
      
      {/* Brand Name */}
      <div className="text-xl font-bold tracking-tight">
        <Link href="/" className="hover:text-red-500 transition-colors">AfterGlow</Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-8">
        
        {/* FIX 2: Added logic to highlight the active page */}
        
        {/* Only show App links if logged in */}
        {isSignedIn && (
          <>
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>Dashboard</NavLink>
            {/* FIX 3: Added the missing link to The Studio */}
            <NavLink href="/studio" active={pathname === "/studio"}>Designer</NavLink>
            <NavLink href="/repurposer" active={pathname === "/repurposer"}>Repurposer</NavLink>
            <NavLink href="/visualizer" active={pathname === "/visualizer"}>Visualizer</NavLink>
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
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="space-x-4">
              <Link href="/sign-in">
                <button className="text-sm hover:text-white text-slate-300 transition-colors">Sign In</button>
              </Link>
              <Link href="/sign-up">
                <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm transition-colors font-bold">
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

// Helper component for consistent links
function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors ${
        active ? "text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </Link>
  )
}