'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileSpreadsheet, File, X, ChevronRight, Check, ArrowLeft, Loader, Home } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
}

interface GoogleDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fileOrFolderId: string, name: string) => void;
  mode: 'pick-folder' | 'pick-sheet';
  title?: string;
}

export default function GoogleDrivePicker({ isOpen, onClose, onSelect, mode, title }: GoogleDrivePickerProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null means root
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([{ id: null, name: 'My Drive' }]);

  // Create Folder State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (isOpen) {
        if (session?.accessToken) {
             fetchItems(currentFolderId);
        } else {
             setError("Please sign in with Google to access Drive.");
        }
    }
  }, [isOpen, currentFolderId, session]);

  const fetchItems = async (folderId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.accessToken;
      if (!token) return;

      const res = await fetch('/api/python/google/list', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          folderId: folderId, 
          mimeType: mode === 'pick-folder' ? 'folder' : 'sheet' 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.files || []);
      } else {
        if (res.status === 401) {
            setError("Session Expired - Please Re-connect Google Account");
        } else {
            const errText = await res.text();
            setError(`Failed to fetch items: ${errText}`);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Network or API error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return;
      
      try {
          const token = session?.accessToken;
          const res = await fetch('/api/python/google/create-folder', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  name: newFolderName,
                  parentId: currentFolderId 
              })
          });

          if (res.ok) {
              setNewFolderName("");
              setIsCreatingFolder(false);
              fetchItems(currentFolderId); // Refresh list
          } else {
              alert("Failed to create folder");
          }
      } catch (e) {
          console.error(e);
          alert("Error creating folder");
      }
  };

  const handleNavigate = (folderId: string, folderName: string) => {
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(target.id);
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      handleBreadcrumbClick(breadcrumbs.length - 2);
    }
  };

  const handleSelect = (item: DriveFile) => {
    if (mode === 'pick-sheet' && item.mimeType === 'application/vnd.google-apps.spreadsheet') {
       onSelect(item.id, item.name);
       onClose();
       return;
    }
    
    if (item.mimeType === 'application/vnd.google-apps.folder') {
        handleNavigate(item.id, item.name);
    }
  };

  const handleConfirmCurrentFolder = () => {
    if (mode === 'pick-folder') {
        const current = breadcrumbs[breadcrumbs.length - 1];
        onSelect(current.id || 'root', current.name);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#0F0F12]/90 border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-lg font-bold text-white tracking-wide font-display">
              {title || (mode === 'pick-folder' ? 'Select Folder' : 'Select Spreadsheet')}
            </h3>
            <div className="flex items-center space-x-2">
                {mode === 'pick-folder' && !isCreatingFolder && (
                    <button 
                        onClick={() => setIsCreatingFolder(true)}
                        className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                    >
                        + New Folder
                    </button>
                )}
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
            </div>
          </div>

          {/* Create Folder Input */}
          {isCreatingFolder && (
              <div className="p-3 bg-white/5 border-b border-white/10 flex space-x-2">
                  <input 
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder Name"
                    className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={handleCreateFolder} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Create</button>
                  <button onClick={() => setIsCreatingFolder(false)} className="px-3 py-1 bg-transparent text-gray-400 text-sm hover:text-white">Cancel</button>
              </div>
          )}

          {/* Breadcrumbs */}
          <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            {breadcrumbs.length > 1 && (
               <button onClick={handleBack} className="mr-2 text-gray-400 hover:text-white transition-colors">
                 <ArrowLeft size={16} />
               </button>
            )}
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center whitespace-nowrap">
                {i > 0 && <ChevronRight size={14} className="text-gray-600 mx-1" />}
                <button 
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`text-sm font-medium transition-colors ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-gray-400 hover:text-blue-400'}`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2 min-h-[300px] custom-scrollbar">
            {error ? (
                <div className="flex flex-col items-center justify-center h-40 text-red-400 p-4 text-center">
                    <p className="font-medium">Error</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader size={24} className="animate-spin text-blue-500" />
              </div>
            ) : items.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                 <Folder size={32} className="opacity-20 mb-2" />
                 <p className="text-sm">No items found</p>
               </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center p-3 hover:bg-white/5 rounded-xl transition-all group text-left border border-transparent hover:border-white/5"
                  >
                    <div className={`p-2.5 rounded-lg mr-3 transition-colors ${
                      item.mimeType === 'application/vnd.google-apps.folder' 
                        ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' 
                        : 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20'
                    }`}>
                      {item.mimeType === 'application/vnd.google-apps.folder' ? <Folder size={20} /> : <FileSpreadsheet size={20} />}
                    </div>
                    <div className="flex-1 truncate">
                       <p className="text-sm font-medium text-gray-200 group-hover:text-white">{item.name}</p>
                    </div>
                    {item.mimeType === 'application/vnd.google-apps.folder' && (
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
                Cancel
            </button>
            
            {mode === 'pick-folder' && (
                <button
                    onClick={handleConfirmCurrentFolder}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-lg shadow-blue-900/20"
                >
                    <Check size={16} className="mr-2" />
                    Select {breadcrumbs[breadcrumbs.length - 1].name}
                </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
