import React from 'react';
import { Navigation, ShieldCheck, Terminal, Cpu, Sparkles } from 'lucide-react';

interface WakaPointHeaderProps {
  onOpenSpecs?: () => void;
}

export const WakaPointHeader: React.FC<WakaPointHeaderProps> = ({ onOpenSpecs }) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950">
          <Navigation className="w-5 h-5 fill-emerald-400/20" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              WakaPoint Logistics
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
              v2.6 Nigeria
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
            Informal Address Parser & Geo-NER Engine
          </p>
        </div>
      </div>

      {/* Zone 2: Navigation & Status indicator */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-medium">Model: Geo-NER Llama-3 / Gemini Structured Output</span>
        </div>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-300">Engine Online</span>
        </div>
      </div>
    </header>
  );
};
