import React, { useEffect, useMemo, useState } from 'react';
import { 
  BookOpen, 
  Check, 
  ClipboardList, 
  Plus, 
  Ruler, 
  ShoppingCart, 
  Pencil, 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Info,
  RotateCcw,
  MapPin
} from 'lucide-react';
import { FlashingDesigner } from './FlashingDesigner';
import { FlashingProfile, Project, FlashingGirthTier } from '../types/crm';
import { 
  DEFAULT_ARCHITECTURAL_PROFILES, 
  calculateFlashingEngineering, 
  FlashingCalculationSummary,
  classifyGirthTier
} from '../utils/sheetMetalGeometry';

type WorkshopView = 'library' | 'orders';

export interface FlashingOrderLine {
  id: string;
  projectId?: string;
  projectName?: string;
  profileId: string;
  profileName: string;
  quantity: number;
  pieceLengthLm: number;
  totalLinearMetres: number;
  girthTier?: FlashingGirthTier;
  developedBlankWidthMm?: number;
  notes?: string;
  createdAt: string;
  status: 'Draft' | 'Ready for production';
}

interface Props {
  view: WorkshopView;
  onChangeView: (view: WorkshopView) => void;
  projects: Project[];
  activeMemberName: string;
  project?: Project;
  onClose?: () => void;
  onPushToQuote?: (order: FlashingOrderLine) => void;
  onUpdateProject?: (project: Project) => void;
}

const LIBRARY_STORAGE_KEY = 'archtech_flashing_library';
const ORDER_STORAGE_KEY = 'archtech_flashing_orders';

function readStoredArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function makeId(prefix: string) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function developedLength(profile: FlashingProfile) {
  return profile.developedLengthMm || profile.segments.reduce((sum, segment) => sum + segment.lengthMm, 0);
}

function profilePreviewPoints(profile: FlashingProfile) {
  let points: { x: number; y: number }[];
  if (profile.geometryPointsMm?.length === profile.segments.length + 1) {
    points = profile.geometryPointsMm.slice(0, 15).map((point) => ({ x: point.x, y: -point.y }));
  } else {
    points = [{ x: 8, y: 44 }];
    let heading = 0;
    let x = 8;
    let y = 44;
    const segments = profile.segments.slice(0, 14);
    segments.forEach((segment, index) => {
      const length = Math.max(8, segment.lengthMm || 8);
      const scale = 145 / Math.max(1, segments.reduce((sum, item) => sum + Math.max(8, item.lengthMm || 8), 0));
      x += Math.cos(heading * Math.PI / 180) * length * scale;
      y -= Math.sin(heading * Math.PI / 180) * length * scale;
      points.push({ x, y });
      if (index < segments.length - 1) {
        const bend = Math.max(0, Math.min(180, 180 - (segment.angleDeg || 90)));
        heading += bend * (segment.turnDirection || 1);
      }
    });
  }
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scale = Math.min(210 / width, 66 / height);
  const offsetX = (240 - width * scale) / 2;
  const offsetY = (90 - height * scale) / 2;
  return points.map((point) => `${(offsetX + (point.x - minX) * scale).toFixed(1)},${(offsetY + (point.y - minY) * scale).toFixed(1)}`).join(' ');
}

