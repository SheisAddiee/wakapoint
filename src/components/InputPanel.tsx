import React, { useEffect, useRef } from 'react';
import { TestCase } from '../types/logistics';
import { PRODUCTION_TEST_CASES } from '../data/testCases';
import { Play, RotateCcw, Sparkles, MapPin, Truck, ChevronRight, FileCode2, Copy } from 'lucide-react';

interface InputPanelProps {
  input: string;
  setInput: (value: string) => void;
  selectedCaseId: string;
  onSelectTestCase: (testCase: TestCase) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  regionHint: string;
  setRegionHint: (r: string) => void;
  deliveryMode: string;
  setDeliveryMode: (m: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  input,
  setInput,
  selectedCaseId,
  onSelectTestCase,
  onRunAnalysis,
  isAnalyzing,
  regionHint,
  setRegionHint,
  deliveryMode,
  setDeliveryMode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Line counter calculation
  const lineCount = input.split('\n').length;
  const charCount = input.length;
  const tokenEstimate = input.trim() ? input.trim().split(/\s+/).length : 0;

  // Handle Cmd+Enter / Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRunAnalysis();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRunAnalysis]);

  return (
    <div className="space-y-4">
      {/* Quick Test Cases Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick Production Test Scenarios
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Instant client evaluation
          </span>
        </div>

        <div className="space-y-2">
          {PRODUCTION_TEST_CASES.map((tc) => {
            const isSelected = selectedCaseId === tc.id;
            return (
              <button
                key={tc.id}
                onClick={() => onSelectTestCase(tc)}
                className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-700/80 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {tc.title}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <span>{tc.country}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </div>
                </div>

                {/* Quiet unboxed metadata */}
                <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                  {tc.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Parameter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Raw Informal Dispatch Address Input</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInput('');
                textareaRef.current?.focus();
              }}
              className="text-slate-500 hover:text-slate-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              title="Clear input"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        {/* Textarea with Line Counter */}
        <div className="relative flex rounded border border-slate-800 bg-slate-950 font-mono text-xs focus-within:border-cyan-600 transition-colors">
          {/* Gutter / Line numbers */}
          <div className="py-3 px-2 bg-slate-950/80 border-r border-slate-800/80 text-slate-600 select-none text-right font-mono text-[11px] min-w-[32px]">
            {Array.from({ length: Math.max(4, lineCount) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste messy address text (e.g., 'Opposite Total Filling Station, 3rd yellow gate after the bridge...')"
            rows={5}
            className="w-full p-3 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Token and Character Stats (Unboxed Metadata) */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <div className="flex items-center gap-2">
            <span>{charCount} chars</span>
            <span aria-hidden="true">·</span>
            <span>{tokenEstimate} tokens</span>
            <span aria-hidden="true">·</span>
            <span>UTF-8</span>
          </div>
          <span className="text-slate-600">Press ⌘+Enter to analyze</span>
        </div>

        {/* Dispatch Parameters: Region & Vehicle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Regional Geo-Gazetteer Hint
            </label>
            <select
              value={regionHint}
              onChange={(e) => setRegionHint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
            >
              <option value="Auto-detect">Auto-detect from Lexicon</option>
              <option value="Sub-Saharan Africa">Sub-Saharan Africa (NG/KE/GH)</option>
              <option value="South America">Latin America (CO/PE/BR)</option>
              <option value="North America">Rural North America (US/CA)</option>
              <option value="Southeast Asia">Southeast Asia (ID/PH/VN)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Truck className="w-3 h-3 text-indigo-400" />
              Delivery Vehicle Fleet Profile
            </label>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
            >
              <option value="TWO_WHEELER">Two-Wheeler (Motorbike/Boda)</option>
              <option value="LIGHT_VAN">Light Delivery Van (&lt;3.5t)</option>
              <option value="FOUR_WHEEL_DRIVE">4WD Utility Vehicle</option>
            </select>
          </div>
        </div>

        {/* Primary Action Button: Run Technical Analysis */}
        <div className="pt-2">
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing || !input.trim()}
            className={`w-full py-2.5 px-4 rounded-md font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isAnalyzing || !input.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/50 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Running Geo-NER Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Technical Analysis</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono text-cyan-100">
                  ⌘↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
