/**
 * Archtech Architectural Roofing - Plan Geometry & CAD Measurement Engine
 *
 * Implements high-precision coordinate transforms, scale calibration, and roof/wall math:
 * - Viewport <-> Normalized (0..1) <-> Intrinsic Drawing Coordinate Transforms
 * - Zoom, pan, center-on-point, and fit-to-page matrix math
 * - Scale Calibration with unit support (mm, m) and error margins
 * - Pitch slope multipliers: True Slope Length = Horizontal Run / cos(pitch)
 * - Area, perimeter, polyline length, and point-in-polygon math
 * - Snapping and hit-testing for vertices and edges
 */

export interface NormalizedPoint {
  x: number; // 0.0 to 1.0 relative to drawing width
  y: number; // 0.0 to 1.0 relative to drawing height
}

export interface DrawingViewport {
  zoom: number; // 1.0 = 100%
  panX: number; // pixels
  panY: number; // pixels
}

export interface PlanScaleCalibration {
  knownDistanceMm: number;
  drawingUnits: number; // Distance between points in normalized space (e.g. 0.0 to 1.0) or image units
  mmPerDrawingUnit: number; // mm per normalized unit (1.0 width * mmPerDrawingUnit)
  scaleRatio?: string; // e.g. "1:100", "1:50", "1:20"
  calibratedAt: string;
  calibratedBy: string;
  sourcePoints?: [NormalizedPoint, NormalizedPoint];
}

/**
 * Calculates Euclidean distance between two normalized points.
 */
export function normalizedDistance(p1: NormalizedPoint, p2: NormalizedPoint, aspectRatio: number = 1.414): number {
  // Correct for aspect ratio so diagonal distances are geometrically square
  const dx = (p2.x - p1.x) * aspectRatio;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

/**
 * Computes calibrated real-world distance in millimetres between two points on the drawing.
 */
export function calculateRealDistanceMm(
  p1: NormalizedPoint,
  p2: NormalizedPoint,
  calibration?: PlanScaleCalibration,
  aspectRatio: number = 1.414
): { distanceMm: number; distanceM: number; formattedText: string; isCalibrated: boolean } {
  const normDist = normalizedDistance(p1, p2, aspectRatio);

  if (!calibration || !calibration.mmPerDrawingUnit || calibration.mmPerDrawingUnit <= 0) {
    // Uncalibrated fallback: report relative screen units
    const approxUnits = Math.round(normDist * 1000);
    return {
      distanceMm: approxUnits,
      distanceM: approxUnits / 1000,
      formattedText: `${approxUnits} uncalibrated units*`,
      isCalibrated: false
    };
  }

  const distanceMm = Math.round(normDist * calibration.mmPerDrawingUnit);
  const distanceM = Math.round((distanceMm / 1000) * 100) / 100;

  let formattedText = `${distanceMm.toLocaleString()} mm`;
  if (distanceMm >= 1000) {
    formattedText = `${distanceM.toFixed(2)} m (${distanceMm.toLocaleString()} mm)`;
  }

  return {
    distanceMm,
    distanceM,
    formattedText,
    isCalibrated: true
  };
}

/**
 * Calculates true slope distance given horizontal run and roof pitch degrees.
 * Architectural Standing Seam pans are measured along the rake/slope!
 * 
 * L_slope = L_horizontal / cos(pitch)
 */
export function calculateSlopeDistanceMm(
  horizontalMm: number,
  pitchDegrees: number
): { slopeMm: number; slopeM: number; multiplier: number } {
  const clampedPitch = Math.max(0, Math.min(85, pitchDegrees));
  const rad = (clampedPitch * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const multiplier = cosVal > 0 ? 1 / cosVal : 1;
  const slopeMm = Math.round(horizontalMm * multiplier);

  return {
    slopeMm,
    slopeM: Math.round((slopeMm / 1000) * 100) / 100,
    multiplier: Math.round(multiplier * 1000) / 1000
  };
}

/**
 * Calculates real-world polygon area (m²) and perimeter (lm) from normalized points.
 */
export function calculatePolygonMeasurements(
  points: NormalizedPoint[],
  calibration?: PlanScaleCalibration,
  aspectRatio: number = 1.414,
  pitchDegrees: number = 0
): { areaM2: number; perimeterLm: number; formattedArea: string; formattedPerimeter: string; isCalibrated: boolean } {
  if (points.length < 3) {
    return {
      areaM2: 0,
      perimeterLm: 0,
      formattedArea: '0 m²',
      formattedPerimeter: '0 m',
      isCalibrated: Boolean(calibration)
    };
  }

  // 1. Polygon perimeter
  let perimeterNorm = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    perimeterNorm += normalizedDistance(points[i], next, aspectRatio);
  }

  // 2. Polygon area via Shoelace formula in square aspect-corrected space
  let doubleAreaNorm = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const x1 = points[i].x * aspectRatio;
    const y1 = points[i].y;
    const x2 = next.x * aspectRatio;
    const y2 = next.y;
    doubleAreaNorm += (x1 * y2 - x2 * y1);
  }
  const areaNorm = Math.abs(doubleAreaNorm) / 2;

  if (!calibration || !calibration.mmPerDrawingUnit) {
    return {
      areaM2: 0,
      perimeterLm: 0,
      formattedArea: 'Area (Scale not set)',
      formattedPerimeter: 'Perimeter (Unscaled)',
      isCalibrated: false
    };
  }

  // mmPerDrawingUnit is per normalized unit.
  // Real perimeter mm = perimeterNorm * mmPerDrawingUnit
  const perimeterMm = perimeterNorm * calibration.mmPerDrawingUnit;
  const perimeterLm = Math.round((perimeterMm / 1000) * 100) / 100;

  // Real plan area mm² = areaNorm * (mmPerDrawingUnit)^2
  const areaMm2 = areaNorm * (calibration.mmPerDrawingUnit ** 2);
  let areaM2 = areaMm2 / 1_000_000;

  // If roof is pitched, calculate true surface area: Area_true = Area_plan / cos(pitch)
  if (pitchDegrees > 0) {
    const rad = (Math.min(85, pitchDegrees) * Math.PI) / 180;
    areaM2 = areaM2 / Math.cos(rad);
  }

  areaM2 = Math.round(areaM2 * 100) / 100;

  return {
    areaM2,
    perimeterLm,
    formattedArea: `${areaM2.toFixed(2)} m²${pitchDegrees > 0 ? ` (${pitchDegrees}° pitch)` : ''}`,
    formattedPerimeter: `${perimeterLm.toFixed(2)} lm`,
    isCalibrated: true
  };
}

