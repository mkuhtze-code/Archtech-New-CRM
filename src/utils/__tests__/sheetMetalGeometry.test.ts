/**
 * Engineering Unit Test Suite: Sheet Metal Geometry, Calibration & Slope Calculations
 */

import { 
  calculateBendParameters, 
  calculateFlashingEngineering, 
  classifyGirthTier, 
  STANDARD_SHEET_MATERIALS 
} from '../sheetMetalGeometry';
import { 
  calculateRealDistanceMm, 
  calculateSlopeDistanceMm, 
  calculatePolygonMeasurements,
  PlanScaleCalibration,
  NormalizedPoint 
} from '../planGeometry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number = 0.1, message: string = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`TEST FAILED: ${message} - Expected ~${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`);
  }
}

console.log('--- Starting Sheet Metal & Geometry Test Suite ---');

// 1. Test 90-degree bend calculation on 0.55mm Vitor+ steel
const vitor = STANDARD_SHEET_MATERIALS['vitor_055'];
const bend90 = calculateBendParameters(90, vitor.thicknessMm, vitor.defaultInsideRadiusMm, vitor.kFactor);

console.log('Test 1: 90° bend on 0.55mm Vitor+ steel:');
console.log(' - Bend Angle:', bend90.bendAngleDeg, 'deg');
console.log(' - Bend Allowance (BA):', bend90.bendAllowanceMm, 'mm');
console.log(' - Outside Setback (OSSB):', bend90.setbackMm, 'mm');
console.log(' - Bend Deduction (BD):', bend90.bendDeductionMm, 'mm');

assert(bend90.bendAngleDeg === 90, 'Bend angle should be 90° for 90° interior');
assertApprox(bend90.bendAllowanceMm, 1.58, 0.05, 'Bend allowance for 90° on 0.55mm');
assertApprox(bend90.bendDeductionMm, 1.12, 0.05, 'Bend deduction for 90° on 0.55mm');

// 2. Test Flashing Engineering on an E2/AS1 Apron Flashing (Legs: 20mm hem, 150mm upstand, 120mm cover, 15mm drip)
const apronLegs = [
  { id: '1', lengthMm: 20, interiorAngleDeg: 135, turnDirection: -1 as const },
  { id: '2', lengthMm: 150, interiorAngleDeg: 90, turnDirection: 1 as const },
  { id: '3', lengthMm: 120, interiorAngleDeg: 135, turnDirection: 1 as const },
  { id: '4', lengthMm: 15 }
];

const apronEng = calculateFlashingEngineering(apronLegs, 'vitor_055', 3.0, 5);

console.log('\nTest 2: Apron Flashing Engineering:');
console.log(' - Nominal Leg Sum:', apronEng.nominalSumMm, 'mm');
console.log(' - Developed Blank Width:', apronEng.developedBlankWidthMm, 'mm');
console.log(' - Total Bend Deduction:', apronEng.totalBendDeductionMm, 'mm');
console.log(' - Girth Tier:', apronEng.girthTier);
console.log(' - Recommended Slit Width:', apronEng.recommendedSlitWidthMm, 'mm');
console.log(' - Total Linear Metres:', apronEng.totalLinearMetres, 'lm');
console.log(' - Total Weight:', apronEng.totalWeightKg, 'kg');

assert(apronEng.nominalSumMm === 305, 'Nominal sum should be 20+150+120+15 = 305mm');
assert(apronEng.developedBlankWidthMm < 305, 'Developed blank width must be less than nominal sum due to bend deduction');
assert(apronEng.developedBlankWidthMm > 300, 'Developed blank width should be ~302mm');
assert(apronEng.girthTier === '301-450mm', 'Girth tier for ~302mm should be 301-450mm');
assert(apronEng.recommendedSlitWidthMm === 350, 'Recommended slit width should be 350mm');
assert(apronEng.totalLinearMetres === 15.0, '5 pieces of 3.0m = 15.0 lm');

