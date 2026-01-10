'use client';

import { useGoogleDrive } from '../hooks/useGoogleDrive';

interface GoogleDriveButtonProps {
  content: string;
}

export default function GoogleDriveButton({ content }: GoogleDriveButtonProps) {
  const { saveScriptToDrive, isSaving } = useGoogleDrive();

  return (
    <button
      onClick={() => saveScriptToDrive(content, 'Generated Content')}
      disabled={isSaving}
      className={`
        relative group flex items-center gap-3 px-5 py-2.5 rounded-lg border transition-all duration-300 overflow-hidden
        ${isSaving 
          ? 'bg-cyan-900/20 border-cyan-500/30 cursor-wait' 
          : 'bg-slate-800/40 border-white/10 hover:bg-slate-800/60 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'
        }
      `}
    >
      {/* Holographic Scanline Effect (Optional subtle animation overlay) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

      {isSaving ? (
        <>
          {/* Tech Loader */}
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
          <span className="font-mono text-xs text-cyan-300 tracking-widest animate-pulse">
            UPLOADING...
          </span>
        </>
      ) : (
        <>
          {/* Drive Icon (Floating inside the glass) */}
          <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l-13.65-23.65c-.5-1-.8-2.1-.9-3.3 0-2.3 1.1-4.2 2.8-5.5l4.7 22.5" fill="#0066da"/>
              <path d="m43.65 25-13.65-23.65c-1.3.8-2.4 1.9-3.2 3.3l-9.5 16.5c-.8 1.4-1.2 3-1.2 4.65h27.55z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l9.5-16.5c.8-1.4 1.2-3 1.2-4.65h-27.55l13.65 24.45" fill="#ea4335"/>
              <path d="m43.65 25 13.65 23.65c1.3-.8 2.4-1.9 3.2-3.3l9.5-16.5c.8-1.4 1.2-3 1.2-4.65h-27.55z" fill="#ffba00"/>
            </svg>
          </div>
          
          <span className="font-sans text-sm font-medium text-slate-300 group-hover:text-cyan-100 transition-colors">
            Save to Drive
          </span>
        </>
      )}
    </button>
  );
}