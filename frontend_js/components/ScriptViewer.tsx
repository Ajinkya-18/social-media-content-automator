import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { ArrowLeft, Save, Loader, Cloud } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import GoogleDrivePicker from './GoogleDrivePicker';
import { useSession } from 'next-auth/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from './EditorToolbar';

interface ScriptViewerProps {
  onBack?: () => void;
}

export default function ScriptViewer({ onBack }: ScriptViewerProps) {
  const { selectedFile, setCurrentView, fileSource, selectedFileId } = useAppStore();
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-[65ch] mx-auto focus:outline-none min-h-[500px] py-8 text-lg leading-relaxed font-serif',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      
      let url = '';
      if (fileSource === 'local') {
        url = `/api/local/read?filename=${encodeURIComponent(selectedFile)}`;
        fetch(url)
          .then(res => res.json())
          .then(data => {
            const newContent = data.content || '';
            setContent(newContent);
            if (editor) editor.commands.setContent(newContent);
            setLoading(false);
          })
          .catch(err => { console.error(err); setLoading(false); });
      } else if (fileSource === 'google' && selectedFileId) {
        const token = (session as any)?.accessToken;
        if (token) {
            // Using the GET endpoint we created
            fetch(`/api/python/google/read?fileId=${selectedFileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                const newContent = data.content || '';
                setContent(newContent);
                if (editor) editor.commands.setContent(newContent);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
        } else {
             setLoading(false);
        }
      }
    }
  }, [selectedFile, fileSource, selectedFileId, editor]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentView('planner');
    }
  };

  const handleSaveToDrive = () => {
    setIsDrivePickerOpen(true);
  };

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ...

  const handleDriveSelect = async (folderId: string, folderName: string) => {
    setIsDrivePickerOpen(false);
    setSaving(true);
    setSaveMessage("Saving to Drive...");
    
    try {
      const token = session?.accessToken;
      if (!token) {
          alert("No access token found. Please sign in again.");
          setSaving(false);
          setSaveMessage(null);
          return;
      }

      const res = await fetch('/api/python/google/upload', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            fileName: `Script - ${selectedFile || new Date().toISOString().split('T')[0]}.md`, 
            content: editor?.getText() || content, 
            mimeType: "text/markdown",
            folderId: folderId
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMessage(`Saved to folder "${folderName}"!`);
        setTimeout(() => setSaveMessage(null), 3000); // Clear after 3s
      } else {
        throw new Error('Failed to save to Drive');
      }
    } catch (e) {
      console.error('Drive save error', e);
      setSaveMessage("Failed to save.");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
        setSaving(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>No file selected.</p>
        <button 
          onClick={handleBack}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className="mr-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">{selectedFile}</h1>
        </div>
        <div className="flex space-x-2">
            <button
                onClick={handleSaveToDrive}
                disabled={saving}
                className={`flex items-center px-4 py-2 ${saving ? 'bg-green-600/50' : 'bg-green-600 hover:bg-green-500'} text-white rounded-lg transition-colors`}
                title="Save to Google Drive"
            >
                {saving ? (
                    <Loader size={18} className="mr-2 animate-spin" />
                ) : (
                    <Cloud size={18} className="mr-2" />
                )}
                {saveMessage || "Save to Drive"}
            </button>
            <button 
            onClick={async () => {
                if (!selectedFile) return;
                try {
                const res = await fetch('/api/storage/write', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    filename: selectedFile,
                    content: content,
                    directory: 'content'
                    }),
                });
                if (res.ok) {
                    alert('Saved successfully!');
                } else {
                    throw new Error('Save failed');
                }
                } catch (e) {
                console.error(e);
                alert('Failed to save.');
                }
            }}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
            <Save size={18} className="mr-2" />
            Save Changes
            </button>
        </div>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm relative flex flex-col">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <EditorContent editor={editor} />
            </div>
          </>
        )}
      </div>

      <GoogleDrivePicker
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={handleDriveSelect}
        mode="pick-folder"
        title="Select Folder to Save Script"
      />
    </div>
  );
}
