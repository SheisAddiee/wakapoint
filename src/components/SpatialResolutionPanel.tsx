import React, { useState } from 'react';
import { ResolvedAddressResult } from '../types/wakapoint';
import { InteractiveMapCard } from './InteractiveMapCard';
import {
  ShieldCheck,
  Cpu,
  Navigation,
  Layers,
  Route,
  FileJson,
  Copy,
  Check,
  CheckCircle2,
  Building,
  MapPin,
  Compass,
  ArrowRight,
  Eye,
  Download
} from 'lucide-react';

interface SpatialResolutionPanelProps {
  result: ResolvedAddressResult;
  isLoading: boolean;
}

export const SpatialResolutionPanel: React.FC<SpatialResolutionPanelProps> = ({
  result,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'entities' | 'routing' | 'json'>('entities');
  const [copiedJson, setCopiedJson] = useState(false);

  const formattedJson = JSON.stringify(result.rawJson, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wakapoint_resolved_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Metric Bar: 3 small metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Parsing Confidence */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Parsing Confidence
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              Grade {result.deliverabilityGrade}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isLoading ? '...' : `${result.confidenceScore}%`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            Bayesian landmark spatial score
          </p>
        </div>

        {/* Metric 2: Extraction Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Extraction Latency
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              V8 Engine
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isLoading ? '...' : `${result.extractionLatencyMs}ms`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            Real-time Geo-NER pipeline
          </p>
        </div>

        {/* Metric 3: Deliverability Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              Deliverability Index
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="truncate">
            <span className="text-sm font-bold text-emerald-400 block truncate" title={result.deliverabilityIndex}>
              {isLoading ? 'Resolving...' : result.deliverabilityIndex}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1 truncate">
            Courier street-level viability
          </p>
        </div>
      </div>

      {/* Tabbed Results Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 transition-all hover:border-slate-700/80">
        {/* Tab Headers */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'entities'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Extracted Entities</span>
            </button>

            <button
              onClick={() => setActiveTab('routing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'routing'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Routing Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Normalized JSON</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Status: 200 OK
          </div>
        </div>

        {/* Tab 1: Extracted Entities (Clean two-column table/grid) */}
        {activeTab === 'entities' && (
          <div className="p-5 space-y-4 animate-in fade-in duration-150">
            {/* Normalized String Banner */}
            <div className="p-3 bg-slate-950/80 border border-emerald-950 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                  Canonical Standardized Address
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed mt-0.5">
                  {result.normalizedAddressString}
                </p>
              </div>
            </div>

            {/* Clean Structured Entity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* State / Region */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  State / Region
                </div>
                <div className="text-slate-100 font-medium text-sm">
                  {result.entities.stateRegion}
                </div>
              </div>

              {/* LGA / District */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  LGA / District
                </div>
                <div className="text-slate-100 font-medium text-sm">
                  {result.entities.lgaDistrict}
                </div>
              </div>

              {/* Primary Landmark */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 md:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  Primary Landmark Anchor
                </div>
                <div className="text-emerald-300 font-semibold text-sm">
                  {result.entities.primaryLandmark}
                </div>
              </div>

              {/* Micro-Directions / Turn Cues */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Micro-Directions / Turn Cues
                </div>
                <div className="space-y-1.5">
                  {result.entities.microDirections.map((dir, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-400 font-mono text-[11px] mt-0.5">•</span>
                      <span className="leading-snug">{dir}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color / Structure Identifiers */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Color / Structure Identifiers
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.entities.colorStructureIdentifiers.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-mono text-[11px]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recipient / Unit Context */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 md:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Recipient / Unit Context
                </div>
                <div className="text-slate-200 font-medium">
                  {result.entities.recipientUnitContext}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Routing Guide (Step-by-step dispatch card for riders) */}
        {activeTab === 'routing' && (
          <div className="p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200">
                Dispatch Rider Turn-by-Turn Instruction Sequence
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Vehicle: Motorbike / Courier
              </span>
            </div>

            <div className="space-y-3">
              {result.routingSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3.5 transition-colors hover:border-slate-700"
                >
                  {/* Step badge */}
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    0{step.stepNumber}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {step.phase}: {step.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {step.distanceEstimate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {step.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Normalized JSON */}
        {activeTab === 'json' && (
          <div className="flex flex-col animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                Standard JSON Payload (OpenAPI & TMS Compliant)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadJson}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Download .json</span>
                </button>
                <button
                  onClick={handleCopyJson}
                  className={`px-3 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    copiedJson
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
                  }`}
                >
                  {copiedJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 max-h-[360px] overflow-x-auto">
              <pre className="font-mono text-xs text-emerald-300/90 leading-relaxed">
                <code>{formattedJson}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map Placeholder Card */}
      <InteractiveMapCard
        coordinates={result.coordinates}
        primaryLandmark={result.entities.primaryLandmark}
      />
    </div>
  );
};
