/**
 * Variobend-Grade Flashing Technical Drawing Engine
 * 
 * Separates model geometry from screen presentation.
 * Provides precision vector math, intelligent collision-free dimension placement,
 * real circular angular arcs, and viewport transformations.
 */

import { FlashingSegment } from '../types/crm';

export interface Point2D {
  x: number;
  y: number;
}

export interface ProfileBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface LegDimensionAnnotation {
  segIndex: number;
  lengthMm: number;
  p1: Point2D;
  p2: Point2D;
  midpoint: Point2D;
  unitVec: Point2D;
  normalVec: Point2D;
  // Dimension line
  dimP1: Point2D;
  dimP2: Point2D;
  // Extension / witness lines
  witness1Start: Point2D;
  witness1End: Point2D;
  witness2Start: Point2D;
  witness2End: Point2D;
  // Label text anchor & orientation
  textAnchor: Point2D;
  textAngleDeg: number;
  isShortSegment: boolean;
  isExterior: boolean;
  side: 'left' | 'right';
  tick1P1: Point2D;
  tick1P2: Point2D;
  tick2P1: Point2D;
  tick2P2: Point2D;
  arrowLeaderPath?: string;
}

export interface BendAngleAnnotation {
  bendIndex: number; // 0-indexed vertex 1 to N-1
  vertex: Point2D;
  pPrev: Point2D;
  pNext: Point2D;
  interiorAngleDeg: number;
  bendAngleDeg: number;
  turnDirection: -1 | 1;
  arcPath: string;
  arcRadius: number;
  startPt: Point2D;
  endPt: Point2D;
  labelPos: Point2D;
  isAcute: boolean;
}

export interface ViewTransform {
  x: number;
  y: number;
  w: number;
  h: number;
  zoomPercent: number;
}

// -------------------------------------------------------------
// VECTOR MATH HELPERS
// -------------------------------------------------------------

export function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function normalize(v: Point2D): Point2D {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-9) return { x: 1, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Calculates distance from a point to a line segment AB.
 */
export function pointToSegmentDist(p: Point2D, a: Point2D, b: Point2D): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const l2 = ab.x * ab.x + ab.y * ab.y;
  if (l2 < 1e-9) return dist(p, a);
  let t = ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * ab.x, y: a.y + t * ab.y };
  return dist(p, proj);
}

/**
 * Checks whether two line segments (P1-P2) and (P3-P4) intersect.
 */
export function segmentsIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
  function ccw(a: Point2D, b: Point2D, c: Point2D): boolean {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  }
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

// -------------------------------------------------------------
// BOUNDING BOX & VIEWPORT CALCULATION
// -------------------------------------------------------------

