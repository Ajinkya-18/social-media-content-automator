'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, FileText, Zap, Settings, Menu, X, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { AuroraBackground } from './AuroraBackground';

const SidebarItem = ({ icon: Icon, label, view, active, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-white/20 shadow-lg border border-white/10' : 'text-gray-400 hover:text-white'
    }`}
  >
    <Icon size={20} className="mr-3" />
    <span className="font-medium">{label}</span>
  </motion.button>
);

import { useIsMounted } from '../hooks/useIsMounted';

// ...

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, isSidebarOpen, toggleSidebar } = useAppStore();
  const isMounted = useIsMounted();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: Calendar, label: 'Planner', view: 'planner' },
    { icon: FileText, label: 'Scripts', view: 'scripts' },
    { icon: Zap, label: 'Generator', view: 'generator' },
    { icon: ImageIcon, label: 'Images', view: 'images' },
    { icon: Settings, label: 'Settings', view: 'settings' },
  ];

  const glassPanelClass = "backdrop-blur-xl bg-black/40 border border-white/10 shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen text-white font-sans selection:bg-purple-500/30">
      {isMounted && <AuroraBackground />}

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className={`h-full flex flex-col ${glassPanelClass} border-r-0`}
          style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Nocturnal
            </h1>
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.view}
                icon={item.icon}
                label={item.label}
                view={item.view}
                active={currentView === item.view}
                onClick={() => setCurrentView(item.view as any)}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            {/* User profile removed from here */}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <header className={`h-16 flex items-center justify-between px-6 ${glassPanelClass} border-b-0 mb-4 mx-4 mt-4 rounded-xl`}>
            <div className="flex items-center">
              {!isSidebarOpen && (
                <button onClick={toggleSidebar} className="mr-4 text-gray-400 hover:text-white">
                  <Menu size={20} />
                </button>
              )}
              <h2 className="text-lg font-medium text-gray-200 capitalize">{currentView}</h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile moved here */}
              <div className="flex items-center p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                <div className="text-right mr-3 hidden sm:block">
                  <p className="text-sm font-medium text-white">Nocturnal User</p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                  N
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
