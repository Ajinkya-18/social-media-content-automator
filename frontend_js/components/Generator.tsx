'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, Copy, RefreshCw, Save, Check, Instagram, Linkedin, Youtube, FileText, Hash, Eye, LayoutTemplate, Download, Share, Zap, Crown, Star, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { InstagramPreview } from './previews/InstagramPreview';
import { useAppStore } from '../lib/store';
import GoogleDrivePicker from './GoogleDrivePicker';
import { LinkedInPreview } from './previews/LinkedInPreview';
import { YouTubeCommunityPreview } from './previews/YouTubeCommunityPreview';



async function readStream(
  response: Response, 
  onChunk: (text: string) => void
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}

export default function Generator() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [platform, setPlatform] = useState('instagram');
  const [postType, setPostType] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [plannerItems, setPlannerItems] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveFilename, setSaveFilename] = useState('');
  const [saveDirectory, setSaveDirectory] = useState('content');
  const [showPreview, setShowPreview] = useState(false);
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const { googleDocsEnabled } = useAppStore();
  const { data: session } = useSession();

  const [plan, setPlan] = useState<'free' | 'standard' | 'pro'>('free');

  const getModelName = () => {
    switch (plan) {
      case 'free': return 'Mistral 7B (Open Source)';
      case 'standard': return 'Gemini 1.5 Flash';
      case 'pro': return 'Gemini 1.5 Pro (Reasoning)';
      default: return 'Mistral 7B';
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    setSaveSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/python/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topic, 
          platform: platform, 
          tone: tone,
          plan: plan 
        }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = 'Generation failed';
        
        try {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                errorMessage = data?.detail || errorMessage;
            } else {
                const text = await res.text();
                errorMessage = `Server Error: ${res.status} ${text || res.statusText}`;
            }
        } catch (e) {
            errorMessage = `Server Error: ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           if (data && data.content) {
              setGeneratedContent(data.content);
           }
      } else {
          // Assume stream for non-JSON success responses (text/event-stream)
          await readStream(res, (chunk) => {
            setGeneratedContent((prev) => prev + chunk);
          });
      }
    } catch (err: any) {
      console.error('Generation failed', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHashtags = async () => {
    if (!generatedContent) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: `Generate 10 relevant, high-reach hashtags for this post:\n\n${generatedContent}`, 
          tone, 
          platform 
        }),
      });
      const data = await res.json();
      if (data.content) {
        setGeneratedContent(prev => prev + '\n\n' + data.content);
      }
    } catch (e) {
      console.error('Hashtag gen failed', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchPlannerItems = async () => {
    try {
      const res = await fetch('/api/local/planner');
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlannerItems(data);
          setShowImport(true);
        }
      } else {
        console.warn('Planner API returned non-JSON response');
      }
    } catch (e) {
      console.error('Failed to fetch planner', e);
    }
  };

  const handleImport = (item: any) => {
    setTopic(item.topic + (item.prompt ? `\n\nContext: ${item.prompt}` : ''));
    setPlatform(item.platform);
    setShowImport(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const openSaveOptions = () => {
    setSaveFilename(`${platform}_${topic.slice(0, 20).replace(/\s+/g, '_')}_${Date.now()}.md`);
    setShowSaveOptions(true);
  };

  const handleSave = async () => {
    if (!generatedContent || !saveFilename) return;
    
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/storage/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: saveFilename.endsWith('.md') ? saveFilename : `${saveFilename}.md`, 
          content: generatedContent,
          directory: saveDirectory
        }),
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setShowSaveOptions(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Save failed', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDocs = () => {
    if (!generatedContent) return;
    setIsDrivePickerOpen(true);
  };

  const handleDriveSelect = async (folderId: string, folderName: string) => {
    setIsDrivePickerOpen(false);
    setIsSavingDocs(true);

    try {
      const title = topic.split('\n')[0].slice(0, 50) || 'Untitled Content';
      const token = (session as any)?.accessToken;
      
      const res = await fetch('/api/python/google/upload', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: title,
          content: generatedContent,
          mimeType: 'application/vnd.google-apps.document',
          folderId: folderId
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Saved to Google Docs in "${folderName}"! View at: ${data.url}`); 
      } else {
        const errText = await res.text();
        throw new Error(errText || 'Failed to save to Docs');
      }
    } catch (e: any) {
      console.error('Docs save error', e);
      alert(`Failed to save to Google Docs: ${e.message}`);
    } finally {
      setIsSavingDocs(false);
    }
  };

  const handleExport = async () => {
    if (!generatedContent) return;

    const filename = `${platform}_${topic.slice(0, 20).replace(/\s+/g, '_')}_${Date.now()}.md`;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Markdown File',
            accept: { 'text/markdown': ['.md'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(generatedContent);
        await writable.close();
      } else {
        // Fallback
        const blob = new Blob([generatedContent], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Export failed', err);
      }
    }
  };

  // Preview Component
  const PostPreview = () => {
    switch (platform) {
      case 'instagram': return <InstagramPreview content={generatedContent} />;
      case 'linkedin': return <LinkedInPreview content={generatedContent} />;
      case 'youtube': return <YouTubeCommunityPreview content={generatedContent} />;
      default:
        return (
          <div className="bg-white text-black rounded-xl overflow-hidden shadow-lg max-w-md mx-auto mt-4 font-sans">
             <div className="p-4 text-center text-gray-500">
               Preview not available for this platform.
             </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex flex-col relative p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Content Studio
          </h1>
          <p className="text-gray-400 text-sm">Create optimized content for your social media channels.</p>
        </div>
        <button 
          onClick={fetchPlannerItems}
          className="glass-button px-4 py-2 rounded-lg text-sm text-blue-300 hover:text-white flex items-center space-x-2"
        >
          <FileText size={16} />
          <span>Import from Planner</span>
        </button>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white font-display">Select a Plan</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {plannerItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleImport(item)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-transparent hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{item.topic}</span>
                    <span className="text-xs text-gray-400 capitalize bg-black/30 px-2 py-0.5 rounded-full">{item.platform}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.prompt}</p>
                </div>
              ))}
              {plannerItems.length === 0 && <p className="text-gray-500 text-center py-8">No plans found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Save Options Modal */}
      {showSaveOptions && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white font-display">Save Script</h3>
            
            <div className="space-y-3">
              <label className="text-sm text-gray-400 font-medium">Filename</label>
              <input 
                type="text" 
                value={saveFilename}
                onChange={(e) => setSaveFilename(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-400 font-medium">Directory (relative to project)</label>
              <input 
                type="text" 
                value={saveDirectory}
                onChange={(e) => setSaveDirectory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
                placeholder="content"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setShowSaveOptions(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors font-medium border border-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center border border-transparent"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Plan Selection */}
          <section className="space-y-3">
            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">AI Model & Plan</label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl glass-panel">
              {[
                { id: 'free', label: 'Free', icon: Zap },
                { id: 'standard', label: 'Plus', icon: Star },
                { id: 'pro', label: 'Pro', icon: Crown },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id as any)}
                  className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                    plan === p.id
                      ? 'bg-blue-600/20 text-blue-200 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <p.icon size={18} className={`mb-1.5 ${plan === p.id ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-xs font-medium">{p.label}</span>
                  {plan === p.id && <div className="absolute inset-0 border border-blue-500/30 rounded-lg pointer-events-none" />}
                </button>
              ))}
            </div>
          </section>

          {/* Platform Selection */}
          <section className="space-y-3">
            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">Platform</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'instagram', icon: Instagram, label: 'Instagram' },
                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { id: 'youtube', icon: Youtube, label: 'YouTube' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                    platform === p.id
                      ? 'bg-gradient-to-br from-blue-600/80 to-purple-600/80 border-transparent text-white shadow-lg shadow-blue-900/20 transform scale-105'
                      : 'glass-panel text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <p.icon size={22} className="mb-2" />
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Post Type */}
          <section className="space-y-3">
             <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">Type</label>
             <div className="flex space-x-2">
               {[
                 { id: 'standard', label: 'Standard' },
                 { id: 'thread', label: 'Thread' },
                 { id: 'poll', label: 'Poll' },
               ].map((t) => (
                 <button
                   key={t.id}
                   onClick={() => setPostType(t.id)}
                   className={`flex-1 py-2 text-xs font-medium rounded-full border transition-all ${
                     postType === t.id
                       ? 'bg-white/10 text-white border-white/20 shadow-inner'
                       : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'
                   }`}
                 >
                   {t.label}
                 </button>
               ))}
             </div>
          </section>

          {/* Topic Input */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
               <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">Topic</label>
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                 {getModelName()}
               </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-sm group-hover:bg-blue-500/10 transition-colors" />
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What would you like to create today? E.g., 'The future of AI in marketing...'"
                className="relative w-full h-36 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
              />
            </div>
          </section>

          {/* Tone Selection */}
          <section className="space-y-3">
            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">Tone</label>
            <div className="flex glass-panel p-1 rounded-lg">
              {['Professional', 'Casual', 'Witty'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t.toLowerCase())}
                  className={`flex-1 py-2 text-xs font-medium rounded transition-all ${
                    tone === t.toLowerCase()
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all transform active:scale-95 ${
              isGenerating || !topic
                ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20 border border-transparent'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="animate-spin mr-2" />
                <span className="animate-pulse">Creating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} className="mr-2" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col min-h-[600px] shadow-2xl shadow-black/50">
          {/* Output Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center bg-black/30 rounded-lg p-1">
              <button 
                onClick={() => setShowPreview(false)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  !showPreview 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <FileText size={14} />
                <span>Editor</span>
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  showPreview 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>Preview</span>
              </button>
            </div>

            {generatedContent && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={generateHashtags}
                  disabled={isGenerating}
                  className="glass-button p-2 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                  title="Generate Hashtags"
                >
                  <Hash size={16} />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <button 
                  onClick={handleCopy}
                  className="glass-button p-2 rounded-lg text-gray-400 hover:text-green-400 transition-colors"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button 
                  onClick={handleExport}
                  className="glass-button p-2 rounded-lg text-gray-400 hover:text-indigo-400 transition-colors"
                  title="Export to Disk"
                >
                  <Download size={16} />
                </button>

                {googleDocsEnabled && (
                  <button 
                    onClick={handleSaveToDocs}
                    disabled={isSavingDocs}
                    className="glass-button p-2 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                    title="Save to Google Docs"
                  >
                     {isSavingDocs ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                  </button>
                )}
                
                <button 
                  onClick={openSaveOptions}
                  disabled={isSaving || saveSuccess}
                  className={`ml-2 flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    saveSuccess 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white border border-transparent text-white'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw size={14} className="animate-spin mr-2" />
                  ) : saveSuccess ? (
                    <Check size={14} className="mr-2" />
                  ) : (
                    <Save size={14} className="mr-2" />
                  )}
                  {saveSuccess ? 'Saved' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-black/20 rounded-xl p-1 overflow-hidden relative">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-red-900/10 rounded-xl border border-red-500/20">
                <p className="font-medium">Generation Error</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            ) : generatedContent ? (
              showPreview ? (
                <div className="h-full overflow-y-auto px-2 custom-scrollbar">
                  <PostPreview />
                </div>
              ) : (
                <textarea 
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-200 font-mono text-sm leading-relaxed resize-none p-4 focus:bg-white/5 transition-colors rounded-lg"
                />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                   <Sparkles size={32} className="opacity-40" />
                </div>
                <p className="text-lg font-medium text-gray-500">Ready to create</p>
                <p className="text-sm text-gray-600 max-w-xs text-center mt-2">
                  Select your platform and topic to generate optimized content in seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Drive Picker Modal */}
      <GoogleDrivePicker
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={handleDriveSelect}
        mode="pick-folder"
        title="Select Folder for Script"
      />
    </div>
  );
}
