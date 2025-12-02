import React from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, MoreVertical } from 'lucide-react';

interface YouTubeCommunityPreviewProps {
  content: string;
}

export const YouTubeCommunityPreview: React.FC<YouTubeCommunityPreviewProps> = ({ content }) => {
  return (
    <div className="bg-[#0f0f0f] text-white rounded-xl overflow-hidden border border-gray-800 max-w-[600px] mx-auto font-sans">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
              N
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white">Nocturnal</p>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
            </div>
          </div>
          <button className="text-white hover:bg-white/10 p-2 rounded-full">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-white whitespace-pre-wrap mb-4 pl-[52px]">
          {content || "Your generated community post will appear here..."}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pl-[52px]">
          <div className="flex items-center space-x-1">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ThumbsUp size={20} />
            </button>
            <span className="text-xs text-gray-400">1.2K</span>
          </div>
          
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ThumbsDown size={20} />
          </button>

          <button className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2">
            <MessageSquare size={20} />
          </button>
          <span className="text-xs text-gray-400">48</span>
        </div>
      </div>
    </div>
  );
};
