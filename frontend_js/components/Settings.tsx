'use client';

import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Check, AlertCircle, Loader } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { useAppStore } from '../lib/store';

export default function Settings() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  const { 
    googleDriveEnabled, googleSheetsEnabled, googleDocsEnabled, toggleGoogleService, setGoogleService,
    socialProfiles, setSocialProfile,
  } = useAppStore();

  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (isAuthenticated && googleDriveEnabled) {
      fetchFolders();
    }
  }, [isAuthenticated, googleDriveEnabled]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch('/api/google/drive/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to fetch folders', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setGoogleService('drive', true);
      setGoogleService('sheets', true);
      setGoogleService('docs', true);
    }
  }, [isAuthenticated, setGoogleService]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your integrations and preferences.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <SettingsIcon size={24} className="mr-3 text-blue-400" />
          Integrations
        </h2>

        <div className="space-y-4">
          {/* Main Google Workspace Connection */}
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-white font-medium">Google Workspace</h3>
                <p className="text-sm text-gray-400">Connect your account</p>
              </div>
            </div>

            {loading ? (
              <Loader size={20} className="animate-spin text-gray-400" />
            ) : isAuthenticated ? (
              <div className="flex items-center text-green-400 px-3 py-1 bg-green-500/10 rounded-full text-sm font-medium">
                <Check size={16} className="mr-1" />
                Connected
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Connect Account
              </button>
            )}
          </div>

          {/* Granular Service Toggles */}
          {isAuthenticated && (
            <div className="pl-4 border-l-2 border-white/10 space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-gray-300">Google Drive</span>
                <input 
                  type="checkbox" 
                  checked={googleDriveEnabled} 
                  onChange={() => toggleGoogleService('drive')}
                  className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-gray-300">Google Sheets</span>
                <input 
                  type="checkbox" 
                  checked={googleSheetsEnabled} 
                  onChange={() => toggleGoogleService('sheets')}
                  className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-gray-300">Google Docs</span>
                <input 
                  type="checkbox" 
                  checked={googleDocsEnabled} 
                  onChange={() => toggleGoogleService('docs')}
                  className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
              </div>
            </div>
          )}
            {isAuthenticated && googleDriveEnabled && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-6">
                  <p className="text-sm text-gray-400">
                    You will be prompted to select a destination folder each time you save content to Google Drive.
                  </p>
                </div>
              )}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <SettingsIcon size={24} className="mr-3 text-purple-400" />
          Social Profiles
        </h2>
        <div className="space-y-4">
           {['twitter', 'linkedin', 'instagram', 'youtube'].map((platform) => (
             <div key={platform} className="space-y-1">
               <label className="text-sm text-gray-400 capitalize">{platform} URL</label>
               <input 
                  type="text" 
                  // @ts-ignore
                  value={socialProfiles[platform]}
                  // @ts-ignore
                  onChange={(e) => setSocialProfile(platform, e.target.value)}
                  placeholder={`https://${platform}.com/username`}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
               />
             </div>
           ))}
        </div>
      </div>
      
      {!isAuthenticated && !loading && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start text-yellow-200 text-sm">
          <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
          <p>
            To use the Google integration, you need to connect your account. 
            This will allow us to save your content plans to Sheets and Drive.
          </p>
        </div>
      )}
    </div>
  );
}
