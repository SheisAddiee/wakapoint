import { WakaPointTestCase } from '../types/wakapoint';

export const WAKAPOINT_PRESET_CASES: WakaPointTestCase[] = [
  {
    id: 'case-a-lokogoma',
    caseKey: 'Case A',
    label: 'Case A · Abuja Residential',
    text: 'Opposite yellow water tank near total filling station, entering through the green gate, Lokogoma, Abuja',
    location: 'Lokogoma, Abuja FCT',
    contextTag: 'Landmark & Gate Disambiguation',
  },
  {
    id: 'case-b-benin',
    caseKey: 'Case B',
    label: 'Case B · Benin City Radial',
    text: 'Behind primary school, second junction after mama Ngozi shop, off Ring Road, Benin City',
    location: 'Ring Road, Benin City, Edo',
    contextTag: 'Sequential Junctions & Kiosk Hop',
  },
  {
    id: 'case-c-ikeja',
    caseKey: 'Case C',
    label: 'Case C · Lagos Commercial',
    text: 'Shop 14, block B, modern market by the pedestrian bridge, Ikeja, Lagos',
    location: 'Ikeja, Lagos State',
    contextTag: 'High-Density Market Retail Stall',
  },
];