export function calculateProfileBounds(points: Point2D[], paddingFraction: number = 0.15): ProfileBoundingBox {
  if (!points.length) {
    return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100, centerX: 50, centerY: 50 };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const rawW = Math.max(20, maxX - minX);
  const rawH = Math.max(20, maxY - minY);
  const padX = rawW * paddingFraction;
  const padY = rawH * paddingFraction;

  return {
    minX: minX - padX,
    maxX: maxX + padX,
    minY: minY - padY,
    maxY: maxY + padY,
    width: rawW + 2 * padX,
    height: rawH + 2 * padY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

export function fitProfileToView(
  points: Point2D[],
  viewportWidth: number,
  viewportHeight: number,
  paddingFraction: number = 0.22
): ViewTransform {
  const bounds = calculateProfileBounds(points, paddingFraction);
  const safeVpW = Math.max(240, viewportWidth);
  const safeVpH = Math.max(240, viewportHeight);

  // Compute aspect ratio fit
  const scaleX = safeVpW / bounds.width;
  const scaleY = safeVpH / bounds.height;
  const fitScale = Math.min(scaleX, scaleY);

  const viewBoxW = safeVpW / fitScale;
  const viewBoxH = safeVpH / fitScale;

  const viewBoxX = bounds.centerX - viewBoxW / 2;
  const viewBoxY = bounds.centerY - viewBoxH / 2;

  // Zoom percent is relative to nominal 1:1 model unit
  const zoomPercent = Math.round(fitScale * 100);

  return {
    x: viewBoxX,
    y: viewBoxY,
    w: viewBoxW,
    h: viewBoxH,
    zoomPercent
  };
}

export function fitSegmentToView(
  p1: Point2D,
  p2: Point2D,
  viewportWidth: number,
  viewportHeight: number
): ViewTransform {
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const len = Math.max(30, dist(p1, p2));
  const span = len * 2.8;

  const safeVpW = Math.max(240, viewportWidth);
  const safeVpH = Math.max(240, viewportHeight);
  const aspect = safeVpW / safeVpH;

  const viewBoxW = aspect >= 1 ? span * aspect : span;
  const viewBoxH = aspect >= 1 ? span : span / aspect;

  return {
    x: mid.x - viewBoxW / 2,
    y: mid.y - viewBoxH / 2,
    w: viewBoxW,
    h: viewBoxH,
    zoomPercent: Math.round((safeVpW / viewBoxW) * 100)
  };
}

// -------------------------------------------------------------
// TECHNICAL DIMENSIONING ENGINE (VARIOBEND PARALLEL WITNESS LINES)
// -------------------------------------------------------------

/**
 * Computes crisp, non-colliding dimension lines for all profile segments.
 * 
 * @param points Profile vertices in model coordinates
 * @param segments Profile segment definitions (with lengthMm, etc.)
 * @param modelUnitsPerScreenPixel Ratio of viewBox.width / canvasClientWidth
 */
export function computeLegDimensions(
  points: Point2D[],
  segments: FlashingSegment[],
  modelUnitsPerScreenPixel: number = 1.0,
  selectedSegIndex: number | null = null
): LegDimensionAnnotation[] {
  if (points.length < 2) return [];

  const annotations: LegDimensionAnnotation[] = [];
  const u = Math.max(0.001, modelUnitsPerScreenPixel);

  // Desired screen-space dimensions in pixels converted to model units:
  const baseOffsetModel = 22 * u; // 22px offset from profile leg
  const witnessOverhangModel = 3.5 * u; // 3.5px witness tick overhang
  const witnessGapModel = 3.0 * u; // 3px gap from profile outline
  const tickHalfLenModel = 4.5 * u; // 45-degree architectural slash length
  const shortSegmentThresholdModel = 42 * u; // Below 42px on screen, treat as short

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const legLen = dist(p1, p2);
    if (legLen < 1e-4) continue;

    const seg = segments[i];
    const lengthMm = seg?.lengthMm || Math.round(legLen);

    const unitVec = { x: (p2.x - p1.x) / legLen, y: (p2.y - p1.y) / legLen };
    // Left-hand normal (-y, x)
    const leftNormal = { x: -unitVec.y, y: unitVec.x };
    const rightNormal = { x: unitVec.y, y: -unitVec.x };

    const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    // Determine optimal side (left vs right) by testing clearance against all OTHER segments
    let leftClearance = Infinity;
    let rightClearance = Infinity;

    const testOffset = baseOffsetModel * 1.5;
    const testPtLeft = { x: midpoint.x + leftNormal.x * testOffset, y: midpoint.y + leftNormal.y * testOffset };
    const testPtRight = { x: midpoint.x + rightNormal.x * testOffset, y: midpoint.y + rightNormal.y * testOffset };

    for (let j = 0; j < points.length - 1; j++) {
      if (j === i || j === i - 1 || j === i + 1) continue; // Skip adjacent legs
      const q1 = points[j];
      const q2 = points[j + 1];
      const dL = pointToSegmentDist(testPtLeft, q1, q2);
      const dR = pointToSegmentDist(testPtRight, q1, q2);
      if (dL < leftClearance) leftClearance = dL;
      if (dR < rightClearance) rightClearance = dR;
    }

    // Default to leftNormal unless rightNormal has substantially better clearance
    const chosenSide: 'left' | 'right' = rightClearance > leftClearance + 5 * u ? 'right' : 'left';
    const normal = chosenSide === 'left' ? leftNormal : rightNormal;

    const offsetDist = baseOffsetModel;
    const isShort = legLen < shortSegmentThresholdModel;

    // Witness line 1 (at P1)
    const witness1Start = {
      x: p1.x + normal.x * witnessGapModel,
      y: p1.y + normal.y * witnessGapModel
    };
    const witness1End = {
      x: p1.x + normal.x * (offsetDist + witnessOverhangModel),
      y: p1.y + normal.y * (offsetDist + witnessOverhangModel)
    };

    // Witness line 2 (at P2)
    const witness2Start = {
      x: p2.x + normal.x * witnessGapModel,
      y: p2.y + normal.y * witnessGapModel
    };
    const witness2End = {
      x: p2.x + normal.x * (offsetDist + witnessOverhangModel),
      y: p2.y + normal.y * (offsetDist + witnessOverhangModel)
    };

    // Dimension line endpoints
    const dimP1 = { x: p1.x + normal.x * offsetDist, y: p1.y + normal.y * offsetDist };
    const dimP2 = { x: p2.x + normal.x * offsetDist, y: p2.y + normal.y * offsetDist };

    // Architectural 45-degree slash ticks at witness-dimension intersection
    // Slash vector is (unitVec + normal) normalized
    const slashDir = normalize({ x: unitVec.x + normal.x, y: unitVec.y + normal.y });
    const tick1P1 = { x: dimP1.x - slashDir.x * tickHalfLenModel, y: dimP1.y - slashDir.y * tickHalfLenModel };
    const tick1P2 = { x: dimP1.x + slashDir.x * tickHalfLenModel, y: dimP1.y + slashDir.y * tickHalfLenModel };

    const tick2P1 = { x: dimP2.x - slashDir.x * tickHalfLenModel, y: dimP2.y - slashDir.y * tickHalfLenModel };
    const tick2P2 = { x: dimP2.x + slashDir.x * tickHalfLenModel, y: dimP2.y + slashDir.y * tickHalfLenModel };

    // Orientation angle for text: parallel to the segment, but flipped so it is never upside down
    let angleRad = Math.atan2(unitVec.y, unitVec.x);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg > 90) angleDeg -= 180;
    else if (angleDeg < -90) angleDeg += 180;

    let textAnchor: Point2D;
    let isExterior = false;
    let arrowLeaderPath: string | undefined = undefined;

    if (!isShort) {
      // Normal leg: place text centered along the dimension line
      textAnchor = {
        x: (dimP1.x + dimP2.x) / 2,
        y: (dimP1.y + dimP2.y) / 2
      };
    } else {
      // Short segment (e.g. 12mm hem, 15mm drip, 20mm return):
      // Place label just outside P2 along the extension of the dimension line to avoid crowding
      isExterior = true;
      const exteriorOffset = 18 * u;
      textAnchor = {
        x: dimP2.x + unitVec.x * exteriorOffset,
        y: dimP2.y + unitVec.y * exteriorOffset
      };
      // Leader line connecting dimension line to exterior text
      arrowLeaderPath = `M ${dimP2.x} ${dimP2.y} L ${textAnchor.x} ${textAnchor.y}`;
    }

    annotations.push({
      segIndex: i,
      lengthMm,
      p1,
      p2,
      midpoint,
      unitVec,
      normalVec: normal,
      dimP1,
      dimP2,
      witness1Start,
      witness1End,
      witness2Start,
      witness2End,
      textAnchor,
      textAngleDeg: angleDeg,
      isShortSegment: isShort,
      isExterior,
      side: chosenSide,
      tick1P1,
      tick1P2,
      tick2P1,
      tick2P2,
      arrowLeaderPath
    });
  }

  return annotations;
}

