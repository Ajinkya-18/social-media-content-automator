import React from 'react';
import { ThumbsUp, MessageSquare, Repeat, Send, MoreHorizontal, Globe } from 'lucide-react';

interface LinkedInPreviewProps {
  content: string;
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({ content }) => {
  return (
    <div className="bg-white text-black rounded-lg overflow-hidden shadow-sm border border-gray-300 max-w-[550px] mx-auto font-sans">
      {/* Header */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div>
            <div className="flex items-center space-x-1">
              <p className="text-sm font-semibold text-gray-900">Nocturnal User</p>
              <span className="text-gray-500 text-xs">• 1st</span>
            </div>
            <p className="text-xs text-gray-500">AI Content Creator | Tech Enthusiast</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>2h • </span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <button className="text-gray-600 hover:bg-gray-100 p-1 rounded-full">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-sm text-gray-900 whitespace-pre-wrap">
        {content ? (
          <>
            <div className="line-clamp-5">{content}</div>
            <button className="text-gray-500 hover:text-blue-600 hover:underline mt-1 font-medium">
              ...see more
            </button>
          </>
        ) : (
          "Your generated content will appear here..."
        )}
      </div>

      {/* Media Placeholder (Optional but common on LinkedIn) */}
      {/* <div className="bg-gray-100 h-64 w-full flex items-center justify-center text-gray-400 border-t border-b border-gray-100 mt-2">
        <span className="text-sm">Image/Video Placeholder</span>
      </div> */}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 mt-2">
        <div className="flex items-center space-x-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbsUp size={8} className="text-white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-[8px]">❤️</span>
            </div>
          </div>
          <span>148</span>
        </div>
        <div className="space-x-2">
          <span>24 comments</span>
          <span>•</span>
          <span>5 reposts</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        <button className="flex items-center justify-center space-x-2 py-3 px-2 hover:bg-gray-100 rounded-md flex-1 text-gray-600 transition-colors">
          <ThumbsUp size={18} />
          <span className="text-sm font-semibold">Like</span>
        </button>
        <button className="flex items-center justify-center space-x-2 py-3 px-2 hover:bg-gray-100 rounded-md flex-1 text-gray-600 transition-colors">
          <MessageSquare size={18} />
          <span className="text-sm font-semibold">Comment</span>
        </button>
        <button className="flex items-center justify-center space-x-2 py-3 px-2 hover:bg-gray-100 rounded-md flex-1 text-gray-600 transition-colors">
          <Repeat size={18} />
          <span className="text-sm font-semibold">Repost</span>
        </button>
        <button className="flex items-center justify-center space-x-2 py-3 px-2 hover:bg-gray-100 rounded-md flex-1 text-gray-600 transition-colors">
          <Send size={18} />
          <span className="text-sm font-semibold">Send</span>
        </button>
      </div>
    </div>
  );
};
