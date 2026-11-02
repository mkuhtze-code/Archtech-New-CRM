import React, { useState } from 'react';
import { 
  Project, 
  MilestoneItem, 
  ProjectVariation, 
  TimeEntry, 
  ActivityLogItem, 
  JobWorkflowStage,
  JobChecklistItem,
  ArchitecturalPlan,
  SiteScheduleEvent,
  SnaggingItem,
  OnsiteMaterialOrder,
  TeamMember
} from '../types/crm';
import { formatNZD, formatDate } from '../utils/formatters';
import { PlanMarkupTool } from './PlanMarkupTool';
import { 
  CheckCircle2, 
  Circle, 
  XCircle,
  FileCheck, 
  Camera, 
  Plus, 
  ExternalLink,
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Building, 
  MapPin, 
  Layers, 
  ArrowRight, 
  User, 
  DollarSign, 
  FileCode, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  X, 
  Compass, 
  Wind, 
  Check, 
  ClipboardList,
  Clock,
  Ruler,
  ShoppingCart,
  Droplet,
  Truck,
  Users,
  PenTool,
  Printer,
  Eye,
  Sliders,
  Download
} from 'lucide-react';

interface Props {
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
  onOpenClientPortal: (projectId: string) => void;
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  teamMembers?: TeamMember[];
}

type JobTab = 
  | 'overview' 
  | 'schedule' 
  | 'financials' 
  | 'materials' 
  | 'plans' 
  | 'site_log' 
  | 'compliance';

