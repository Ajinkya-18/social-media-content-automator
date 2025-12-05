'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, File, CheckCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <Icon size={24} className="text-white" />
    </div>
    <h3 className="text-gray-400 text-sm font-medium">{label}</h3>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
  </motion.div>
);

export default function Dashboard() {
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalViews: '1.2M', // Mock for now
    scheduled: 0,
    drafts: 0,
    completed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Files
      // Fetch Files
      const filesRes = await fetch('/api/local/files');
      const filesContentType = filesRes.headers.get("content-type");
      if (filesContentType && filesContentType.indexOf("application/json") !== -1) {
        const filesData = await filesRes.json();
        if (filesData.files) {
          // Sort by modified date desc
          const sortedFiles = filesData.files
            .filter((f: any) => !f.isDirectory)
            .sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
            .slice(0, 5);
          setRecentFiles(sortedFiles);
          setStats(prev => ({ ...prev, drafts: filesData.files.length }));
        }
      }

      // Fetch Planner
      const plannerRes = await fetch('/api/local/planner');
      const plannerContentType = plannerRes.headers.get("content-type");
      if (plannerContentType && plannerContentType.indexOf("application/json") !== -1) {
        const plannerData = await plannerRes.json();
        if (Array.isArray(plannerData)) {
          const upcoming = plannerData
            .filter((p: any) => p.status === 'planned' || p.status === 'scheduled')
            .slice(0, 5);
          setUpcomingPlans(upcoming);
          setStats(prev => ({ 
            ...prev, 
            scheduled: plannerData.filter((p: any) => p.status === 'scheduled').length,
            completed: plannerData.filter((p: any) => p.status === 'published').length
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, User</h1>
        <p className="text-gray-400 mt-2">Here's what's happening with your content today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={TrendingUp} label="Total Views" value={stats.totalViews} color="bg-blue-500/20" />
        <StatCard icon={Clock} label="Scheduled" value={stats.scheduled} color="bg-purple-500/20" />
        <StatCard icon={File} label="Total Files" value={stats.drafts} color="bg-orange-500/20" />
        <StatCard icon={CheckCircle} label="Published" value={stats.completed} color="bg-green-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">Recent Files</h2>
          <div className="space-y-4">
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div key={file.name} className="flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <File size={20} />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{file.name}</h4>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {new Date(file.modified).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent files found.</p>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">Upcoming Schedule</h2>
          <div className="space-y-4">
            {upcomingPlans.length > 0 ? (
              upcomingPlans.map((plan) => (
                <div key={plan.id} className="flex items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Clock size={20} />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{plan.topic}</h4>
                    <p className="text-sm text-gray-400 capitalize">{plan.platform}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs whitespace-nowrap ml-2">
                    {plan.date || 'Planned'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming plans.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
