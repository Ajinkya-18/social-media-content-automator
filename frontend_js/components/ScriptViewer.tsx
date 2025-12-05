import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from './EditorToolbar';

interface ScriptViewerProps {
  onBack?: () => void;
}

export default function ScriptViewer({ onBack }: ScriptViewerProps) {
  const { selectedFile, setCurrentView, fileSource, selectedFileId } = useAppStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

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
      } else if (fileSource === 'google' && selectedFileId) {
        url = `/api/google/docs?fileId=${selectedFileId}`;
      }

      if (url) {
        fetch(url)
          .then(res => res.json())
          .then(data => {
            const newContent = data.content || '';
            setContent(newContent);
            if (editor) {
              editor.commands.setContent(newContent);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
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
                  directory: 'content' // Defaulting to content for now
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
    </div>
  );
}
