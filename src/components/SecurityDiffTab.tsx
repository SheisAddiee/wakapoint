import React, { useState } from 'react';
import { ParsingResult } from '../types/logistics';
import { ShieldCheck, ShieldAlert, Lock, Unlock, AlertTriangle, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';

interface SecurityDiffTabProps {
  result: ParsingResult;
}

export const SecurityDiffTab: React.FC<SecurityDiffTabProps> = ({ result }) => {
  const [maskPii, setMaskPii] = useState(true);

  // Compute text with PII masked or revealed
  const getDisplayInput = () => {
    if (!maskPii || !result.guardrails.piiDetected.length) {
      return result.rawInput;
    }
    let masked = result.rawInput;
    result.guardrails.piiDetected.forEach((pii) => {
      masked = masked.replace(pii.originalText, `[REDACTED: ${pii.category}]`);
    });
    return masked;
  };

  return (
    <div className="space-y-4">
      {/* Diff Comparison Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Address Normalization & Structural Diff
          </span>

          {/* PII Masking Toggle */}
          <button
            onClick={() => setMaskPii(!maskPii)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              maskPii
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/50'
            }`}
          >
            {maskPii ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
            <span>{maskPii ? 'PII Privacy Masking: ACTIVE' : 'PII Privacy Masking: UNMASKED'}</span>
          </button>
        </div>

        {/* Side-by-Side or Stacked Diff */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs font-mono">
          {/* Raw Messy Input */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded">
            <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-medium text-[11px]">
              <span className="text-rose-400 flex items-center gap-1">
                <span>[INPUT]</span> Raw Messy String
              </span>
              <span className="text-slate-500">{result.stats.tokenCount} tokens</span>
            </div>
            <p className="text-slate-300 leading-relaxed break-words">
              {getDisplayInput()}
            </p>
          </div>

          {/* Canonical Standardized Output */}
          <div className="p-3.5 bg-slate-950 border border-emerald-900/50 rounded">
            <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-medium text-[11px]">
              <span className="text-emerald-400 flex items-center gap-1">
                <span>[RESOLVED]</span> Canonical Logistics Dispatch
              </span>
              <span className="text-emerald-500 font-mono">ISO 19112 Geocodable</span>
            </div>
            <p className="text-emerald-200 font-sans font-medium leading-relaxed break-words">
              {result.canonicalStandardizedAddress}
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-slate-500">Routing Format:</span>
              <span className="text-cyan-300 font-semibold">{result.isoLogisticsFormat}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Access Barriers & Safety Guardrails */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Delivery Guardrails & Physical Barrier Risk Analysis
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {result.guardrails.accessBarriers.length} operational constraints detected
          </span>
        </div>

        {result.guardrails.accessBarriers.length === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded text-center text-xs text-slate-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            No critical physical barriers or infrastructure hazards detected on route.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {result.guardrails.accessBarriers.map((barrier, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800 rounded flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${barrier.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                      {barrier.label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      barrier.severity === 'HIGH'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}>
                      {barrier.severity} RISK
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <strong className="text-slate-300">Operational Mitigation: </strong>
                    {barrier.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Recommendation & PII Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Vehicle Dispatch Advice */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-200">
            <Truck className="w-4 h-4 text-cyan-400" />
            Vehicle Fleet Routing Advisory
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded mb-2 font-mono">
            <div className="text-cyan-300 font-bold mb-1">
              RECOMMENDED: {result.guardrails.vehicleRecommendation.recommended.replace('_', ' ')}
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              {result.guardrails.vehicleRecommendation.reason}
            </p>
            {result.guardrails.vehicleRecommendation.axleWeightLimitKg && (
              <div className="mt-2 text-rose-400 text-[11px] font-mono">
                Axle weight limit: {result.guardrails.vehicleRecommendation.axleWeightLimitKg} kg maximum
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {result.guardrails.timeSensitivity.notes}
          </p>
        </div>

        {/* PII & Data Privacy Quarantine */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-200">
            <Lock className="w-4 h-4 text-purple-400" />
            PII Redaction & Privacy Quarantine
          </div>
          <div className="space-y-2">
            {result.guardrails.piiDetected.length === 0 ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-400 text-[11px]">
                No sensitive contact identifiers or telephone tokens detected.
              </div>
            ) : (
              result.guardrails.piiDetected.map((pii, i) => (
                <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">{pii.category}:</span>
                    <span className="text-slate-200">{maskPii ? pii.maskedText : pii.originalText}</span>
                  </div>
                  <span className="text-slate-500">[{pii.charSpan[0]}:{pii.charSpan[1]}]</span>
                </div>
              ))
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Privacy compliant with carrier telemetry confidentiality standards.
          </p>
        </div>
      </div>
    </div>
  );
};
