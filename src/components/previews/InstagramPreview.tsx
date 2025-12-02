import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface InstagramPreviewProps {
  content: string;
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({ content }) => {
  return (
    <div className="bg-white text-black rounded-xl overflow-hidden shadow-lg max-w-[375px] mx-auto font-sans border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <div className="w-full h-full rounded-full bg-gray-200" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">nocturnal_user</p>
            <p className="text-xs text-gray-500">Original Audio</p>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-gray-600" />
      </div>

      {/* Image Placeholder */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
        <span className="text-sm">Image Placeholder</span>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart size={24} className="text-black hover:text-gray-600 cursor-pointer" />
            <MessageCircle size={24} className="text-black hover:text-gray-600 cursor-pointer -rotate-90" />
            <Send size={24} className="text-black hover:text-gray-600 cursor-pointer" />
          </div>
          <Bookmark size={24} className="text-black hover:text-gray-600 cursor-pointer" />
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold mb-2">1,234 likes</p>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">nocturnal_user</span>
          <span className="line-clamp-2">
            {content || "Your generated caption will appear here..."}
          </span>
          {content && content.length > 100 && (
            <span className="text-gray-500 text-xs cursor-pointer"> more</span>
          )}
        </div>

        {/* Comments */}
        <p className="text-gray-500 text-sm mt-2 cursor-pointer">View all 12 comments</p>
        <p className="text-gray-400 text-[10px] uppercase mt-1">2 hours ago</p>
      </div>
    </div>
  );
};
