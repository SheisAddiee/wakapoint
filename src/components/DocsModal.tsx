import React from 'react';
import { X, BookOpen, Code, Terminal, Layers, ExternalLink } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Geo-NER & Routing Normaliser — API & Schema Specifications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1: Core Problem & Topology */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              1. Informal Address Decomposition Model
            </h3>
            <p className="text-slate-400 mb-3">
              Informal and emerging market logistics rely on colloquial landmark networks, relative
              spatial vectors, micro-location cues, and access constraints rather than standardized postal codes.
              This Geo-NER pipeline converts unstructured, narrative-heavy delivery descriptions into machine-ingestible
              ISO 19112 spatial entities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-cyan-400 font-bold block mb-1">PRIMARY_LANDMARK</span>
                Salient physical anchor (e.g. gas station, kiosk, bridge, silo, supermarket).
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-indigo-400 font-bold block mb-1">SPATIAL_RELATION</span>
                Directional displacement (opposite, after bridge, 200m past).
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-emerald-400 font-bold block mb-1">NAV_DISAMBIGUATION</span>
                Sequential visual differentiator (e.g. 3rd yellow gate, interior 4).
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-amber-400 font-bold block mb-1">ACCESS_CONSTRAINT</span>
                Physical road defect, broken buzzer, guard canine, unpaved terrain.
              </div>
            </div>
          </div>

          {/* Section 2: REST Endpoint Ingestion */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              2. Carrier REST API Endpoint
            </h3>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  POST
                </span>
                <span className="text-slate-200">/api/v1/logistics/geo-ner/normalize</span>
              </div>
              <pre className="text-slate-400 text-[10px] overflow-x-auto pt-2 border-t border-slate-800">
{`curl -X POST "https://api.carrier.tms/v1/geo-ner/normalize" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "raw_input": "Opposite Total Filling Station, 3rd yellow gate...",
    "region_hint": "Sub-Saharan Africa",
    "delivery_mode": "TWO_WHEELER",
    "enable_pii_quarantine": true
  }'`}
              </pre>
            </div>
          </div>

          {/* Section 3: Spatial Mathematical Math */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              3. Spatial Disambiguation Vector Math
            </h3>
            <p className="text-slate-400 mb-2">
              The spatial anchor synthesizes estimated coordinates via forward geocoding on the Primary Landmark,
              then computes the target micro-dropoff waypoint using the haversine forward projection formula:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              φ₂ = asin( sin φ₁ ⋅ cos(d/R) + cos φ₁ ⋅ sin(d/R) ⋅ cos θ )<br />
              λ₂ = λ₁ + atan2( sin θ ⋅ sin(d/R) ⋅ cos φ₁, cos(d/R) - sin φ₁ ⋅ sin φ₂ )
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            OpenAPI 3.1 & ISO 19112 Compliant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
