import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlashingProfile3D } from './FlashingProfile3D';
import {
  Project,
  FlashingProfile,
  FlashingSegment,
  PaintSide
} from '../types/crm';
import {
  X,
  Plus,
  Trash2,
  Undo2,
  Check,
  ChevronLeft,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sliders,
  ChevronRight,
  FlipHorizontal,
  Compass,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ARCHITECTURAL_FLASHING_PRESETS,
  calculateDevelopedBlankWidth,
  classifyGirthTier,
  calculateFlashingEngineering
} from '../utils/sheetMetalGeometry';
import {
  Point2D,
  computeLegDimensions,
  computeBendAngleAnnotations,
  calculateProfileBounds,
  fitProfileToView,
  fitSegmentToView,
  dist,
  normalize
} from '../utils/flashingDrawingEngine';

interface Props {
  project: Project;
  activeMemberName?: string;
  onUpdateProject: (project: Project) => void;
  onClose: () => void;
  initialProfileId?: string | null;
  onSaveToLibrary?: (profile: FlashingProfile) => 'saved' | 'duplicate' | 'storage-error';
}

type Mode = 'draw' | 'edit';
type ViewMode = 'profile' | '3d';

const SEGMENT_KINDS: { value: FlashingSegment['kind']; label: string; defaultMm: number }[] = [
  { value: 'leg', label: 'Standard Leg', defaultMm: 100 },
  { value: 'open_hem', label: 'Open Hem (Cleat/Hook)', defaultMm: 12 },
  { value: 'closed_hem', label: 'Closed Hem', defaultMm: 12 },
  { value: 'crush_fold', label: 'Crush Fold / Safety', defaultMm: 6 },
  { value: 'drip', label: 'Drip Edge / Kick', defaultMm: 20 },
  { value: 'return', label: 'Return Upstand', defaultMm: 15 },
  { value: 'safety_fold', label: 'Safety Edge', defaultMm: 15 }
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function angleBetween(a: Point2D, b: Point2D, c: Point2D): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;
  let ang = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
  return Math.round(Math.abs(ang));
}

function pointsToSegments(points: Point2D[], pxPerMm: number = 1.0): FlashingSegment[] {
  if (points.length < 2) return [];
  const segs: FlashingSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const lengthMm = Math.max(1, Math.round(dist(points[i], points[i + 1]) / pxPerMm));
    let angleDeg = 90;
    let turnDirection: -1 | 1 = 1;

    if (i < points.length - 2) {
      const a = points[i];
      const b = points[i + 1];
      const c = points[i + 2];
      angleDeg = angleBetween(a, b, c);
      const headingIn = Math.atan2(-(b.y - a.y), b.x - a.x);
      const headingOut = Math.atan2(-(c.y - b.y), c.x - b.x);
      let delta = ((headingOut - headingIn) * 180) / Math.PI;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      turnDirection = delta < 0 ? -1 : 1;
    }

    segs.push({
      id: uid('seg'),
      lengthMm,
      angleDeg,
      turnDirection,
      kind: 'leg'
    });
  }
  return segs;
}

function segmentsToPoints(
  segments: FlashingSegment[],
  origin: Point2D = { x: 50, y: 150 },
  pxPerMm: number = 1.0,
  startHeadingDeg: number = 0
): Point2D[] {
  const pts: Point2D[] = [{ ...origin }];
  let x = origin.x;
  let y = origin.y;
  let heading = startHeadingDeg;

  segments.forEach((seg, i) => {
    const len = Math.max(1, seg.lengthMm) * pxPerMm;
    const rad = (heading * Math.PI) / 180;
    x = x + Math.cos(rad) * len;
    y = y - Math.sin(rad) * len;
    pts.push({ x, y });

    if (i < segments.length - 1) {
      const interior = seg.angleDeg !== undefined ? seg.angleDeg : 90;
      const turn = 180 - interior;
      heading = heading + turn * (seg.turnDirection === -1 ? -1 : 1);
    }
  });

  return pts;
}

function pointsToGeometryMm(points: Point2D[], pxPerMm: number = 1.0): { x: number; y: number }[] {
  if (!points.length) return [];
  const origin = points[0];
  return points.map((p) => ({
    x: (p.x - origin.x) / pxPerMm,
    y: -(p.y - origin.y) / pxPerMm
  }));
}

function geometryMmToPoints(
  geometry: { x: number; y: number }[],
  origin: Point2D = { x: 50, y: 150 },
  pxPerMm: number = 1.0
): Point2D[] {
  return geometry.map((p) => ({
    x: origin.x + p.x * pxPerMm,
    y: origin.y - p.y * pxPerMm
  }));
}