// -------------------------------------------------------------
// TECHNICAL ANGULAR DIMENSIONING (VARIOBEND REAL BEND ARCS)
// -------------------------------------------------------------

/**
 * Computes precision circular angular arcs centered on bend vertices.
 * Follows professional sheet-metal CAD conventions:
 * Displays the fold/bend angle along a genuine circular arc inside the acute/interior corner.
 */
export function computeBendAngleAnnotations(
  points: Point2D[],
  segments: FlashingSegment[],
  modelUnitsPerScreenPixel: number = 1.0
): BendAngleAnnotation[] {
  if (points.length < 3) return [];

  const annotations: BendAngleAnnotation[] = [];
  const u = Math.max(0.001, modelUnitsPerScreenPixel);
  const arcRadiusModel = 18 * u; // 18px arc radius in screen space

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const vertex = points[i];
    const pNext = points[i + 1];

    // Rays from vertex to adjacent points
    const v1 = { x: pPrev.x - vertex.x, y: pPrev.y - vertex.y };
    const v2 = { x: pNext.x - vertex.x, y: pNext.y - vertex.y };

    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 1e-4 || l2 < 1e-4) continue;

    const u1 = { x: v1.x / l1, y: v1.y / l1 };
    const u2 = { x: v2.x / l2, y: v2.y / l2 };

    // Interior corner angle in degrees
    const dotVal = Math.max(-1, Math.min(1, dot(u1, u2)));
    const interiorAngleRad = Math.acos(dotVal);
    const interiorAngleDeg = Math.round((interiorAngleRad * 180) / Math.PI);

    // Turn / bend angle (how much the brake press bends the sheet from flat: 180 - interior)
    const seg = segments[i - 1];
    const storedInterior = seg?.angleDeg !== undefined ? seg.angleDeg : interiorAngleDeg;
    const bendAngleDeg = Math.abs(180 - storedInterior);

    // Turn direction: cross product of (vertex - pPrev) and (pNext - vertex)
    const inVec = { x: vertex.x - pPrev.x, y: vertex.y - pPrev.y };
    const outVec = { x: pNext.x - vertex.x, y: pNext.y - vertex.y };
    const cp = cross(inVec, outVec);
    const turnDirection: -1 | 1 = cp < 0 ? -1 : 1;

    // Clamp arc radius so it does not exceed 35% of the shorter adjacent leg
    const maxAllowedRadius = Math.min(l1, l2) * 0.42;
    const effectiveRadius = Math.max(8 * u, Math.min(arcRadiusModel, maxAllowedRadius));

    // Start point on ray 1 and end point on ray 2
    const startPt = { x: vertex.x + u1.x * effectiveRadius, y: vertex.y + u1.y * effectiveRadius };
    const endPt = { x: vertex.x + u2.x * effectiveRadius, y: vertex.y + u2.y * effectiveRadius };

    // Angle bisector for placing the label inside the corner
    const bisectorRaw = { x: u1.x + u2.x, y: u1.y + u2.y };
    const bisector = normalize(bisectorRaw);

    // Determine sweep flag for SVG Arc
    // In SVG screen coordinates (y positive down), we sweep from startPt to endPt
    // The cross product cross(u1, u2) tells us the angular sweep direction
    const sweepCp = cross(u1, u2);
    const sweepFlag = sweepCp > 0 ? 1 : 0;
    const isLargeArc = interiorAngleDeg > 180 ? 1 : 0;

    const arcPath = `M ${startPt.x} ${startPt.y} A ${effectiveRadius} ${effectiveRadius} 0 ${isLargeArc} ${sweepFlag} ${endPt.x} ${endPt.y}`;

    // Label position: placed along bisector just outside the arc
    const labelDistance = effectiveRadius + 11 * u;
    const labelPos = {
      x: vertex.x + bisector.x * labelDistance,
      y: vertex.y + bisector.y * labelDistance
    };

    annotations.push({
      bendIndex: i - 1,
      vertex,
      pPrev,
      pNext,
      interiorAngleDeg: storedInterior,
      bendAngleDeg,
      turnDirection,
      arcPath,
      arcRadius: effectiveRadius,
      startPt,
      endPt,
      labelPos,
      isAcute: storedInterior < 90
    });
  }

  return annotations;
}
