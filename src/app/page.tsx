'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import Dashboard from '@/components/Dashboard';
import { Loader } from 'lucide-react';

// Lazy load heavy components
const Planner = dynamic(() => import('@/components/Planner'), { loading: () => <LoadingSpinner /> });
const Scripts = dynamic(() => import('@/components/Scripts'), { loading: () => <LoadingSpinner /> });
const SheetViewer = dynamic(() => import('@/components/SheetViewer'), { loading: () => <LoadingSpinner /> });
const Generator = dynamic(() => import('@/components/Generator'), { loading: () => <LoadingSpinner /> });
const ImageGenerator = dynamic(() => import('@/components/ImageGenerator'), { loading: () => <LoadingSpinner /> });
const Settings = dynamic(() => import('@/components/Settings'), { loading: () => <LoadingSpinner /> });

const LoadingSpinner = () => (
  <div className="h-full flex items-center justify-center">
    <Loader className="animate-spin text-blue-500" size={32} />
  </div>
);

export default function Home() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'planner':
        return <Planner />;
      case 'scripts':
        return <Scripts />;
      case 'sheet':
        return <SheetViewer />;
      case 'generator':
        return <Generator />;
      case 'images':
        return <ImageGenerator />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-full">
      <Suspense fallback={<LoadingSpinner />}>
        {renderView()}
      </Suspense>
    </div>
  );
}
