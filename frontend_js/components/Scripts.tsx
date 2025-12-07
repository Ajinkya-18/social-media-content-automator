'use client';

import React, { useState, useEffect } from 'react';
import { Folder, FileText, HardDrive, Cloud, Trash2, Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '../lib/store';
import ScriptViewer from './ScriptViewer';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
}

export default function Scripts() {
  const { 
    selectedFile, 
    setSelectedFile, 
    fileSource, 
    setFileSource, 
    setSelectedFileId,
    googleDriveEnabled
  } = useAppStore();
  
  const { data: session } = useSession();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

  useEffect(() => {
    if (viewMode === 'list') {
      fetchFiles();
    }
  }, [fileSource, viewMode, session]);

  // If a file is already selected when mounting, show edit mode
  useEffect(() => {
    if (selectedFile && viewMode === 'list') {
      setViewMode('edit');
    }
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setFiles([]); // Clear previous
    try {
      if (fileSource === 'local') {
          const res = await fetch('/api/local/files');
          const data = await res.json();
          if (data.files) setFiles(data.files);
      } else {
           // Google Drive Fetch
           const token = (session as any)?.accessToken;
           if (!token) {
             console.warn("No token available for drive fetch");
             setLoading(false);
             return;
           }
           
           try {
             // Fetch all files (mimeType: null)
             const res = await fetch('/api/python/google/list', {
                 method: 'POST',
                 headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({ mimeType: null }) 
             });
             
             if (res.ok) {
                 const data = await res.json();
                 if (data.files) {
                     setFiles(data.files.map((f: any) => ({
                         id: f.id,
                         name: f.name,
                         type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
                         mimeType: f.mimeType
                     })));
                 }
             } else {
                 console.error("Drive API returned error", await res.text());
             }
           } catch (e) {
             console.error("Drive fetch failed", e);
           }
      }
    } catch (error) {
      console.error('Failed to fetch files', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Sheets are handled separately, maybe redirect to Sheet view?
      // For now, let's just ignore or handle if we want to support sheets in Scripts tab (unlikely)
      return;
    }

    if (fileSource === 'google') {
      setSelectedFileId(file.id);
      setSelectedFile(file.name);
    } else {
      setSelectedFile(file.name);
    }
    setViewMode('edit');
  };

  const handleBack = () => {
    setSelectedFile(null);
    setViewMode('list');
  };

  if (viewMode === 'edit') {
    return <ScriptViewer onBack={handleBack} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Scripts Library</h1>
        
        <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setFileSource('local')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center ${
              fileSource === 'local' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive size={14} className="mr-1.5" />
            Local
          </button>
          {googleDriveEnabled && (
            <button
              onClick={() => setFileSource('google')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center ${
                fileSource === 'google' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cloud size={14} className="mr-1.5" />
              Drive
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : (
            files.map((file, index) => (
              <div
                key={file.id || index}
                onClick={() => handleFileClick(file)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer group relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    file.mimeType === 'application/vnd.google-apps.document' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    <FileText size={20} />
                  </div>
                </div>
                <h3 className="font-medium text-gray-200 truncate pr-8">{file.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {fileSource === 'local' ? 'Local File' : 'Google Drive'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
