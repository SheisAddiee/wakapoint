import React, { useState } from 'react';
import { CoordinatesInfo } from '../types/wakapoint';
import { Compass, MapPin, Copy, Check, Navigation, Layers, ShieldCheck } from 'lucide-react';

interface InteractiveMapCardProps {
  coordinates: CoordinatesInfo;
  primaryLandmark: string;
}

export const InteractiveMapCard: React.FC<InteractiveMapCardProps> = ({
  coordinates,
  primaryLandmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [satelliteOverlay, setSatelliteOverlay] = useState(false);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coordinates.lat}, ${coordinates.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Center coordinate pixel anchor on SVG canvas
  const centerX = 280;
  const centerY = 145;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col transition-all hover:border-slate-700">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 block">Spatial Coordinate Resolution</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {coordinates.locationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggle */}
          <button
            onClick={() => setSatelliteOverlay(!satelliteOverlay)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 cursor-pointer ${
              satelliteOverlay
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{satelliteOverlay ? 'Satellite Vector: ON' : 'Topo Grid'}</span>
          </button>

          {/* Copy Coordinates */}
          <button
            onClick={handleCopyCoords}
            className="px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy Latitude & Longitude"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span className="text-emerald-400 font-semibold">{coordinates.formatted}</span>
          </button>
        </div>
      </div>

      {/* Stylized Vector Cartography Canvas */}
      <div className="relative w-full h-[220px] bg-slate-950 select-none overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 560 260"
          className="w-full h-full"
          style={{
            background: satelliteOverlay
              ? 'radial-gradient(circle at 50% 50%, #061e1b 0%, #03100e 60%, #020617 100%)'
              : 'radial-gradient(circle at 50% 50%, #0f172a 0%, #090d16 65%, #020617 100%)',
          }}
        >
          <defs>
            {/* Fine GIS Grid Pattern */}
            <pattern id="gisMapGrid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M 35 0 L 0 0 0 35" fill="none" stroke="rgba(51, 65, 85, 0.28)" strokeWidth="0.6" />
              <circle cx="0" cy="0" r="0.8" fill="rgba(51, 65, 85, 0.5)" />
            </pattern>

            {/* Radial glow for coordinate target */}
            <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="560" height="260" fill="url(#gisMapGrid)" />

          {/* Road Network Lines (Stylized GIS Arterials) */}
          {/* Main Expressway */}
          <path
            d="M -10 190 Q 220 180 570 110"
            fill="none"
            stroke="rgba(71, 85, 105, 0.4)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M -10 190 Q 220 180 570 110"
            fill="none"
            stroke="rgba(148, 163, 184, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Feeder / Spur Road */}
          <path
            d="M 180 182 L 280 145 L 340 50"
            fill="none"
            stroke="rgba(100, 116, 139, 0.45)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 180 182 L 280 145 L 340 50"
            fill="none"
            stroke="rgba(16, 185, 129, 0.5)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Tertiary Alleyways */}
          <path d="M 280 145 L 390 180 L 460 160" fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="4" />
          <path d="M 110 90 L 180 182" fill="none" stroke="rgba(51, 65, 85, 0.35)" strokeWidth="4" />

          {/* Road Text Annotations */}
          <text x="50" y="206" fill="#64748b" fontSize="9" fontFamily="monospace" letterSpacing="0.05em">
            PRIMARY ARTERIAL CORRIDOR
          </text>
          <text x="210" y="130" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="600">
            DISPATCH SPUR
          </text>

          {/* Compass Indicator in Top Right */}
          <g transform="translate(515, 45)" opacity="0.7">
            <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(71, 85, 105, 0.5)" strokeWidth="1" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1" />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1" />
            <polygon points="0,-14 3,-2 0,-5 -3,-2" fill="#10b981" />
            <text x="0" y="-20" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="700">N</text>
          </g>

          {/* Landmark Anchor Node (e.g. Total Station or Kiosk) */}
          <g transform="translate(180, 182)">
            <circle cx="0" cy="0" r="14" fill="rgba(6, 182, 212, 0.15)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
            <circle cx="0" cy="0" r="5" fill="#06b6d4" />
            <rect x="-45" y="10" width="90" height="18" rx="3" fill="#090d16" stroke="#0e7490" strokeWidth="1" />
            <text x="0" y="22" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="600" fontFamily="monospace">
              LANDMARK ANCHOR
            </text>
          </g>

          {/* Primary Target Delivery Pin & Uncertainty Radius */}
          <g transform={`translate(${centerX}, ${centerY})`}>
            {/* Uncertainty Radius Circle */}
            <circle
              cx="0"
              cy="0"
              r={Math.max(28, coordinates.uncertaintyRadius * 1.5)}
              fill="url(#targetGlow)"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            {/* Inner confidence halo */}
            <circle
              cx="0"
              cy="0"
              r={Math.max(14, coordinates.uncertaintyRadius * 0.75)}
              fill="none"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="1"
            />

            {/* Target Pin Marker */}
            <circle cx="0" cy="0" r="10" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" />
            <circle cx="0" cy="0" r="5" fill="#10b981" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />

            {/* Coordinate Callout Tag */}
            <g transform="translate(0, -32)">
              <rect x="-80" y="-12" width="160" height="24" rx="4" fill="#022c22" stroke="#10b981" strokeWidth="1.2" />
              <text x="0" y="3" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="700" fontFamily="monospace">
                TARGET: {coordinates.formatted}
              </text>
            </g>
          </g>
        </svg>

        {/* Floating Geo-Overlay Footnote */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200">Confidence Radius: ±{coordinates.uncertaintyRadius}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>WGS-84 / Street Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
