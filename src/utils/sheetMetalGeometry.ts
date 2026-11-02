/**
 * Archtech Architectural Roofing - Sheet Metal & Flashing Geometry Engine
 *
 * Implements deterministic engineering calculations for architectural sheet metal folding:
 * - Bend Allowance (BA), Bend Deduction (BD), Setback (SB), and K-Factor
 * - Developed Blank Width (L_blank)
 * - Standard architectural coil materials (0.55mm Vitor+, 0.75mm MagnaFlow, etc.)
 * - Girth tier pricing classification
 * - Fold sequence generation (Brake press operation instructions)
 * - Polyline geometry validation & developed length calculations
 */

import { FlashingGirthTier } from '../types/crm';

export interface SheetMetalMaterialSpec {
  id: string;
  name: string;
  thicknessMm: number;
  defaultInsideRadiusMm: number;
  kFactor: number; // Neutral axis offset factor (typically 0.33 to 0.45 for air bending)
  minBendRadiusMm: number;
  maxRecommendedLengthM: number;
  availableFinishes: string[];
}

export const STANDARD_SHEET_MATERIALS: Record<string, SheetMetalMaterialSpec> = {
  'vitor_055': {
    id: 'vitor_055',
    name: 'Kiwicolour® Vitor+ PVDF Steel',
    thicknessMm: 0.55,
    defaultInsideRadiusMm: 0.8,
    kFactor: 0.38,
    minBendRadiusMm: 0.6,
    maxRecommendedLengthM: 6.0,
    availableFinishes: ['FlaxPod', 'Slate Grey', 'Titania', 'Ebony', 'Grey Friars', 'Sandstone']
  },
  'magnaflow_075': {
    id: 'magnaflow_075',
    name: 'The Roofing Store MagnaFlow® Alloy',
    thicknessMm: 0.75,
    defaultInsideRadiusMm: 1.0,
    kFactor: 0.40,
    minBendRadiusMm: 0.8,
    maxRecommendedLengthM: 6.0,
    availableFinishes: ['Slate Grey', 'FlaxPod', 'Cloud Grey', 'Lignite']
  },
  'zenex_055': {
    id: 'zenex_055',
    name: 'Kiwicolour® Zenex+ Extreme Coastal',
    thicknessMm: 0.55,
    defaultInsideRadiusMm: 0.8,
    kFactor: 0.38,
    minBendRadiusMm: 0.6,
    maxRecommendedLengthM: 6.0,
    availableFinishes: ['Zenex Anthracite', 'Zenex Dune', 'Zenex Titanium']
  },
  'corten_070': {
    id: 'corten_070',
    name: 'Architectural Corten Weathering Steel',
    thicknessMm: 0.70,
    defaultInsideRadiusMm: 1.5,
    kFactor: 0.42,
    minBendRadiusMm: 1.2,
    maxRecommendedLengthM: 3.0,
    availableFinishes: ['Natural Weathered Patina']
  },
  'copper_060': {
    id: 'copper_060',
    name: 'Architectural Pure Half-Hard Copper',
    thicknessMm: 0.60,
    defaultInsideRadiusMm: 0.6,
    kFactor: 0.35,
    minBendRadiusMm: 0.5,
    maxRecommendedLengthM: 3.0,
    availableFinishes: ['Natural Bright', 'Pre-Patinated Brown']
  },
  'aluminium_080': {
    id: 'aluminium_080',
    name: 'Marine-Grade 5005 Aluminium',
    thicknessMm: 0.80,
    defaultInsideRadiusMm: 1.2,
    kFactor: 0.42,
    minBendRadiusMm: 1.0,
    maxRecommendedLengthM: 6.0,
    availableFinishes: ['Mill Finish', 'Powdercoated', 'Anodized 25um']
  }
};

export interface BendCalculationResult {
  interiorAngleDeg: number;
  bendAngleDeg: number; // Turn from straight = 180 - interiorAngle
  insideRadiusMm: number;
  thicknessMm: number;
  kFactor: number;
  bendAllowanceMm: number; // Arc length along neutral axis
  setbackMm: number;
  bendDeductionMm: number; // Amount subtracted from sum of outside leg lengths
}

