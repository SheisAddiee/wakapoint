import React from 'react';
import { ParsingResult } from '../types/logistics';
import { ShieldCheck, Cpu, Compass, Navigation } from 'lucide-react';

interface MetricCardsProps {
  result: ParsingResult;
  isAnalyzing: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ result, isAnalyzing }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Card 1: Confidence & Deliverability */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Confidence Score
          </span>
          <span className="text-slate-500 font-mono text-[11px]">ISO 19112</span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {isAnalyzing ? '--.-%' : `${result.confidenceScore}%`}
          </span>
          <span className="text-xs font-semibold text-emerald-400 font-mono">
            Grade {result.deliverabilityGrade}
          </span>
        </div>

        {/* Unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono text-[11px] truncate">
          <span>Uncertainty ±{result.spatialAnchor.uncertaintyRadiusMeters}m</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{result.stats.entityDensity * 100}% Density</span>
        </div>
      </div>

      {/* Card 2: Latency & Complexity */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Pipeline Latency
          </span>
          <span className="text-slate-500 font-mono text-[11px]">V8 Heuristic</span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {isAnalyzing ? '...' : `${result.processingLatencyMs}ms`}
          </span>
          <span className={`text-xs font-semibold font-mono ${
            result.complexityScore === 'EXTREME'
              ? 'text-rose-400'
              : result.complexityScore === 'HIGH'
              ? 'text-amber-400'
              : 'text-indigo-400'
          }`}>
            {result.complexityScore} Complexity
          </span>
        </div>

        {/* Unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono text-[11px] truncate">
          <span>{result.entities.length} Geo-NER Entities</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{result.stats.tokenCount} Raw Tokens</span>
        </div>
      </div>

      {/* Card 3: Primary Classification */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Primary Classification
          </span>
          <span className="text-slate-500 font-mono text-[11px]">Topology Type</span>
        </div>

        <div className="mb-2">
          <span className="text-sm font-semibold tracking-tight text-white block truncate" title={result.primaryClassification}>
            {isAnalyzing ? 'Analyzing topology...' : result.primaryClassification}
          </span>
        </div>

        {/* Unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono text-[11px] truncate">
          <Navigation className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{result.spatialAnchor.landmarkType.replace('_', ' ')}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{result.spatialAnchor.offsetMeters}m displacement</span>
        </div>
      </div>
    </div>
  );
};
