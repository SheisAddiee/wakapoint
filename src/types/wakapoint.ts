export type CaseKey = 'Case A' | 'Case B' | 'Case C';

export interface WakaPointTestCase {
  id: string;
  caseKey: CaseKey;
  label: string;
  text: string;
  location: string;
  contextTag: string;
}

export interface ExtractedEntities {
  stateRegion: string;
  lgaDistrict: string;
  primaryLandmark: string;
  microDirections: string[];
  colorStructureIdentifiers: string[];
  recipientUnitContext: string;
}

export interface RoutingStep {
  stepNumber: number;
  phase: 'First Milestone' | 'Turning Cue' | 'Gate Marker' | 'Dropoff Handoff';
  title: string;
  instruction: string;
  cueType: 'MILESTONE' | 'TURN' | 'GATE_MARKER' | 'DROPOFF';
  distanceEstimate: string;
}

export interface CoordinatesInfo {
  lat: number;
  lng: number;
  formatted: string;
  locationName: string;
  uncertaintyRadius: number;
}

export interface ResolvedAddressResult {
  rawText: string;
  confidenceScore: number;
  extractionLatencyMs: number;
  deliverabilityIndex: 'High / Street-level viable' | 'Moderate / Milestone-guided' | 'Low / Needs Dispatch Call';
  deliverabilityGrade: 'A+' | 'A' | 'B' | 'C';
  coordinates: CoordinatesInfo;
  entities: ExtractedEntities;
  routingSteps: RoutingStep[];
  normalizedAddressString: string;
  rawJson: Record<string, unknown>;
}
