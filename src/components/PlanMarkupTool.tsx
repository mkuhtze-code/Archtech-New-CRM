import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Project, 
  ArchitecturalPlan, 
  PlanMarkupAnnotation, 
  FlashingPin,
  FlashingProfile,
  FlashingGirthTier
} from '../types/crm';
import { 
  NormalizedPoint, 
  DrawingViewport, 
  PlanScaleCalibration,
  calculateRealDistanceMm, 
  calculateSlopeDistanceMm, 
  calculatePolygonMeasurements,
  screenToNormalized,
  normalizedToScreen,
  pointToSegmentDistance 
} from '../utils/planGeometry';
import { 
  ARCHITECTURAL_FLASHING_PRESETS, 
  classifyGirthTier 
} from '../utils/sheetMetalGeometry';
import { 
  ArrowLeft, 
  Check, 
  Circle, 
  Eraser, 
  Minus, 
  MousePointer2, 
  Pencil, 
  Plus, 
  Ruler, 
  Save, 
  Tag, 
  Trash2, 
  Type,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  RotateCcw,
  Sliders,
  Layers,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export type MarkupTool = 
  | 'select' 
  | 'pan' 
  | 'dimension' 
  | 'area_zone' 
  | 'flashing_pin' 
  | 'arrow' 
  | 'cloud' 
  | 'text' 
  | 'count' 
  | 'calibrate';

interface Props {
  project: Project;
  plan: ArchitecturalPlan;
  memberName: string;
  onUpdateProject: (project: Project) => void;
  onClose: () => void;
  onOpenFlashingDesigner?: (profileId?: string, initialLengthLm?: number) => void;
}

const TOOL_CONFIG: { id: MarkupTool; label: string; icon: React.ComponentType<{ className?: string; color?: string }>; color: string }[] = [
  { id: 'select', label: 'Select & Move', icon: MousePointer2, color: '#334155' },
  { id: 'pan', label: 'Pan Canvas', icon: Move, color: '#475569' },
  { id: 'dimension', label: 'Dimension', icon: Ruler, color: '#0284c7' },
  { id: 'area_zone', label: 'Roof / Wall Zone', icon: Circle, color: '#16a34a' },
  { id: 'flashing_pin', label: 'Flashing Pin', icon: MapPin, color: '#d97706' },
  { id: 'arrow', label: 'Leader Arrow', icon: ArrowLeft, color: '#7c3aed' },
  { id: 'cloud', label: 'Revision Cloud', icon: Sliders, color: '#be123c' },
  { id: 'text', label: 'Callout Note', icon: Type, color: '#0f766e' },
  { id: 'count', label: 'Item Count', icon: Tag, color: '#0891b2' },
  { id: 'calibrate', label: 'Set Scale', icon: Plus, color: '#b45309' }
];

export const PlanMarkupTool: React.FC<Props> = ({
  project,
  plan,
  memberName,
  onUpdateProject,
  onClose,
  onOpenFlashingDesigner
}) => {
  // Current plan reference
  const currentPlan = 
    project.architecturalPlans?.find(p => p.id === plan.id) || 
    project.plans?.find(p => p.id === plan.id) || 
    plan;

  const calibration = currentPlan.scaleCalibration as PlanScaleCalibration | undefined;

  // Annotations belonging to this specific plan
  const allAnnotations = project.planMarkupAnnotations || [];
  const planAnnotations = useMemo(() => 
    allAnnotations.filter(a => a.planId === plan.id),
    [allAnnotations, plan.id]
  );

  // Flashing pins on this plan
  const planFlashingPins = useMemo(() => 
    (project.flashingPins || []).filter(p => p.planId === plan.id),
    [project.flashingPins, plan.id]
  );

  // Active Tool state
  const [activeTool, setActiveTool] = useState<MarkupTool>('dimension');
  const [draftPoints, setDraftPoints] = useState<NormalizedPoint[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Viewport State (Zoom & Pan)
  const [viewport, setViewport] = useState<DrawingViewport>({
    zoom: 1.0,
    panX: 0,
    panY: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tool parameter states
  const [labelInput, setLabelInput] = useState('');
  const [textNoteInput, setTextNoteInput] = useState('');
  const [pitchInput, setPitchInput] = useState<number>(project.roofPitchDegrees || 5);
  const [knownDistanceInput, setKnownDistanceInput] = useState<string>('6000');
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Layer Visibility
  const [showDimensions, setShowDimensions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showFlashings, setShowFlashings] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  // Takeoff Register Sidebar open state
  const [showTakeoffDrawer, setShowTakeoffDrawer] = useState(false);

  // Flashing Pin Creation Modal
  const [pinModalState, setPinModalState] = useState<{
    isOpen: boolean;
    point: NormalizedPoint | null;
    lengthLm: number;
    profileId: string;
    profileName: string;
    label: string;
    quantity: number;
    girthTier: FlashingGirthTier;
  }>({
    isOpen: false,
    point: null,
    lengthLm: 12.0,
    profileId: ARCHITECTURAL_FLASHING_PRESETS[0].id,
    profileName: ARCHITECTURAL_FLASHING_PRESETS[0].name,
    label: 'FL-01 (Apron)',
    quantity: 4,
    girthTier: '301-450mm'
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const showNotice = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Zoom helpers
  const handleZoom = (delta: number) => {
    setViewport(prev => {
      const nextZoom = Math.max(0.4, Math.min(6.0, prev.zoom + delta));
      return { ...prev, zoom: Math.round(nextZoom * 100) / 100 };
    });
  };

  const handleResetZoom = () => {
    setViewport({ zoom: 1.0, panX: 0, panY: 0 });
  };

  // Save annotation
  const handleSaveAnnotation = (
    type: PlanMarkupAnnotation['type'],
    points: NormalizedPoint[],
    opts: {
      label?: string;
      text?: string;
      pitch?: number;
      calibratedLengthMm?: number;
      calibratedAreaM2?: number;
    } = {}
  ) => {
    const newId = `markup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newAnnotation: PlanMarkupAnnotation = {
      id: newId,
      planId: plan.id,
      projectId: project.id,
      type,
      calibratedLengthMm: opts.calibratedLengthMm,
      calibratedAreaM2: opts.calibratedAreaM2,
      pitchDegrees: opts.pitch,
      payload: {
        points,
        label: opts.label || labelInput.trim() || undefined,
        text: opts.text || textNoteInput.trim() || undefined,
        tool: activeTool,
        pitch: opts.pitch || pitchInput
      },
      createdAt: new Date().toISOString(),
      createdBy: memberName || 'Marcus Kuhtze'
    };

    const updatedAnnotations = [...allAnnotations, newAnnotation];
    onUpdateProject({
      ...project,
      planMarkupAnnotations: updatedAnnotations
    });

    setDraftPoints([]);
    setLabelInput('');
    setTextNoteInput('');
    showNotice(`Saved ${type} markup to ${plan.sheetNumber}`);
  };

  // Canvas pointer down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Check if middle click or Space/Pan active
    if (e.button === 1 || activeTool === 'pan' || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
      return;
    }

    if (activeTool === 'select') {
      // Clear draft
      setDraftPoints([]);
      return;
    }

    const normPt = screenToNormalized(e.clientX, e.clientY, rect, viewport);

    if (activeTool === 'calibrate') {
      if (draftPoints.length >= 2) {
        setDraftPoints([normPt]);
        showNotice('Point 1 set. Tap second point of known distance.');
      } else {
        setDraftPoints(prev => [...prev, normPt]);
        if (draftPoints.length === 1) {
          showNotice('Two points selected. Verify real distance below and click Save Scale.');
        } else {
          showNotice('Point 1 set. Tap second point of known distance.');
        }
      }
      return;
    }

    if (activeTool === 'flashing_pin') {
      // Calculate default length if calibration exists
      let defaultLm = 12.0;
      if (calibration?.mmPerDrawingUnit) {
        defaultLm = 6.0;
      }
      setPinModalState({
        isOpen: true,
        point: normPt,
        lengthLm: defaultLm,
        profileId: ARCHITECTURAL_FLASHING_PRESETS[0].id,
        profileName: ARCHITECTURAL_FLASHING_PRESETS[0].name,
        label: `FL-0${planFlashingPins.length + 1}`,
        quantity: Math.max(1, Math.ceil(defaultLm / 3.0)),
        girthTier: '301-450mm'
      });
      return;
    }

    if (activeTool === 'count') {
      handleSaveAnnotation('pin', [normPt], {
        label: labelInput.trim() || `Item ${planAnnotations.filter(a => a.type === 'pin').length + 1}`
      });
      return;
    }

    if (activeTool === 'text') {
      setDraftPoints([normPt]);
      return;
    }

    if (activeTool === 'dimension') {
      if (draftPoints.length >= 2) {
        setDraftPoints([normPt]);
      } else if (draftPoints.length === 1) {
        const p1 = draftPoints[0];
        const p2 = normPt;
        const distResult = calculateRealDistanceMm(p1, p2, calibration);
        const slopeResult = calculateSlopeDistanceMm(distResult.distanceMm, pitchInput);

        handleSaveAnnotation('dimension', [p1, p2], {
          calibratedLengthMm: slopeResult.slopeMm,
          pitch: pitchInput,
          label: labelInput.trim() || undefined
        });
      } else {
        setDraftPoints([normPt]);
      }
      return;
    }

    // Default multi-point (area, arrow, cloud)
    setDraftPoints(prev => [...prev, normPt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y
      }));
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Complete multi-point polygon / arrow / note
  const handleFinishDraft = () => {
    if (activeTool === 'text') {
      if (!draftPoints.length || !textNoteInput.trim()) {
        showNotice('Enter note text and tap plan location.');
        return;
      }
      handleSaveAnnotation('text', draftPoints, { text: textNoteInput.trim() });
      return;
    }

    if (activeTool === 'area_zone') {
      if (draftPoints.length < 3) {
        showNotice('Tap at least 3 points to outline a roof/wall zone.');
        return;
      }
      const polyResult = calculatePolygonMeasurements(draftPoints, calibration, 1.414, pitchInput);
      handleSaveAnnotation('cloud', draftPoints, {
        calibratedAreaM2: polyResult.areaM2,
        pitch: pitchInput,
        label: labelInput.trim() || `Roof Zone (${pitchInput}°)`
      });
      return;
    }

    if (activeTool === 'arrow') {
      if (draftPoints.length < 2) {
        showNotice('Tap at least 2 points for leader arrow.');
        return;
      }
      handleSaveAnnotation('arrow', draftPoints, {
        label: labelInput.trim() || undefined
      });
      return;
    }

    if (activeTool === 'cloud') {
      if (draftPoints.length < 2) {
        showNotice('Tap points to outline revision cloud.');
        return;
      }
      handleSaveAnnotation('cloud', draftPoints, {
        label: labelInput.trim() || 'RFI / Revision Note'
      });
      return;
    }
  };

  // Save Scale Calibration
  const handleSaveCalibration = () => {
    const realMm = Number(knownDistanceInput);
    if (draftPoints.length !== 2 || !Number.isFinite(realMm) || realMm <= 0) {
      showNotice('Tap two datum points and enter known distance in mm (> 0).');
      return;
    }

    const p1 = draftPoints[0];
    const p2 = draftPoints[1];
    const normDist = Math.hypot((p2.x - p1.x) * 1.414, p2.y - p1.y);

    if (normDist < 0.005) {
      showNotice('Calibration points are too close together. Pick opposite grid lines.');
      return;
    }

    const mmPerDrawingUnit = Math.round(realMm / normDist);
    let scaleRatio = '1:100';
    if (mmPerDrawingUnit > 40000) scaleRatio = '1:200';
    else if (mmPerDrawingUnit < 8000) scaleRatio = '1:20';
    else if (mmPerDrawingUnit < 15000) scaleRatio = '1:50';

    const newCalibration: PlanScaleCalibration = {
      knownDistanceMm: realMm,
      drawingUnits: Math.round(normDist * 1000) / 1000,
      mmPerDrawingUnit,
      scaleRatio,
      calibratedAt: new Date().toISOString().slice(0, 10),
      calibratedBy: memberName || 'Marcus Kuhtze (LBP)',
      sourcePoints: [p1, p2]
    };

    const updatedPlan: ArchitecturalPlan = {
      ...currentPlan,
      scale: scaleRatio,
      scaleCalibration: newCalibration
    };

    const updatePlanArray = (plans?: ArchitecturalPlan[]) => 
      plans?.map(p => p.id === plan.id ? updatedPlan : p);

    onUpdateProject({
      ...project,
      architecturalPlans: updatePlanArray(project.architecturalPlans),
      plans: updatePlanArray(project.plans)
    });

    setDraftPoints([]);
    showNotice(`Scale calibrated: ${realMm.toLocaleString()} mm across datum points (${scaleRatio}).`);
  };

  // Save Flashing Pin from modal
  const handleSaveFlashingPin = () => {
    if (!pinModalState.point) return;

    const newPin: FlashingPin = {
      id: `pin-${Date.now()}`,
      projectId: project.id,
      planId: plan.id,
      profileId: pinModalState.profileId,
      profileName: pinModalState.profileName,
      label: pinModalState.label.trim() || 'FL Pin',
      lengthLm: pinModalState.lengthLm,
      quantity: pinModalState.quantity,
      xPercent: Math.round(pinModalState.point.x * 1000) / 10,
      yPercent: Math.round(pinModalState.point.y * 1000) / 10,
      girthTier: pinModalState.girthTier,
      material: project.material,
      colorName: project.colorName,
      notes: `Allocated to ${pinModalState.lengthLm}m run on Sheet ${plan.sheetNumber}`,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: memberName || 'Marcus Kuhtze'
    };

    const existingPins = project.flashingPins || [];
    onUpdateProject({
      ...project,
      flashingPins: [...existingPins, newPin]
    });

    setPinModalState(prev => ({ ...prev, isOpen: false }));
    showNotice(`Flashing Pin ${newPin.label} placed on plan (${newPin.lengthLm} lm).`);
  };

  // Delete annotation
  const handleDeleteAnnotation = (id: string) => {
    onUpdateProject({
      ...project,
      planMarkupAnnotations: allAnnotations.filter(a => a.id !== id)
    });
    setSelectedAnnotationId(null);
    showNotice('Annotation deleted.');
  };

  // Delete pin
  const handleDeletePin = (id: string) => {
    onUpdateProject({
      ...project,
      flashingPins: (project.flashingPins || []).filter(p => p.id !== id)
    });
    setSelectedPinId(null);
    showNotice('Flashing pin deleted.');
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
            title="Back to drawings list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                {plan.sheetNumber} · {plan.revision}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700">{plan.category}</span>
              {calibration?.scaleRatio && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Scale {calibration.scaleRatio}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{plan.title}</h2>
          </div>
        </div>

        {/* Viewport Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Buttons */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(-0.25)}
              className="p-1.5 hover:bg-white rounded text-slate-700 cursor-pointer transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-slate-800 min-w-12 text-center">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.25)}
              className="p-1.5 hover:bg-white rounded text-slate-700 cursor-pointer transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] font-semibold hover:bg-white rounded text-slate-700 cursor-pointer transition-colors"
              title="Fit to Page"
            >
              Fit
            </button>
          </div>

          {/* Takeoff Register Toggle */}
          <button
            type="button"
            onClick={() => setShowTakeoffDrawer(!showTakeoffDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showTakeoffDrawer 
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
            <span>Takeoff Register</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
              {planAnnotations.length + planFlashingPins.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tool Palette */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
        {/* Tool selector buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {TOOL_CONFIG.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  setDraftPoints([]);
                  setSelectedAnnotationId(null);
                  setSelectedPinId(null);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  isActive 
                    ? 'border-sky-600 bg-sky-50/80 text-sky-950 font-bold shadow-2xs' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" color={isActive ? '#0284c7' : tool.color} />
                <span className="text-[10px] leading-tight line-clamp-1">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Parameters for Selected Tool */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Label input for takeoffs */}
            {(activeTool === 'dimension' || activeTool === 'area_zone' || activeTool === 'arrow' || activeTool === 'count') && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 text-[11px]">Takeoff Label:</span>
                <input
                  type="text"
                  placeholder="e.g. North Rake, Valley A, Pitch 1"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-44"
                />
              </div>
            )}

            {/* Pitch Degrees input */}
            {(activeTool === 'dimension' || activeTool === 'area_zone') && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <span className="font-semibold text-slate-600 text-[11px]">Roof Pitch:</span>
                <select
                  value={pitchInput}
                  onChange={(e) => setPitchInput(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={0}>0° (Flat / Wall Cladding)</option>
                  <option value={3}>3° (Standard Minimum Fall)</option>
                  <option value={5}>5° (Standard Low Pitch)</option>
                  <option value={10}>10° (Medium Pitch)</option>
                  <option value={15}>15° (Steep Gable)</option>
                  <option value={25}>25° (Alpine Pitch)</option>
                  <option value={35}>35° (Cathedral Rake)</option>
                </select>
              </div>
            )}

            {/* Calibration Known Distance */}
            {activeTool === 'calibrate' && (
              <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                <span className="font-bold text-amber-900 text-xs">Known Datum (mm):</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={knownDistanceInput}
                  onChange={(e) => setKnownDistanceInput(e.target.value)}
                  placeholder="e.g. 6000"
                  className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-slate-900 w-24"
                />
                <button
                  type="button"
                  onClick={handleSaveCalibration}
                  disabled={draftPoints.length !== 2}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  Save Scale
                </button>
              </div>
            )}

            {/* Note Text Input */}
            {activeTool === 'text' && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 text-[11px]">Note:</span>
                <input
                  type="text"
                  placeholder="e.g. Verify step flashing clearance with builder"
                  value={textNoteInput}
                  onChange={(e) => setTextNoteInput(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-72"
                />
              </div>
            )}
          </div>

          {/* Action buttons (Finish / Undo / Cancel) */}
          <div className="flex items-center gap-2">
            {draftPoints.length > 0 && activeTool !== 'calibrate' && (
              <button
                type="button"
                onClick={handleFinishDraft}
                className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Finish & Save</span>
              </button>
            )}
            {draftPoints.length > 0 && (
              <button
                type="button"
                onClick={() => setDraftPoints(prev => prev.slice(0, -1))}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Undo Point
              </button>
            )}
            {draftPoints.length > 0 && (
              <button
                type="button"
                onClick={() => setDraftPoints([])}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Status notification banner */}
        {notificationMsg && (
          <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-xs font-medium text-sky-900 flex items-center gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}
      </div>

      {/* Main Drawing Canvas & Interactive SVG Overlay */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        <div className="flex-1 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-900 shadow-md relative select-none">
          {/* Canvas Top Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 text-white text-xs border-b border-slate-800 z-10">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">Underlay:</span>
              <span className="font-bold text-sky-400">{plan.sheetNumber}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">
                {calibration ? `${calibration.scaleRatio} (${calibration.knownDistanceMm}mm datum)` : 'Scale uncalibrated'}
              </span>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600"
                />
                <span className="text-slate-300">Dimensions</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600"
                />
                <span className="text-slate-300">Zones</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFlashings}
                  onChange={(e) => setShowFlashings(e.target.checked)}
                  className="rounded border-slate-700 text-amber-600"
                />
                <span className="text-slate-300">Flashings ({planFlashingPins.length})</span>
              </label>
            </div>
          </div>

          {/* Interactive Zoomable / Pannable Workspace */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              cursor: activeTool === 'pan' || isPanning ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair',
              touchAction: 'none'
            }}
            className="relative aspect-[12/8.5] w-full overflow-hidden bg-slate-950"
          >
            {/* Transformed Drawing Layer */}
            <div
              style={{
                transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
                transformOrigin: 'top left',
                transition: isPanning ? 'none' : 'transform 0.05s ease-out'
              }}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Architectural Plan Sheet (SVG Vector / PDF Underlay) */}
              <img
                src={plan.fileUrl}
                alt={plan.title}
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* High-Precision SVG Annotation Overlay */}
              <svg
                viewBox="0 0 1000 708"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              >
                <defs>
                  <marker id="arrowHead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                  </marker>
                </defs>

                {/* 1. Saved Annotations */}
                {planAnnotations.map((annotation) => {
                  const points = Array.isArray(annotation.payload.points) 
                    ? (annotation.payload.points as NormalizedPoint[]) 
                    : [];
                  if (!points.length) return null;

                  const screenCoords = points.map(p => `${p.x * 1000},${p.y * 708}`).join(' ');
                  const firstPt = points[0];
                  const lastPt = points[points.length - 1];
                  const midX = ((firstPt.x + lastPt.x) / 2) * 1000;
                  const midY = ((firstPt.y + lastPt.y) / 2) * 708;

                  // Render Dimension
                  if (annotation.type === 'dimension' && showDimensions && points.length >= 2) {
                    const distText = annotation.calibratedLengthMm 
                      ? `${(annotation.calibratedLengthMm / 1000).toFixed(2)}m (${annotation.calibratedLengthMm}mm)`
                      : `${Math.round(Math.hypot(lastPt.x - firstPt.x, lastPt.y - firstPt.y) * 1000)} units*`;

                    return (
                      <g key={annotation.id}>
                        <line
                          x1={firstPt.x * 1000}
                          y1={firstPt.y * 708}
                          x2={lastPt.x * 1000}
                          y2={lastPt.y * 708}
                          stroke="#0284c7"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <circle cx={firstPt.x * 1000} cy={firstPt.y * 708} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                        <circle cx={lastPt.x * 1000} cy={lastPt.y * 708} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                        <rect
                          x={midX - 55}
                          y={midY - 18}
                          width="110"
                          height="22"
                          rx="4"
                          fill="#0f172a"
                          fillOpacity="0.85"
                        />
                        <text
                          x={midX}
                          y={midY - 3}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {distText}
                        </text>
                        {Boolean(annotation.payload.label) && (
                          <text
                            x={midX}
                            y={midY + 18}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            stroke="#0f172a"
                            strokeWidth="3"
                            paintOrder="stroke"
                          >
                            {String(annotation.payload.label)}
                          </text>
                        )}
                      </g>
                    );
                  }

                  // Render Roof Zone / Area
                  if (annotation.type === 'cloud' && showZones && points.length >= 3) {
                    const areaText = annotation.calibratedAreaM2 
                      ? `${annotation.calibratedAreaM2.toFixed(1)} m²`
                      : 'Zone (uncalibrated)';

                    return (
                      <g key={annotation.id}>
                        <polygon
                          points={screenCoords}
                          fill="#16a34a"
                          fillOpacity="0.18"
                          stroke="#16a34a"
                          strokeWidth="2.5"
                          strokeDasharray="6 3"
                        />
                        {points.map((pt, i) => (
                          <circle key={i} cx={pt.x * 1000} cy={pt.y * 708} r="4.5" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
                        ))}
                        <text
                          x={firstPt.x * 1000 + 10}
                          y={firstPt.y * 708 + 20}
                          fill="#22c55e"
                          fontSize="13"
                          fontWeight="bold"
                          stroke="#0f172a"
                          strokeWidth="3.5"
                          paintOrder="stroke"
                        >
                          {String(annotation.payload.label || 'Zone')}: {areaText}
                        </text>
                      </g>
                    );
                  }

                  // Render Leader Arrow
                  if (annotation.type === 'arrow' && points.length >= 2) {
                    return (
                      <g key={annotation.id}>
                        <polyline
                          points={screenCoords}
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="3"
                          strokeLinecap="round"
                          markerEnd="url(#arrowHead)"
                        />
                        {Boolean(annotation.payload.label) && (
                          <text
                            x={firstPt.x * 1000}
                            y={firstPt.y * 708 - 8}
                            fill="#c084fc"
                            fontSize="12"
                            fontWeight="bold"
                            stroke="#0f172a"
                            strokeWidth="3.5"
                            paintOrder="stroke"
                          >
                            {String(annotation.payload.label)}
                          </text>
                        )}
                      </g>
                    );
                  }

                  // Render Note
                  if (annotation.type === 'text' && showNotes) {
                    return (
                      <g key={annotation.id}>
                        <circle cx={firstPt.x * 1000} cy={firstPt.y * 708} r="6" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
                        <rect
                          x={firstPt.x * 1000 + 8}
                          y={firstPt.y * 708 - 18}
                          width="180"
                          height="24"
                          rx="4"
                          fill="#0f766e"
                        />
                        <text
                          x={firstPt.x * 1000 + 14}
                          y={firstPt.y * 708 - 2}
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {String(annotation.payload.text || 'Note')}
                        </text>
                      </g>
                    );
                  }

                  // Render Tag / Count Pin
                  if (annotation.type === 'pin') {
                    return (
                      <g key={annotation.id}>
                        <circle cx={firstPt.x * 1000} cy={firstPt.y * 708} r="14" fill="#0891b2" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={firstPt.x * 1000}
                          y={firstPt.y * 708 + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {String(annotation.payload.label || '1').slice(0, 4)}
                        </text>
                      </g>
                    );
                  }

                  return null;
                })}

                {/* 2. Flashing Pins (Interactive Architectural Pins) */}
                {showFlashings && planFlashingPins.map((pin) => {
                  const cx = (pin.xPercent / 100) * 1000;
                  const cy = (pin.yPercent / 100) * 708;

                  return (
                    <g
                      key={pin.id}
                      onClick={() => {
                        setSelectedPinId(pin.id);
                        if (onOpenFlashingDesigner) {
                          onOpenFlashingDesigner(pin.profileId, pin.lengthLm);
                        }
                      }}
                      className="cursor-pointer group"
                    >
                      <circle cx={cx} cy={cy} r="16" fill="#d97706" stroke="#ffffff" strokeWidth="2.5" className="group-hover:scale-110 transition-transform" />
                      <path d={`M ${cx - 6} ${cy - 2} L ${cx} ${cy - 8} L ${cx + 6} ${cy - 2} L ${cx + 3} ${cy + 5} L ${cx - 3} ${cy + 5} Z`} fill="#ffffff" />
                      {/* Pin Callout Tag */}
                      <rect
                        x={cx + 18}
                        y={cy - 14}
                        width="110"
                        height="26"
                        rx="4"
                        fill="#0f172a"
                        stroke="#d97706"
                        strokeWidth="1.5"
                      />
                      <text x={cx + 24} y={cy - 1} fill="#fbbf24" fontSize="10" fontWeight="bold">
                        {pin.label} ({pin.lengthLm}m)
                      </text>
                      <text x={cx + 24} y={cy + 9} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                        {pin.girthTier || '301-450mm'}
                      </text>
                    </g>
                  );
                })}

                {/* 3. Live Draft In-Progress Points */}
                {draftPoints.length > 0 && (
                  <g>
                    {draftPoints.length > 1 && (
                      <polyline
                        points={draftPoints.map(p => `${p.x * 1000},${p.y * 708}`).join(' ')}
                        fill={activeTool === 'area_zone' ? '#16a34a' : 'none'}
                        fillOpacity={activeTool === 'area_zone' ? '0.15' : '0'}
                        stroke={activeTool === 'calibrate' ? '#b45309' : '#38bdf8'}
                        strokeWidth="3.5"
                        strokeDasharray={activeTool === 'calibrate' ? '8 4' : undefined}
                      />
                    )}
                    {draftPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x * 1000}
                        cy={pt.y * 708}
                        r="6"
                        fill="#ffffff"
                        stroke="#0284c7"
                        strokeWidth="3"
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Takeoff Register Drawer */}
        {showTakeoffDrawer && (
          <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4 shrink-0 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Sheet Takeoff Summary</h3>
                <p className="text-[11px] text-slate-500">{plan.sheetNumber} · Calibrated Takeoffs</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTakeoffDrawer(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flashing Takeoffs list */}
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block mb-2">
                Flashing Requirements ({planFlashingPins.length})
              </span>
              {planFlashingPins.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No flashing pins placed yet. Use the Flashing Pin tool.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {planFlashingPins.map(pin => (
                    <div key={pin.id} className="p-2 bg-amber-50/70 rounded-lg border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-950 block">{pin.label}</span>
                        <span className="text-[10px] text-amber-800">
                          {pin.lengthLm}m · {pin.girthTier} · {pin.quantity} pcs
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePin(pin.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete pin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linear Dimensions list */}
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block mb-2">
                Dimensions & Areas ({planAnnotations.length})
              </span>
              {planAnnotations.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No markups recorded on this sheet.</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {planAnnotations.map((ann, idx) => (
                    <div key={ann.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 block truncate">
                          {String(ann.payload.label || ann.payload.text || `Markup ${idx + 1}`)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ann.calibratedLengthMm ? `${(ann.calibratedLengthMm / 1000).toFixed(2)}m (slope)` : ''}
                          {ann.calibratedAreaM2 ? `${ann.calibratedAreaM2.toFixed(1)} m²` : ''}
                          {ann.type === 'pin' ? 'Tag marker' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnotation(ann.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete annotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flashing Pin Modal */}
      {pinModalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">Place Flashing Callout Pin</h4>
              </div>
              <button onClick={() => setPinModalState(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Flashing Label / ID *</label>
                <input
                  type="text"
                  value={pinModalState.label}
                  onChange={(e) => setPinModalState(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Architectural Profile Preset *</label>
                <select
                  value={pinModalState.profileId}
                  onChange={(e) => {
                    const preset = ARCHITECTURAL_FLASHING_PRESETS.find(p => p.id === e.target.value);
                    setPinModalState(prev => ({
                      ...prev,
                      profileId: e.target.value,
                      profileName: preset?.name || 'Custom Flashing'
                    }));
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-800"
                >
                  {ARCHITECTURAL_FLASHING_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Run Length (lm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={pinModalState.lengthLm}
                    onChange={(e) => {
                      const len = Number(e.target.value) || 1;
                      setPinModalState(prev => ({
                        ...prev,
                        lengthLm: len,
                        quantity: Math.max(1, Math.ceil(len / 3.0))
                      }));
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pieces (3.0m each)</label>
                  <input
                    type="number"
                    min="1"
                    value={pinModalState.quantity}
                    onChange={(e) => setPinModalState(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Girth Tier Matrix Category</label>
                <select
                  value={pinModalState.girthTier}
                  onChange={(e) => setPinModalState(prev => ({ ...prev, girthTier: e.target.value as FlashingGirthTier }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-semibold"
                >
                  <option value="0-150mm">0-150mm</option>
                  <option value="151-300mm">151-300mm</option>
                  <option value="301-450mm">301-450mm (Standard Apron / Ridge)</option>
                  <option value="451-600mm">451-600mm (Parapet / Wide Valley)</option>
                  <option value="601-900mm">601-900mm (Box Gutter)</option>
                  <option value="901-1200mm">901-1200mm (Full Sheet Blank)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPinModalState(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFlashingPin}
                className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Place Pin on Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