export const FlashingDesigner: React.FC<Props> = ({
  project,
  activeMemberName = 'Lead Detailer',
  onUpdateProject,
  onClose,
  initialProfileId = null,
  onSaveToLibrary
}) => {
  const anyProj = project as Project & { flashingProfiles?: FlashingProfile[] };
  const profiles = anyProj.flashingProfiles || [];

  const [selectedId, setSelectedId] = useState<string | null>(initialProfileId);
  const selected = profiles.find((p) => p.id === selectedId) || null;

  const [mode, setMode] = useState<Mode>(initialProfileId ? 'edit' : 'draw');
  const [viewMode, setViewMode] = useState<ViewMode>('profile');
  const [profileName, setProfileName] = useState(selected?.name || '');
  const [points, setPoints] = useState<Point2D[]>([]);
  const [cursor, setCursor] = useState<Point2D | null>(null);

  // Active selection
  const [selectedSegIndex, setSelectedSegIndex] = useState<number | null>(null);
  const [selectedBendIndex, setSelectedBendIndex] = useState<number | null>(null);

  // Inspector panel visibility
  const [showInspector, setShowInspector] = useState(true);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Drawing constraints
  const [snapAngles, setSnapAngles] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [paintSide, setPaintSide] = useState<PaintSide>(
    selected?.paintSide === 'inside' ? 'inside' : 'outside'
  );

  // Viewport & Zoom (Variobend separation of model vs screen)
  const [viewBox, setViewBox] = useState({ x: -50, y: -50, w: 500, h: 400 });
  const [zoomPercent, setZoomPercent] = useState(100);

  // 3D View rotation & zoom
  const [rotation, setRotation] = useState({ yaw: -0.55, pitch: 0.45 });
  const [zoom3d, setZoom3d] = useState(1);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction pointers & pinch
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef<{
    distance: number;
    midpoint: Point2D;
    viewBox: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const draggedVertex = useRef<number | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; viewBoxX: number; viewBoxY: number } | null>(null);
  const pendingDrawTap = useRef<{ pointerId: number; point: Point2D } | null>(null);

  const toast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2800);
  };

  const persistProfiles = (next: FlashingProfile[]) => {
    onUpdateProject({ ...project, flashingProfiles: next } as Project);
  };

  // Model-to-screen scale factor (model units per screen pixel)
  const modelUnitsPerScreenPixel = useMemo(() => {
    const clientW = svgRef.current?.clientWidth || 600;
    return viewBox.w / Math.max(1, clientW);
  }, [viewBox.w]);

  // Convert client viewport coordinates to SVG model coordinates
  const clientToSvg = useCallback(
    (clientX: number, clientY: number): Point2D | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const sp = pt.matrixTransform(ctm.inverse());
      return { x: sp.x, y: sp.y };
    },
    []
  );

  // Adaptive technical grid step in model coordinates
  const gridStep = useMemo(() => {
    const targetMm = modelUnitsPerScreenPixel * 28;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, targetMm))));
    const normalized = targetMm / magnitude;
    const niceMm = (normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10) * magnitude;
    return Math.max(5, niceMm);
  }, [modelUnitsPerScreenPixel]);

  const snapPoint = (p: Point2D): Point2D => {
    if (!snapToGrid) return p;
    return {
      x: Math.round(p.x / gridStep) * gridStep,
      y: Math.round(p.y / gridStep) * gridStep
    };
  };

  // Load selected profile into model points
  useEffect(() => {
    if (!selected) {
      if (profiles.length > 0 && !selectedId) {
        setSelectedId(profiles[0].id);
      }
      return;
    }
    setProfileName(selected.name);
    setPaintSide(selected.paintSide === 'inside' ? 'inside' : 'outside');
    setSelectedSegIndex(0);
    setSelectedBendIndex(null);

    const origin = { x: 50, y: 150 };
    const pts = selected.geometryPointsMm?.length === selected.segments.length + 1
      ? geometryMmToPoints(selected.geometryPointsMm, origin, 1.0)
      : segmentsToPoints(selected.segments, origin, 1.0, selected.startHeadingDeg ?? 0);
    setPoints(pts);

    // Auto-fit profile to canvas on selection
    if (pts.length >= 2) {
      setTimeout(() => {
        handleFitToProfile(pts);
      }, 50);
    }
  }, [selectedId]);

  // Fit Entire Profile to Canvas (Variobend Core UX)
  const handleFitToProfile = (pts: Point2D[] = points) => {
    if (pts.length < 2 || !svgRef.current) return;
    const clientW = svgRef.current.clientWidth || window.innerWidth;
    const clientH = svgRef.current.clientHeight || window.innerHeight;
    const fit = fitProfileToView(pts, clientW, clientH, 0.24);
    setViewBox({ x: fit.x, y: fit.y, w: fit.w, h: fit.h });
    setZoomPercent(fit.zoomPercent);
  };

  // Fit Selected Segment or Bend
  const handleFitSelected = () => {
    if (selectedSegIndex === null || points.length < 2 || !svgRef.current) {
      handleFitToProfile();
      return;
    }
    const p1 = points[selectedSegIndex];
    const p2 = points[selectedSegIndex + 1];
    if (!p1 || !p2) return;
    const clientW = svgRef.current.clientWidth || window.innerWidth;
    const clientH = svgRef.current.clientHeight || window.innerHeight;
    const fit = fitSegmentToView(p1, p2, clientW, clientH);
    setViewBox({ x: fit.x, y: fit.y, w: fit.w, h: fit.h });
    setZoomPercent(fit.zoomPercent);
    toast(`Focused on Edge ${selectedSegIndex + 1}`);
  };

  // Reset 1:1 Default View
  const handleResetView = () => {
    if (points.length >= 2) {
      handleFitToProfile();
    } else {
      setViewBox({ x: -50, y: -50, w: 500, h: 400 });
      setZoomPercent(100);
    }
  };

  // Zoom In / Out by factor centered on viewport
  const handleZoom = (factor: number) => {
    setViewBox((v) => {
      const newW = Math.max(60, Math.min(6000, v.w * factor));
      const newH = Math.max(60, Math.min(6000, v.h * factor));
      const midX = v.x + v.w / 2;
      const midY = v.y + v.h / 2;
      const newX = midX - newW / 2;
      const newY = midY - newH / 2;
      setZoomPercent(Math.round((500 / newW) * 100));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  // Commit points into FlashingProfile segments
  const commitPointsAsProfile = (pts: Point2D[]) => {
    if (pts.length < 2) return;
    const segs = pointsToSegments(pts, 1.0).map((segment, index) => ({
      ...segment,
      id: selected?.segments[index]?.id || segment.id,
      kind: selected?.segments[index]?.kind || segment.kind
    }));

    if (selected) {
      const next = profiles.map((p) =>
        p.id === selected.id
          ? {
              ...p,
              name: profileName || p.name,
              segments: segs,
              geometryPointsMm: pointsToGeometryMm(pts, 1.0),
              startHeadingDeg:
                pts.length >= 2
                  ? (Math.atan2(-(pts[1].y - pts[0].y), pts[1].x - pts[0].x) * 180) / Math.PI
                  : (p.startHeadingDeg ?? 0),
              paintSide,
              developedLengthMm: calculateDevelopedBlankWidth(segs, 0.55),
              updatedAt: new Date().toISOString()
            }
          : p
      );
      persistProfiles(next);
      toast('Profile updated');
    } else {
      const blank = calculateDevelopedBlankWidth(segs, 0.55);
      const tier = classifyGirthTier(blank);
      const profile: FlashingProfile = {
        id: uid('fp'),
        name: profileName || `Profile ${profiles.length + 1}`,
        segments: segs,
        geometryPointsMm: pointsToGeometryMm(pts, 1.0),
        startHeadingDeg:
          pts.length >= 2
            ? (Math.atan2(-(pts[1].y - pts[0].y), pts[1].x - pts[0].x) * 180) / Math.PI
            : 0,
        material: project.material || '0.55mm ColorCote Vitor+',
        colorName: project.colorName || 'FlaxPod',
        thicknessMm: 0.55,
        paintSide,
        developedLengthMm: blank,
        developedBlankWidthMm: blank,
        girthTier: tier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistProfiles([profile, ...profiles]);
      setSelectedId(profile.id);
      toast('Profile saved');
    }
  };

  // Update a single segment's length, angle or kind with instant geometry regeneration
  const updateSegmentAt = (index: number, patch: Partial<FlashingSegment>) => {
    if (!selected || index < 0 || index >= selected.segments.length) return;
    const safePatch = { ...patch };
    if (typeof safePatch.lengthMm === 'number') {
      safePatch.lengthMm = Math.max(1, Math.min(10000, safePatch.lengthMm));
    }
    if (typeof safePatch.angleDeg === 'number') {
      safePatch.angleDeg = Math.max(1, Math.min(179, safePatch.angleDeg));
    }

    const segs = selected.segments.map((s, i) => (i === index ? { ...s, ...safePatch } : s));
    const origin = points[0] || { x: 50, y: 150 };
    const startHeadingDeg =
      points.length >= 2
        ? (Math.atan2(-(points[1].y - points[0].y), points[1].x - points[0].x) * 180) / Math.PI
        : (selected.startHeadingDeg ?? 0);

    const newPts = segmentsToPoints(segs, origin, 1.0, startHeadingDeg);
    setPoints(newPts);

    const blank = calculateDevelopedBlankWidth(segs, selected.thicknessMm || 0.55);
    const tier = classifyGirthTier(blank);

    const next = profiles.map((p) =>
      p.id === selected.id
        ? {
            ...p,
            segments: segs,
            geometryPointsMm: pointsToGeometryMm(newPts, 1.0),
            startHeadingDeg,
            developedLengthMm: blank,
            developedBlankWidthMm: blank,
            girthTier: tier,
            paintSide,
            updatedAt: new Date().toISOString()
          }
        : p
    );
    persistProfiles(next);
  };

  // Load an architectural preset
  const handleLoadPreset = (preset: typeof ARCHITECTURAL_FLASHING_PRESETS[0]) => {
    const newId = uid('prof');
    const segs = (preset.segments || []).map((s) => ({ ...s, id: uid('seg') }));
    const blankMm = calculateDevelopedBlankWidth(segs, 0.55);
    const tier = classifyGirthTier(blankMm);
    const side: PaintSide = preset.paintSide === 'inside' ? 'inside' : 'outside';

    const newProf: FlashingProfile = {
      id: newId,
      name: preset.name,
      segments: segs,
      developedLengthMm: blankMm,
      developedBlankWidthMm: blankMm,
      girthTier: tier,
      paintSide: side,
      category: preset.category,
      material: preset.material || '0.55mm ColorCote Vitor+',
      colorName: preset.colorName || 'Ebony / FlaxPod',
      insideRadiusMm: preset.insideRadiusMm,
      kFactor: preset.kFactor,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    persistProfiles([newProf, ...profiles]);
    setSelectedId(newId);
    setProfileName(preset.name);
    setPaintSide(side);

    const pts = segmentsToPoints(segs, { x: 50, y: 150 }, 1.0, 0);
    setPoints(pts);
    setMode('edit');
    setSelectedSegIndex(0);
    setSelectedBendIndex(null);
    setShowPresetsModal(false);
    toast(`Loaded ${preset.name} (${tier})`);

    setTimeout(() => {
      handleFitToProfile(pts);
    }, 50);
  };

  // Flip Profile horizontally (Variobend mirror tool)
  const flipProfile = () => {
    if (!selected || points.length < 2) return;
    const xs = points.map((p) => p.x);
    const centreX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const flippedPoints = points.map((p) => ({ x: 2 * centreX - p.x, y: p.y }));
    setPoints(flippedPoints);
    commitPointsAsProfile(flippedPoints);
    toast('Profile mirrored horizontally');
  };

  // Delete last edge
  const deleteLastEdge = () => {
    if (mode === 'draw') {
      setPoints((prev) => prev.slice(0, -1));
      return;
    }
    if (!selected || selected.segments.length <= 1) {
      toast('Cannot delete the only edge');
      return;
    }
    const nextSegments = selected.segments.slice(0, -1);
    const origin = points[0] || { x: 50, y: 150 };
    const nextPoints = segmentsToPoints(nextSegments, origin, 1.0, selected.startHeadingDeg ?? 0);
    setPoints(nextPoints);

    const blank = calculateDevelopedBlankWidth(nextSegments, 0.55);
    const updated: FlashingProfile = {
      ...selected,
      segments: nextSegments,
      geometryPointsMm: pointsToGeometryMm(nextPoints, 1.0),
      developedLengthMm: blank,
      developedBlankWidthMm: blank,
      girthTier: classifyGirthTier(blank),
      updatedAt: new Date().toISOString()
    };
    persistProfiles(profiles.map((p) => (p.id === selected.id ? updated : p)));
    setSelectedSegIndex(Math.max(0, nextSegments.length - 1));
    toast('Last edge removed');
  };

  // Canvas pointer event handlers (draw, drag vertices, pan, pinch)
  const handlePointerDown = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (svg) {
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch zoom gesture
    if (activePointers.current.size >= 2) {
      pendingDrawTap.current = null;
      isPanning.current = false;
      const pair = Array.from(activePointers.current.values()).slice(0, 2);
      gestureStart.current = {
        distance: Math.max(1, dist(pair[0], pair[1])),
        midpoint: { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 },
        viewBox: { ...viewBox }
      };
      return;
    }

    const p = clientToSvg(e.clientX, e.clientY);
    if (!p) return;

    // Check if middle-click or spacebar active for panning
    if (e.button === 1 || e.buttons === 4) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, viewBoxX: viewBox.x, viewBoxY: viewBox.y };
      return;
    }

    if (mode === 'draw') {
      pendingDrawTap.current = { pointerId: e.pointerId, point: snapPoint(p) };
      return;
    }

    if (mode === 'edit') {
      const hitR = 14 * modelUnitsPerScreenPixel;
      // 1. Check click on vertices to select bend or drag vertex
      for (let i = 0; i < points.length; i++) {
        if (dist(points[i], p) < hitR) {
          draggedVertex.current = i;
          if (i > 0 && i < points.length) {
            setSelectedBendIndex(i - 1);
            setSelectedSegIndex(i - 1);
          } else {
            setSelectedSegIndex(0);
          }
          return;
        }
      }

      // 2. Check click near segments
      for (let i = 0; i < points.length - 1; i++) {
        const d = dist({ x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 }, p);
        if (d < hitR + 8 * modelUnitsPerScreenPixel) {
          setSelectedSegIndex(i);
          setSelectedBendIndex(null);
          return;
        }
      }

      // Otherwise pan the canvas
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, viewBoxX: viewBox.x, viewBoxY: viewBox.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch to zoom
    const svg = svgRef.current;
    const gesture = gestureStart.current;
    if (svg && gesture && activePointers.current.size >= 2) {
      const pair = Array.from(activePointers.current.values()).slice(0, 2);
      const currentDistance = Math.max(1, dist(pair[0], pair[1]));
      const midpoint = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
      const rect = svg.getBoundingClientRect();
      const scale = gesture.distance / currentDistance;
      const w = Math.max(50, Math.min(8000, gesture.viewBox.w * scale));
      const h = Math.max(50, Math.min(8000, gesture.viewBox.h * scale));
      const nx = (gesture.midpoint.x - rect.left) / Math.max(1, rect.width);
      const ny = (gesture.midpoint.y - rect.top) / Math.max(1, rect.height);
      const anchorX = gesture.viewBox.x + nx * gesture.viewBox.w;
      const anchorY = gesture.viewBox.y + ny * gesture.viewBox.h;
      const dx = ((midpoint.x - gesture.midpoint.x) * gesture.viewBox.w) / Math.max(1, rect.width);
      const dy = ((midpoint.y - gesture.midpoint.y) * gesture.viewBox.h) / Math.max(1, rect.height);
      setViewBox({ x: anchorX - nx * w - dx, y: anchorY - ny * h - dy, w, h });
      setZoomPercent(Math.round((500 / w) * 100));
      return;
    }

    // Single-finger / pointer pan
    if (isPanning.current && panStart.current && svg) {
      const rect = svg.getBoundingClientRect();
      const dxPx = e.clientX - panStart.current.x;
      const dyPx = e.clientY - panStart.current.y;
      const dxModel = (dxPx / rect.width) * viewBox.w;
      const dyModel = (dyPx / rect.height) * viewBox.h;
      setViewBox((v) => ({
        ...v,
        x: panStart.current!.viewBoxX - dxModel,
        y: panStart.current!.viewBoxY - dyModel
      }));
      return;
    }

    const p = clientToSvg(e.clientX, e.clientY);
    if (!p) return;

    if (mode === 'edit' && draggedVertex.current !== null) {
      const vIndex = draggedVertex.current;
      const nextPt = snapPoint(p);
      setPoints((prev) => prev.map((pt, idx) => (idx === vIndex ? nextPt : pt)));
      return;
    }

    setCursor(p);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) gestureStart.current = null;
    isPanning.current = false;
    panStart.current = null;

    if (draggedVertex.current !== null) {
      draggedVertex.current = null;
      if (points.length >= 2) commitPointsAsProfile(points);
    }

    const pending = pendingDrawTap.current;
    if (pending && pending.pointerId === e.pointerId && mode === 'draw') {
      pendingDrawTap.current = null;
      let nextPt = pending.point;

      // 45-degree angle snapping relative to previous point
      if (snapAngles && points.length > 0) {
        const prev = points[points.length - 1];
        const rad = Math.atan2(-(nextPt.y - prev.y), nextPt.x - prev.x);
        let deg = (rad * 180) / Math.PI;
        const nearest45 = Math.round(deg / 45) * 45;
        const delta = Math.abs((((deg - nearest45) % 360) + 540) % 360 - 180);
        if (delta <= 8) {
          const l = dist(prev, nextPt);
          const snapRad = (nearest45 * Math.PI) / 180;
          nextPt = { x: prev.x + Math.cos(snapRad) * l, y: prev.y - Math.sin(snapRad) * l };
        }
      }

      setPoints((prev) => [...prev, nextPt]);
      setSelectedSegIndex(points.length > 0 ? points.length - 1 : 0);
    }
  };

  // Wheel zoom centered on pointer
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (viewMode === '3d') {
      setZoom3d((z) => Math.max(0.4, Math.min(3.5, z * (e.deltaY < 0 ? 1.12 : 0.89))));
      return;
    }
    const p = clientToSvg(e.clientX, e.clientY);
    if (!p) return;
    const factor = e.deltaY < 0 ? 0.88 : 1.14;
    setViewBox((v) => {
      const newW = Math.max(40, Math.min(8000, v.w * factor));
      const newH = Math.max(40, Math.min(8000, v.h * factor));
      const rx = (p.x - v.x) / v.w;
      const ry = (p.y - v.y) / v.h;
      setZoomPercent(Math.round((500 / newW) * 100));
      return {
        x: p.x - rx * newW,
        y: p.y - ry * newH,
        w: newW,
        h: newH
      };
    });
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'f' || e.key === 'F') {
        handleFitToProfile();
      } else if (e.key === 'Escape') {
        setSelectedSegIndex(null);
        setSelectedBendIndex(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteLastEdge();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (selected && selected.segments.length > 0) {
          setSelectedSegIndex((prev) =>
            prev === null ? 0 : (prev + (e.shiftKey ? -1 : 1) + selected.segments.length) % selected.segments.length
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [points, selected, selectedSegIndex]);

  // Derived engineering calculations
  const segments = useMemo(() => {
    return selected?.segments || pointsToSegments(points, 1.0);
  }, [selected, points]);

  const developedBlankWidth = useMemo(() => {
    return calculateDevelopedBlankWidth(segments, selected?.thicknessMm || 0.55);
  }, [segments, selected?.thicknessMm]);

  const girthTier = useMemo(() => {
    return classifyGirthTier(developedBlankWidth);
  }, [developedBlankWidth]);

  const engineeringSummary = useMemo(() => {
    if (!segments.length) return null;
    const legs = segments.map((s, idx) => ({
      id: `l-${idx}`,
      lengthMm: s.lengthMm,
      interiorAngleDeg: s.angleDeg ?? 90,
      turnDirection: s.turnDirection ?? 1,
      kind: (s.kind === 'hem' ? 'open_hem' : s.kind) as any
    }));
    return calculateFlashingEngineering(legs, 'vitor_055', 3.0, 1);
  }, [segments]);

  // Compute Variobend Technical Dimension Annotations
  const legDimensions = useMemo(() => {
    return computeLegDimensions(points, segments, modelUnitsPerScreenPixel, selectedSegIndex);
  }, [points, segments, modelUnitsPerScreenPixel, selectedSegIndex]);

  // Compute Variobend Bend Angle Arcs
  const bendAngles = useMemo(() => {
    return computeBendAngleAnnotations(points, segments, modelUnitsPerScreenPixel);
  }, [points, segments, modelUnitsPerScreenPixel]);

  // Profile path string
  const profilePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  // In-progress live drawing path
  const liveDrawPath = useMemo(() => {
    if (mode !== 'draw' || points.length === 0 || !cursor) return '';
    return `M ${points[points.length - 1].x} ${points[points.length - 1].y} L ${cursor.x} ${cursor.y}`;
  }, [mode, points, cursor]);

  // Painted face parallel offset path
  const paintedFacePath = useMemo(() => {
    if (points.length < 2) return '';
    const offsetMm = (paintSide === 'outside' ? 2.5 : -2.5) * modelUnitsPerScreenPixel;
    const offsetPts: Point2D[] = [];

    for (let i = 0; i < points.length; i++) {
      let normal: Point2D = { x: 0, y: -1 };
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const d = dist(p1, p2);
        if (d > 1e-4) {
          normal = { x: -(p2.y - p1.y) / d, y: (p2.x - p1.x) / d };
        }
      } else {
        const p0 = points[i - 1];
        const p1 = points[i];
        const d = dist(p0, p1);
        if (d > 1e-4) {
          normal = { x: -(p1.y - p0.y) / d, y: (p1.x - p0.x) / d };
        }
      }
      offsetPts.push({ x: points[i].x + normal.x * offsetMm, y: points[i].y + normal.y * offsetMm });
    }
    return offsetPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points, paintSide, modelUnitsPerScreenPixel]);

  // Selected Segment & Bend objects
  const activeSegment = selectedSegIndex !== null ? segments[selectedSegIndex] : null;
  const activeBend = selectedBendIndex !== null ? bendAngles.find((b) => b.bendIndex === selectedBendIndex) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none font-sans overflow-hidden">
      {/* TOP HEADER: Slim, professional technical bar */}
      <header className="h-12 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Return to workshop"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {project.projectNumber}
            </span>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              onBlur={() => {
                if (selected && profileName.trim()) {
                  persistProfiles(
                    profiles.map((p) => (p.id === selected.id ? { ...p, name: profileName.trim() } : p))
                  );
                }
              }}
              placeholder="Flashing Profile Name"
              className="bg-transparent font-bold text-sm text-white placeholder-slate-500 outline-none truncate border-b border-transparent focus:border-sky-500 px-1"
            />
          </div>
        </div>

        {/* Center Mode Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-semibold">
          <button onClick={() => setViewMode('profile')} className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'profile' ? 'bg-sky-700 text-white' : 'text-slate-400 hover:text-white'}`}>2D</button>
          <button onClick={() => setViewMode('3d')} className={`px-2.5 py-1 rounded-md transition-all ${viewMode === '3d' ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-white'}`}>3D</button>
          <button
            onClick={() => setMode('draw')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'draw' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'edit' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inspect & Edit
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">E2/AS1 Presets</span>
          </button>

          <button
            onClick={() => setShowSavedSheet(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {profiles.length} Saved
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showInspector ? 'bg-sky-950 border-sky-700 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Properties Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SUB-HEADER / HUD STRIP */}
      <div className="h-9 border-b border-slate-800/80 bg-slate-900/60 px-3 flex items-center justify-between text-xs text-slate-400 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="accent-sky-500 w-3.5 h-3.5"
            />
            <span className="text-[11px]">Snap Grid ({Math.round(gridStep)}mm)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={snapAngles}
              onChange={(e) => setSnapAngles(e.target.checked)}
              className="accent-sky-500 w-3.5 h-3.5"
            />
            <span className="text-[11px]">Snap 45°</span>
          </label>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <span>Blank:</span>
            <strong className="text-white font-bold">{developedBlankWidth}mm</strong>
            <span className="text-sky-400 font-semibold">({girthTier})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={flipProfile}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Mirror profile"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mirror</span>
          </button>

          <button
            onClick={() => handleFitToProfile()}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Fit whole profile into view (F key)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Fit Profile</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTICE */}
      {notice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-sky-500/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          {notice}
        </div>
      )}

      {/* MAIN HERO VIEWPORT + INSPECTOR LAYOUT */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* SVG TECHNICAL DRAWING HERO CANVAS */}
        <div
          ref={containerRef}
          className="flex-1 h-full relative overflow-hidden bg-[#070b12] touch-none cursor-crosshair"
          onWheel={handleWheel}
        >
          {viewMode === '3d' && (
            <FlashingProfile3D points={points} paintSide={paintSide} onPaintSideChange={setPaintSide}
              rotation={rotation} onRotationChange={setRotation} zoom={zoom3d} onZoomChange={setZoom3d} />
          )}
          <svg
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            className={`w-full h-full touch-none select-none ${viewMode === '3d' ? 'hidden' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <defs>
              {/* Technical Precision Coordinate Grid */}
              <pattern
                id="tech-grid-minor"
                width={gridStep}
                height={gridStep}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
                  fill="none"
                  stroke="#172033"
                  strokeWidth={0.5 * modelUnitsPerScreenPixel}
                />
              </pattern>
              <pattern
                id="tech-grid-major"
                width={gridStep * 5}
                height={gridStep * 5}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridStep * 5} 0 L 0 0 0 ${gridStep * 5}`}
                  fill="none"
                  stroke="#23324d"
                  strokeWidth={1.0 * modelUnitsPerScreenPixel}
                />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="#070b12" />
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#tech-grid-minor)" />
            <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#tech-grid-major)" />

            {/* In-progress drawing preview line */}
            {liveDrawPath && (
              <path
                d={liveDrawPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={2.5 * modelUnitsPerScreenPixel}
                strokeDasharray={`${6 * modelUnitsPerScreenPixel} ${4 * modelUnitsPerScreenPixel}`}
              />
            )}

            {/* Subtle painted face indicator line */}
            {paintedFacePath && (
              <path
                d={paintedFacePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth={1.5 * modelUnitsPerScreenPixel}
                opacity={0.85}
              />
            )}

            {/* HERO PROFILE OUTLINE */}
            {profilePath && (
              <path
                d={profilePath}
                fill="none"
                stroke="#f8fafc"
                strokeWidth={3.5 * modelUnitsPerScreenPixel}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ACTIVE SEGMENT HIGHLIGHT GLOW */}
            {selectedSegIndex !== null && points[selectedSegIndex] && points[selectedSegIndex + 1] && (
              <g pointerEvents="none">
                <line
                  x1={points[selectedSegIndex].x}
                  y1={points[selectedSegIndex].y}
                  x2={points[selectedSegIndex + 1].x}
                  y2={points[selectedSegIndex + 1].y}
                  stroke="#38bdf8"
                  strokeWidth={9 * modelUnitsPerScreenPixel}
                  strokeLinecap="round"
                  opacity={0.3}
                />
                <line
                  x1={points[selectedSegIndex].x}
                  y1={points[selectedSegIndex].y}
                  x2={points[selectedSegIndex + 1].x}
                  y2={points[selectedSegIndex + 1].y}
                  stroke="#38bdf8"
                  strokeWidth={4.5 * modelUnitsPerScreenPixel}
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Variobend-style in-leg labels: no witness lines, leaders or external dimensions */}
            {legDimensions.map((dim) => {
              const isSelected = selectedSegIndex === dim.segIndex;
              const u = modelUnitsPerScreenPixel;
              const legPixels = dist(dim.p1, dim.p2) / u;
              // Short legs stay uncluttered; labels reappear automatically when zoomed in.
              if (legPixels < 34) return null;
              return (
                <g key={`dim-${dim.segIndex}`} onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegIndex(dim.segIndex);
                  setSelectedBendIndex(null);
                }} className="cursor-pointer">
                  <g transform={`translate(${dim.midpoint.x} ${dim.midpoint.y}) scale(${u})`}>
                    <rect x="-24" y="-9" width="48" height="18" rx="3" fill={isSelected ? "#075985" : "#111827"} stroke={isSelected ? "#7dd3fc" : "#334155"} strokeWidth="1" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="700">{dim.lengthMm}</text>
                  </g>
                </g>
              );
            })}

            {/* VARIOBEND REAL BEND ANGLE CIRCULAR ARCS */}
            {bendAngles.map((bend) => {
              const u = modelUnitsPerScreenPixel;
              // Keep tight hems and acute folds clean at overview scale; zooming restores the annotation.
              if (Math.min(dist(bend.pPrev, bend.vertex), dist(bend.pNext, bend.vertex)) / u < 25) return null;
              const isSelected = selectedBendIndex === bend.bendIndex;
              const arcColor = isSelected ? '#38bdf8' : '#64748b';
              const textColor = isSelected ? '#38bdf8' : '#94a3b8';

              return (
                <g
                  key={`bend-${bend.bendIndex}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBendIndex(bend.bendIndex);
                    setSelectedSegIndex(bend.bendIndex);
                  }}
                  className="cursor-pointer"
                >
                  {/* Geometric Circular Arc */}
                  <path
                    d={bend.arcPath}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth={1.5 * u}
                    strokeDasharray={isSelected ? undefined : `${3 * u} ${2 * u}`}
                  />

                  {/* Screen-Space Angle Value */}
                  <g transform={`translate(${bend.labelPos.x} ${bend.labelPos.y}) scale(${u})`}>
                    <rect
                      x="-18"
                      y="-8"
                      width="36"
                      height="16"
                      rx="3"
                      fill="#0b0f19"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth="1"
                      fillOpacity="0.9"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="bold"
                    >
                      {bend.interiorAngleDeg}°
                    </text>
                  </g>
                </g>
              );
            })}

            {/* EDITABLE VERTEX HANDLES */}
            {mode === 'edit' &&
              points.map((pt, i) => {
                const isSelected = selectedSegIndex === i || (i > 0 && selectedSegIndex === i - 1);
                const u = modelUnitsPerScreenPixel;
                return (
                  <circle
                    key={`vtx-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5 * u : 3.5 * u}
                    fill={isSelected ? '#38bdf8' : '#0f172a'}
                    stroke={isSelected ? '#ffffff' : '#64748b'}
                    strokeWidth={1.5 * u}
                    className="hover:scale-125 transition-transform cursor-grab active:cursor-grabbing"
                  />
                );
              })}
          </svg>

          {/* FLOATING VIEWPORT HUD (VARIOBEND NAVIGATION CONTROLS) */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-xl shadow-xl">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out (−)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-mono text-[11px] font-bold text-slate-200 px-2 min-w-12 text-center">
              {zoomPercent}%
            </span>

            <button
              onClick={() => handleZoom(0.8)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            <button
              onClick={() => handleFitToProfile()}
              className="p-2 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Fit Entire Profile (F key)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetView}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE PROPERTIES INSPECTOR (SECONDARY INFORMATION DOCKED AWAY FROM DRAWING) */}
        {showInspector && (
          <aside className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-y-auto z-20">
            {/* Inspector Title */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Geometry Inspector
              </span>
              <button
                onClick={() => setShowInspector(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Selected Leg Editor Card */}
              {activeSegment && selectedSegIndex !== null && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      EDGE {selectedSegIndex + 1} OF {segments.length}
                    </span>
                    <button
                      onClick={handleFitSelected}
                      className="text-[11px] font-semibold text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      Focus <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dimension input with step nudges */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Leg Length (mm)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={activeSegment.lengthMm}
                        onChange={(e) => updateSegmentAt(selectedSegIndex, { lengthMm: Number(e.target.value) })}
                        className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-2 font-mono text-base font-bold text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500 px-1">mm</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                      {[-10, -1, +1, +10].map((step) => (
                        <button
                          key={step}
                          onClick={() =>
                            updateSegmentAt(selectedSegIndex, {
                              lengthMm: Math.max(1, activeSegment.lengthMm + step)
                            })
                          }
                          className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs font-semibold cursor-pointer"
                        >
                          {step > 0 ? `+${step}` : step}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edge Kind selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Edge Detail Type
                    </label>
                    <select
                      value={activeSegment.kind || 'leg'}
                      onChange={(e) => {
                        const kind = e.target.value as FlashingSegment['kind'];
                        const defaults = SEGMENT_KINDS.find((k) => k.value === kind);
                        updateSegmentAt(selectedSegIndex, {
                          kind,
                          lengthMm: defaults ? defaults.defaultMm : activeSegment.lengthMm
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-semibold text-white outline-none"
                    >
                      {SEGMENT_KINDS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Selected Bend Angle Card */}
              {activeBend && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      BEND {activeBend.bendIndex + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Fold: <strong>{activeBend.bendAngleDeg}°</strong>
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Interior Corner Angle (Degrees)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="179"
                        value={activeBend.interiorAngleDeg}
                        onChange={(e) =>
                          updateSegmentAt(activeBend.bendIndex, { angleDeg: Number(e.target.value) })
                        }
                        className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 font-mono text-base font-bold text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500 px-1">deg</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                      {[45, 90, 135, 150].map((ang) => (
                        <button
                          key={ang}
                          onClick={() => updateSegmentAt(activeBend.bendIndex, { angleDeg: ang })}
                          className={`py-1 rounded font-mono text-xs font-semibold transition-colors cursor-pointer ${
                            activeBend.interiorAngleDeg === ang
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {ang}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Turn direction toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold">Turn Direction</span>
                    <button
                      onClick={() =>
                        updateSegmentAt(activeBend.bendIndex, {
                          turnDirection: activeBend.turnDirection === 1 ? -1 : 1
                        })
                      }
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {activeBend.turnDirection === 1 ? 'UP (CCW)' : 'DOWN (CW)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Material & Finish Spec Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Material & Paint Face
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Finished Face</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPaintSide('outside')}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                        paintSide === 'outside'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Outside
                    </button>
                    <button
                      onClick={() => setPaintSide('inside')}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                        paintSide === 'inside'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Inside
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Coil Spec: <strong className="text-slate-200">{selected?.material || project.material}</strong>
                </div>
              </div>

              {/* Engineering Calculations Summary */}
              {engineeringSummary && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs font-mono">
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Fabrication Summary
                  </span>
                  <div className="flex justify-between text-slate-300">
                    <span>Nominal Leg Sum:</span>
                    <strong className="text-white">{engineeringSummary.nominalSumMm} mm</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Bend Deduction:</span>
                    <strong className="text-amber-400">-{engineeringSummary.totalBendDeductionMm} mm</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Developed Flat Blank:</span>
                    <strong className="text-emerald-400">{engineeringSummary.developedBlankWidthMm} mm</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Girth Tier:</span>
                    <strong className="text-sky-400">{engineeringSummary.girthTier}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Master Slit Width:</span>
                    <strong className="text-white">{engineeringSummary.recommendedSlitWidthMm} mm</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={deleteLastEdge}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-900/50 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Last Edge
                </button>

                {onSaveToLibrary && selected && (
                  <button
                    onClick={() => {
                      onSaveToLibrary(selected);
                      toast('Saved profile to library');
                    }}
                    className="w-full py-2 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save to Project Library
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* NZBC E2/AS1 ARCHITECTURAL PRESETS MODAL */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  Standard Architectural Presets
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pre-engineered architectural profiles with exact bend sequences and nominal girths.
                </p>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ARCHITECTURAL_FLASHING_PRESETS.map((preset) => {
                const blank = calculateDevelopedBlankWidth(preset.segments || [], 0.55);
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 text-left transition-all space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                        {preset.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-900 text-sky-300 font-mono">
                        {preset.girthTier || '301-450mm'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Blank: {blank} mm · {(preset.segments || []).length} legs
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Material: {preset.material || '0.55mm ColorCote Vitor+'}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      Paint side: {preset.paintSide}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SAVED PROFILES SHEET */}
      {showSavedSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full max-h-[80vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white">Saved Project Profiles</span>
              <button onClick={() => setShowSavedSheet(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="divide-y divide-slate-800">
              {profiles.length === 0 ? (
                <li className="py-8 text-center text-xs text-slate-500">No saved profiles yet.</li>
              ) : (
                profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        setSelectedId(p.id);
                        setShowSavedSheet(false);
                      }}
                      className="w-full text-left py-2.5 px-2 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.segments.length} legs · Blank {p.developedLengthMm || 0}mm · {p.girthTier || 'Standard'}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};