// 3. Test Girth Tier Classifications
assert(classifyGirthTier(140) === '0-150mm', '140mm is 0-150mm');
assert(classifyGirthTier(280) === '151-300mm', '280mm is 151-300mm');
assert(classifyGirthTier(420) === '301-450mm', '420mm is 301-450mm');
assert(classifyGirthTier(580) === '451-600mm', '580mm is 451-600mm');
assert(classifyGirthTier(750) === '601-900mm', '750mm is 601-900mm');
assert(classifyGirthTier(1050) === '901-1200mm', '1050mm is 901-1200mm');

// 4. Test Roof Pitch Slope Multiplier
// At 45 degrees, slope = run * sqrt(2) ~ 1.414 * run
const slope45 = calculateSlopeDistanceMm(10000, 45);
console.log('\nTest 4: Slope calculation at 45°:');
console.log(' - Horizontal 10,000mm at 45° -> Slope:', slope45.slopeMm, 'mm (multiplier:', slope45.multiplier, ')');
assertApprox(slope45.slopeMm, 14142, 5, '10,000mm at 45° should be ~14,142mm');

// At 15 degrees, slope = run / cos(15°) ~ 1.0353 * run
const slope15 = calculateSlopeDistanceMm(10000, 15);
assertApprox(slope15.slopeMm, 10353, 5, '10,000mm at 15° should be ~10,353mm');

// 5. Test Scale Calibration & Distance Measurement
const sampleCalibration: PlanScaleCalibration = {
  knownDistanceMm: 6000,
  drawingUnits: 0.25, // 0.25 normalized width = 6000mm
  mmPerDrawingUnit: 24000, // 1.0 normalized width = 24,000mm (24m building)
  scaleRatio: '1:100',
  calibratedAt: new Date().toISOString(),
  calibratedBy: 'Marcus Kuhtze'
};

const p1: NormalizedPoint = { x: 0.1, y: 0.2 };
const p2: NormalizedPoint = { x: 0.6, y: 0.2 }; // Delta x = 0.5, delta y = 0
// Distance in aspect-corrected space (aspect 1.0 for simplicity in test):
const distResult = calculateRealDistanceMm(p1, p2, sampleCalibration, 1.0);
console.log('\nTest 5: Calibrated distance measurement:');
console.log(' - Delta 0.5 normalized at 24,000mm per unit -> Distance:', distResult.distanceMm, 'mm (', distResult.distanceM, 'm)');
assert(distResult.distanceMm === 12000, '0.5 of 24,000mm should be 12,000mm (12m)');
assert(distResult.distanceM === 12, '12m');

// 6. Test Polygon Area & Perimeter with Calibrated Dimensions
// A 10m x 15m rectangle in normalized units
const rectPoints: NormalizedPoint[] = [
  { x: 0.0, y: 0.0 },
  { x: 0.5, y: 0.0 }, // 12m wide
  { x: 0.5, y: 0.25 }, // 6m high
  { x: 0.0, y: 0.25 }
];
const polyResult = calculatePolygonMeasurements(rectPoints, sampleCalibration, 1.0, 0);
console.log('\nTest 6: Calibrated polygon area & perimeter:');
console.log(' - 12m x 6m Rectangle -> Area:', polyResult.areaM2, 'm², Perimeter:', polyResult.perimeterLm, 'lm');
assertApprox(polyResult.areaM2, 72.0, 0.1, '12m x 6m = 72m²');
assertApprox(polyResult.perimeterLm, 36.0, 0.1, '2 * (12 + 6) = 36 lm');

// With 15° pitch: Area_slope = 72 / cos(15°) = 74.54 m²
const polyPitched = calculatePolygonMeasurements(rectPoints, sampleCalibration, 1.0, 15);
console.log(' - Same rectangle with 15° pitch -> Slope Area:', polyPitched.areaM2, 'm²');
assertApprox(polyPitched.areaM2, 74.54, 0.1, '72 / cos(15°) ~ 74.54m²');

console.log('\nALL 6 TEST SUITES PASSED DETERMINISTICALLY! ✓');
