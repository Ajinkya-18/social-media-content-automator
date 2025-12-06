'use client';

import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, Check, X, Loader, ArrowLeft, Home } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface DrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
  title?: string;
}

export default function DrivePicker({ isOpen, onClose, onSelect, title = 'Select Destination Folder' }: DrivePickerProps) {
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('Root');
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset to root when opening
      setCurrentFolderId(null);
      setCurrentFolderName('Root');
      setFolderHistory([]);
      fetchFolders(null);
    }
  }, [isOpen]);

  const fetchFolders = async (parentId: string | null) => {
    setLoading(true);
    try {
      const url = parentId 
        ? `/api/google/drive/folders?parentId=${parentId}`
        : '/api/google/drive/folders';
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load folders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    // Push current to history before moving
    setFolderHistory(prev => [...prev, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
    fetchFolders(folderId);
  };

  const handleBack = () => {
    if (folderHistory.length === 0) return;
    
    const newHistory = [...folderHistory];
    const previous = newHistory.pop();
    
    if (previous) {
        setFolderHistory(newHistory);
        setCurrentFolderId(previous.id);
        setCurrentFolderName(previous.name);
        fetchFolders(previous.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden max-h-[80vh]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-lg font-bold text-white max-w-[80%] truncate">
                {title}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>
        
        <div className="p-2 border-b border-white/5 bg-black/20 flex items-center text-sm text-gray-400 space-x-2">
            {currentFolderId && (
                <button onClick={handleBack} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white">
                    <ArrowLeft size={16} />
                </button>
            )}
            <div className="flex items-center text-gray-400">
                <Home size={14} className="mr-1" />
                <span className="mx-1">/</span>
                <span className="text-white font-medium truncate max-w-[200px]">{currentFolderName}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[300px]">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader size={24} className="animate-spin text-blue-500" />
                </div>
            ) : folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                    <Folder size={32} className="opacity-20" />
                    <p>No folders found</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {/* Root Option */}
                    {/* Current Selection Option */}
                    <button
                        onClick={() => onSelect(currentFolderId || '', currentFolderName)}
                        className="w-full flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors group text-left border border-blue-500/30 bg-blue-500/5 mb-2"
                    >
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mr-3">
                            <Check size={20} />
                        </div>
                        <div className="flex-1 truncate">
                            <p className="text-sm font-medium text-blue-200">Select Current Folder</p>
                            <p className="text-xs text-blue-400/60">Upload to "{currentFolderName}"</p>
                        </div>
                    </button>

                    {folders.map((folder) => (
                        <button
                            key={folder.id}
                            key={folder.id}
                            onClick={() => handleFolderClick(folder.id, folder.name)}
                            className="w-full flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors group text-left"
                        >
                            <div className="p-2 bg-gray-800 text-gray-400 rounded-lg mr-3 group-hover:bg-gray-700 group-hover:text-gray-200">
                                <Folder size={20} />
                            </div>
                            <div className="flex-1 truncate">
                                <p className="text-sm font-medium text-gray-300 group-hover:text-white">{folder.name}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFolderClick(folder.id, folder.name);
                                }}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer with note */}
        <div className="p-4 border-t border-white/10 bg-white/5 text-xs text-center text-gray-500">
            Select a folder to save your file
        </div>
      </div>
    </div>
  );
}
