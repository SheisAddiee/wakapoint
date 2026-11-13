import React, { useState } from 'react';
import { ParsingResult, GeoEntity } from '../types/logistics';
import { SpatialMapCanvas } from './SpatialMapCanvas';
import { MapPin, Info, Tag, Layers } from 'lucide-react';

interface ParsedDetectionsTabProps {
  result: ParsingResult;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
}

const ENTITY_COLOR_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PRIMARY_LANDMARK: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-700/60', label: 'Landmark' },
  SPATIAL_RELATION: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-700/60', label: 'Spatial Vector' },
  NAV_DISAMBIGUATION: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-700/60', label: 'Micro-Waypoint' },
  ACCESS_CONSTRAINT: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-700/60', label: 'Barrier/Constraint' },
  CONTACT_TRIGGER: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-700/60', label: 'Audio/Contact' },
  SUB_ADMIN_REGION: { bg: 'bg-teal-950/60', text: 'text-teal-300', border: 'border-teal-700/60', label: 'Admin Region' },
  POSTAL_OR_PIN: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-700/60', label: 'Postal Standard' },
  DISPATCH_INSTRUCTION: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600', label: 'Instruction' },
};

export const ParsedDetectionsTab: React.FC<ParsedDetectionsTabProps> = ({
  result,
  selectedEntityId,
  onSelectEntity,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Render raw string with highlighted token spans
  const renderAnnotatedText = () => {
    const raw = result.rawInput;
    if (!result.entities.length) {
      return <span className="text-slate-400">{raw}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    result.entities.forEach((entity) => {
      // Add text before entity
      if (entity.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} className="text-slate-300">
            {raw.substring(lastIndex, entity.start)}
          </span>
        );
      }

      const style = ENTITY_COLOR_MAP[entity.type] || {
        bg: 'bg-slate-800',
        text: 'text-slate-200',
        border: 'border-slate-700',
        label: entity.type,
      };

      const isSelected = selectedEntityId === entity.id;

      elements.push(
        <button
          key={entity.id}
          onClick={() => onSelectEntity(isSelected ? null : entity.id)}
          className={`inline-flex items-baseline px-1.5 py-0.5 mx-0.5 text-xs font-mono rounded border transition-all cursor-pointer ${
            style.bg
          } ${style.text} ${style.border} ${
            isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-105' : 'hover:brightness-125'
          }`}
          title={`${entity.type}: ${entity.description}`}
        >
          <span>{entity.text}</span>
          <span className="ml-1 text-[9px] uppercase tracking-wider opacity-75 font-sans">
            {style.label}
          </span>
        </button>
      );

      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < raw.length) {
      elements.push(
        <span key={`text-${lastIndex}`} className="text-slate-300">
          {raw.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const filteredEntities = activeFilter === 'ALL'
    ? result.entities
    : result.entities.filter((e) => e.type === activeFilter);

  const selectedEntity = result.entities.find((e) => e.id === selectedEntityId);

  return (
    <div className="space-y-4">
      {/* Annotated Geo-NER Text Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            Decomposed Token Stream (Interactive Entities)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click any token to inspect resolution
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded font-mono text-xs leading-relaxed tracking-normal">
          {renderAnnotatedText()}
        </div>

        {/* Selected Entity Inspector if active */}
        {selectedEntity && (
          <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
            <div>
              <span className="font-semibold text-white font-mono">{selectedEntity.text}</span>
              <span className="text-slate-400 ml-2">➔ {selectedEntity.canonical}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{selectedEntity.type}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{(selectedEntity.confidence * 100).toFixed(0)}% Confidence</span>
              <button
                onClick={() => onSelectEntity(null)}
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spatial Topology Vector Map */}
      <SpatialMapCanvas
        spatialAnchor={result.spatialAnchor}
        guardrails={result.guardrails}
        deliveryMode={result.deliveryMode}
      />

      {/* Structured Geo-NER Entities Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Extracted Geo-NER Entity Register ({result.entities.length})
            </span>
          </div>

          {/* Interactive filter buttons */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {['ALL', 'PRIMARY_LANDMARK', 'SPATIAL_RELATION', 'NAV_DISAMBIGUATION', 'ACCESS_CONSTRAINT'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === type
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Entities' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-medium">Entity Type</th>
                <th className="py-2.5 px-4 font-medium">Raw Substring</th>
                <th className="py-2.5 px-4 font-medium">Span</th>
                <th className="py-2.5 px-4 font-medium">Canonical Normalization</th>
                <th className="py-2.5 px-4 font-medium text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEntities.map((entity) => {
                const style = ENTITY_COLOR_MAP[entity.type] || {
                  bg: 'bg-slate-800',
                  text: 'text-slate-200',
                  border: 'border-slate-700',
                  label: entity.type,
                };
                const isSelected = selectedEntityId === entity.id;

                return (
                  <tr
                    key={entity.id}
                    onClick={() => onSelectEntity(isSelected ? null : entity.id)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        {entity.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-200 font-medium">
                      "{entity.text}"
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 tabular-nums">
                      [{entity.start}:{entity.end}]
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">
                      {entity.canonical}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-bold tabular-nums">
                      {(entity.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