/**
 * Calculates precision sheet metal bend parameters based on standard mechanical engineering formulas:
 * 
 * Bend Angle phi = 180° - Interior Angle (in degrees)
 * Bend Allowance (BA) = (pi / 180) * phi * (R + K * T)
 * Outside Setback (OSSB) = tan(phi / 2) * (R + T)
 * Bend Deduction (BD) = 2 * OSSB - BA
 */
export function calculateBendParameters(
  interiorAngleDeg: number,
  thicknessMm: number,
  insideRadiusMm: number = 0.8,
  kFactor: number = 0.38
): BendCalculationResult {
  // Clamp interior angle to physical folding range: 10° to 179°
  const clampedInterior = Math.max(10, Math.min(179, interiorAngleDeg));
  const bendAngleDeg = 180 - clampedInterior;
  const phiRad = (bendAngleDeg * Math.PI) / 180;

  // Bend Allowance (neutral axis arc)
  const bendAllowanceMm = phiRad * (insideRadiusMm + kFactor * thicknessMm);

  // Outside Setback (distance from apex to tangent point)
  const halfPhi = phiRad / 2;
  const setbackMm = Math.tan(halfPhi) * (insideRadiusMm + thicknessMm);

  // Bend Deduction
  const bendDeductionMm = 2 * setbackMm - bendAllowanceMm;

  return {
    interiorAngleDeg: clampedInterior,
    bendAngleDeg,
    insideRadiusMm,
    thicknessMm,
    kFactor,
    bendAllowanceMm: Math.round(bendAllowanceMm * 100) / 100,
    setbackMm: Math.round(setbackMm * 100) / 100,
    bendDeductionMm: Math.round(bendDeductionMm * 100) / 100
  };
}

export interface FlashingLeg {
  id: string;
  lengthMm: number;
  interiorAngleDeg?: number; // Interior angle to next leg (undefined for last leg)
  turnDirection?: -1 | 1; // -1 = down/CW, 1 = up/CCW
  kind?: 'leg' | 'open_hem' | 'closed_hem' | 'crush_fold' | 'drip' | 'return' | 'safety_fold' | 'hem';
  hemGapMm?: number; // For open hem, gap between return and base leg (e.g. 1.5mm to 3.0mm)
}

export interface FlashingCalculationSummary {
  nominalSumMm: number;
  developedBlankWidthMm: number;
  totalBendDeductionMm: number;
  girthTier: FlashingGirthTier;
  recommendedSlitWidthMm: number;
  slittingWasteMm: number;
  totalPieceLengthLm: number;
  pieceCount: number;
  totalLinearMetres: number;
  totalWeightKg: number;
  materialSpec: SheetMetalMaterialSpec;
  bendSteps: WorkshopBendStep[];
}

export interface WorkshopBendStep {
  stepNumber: number;
  legIndex: number;
  bendAngleDeg: number;
  interiorAngleDeg: number;
  bendDirection: 'UP' | 'DOWN';
  foldType: 'Standard Bend' | 'Open Teardrop Hem' | 'Crushed Safety Hem' | 'Drip Kick';
  stopPositionMm: number; // Backgauge position from edge
  notes: string;
}

/**
 * Classifies a developed blank width into Archtech's standard pricing girth tiers.
 */
export function classifyGirthTier(developedWidthMm: number): FlashingGirthTier {
  if (developedWidthMm <= 150) return '0-150mm';
  if (developedWidthMm <= 300) return '151-300mm';
  if (developedWidthMm <= 450) return '301-450mm';
  if (developedWidthMm <= 600) return '451-600mm';
  if (developedWidthMm <= 900) return '601-900mm';
  return '901-1200mm';
}

/**
 * Standard standard master coil slit widths available from The Roofing Store (NZ).
 * Rollformers and slitter tables slice master 1220mm coils into these standard blanks:
 */
export const STANDARD_SLIT_WIDTHS = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750, 900, 1200];

/**
 * Calculates the complete engineering fabrication profile for a flashing.
 */
