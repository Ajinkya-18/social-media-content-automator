import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-white/5 border-b border-white/10 rounded-t-xl backdrop-blur-sm">
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleBold().run()}
        // @ts-ignore
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleItalic().run()}
        // @ts-ignore
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 1 }) ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 2 }) ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('bulletList') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        // @ts-ignore
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('orderedList') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  );
};
