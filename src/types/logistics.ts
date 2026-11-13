export type EntityType =
  | 'PRIMARY_LANDMARK'
  | 'SPATIAL_RELATION'
  | 'NAV_DISAMBIGUATION'
  | 'MICRO_LOCALITY'
  | 'ACCESS_CONSTRAINT'
  | 'CONTACT_TRIGGER'
  | 'SUB_ADMIN_REGION'
  | 'POSTAL_OR_PIN'
  | 'DISPATCH_INSTRUCTION';

export interface GeoEntity {
  id: string;
  type: EntityType;
  text: string;
  start: number;
  end: number;
  confidence: number;
  canonical: string;
  description: string;
}

export interface SpatialAnchor {
  primaryLandmark: string;
  landmarkType: 'COMMERCIAL_STATION' | 'PUBLIC_INFRASTRUCTURE' | 'NATURAL_FEATURE' | 'CIVIC_MONUMENT' | 'RURAL_STRUCTURE';
  relation: string;
  offsetMeters: number;
  bearingDegrees: number;
  estimatedCoordinates: {
    lat: number;
    lng: number;
  };
  uncertaintyRadiusMeters: number;
  microDropoff: {
    target: string;
    levelOrFloor?: string;
    gateOrEntrance?: string;
    accessNote?: string;
  };
}

export interface SecurityAndGuardrails {
  accessBarriers: Array<{
    type: 'AUDIO_SIGNAL' | 'PHYSICAL_HAZARD' | 'INFRASTRUCTURE_DEFICIT' | 'UNPAVED_SURFACE' | 'RESTRICTED_ENTRY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    label: string;
    mitigation: string;
  }>;
  piiDetected: Array<{
    category: 'PERSON_NAME' | 'PHONE_NUMBER' | 'RESIDENTIAL_KEY_CODE';
    originalText: string;
    maskedText: string;
    charSpan: [number, number];
  }>;
  vehicleRecommendation: {
    recommended: 'TWO_WHEELER' | 'LIGHT_VAN' | 'FOUR_WHEEL_DRIVE' | 'WALKING_COURIER';
    reason: string;
    axleWeightLimitKg?: number;
  };
  timeSensitivity: {
    requiresRecipientConfirmation: boolean;
    recommendedTimeWindow?: string;
    notes: string;
  };
}

export interface ParsingResult {
  id: string;
  timestamp: string;
  rawInput: string;
  region: string;
  deliveryMode: string;
  confidenceScore: number;
  deliverabilityGrade: 'A+' | 'A' | 'B' | 'C' | 'UNRESOLVED';
  processingLatencyMs: number;
  primaryClassification: string;
  complexityScore: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  canonicalStandardizedAddress: string;
  isoLogisticsFormat: string;
  entities: GeoEntity[];
  spatialAnchor: SpatialAnchor;
  guardrails: SecurityAndGuardrails;
  stats: {
    tokenCount: number;
    entityDensity: number;
    spatialAnchorCount: number;
    piiEntitiesFound: number;
  };
}

export interface TestCase {
  id: string;
  title: string;
  category: string;
  region: string;
  country: string;
  deliveryMode: 'TWO_WHEELER' | 'LIGHT_VAN' | 'FOUR_WHEEL_DRIVE';
  rawInput: string;
  description: string;
  expectedClassification: string;
}