export function ProfileThumbnail({ profile, large = false }: { profile: FlashingProfile; large?: boolean }) {
  return (
    <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 ${large ? 'h-28' : 'h-20'}`}>
      <svg viewBox="0 0 240 90" role="img" aria-label={`Cross-section drawing of ${profile.name}`} className="h-full w-full max-w-[280px] overflow-visible">
        <polyline points={profilePreviewPoints(profile)} fill="none" stroke="#0284c7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx="120" cy="45" r="2.5" fill="#0f172a" opacity="0.45" />
      </svg>
    </div>
  );
}

export const FlashingWorkshop: React.FC<Props> = ({ 
  view, 
  onChangeView, 
  projects, 
  activeMemberName, 
  project, 
  onClose,
  onPushToQuote,
  onUpdateProject
}) => {
  const [library, setLibrary] = useState<FlashingProfile[]>(() => {
    const stored = readStoredArray<FlashingProfile>(LIBRARY_STORAGE_KEY);
    return stored.length > 0 ? stored : DEFAULT_ARCHITECTURAL_PROFILES;
  });

  const [orders, setOrders] = useState<FlashingOrderLine[]>(() => readStoredArray<FlashingOrderLine>(ORDER_STORAGE_KEY));
  const [designerOpen, setDesignerOpen] = useState(false);
  const [workingProfiles, setWorkingProfiles] = useState<FlashingProfile[]>([]);
  const [initialProfileId, setInitialProfileId] = useState<string | null>(null);
  const [designerInstance, setDesignerInstance] = useState(0);

  // Order creation form state
  const [orderProfileId, setOrderProfileId] = useState('');
  const [quantity, setQuantity] = useState('4');
  const [pieceLengthLm, setPieceLengthLm] = useState('3.0');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderMessage, setOrderMessage] = useState('');

  // Workshop Cut Sheet Modal State
  const [cutSheetModalProfile, setCutSheetModalProfile] = useState<{
    profile: FlashingProfile;
    pieceCount: number;
    pieceLengthLm: number;
    orderNotes?: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!orderProfileId && library.length > 0) setOrderProfileId(library[0].id);
    if (orderProfileId && !library.some((profile) => profile.id === orderProfileId)) {
      setOrderProfileId(library[0]?.id || '');
    }
  }, [library, orderProfileId]);

  const baseProject = project || projects[0];
  const visibleOrders = project ? orders.filter((line) => line.projectId === project.id) : orders;

  const designerProject = useMemo(() => ({
    ...(baseProject || {}),
    projectNumber: baseProject?.projectNumber || 'ARCH-2026-041',
    material: baseProject?.material || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: baseProject?.colorName || 'FlaxPod',
    flashingProfiles: workingProfiles
  } as Project), [baseProject, workingProfiles]);

  const openBlankDesigner = () => {
    setWorkingProfiles([]);
    setInitialProfileId(null);
    setDesignerInstance((value) => value + 1);
    setDesignerOpen(true);
  };

  const openLibraryProfile = (profile: FlashingProfile) => {
    setWorkingProfiles([{ ...profile, segments: profile.segments.map((segment) => ({ ...segment })) }]);
    setInitialProfileId(profile.id);
    setDesignerInstance((value) => value + 1);
    setDesignerOpen(true);
  };

  const saveToLibrary = (profile: FlashingProfile) => {
    const name = profile.name.trim();
    if (!name || library.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) return 'duplicate';
    const nextLibrary = [profile, ...library];
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(nextLibrary));
    } catch (error) {
      console.error('Unable to persist flashing library to browser storage.', error);
      return 'storage-error';
    }
    setLibrary(nextLibrary);
    return 'saved';
  };

  const handleResetToStandards = () => {
    setLibrary(DEFAULT_ARCHITECTURAL_PROFILES);
    setOrderMessage('Reset library to 6 pre-engineered NZBC E2/AS1 standard profiles.');
  };

  const addOrderLine = (event: React.FormEvent) => {
    event.preventDefault();
    const profile = library.find((item) => item.id === orderProfileId);
    const count = Number(quantity);
    const length = Number(pieceLengthLm);

    if (!profile || !Number.isFinite(count) || count < 1 || !Number.isInteger(count) || !Number.isFinite(length) || length <= 0) {
      setOrderMessage('Choose a profile, whole-piece quantity, and length greater than zero.');
      return;
    }

    const legs = profile.segments.map(s => ({
      id: s.id,
      lengthMm: s.lengthMm,
      interiorAngleDeg: s.angleDeg,
      turnDirection: s.turnDirection,
      kind: (s.kind === 'hem' ? 'open_hem' : s.kind) as any
    }));
    const eng = calculateFlashingEngineering(legs, 'vitor_055', length, count);

    const line: FlashingOrderLine = {
      id: makeId('fl-order'),
      projectId: project?.id || baseProject?.id,
      projectName: project?.title || baseProject?.title,
      profileId: profile.id,
      profileName: profile.name,
      quantity: count,
      pieceLengthLm: length,
      totalLinearMetres: Math.round(count * length * 100) / 100,
      girthTier: eng.girthTier,
      developedBlankWidthMm: eng.developedBlankWidthMm,
      notes: orderNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'Ready for production'
    };

    setOrders((previous) => [line, ...previous]);
    setQuantity('4');
    setPieceLengthLm('3.0');
    setOrderNotes('');
    setOrderMessage(`Added ${line.totalLinearMetres}m of ${profile.name} (${eng.girthTier}) to production order.`);
  };

  const removeOrderLine = (id: string) => setOrders((previous) => previous.filter((line) => line.id !== id));

  const handleImportPlanPins = () => {
    const pins = project?.flashingPins || [];
    if (!pins.length) return;
    const newLines: FlashingOrderLine[] = pins.map((pin) => {
      const matchingProfile = library.find(p => p.id === pin.profileId) || library[0];
      const count = pin.quantity || Math.max(1, Math.ceil(pin.lengthLm / 3.0));
      const pieceLen = Math.round((pin.lengthLm / count) * 10) / 10 || 3.0;
      const legs = matchingProfile.segments.map(s => ({
        id: s.id,
        lengthMm: s.lengthMm,
        interiorAngleDeg: s.angleDeg,
        turnDirection: s.turnDirection,
        kind: (s.kind === 'hem' ? 'open_hem' : s.kind) as any
      }));
      const eng = calculateFlashingEngineering(legs, 'vitor_055', pieceLen, count);
      return {
        id: makeId('fl-order-pin'),
        projectId: project?.id || baseProject?.id,
        projectName: project?.title || baseProject?.title,
        profileId: matchingProfile.id,
        profileName: matchingProfile.name,
        quantity: count,
        pieceLengthLm: pieceLen,
        totalLinearMetres: Math.round(pin.lengthLm * 100) / 100,
        girthTier: pin.girthTier || eng.girthTier,
        developedBlankWidthMm: eng.developedBlankWidthMm,
        notes: `Imported from Drawing Pin: ${pin.label} (${pin.lengthLm} lm)`,
        createdAt: new Date().toISOString(),
        status: 'Ready for production'
      };
    });
    setOrders((prev) => [...newLines, ...prev]);
    setOrderMessage(`Imported ${newLines.length} flashing pins from architectural drawing!`);
  };

  const handlePushOrdersToJob = () => {
    if (!visibleOrders.length) return;
    const targetProj = project || baseProject;
    if (!targetProj) return;

    const items = visibleOrders.map((ord, idx) => ({
      id: `fl-item-${idx + 1}-${Date.now()}`,
      itemDescription: `${ord.profileName} (${ord.girthTier}) · ${ord.pieceLengthLm}m sticks · ${ord.notes || 'Cut to measure'}`,
      category: 'Flashings',
      quantity: ord.quantity,
      unit: '3.0m sticks',
      urgencyReason: 'Workshop batch order'
    }));

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `FL-WS-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: targetProj.id,
      projectNumber: targetProj.projectNumber,
      orderedBy: activeMemberName || 'Workshop Lead',
      supplier: 'The Roofing Store (Highbrook)' as const,
      orderDate: new Date().toISOString().split('T')[0],
      deliverySiteAddress: targetProj.siteAddress,
      status: 'Draft' as const,
      urgency: 'Standard Delivery' as const,
      items,
      deliveryEta: '2 business days'
    };

    if (onUpdateProject) {
      onUpdateProject({
        ...targetProj,
        materialOrders: [newOrder, ...(targetProj.materialOrders || [])]
      });
      setOrderMessage(`Pushed ${visibleOrders.length} flashing lines to Job Orders (#${newOrder.orderNumber})!`);
    } else {
      setOrderMessage(`Packaged ${visibleOrders.length} flashing lines as Job Material Order #${newOrder.orderNumber}!`);
    }
  };

  // Compute engineering for cut sheet modal
  const cutSheetEngineering: FlashingCalculationSummary | null = useMemo(() => {
    if (!cutSheetModalProfile) return null;
    const { profile, pieceCount, pieceLengthLm } = cutSheetModalProfile;
    const legs = profile.segments.map(s => ({
      id: s.id,
      lengthMm: s.lengthMm,
      interiorAngleDeg: s.angleDeg,
      turnDirection: s.turnDirection,
      kind: (s.kind === 'hem' ? 'open_hem' : s.kind) as any
    }));
    return calculateFlashingEngineering(legs, 'vitor_055', pieceLengthLm, pieceCount);
  }, [cutSheetModalProfile]);

  if (designerOpen) {
    return (
      <FlashingDesigner
        key={designerInstance}
        project={designerProject}
        activeMemberName={activeMemberName}
        onUpdateProject={(updated) => setWorkingProfiles(updated.flashingProfiles || [])}
        onClose={() => setDesignerOpen(false)}
        initialProfileId={initialProfileId}
        onSaveToLibrary={saveToLibrary}
      />
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            <Ruler className="h-4 w-4" /> Architectural Flashing Workshop
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {view === 'library' ? 'Flashing Library & Profiles' : 'Fabrication & Production Orders'}
          </h2>
          {project && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Active Project: <strong className="text-slate-800">{project.projectNumber} · {project.title}</strong>
            </p>
          )}
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Deterministic sheet metal folding calculations with bend deduction ($BD$), K-factor ($K=0.38$), girth tier classification, and automated brake press folding sequences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
              <X className="h-3.5 w-3.5" /> Back to job
            </button>
          )}
          {view === 'library' && (
            <>
              <button
                type="button"
                onClick={handleResetToStandards}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer hover:bg-slate-50"
                title="Restore standard architectural profiles"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Standard Presets
              </button>
              <button 
                onClick={openBlankDesigner} 
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Draw Custom Flashing
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => onChangeView('library')} 
          className={view === 'library' ? 'inline-flex items-center gap-2 border-b-2 border-sky-600 px-3 py-2.5 text-xs font-bold text-sky-800 cursor-pointer' : 'inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer'}
        >
          <BookOpen className="h-4 w-4" /> Profile Library <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono">{library.length}</span>
        </button>
        <button 
          onClick={() => onChangeView('orders')} 
          className={view === 'orders' ? 'inline-flex items-center gap-2 border-b-2 border-sky-600 px-3 py-2.5 text-xs font-bold text-sky-800 cursor-pointer' : 'inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer'}
        >
          <ClipboardList className="h-4 w-4" /> Production Orders <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono">{visibleOrders.length}</span>
        </button>
      </div>

      {/* Tab 1: Library View */}
      {view === 'library' ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {library.map((profile) => {
              const legs = profile.segments.map(s => ({
                id: s.id,
                lengthMm: s.lengthMm,
                interiorAngleDeg: s.angleDeg,
                turnDirection: s.turnDirection,
                kind: (s.kind === 'hem' ? 'open_hem' : s.kind) as any
              }));
              const eng = calculateFlashingEngineering(legs, 'vitor_055', 3.0, 1);

              return (
                <article key={profile.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">
                          {profile.category || 'Architectural Flashing'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">{profile.name}</h3>
                      </div>
                      <span className="rounded bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 text-[10px] font-mono font-bold shrink-0">
                        {eng.girthTier}
                      </span>
                    </div>

                    <div className="mt-3">
                      <ProfileThumbnail profile={profile} />
                    </div>

                    {/* Engineering Dimensions Strip */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[9px]">Nominal Leg Sum</span>
                        <span className="font-bold text-slate-900">{eng.nominalSumMm} mm</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                        <span className="text-emerald-700 block text-[9px] font-bold">True Blank Width</span>
                        <span className="font-bold text-emerald-950">{eng.developedBlankWidthMm} mm</span>
                      </div>
                    </div>

                    {/* Segments summary badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {profile.segments.map((segment, index) => (
                        <span key={segment.id} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                          L{index + 1}: {segment.lengthMm}mm {index < profile.segments.length - 1 ? `@ ${segment.angleDeg}°` : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setCutSheetModalProfile({
                        profile,
                        pieceCount: 4,
                        pieceLengthLm: 3.0,
                        orderNotes: `Standard 12lm run for ${profile.name}`
                      })}
                      className="text-sky-700 hover:text-sky-900 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cut Sheet & Bends
                    </button>

                    <button 
                      onClick={() => openLibraryProfile(profile)} 
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="h-3 w-3" /> Edit Drawing
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        /* Tab 2: Orders View */
        <section className="space-y-4">
          {/* Plan Flashing Pins Import Banner */}
          {Boolean(project?.flashingPins?.length) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-950 block">Architectural Plan Flashing Pins Available</span>
                  <span className="text-amber-800 text-[11px]">
                    {project?.flashingPins?.length} callout pins are pinned to the drawing takeoff (
                    {project?.flashingPins?.reduce((acc, p) => acc + (p.lengthLm || 0), 0).toFixed(1)} lm total).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleImportPlanPins}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Import all {project?.flashingPins?.length} Pins
              </button>
            </div>
          )}

          {/* Order Form */}
          <form onSubmit={addOrderLine} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-sky-700" />
                <h3 className="font-bold text-slate-900 text-sm">Add Production Order Line</h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Calculates true sheet utilization & brake sequence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Select Profile from Library *</label>
                <select
                  value={orderProfileId}
                  onChange={(e) => setOrderProfileId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold bg-white"
                >
                  {library.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.segments.length} legs · blank {developedLength(p)}mm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity (pieces) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Length per piece (m) *</label>
                <input
                  type="number"
                  min="0.5"
                  max="12.0"
                  step="0.1"
                  required
                  value={pieceLengthLm}
                  onChange={(e) => setPieceLengthLm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Location Reference</label>
              <input
                type="text"
                placeholder="e.g. North Gable Rake · Color FlaxPod · 150mm upstand"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="font-mono text-slate-700">
                Total Required: <strong className="text-slate-900 font-bold">{(Number(quantity) || 0) * (Number(pieceLengthLm) || 0)} linear metres</strong>
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Order
              </button>
            </div>

            {orderMessage && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">{orderMessage}</p>
            )}
          </form>

          {/* Order Lines Register */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 bg-slate-50 text-xs font-bold text-slate-800">
              <div>
                <span>Production Order Lines ({visibleOrders.length})</span>
                <span className="font-mono text-slate-500 ml-2">
                  {visibleOrders.reduce((acc, l) => acc + l.totalLinearMetres, 0).toFixed(1)} Total Linear Metres
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePushOrdersToJob}
                  disabled={visibleOrders.length === 0}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Push to Job Orders
                </button>
              </div>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No flashing order lines placed yet. Select a library profile above to start.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleOrders.map((line) => {
                  const orderedProfile = library.find((p) => p.id === line.profileId);
                  return (
                    <div key={line.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-32 shrink-0">
                          {orderedProfile ? (
                            <ProfileThumbnail profile={orderedProfile} />
                          ) : (
                            <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                              Profile
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{line.profileName}</h4>
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[10px] font-bold">
                              {line.girthTier || '301-450mm'}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5">
                            {line.quantity} pieces × {line.pieceLengthLm} m = <strong className="text-slate-900 font-bold">{line.totalLinearMetres} lm</strong>
                          </p>
                          {line.notes && <p className="text-slate-500 text-[11px] mt-0.5">{line.notes}</p>}
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            Status: <strong className="text-emerald-700">{line.status}</strong> · Created {new Date(line.createdAt).toLocaleDateString('en-NZ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {orderedProfile && (
                          <button
                            type="button"
                            onClick={() => setCutSheetModalProfile({
                              profile: orderedProfile,
                              pieceCount: line.quantity,
                              pieceLengthLm: line.pieceLengthLm,
                              orderNotes: line.notes
                            })}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sky-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cut Sheet
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeOrderLine(line.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove line"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Workshop Fabrication Cut Sheet Modal */}
      {cutSheetModalProfile && cutSheetEngineering && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-sky-700 uppercase">
                  Archtech Workshop Sheet · Brake Press Specification
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {cutSheetModalProfile.profile.name}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Project: {project?.projectNumber || 'ARCH-2026-041'} ({project?.title || 'Matakana Coastal Ridge'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCutSheetModalProfile(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Large Cross-Section Drawing */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
              <ProfileThumbnail profile={cutSheetModalProfile.profile} large />
              <div className="flex items-center gap-4 mt-2 font-mono text-[11px]">
                <span className="text-slate-600">
                  Nominal Leg Sum: <strong>{cutSheetEngineering.nominalSumMm}mm</strong>
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-bold">
                  True Blank Width: {cutSheetEngineering.developedBlankWidthMm}mm (BD: -{cutSheetEngineering.totalBendDeductionMm}mm)
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-sky-800 font-bold">
                  Girth Tier: {cutSheetEngineering.girthTier}
                </span>
              </div>
            </div>

            {/* Material & Coil Specification */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[9px]">Material Spec</span>
                <span className="font-bold text-slate-900">{cutSheetEngineering.materialSpec.name}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[9px]">Thickness / Gauge</span>
                <span className="font-bold text-slate-900">{cutSheetEngineering.materialSpec.thicknessMm} mm</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[9px]">Coil Slit Width</span>
                <span className="font-bold text-slate-900">{cutSheetEngineering.recommendedSlitWidthMm} mm (waste: {cutSheetEngineering.slittingWasteMm}mm)</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[9px]">Total Weight</span>
                <span className="font-bold text-slate-900">{cutSheetEngineering.totalWeightKg} kg</span>
              </div>
            </div>

            {/* Step-by-Step Folding Sequence Table */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs mb-2">
                Folding Sequence Table (Operator Instructions)
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Fold Type</th>
                      <th className="py-2 px-3 text-center">Bend Direction</th>
                      <th className="py-2 px-3 text-right">Bend Angle</th>
                      <th className="py-2 px-3 text-right">Backgauge Stop</th>
                      <th className="py-2 px-3 font-sans">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cutSheetEngineering.bendSteps.map((step) => (
                      <tr key={step.stepNumber} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{step.stepNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{step.foldType}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${step.bendDirection === 'UP' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>
                            {step.bendDirection}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{step.bendAngleDeg}°</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-700">{step.stopPositionMm} mm</td>
                        <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">{step.notes}</td>
                      </tr>
                    ))}
                    {cutSheetEngineering.bendSteps.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          Single flat leg profile — no bends required.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cut Sheet Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-mono">
                Order: {cutSheetModalProfile.pieceCount} pcs × {cutSheetModalProfile.pieceLengthLm}m = {cutSheetEngineering.totalLinearMetres} lm
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cutSheetEngineering, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `${cutSheetModalProfile.profile.name.replace(/\s+/g, '_')}_CAD_SPEC.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Workshop Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};