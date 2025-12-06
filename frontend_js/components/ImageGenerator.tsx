'use client';

import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Download, RefreshCw, Zap, Crown, Star, Loader, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const [plan, setPlan] = useState<'free' | 'standard' | 'pro'>('free');

  const { googleDriveFolderId } = useAppStore();

  const getModelName = () => {
    switch (plan) {
      case 'free': return 'FLUX.1 Schnell';
      case 'standard': return 'Gemini 1.5 Flash';
      case 'pro': return 'Imagen 3 High-Fidelity';
      default: return 'FLUX.1 Schnell';
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);

    try {
      // 1. Call Python Backend
      const res = await fetch('/api/python/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          aspect_ratio: "1:1", // You can add a dropdown for this later
          plan: plan 
        }),
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Received non-JSON response:", text);
        throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}...`);
      }
      
      if (!res.ok) {
        throw new Error(data.detail || 'Generation failed');
      }
      
      setGeneratedImage(data.url);
      
    } catch (err: any) {
      setError('Failed to generate image' + err.message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      let blob: Blob;

      // Handle Data URI (Base64) directly
      if (generatedImage.startsWith('data:')) {
        const fetchRes = await fetch(generatedImage);
        blob = await fetchRes.blob();
      } 
      // Handle Remote URL via Proxy
      else {
        const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(generatedImage)}`);
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Download failed');
        }
        blob = await response.blob();
      }
      
      if (blob.size === 0) {
        throw new Error('Invalid image data received');
      }

      // Determine extension from content type
      const contentType = blob.type || 'image/png';
      let extension = 'png';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('gif')) extension = 'gif';
      
      const filename = `generated-image-${Date.now()}.${extension}`;

      // Try File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Image File',
              accept: { [contentType]: [`.${extension}`] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('File picker failed', err);
            // Fallback to anchor tag if picker fails
          } else {
            return; // User cancelled
          }
        }
      }

      // Fallback to anchor tag
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Download failed', e);
      setError(`Download failed: ${e.message}`);
    }
  };

  const handleSaveToDrive = async () => {
    if (!generatedImage) return;
    try {
        let finalBase64 = generatedImage;
        const res = await fetch('/api/google/drive/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: finalBase64,
                filename: `gen-${prompt.slice(0, 10).replace(/\s+/g, '-')}-${Date.now()}.png`,
                folderId: googleDriveFolderId
            })
        });

        if (res.ok) {
            const data = await res.json();
            alert(`Image saved to Drive! View at: ${data.link}`);
        } else {
            throw new Error('Upload failed');
        }
    } catch (e) {
        console.error('Drive upload error', e);
        alert('Failed to save to Drive');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Image Studio</h1>
        <p className="text-gray-400">Generate stunning visuals for your content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Plan Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Plan</label>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              {[
                { id: 'free', label: 'Free', icon: Zap },
                { id: 'standard', label: 'Standard', icon: Star },
                { id: 'pro', label: 'Pro', icon: Crown },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id as any)}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                    plan === p.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <p.icon size={16} className="mb-1" />
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Image Description</label>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                Model: {getModelName()}
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
              isGenerating || !prompt
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-900/20'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} className="mr-2" />
                Generate Image
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 flex items-center justify-center min-h-[400px]">
          {generatedImage ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group w-full aspect-square max-w-lg"
            >
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="w-full h-full object-cover rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl space-x-4">
                <button 
                  onClick={handleSaveToDrive}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center hover:scale-105 transition-transform"
                  title="Save to Google Drive"
                >
                  <Cloud size={20} className="mr-2" />
                  Save to Drive
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-6 py-3 bg-white text-black rounded-lg font-bold flex items-center hover:scale-105 transition-transform"
                >
                  <Download size={20} className="mr-2" />
                  Download
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-gray-500">
              {error ? (
                <div className="flex flex-col items-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button 
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Retry Generation
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={32} className="opacity-50" />
                  </div>
                  <p>Enter a prompt to generate an image.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