export function calculateFlashingEngineering(
  legs: FlashingLeg[],
  materialKey: string = 'vitor_055',
  pieceLengthLm: number = 3.0,
  pieceCount: number = 1
): FlashingCalculationSummary {
  const material = STANDARD_SHEET_MATERIALS[materialKey] || STANDARD_SHEET_MATERIALS['vitor_055'];
  
  // 1. Calculate nominal sum of outer legs
  const nominalSumMm = legs.reduce((acc, leg) => acc + (Number(leg.lengthMm) || 0), 0);

  // 2. Calculate bend deductions for all interior corners
  let totalBendDeductionMm = 0;
  const bendSteps: WorkshopBendStep[] = [];
  let cumulativeLength = 0;

  legs.forEach((leg, idx) => {
    cumulativeLength += Number(leg.lengthMm) || 0;

    if (idx < legs.length - 1 && leg.interiorAngleDeg !== undefined) {
      const isHem = leg.kind === 'closed_hem' || leg.kind === 'crush_fold';
      const isOpenHem = leg.kind === 'open_hem';

      if (isHem) {
        // Flat crush fold: material doubles back onto itself
        // Empirically, blank allowance for 180° crush hem is ~ 0.5 * thickness
        const hemDeduction = 0.5 * material.thicknessMm;
        totalBendDeductionMm += hemDeduction;

        bendSteps.push({
          stepNumber: bendSteps.length + 1,
          legIndex: idx,
          bendAngleDeg: 180,
          interiorAngleDeg: 0,
          bendDirection: leg.turnDirection === -1 ? 'DOWN' : 'UP',
          foldType: 'Crushed Safety Hem',
          stopPositionMm: Math.round(cumulativeLength * 10) / 10,
          notes: 'Pre-bend 35° acute then flatten in hem bed.'
        });
      } else if (isOpenHem) {
        // Teardrop open hem (e.g. for locking cleat or drip kick)
        const gap = leg.hemGapMm || 2.0;
        const hemDeduction = 0.3 * material.thicknessMm + (gap * 0.2);
        totalBendDeductionMm += hemDeduction;

        bendSteps.push({
          stepNumber: bendSteps.length + 1,
          legIndex: idx,
          bendAngleDeg: 175,
          interiorAngleDeg: 5,
          bendDirection: leg.turnDirection === -1 ? 'DOWN' : 'UP',
          foldType: 'Open Teardrop Hem',
          stopPositionMm: Math.round(cumulativeLength * 10) / 10,
          notes: `Fold with ${gap}mm spacer cleat.`
        });
      } else {
        // Standard angle fold
        const bendParams = calculateBendParameters(
          leg.interiorAngleDeg,
          material.thicknessMm,
          material.defaultInsideRadiusMm,
          material.kFactor
        );
        totalBendDeductionMm += bendParams.bendDeductionMm;

        const isDrip = leg.kind === 'drip' || leg.interiorAngleDeg > 120;

        bendSteps.push({
          stepNumber: bendSteps.length + 1,
          legIndex: idx,
          bendAngleDeg: bendParams.bendAngleDeg,
          interiorAngleDeg: bendParams.interiorAngleDeg,
          bendDirection: leg.turnDirection === -1 ? 'DOWN' : 'UP',
          foldType: isDrip ? 'Drip Kick' : 'Standard Bend',
          stopPositionMm: Math.round(cumulativeLength * 10) / 10,
          notes: `Bend ${bendParams.bendAngleDeg}° (Interior ${bendParams.interiorAngleDeg}°)`
        });
      }
    }
  });

  // True Developed Blank Width
  const developedBlankWidthMm = Math.max(10, Math.round((nominalSumMm - totalBendDeductionMm) * 10) / 10);
  const girthTier = classifyGirthTier(developedBlankWidthMm);

  // Find optimal coil slit width
  const recommendedSlitWidthMm = STANDARD_SLIT_WIDTHS.find(w => w >= developedBlankWidthMm) || 1200;
  const slittingWasteMm = recommendedSlitWidthMm - developedBlankWidthMm;

  // Total Linear Metres & Total Weight
  const totalLinearMetres = Math.round(pieceLengthLm * pieceCount * 100) / 100;

  // Approximate weight in kg (Density: Steel ~7.85 g/cm³, Alu ~2.7 g/cm³, Copper ~8.96 g/cm³)
  let densityGcm3 = 7.85;
  if (materialKey.includes('aluminium')) densityGcm3 = 2.70;
  else if (materialKey.includes('copper')) densityGcm3 = 8.96;

  // Area m² = (developedBlankWidthMm / 1000) * totalLinearMetres
  const totalAreaM2 = (developedBlankWidthMm / 1000) * totalLinearMetres;
  const volumeCm3 = totalAreaM2 * 10000 * (material.thicknessMm / 10);
  const totalWeightKg = Math.round((volumeCm3 * densityGcm3) / 1000 * 10) / 10;

  return {
    nominalSumMm: Math.round(nominalSumMm * 10) / 10,
    developedBlankWidthMm,
    totalBendDeductionMm: Math.round(totalBendDeductionMm * 100) / 100,
    girthTier,
    recommendedSlitWidthMm,
    slittingWasteMm: Math.round(slittingWasteMm * 10) / 10,
    totalPieceLengthLm: pieceLengthLm,
    pieceCount,
    totalLinearMetres,
    totalWeightKg,
    materialSpec: material,
    bendSteps
  };
}