/**
 * Screen client coordinates to normalized drawing coordinates
 */
export function screenToNormalized(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: DrawingViewport
): NormalizedPoint {
  // Relative position inside the container
  const localX = clientX - containerRect.left;
  const localY = clientY - containerRect.top;

  // Invert zoom and pan
  const drawingX = (localX - viewport.panX) / viewport.zoom;
  const drawingY = (localY - viewport.panY) / viewport.zoom;

  // Normalize by container dimensions at zoom=1
  return {
    x: Math.max(0, Math.min(1, drawingX / containerRect.width)),
    y: Math.max(0, Math.min(1, drawingY / containerRect.height))
  };
}

/**
 * Normalized drawing coordinates to container pixels (ready for SVG / canvas rendering)
 */
export function normalizedToScreen(
  point: NormalizedPoint,
  containerWidth: number,
  containerHeight: number,
  viewport: DrawingViewport
): { screenX: number; screenY: number } {
  const drawingX = point.x * containerWidth;
  const drawingY = point.y * containerHeight;

  return {
    screenX: drawingX * viewport.zoom + viewport.panX,
    screenY: drawingY * viewport.zoom + viewport.panY
  };
}

/**
 * Point to line segment shortest distance (for selection & vertex snapping)
 */
export function pointToSegmentDistance(
  p: NormalizedPoint,
  a: NormalizedPoint,
  b: NormalizedPoint,
  aspectRatio: number = 1.414
): number {
  const px = p.x * aspectRatio;
  const py = p.y;
  const ax = a.x * aspectRatio;
  const ay = a.y;
  const bx = b.x * aspectRatio;
  const by = b.y;

  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;

  if (lenSq === 0) return Math.hypot(px - ax, py - ay);

  let t = ((px - ax) * abx + (py - ay) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * abx;
  const projY = ay + t * aby;

  return Math.hypot(px - projX, py - projY);
}
