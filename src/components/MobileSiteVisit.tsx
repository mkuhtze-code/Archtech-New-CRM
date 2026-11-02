import React, { useState, useEffect, useMemo } from 'react';
import { 
  Project, 
  SiteVisitInspection, 
  JobChecklistItem, 
  ArchitecturalPlan,
  TeamMember,
  TeamRole,
  AccessLayer,
  SiteMeetingRecord,
  SiteMeasureRecord,
  SnaggingItem,
  OnsiteMaterialOrder,
  SiteScheduleEvent,
  ActivityLogItem
} from '../types/crm';
import { formatDate } from '../utils/formatters';
import { 
  Camera, 
  FileText, 
  Ruler, 
  AlertTriangle, 
  Hammer, 
  Plus, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  MapPin, 
  Wind, 
  Droplets, 
  Clock, 
  Calendar, 
  Users, 
  ShoppingCart, 
  Layers, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Download, 
  Send, 
  Sparkles, 
  Sliders, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  CheckSquare,
  CornerDownRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ArchtechLogo } from './ArchtechLogo';

interface Props {
  projects: Project[];
  inspections: SiteVisitInspection[];
  onAddInspection: (inspection: SiteVisitInspection) => void;
  onUpdateProject: (project: Project) => void;
  initialProjectId?: string;
  teamMembers?: TeamMember[];
  onUpdateTeamMembers?: (members: TeamMember[]) => void;
}

type QuickCaptureType = 'note' | 'photo' | 'measure' | 'issue' | 'daily_log';

