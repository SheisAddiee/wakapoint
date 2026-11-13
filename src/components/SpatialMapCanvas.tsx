import React, { useState } from 'react';
import { SpatialAnchor, SecurityAndGuardrails } from '../types/logistics';
import { Compass, Eye, ShieldAlert, Bike, Truck, Car } from 'lucide-react';

interface SpatialMapCanvasProps {
  spatialAnchor: SpatialAnchor;
  guardrails: SecurityAndGuardrails;
  deliveryMode: string;
}

export const SpatialMapCanvas: React.FC<SpatialMapCanvasProps> = ({
  spatialAnchor,
  guardrails,
  deliveryMode,
}) => {
  const [showHazards, setShowHazards] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [showCourierPath, setShowCourierPath] = useState(true);

  // Canvas geometry calculations
  const cx = 300;
  const cy = 190;

  // Primary landmark is placed near the bottom-left or center-left
  const landmarkX = 140;
  const landmarkY = 250;

  // Calculate target micro-dropoff based on bearing and distance
  // Normalize angle in radians
  const angleRad = ((spatialAnchor.bearingDegrees - 90) * Math.PI) / 180;
  const scale = Math.min(1.8, Math.max(0.9, 180 / (spatialAnchor.offsetMeters || 100)));
  const vectorDistPx = Math.min(220, Math.max(110, spatialAnchor.offsetMeters * scale));

  const targetX = landmarkX + Math.cos(angleRad) * vectorDistPx;
  const targetY = landmarkY + Math.sin(angleRad) * vectorDistPx;

  // Midway point for hazard or waypoint
  const midX = (landmarkX + targetX) / 2;
  const midY = (landmarkY + targetY) / 2 - 25;

  const hasHighHazard = guardrails.accessBarriers.some((b) => b.severity === 'HIGH');
  const hazardLabel = guardrails.accessBarriers[0]?.label || 'Access Constraint';

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Topology Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Spatial Topology & Micro-Routing</span>
          <span className="text-slate-500 font-mono text-[11px]">
            [{spatialAnchor.estimatedCoordinates.lat.toFixed(4)}, {spatialAnchor.estimatedCoordinates.lng.toFixed(4)}]
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showHazards ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Hazards
          </button>
          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showUncertainty ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}
          >
            <Eye className="w-3 h-3" />
            ±{spatialAnchor.uncertaintyRadiusMeters}m Radius
          </button>
          <button
            onClick={() => setShowCourierPath(!showCourierPath)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showCourierPath ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}
          >
            {deliveryMode === 'TWO_WHEELER' ? <Bike className="w-3 h-3" /> : deliveryMode === 'LIGHT_VAN' ? <Car className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
            Route Vector
          </button>
        </div>
      </div>

      {/* Vector SVG Viewport */}
      <div className="relative w-full h-[320px] bg-slate-950 flex items-center justify-center select-none overflow-hidden">
        {/* Subtle background radar/coordinate grid */}
        <svg
          viewBox="0 0 600 340"
          className="w-full h-full text-slate-800"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 1) 100%)' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="coordGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1" fill="rgba(51, 65, 85, 0.4)" />
            </pattern>

            {/* Gradient for displacement vector */}
            <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            {/* Hazard stripe pattern */}
            <pattern id="hazardStripe" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="3" />
            </pattern>

            {/* Arrowhead marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Grid background */}
          <rect width="600" height="340" fill="url(#coordGrid)" />

          {/* Compass Rose in Corner */}
          <g transform="translate(540, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1" />
            <polygon points="0,-18 3,-4 0,-7 -3,-4" fill="#06b6d4" />
            <text x="0" y="-25" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="600">N</text>
          </g>

          {/* Main Transit / Access Road line */}
          <path
            d={`M 20 280 Q ${landmarkX} ${landmarkY + 20} 580 290`}
            fill="none"
            stroke="rgba(51, 65, 85, 0.5)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d={`M 20 280 Q ${landmarkX} ${landmarkY + 20} 580 290`}
            fill="none"
            stroke="rgba(100, 116, 139, 0.6)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="50" y="295" fill="#64748b" fontSize="10" fontFamily="monospace">PRIMARY TRANSIT CORRIDOR</text>

          {/* Uncertainty Radius Ring at Dropoff */}
          {showUncertainty && (
            <g transform={`translate(${targetX}, ${targetY})`}>
              <circle
                cx="0"
                cy="0"
                r={Math.max(26, spatialAnchor.uncertaintyRadiusMeters * 1.4)}
                fill="rgba(6, 182, 212, 0.06)"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <circle
                cx="0"
                cy="0"
                r={Math.max(14, spatialAnchor.uncertaintyRadiusMeters * 0.7)}
                fill="none"
                stroke="rgba(6, 182, 212, 0.3)"
                strokeWidth="0.8"
              />
            </g>
          )}

          {/* Courier Approach Vector */}
          {showCourierPath && (
            <g>
              {/* Displacement connection vector */}
              <line
                x1={landmarkX}
                y1={landmarkY}
                x2={targetX}
                y2={targetY}
                stroke="url(#vectorGrad)"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrow)"
              />

              {/* Angle & Distance tag */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-42" y="-12" width="84" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="600">
                  {spatialAnchor.offsetMeters}m · {spatialAnchor.bearingDegrees}°
                </text>
              </g>
            </g>
          )}

          {/* Hazard / Access Barrier zone */}
          {showHazards && guardrails.accessBarriers.length > 0 && (
            <g transform={`translate(${midX + 25}, ${midY + 30})`}>
              <rect x="-35" y="-18" width="70" height="36" rx="4" fill="url(#hazardStripe)" stroke="#f59e0b" strokeWidth="1" />
              <rect x="-35" y="-18" width="70" height="36" rx="4" fill="rgba(15, 23, 42, 0.7)" />
              <text x="0" y="-3" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="700" fontFamily="monospace">
                ! HAZARD
              </text>
              <text x="0" y="9" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {hazardLabel.length > 14 ? hazardLabel.slice(0, 12) + '...' : hazardLabel}
              </text>
            </g>
          )}

          {/* Landmark Node (Origin / Anchor) */}
          <g transform={`translate(${landmarkX}, ${landmarkY})`}>
            {/* Outer halo */}
            <circle cx="0" cy="0" r="16" fill="rgba(6, 182, 212, 0.15)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
            <circle cx="0" cy="0" r="8" fill="#06b6d4" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />

            {/* Landmark Label Callout */}
            <g transform="translate(-10, -22)">
              <rect x="-60" y="-16" width="120" height="20" rx="3" fill="#090d16" stroke="#0284c7" strokeWidth="1" />
              <text x="0" y="-3" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600" fontFamily="monospace">
                ANCHOR: {spatialAnchor.primaryLandmark.length > 14 ? spatialAnchor.primaryLandmark.slice(0, 13) + '..' : spatialAnchor.primaryLandmark}
              </text>
            </g>
          </g>

          {/* Micro-Dropoff Waypoint Node (Destination) */}
          <g transform={`translate(${targetX}, ${targetY})`}>
            {/* Pulsing ring visual */}
            <circle cx="0" cy="0" r="18" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
            <circle cx="0" cy="0" r="9" fill="#10b981" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />

            {/* Target Label Callout */}
            <g transform="translate(0, 24)">
              <rect x="-65" y="0" width="130" height="24" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" opacity="0.95" />
              <text x="0" y="12" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="700" fontFamily="monospace">
                DROPOFF: {spatialAnchor.microDropoff.target.length > 15 ? spatialAnchor.microDropoff.target.slice(0, 14) + '..' : spatialAnchor.microDropoff.target}
              </text>
              <text x="0" y="21" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontFamily="monospace">
                {spatialAnchor.microDropoff.levelOrFloor || 'Ground Level Gate'}
              </text>
            </g>
          </g>
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 backdrop-blur-sm font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Anchor Landmark</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Resolved Target</span>
          </div>
          {hasHighHazard && (
            <>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 bg-amber-400 rotate-45 inline-block"></span>
                <span>Active Obstacle</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
