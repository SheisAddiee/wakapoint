import React, { useRef } from 'react';
import { WakaPointTestCase, CaseKey } from '../types/wakapoint';
import { WAKAPOINT_PRESET_CASES } from '../data/wakaPointCases';
import { Cpu, Terminal, Play, RotateCcw, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddressIngestionConsoleProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedCaseKey: CaseKey | null;
  onSelectCase: (testCase: WakaPointTestCase) => void;
  onResolve: () => void;
  isLoading: boolean;
}

export const AddressIngestionConsole: React.FC<AddressIngestionConsoleProps> = ({
  inputText,
  setInputText,
  selectedCaseKey,
  onSelectCase,
  onResolve,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 transition-all hover:border-slate-700/80 shadow-xl shadow-black/20">
      {/* Console Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Address Ingestion Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Raw informal transit strings, colloquial routing cues & rider dispatches
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-mono text-emerald-300 font-semibold self-start sm:self-auto">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Model: Geo-NER Llama-3 / Gemini Structured Output</span>
        </div>
      </div>

      {/* Preset Test Case Chips: Clickable pill buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Preset Test Case Chips
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click to auto-populate & resolve
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {WAKAPOINT_PRESET_CASES.map((tc) => {
            const isSelected = selectedCaseKey === tc.caseKey;
            return (
              <button
                key={tc.id}
                onClick={() => onSelectCase(tc)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-950/40 font-semibold'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="font-mono font-bold text-emerald-400">{tc.caseKey}:</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{tc.location}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea Input Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label htmlFor="address-input" className="font-semibold text-slate-300">
            Informal Address Payload
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInputText('');
                textareaRef.current?.focus();
              }}
              className="text-slate-500 hover:text-slate-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Clear input"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          <textarea
            id="address-input"
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter messy Nigerian address or paste rider dispatch notes..."
            rows={5}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans text-sm leading-relaxed"
          />

          {/* Character and Word Counter Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">{charCount}</span> characters
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-slate-400 font-semibold">{wordCount}</span> tokens
            </div>
            <span className="text-slate-500">Language: en-NG / Pidgin Colloquial</span>
          </div>
        </div>
      </div>

      {/* Action Area: Resolve & Extract Entities */}
      <div>
        <button
          onClick={onResolve}
          disabled={isLoading || !inputText.trim()}
          className={`w-full py-3 px-5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            isLoading || !inputText.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
              <span>Resolving Geo-NER Entities...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resolve & Extract Entities</span>
            </>
          )}
        </button>
      </div>

      {/* Helper Quick Guidance */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-1">
        <span className="font-semibold text-slate-300 block font-mono">Supported Informal Signals:</span>
        <p className="text-slate-400 leading-normal">
          Water tanks, filling stations, bridges, kiosks, gate color cues ("green gate", "black gate"), junction counts, and multi-tier market stalls.
        </p>
      </div>
    </div>
  );
};
