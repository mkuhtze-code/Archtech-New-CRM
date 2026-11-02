import React, { useState, useMemo, useEffect } from 'react';
import {
  Project,
  TeamMember,
  SiteTask,
  SitePhoto,
  OnsiteMaterialOrder,
  ArchitecturalPlan,
  SiteScheduleEvent,
  AccessLayer,
  SiteMeasureRecord,
  SiteMeasureLineItem,
  SubstrateChecklist
} from '../types/crm';

import {
  MapPin,
  Phone,
  Mail,
  Building,
  Users,
  CheckSquare,
  Square,
  Plus,
  FileText,
  Camera,
  ShoppingCart,
  Calendar,
  ChevronRight,
  Layers,
  Ruler,
  AlertTriangle,
  Settings2,
  X,
  Image,
  ExternalLink,
  ClipboardList,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  Sliders,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';
import { FlashingWorkshop } from './FlashingWorkshop';
import { PlanMarkupTool } from './PlanMarkupTool';
import { calculateSlopeDistanceMm } from '../utils/planGeometry';
import { ARCHITECTURAL_FLASHING_PRESETS } from '../utils/sheetMetalGeometry';
import { ArchtechLogo } from './ArchtechLogo';

interface Props {
  projects: Project[];
  onUpdateProject: (project: Project) => void;
  initialProjectId?: string;
  teamMembers?: TeamMember[];
  onOpenAdvanced?: (projectId: string) => void;
}

type HubSection = 'home' | 'tasks' | 'survey' | 'files' | 'orders' | 'photos' | 'flashings' | 'more';

function resolveAccessLayer(member?: TeamMember): AccessLayer {
  if (member?.accessLayer) return member.accessLayer;
  if (!member) return 'standard';
  if (member.authority.canSignPS3 || member.authority.canEditAuthorities) return 'full';
  if (member.authority.canOrderMaterials || member.authority.canLogMeasures) return 'standard';
  if (member.role === 'Project Coordinator') return 'office';
  return 'light';
}

export const OnsiteJobHub: React.FC<Props> = ({
  projects,
  onUpdateProject,
  initialProjectId,
  teamMembers = [],
  onOpenAdvanced
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId || projects[0]?.id || ''
  );
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  const [activeMemberId, setActiveMemberId] = useState(
    teamMembers[0]?.id || ''
  );
  const activeMember =
    teamMembers.find((m) => m.id === activeMemberId) || teamMembers[0];
  const accessLayer = resolveAccessLayer(activeMember);

  const [section, setSection] = useState<HubSection>('home');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [flashingView, setFlashingView] = useState<'library' | 'orders'>('library');
  const [selectedPlanForMarkup, setSelectedPlanForMarkup] = useState<ArchitecturalPlan | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Pitch & Slope Calculator states
  const [calcRunMm, setCalcRunMm] = useState<number>(6000);
  const [calcPitchDeg, setCalcPitchDeg] = useState<number>(15);
  const [showAddMeasureModal, setShowAddMeasureModal] = useState<boolean>(false);
  const [newMeasureRef, setNewMeasureRef] = useState<string>('');
  const [newMeasureCategory, setNewMeasureCategory] = useState<SiteMeasureLineItem['category']>('Barge');
  const [newMeasureLengthMm, setNewMeasureLengthMm] = useState<number>(6212);
  const [newMeasurePitch, setNewMeasurePitch] = useState<number>(15);
  const [newMeasureMethod, setNewMeasureMethod] = useState<'laser' | 'tape' | 'plan' | 'estimate'>('laser');
  const [newMeasurePresetId, setNewMeasurePresetId] = useState<string>('f-barge-roll');
  const [newMeasureNotes, setNewMeasureNotes] = useState<string>('');

  // Initial site survey state with local draft recovery
  const [surveyRecord, setSurveyRecord] = useState<SiteMeasureRecord>(() => {
    const projAny = selectedProject as Project & { siteSurvey?: SiteMeasureRecord };
    if (projAny?.siteSurvey) return projAny.siteSurvey;
    try {
      const saved = localStorage.getItem(`archtech_survey_${selectedProject?.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: `survey-${selectedProject.id}`,
      projectId: selectedProject.id,
      date: new Date().toISOString().split('T')[0],
      surveyor: activeMember?.name || 'Archtech Lead Detailer',
      status: 'draft',
      weatherConditions: 'Clear, 16°C, Light NW Breeze',
      substrateChecklist: {
        timberMoisturePercent: 14.5,
        moistureCompliant: true,
        substrateType: '17mm CD Structural Plywood',
        expansionGapsChecked: true,
        underlayTapedLapsChecked: true,
        ventilationCavityChecked: true,
        notes: 'Substrate laid staggered with 3-4mm expansion gaps. Moisture <18% compliant with NZBC E2/AS1.'
      },
      lineItems: [
        {
          id: 'ml-01',
          category: 'Ridge',
          reference: 'Main Ridge Apex (Grid 1 to 5)',
          measuredLengthMm: 14200,
          planLengthMm: 14000,
          pitchDegrees: 15,
          method: 'laser',
          linkedFlashingPresetId: 'f-ventilated-ridge',
          notes: 'Allow 200mm overlap for gable barge intersection'
        },
        {
          id: 'ml-02',
          category: 'Barge',
          reference: 'North Gable Barge (True Rake)',
          measuredLengthMm: 6850,
          planLengthMm: 6610,
          pitchDegrees: 15,
          method: 'laser',
          linkedFlashingPresetId: 'f-barge-roll',
          notes: 'True raking slope length (15° multiplier 1.0353x)'
        },
        {
          id: 'ml-03',
          category: 'Apron',
          reference: 'Upper Storey Abutment High Wall',
          measuredLengthMm: 8400,
          planLengthMm: 8400,
          pitchDegrees: 15,
          method: 'tape',
          linkedFlashingPresetId: 'f-apron-e2as1',
          notes: 'Cladding kick-out 85mm clearance above pans verified'
        },
        {
          id: 'ml-04',
          category: 'Parapet',
          reference: 'East Parapet Capping',
          measuredLengthMm: 18600,
          planLengthMm: 18500,
          pitchDegrees: 5,
          method: 'laser',
          linkedFlashingPresetId: 'f-parapet-capping',
          notes: '5° slope inwards to roof pan drainage'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // Keep survey synchronized when project changes
  useEffect(() => {
    const projAny = selectedProject as Project & { siteSurvey?: SiteMeasureRecord };
    if (projAny?.siteSurvey) {
      setSurveyRecord(projAny.siteSurvey);
    } else {
      try {
        const saved = localStorage.getItem(`archtech_survey_${selectedProject?.id}`);
        if (saved) {
          setSurveyRecord(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }
  }, [selectedProject?.id]);

  // Offline draft persistence
  useEffect(() => {
    if (selectedProject?.id && surveyRecord) {
      try {
        localStorage.setItem(`archtech_survey_${selectedProject.id}`, JSON.stringify(surveyRecord));
      } catch {
        // ignore storage errors
      }
    }
  }, [surveyRecord, selectedProject?.id]);

  const triggerNotice = (msg: string) => {
    setSyncNotice(msg);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  // Derive tasks from project (stored in a flexible way on activity or custom field)
  const tasks: SiteTask[] = useMemo(() => {
    const anyProj = selectedProject as Project & { siteTasks?: SiteTask[] };
    return anyProj?.siteTasks || [];
  }, [selectedProject]);

  const schedule: SiteScheduleEvent[] =
    selectedProject?.fieldSchedule?.slice(0, 5) || [];
  const orders: OnsiteMaterialOrder[] =
    selectedProject?.materialOrders || [];
  const plans: ArchitecturalPlan[] =
    selectedProject?.architecturalPlans ||
    selectedProject?.plans ||
    [];
  const photos: SitePhoto[] =
    selectedProject?.sitePhotos || selectedProject?.photos || [];

  const openTaskCount = tasks.filter((t) => t.status === 'open').length;

  const canCreateTasks =
    accessLayer === 'standard' ||
    accessLayer === 'full' ||
    accessLayer === 'office';
  const canManageOrders = accessLayer === 'full' || accessLayer === 'office';

  const handleToggleTask = (taskId: string) => {
    const anyProj = selectedProject as Project & { siteTasks?: SiteTask[] };
    const current = anyProj.siteTasks || [];
    const updated = current.map((t) => {
      if (t.id !== taskId) return t;
      const nextStatus = t.status === 'open' ? 'done' : 'open';
      return {
        ...t,
        status: nextStatus as 'open' | 'done',
        completedAt:
          nextStatus === 'done'
            ? new Date().toISOString().slice(0, 16).replace('T', ' ')
            : undefined,
        completedBy: nextStatus === 'done' ? activeMember?.name : undefined
      };
    });
    onUpdateProject({
      ...selectedProject,
      siteTasks: updated
    } as Project);
    triggerNotice(
      nextStatusLabel(updated.find((t) => t.id === taskId)?.status)
    );
  };

  const nextStatusLabel = (s?: string) =>
    s === 'done' ? 'Task marked done' : 'Task reopened';

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !canCreateTasks) return;
    const anyProj = selectedProject as Project & { siteTasks?: SiteTask[] };
    const current = anyProj.siteTasks || [];
    const task: SiteTask = {
      id: `task-${Date.now()}`,
      projectId: selectedProject.id,
      title: newTaskTitle.trim(),
      status: 'open',
      createdBy: activeMember?.name || 'Office',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      priority: 'normal'
    };
    onUpdateProject({
      ...selectedProject,
      siteTasks: [task, ...current]
    } as Project);
    setNewTaskTitle('');
    setShowAddTask(false);
    triggerNotice('Task added');
  };

  const handleSaveSurvey = (updated: SiteMeasureRecord) => {
    setSurveyRecord(updated);
    const anyProj = selectedProject as Project & { siteSurvey?: SiteMeasureRecord };
    onUpdateProject({ ...anyProj, siteSurvey: updated });
    triggerNotice('Survey record saved to project');
  };

  const handleAddMeasureItem = () => {
    if (!newMeasureRef || !newMeasureLengthMm) return;
    const newItem: SiteMeasureLineItem = {
      id: `meas-${Date.now()}`,
      category: newMeasureCategory,
      reference: newMeasureRef,
      measuredLengthMm: Number(newMeasureLengthMm),
      planLengthMm: Number(newMeasureLengthMm),
      pitchDegrees: Number(newMeasurePitch),
      method: newMeasureMethod,
      linkedFlashingPresetId: newMeasurePresetId,
      notes: newMeasureNotes
    };
    const nextSurvey: SiteMeasureRecord = {
      ...surveyRecord,
      lineItems: [...(surveyRecord.lineItems || []), newItem],
      updatedAt: new Date().toISOString()
    };
    handleSaveSurvey(nextSurvey);
    setShowAddMeasureModal(false);
    setNewMeasureRef('');
    setNewMeasureNotes('');
  };

  const handleDeleteMeasureItem = (id: string) => {
    const nextSurvey: SiteMeasureRecord = {
      ...surveyRecord,
      lineItems: (surveyRecord.lineItems || []).filter((i) => i.id !== id),
      updatedAt: new Date().toISOString()
    };
    handleSaveSurvey(nextSurvey);
  };

  const handlePushMeasuresToOrders = () => {
    const lines = surveyRecord.lineItems || [];
    if (!lines.length) {
      triggerNotice('No measured line items to order');
      return;
    }
    const orderItems = lines.map((item, idx) => {
      const len = item.measuredLengthMm || item.lengthMm || 3000;
      const ref = item.reference || item.name || 'Flashing Run';
      const sticks = Math.ceil((len + 150) / 3000);
      return {
        id: `ord-item-${idx + 1}-${Date.now()}`,
        itemDescription: `${item.category} Flashing - ${ref} (${len}mm)`,
        category: 'Flashings',
        quantity: sticks,
        unit: '3.0m sticks',
        urgencyReason: 'Fabrication order from verified site measures'
      };
    });

    const newOrder: OnsiteMaterialOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `FL-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: selectedProject.id,
      projectNumber: selectedProject.projectNumber,
      orderedBy: activeMember?.name || 'Lead Installer',
      supplier: 'The Roofing Store (Albany)',
      orderDate: new Date().toISOString().split('T')[0],
      deliverySiteAddress: selectedProject.siteAddress,
      status: 'Draft',
      urgency: 'Standard Delivery',
      items: orderItems,
      deliveryEta: '2 business days'
    };

    const currentOrders = selectedProject.materialOrders || [];
    onUpdateProject({
      ...selectedProject,
      materialOrders: [newOrder, ...currentOrders]
    });
    triggerNotice(`Created Flashing Order #${newOrder.orderNumber} with ${orderItems.length} lines!`);
    setSection('orders');
  };

  const handleSignoffSurvey = () => {
    const nextSurvey: SiteMeasureRecord = {
      ...surveyRecord,
      status: 'approved',
      signedOffBy: activeMember?.name || 'Lead Detailer',
      approvedBy: activeMember?.name || 'Lead Detailer',
      signedOffAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    handleSaveSurvey(nextSurvey);
    triggerNotice(`Survey officially approved by ${nextSurvey.approvedBy}`);
  };

  if (!selectedProject) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No jobs available.
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-xl mx-auto space-y-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-4">
      {syncNotice && (
        <div role="status" aria-live="polite" className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {syncNotice}
        </div>
      )}

      {/* Archtech Trade Brand Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <ArchtechLogo variant="dark" className="h-8 sm:h-9 w-auto max-w-[200px] object-left" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30 uppercase tracking-wider">
            Field Hub
          </span>
          <span className="text-[10px] text-emerald-400 font-medium items-center gap-1 font-mono hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Job picker + identity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                {selectedProject.projectNumber}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                On site
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {selectedProject.title}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{selectedProject.siteAddress}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Job
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSection('home');
                }}
                className="w-full sm:w-52 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} · {p.title.slice(0, 28)}
                  </option>
                ))}
              </select>
            </div>
            {teamMembers.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  You
                </label>
                <select
                  value={activeMemberId}
                  onChange={(e) => setActiveMemberId(e.target.value)}
                  className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple section nav */}
      <div className="hidden sm:block bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {(
            [
              { id: 'home' as const, label: 'Home', icon: Building },
              {
                id: 'tasks' as const,
                label: 'Tasks',
                icon: CheckSquare,
                badge: openTaskCount || undefined
              },
              { id: 'survey' as const, label: 'Site Survey', icon: Ruler },
              { id: 'files' as const, label: 'Plans', icon: FileText },
              { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
              { id: 'photos' as const, label: 'Photos', icon: Camera },
              { id: 'flashings' as const, label: 'Flashings', icon: Layers },
              { id: 'more' as const, label: 'More', icon: Settings2 }
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {'badge' in item && item.badge ? (
                  <span
                    className={`text-[10px] font-mono px-1.5 rounded-full ${
                      active
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* HOME */}
      {section === 'home' && (
        <div className="space-y-4">
          {/* Contacts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Contacts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <ContactRow
                label="Client"
                name={selectedProject.clientName}
                phone={selectedProject.clientPhone}
                email={selectedProject.clientEmail}
              />
              <ContactRow
                label="Builder"
                name={selectedProject.builder || selectedProject.headContractor}
              />
              <ContactRow label="Architect" name={selectedProject.architect} />
              <ContactRow
                label="Archtech"
                name={activeMember?.name || '—'}
                phone={activeMember?.phone}
                email={activeMember?.email}
              />
            </div>
          </div>

          {/* Schedule snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                What’s on
              </h2>
            </div>
            {schedule.length === 0 ? (
              <p className="text-xs text-slate-500">Nothing scheduled yet.</p>
            ) : (
              <ul className="space-y-2">
                {schedule.map((evt) => (
                  <li
                    key={evt.id}
                    className="flex items-start justify-between gap-2 text-xs border border-slate-100 rounded-lg p-2.5"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {evt.title}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {evt.type}
                        {evt.crewAssigned?.length
                          ? ` · ${evt.crewAssigned.join(', ')}`
                          : ''}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 shrink-0">
                      {evt.date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Open tasks preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Open tasks
              </h2>
              <button
                onClick={() => setSection('tasks')}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                All tasks <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {tasks.filter((t) => t.status === 'open').length === 0 ? (
              <p className="text-xs text-slate-500">No open tasks.</p>
            ) : (
              <ul className="space-y-1.5">
                {tasks
                  .filter((t) => t.status === 'open')
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className="w-full flex items-center gap-2 text-left text-xs p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-800 font-medium">
                          {t.title}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Progress" value={`${selectedProject.progressPercent || 0}%`} />
            <StatCard label="Orders" value={String(orders.length)} />
            <StatCard label="Plans" value={String(plans.length)} />
            <StatCard label="Photos" value={String(photos.length)} />
          </div>
        </div>
      )}

      {/* TASKS */}
      {section === 'tasks' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tasks</h2>
              <p className="text-[11px] text-slate-500">
                Keep the crew aligned. Check off when done.
              </p>
            </div>
            {canCreateTasks && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          {showAddTask && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-2">
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="What needs doing?"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
              />
              <button
                onClick={handleAddTask}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <ul className="divide-y divide-slate-100">
            {tasks.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-slate-500">
                No tasks yet.
                {canCreateTasks ? ' Add one above.' : ''}
              </li>
            )}
            {tasks.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => handleToggleTask(t.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
                >
                  {t.status === 'done' ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold ${
                        t.status === 'done'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-900'
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {t.createdBy}
                      {t.completedBy ? ` · done by ${t.completedBy}` : ''}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SITE SURVEY & FIELD MEASUREMENTS */}
      {section === 'survey' && (
        <div className="space-y-3">
          {/* Survey Header & Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Digital Site Survey</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      surveyRecord.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : surveyRecord.status === 'reviewed'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {surveyRecord.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Surveyed by {surveyRecord.surveyor} · {surveyRecord.date}
                  {surveyRecord.approvedBy && ` · Approved by ${surveyRecord.approvedBy}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {surveyRecord.status !== 'approved' && canManageOrders && (
                  <button
                    onClick={handleSignoffSurvey}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Sign-off Survey
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>

            {/* Weather & Conditions bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Weather & On-Site Conditions
                </label>
                <input
                  type="text"
                  value={surveyRecord.weatherConditions || ''}
                  onChange={(e) =>
                    handleSaveSurvey({ ...surveyRecord, weatherConditions: e.target.value })
                  }
                  placeholder="e.g. Overcast, 15°C, Dry substrate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Lead Surveyor / Detailer
                </label>
                <input
                  type="text"
                  value={surveyRecord.surveyor}
                  onChange={(e) =>
                    handleSaveSurvey({ ...surveyRecord, surveyor: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Substrate & Readiness Pre-Check */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Substrate &amp; Readiness Pre-Check
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  (surveyRecord.substrateChecklist?.timberMoisturePercent || 0) <= 18
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                Moisture: {surveyRecord.substrateChecklist?.timberMoisturePercent || 15}%{' '}
                {(surveyRecord.substrateChecklist?.timberMoisturePercent || 0) <= 18
                  ? '✓ Dry (<18% MC)'
                  : '⚠ High (>18% MC)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Substrate Material
                </label>
                <select
                  value={surveyRecord.substrateChecklist?.substrateType || '17mm CD Structural Plywood'}
                  onChange={(e) =>
                    handleSaveSurvey({
                      ...surveyRecord,
                      substrateChecklist: {
                        ...surveyRecord.substrateChecklist!,
                        substrateType: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="17mm CD Structural Plywood">17mm CD Structural Plywood</option>
                  <option value="19mm CD Structural Plywood">19mm CD Structural Plywood</option>
                  <option value="Timber Purlins (90x45 SG8)">Timber Purlins (90x45 SG8)</option>
                  <option value="Steel Top-Hat Purlins (0.95mm BMT)">Steel Top-Hat Purlins (0.95mm BMT)</option>
                  <option value="Rigid Air Barrier (RAB Board)">Rigid Air Barrier (RAB Board)</option>
                  <option value="Cavity Battens over Building Wrap">Cavity Battens over Building Wrap</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Timber / Ply Moisture %
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={surveyRecord.substrateChecklist?.timberMoisturePercent || 14.5}
                  onChange={(e) =>
                    handleSaveSurvey({
                      ...surveyRecord,
                      substrateChecklist: {
                        ...surveyRecord.substrateChecklist!,
                        timberMoisturePercent: Number(e.target.value),
                        moistureCompliant: Number(e.target.value) <= 18
                      }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Checkbox verification items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={surveyRecord.substrateChecklist?.expansionGapsChecked ?? true}
                  onChange={(e) =>
                    handleSaveSurvey({
                      ...surveyRecord,
                      substrateChecklist: {
                        ...surveyRecord.substrateChecklist!,
                        expansionGapsChecked: e.target.checked
                      }
                    })
                  }
                  className="rounded text-sky-600 w-3.5 h-3.5"
                />
                <span className="text-slate-700 text-[11px] font-medium">3-4mm Ply Gaps Checked</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={surveyRecord.substrateChecklist?.underlayTapedLapsChecked ?? true}
                  onChange={(e) =>
                    handleSaveSurvey({
                      ...surveyRecord,
                      substrateChecklist: {
                        ...surveyRecord.substrateChecklist!,
                        underlayTapedLapsChecked: e.target.checked
                      }
                    })
                  }
                  className="rounded text-sky-600 w-3.5 h-3.5"
                />
                <span className="text-slate-700 text-[11px] font-medium">Underlay Taped Laps</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={surveyRecord.substrateChecklist?.ventilationCavityChecked ?? true}
                  onChange={(e) =>
                    handleSaveSurvey({
                      ...surveyRecord,
                      substrateChecklist: {
                        ...surveyRecord.substrateChecklist!,
                        ventilationCavityChecked: e.target.checked
                      }
                    })
                  }
                  className="rounded text-sky-600 w-3.5 h-3.5"
                />
                <span className="text-slate-700 text-[11px] font-medium">Ventilation Cavity</span>
              </label>
            </div>
          </div>

          {/* Rafter Pitch & True Slope Calculator */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Rafter Pitch & Slope Length Calculator
                </h3>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Factor: {(1 / Math.cos((calcPitchDeg * Math.PI) / 180)).toFixed(4)}x
              </span>
            </div>

            {/* Glove-friendly pitch buttons */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Quick Pitch Selector
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {[3, 5, 10, 15, 25, 35, 45].map((pitch) => (
                  <button
                    key={pitch}
                    onClick={() => setCalcPitchDeg(pitch)}
                    className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      calcPitchDeg === pitch
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pitch}°
                  </button>
                ))}
              </div>
            </div>

            {/* Plan run input and resulting true slope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Horizontal Plan Run (mm)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="50"
                    value={calcRunMm}
                    onChange={(e) => setCalcRunMm(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs font-semibold"
                  />
                  <button
                    onClick={() => setCalcRunMm((r) => r + 500)}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono"
                  >
                    +500
                  </button>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-sky-800 uppercase">
                    Calculated Slope Length
                  </div>
                  <div className="font-mono text-lg font-bold text-sky-950 mt-0.5">
                    {calculateSlopeDistanceMm(calcRunMm, calcPitchDeg).slopeMm} mm
                  </div>
                  <div className="text-[10px] text-sky-700">
                    +{calculateSlopeDistanceMm(calcRunMm, calcPitchDeg).slopeMm - calcRunMm} mm rake extension
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewMeasureRef(`Rake Run (${calcPitchDeg}°)`);
                    setNewMeasureCategory('Barge');
                    setNewMeasureLengthMm(calculateSlopeDistanceMm(calcRunMm, calcPitchDeg).slopeMm);
                    setNewMeasurePitch(calcPitchDeg);
                    setShowAddMeasureModal(true);
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add to Register
                </button>
              </div>
            </div>
          </div>

          {/* Measured Lines Register */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Site Measurements Register</h3>
                <p className="text-[11px] text-slate-500">
                  {(surveyRecord.lineItems || []).length} lines logged · Total lineal:{' '}
                  {(
                    (surveyRecord.lineItems || []).reduce(
                      (acc, curr) => acc + (curr.measuredLengthMm || curr.lengthMm || 0),
                      0
                    ) / 1000
                  ).toFixed(2)}{' '}
                  lm
                </p>
              </div>

              <button
                onClick={() => {
                  setNewMeasureRef('');
                  setNewMeasureLengthMm(6000);
                  setNewMeasureNotes('');
                  setShowAddMeasureModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </button>
            </div>

            {(surveyRecord.lineItems || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No site measures recorded yet. Click "Add Line" or calculate slope from above.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(surveyRecord.lineItems || []).map((item) => {
                  const preset = ARCHITECTURAL_FLASHING_PRESETS.find(
                    (p) => p.id === item.linkedFlashingPresetId || p.id === item.linkedFlashingProfileId
                  );
                  const len = item.measuredLengthMm || item.lengthMm || 0;
                  const planLen = item.planLengthMm || len;
                  const delta = len - planLen;
                  const refName = item.reference || item.name || 'Measured Line';
                  return (
                    <li key={item.id} className="p-3 hover:bg-slate-50/50 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                              {item.category}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {refName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {item.pitchDegrees ?? 0}° pitch
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 rounded ${
                                item.method === 'laser' || item.method === 'laser_edm'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.method === 'tape' || item.method === 'tape_manual'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {(item.method || 'laser').toUpperCase()}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5 italic">{item.notes}</p>
                          )}
                          {preset && (
                            <div className="text-[10px] text-sky-700 font-medium mt-1 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              Linked Profile: {preset.name} ({preset.girthTier || '301-450mm'})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-slate-900">
                              {len.toLocaleString()} mm
                            </div>
                            {item.planLengthMm !== undefined && (
                              <div className="text-[10px] text-slate-400">
                                Plan: {planLen.toLocaleString()} mm
                                {delta !== 0 && (
                                  <span
                                    className={`ml-1 font-semibold ${
                                      delta > 0 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    ({delta > 0 ? `+${delta}` : delta})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteMeasureItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Delete measurement"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Unified Workflow Push Actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Connected Fabrication & Take-off
              </div>
              <p className="text-[11px] text-slate-500">
                Turn your verified site measurements directly into workshop orders or mark them up on the CAD plan.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePushMeasuresToOrders}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Push to Material Orders
              </button>

              <button
                onClick={() => {
                  if (plans.length > 0) {
                    setSelectedPlanForMarkup(plans[0]);
                  }
                  setSection('files');
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Mark up Plan (RC-01)
              </button>
            </div>
          </div>

          {/* Add Measure Item Modal */}
          {showAddMeasureModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-sky-600" />
                    Log Field Measurement
                  </h3>
                  <button
                    onClick={() => setShowAddMeasureModal(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Reference / Location Description
                    </label>
                    <input
                      type="text"
                      value={newMeasureRef}
                      onChange={(e) => setNewMeasureRef(e.target.value)}
                      placeholder="e.g. North Barge (Grid 1 to 4)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Category
                      </label>
                      <select
                        value={newMeasureCategory}
                        onChange={(e) =>
                          setNewMeasureCategory(e.target.value as SiteMeasureLineItem['category'])
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                      >
                        {['Ridge', 'Barge', 'Eaves', 'Valley', 'Apron', 'Parapet', 'Cladding', 'Custom'].map(
                          (cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Measurement Method
                      </label>
                      <select
                        value={newMeasureMethod}
                        onChange={(e) =>
                          setNewMeasureMethod(
                            e.target.value as 'laser' | 'tape' | 'plan' | 'estimate'
                          )
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                      >
                        <option value="laser">Laser Measure</option>
                        <option value="tape">Steel Tape</option>
                        <option value="plan">Plan Takeoff</option>
                        <option value="estimate">Field Estimate</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Measured Length (mm)
                      </label>
                      <input
                        type="number"
                        value={newMeasureLengthMm}
                        onChange={(e) => setNewMeasureLengthMm(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Pitch (Degrees)
                      </label>
                      <input
                        type="number"
                        value={newMeasurePitch}
                        onChange={(e) => setNewMeasurePitch(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Link Architectural Flashing Preset
                    </label>
                    <select
                      value={newMeasurePresetId}
                      onChange={(e) => setNewMeasurePresetId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    >
                      {ARCHITECTURAL_FLASHING_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} ({preset.girthTier})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Surveyor Notes / Splice Allowance
                    </label>
                    <input
                      type="text"
                      value={newMeasureNotes}
                      onChange={(e) => setNewMeasureNotes(e.target.value)}
                      placeholder="e.g. 150mm overlap at corner"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddMeasureModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMeasureItem}
                    disabled={!newMeasureRef || !newMeasureLengthMm}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                  >
                    Save Line
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILES / PLANS */}
      {section === 'files' && (
        <div className="space-y-3">
          {selectedPlanForMarkup ? (
            <PlanMarkupTool
              project={selectedProject}
              plan={selectedPlanForMarkup}
              memberName={activeMember?.name || 'User'}
              onUpdateProject={onUpdateProject}
              onClose={() => setSelectedPlanForMarkup(null)}
              onOpenFlashingDesigner={(profileId) => {
                setSelectedPlanForMarkup(null);
                setSection('flashings');
                setFlashingView('library');
                triggerNotice(`Opened flashing library for ${profileId}`);
              }}
            />
          ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Plans & files</h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Open a drawing to mark up quantities, lines, areas, notes and count locations directly over the plan.
            </p>
            {plans.length === 0 ? (
              <p className="text-xs text-slate-500">No plans uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{plan.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {plan.sheetNumber} · {plan.revision}{plan.scale ? ` · ${plan.scale}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedPlanForMarkup(plan)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white">
                        <Pencil className="h-3.5 w-3.5" /> Mark up plan
                      </button>
                      <a href={plan.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">
                        <ExternalLink className="h-3.5 w-3.5" /> Open original
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
          <button
            onClick={() => {
              setSection('flashings');
            }}
            className="w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-slate-400 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Layers className="w-4 h-4 text-indigo-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Flashing profiles
                </div>
                <div className="text-[11px] text-slate-500">
                  Browse saved profiles, draw new flashings, and manage this job's order lines
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* ORDERS */}
      {section === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Orders</h2>
            <p className="text-[11px] text-slate-500">
              Material and flashing orders for this site.
            </p>
          </div>
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-500">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => (
                <li key={o.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      {o.orderNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">
                    {o.supplier}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {o.items.length} item{o.items.length === 1 ? '' : 's'}
                    {o.deliveryEta ? ` · ETA ${o.deliveryEta}` : ''}
                    {' · '}
                    {o.orderedBy}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!canManageOrders && (
            <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
              Ordering is limited to authorised roles.
            </p>
          )}
        </div>
      )}

      {/* PHOTOS */}
      {section === 'photos' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Photos</h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Site photos for this job.
          </p>
          {photos.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center">
              <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No photos yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Capture from the field and they will show here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((ph) => (
                <div
                  key={ph.id}
                  className="aspect-[4/3] rounded-lg bg-slate-100 overflow-hidden relative group"
                >
                  <img
                    src={ph.url}
                    alt={ph.caption}
                    className="w-full h-full object-cover"
                  />
                  {ph.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-white text-[10px] px-2 py-1 truncate">
                      {ph.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLASHINGS — render the designer directly inside the onsite PWA */}
      {section === 'flashings' && (
        <div className="-mx-1 sm:mx-0">
          <FlashingWorkshop
            view={flashingView}
            onChangeView={setFlashingView}
            projects={selectedProject ? [selectedProject] : projects}
            project={selectedProject}
            activeMemberName={activeMember?.name || 'User'}
            onUpdateProject={onUpdateProject}
            onClose={() => setSection('home')}
          />
        </div>
      )}

      {/* MORE — demoted advanced tools */}
      {section === 'more' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-1">More tools</h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Deeper site tools when you need them. Kept out of the way on purpose.
            </p>
            <div className="space-y-2">
              <MoreLink
                icon={Ruler}
                title="Site measures"
                subtitle="Ridge, eaves, pitch, pan counts"
                onClick={() => onOpenAdvanced?.(selectedProject.id)}
              />
              <MoreLink
                icon={AlertTriangle}
                title="Snagging"
                subtitle="Punch list and defects"
                onClick={() => onOpenAdvanced?.(selectedProject.id)}
              />
              <MoreLink
                icon={ClipboardList}
                title="Meetings & sign-offs"
                subtitle="Minutes, milestones, formal records"
                onClick={() => onOpenAdvanced?.(selectedProject.id)}
              />
              <MoreLink
                icon={Settings2}
                title="Full field workspace"
                subtitle="Open the complete advanced site tool"
                onClick={() => onOpenAdvanced?.(selectedProject.id)}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center px-4">
            Compliance and formal records stay available — they just are not the
            default screen.
          </p>
        </div>
      )}

      {/* Thumb-reachable primary navigation on phones */}
      <nav
        aria-label="Site sections"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around gap-0.5 px-1 pt-1.5">
          {([
            { id: 'home' as const, label: 'Home', icon: Building },
            { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
            { id: 'survey' as const, label: 'Survey', icon: Ruler },
            { id: 'files' as const, label: 'Plans', icon: FileText },
            { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
            { id: 'photos' as const, label: 'Photos', icon: Camera },
            { id: 'flashings' as const, label: 'Flashings', icon: Layers },
            { id: 'more' as const, label: 'More', icon: Settings2 }
          ]).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setSection(item.id)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-[9px] font-semibold ${active ? 'text-slate-950' : 'text-slate-500'}`}
              >
                <span className={`flex h-8 w-9 items-center justify-center rounded-xl ${active ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

function ContactRow({
  label,
  name,
  phone,
  email
}: {
  label: string;
  name?: string;
  phone?: string;
  email?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 space-y-0.5">
      <div className="text-[10px] font-bold text-slate-400 uppercase">
        {label}
      </div>
      <div className="text-xs font-semibold text-slate-900">
        {name || '—'}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
        {phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {phone}
          </span>
        )}
        {email && (
          <span className="flex items-center gap-1 truncate">
            <Mail className="w-3 h-3" />
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase">
        {label}
      </div>
      <div className="text-lg font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function MoreLink({
  icon: Icon,
  title,
  subtitle,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 text-left cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-500">{subtitle}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </button>
  );
}