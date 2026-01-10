// apps/web/app/components/AfterGlowToast.tsx
"use client"; // Required for client-side interactivity

import React, { useEffect } from 'react';
// Ensure you have lucide-react installed: npm install lucide-react
import { CheckCircle, X, ExternalLink } from 'lucide-react'; 

interface AfterGlowToastProps {
  fileLink: string;
  onClose: () => void;
  type?: 'Visual' | 'Script';
}

const AfterGlowToast: React.FC<AfterGlowToastProps> = ({ fileLink, onClose, type = 'Visual' }) => {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
      {/* Container: Dark Backdrop + Purple Glow Border */}
      <div className="flex items-center gap-4 p-4 rounded-xl 
                      bg-black/90 backdrop-blur-md 
                      border border-purple-500/40 
                      shadow-[0_0_20px_rgba(168,85,247,0.25)]
                      text-white min-w-[320px]">
        
        {/* Success Icon */}
        <div className="flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-gray-100 tracking-wide">
            {type} Saved to Drive
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Securely stored in your cloud.
          </p>
        </div>

        {/* Open Button */}
        <a 
          href={fileLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-3 py-1.5 
                     bg-purple-900/30 hover:bg-purple-800/50 
                     border border-purple-500/30 rounded-lg 
                     transition-all duration-300 text-xs font-medium text-purple-200"
        >
          <span>View</span>
          <ExternalLink className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* Close X Button */}
        <button 
          onClick={onClose}
          className="ml-2 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AfterGlowToast;