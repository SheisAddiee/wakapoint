import { TestCase } from '../types/logistics';

export const PRODUCTION_TEST_CASES: TestCase[] = [
  {
    id: 'case-lagos-informal',
    title: 'Informal Transit Landmark (Lagos)',
    category: 'Emerging Market / Informal Urban',
    region: 'Sub-Saharan Africa',
    country: 'Nigeria',
    deliveryMode: 'TWO_WHEELER',
    rawInput:
      'Opposite Total Filling Station along expressway, 3rd yellow gate after the pedestrian bridge with the broken culvert, call mama Titi on 0803-555-0192 when you reach landmark, Ojota, Lagos State',
    description:
      'Multi-hop landmark chain anchored to a commercial gas station with relative sequential gate indexing, audio dispatch trigger, and infrastructure hazard.',
    expectedClassification: 'Landmark-Anchored Relative Displacement',
  },
  {
    id: 'case-bogota-barrio',
    title: 'Andean Urban Micro-Local (Bogotá)',
    category: 'Latin America / Informal Barrio',
    region: 'South America',
    country: 'Colombia',
    deliveryMode: 'TWO_WHEELER',
    rawInput:
      'Calle 45 # 12-88 interior 4, portón negro frente a la panadería Don Pedro, subir al 3er piso timbre descompuesto tocar fuerte 3 veces, Chapinero Central, Bogotá D.C.',
    description:
      'Traditional grid number combined with landmark micro-anchor, hardware defect warning (broken buzzer), and manual acoustic signal instruction.',
    expectedClassification: 'Compound Grid-Relative + Acoustic Cue',
  },
  {
    id: 'case-virginia-rural',
    title: 'Rural Mile-Marker & Hazard (Virginia)',
    category: 'Rural / Industrial North America',
    region: 'North America',
    country: 'United States',
    deliveryMode: 'FOUR_WHEEL_DRIVE',
    rawInput:
      'Old Mill Farm, Mile Marker 14 on County Rd 410, unpaved gravel track 200 yards past the red rusted grain silo, leave parcels in blue plastic tote behind tool shed, beware of large German shepherd dog, Pulaski County, VA 24301',
    description:
      'Highway mile-marker offset with physical structure landmark, canine hazard notification, and weather-proof dropoff cache.',
    expectedClassification: 'Linear Mile-Offset + Drop Cache',
  },
  {
    id: 'case-nairobi-matatu',
    title: 'Matatu Stage & Junction (Nairobi)',
    category: 'East Africa / Semi-Structured',
    region: 'East Africa',
    country: 'Kenya',
    deliveryMode: 'TWO_WHEELER',
    rawInput:
      'Stage ya Stage 46 near QuickMart supermarket, follow dirt lane behind the M-Pesa kiosk right side, green corrugated iron gate opposite boda boda shed, Kawangware, Nairobi',
    description:
      'Public transit stage anchor, micro-retail kiosk reference, and local vehicle terminal orientation.',
    expectedClassification: 'Transit Node Transit-Oriented Hop',
  },
];