/**
 * Calculates true developed blank width (mm) for a set of segments and thickness.
 */
export function calculateDevelopedBlankWidth(
  segments: { lengthMm: number; angleDeg?: number; kind?: any; turnDirection?: -1 | 1; hemGapMm?: number }[],
  thicknessMm: number = 0.55
): number {
  if (!segments || !segments.length) return 0;
  const legs: FlashingLeg[] = segments.map((s, idx) => ({
    id: `leg-${idx}`,
    lengthMm: s.lengthMm,
    interiorAngleDeg: s.angleDeg !== undefined ? s.angleDeg : 90,
    turnDirection: s.turnDirection ?? 1,
    kind: s.kind === 'open_hem' ? 'open_hem' : (s.kind === 'closed_hem' || s.kind === 'crush_fold') ? 'closed_hem' : s.kind === 'drip' ? 'drip' : s.kind === 'return' ? 'return' : s.kind === 'safety_fold' ? 'safety_fold' : 'leg',
    hemGapMm: s.hemGapMm
  }));
  const eng = calculateFlashingEngineering(legs, thicknessMm >= 0.7 ? 'magnaflow_075' : 'vitor_055');
  return eng.developedBlankWidthMm;
}

/**
 * Converts a series of 2D profile coordinates into dimensioned segments and bends.
 */
export function outlineToLegs(points: { x: number; y: number }[]): FlashingLeg[] {
  if (points.length < 2) return [];

  const legs: FlashingLeg[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const lengthMm = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y));

    let interiorAngleDeg: number | undefined = undefined;
    let turnDirection: -1 | 1 | undefined = undefined;

    if (i < points.length - 2) {
      const p3 = points[i + 2];
      const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

      const dot = v1.x * v2.x + v1.y * v2.y;
      const cross = v1.x * v2.y - v1.y * v2.x;

      let angleRad = Math.atan2(Math.abs(cross), dot);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      
      // Interior corner angle = 180 - angleDeg
      interiorAngleDeg = 180 - angleDeg;
      turnDirection = cross < 0 ? -1 : 1;
    }

    legs.push({
      id: `leg-${i + 1}`,
      lengthMm: Math.max(1, lengthMm),
      interiorAngleDeg,
      turnDirection,
      kind: 'leg'
    });
  }

  return legs;
}

/**
 * Standard Architectural Flashing Template Catalog
 * Pre-engineered for New Zealand Building Code (NZBC E2/AS1) compliance
 */
export interface FlashingTemplatePreset {
  id: string;
  name: string;
  category: 'Apron & Abutment' | 'Parapet & Cap' | 'Barge & Edge' | 'Ridge & Hip' | 'Valley & Gutter' | 'Window & Penetration';
  description: string;
  nzbcStandard: string;
  defaultMaterial: string;
  girthTier?: FlashingGirthTier;
  developedBlankWidthMm?: number;
  paintSide?: 'inside' | 'outside' | 'left' | 'right';
  material?: string;
  colorName?: string;
  insideRadiusMm?: number;
  kFactor?: number;
  geometryMm?: { x: number; y: number }[];
  segments?: {
    id: string;
    lengthMm: number;
    angleDeg: number;
    turnDirection?: -1 | 1;
    kind: any;
    hemGapMm?: number;
  }[];
  legs: FlashingLeg[];
}

