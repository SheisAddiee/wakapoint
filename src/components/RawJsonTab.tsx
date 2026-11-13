import React, { useState } from 'react';
import { ParsingResult } from '../types/logistics';
import { Copy, Check, Download, FileJson, Minimize2, Maximize2 } from 'lucide-react';

interface RawJsonTabProps {
  result: ParsingResult;
}

export const RawJsonTab: React.FC<RawJsonTabProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [minified, setMinified] = useState(false);

  const jsonString = minified
    ? JSON.stringify(result)
    : JSON.stringify(result, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo_ner_analysis_${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* JSON Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <FileJson className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">TMS/WMS Ingestion Payload (JSON)</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {(new Blob([jsonString]).size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Minify / Expand Toggle */}
          <button
            onClick={() => setMinified(!minified)}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            title={minified ? 'Expand JSON' : 'Minify JSON'}
          >
            {minified ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span>{minified ? 'Pretty Format' : 'Minified'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export .json</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`px-3 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="p-4 bg-slate-950 overflow-x-auto max-h-[560px]">
        <pre className="font-mono text-xs text-cyan-300/90 leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