export const MobileSiteVisit: React.FC<Props> = ({
  projects,
  inspections,
  onAddInspection,
  onUpdateProject,
  initialProjectId,
  teamMembers = [],
  onUpdateTeamMembers
}) => {
  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // -------------------------------------------------------------------
  // IDENTITY & QUIET ACCESS LAYER
  // -------------------------------------------------------------------
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    return localStorage.getItem('archtech_active_field_member') || teamMembers[0]?.id || 'team-1';
  });

  const activeMember = useMemo(() => {
    return teamMembers.find(m => m.id === activeMemberId) || teamMembers[0] || {
      id: 'team-1',
      name: 'Marcus Kuhtze',
      role: 'Managing Director (LBP)' as TeamRole,
      accessLayer: 'full' as AccessLayer,
      lbpNumber: 'BP 114820',
      phone: '+64 21 849 201',
      email: 'marcus@archtech.co.nz',
      authority: {
        canSignPS3: true,
        canApproveMilestones: true,
        canOrderMaterials: true,
        canConductSiteMeetings: true,
        canLogMeasures: true,
        canManageSnagging: true,
        canEditAuthorities: true
      }
    };
  }, [teamMembers, activeMemberId]);

  // Derived or user-overridden access layer (Light, Standard, Full, Office)
  const currentAccessLayer: AccessLayer = activeMember.accessLayer || (
    activeMember.role === 'Installer / Tradesman' || activeMember.role === 'Apprentice' ? 'light' :
    activeMember.role === 'Machine / Rollforming Lead' || activeMember.role === 'Site Foreman' ? 'standard' :
    activeMember.role === 'Project Coordinator' ? 'office' : 'full'
  );

  const handleSelectMember = (id: string) => {
    setActiveMemberId(id);
    localStorage.setItem('archtech_active_field_member', id);
  };

  // -------------------------------------------------------------------
  // MAIN VIEW MODE: "Today on Site" (Primary) vs "Job Depth" (Secondary)
  // -------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<'today' | 'job'>('today');

  // Filter chips in the "Today on Site" stream
  const [streamFilter, setStreamFilter] = useState<'all' | 'notes' | 'photos' | 'measures' | 'issues' | 'logs'>('all');

  // Low friction feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------
  // QUICK CAPTURE STATE (Low-friction drawer / modal)
  // -------------------------------------------------------------------
  const [activeCaptureType, setActiveCaptureType] = useState<QuickCaptureType | null>(null);

  // Quick Note
  const [quickNoteText, setQuickNoteText] = useState('');
  
  // Quick Photo
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  
  // Quick Measure
  const [measureLabel, setMeasureLabel] = useState('Ridge cut length');
  const [measureValueLm, setMeasureValueLm] = useState<number>(14.2);
  const [measurePitchDeg, setMeasurePitchDeg] = useState<number>(15);
  const [measureNotes, setMeasureNotes] = useState('');

  // Quick Issue / Blocker
  const [issueTitle, setIssueTitle] = useState('');
  const [issueLocation, setIssueLocation] = useState('South Parapet');
  const [issueSeverity, setIssueSeverity] = useState<SnaggingItem['severity']>('Moderate (Aesthetic / Flashing)');
  const [issueAssignee, setIssueAssignee] = useState(teamMembers[1]?.name || 'Tane Williams');

  // Quick Daily Log
  const [logTraysCount, setLogTraysCount] = useState<number>(24);
  const [logLinearMetres, setLogLinearMetres] = useState<number>(180);
  const [logSeamingPercent, setLogSeamingPercent] = useState<number>(50);
  const [logTradesmenCount, setLogTradesmenCount] = useState<number>(4);
  const [logNotes, setLogNotes] = useState('');

  // -------------------------------------------------------------------
  // JOB DEPTH EXPANDABLE SECTIONS
  // -------------------------------------------------------------------
  const [expandedSection, setExpandedSection] = useState<string | null>('measures');

  // Plans zoom viewer
  const [selectedPlan, setSelectedPlan] = useState<ArchitecturalPlan | null>(null);

  // Material Order Quick Builder
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orderSupplier, setOrderSupplier] = useState<OnsiteMaterialOrder['supplier']>('The Roofing Store (Albany)');
  const [orderUrgency, setOrderUrgency] = useState<OnsiteMaterialOrder['urgency']>('Urgent Same-Day HIAB');
  const [orderItemDesc, setOrderItemDesc] = useState('');
  const [orderItemQty, setOrderItemQty] = useState(250);
  const [orderItemUnit, setOrderItemUnit] = useState('pcs');

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setIsPwaInstalled(true);
      setDeferredPrompt(null);
    } else {
      showToast('Add to Home Screen from your browser menu for instant offline access');
    }
  };

  // -------------------------------------------------------------------
  // RECENT REALITY STREAM ENTRIES
  // Combines activity feed, site notes, recent measures, daily tallies
  // -------------------------------------------------------------------
  const activityItems = selectedProject?.activityFeed || [];

  const filteredFeed = useMemo(() => {
    if (streamFilter === 'all') return activityItems;
    if (streamFilter === 'notes') return activityItems.filter(i => i.type === 'note' || i.type === 'site_visit');
    if (streamFilter === 'measures') return activityItems.filter(i => i.title.toLowerCase().includes('measure') || i.details.toLowerCase().includes('ridge'));
    if (streamFilter === 'issues') return activityItems.filter(i => i.title.toLowerCase().includes('snag') || i.title.toLowerCase().includes('issue') || i.details.toLowerCase().includes('defect'));
    if (streamFilter === 'logs') return activityItems.filter(i => i.type === 'time_logged' || i.title.toLowerCase().includes('daily'));
    return activityItems;
  }, [activityItems, streamFilter]);

  // Current open blockers / snags
  const openIssues = (selectedProject?.snaggingItems || []).filter(i => i.status !== 'Resolved & Verified');

  // -------------------------------------------------------------------
  // LOW-FRICTION SAVE HANDLERS
  // -------------------------------------------------------------------

  // Save Quick Note
  const handleSaveQuickNote = () => {
    if (!quickNoteText.trim()) return;

    const newLogItem: ActivityLogItem = {
      id: `note-${Date.now()}`,
      entityId: selectedProject.id,
      entityType: 'project',
      type: 'note',
      title: 'Field Note',
      details: quickNoteText.trim(),
      author: activeMember.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...selectedProject,
      activityFeed: [newLogItem, ...(selectedProject.activityFeed || [])]
    };

    onUpdateProject(updatedProject);
    setQuickNoteText('');
    setActiveCaptureType(null);
    showToast('Note captured');
  };

  // Save Quick Photo
  const handleSaveQuickPhoto = () => {
    const url = photoUrlInput.trim() || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
    const caption = photoCaption.trim() || 'Site work in progress';

    const newLogItem: ActivityLogItem = {
      id: `photo-${Date.now()}`,
      entityId: selectedProject.id,
      entityType: 'project',
      type: 'site_visit',
      title: `Photo: ${caption}`,
      details: `${caption} (Saved by ${activeMember.name})`,
      author: activeMember.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...selectedProject,
      activityFeed: [newLogItem, ...(selectedProject.activityFeed || [])]
    };

    onUpdateProject(updatedProject);
    setPhotoCaption('');
    setPhotoUrlInput('');
    setActiveCaptureType(null);
    showToast('Photo logged');
  };

  // Save Quick Measure
  const handleSaveQuickMeasure = () => {
    const newMeasureRecord: SiteMeasureRecord = {
      id: `meas-${Date.now()}`,
      projectId: selectedProject.id,
      measuredBy: activeMember.name,
      date: new Date().toISOString().slice(0, 10),
      ridgeLengthLm: measureValueLm,
      eavesLengthLm: selectedProject.siteMeasures?.[0]?.eavesLengthLm || 42.0,
      bargeLengthLm: selectedProject.siteMeasures?.[0]?.bargeLengthLm || 18.2,
      valleyLengthLm: selectedProject.siteMeasures?.[0]?.valleyLengthLm || 12.0,
      roofPitchDegrees: measurePitchDeg,
      panTrayCount: selectedProject.siteMeasures?.[0]?.panTrayCount || 76,
      longestTrayLm: measureValueLm,
      laserScanCompleted: true,
      substrateMoisturePercent: 13.8,
      flashingGirthNotes: measureNotes || 'Confirmed on roof with tape / laser',
      customNotes: `${measureLabel}: ${measureValueLm}m at ${measurePitchDeg}°`
    };

    const newLogItem: ActivityLogItem = {
      id: `act-meas-${Date.now()}`,
      entityId: selectedProject.id,
      entityType: 'project',
      type: 'site_visit',
      title: `Measure: ${measureLabel} · ${measureValueLm}m`,
      details: `${measureLabel} measured at ${measureValueLm} lm (Pitch: ${measurePitchDeg}°). Notes: ${measureNotes || 'None'}`,
      author: activeMember.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...selectedProject,
      siteMeasures: [newMeasureRecord, ...(selectedProject.siteMeasures || [])],
      activityFeed: [newLogItem, ...(selectedProject.activityFeed || [])]
    };

    onUpdateProject(updatedProject);
    setMeasureNotes('');
    setActiveCaptureType(null);
    showToast(`Measure saved: ${measureValueLm}m`);
  };

  // Save Quick Issue / Blocker
  const handleSaveQuickIssue = () => {
    if (!issueTitle.trim()) return;

    const newSnag: SnaggingItem = {
      id: `snag-${Date.now()}`,
      projectId: selectedProject.id,
      title: issueTitle.trim(),
      location: issueLocation.trim() || 'Roof detail',
      severity: issueSeverity,
      reportedBy: activeMember.name,
      assignedTo: issueAssignee,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'Open'
    };

    const newLogItem: ActivityLogItem = {
      id: `act-snag-${Date.now()}`,
      entityId: selectedProject.id,
      entityType: 'project',
      type: 'site_visit',
      title: `Blocker: ${newSnag.title}`,
      details: `${newSnag.severity} at ${newSnag.location}. Assigned to ${newSnag.assignedTo}.`,
      author: activeMember.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...selectedProject,
      snaggingItems: [newSnag, ...(selectedProject.snaggingItems || [])],
      activityFeed: [newLogItem, ...(selectedProject.activityFeed || [])]
    };

    onUpdateProject(updatedProject);
    setIssueTitle('');
    setActiveCaptureType(null);
    showToast('Issue recorded on fix list');
  };

  // Save Quick Daily Log
  const handleSaveQuickDailyLog = () => {
    const newLogItem: ActivityLogItem = {
      id: `log-${Date.now()}`,
      entityId: selectedProject.id,
      entityType: 'project',
      type: 'time_logged',
      title: `Work today: ${logTraysCount} trays (${logLinearMetres}m)`,
      details: `${logTraysCount} trays laid (${logLinearMetres} lm). Double seaming at ${logSeamingPercent}%. Crew: ${logTradesmenCount} on site. Notes: ${logNotes || 'Smooth progress, good weather.'}`,
      author: activeMember.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...selectedProject,
      activityFeed: [newLogItem, ...(selectedProject.activityFeed || [])]
    };

    onUpdateProject(updatedProject);
    setLogNotes('');
    setActiveCaptureType(null);
    showToast('Daily progress logged');
  };

  // Resolve an Issue
  const handleToggleIssueStatus = (issueId: string) => {
    const updated = (selectedProject.snaggingItems || []).map(s => {
      if (s.id === issueId) {
        const isNowResolved = s.status !== 'Resolved & Verified';
        return {
          ...s,
          status: (isNowResolved ? 'Resolved & Verified' : 'Open') as SnaggingItem['status'],
          resolvedAt: isNowResolved ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined
        };
      }
      return s;
    });

    const target = selectedProject.snaggingItems?.find(s => s.id === issueId);

    const updatedProject: Project = {
      ...selectedProject,
      snaggingItems: updated,
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'site_visit',
          title: `Fixed: ${target?.title || 'Issue'}`,
          details: `Marked resolved by ${activeMember.name}.`,
          author: activeMember.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    };

    onUpdateProject(updatedProject);
    showToast('Fix item updated');
  };

  // Quiet milestone sign-off (Contextual)
  const handleToggleMilestone = (milestoneId: string) => {
    if (!activeMember.authority.canApproveMilestones && !activeMember.authority.canSignPS3) {
      showToast('Sign-off requires Site Lead or Supervisor authority');
      return;
    }

    const updated = (selectedProject.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const next = !m.completed;
        return {
          ...m,
          completed: next,
          completedAt: next ? new Date().toISOString().slice(0, 10) : undefined,
          inspectorName: next ? activeMember.name : undefined
        };
      }
      return m;
    });

    const target = selectedProject.milestones?.find(m => m.id === milestoneId);

    const updatedProject: Project = {
      ...selectedProject,
      milestones: updated,
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'milestone',
          title: `Signed: ${target?.title || 'Milestone'}`,
          details: `Signed off by ${activeMember.name} (${activeMember.role}).`,
          author: activeMember.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    };

    onUpdateProject(updatedProject);
    showToast('Milestone signed');
  };

  // Submit quick material order to The Roofing Store
  const handleSendMaterialOrder = () => {
    if (!orderItemDesc.trim()) return;

    if (!activeMember.authority.canOrderMaterials && !activeMember.authority.canSignPS3) {
      showToast('Ordering requires Leading Hand or Site Lead authority');
      return;
    }

    const orderNum = `TRS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: OnsiteMaterialOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      projectId: selectedProject.id,
      projectNumber: selectedProject.projectNumber,
      orderedBy: activeMember.name,
      supplier: orderSupplier,
      orderDate: new Date().toISOString().slice(0, 10),
      urgency: orderUrgency,
      items: [
        {
          id: `item-${Date.now()}`,
          itemDescription: orderItemDesc.trim(),
          category: 'Fixings & Metal',
          quantity: orderItemQty,
          unit: orderItemUnit,
          urgencyReason: 'On-site need'
        }
      ],
      deliverySiteAddress: selectedProject.siteAddress,
      status: 'Sent to The Roofing Store',
      deliveryEta: orderUrgency === 'Urgent Same-Day HIAB' ? 'Today ~2:30 PM' : 'Tomorrow 07:30 AM'
    };

    const updatedProject: Project = {
      ...selectedProject,
      materialOrders: [newOrder, ...(selectedProject.materialOrders || [])],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'material_order',
          title: `Ordered from ${orderSupplier}: ${orderItemDesc}`,
          details: `${orderItemQty} ${orderItemUnit} · ${orderUrgency}. Dispatched by ${activeMember.name}.`,
          author: activeMember.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    };

    onUpdateProject(updatedProject);
    setOrderItemDesc('');
    setIsNewOrderOpen(false);
    showToast(`Order sent to ${orderSupplier}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 text-slate-800 font-sans selection:bg-slate-200 space-y-3">
      {/* Archtech Brand Header */}
      <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <ArchtechLogo variant="dark" className="h-8 sm:h-9 w-auto max-w-[200px] object-left" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30 uppercase tracking-wider">
            Site QA Hub
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. QUIET HEADER: CONTEXT & ACCESS LAYER (NO FORMAL JARGON)    */}
      {/* ------------------------------------------------------------- */}
      <header className="mb-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Active Job & Context */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {selectedProject?.projectNumber}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                {selectedProject?.clientName}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[180px]">{selectedProject?.siteAddress?.split(',')[0]}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {selectedProject?.title}
              </h1>
            </div>
          </div>

          {/* Job Switcher & Quiet User Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Quick Job Switcher */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} · {p.title.slice(0, 20)}
                </option>
              ))}
            </select>

            {/* Active User Switcher (Quiet Authority) */}
            <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <div className="w-4 h-4 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                {activeMember.name.slice(0, 1)}
              </div>
              <select
                value={activeMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
                title="Switch active user or change access layer"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.split(' ')[0]} ({m.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quiet Context Ribbon: Weather, Crew, Readiness */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Wind className="w-3.5 h-3.5 text-slate-400" />
              19°C · 14 km/h WNW · dry
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              4 on site today
            </span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">
              Substrate &lt;18% MC verified
            </span>
          </div>

          {/* Surface Mode Toggle: "Today on Site" vs "Job Depth" */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'today'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today on Site
            </button>
            <button
              onClick={() => setViewMode('job')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'job'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Job Details & Systems
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRIMARY SURFACE: "TODAY ON SITE"                           */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'today' && (
        <div className="space-y-4">
          
          {/* Quick Capture Canvas (Top of page, glove-friendly, low friction) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 transition-all">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Capture
            </div>

            {/* Quick Action Bar (5 big buttons) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setActiveCaptureType('note')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer group active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                <span>Quick Note</span>
              </button>

              <button
                onClick={() => setActiveCaptureType('photo')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer group active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                <span>Photo</span>
              </button>

              <button
                onClick={() => setActiveCaptureType('measure')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer group active:scale-[0.98]"
              >
                <Ruler className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                <span>Measure</span>
              </button>

              <button
                onClick={() => setActiveCaptureType('issue')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-50/60 hover:bg-rose-50 border border-rose-200/70 text-rose-900 text-xs font-semibold transition-all cursor-pointer group active:scale-[0.98]"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:text-rose-800" />
                <span>Issue / Blocker</span>
              </button>

              <button
                onClick={() => setActiveCaptureType('daily_log')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer group active:scale-[0.98] col-span-2 sm:col-span-1"
              >
                <Hammer className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                <span>Work Done</span>
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* TODAY'S FOCUS & ACTIVE BLOCKERS                             */}
          {/* ----------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* What's Happening Today */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Today's Focus
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {new Date().toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Rollform & lay south wing trays</span>
                    <span className="text-slate-500 text-[11px]">MagnaFlow 0.55 Anthracite · 14.5m trays with sliding clips</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Double-lock mechanical seaming</span>
                    <span className="text-slate-500 text-[11px]">Archtech seamer machine on site with Wiremu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockers & Fix Items (Reality over paperwork) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${openIssues.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  Open Blockers ({openIssues.length})
                </span>
                <button
                  onClick={() => setActiveCaptureType('issue')}
                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  + Add item
                </button>
              </div>

              {openIssues.length > 0 ? (
                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                  {openIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 block line-clamp-1">{issue.title}</span>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{issue.location}</span>
                          <span>·</span>
                          <span>Assigned: {issue.assignedTo}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleIssueStatus(issue.id)}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                        title="Mark resolved"
                      >
                        Done
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl">
                  No open blockers today. Work is clear.
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* STREAM OF REALITY (CHRONOLOGICAL NOTES, LOGS, PHOTOS)       */}
          {/* ----------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recent On-Site Activity & Captures
              </span>

              {/* Filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'notes', 'photos', 'measures', 'issues', 'logs'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStreamFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer shrink-0 ${
                      streamFilter === f
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream feed */}
            <div className="divide-y divide-slate-100">
              {filteredFeed.length > 0 ? (
                filteredFeed.slice(0, 15).map((item) => (
                  <div key={item.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {item.author.slice(0, 1)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.timestamp?.slice(5, 16)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                        {item.details}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>by {item.author}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No entries matching this filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SECONDARY SURFACE: "JOB DEPTH & SYSTEMS"                   */}
      {/* Progressive disclosure on demand (No rigid 9-tab row)         */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'job' && (
        <div className="space-y-3">
          
          {/* SECTION 1: MEASURES & GEOMETRY */}
          <JobDepthDrawer
            title="Measures & Geometry"
            summary={`${selectedProject?.roofPitchDegrees || 15}° pitch · 76 trays · longest cut 14.5m`}
            isOpen={expandedSection === 'measures'}
            onToggle={() => setExpandedSection(expandedSection === 'measures' ? null : 'measures')}
            icon={<Ruler className="w-4 h-4 text-slate-700" />}
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ridge Length</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedProject?.siteMeasures?.[0]?.ridgeLengthLm || 38.5} m
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Eaves Length</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedProject?.siteMeasures?.[0]?.eavesLengthLm || 42.0} m
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Roof Pitch</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedProject?.roofPitchDegrees || 15}°
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pan Trays Count</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedProject?.siteMeasures?.[0]?.panTrayCount || 76} trays
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <strong>Longest tray:</strong> {selectedProject?.siteMeasures?.[0]?.longestTrayLm || 14.5}m (Thermal sliding clips required)
                </div>
                <button
                  onClick={() => setActiveCaptureType('measure')}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 font-semibold cursor-pointer"
                >
                  Log New Measure
                </button>
              </div>
            </div>
          </JobDepthDrawer>

          {/* SECTION 2: FIX LIST & SNAGS */}
          <JobDepthDrawer
            title="Fix List & Quality Check"
            summary={`${openIssues.length} open items · ${selectedProject?.snaggingItems?.length || 2} total`}
            isOpen={expandedSection === 'issues'}
            onToggle={() => setExpandedSection(expandedSection === 'issues' ? null : 'issues')}
            icon={<AlertTriangle className="w-4 h-4 text-slate-700" />}
          >
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Items needing attention before sign-off</span>
                <button
                  onClick={() => setActiveCaptureType('issue')}
                  className="text-xs font-semibold text-slate-800 hover:underline cursor-pointer"
                >
                  + Add to fix list
                </button>
              </div>

              <div className="space-y-2">
                {(selectedProject?.snaggingItems || []).map((snag) => (
                  <div
                    key={snag.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className={`font-semibold ${snag.status === 'Resolved & Verified' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {snag.title}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {snag.location} · Assigned to {snag.assignedTo} · {snag.severity}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleIssueStatus(snag.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        snag.status === 'Resolved & Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-white border border-slate-300 hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      {snag.status === 'Resolved & Verified' ? '✓ Resolved' : 'Mark Fixed'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </JobDepthDrawer>

          {/* SECTION 3: MATERIALS & REPLENISHMENT (THE ROOFING STORE DIRECT) */}
          {(currentAccessLayer === 'standard' || currentAccessLayer === 'full' || currentAccessLayer === 'office') && (
            <JobDepthDrawer
              title="Materials & The Roofing Store Orders"
              summary={`${selectedProject?.materialOrders?.length || 1} orders placed · Direct TRS dispatch`}
              isOpen={expandedSection === 'materials'}
              onToggle={() => setExpandedSection(expandedSection === 'materials' ? null : 'materials')}
              icon={<ShoppingCart className="w-4 h-4 text-slate-700" />}
            >
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Urgent site replenishment from The Roofing Store</span>
                  <button
                    onClick={() => setIsNewOrderOpen(true)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    + New Material Order
                  </button>
                </div>

                <div className="space-y-2">
                  {(selectedProject?.materialOrders || []).map((ord) => (
                    <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {ord.items.map(i => `${i.quantity} ${i.unit} ${i.itemDescription}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>{ord.supplier} ({ord.urgency})</span>
                        <span>ETA: {ord.deliveryEta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </JobDepthDrawer>
          )}

          {/* SECTION 4: DRAWINGS & PLANS */}
          <JobDepthDrawer
            title="Drawings & Detail Sheets"
            summary={`${selectedProject?.architecturalPlans?.length || selectedProject?.plans?.length || 3} sheets loaded`}
            isOpen={expandedSection === 'drawings'}
            onToggle={() => setExpandedSection(expandedSection === 'drawings' ? null : 'drawings')}
            icon={<FileText className="w-4 h-4 text-slate-700" />}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {(selectedProject?.architecturalPlans || selectedProject?.plans || []).map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-800 transition-all group"
                >
                  <div className="h-28 bg-slate-200 relative overflow-hidden">
                    <img
                      src={plan.fileUrl}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                      {plan.sheetNumber}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-bold text-slate-900 truncate">{plan.title}</div>
                    <div className="text-[10px] text-slate-500">{plan.revision}</div>
                  </div>
                </div>
              ))}
            </div>
          </JobDepthDrawer>

          {/* SECTION 5: MEETINGS & DECISIONS */}
          {(currentAccessLayer === 'standard' || currentAccessLayer === 'full' || currentAccessLayer === 'office') && (
            <JobDepthDrawer
              title="Site Meetings & Agreements"
              summary={`${selectedProject?.siteMeetings?.length || 0} recorded with architect & builder`}
              isOpen={expandedSection === 'meetings'}
              onToggle={() => setExpandedSection(expandedSection === 'meetings' ? null : 'meetings')}
              icon={<Users className="w-4 h-4 text-slate-700" />}
            >
              <div className="space-y-3 pt-2 text-xs">
                {(selectedProject?.siteMeetings && selectedProject.siteMeetings.length > 0) ? (
                  selectedProject.siteMeetings.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{m.meetingType}</span>
                        <span className="text-[10px] text-slate-500">{m.date}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line">{m.notes}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No formal site meetings recorded yet.
                  </div>
                )}
              </div>
            </JobDepthDrawer>
          )}

          {/* SECTION 6: PROGRESS & SIGN-OFFS (QUIET CONTEXTUAL AUTHORITY) */}
          <JobDepthDrawer
            title="Progress & Trade Sign-offs"
            summary={`${selectedProject?.progressPercent || 45}% complete · Ready for handover sign-off`}
            isOpen={expandedSection === 'progress'}
            onToggle={() => setExpandedSection(expandedSection === 'progress' ? null : 'progress')}
            icon={<CheckCircle2 className="w-4 h-4 text-slate-700" />}
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>Overall Execution</span>
                  <span>{selectedProject?.progressPercent || 45}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-300"
                    style={{ width: `${selectedProject?.progressPercent || 45}%` }}
                  />
                </div>
              </div>

              {/* Milestone checklist */}
              <div className="space-y-2 text-xs">
                {(selectedProject?.milestones || []).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="font-semibold text-slate-900">{m.title}</span>
                      </div>
                      {m.description && <p className="text-[11px] text-slate-500 pl-4">{m.description}</p>}
                      {m.completed && m.inspectorName && (
                        <span className="text-[10px] text-emerald-700 pl-4 block">
                          Signed by {m.inspectorName} on {m.completedAt}
                        </span>
                      )}
                    </div>

                    {/* Quiet Authority Signoff button */}
                    {activeMember.authority.canApproveMilestones || activeMember.authority.canSignPS3 ? (
                      <button
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                          m.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {m.completed ? 'Signed ✓' : 'Sign Off'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {m.completed ? 'Completed' : 'Pending signoff'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </JobDepthDrawer>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. LOW-FRICTION QUICK CAPTURE MODAL / SHEET                   */}
      {/* ------------------------------------------------------------- */}
      {activeCaptureType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {activeCaptureType === 'note' && <FileText className="w-4 h-4 text-slate-700" />}
                {activeCaptureType === 'photo' && <Camera className="w-4 h-4 text-slate-700" />}
                {activeCaptureType === 'measure' && <Ruler className="w-4 h-4 text-slate-700" />}
                {activeCaptureType === 'issue' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                {activeCaptureType === 'daily_log' && <Hammer className="w-4 h-4 text-slate-700" />}
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  {activeCaptureType === 'daily_log' ? 'Work Done Today' : `Capture ${activeCaptureType}`}
                </h3>
              </div>
              <button onClick={() => setActiveCaptureType(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A. QUICK NOTE */}
            {activeCaptureType === 'note' && (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  autoFocus
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="What's happening on site right now? (e.g. East parapet flashed, builder confirmed gutter fall...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
                <button
                  onClick={handleSaveQuickNote}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            )}

            {/* B. QUICK PHOTO */}
            {activeCaptureType === 'photo' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Caption / Detail</label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Valley gutter expansion lap check"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Photo URL or Camera Snap</label>
                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="https://... (or leave blank for demo photo)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                  />
                </div>
                <button
                  onClick={handleSaveQuickPhoto}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            )}

            {/* C. QUICK MEASURE */}
            {activeCaptureType === 'measure' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Measure Name</label>
                  <input
                    type="text"
                    value={measureLabel}
                    onChange={(e) => setMeasureLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Length (lm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measureValueLm}
                      onChange={(e) => setMeasureValueLm(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pitch (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurePitchDeg}
                      onChange={(e) => setMeasurePitchDeg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes / Detail</label>
                  <input
                    type="text"
                    value={measureNotes}
                    onChange={(e) => setMeasureNotes(e.target.value)}
                    placeholder="e.g. Parapet safety hem required"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>

                <button
                  onClick={handleSaveQuickMeasure}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Measure
                </button>
              </div>
            )}

            {/* D. QUICK ISSUE / BLOCKER */}
            {activeCaptureType === 'issue' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">What needs fixing?</label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g. Builder needs to caulk valley backer board before we lay tray"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Roof Location</label>
                    <input
                      type="text"
                      value={issueLocation}
                      onChange={(e) => setIssueLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assignee</label>
                    <select
                      value={issueAssignee}
                      onChange={(e) => setIssueAssignee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveQuickIssue}
                  className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Add to Fix List
                </button>
              </div>
            )}

            {/* E. QUICK DAILY WORK LOG */}
            {activeCaptureType === 'daily_log' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Trays Laid</label>
                    <input
                      type="number"
                      value={logTraysCount}
                      onChange={(e) => setLogTraysCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Linear Metres (lm)</label>
                    <input
                      type="number"
                      value={logLinearMetres}
                      onChange={(e) => setLogLinearMetres(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Seaming Progress (%)</label>
                    <input
                      type="number"
                      value={logSeamingPercent}
                      onChange={(e) => setLogSeamingPercent(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Crew On Site</label>
                    <input
                      type="number"
                      value={logTradesmenCount}
                      onChange={(e) => setLogTradesmenCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Weather, delays, good progress notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <button
                  onClick={handleSaveQuickDailyLog}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Record Work Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. NEW MATERIAL ORDER MODAL (THE ROOFING STORE)               */}
      {/* ------------------------------------------------------------- */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Order from The Roofing Store</h3>
              </div>
              <button onClick={() => setIsNewOrderOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Branch</label>
                <select
                  value={orderSupplier}
                  onChange={(e) => setOrderSupplier(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="The Roofing Store (Albany)">The Roofing Store (Albany)</option>
                  <option value="The Roofing Store (East Tamaki)">The Roofing Store (East Tamaki)</option>
                  <option value="The Roofing Store (Highbrook)">The Roofing Store (Highbrook)</option>
                  <option value="The Roofing Store (Hamilton)">The Roofing Store (Hamilton)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Urgency</label>
                <select
                  value={orderUrgency}
                  onChange={(e) => setOrderUrgency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Urgent Same-Day HIAB">Urgent Same-Day HIAB</option>
                  <option value="Foreman Branch Collection">Foreman Branch Collection</option>
                  <option value="Standard Delivery">Standard Delivery</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Material Needed</label>
                <input
                  type="text"
                  placeholder="e.g. Super Seam 38 stainless sliding clips (box of 250)"
                  value={orderItemDesc}
                  onChange={(e) => setOrderItemDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={orderItemQty}
                    onChange={(e) => setOrderItemQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit</label>
                  <input
                    type="text"
                    value={orderItemUnit}
                    onChange={(e) => setOrderItemUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleSendMaterialOrder}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Send Order to Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. PLAN ZOOM MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span className="font-bold">{selectedPlan.sheetNumber} · {selectedPlan.title}</span>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 overflow-auto">
              <img src={selectedPlan.fileUrl} alt={selectedPlan.title} className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. TOAST NOTIFICATION                                         */}
      {/* ------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------------
// HELPER COMPONENT: JOB DEPTH DRAWER (Progressive Disclosure)
// -------------------------------------------------------------------

interface JobDepthDrawerProps {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const JobDepthDrawer: React.FC<JobDepthDrawerProps> = ({
  title,
  summary,
  isOpen,
  onToggle,
  icon,
  children
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
    <button
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="truncate">
          <span className="text-xs font-bold text-slate-900 block">{title}</span>
          <span className="text-[11px] text-slate-500 truncate block">{summary}</span>
        </div>
      </div>

      <div className="text-slate-400 pl-2">
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
    </button>

    {isOpen && (
      <div className="px-4 pb-4 pt-1 border-t border-slate-100">
        {children}
      </div>
    )}
  </div>
);