export const ARCHITECTURAL_FLASHING_PRESETS: FlashingTemplatePreset[] = [
  {
    id: 'preset-apron-kick',
    name: 'E2/AS1 Roof-to-Wall Apron Flashing',
    category: 'Apron & Abutment',
    description: '150mm vertical upstand with 25mm anti-capillary hem, 100mm cover over trays, and 15mm drip kick.',
    nzbcStandard: 'NZBC E2/AS1 Figure 8 (Apron detail with 150mm upstand)',
    defaultMaterial: 'vitor_055',
    legs: [
      { id: 'l1', lengthMm: 20, interiorAngleDeg: 135, turnDirection: -1, kind: 'safety_fold' },
      { id: 'l2', lengthMm: 150, interiorAngleDeg: 90, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 120, interiorAngleDeg: 135, turnDirection: 1, kind: 'drip' },
      { id: 'l4', lengthMm: 15, kind: 'safety_fold' }
    ]
  },
  {
    id: 'preset-parapet-capping',
    name: 'Architectural Parapet Capping (Dual Drip)',
    category: 'Parapet & Cap',
    description: 'Full parapet capping with 5° positive drainage slope, dual 70mm vertical skirts, and bird-beak drips.',
    nzbcStandard: 'NZBC E2/AS1 Figure 9 (Parapet with minimum 50mm cover and drip edge)',
    defaultMaterial: 'magnaflow_075',
    legs: [
      { id: 'l1', lengthMm: 15, interiorAngleDeg: 45, turnDirection: -1, kind: 'drip' },
      { id: 'l2', lengthMm: 70, interiorAngleDeg: 95, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 280, interiorAngleDeg: 85, turnDirection: 1, kind: 'leg' },
      { id: 'l4', lengthMm: 70, interiorAngleDeg: 45, turnDirection: -1, kind: 'drip' },
      { id: 'l5', lengthMm: 15, kind: 'safety_fold' }
    ]
  },
  {
    id: 'preset-barge-roll',
    name: 'Super Seam Architectural Barge Flashing',
    category: 'Barge & Edge',
    description: 'Clean shadow-line barge with lock seam rebate over timber fascia and return hook hem.',
    nzbcStandard: 'NZBC E2/AS1 Figure 10 (Barge flashing with expansion tolerance)',
    defaultMaterial: 'vitor_055',
    legs: [
      { id: 'l1', lengthMm: 18, interiorAngleDeg: 35, turnDirection: -1, kind: 'open_hem', hemGapMm: 2.0 },
      { id: 'l2', lengthMm: 90, interiorAngleDeg: 90, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 60, interiorAngleDeg: 90, turnDirection: 1, kind: 'leg' },
      { id: 'l4', lengthMm: 120, interiorAngleDeg: 90, turnDirection: 1, kind: 'leg' },
      { id: 'l5', lengthMm: 15, kind: 'safety_fold' }
    ]
  },
  {
    id: 'preset-ventilated-ridge',
    name: 'Architectural Ventilated Ridge Cap',
    category: 'Ridge & Hip',
    description: 'Continuous ridge cap with air baffles, perforated insect mesh clearance, and dual stiffening returns.',
    nzbcStandard: 'NZBC E2/AS1 Table 21 & MRM Code of Practice Section 8.4',
    defaultMaterial: 'vitor_055',
    legs: [
      { id: 'l1', lengthMm: 15, interiorAngleDeg: 135, turnDirection: -1, kind: 'drip' },
      { id: 'l2', lengthMm: 140, interiorAngleDeg: 150, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 140, interiorAngleDeg: 135, turnDirection: -1, kind: 'leg' },
      { id: 'l4', lengthMm: 15, kind: 'drip' }
    ]
  },
  {
    id: 'preset-valley-gutter',
    name: 'Concealed Valley Gutter with Safety Folds',
    category: 'Valley & Gutter',
    description: 'Wide architectural valley trough with 30mm vertical side risers and dual 15mm crush fold returns.',
    nzbcStandard: 'NZBC E2/AS1 Figure 11 (Valley gutter min 250mm width with 25mm freeboard)',
    defaultMaterial: 'magnaflow_075',
    legs: [
      { id: 'l1', lengthMm: 15, interiorAngleDeg: 0, turnDirection: -1, kind: 'crush_fold' },
      { id: 'l2', lengthMm: 35, interiorAngleDeg: 110, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 150, interiorAngleDeg: 140, turnDirection: 1, kind: 'leg' },
      { id: 'l4', lengthMm: 150, interiorAngleDeg: 110, turnDirection: 1, kind: 'leg' },
      { id: 'l5', lengthMm: 35, interiorAngleDeg: 0, turnDirection: -1, kind: 'crush_fold' },
      { id: 'l6', lengthMm: 15, kind: 'crush_fold' }
    ]
  },
  {
    id: 'preset-window-head',
    name: 'Architectural Window Head with 20mm Stop Ends',
    category: 'Window & Penetration',
    description: 'Window head flashing with 15° cross fall, 75mm upstand with sealant break, and 12mm drip edge.',
    nzbcStandard: 'NZBC E2/AS1 Table 20 & Figure 71 (Head flashing 15° slope)',
    defaultMaterial: 'vitor_055',
    legs: [
      { id: 'l1', lengthMm: 15, interiorAngleDeg: 180, turnDirection: 1, kind: 'safety_fold' },
      { id: 'l2', lengthMm: 75, interiorAngleDeg: 105, turnDirection: 1, kind: 'leg' },
      { id: 'l3', lengthMm: 65, interiorAngleDeg: 75, turnDirection: 1, kind: 'drip' },
      { id: 'l4', lengthMm: 12, kind: 'safety_fold' }
    ]
  }
];

