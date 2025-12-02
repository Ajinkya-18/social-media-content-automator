'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Save, Check, Instagram, Linkedin, Youtube, FileText, Hash, Eye, LayoutTemplate, Download, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { InstagramPreview } from './previews/InstagramPreview';
import { LinkedInPreview } from './previews/LinkedInPreview';
import { YouTubeCommunityPreview } from './previews/YouTubeCommunityPreview';

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

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    setSaveSuccess(false);
    setError('');

    // Enhance prompt based on post type
    let enhancedTopic = topic;
    if (postType === 'thread') enhancedTopic += ' (Format as a Twitter/LinkedIn thread)';
    if (postType === 'poll') enhancedTopic += ' (Include a poll question and options)';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: enhancedTopic, tone, platform }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setGeneratedContent(data.content);
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
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlannerItems(data);
        setShowImport(true);
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



// ... (inside Generator component)

  // Preview Component
  const PostPreview = () => {
    switch (platform) {
      case 'instagram':
        return <InstagramPreview content={generatedContent} />;
      case 'linkedin':
        return <LinkedInPreview content={generatedContent} />;
      case 'youtube':
        return <YouTubeCommunityPreview content={generatedContent} />;
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
    <div className="max-w-6xl mx-auto h-full flex flex-col relative">
      {/* ... Header ... */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Content Generator</h1>
          <p className="text-gray-400">Create optimized content for your social media channels.</p>
        </div>
        <button 
          onClick={fetchPlannerItems}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
        >
          <FileText size={16} className="mr-1" />
          Import from Planner
        </button>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Select a Plan</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {plannerItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleImport(item)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-transparent hover:border-blue-500/50 transition-all"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-white">{item.topic}</span>
                    <span className="text-xs text-gray-400 capitalize">{item.platform}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.prompt}</p>
                </div>
              ))}
              {plannerItems.length === 0 && <p className="text-gray-500 text-center">No plans found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Save Options Modal */}
      {showSaveOptions && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Save Script</h3>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Filename</label>
              <input 
                type="text" 
                value={saveFilename}
                onChange={(e) => setSaveFilename(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Directory (relative to project)</label>
              <input 
                type="text" 
                value={saveDirectory}
                onChange={(e) => setSaveDirectory(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="content"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setShowSaveOptions(false)}
                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'instagram', icon: Instagram, label: 'Insta' },
                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { id: 'youtube', icon: Youtube, label: 'YouTube' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    platform === p.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <p.icon size={20} className="mb-1" />
                  <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Post Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'thread', label: 'Thread' },
                { id: 'poll', label: 'Poll' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPostType(t.id)}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    postType === t.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Topic / Context</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., The future of AI in marketing..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Tone</label>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['Professional', 'Casual', 'Witty'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t.toLowerCase())}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tone === t.toLowerCase()
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
              isGenerating || !topic
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-900/20'
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
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowPreview(false)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${!showPreview ? 'text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <FileText size={18} />
                <span>Editor</span>
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${showPreview ? 'text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <Eye size={18} />
                <span>Preview</span>
              </button>
            </div>

            {generatedContent && (
              <div className="flex space-x-2">
                <button 
                  onClick={generateHashtags}
                  disabled={isGenerating}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Generate Hashtags"
                >
                  <Hash size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleExport}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center"
                  title="Export to Disk"
                >
                  <Download size={18} />
                </button>
                <button 
                  disabled
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center opacity-50 cursor-not-allowed"
                  title={`Upload to ${platform} (Configure in Settings)`}
                >
                  <Share size={18} />
                </button>
                <button 
                  onClick={openSaveOptions}
                  disabled={isSaving || saveSuccess}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    saveSuccess 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : saveSuccess ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {saveSuccess ? 'Saved!' : 'Save Script'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white/5 rounded-xl p-4 overflow-y-auto">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-400">
                <p>Error: {error}</p>
              </div>
            ) : generatedContent ? (
              showPreview ? (
                <PostPreview />
              ) : (
                <textarea 
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-300 font-mono text-sm resize-none"
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Sparkles size={48} className="mb-4 opacity-20" />
                <p>Enter a topic and select a platform to start generating.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