export const ProjectProgress: React.FC<Props> = ({
  projects,
  onUpdateProject,
  onOpenClientPortal,
  selectedProjectId: externalSelectedId,
  onSelectProject: externalOnSelect,
  teamMembers = []
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(projects[0]?.id || '');
  const selectedProjectId = externalSelectedId || internalSelectedId;
  const setSelectedProjectId = (id: string) => {
    if (externalOnSelect) externalOnSelect(id);
    setInternalSelectedId(id);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Active section inside the Job Hub Center of Gravity
  const [activeTab, setActiveTab] = useState<JobTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Active markup plan
  const [activeMarkupPlan, setActiveMarkupPlan] = useState<ArchitecturalPlan | null>(null);

  // Pop-out checklist card modal state
  const [isPopoutCardsOpen, setIsPopoutCardsOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Add custom checklist item modal
  const [isAddChecklistOpen, setIsAddChecklistOpen] = useState(false);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<JobChecklistItem['category']>('Substrate & Framing');
  const [newChecklistNotes, setNewChecklistNotes] = useState('');

  // Zoom plan modal
  const [selectedPlanForZoom, setSelectedPlanForZoom] = useState<ArchitecturalPlan | null>(null);

  // Add Variation Form
  const [isAddVariationOpen, setIsAddVariationOpen] = useState(false);
  const [newVariationTitle, setNewVariationTitle] = useState('');
  const [newVariationDesc, setNewVariationDesc] = useState('');
  const [newVariationCost, setNewVariationCost] = useState<number>(1200);

  // Add Photo Form
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Add Schedule Event Form
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedType, setSchedType] = useState<SiteScheduleEvent['type']>('HIAB Crane Delivery');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedCrew, setSchedCrew] = useState<string[]>(['Marcus Kuhtze']);
  const [schedNotes, setSchedNotes] = useState('');

  // Job Completion / Handover Sign-off state
  const [ps3Status, setPs3Status] = useState<'draft' | 'ready' | 'lodged' | 'approved'>('lodged');
  const [ps3ConsentNumber, setPs3ConsentNumber] = useState('BCO-1029482');
  const [warrantyIssued, setWarrantyIssued] = useState(true);
  const [workmanshipGuaranteeIssued, setWorkmanshipGuaranteeIssued] = useState(true);
  const [siteClearanceSigned, setSiteClearanceSigned] = useState(true);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  // Client Portal Visibility Modal State
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isRaiseInvoiceModalOpen, setIsRaiseInvoiceModalOpen] = useState(false);

  // New Invoice Form State
  const [newInvoiceNumber, setNewInvoiceNumber] = useState(`INV-2026-0${Math.floor(Math.random() * 80 + 20)}`);
  const [newInvoiceClaimStage, setNewInvoiceClaimStage] = useState('Progress Claim (Tray Installation)');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<number>(18500);
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('Progress claim for roll-formed tray supply, underlay fixing, and standing seam tray installation.');

  const triggerCompletionNotice = (msg: string) => {
    setCompletionNotice(msg);
    setTimeout(() => setCompletionNotice(null), 3000);
  };

  const handleSaveVisibilitySettings = (newSettings: {
    photos: boolean;
    deliveryDate: boolean;
    installStartDate: boolean;
    estimatedCompletionDate: boolean;
    documents: boolean;
  }, dates: { delivery?: string; installStart?: string; estimatedCompletion?: string }) => {
    if (!selectedProject) return;
    const updated: Project = {
      ...selectedProject,
      visibilitySettings: newSettings,
      deliveryDate: dates.delivery || selectedProject.deliveryDate,
      installStartDate: dates.installStart || selectedProject.installStartDate,
      estimatedCompletionDate: dates.estimatedCompletion || selectedProject.estimatedCompletionDate,
      targetCompletionDate: dates.estimatedCompletion || selectedProject.targetCompletionDate
    };
    onUpdateProject(updated);
    setIsVisibilityModalOpen(false);
    triggerCompletionNotice('Updated client portal visibility settings! Sensitive completion date rules enforced.');
  };

  const handleRaiseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newInvoiceNumber.trim() || newInvoiceAmount <= 0) return;

    const subtotal = Number(newInvoiceAmount);
    const gst = Number((subtotal * 0.15).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));
    const today = new Date().toISOString().split('T')[0];

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvoiceNumber.trim(),
      projectId: selectedProject.id,
      dateIssued: today,
      dueDate: newInvoiceDueDate,
      claimStage: newInvoiceClaimStage.trim(),
      amountNZD: subtotal,
      gstNZD: gst,
      totalNZD: total,
      status: 'issued' as const,
      progressNotes: newInvoiceNotes.trim(),
      lineItems: [
        { description: newInvoiceClaimStage.trim(), amountNZD: subtotal }
      ]
    };

    const currentInvoices = selectedProject.invoices || [];
    const updated: Project = {
      ...selectedProject,
      invoices: [...currentInvoices, newInvoice]
    };

    onUpdateProject(updated);
    setIsRaiseInvoiceModalOpen(false);
    setNewInvoiceNumber(`INV-2026-0${Math.floor(Math.random() * 80 + 20)}`);
    triggerCompletionNotice(`Raised ${newInvoice.invoiceNumber} (${newInvoice.claimStage}) against running project contract!`);
  };

  const handleToggleInvoicePaid = (invoiceId: string) => {
    if (!selectedProject) return;
    const updatedInvoices = (selectedProject.invoices || []).map(inv => {
      if (inv.id === invoiceId) {
        const nextStatus = inv.status === 'paid' ? 'issued' : 'paid';
        return {
          ...inv,
          status: nextStatus as 'issued' | 'paid',
          paidAt: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return inv;
    });

    onUpdateProject({
      ...selectedProject,
      invoices: updatedInvoices
    });
  };

  // STAGES definition
  const STAGES_LIST: { key: JobWorkflowStage; label: string }[] = [
    { key: 'enquiry_measure', label: '1. Measure' },
    { key: 'quoting', label: '2. Quoting' },
    { key: 'quote_sent', label: '3. Sent' },
    { key: 'pre_start', label: '4. Pre-Start' },
    { key: 'active_onsite', label: '5. On-Site' },
    { key: 'qa_snagging', label: '6. Sign-off' },
    { key: 'completed', label: '7. Complete' }
  ];

  const currentStageIndex = STAGES_LIST.findIndex(s => s.key === (selectedProject?.jobStage || 'active_onsite'));

  const handleChangeStage = (nextStage: JobWorkflowStage) => {
    if (!selectedProject) return;
    const stageIndex = STAGES_LIST.findIndex(s => s.key === nextStage);
    const updated: Project = {
      ...selectedProject,
      jobStage: nextStage,
      status: nextStage === 'completed' 
        ? 'completed' 
        : nextStage === 'qa_snagging' 
        ? 'snagging' 
        : nextStage === 'active_onsite' 
        ? 'in_progress' 
        : 'pre_construction',
      progressPercent: nextStage === 'completed' ? 100 : Math.max(selectedProject.progressPercent, (stageIndex + 1) * 14),
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'milestone',
          title: `Moved to ${STAGES_LIST.find(s => s.key === nextStage)?.label}`,
          details: `Stage updated on Job Hub.`,
          author: teamMembers[0]?.name || 'Operations',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    };
    onUpdateProject(updated);
  };

  // Checklist items
  const currentChecklist: JobChecklistItem[] = selectedProject?.customChecklist || [
    {
      id: 'chk-1',
      label: 'Plywood Substrate Moisture Content <18%',
      notes: 'Tested with calibrated probe meter across 10 random points on 19mm CD plywood.',
      category: 'Substrate & Framing',
      status: 'pass',
      completed: true,
      completedAt: '2026-03-20',
      inspectorName: 'Marcus Kuhtze (LBP)'
    },
    {
      id: 'chk-2',
      label: 'Synthetic Breather Underlay & 150mm Overlaps',
      notes: 'The Roofing Store certified underlay laid smooth, mechanically fixed with butyl taped joints.',
      category: 'Underlay & Thermal',
      status: 'pass',
      completed: true,
      completedAt: '2026-03-21',
      inspectorName: 'Marcus Kuhtze (LBP)'
    },
    {
      id: 'chk-3',
      label: 'Tray Clips & Thermal Expansion Movement Cleats',
      notes: 'Stainless steel sliding clips installed at 400mm centers allowing longitudinal expansion.',
      category: 'Clips & Seaming',
      status: 'pending',
      completed: false
    },
    {
      id: 'chk-4',
      label: 'Apron & Barge Flashing Soft-Edge Hooking',
      notes: 'Folded flashings hemmed onto continuous hooked cleats. No exposed direct pierce fixings.',
      category: 'Flashings & Penetrations',
      status: 'pending',
      completed: false
    },
    {
      id: 'chk-5',
      label: 'Roof Penetration Dektite & Upstand Cladding Cleat',
      notes: 'Minimum 150mm vertical upstand above finished roof pan level.',
      category: 'Flashings & Penetrations',
      status: 'pending',
      completed: false
    }
  ];

  const handleUpdateChecklistItemStatus = (itemId: string, newStatus: 'pass' | 'fail' | 'na' | 'pending') => {
    if (!selectedProject) return;
    const updated = currentChecklist.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: newStatus,
          completed: newStatus === 'pass',
          completedAt: newStatus === 'pass' ? new Date().toISOString().split('T')[0] : undefined,
          inspectorName: newStatus === 'pass' ? 'Marcus Kuhtze (LBP)' : undefined
        };
      }
      return item;
    });

    const passedCount = updated.filter(i => i.status === 'pass').length;
    const progressPercent = Math.min(100, Math.round((passedCount / updated.length) * 100));

    const updatedProj: Project = {
      ...selectedProject,
      customChecklist: updated,
      progressPercent,
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'milestone',
          title: `Checklist Item: ${updated.find(i => i.id === itemId)?.label}`,
          details: `Status set to ${newStatus.toUpperCase()}.`,
          author: teamMembers[0]?.name || 'Operations',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    };
    onUpdateProject(updatedProj);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newChecklistLabel.trim()) return;

    const newItem: JobChecklistItem = {
      id: `chk-${Date.now()}`,
      label: newChecklistLabel.trim(),
      notes: newChecklistNotes.trim() || 'Custom site inspection checkpoint for this specific job.',
      category: newChecklistCategory,
      completed: false,
      status: 'pending'
    };

    onUpdateProject({
      ...selectedProject,
      customChecklist: [...currentChecklist, newItem]
    });
    setNewChecklistLabel('');
    setNewChecklistNotes('');
    setIsAddChecklistOpen(false);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!selectedProject) return;
    onUpdateProject({
      ...selectedProject,
      customChecklist: currentChecklist.filter(i => i.id !== itemId)
    });
  };

  // Variations handlers
  const handleAddVariation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newVariationTitle.trim()) return;

    const newVar: ProjectVariation = {
      id: `var-${Date.now()}`,
      title: newVariationTitle.trim(),
      description: newVariationDesc || 'Scope adjustment per site instruction.',
      amountNZD: Number(newVariationCost) || 0,
      status: 'pending_client',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    onUpdateProject({
      ...selectedProject,
      variations: [...selectedProject.variations, newVar],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'variation',
          title: `Variation Added: ${newVar.title} (${formatNZD(newVar.amountNZD)})`,
          details: newVariationDesc || 'Pending client digital approval.',
          author: teamMembers[0]?.name || 'Operations',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    });

    setNewVariationTitle('');
    setNewVariationDesc('');
    setIsAddVariationOpen(false);
  };

  const handleUpdateVariationStatus = (varId: string, status: 'approved' | 'declined') => {
    if (!selectedProject) return;
    const updated = selectedProject.variations.map(v => {
      if (v.id === varId) {
        return {
          ...v,
          status,
          approvedAt: status === 'approved' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return v;
    });

    // If approved, update contractValueNZD
    const targetVar = selectedProject.variations.find(v => v.id === varId);
    const addedAmount = status === 'approved' && targetVar ? targetVar.amountNZD : 0;

    onUpdateProject({
      ...selectedProject,
      contractValueNZD: selectedProject.contractValueNZD + addedAmount,
      variations: updated,
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: selectedProject.id,
          entityType: 'project',
          type: 'variation',
          title: `Variation ${status.toUpperCase()}: ${targetVar?.title}`,
          details: `Client approved: ${formatNZD(targetVar?.amountNZD || 0)}. Contract adjusted.`,
          author: 'Client Portal',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(selectedProject.activityFeed || [])
      ]
    });
  };

  // Add Photo
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newPhotoUrl.trim()) return;

    const newPhoto = {
      id: `p-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Site progress photo',
      phase: selectedProject.jobStage || 'active_onsite',
      takenAt: new Date().toISOString().split('T')[0],
      uploadedBy: teamMembers[0]?.name || 'Operations'
    };

    onUpdateProject({
      ...selectedProject,
      photos: [newPhoto, ...selectedProject.photos]
    });

    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsAddPhotoOpen(false);
  };

  // Add Schedule Event
  const handleAddScheduleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !schedTitle.trim()) return;

    const newEvent: SiteScheduleEvent = {
      id: `sched-${Date.now()}`,
      projectId: selectedProject.id,
      title: schedTitle.trim(),
      date: schedDate,
      type: schedType,
      crewAssigned: schedCrew,
      notes: schedNotes.trim() || undefined
    };

    onUpdateProject({
      ...selectedProject,
      fieldSchedule: [newEvent, ...(selectedProject.fieldSchedule || [])]
    });

    setSchedTitle('');
    setSchedNotes('');
    setIsAddScheduleOpen(false);
  };

  // Toggle Snag Status
  const handleToggleSnagStatus = (snagId: string) => {
    if (!selectedProject) return;
    const updated = (selectedProject.snaggingItems || []).map(s => {
      if (s.id === snagId) {
        const next = s.status === 'Resolved & Verified' ? 'Open' : 'Resolved & Verified';
        return {
          ...s,
          status: next as SnaggingItem['status'],
          resolvedAt: next === 'Resolved & Verified' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined
        };
      }
      return s;
    });

    onUpdateProject({
      ...selectedProject,
      snaggingItems: updated
    });
  };

  // Toggle Milestone
  const handleToggleMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    const updated = (selectedProject.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString().slice(0, 10) : undefined,
          inspectorName: nextCompleted ? (teamMembers[0]?.name || 'Marcus Kuhtze (LBP)') : undefined
        };
      }
      return m;
    });

    onUpdateProject({
      ...selectedProject,
      milestones: updated
    });
  };

  // Drawings list
  const plansToDisplay: ArchitecturalPlan[] = selectedProject?.architecturalPlans || selectedProject?.plans || [];

  // Filter project list on left
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Financial calculations
  const baseContract = selectedProject?.contractValueNZD || 0;
  const approvedVarsTotal = (selectedProject?.variations || [])
    .filter(v => v.status === 'approved')
    .reduce((a, v) => a + v.amountNZD, 0);
  const pendingVarsTotal = (selectedProject?.variations || [])
    .filter(v => v.status === 'pending_client')
    .reduce((a, v) => a + v.amountNZD, 0);
  const revisedContractTotal = baseContract + approvedVarsTotal;

  // Render Plan Markup view if active
  if (activeMarkupPlan && selectedProject) {
    return (
      <PlanMarkupTool
        project={selectedProject}
        plan={activeMarkupPlan}
        memberName={teamMembers[0]?.name || 'Operations'}
        onUpdateProject={onUpdateProject}
        onClose={() => setActiveMarkupPlan(null)}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT PANE: TRADE JOBS SELECTOR                             */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full lg:w-72 shrink-0 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Trade Jobs ({projects.length})</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">All Jobs</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-230px)] overflow-y-auto">
          {filteredProjects.map((proj) => {
            const isSelected = proj.id === selectedProject?.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`p-3 transition-colors cursor-pointer text-xs space-y-1 ${
                  isSelected ? 'bg-sky-50/80 border-l-4 border-l-sky-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-slate-800">{proj.projectNumber}</span>
                  <span className="font-semibold text-slate-900">{formatNZD(proj.contractValueNZD)}</span>
                </div>
                <h5 className="font-bold text-slate-900 truncate">{proj.title}</h5>
                <p className="text-slate-500 text-[11px] truncate">{proj.clientName} · {proj.architect}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <div className="w-20 bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full rounded-full" style={{ width: `${proj.progressPercent}%` }} />
                  </div>
                  <span>{proj.progressPercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. RIGHT PANE: THE JOB AS CENTER OF GRAVITY                   */}
      {/* ------------------------------------------------------------- */}
      {selectedProject ? (
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          
          {/* Main Job Header Cockpit */}
          <div className="p-5 border-b border-slate-200/80 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {selectedProject.projectNumber}
                  </span>
                  <span>·</span>
                  <span>Target: {formatDate(selectedProject.targetCompletionDate || selectedProject.startDate)}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> SiteWise Certified
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedProject.title}</h2>
                
                {/* Client, Architect, Contractor Contacts */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProject.clientName}
                  </span>
                  {selectedProject.clientPhone && (
                    <a href={`tel:${selectedProject.clientPhone}`} className="text-sky-700 hover:underline flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      {selectedProject.clientPhone}
                    </a>
                  )}
                  {selectedProject.clientEmail && (
                    <a href={`mailto:${selectedProject.clientEmail}`} className="text-sky-700 hover:underline flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3" />
                      {selectedProject.clientEmail}
                    </a>
                  )}
                  <span className="text-slate-300">|</span>
                  <span>Architect: <strong className="text-slate-800">{selectedProject.architect}</strong></span>
                  <span>Builder: <strong className="text-slate-800">{selectedProject.headContractor}</strong></span>
                </div>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedProject.siteAddress}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ Schedule Event</span>
                </button>

                <button
                  onClick={() => setIsAddVariationOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Variation</span>
                </button>

                <button
                  onClick={() => setIsVisibilityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Configure sensitive visibility settings for client portal"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Portal Visibility</span>
                </button>

                <button
                  onClick={() => onOpenClientPortal(selectedProject.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Client Portal</span>
                </button>
              </div>
            </div>

            {/* Pipeline Stage Chevrons (Interactive) */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Current Trade Workflow Stage:
              </span>
              <div className="grid grid-cols-7 gap-1">
                {STAGES_LIST.map((stage, idx) => {
                  const isPassed = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => handleChangeStage(stage.key)}
                      className={`py-1.5 px-1 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : isPassed
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {stage.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specifications Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Contract Value</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formatNZD(selectedProject.contractValueNZD)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Profile & Material</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {selectedProject.profile} · {selectedProject.colorName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Roof Area & Pitch</span>
                <span className="text-xs font-bold text-slate-800">{selectedProject.roofAreaM2} m² · {selectedProject.roofPitchDegrees || 15}°</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Labour & Crew</span>
                <span className="text-xs font-bold text-slate-800">{(selectedProject.timeEntries || []).reduce((sum, e) => sum + (e.hours || 0), 0) || 28}h logged · On Schedule</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* FERGUS-INSPIRED COHERENT SECTION NAVIGATION                 */}
          {/* ----------------------------------------------------------- */}
          <div className="flex items-center gap-1 px-4 border-b border-slate-200 bg-slate-50/50 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Overview & Scope</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Schedule & Crew ({(selectedProject.fieldSchedule || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'financials'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Costs & Variations ({selectedProject.variations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
              <span>Materials & Orders ({(selectedProject.materialOrders || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'plans'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Files & Plans ({plansToDisplay.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('site_log')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'site_log'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>Site Log & Snags ({(selectedProject.snaggingItems || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compliance'
                  ? 'border-sky-600 text-sky-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Job Completion & Sign-off</span>
            </button>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* TAB 1: OVERVIEW & SCOPE                                     */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Scope & Architectural Spec */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-600" />
                    Architectural Roofing Specification
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Profile Type:</span>
                      <strong className="text-slate-900">{selectedProject.profile}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Coil Material:</span>
                      <strong className="text-slate-900">{selectedProject.material}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Color Finish:</span>
                      <strong className="text-slate-900">{selectedProject.colorName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Roof Area:</span>
                      <strong className="text-slate-900 font-mono">{selectedProject.roofAreaM2} m²</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Pitch Angle:</span>
                      <strong className="text-slate-900">{selectedProject.roofPitchDegrees || 15}°</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Primary Supplier:</span>
                      <strong className="text-slate-900">The Roofing Store (New Zealand)</strong>
                    </div>
                  </div>
                </div>

                {/* Key Contacts Card */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Key Project Contacts
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Client</div>
                      <div className="font-bold text-slate-900">{selectedProject.clientName}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{selectedProject.clientEmail} · {selectedProject.clientPhone}</div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Architect / Designer</div>
                      <div className="font-bold text-slate-900">{selectedProject.architect}</div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Builder / Head Contractor</div>
                      <div className="font-bold text-slate-900">{selectedProject.headContractor}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Milestones Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Trade Milestones & Handover Timeline
                  </h4>
                  <span className="text-xs text-slate-500">Click to sign off milestone</span>
                </div>

                <div className="bg-slate-50/50 rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
                  {(selectedProject.milestones || []).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(m.id)}
                      className="p-3.5 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            m.completed 
                              ? 'bg-emerald-600 text-white' 
                              : 'border-2 border-slate-300 group-hover:border-slate-500'
                          }`}
                        >
                          {m.completed && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <div className={`font-bold ${m.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                            {m.title}
                          </div>
                          {m.description && <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>}
                          {m.completed && m.inspectorName && (
                            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                              ✓ Verified by {m.inspectorName} on {m.completedAt}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: SCHEDULE & CREW                                      */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'schedule' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Site Schedule & Crane Allocations</h4>
                  <p className="text-xs text-slate-500">Dates for scaffold handover, crane delivery windows, and crew attendance.</p>
                </div>
                <button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Site Event</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(selectedProject.fieldSchedule && selectedProject.fieldSchedule.length > 0) ? (
                  selectedProject.fieldSchedule.map((evt) => (
                    <div key={evt.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                            {evt.date}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold text-[10px] border border-indigo-100">
                            {evt.type}
                          </span>
                          <span className="font-bold text-slate-900">{evt.title}</span>
                        </div>
                        {evt.notes && <p className="text-[11px] text-slate-500 pl-1">{evt.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[11px] text-slate-500">Crew:</span>
                        {evt.crewAssigned.map((crew, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-white text-slate-800 font-medium text-[10px] border border-slate-200">
                            {crew}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No scheduled site events logged for this job yet. Click "Schedule Site Event" above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 3: COSTS & VARIATIONS                                   */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'financials' && (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Financial Snapshot Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Base Contract</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{formatNZD(baseContract)}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Approved Variations</span>
                  <div className="text-base font-bold text-emerald-800 mt-0.5">+{formatNZD(approvedVarsTotal)}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Pending Approval</span>
                  <div className="text-base font-bold text-purple-800 mt-0.5">+{formatNZD(pendingVarsTotal)}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Revised Total Contract</span>
                  <div className="text-base font-bold text-sky-900 mt-0.5">{formatNZD(revisedContractTotal)}</div>
                </div>
              </div>

              {/* Variations Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Variations & Change Orders</h4>
                  <button
                    onClick={() => setIsAddVariationOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Variation</span>
                  </button>
                </div>

                {selectedProject.variations.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                    {selectedProject.variations.map((v) => (
                      <div key={v.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{v.title}</span>
                            <span className="font-mono font-bold text-slate-800">{formatNZD(v.amountNZD)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{v.description}</p>
                          <span className="text-[10px] text-slate-400 block font-mono">Requested: {v.requestedAt}</span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : v.status === 'declined' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {v.status === 'approved' ? 'Approved' : v.status === 'declined' ? 'Declined' : 'Pending Client'}
                          </span>

                          {v.status === 'pending_client' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateVariationStatus(v.id, 'approved')}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateVariationStatus(v.id, 'declined')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No variations logged. Base contract pricing holds.
                  </div>
                )}
              </div>

              {/* Client Invoicing & Running Financial Position */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Client Invoicing &amp; Progress Claims
                    </h4>
                    <p className="text-xs text-slate-500">
                      Running financial position synced live to the Client Portal. Each claim includes verified site notes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRaiseInvoiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Raise Progress Claim</span>
                  </button>
                </div>

                {/* Running Invoicing Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Agreed Contract</span>
                    <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{formatNZD(selectedProject.contractValueNZD)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Invoiced</span>
                    <div className="font-bold text-sky-800 font-mono text-sm mt-0.5">
                      {formatNZD((selectedProject.invoices || []).reduce((s, i) => s + (i.totalNZD || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Paid to Date</span>
                    <div className="font-bold text-emerald-800 font-mono text-sm mt-0.5">
                      {formatNZD((selectedProject.invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalNZD || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Remaining</span>
                    <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                      {formatNZD(Math.max(0, selectedProject.contractValueNZD - (selectedProject.invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalNZD || 0), 0)))}
                    </div>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="space-y-2.5">
                  {(selectedProject.invoices && selectedProject.invoices.length > 0) ? (
                    selectedProject.invoices.map((inv) => (
                      <div key={inv.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {inv.invoiceNumber}
                            </span>
                            <span className="font-bold text-slate-900">{inv.claimStage}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900">{formatNZD(inv.totalNZD)}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleInvoicePaid(inv.id)}
                              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                inv.status === 'paid' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Mark Due' : 'Mark Paid'}
                            </button>
                          </div>
                        </div>

                        {inv.progressNotes && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                            <span className="font-bold text-slate-700 block mb-0.5">Progress Note for Client:</span>
                            {inv.progressNotes}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>Issued: {inv.dateIssued} · Due: {inv.dueDate}</span>
                          {inv.paidAt && <span className="text-emerald-700">Paid on {inv.paidAt}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No progress claim invoices issued yet for this job.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 4: MATERIALS & ORDERS                                   */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'materials' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">The Roofing Store Site Orders & Metal Allocations</h4>
                  <p className="text-xs text-slate-500">Replenishment purchase orders sent to TRS branches (Albany, East Tamaki, Highbrook, Hamilton).</p>
                </div>
              </div>

              {/* Material Orders List */}
              <div className="space-y-3">
                {(selectedProject.materialOrders && selectedProject.materialOrders.length > 0) ? (
                  selectedProject.materialOrders.map((ord) => (
                    <div key={ord.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                            {ord.orderNumber}
                          </span>
                          <span className="font-bold text-slate-900">{ord.supplier}</span>
                          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                            {ord.urgency}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {ord.status}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-1">
                        {ord.items.map((itm) => (
                          <div key={itm.id} className="flex justify-between text-slate-800">
                            <span>{itm.itemDescription}</span>
                            <strong className="font-mono">{itm.quantity} {itm.unit}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Destination: {ord.deliverySiteAddress}</span>
                        <span>Ordered by: {ord.orderedBy} ({ord.orderDate}) · ETA: {ord.deliveryEta}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No site replenishment orders recorded yet. Coils dispatched from master inventory.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 5: FILES & PLANS                                        */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'plans' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Architectural Plans & Detail Sheets</h4>
                  <p className="text-xs text-slate-500">Zoom plans or launch the interactive Plan Markup and Flashing Pinning tool.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plansToDisplay.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-800 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-40 bg-slate-100 relative overflow-hidden group">
                        <img
                          src={plan.fileUrl}
                          alt={plan.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          {plan.sheetNumber}
                        </span>
                        <span className="absolute top-2 right-2 bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                          {plan.revision}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-1 text-xs">
                        <h5 className="font-bold text-slate-900 line-clamp-1">{plan.title}</h5>
                        <p className="text-[11px] text-slate-500">{plan.category} · {plan.date}</p>
                        {plan.notes && <p className="text-[11px] text-slate-600 italic">"{plan.notes}"</p>}
                      </div>
                    </div>

                    <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedPlanForZoom(plan)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Zoom</span>
                      </button>

                      <button
                        onClick={() => setActiveMarkupPlan(plan)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Mark Up & Pin</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 6: SITE LOG & SNAGS                                     */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'site_log' && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Snagging Punch List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Punch List & Defect Rectification
                  </h4>
                  <span className="text-xs text-slate-500">Tap to mark resolved</span>
                </div>

                <div className="space-y-2">
                  {(selectedProject.snaggingItems && selectedProject.snaggingItems.length > 0) ? (
                    selectedProject.snaggingItems.map((snag) => (
                      <div
                        key={snag.id}
                        className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className={`font-bold ${snag.status === 'Resolved & Verified' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {snag.title}
                          </span>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>Location: {snag.location}</span>
                            <span>·</span>
                            <span>Assigned to: {snag.assignedTo}</span>
                            <span>·</span>
                            <span>{snag.severity}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleSnagStatus(snag.id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                            snag.status === 'Resolved & Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-slate-300 hover:bg-emerald-50 text-slate-700'
                          }`}
                        >
                          {snag.status === 'Resolved & Verified' ? '✓ Resolved' : 'Mark Fixed'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No defects recorded on punch list.
                    </div>
                  )}
                </div>
              </div>

              {/* Site Photos Gallery */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Site Photo Stream ({selectedProject.photos.length})
                  </h4>
                  <button
                    onClick={() => setIsAddPhotoOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedProject.photos.map((photo) => (
                    <div key={photo.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="h-32 bg-slate-200 overflow-hidden">
                        <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 text-[11px]">
                        <div className="font-bold text-slate-900 line-clamp-1">{photo.caption}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{photo.takenAt} · {photo.uploadedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 7: JOB COMPLETION & SIGN-OFF / HANDOVER                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'compliance' && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Action feedback notice */}
              {completionNotice && (
                <div className="bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md animate-in fade-in duration-200">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {completionNotice}
                  </span>
                  <button onClick={() => setCompletionNotice(null)} className="text-emerald-300 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Handover & Sign-off Milestone Overview */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Standard Trade Completion &amp; Handover Workflow
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Job Completion, PS3 Lodgement &amp; Warranties
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Final documentation package for {selectedProject.title} ({selectedProject.projectNumber}). All sign-offs and certificates sync with the client portal.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => triggerCompletionNotice('Full Completion & Handover Pack compiled to PDF')}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Handover Pack</span>
                    </button>
                  </div>
                </div>

                {/* 4-Step Completion Status Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">1. Substrate Check</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 13.8% MC Verified
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">2. PS3 Lodgement</span>
                    <span className="font-bold text-sky-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> {ps3Status.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">3. 25-Yr Durability</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {warrantyIssued ? 'Issued' : 'Pending'}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">4. Workmanship</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 15-Yr Guarantee
                    </span>
                  </div>
                </div>
              </div>

              {/* PRIMARY SIGN-OFF ACTION ROWS (PS3, WARRANTIES, HANDOVER) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Official Sign-off &amp; Handover Records
                </h4>

                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs text-xs">
                  {/* Row 1: PS3 Producer Statement */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Producer Statement (PS3) - Roof &amp; Wall Cladding
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          ps3Status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          ps3Status === 'lodged' ? 'bg-sky-100 text-sky-800' :
                          ps3Status === 'ready' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ps3Status === 'approved' ? 'Council CCC Approved' :
                           ps3Status === 'lodged' ? 'Lodged with Council' :
                           ps3Status === 'ready' ? 'Ready to Lodge' : 'Draft In Prep'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Required for Council Code Compliance Certificate (CCC). Certifies installation in full accordance with approved architectural consent drawings.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span>LBP Certifier: <strong className="text-slate-800">Marcus Kuhtze (BP 114820)</strong></span>
                        <span>·</span>
                        <span>Consent: <strong className="text-slate-800">{ps3ConsentNumber}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <select
                        value={ps3Status}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setPs3Status(val);
                          triggerCompletionNotice(`PS3 Status updated to ${val.toUpperCase()}`);
                        }}
                        className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready to Lodge</option>
                        <option value="lodged">Lodged to Council</option>
                        <option value="approved">Consent Approved</option>
                      </select>
                      <button
                        onClick={() => triggerCompletionNotice('Downloaded PS3 Producer Statement document')}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        title="Download PS3 Form"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: 25-Year Manufacturer Durability Warranty */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          25-Year Manufacturer Durability Guarantee
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {warrantyIssued ? 'Certificate Active' : 'Pending Request'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        The Roofing Store / Kiwicolour / MagnaFlow substrate and coating warranty against delamination, perforation, and marine UV fade.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span>Supplier: <strong className="text-slate-800">The Roofing Store</strong></span>
                        <span>·</span>
                        <span>Cert Ref: <strong className="text-slate-800">TRS-WAR-2024-0982</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setWarrantyIssued(!warrantyIssued);
                          triggerCompletionNotice(warrantyIssued ? 'Warranty marked as pending' : 'Warranty Certificate issued');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          warrantyIssued ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {warrantyIssued ? 'Certificate Active' : 'Issue Certificate'}
                      </button>
                      <button
                        onClick={() => triggerCompletionNotice('Downloaded TRS Manufacturer Warranty Certificate')}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        title="Download Warranty Certificate"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Archtech 15-Year Workmanship Guarantee */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Archtech 15-Year Installation &amp; Weather-tightness Guarantee
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {workmanshipGuaranteeIssued ? 'Guarantee Issued' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Installer warranty covering standing seam tray mechanical locking, custom flashing weathertightness, and expansion clip tolerances.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span>Installer: <strong className="text-slate-800">Archtech Architectural Roofing</strong></span>
                        <span>·</span>
                        <span>Term: <strong className="text-slate-800">15 Years Weathertightness</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setWorkmanshipGuaranteeIssued(!workmanshipGuaranteeIssued);
                          triggerCompletionNotice('Workmanship Guarantee updated');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          workmanshipGuaranteeIssued ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {workmanshipGuaranteeIssued ? 'Issued' : 'Sign & Issue'}
                      </button>
                      <button
                        onClick={() => triggerCompletionNotice('Downloaded Archtech Workmanship Guarantee PDF')}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        title="Download Guarantee PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 4: Site Clearance & Client Handover Sign-off */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Final Site Inspection &amp; Clearance Sign-off
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {siteClearanceSigned ? 'Cleared & Verified' : 'Pending Walkthrough'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Confirms metal swarf removal, gutters cleared of debris, roof trays washed down, and scaffold tagged out for dismantle.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span>Supervised By: <strong className="text-slate-800">Marcus Kuhtze</strong></span>
                        <span>·</span>
                        <span>Client Walkthrough: <strong className="text-slate-800">Accepted</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setSiteClearanceSigned(!siteClearanceSigned);
                          triggerCompletionNotice('Site clearance status toggled');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {siteClearanceSigned ? 'Re-inspect' : 'Sign Off Clearance'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONSOLIDATED TECHNICAL & COMPLIANCE PARAMETERS (RELOCATED HERE) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    Project Engineering &amp; Compliance Specifications
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Archived with Council Consent
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Design Wind Zone</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedProject.windZone}</span>
                    <span className="text-[10px] text-slate-500">Clips @ 300mm centers</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Atmospheric Exposure</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedProject.exposureZone}</span>
                    <span className="text-[10px] text-slate-500">MagnaFlow® Marine Grade</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Substrate Moisture</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">13.8% MC (Pass)</span>
                    <span className="text-[10px] text-slate-500">Clause 8.4.11 &lt;18% req.</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Code Standard Reference</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">NZBC E2/AS1 &amp; MRM</span>
                    <span className="text-[10px] text-slate-500">LBP #BP 114820</span>
                  </div>
                </div>
              </div>

              {/* DETAILED TRADE INSPECTION & QUALITY CHECKLIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Detailed Trade QA Punch List
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPopoutCardsOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Card Mode</span>
                    </button>
                    <button
                      onClick={() => setIsAddChecklistOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Checkpoint</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
                  {currentChecklist.map((item) => (
                    <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {item.category}
                          </span>
                          <span className="font-bold text-slate-900">{item.label}</span>
                        </div>
                        {item.notes && <p className="text-[11px] text-slate-500 italic pl-1">"{item.notes}"</p>}
                        {item.inspectorName && (
                          <div className="text-[10px] text-slate-400 pl-1">Verified: {item.inspectorName?.replace(/\s*\(.*?\)/g, '') || 'Marcus Kuhtze'} ({item.completedAt})</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleUpdateChecklistItemStatus(item.id, 'pass')}
                          className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                            item.status === 'pass'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          PASS
                        </button>
                        <button
                          onClick={() => handleUpdateChecklistItemStatus(item.id, 'fail')}
                          className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                            item.status === 'fail'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          FAIL
                        </button>
                        <button
                          onClick={() => handleUpdateChecklistItemStatus(item.id, 'na')}
                          className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                            item.status === 'na'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Select a job from the left pane to view the Job Hub.
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD VARIATION                                          */}
      {/* ------------------------------------------------------------- */}
      {isAddVariationOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddVariation} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Scope Variation</h3>
              <button type="button" onClick={() => setIsAddVariationOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Variation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Additional Dormer Window Flashing & Cladding"
                  value={newVariationTitle}
                  onChange={(e) => setNewVariationTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (+NZD)</label>
                <input
                  type="number"
                  value={newVariationCost}
                  onChange={(e) => setNewVariationCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description / Rationale</label>
                <textarea
                  rows={2}
                  placeholder="Architect requested additional apron fold over clerestory..."
                  value={newVariationDesc}
                  onChange={(e) => setNewVariationDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddVariationOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Variation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD SCHEDULE EVENT                                     */}
      {/* ------------------------------------------------------------- */}
      {isAddScheduleOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddScheduleEvent} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Schedule Site Event</h3>
              <button type="button" onClick={() => setIsAddScheduleOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Crane Delivery Window (Main Gable Pans)"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                  <select
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="HIAB Crane Delivery">HIAB Crane Delivery</option>
                    <option value="Scaffold Inspection">Scaffold Inspection</option>
                    <option value="Rollforming Start">Rollforming Start</option>
                    <option value="Underlay Dry-In">Underlay Dry-In</option>
                    <option value="Council Inspection">Council Inspection</option>
                    <option value="PS3 Handover">PS3 Handover</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Traffic control, crane lift window..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddScheduleOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save Schedule Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ZOOM PLAN MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {selectedPlanForZoom && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span className="font-bold">{selectedPlanForZoom.sheetNumber} · {selectedPlanForZoom.title} ({selectedPlanForZoom.revision})</span>
              <button onClick={() => setSelectedPlanForZoom(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 overflow-auto">
              <img src={selectedPlanForZoom.fileUrl} alt={selectedPlanForZoom.title} className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CAD PLAN MARKUP & FLASHING PINNING TOOL               */}
      {/* ------------------------------------------------------------- */}
      {activeMarkupPlan && selectedProject && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 overflow-y-auto p-2 sm:p-4 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-slate-100 rounded-2xl w-full max-w-6xl max-h-[96vh] overflow-y-auto p-3 sm:p-4 shadow-2xl border border-slate-700">
            <PlanMarkupTool
              project={selectedProject}
              plan={activeMarkupPlan}
              memberName={teamMembers[0]?.name || 'Detailer'}
              onUpdateProject={onUpdateProject}
              onClose={() => setActiveMarkupPlan(null)}
            />
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* MODAL: CLIENT PORTAL VISIBILITY & SENSITIVE DATES SETTINGS    */}
      {/* ------------------------------------------------------------- */}
      {isVisibilityModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase">
                  Staff Access Control
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Client Portal Visibility Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Configure what the client can see in their portal for {selectedProject.title}.
                </p>
              </div>
              <button
                onClick={() => setIsVisibilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const photos = (form.elements.namedItem('vis_photos') as HTMLInputElement).checked;
                const deliveryDate = (form.elements.namedItem('vis_delivery') as HTMLInputElement).checked;
                const installStartDate = (form.elements.namedItem('vis_install') as HTMLInputElement).checked;
                const estimatedCompletionDate = (form.elements.namedItem('vis_est_complete') as HTMLInputElement).checked;
                const documents = (form.elements.namedItem('vis_docs') as HTMLInputElement).checked;

                const delivery = (form.elements.namedItem('delivery_date') as HTMLInputElement).value;
                const installStart = (form.elements.namedItem('install_date') as HTMLInputElement).value;
                const estimatedCompletion = (form.elements.namedItem('est_complete_date') as HTMLInputElement).value;

                handleSaveVisibilitySettings(
                  { photos, deliveryDate, installStartDate, estimatedCompletionDate, documents },
                  { delivery, installStart, estimatedCompletion }
                );
              }}
              className="space-y-4 text-xs"
            >
              {/* Sensitive Completion Date Section */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="vis_est_complete"
                    name="vis_est_complete"
                    defaultChecked={selectedProject.visibilitySettings?.estimatedCompletionDate === true}
                    className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="vis_est_complete" className="font-bold text-amber-950 cursor-pointer block">
                      Enable Estimated Completion Date in Client Portal
                    </label>
                    <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                      <strong>Sensitive:</strong> By default this date is hidden to prevent client disputes over weather delays. Check this box only when the target completion date is officially confirmed.
                    </p>
                  </div>
                </div>

                <div className="pl-6 pt-1">
                  <label className="text-[11px] font-bold text-amber-900 block mb-0.5">Target Completion Date:</label>
                  <input
                    type="date"
                    name="est_complete_date"
                    defaultValue={selectedProject.estimatedCompletionDate || selectedProject.targetCompletionDate}
                    className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Standard Key Dates Toggles */}
              <div className="space-y-2.5 pt-1">
                <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                  Standard Milestone Dates
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        name="vis_delivery"
                        defaultChecked={selectedProject.visibilitySettings?.deliveryDate !== false}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Show Delivery Date</span>
                    </label>
                    <input
                      type="date"
                      name="delivery_date"
                      defaultValue={selectedProject.deliveryDate || '2026-03-24'}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        name="vis_install"
                        defaultChecked={selectedProject.visibilitySettings?.installStartDate !== false}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Show Install Start Date</span>
                    </label>
                    <input
                      type="date"
                      name="install_date"
                      defaultValue={selectedProject.installStartDate || selectedProject.startDate}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Content Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block uppercase tracking-wide text-[10px]">
                  Visual & Document Feeds
                </span>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      name="vis_photos"
                      defaultChecked={selectedProject.visibilitySettings?.photos !== false}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Show Onsite Photo Stream to Client</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      name="vis_docs"
                      defaultChecked={selectedProject.visibilitySettings?.documents !== false}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Show Documents, Warranties &amp; Council PS3 to Client</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVisibilityModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Visibility Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RAISE PROGRESS CLAIM TAX INVOICE                       */}
      {/* ------------------------------------------------------------- */}
      {isRaiseInvoiceModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                  Contract Financials
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Raise Progress Claim Tax Invoice
                </h3>
                <p className="text-xs text-slate-500">
                  Job Contract: {formatNZD(selectedProject.contractValueNZD)} · {selectedProject.clientName}
                </p>
              </div>
              <button
                onClick={() => setIsRaiseInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceNumber}
                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceDueDate}
                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Claim Stage / Title *</label>
                <input
                  type="text"
                  required
                  value={newInvoiceClaimStage}
                  onChange={(e) => setNewInvoiceClaimStage(e.target.value)}
                  placeholder="e.g. Progress Claim #2 - Tray Installation (35%)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Claim Amount Excl. GST (NZD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvoiceAmount}
                    onChange={(e) => setNewInvoiceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono flex flex-col justify-center">
                  <div className="flex justify-between">
                    <span className="text-slate-500">+15% GST:</span>
                    <span>{formatNZD(newInvoiceAmount * 0.15)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-0.5 border-t border-slate-200 mt-0.5">
                    <span>Total Claim:</span>
                    <span>{formatNZD(newInvoiceAmount * 1.15)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Progress Notes for Claim (Shown in Client Portal) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newInvoiceNotes}
                  onChange={(e) => setNewInvoiceNotes(e.target.value)}
                  placeholder="Explain what has been completed on site and in fabrication to justify this progress claim..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRaiseInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Claim Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