// Enrich all presets with calculated girthTier and segments
ARCHITECTURAL_FLASHING_PRESETS.forEach((preset) => {
  const eng = calculateFlashingEngineering(preset.legs, preset.defaultMaterial);
  preset.girthTier = eng.girthTier;
  preset.developedBlankWidthMm = eng.developedBlankWidthMm;
  preset.segments = preset.legs.map((leg, idx) => ({
    id: `seg-${preset.id}-${idx + 1}`,
    lengthMm: leg.lengthMm,
    angleDeg: leg.interiorAngleDeg !== undefined ? leg.interiorAngleDeg : 90,
    turnDirection: leg.turnDirection || 1,
    kind: leg.kind || 'leg',
    hemGapMm: leg.hemGapMm
  }));
  preset.paintSide = 'outside';
  preset.material = preset.defaultMaterial === 'vitor_055' ? '0.55mm ColorCote Vitor+' : '0.75mm MagnaFlow';
  preset.colorName = 'FlaxPod / Ebony';
});

import { FlashingProfile, FlashingSegment } from '../types/crm';

/**
 * Converts a preset into a rich FlashingProfile with calculated engineering properties.
 */
export function presetToFlashingProfile(preset: FlashingTemplatePreset): FlashingProfile {
  const segments: FlashingSegment[] = preset.legs.map((leg, idx) => ({
    id: `seg-${preset.id}-${idx + 1}`,
    lengthMm: leg.lengthMm,
    angleDeg: leg.interiorAngleDeg !== undefined ? leg.interiorAngleDeg : 90,
    turnDirection: leg.turnDirection || 1,
    kind: leg.kind || 'leg',
    hemGapMm: leg.hemGapMm
  }));

  const eng = calculateFlashingEngineering(preset.legs, preset.defaultMaterial);

  return {
    id: preset.id,
    name: preset.name,
    category: preset.category,
    segments,
    material: preset.defaultMaterial === 'vitor_055' ? 'Kiwicolour® Vitor+ PVDF' : 'The Roofing Store MagnaFlow®',
    thicknessMm: eng.materialSpec.thicknessMm,
    insideRadiusMm: eng.materialSpec.defaultInsideRadiusMm,
    kFactor: eng.materialSpec.kFactor,
    colorName: 'FlaxPod',
    paintSide: 'outside',
    notes: `${preset.description} Standard: ${preset.nzbcStandard}`,
    isTemplate: true,
    developedLengthMm: eng.nominalSumMm,
    developedBlankWidthMm: eng.developedBlankWidthMm,
    totalBendDeductionMm: eng.totalBendDeductionMm,
    girthTier: eng.girthTier,
    recommendedSlitWidthMm: eng.recommendedSlitWidthMm,
    createdAt: '2026-10-20',
    updatedAt: '2026-10-20'
  };
}

export const DEFAULT_ARCHITECTURAL_PROFILES: FlashingProfile[] = 
  ARCHITECTURAL_FLASHING_PRESETS.map(presetToFlashingProfile);

