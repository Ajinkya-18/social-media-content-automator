"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PenTool, 
  Image as ImageIcon, 
  BarChart3, 
  Video,
  Palette,
  Layers,
  Eye
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", active: true },
    { name: "Writer", icon: PenTool, path: "/writer", active: true },
    { name: "Visualizer", icon: Eye, path: "/visualizer", active: true },
    { name: "Repurposer", icon: Layers, path: "/repurposer", active: true },
    { name: "Designer", icon: Palette, path: "/studio", active: true },   // Coming Soon
    { name: "Video Suite", icon: Video, path: "/video", active: false },        // Coming Soon
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight glow-text">
          AfterGlow
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">CREATOR OS v2.0</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.active ? item.path : "#"}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]" 
                  : item.active 
                    ? "text-slate-400 hover:bg-white/5 hover:text-slate-200" 
                    : "text-slate-700 cursor-not-allowed" // Disabled state
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : ""}`} />
              <span className="font-medium text-sm">{item.name}</span>
              
              {!item.active && (
                <span className="ml-auto text-[10px] font-mono bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded">
                  SOON
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}