import React from 'react';
import { Terminal, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenDocs: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDocs, activeTab, setActiveTab }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Terminal className="w-4 h-4" />
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap">
          Geo-NER Logistics Normaliser
        </span>
      </div>

      {/* Zone 2: Clean single-line navigation tabs */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('detections')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'detections' ? 'text-cyan-400' : ''
          }`}
        >
          Parsed Detections
        </button>
        <button
          onClick={() => setActiveTab('diff')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'diff' ? 'text-cyan-400' : ''
          }`}
        >
          Security & Spatial Diff
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'json' ? 'text-cyan-400' : ''
          }`}
        >
          Raw JSON Payload
        </button>
        <button
          onClick={onOpenDocs}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-slate-400"
        >
          <BookOpen className="w-3.5 h-3.5" />
          API Schema Docs
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenDocs}
          className="px-3.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded-md hover:bg-cyan-900/40 hover:border-cyan-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Integration Specs</span>
        </button>
      </div>
    </header>
  );
};
