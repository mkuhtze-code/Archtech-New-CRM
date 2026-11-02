import React, { useState, useMemo } from 'react';
import { 
  Project, 
  Quote, 
  ProjectInvoice, 
  MasterPricingCatalogue,
  QuoteStatus,
  QuoteAuditEntry 
} from '../types/crm';
import { formatNZD, formatDate } from '../utils/formatters';
import { 
  getEffectiveQuoteStatus, 
  isQuoteExpired, 
  getDaysUntilExpiry,
  acceptQuoteByClient,
  createNewQuoteVersion 
} from '../utils/quoteVersioning';
import { ArchitecturalSvgDiagram } from './ArchitecturalSvgDiagram';
import { ArchtechLogo } from './ArchtechLogo';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ShieldCheck, 
  Download, 
  Phone, 
  Mail, 
  Check, 
  X,
  ExternalLink,
  Camera,
  Ruler,
  Droplets,
  Compass,
  FileText,
  DollarSign,
  AlertTriangle,
  Lock,
  ArrowRight,
  History,
  Info,
  Calendar,
  Send,
  Eye,
  KeyRound,
  FileCheck,
  ChevronRight,
  Layers,
  MapPin,
  Building
} from 'lucide-react';

interface Props {
  projects: Project[];
  activeProjectId?: string;
  quotes?: Quote[];
  activeQuoteId?: string;
  clientToken?: string;
  catalogue?: MasterPricingCatalogue;
  onUpdateProject: (updated: Project) => void;
  onUpdateQuote?: (updated: Quote) => void;
  onAddQuote?: (newQuote: Quote) => void;
  onReturnToStaff: () => void;
}

type PortalTab = 'financials' | 'quotes' | 'overview' | 'photos' | 'documents' | 'audit';

export const ClientPortal: React.FC<Props> = ({
  projects,
  activeProjectId,
  quotes = [],
  activeQuoteId,
  clientToken,
  catalogue,
  onUpdateProject,
  onUpdateQuote,
  onAddQuote,
  onReturnToStaff,
}) => {
  // 1. Project Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId) return activeProjectId;
    if (activeQuoteId) {
      const q = quotes.find(item => item.id === activeQuoteId);
      if (q?.projectId) return q.projectId;
    }
    return projects[0]?.id || '';
  });

  const project = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Quotes relevant to this project
  const projectQuotes = useMemo(() => {
    if (!project) return [];
    return quotes.filter(q => 
      q.projectId === project.id || 
      (q.leadId && q.leadId === project.leadId) ||
      (q.clientEmail && q.clientEmail.toLowerCase() === project.clientEmail?.toLowerCase())
    ).sort((a, b) => (b.version || 1) - (a.version || 1));
  }, [quotes, project]);

  // Active Quote selection
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(() => {
    if (activeQuoteId) return activeQuoteId;
    if (project?.currentAcceptedQuoteId) return project.currentAcceptedQuoteId;
    return projectQuotes[0]?.id || '';
  });

  const activeQuote = useMemo(() => {
    return projectQuotes.find(q => q.id === selectedQuoteId) || projectQuotes[0];
  }, [projectQuotes, selectedQuoteId]);

  // Account Activation & View Mode
  const isAccountActive = Boolean(project?.clientAccountActivated);
  const [activeTab, setActiveTab] = useState<PortalTab>(isAccountActive ? 'financials' : 'quotes');
  const [viewQuoteMode, setViewQuoteMode] = useState<boolean>(!isAccountActive);

  // Modals
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isRequestPricingModalOpen, setIsRequestPricingModalOpen] = useState(false);
  const [isRequestAmendmentModalOpen, setIsRequestAmendmentModalOpen] = useState(false);

  // Acceptance Form State
  const [signerName, setSignerName] = useState(project?.clientName || '');
  const [signerEmail, setSignerEmail] = useState(project?.clientEmail || '');
  const [portalPassword, setPortalPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [requestNote, setRequestNote] = useState('');

  // Toast Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  if (!project) {
    return (
      <div className="p-12 text-center text-slate-500">
        No active project found for client portal.
      </div>
    );
  }

  // Quote Status and Expiry Calculations
  const effectiveQuoteStatus: QuoteStatus = activeQuote ? getEffectiveQuoteStatus(activeQuote) : 'draft';
  const isExpired = activeQuote ? (effectiveQuoteStatus === 'expired' || isQuoteExpired(activeQuote)) : false;
  const daysRemaining = activeQuote ? getDaysUntilExpiry(activeQuote) : 30;
  const isAccepted = effectiveQuoteStatus === 'accepted';
  const isSuperseded = effectiveQuoteStatus === 'superseded';
  const canAcceptOrDecline = activeQuote && ['sent', 'viewed', 'viewed_by_client'].includes(effectiveQuoteStatus) && !isExpired && !activeQuote.isLocked;

  // Financial Calculations
  const agreedContractTotal = project.contractValueNZD || activeQuote?.totalNZD || 0;
  const projectInvoices = project.invoices || [];
  const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + (inv.totalNZD || 0), 0);
  const totalPaid = projectInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.totalNZD || 0), 0);
  const balanceRemaining = Math.max(0, agreedContractTotal - totalPaid);

  // Visibility Settings
  const vis = project.visibilitySettings || {
    photos: true,
    deliveryDate: true,
    installStartDate: true,
    estimatedCompletionDate: false, // SENSITIVE: Default hidden
    documents: true
  };

  // Handlers
  const handleConfirmAcceptQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote || !termsAgreed || !signerName.trim() || !signerEmail.trim()) {
      showToast('Please confirm all required authorization fields and agree to the contract terms.', 'error');
      return;
    }

    try {
      const { updatedQuote, updatedProject } = acceptQuoteByClient(
        activeQuote,
        signerName.trim(),
        signerEmail.trim(),
        `Digitally Accepted by ${signerName.trim()}`,
        project
      );

      // Save password activation
      const activatedProject: Project = {
        ...updatedProject,
        clientAccountActivated: true
      };

      if (onUpdateQuote) onUpdateQuote(updatedQuote);
      onUpdateProject(activatedProject);

      setIsAcceptModalOpen(false);
      setViewQuoteMode(false);
      setActiveTab('financials');
      showToast(`Contract ${activeQuote.quoteNumber} accepted & locked! Your Archtech Client Portal account is now activated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote.', 'error');
    }
  };

  const handleConfirmDeclineQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    const nowIso = new Date().toISOString();
    const auditEntry: QuoteAuditEntry = {
      id: `aud-${Date.now()}-dec`,
      timestamp: nowIso,
      action: 'declined',
      actor: signerName || project.clientName,
      actorType: 'client',
      details: `Client declined quote. Reason: ${declineReason || 'No specific reason provided.'}`,
      versionNumber: activeQuote.version || 1
    };

    const updatedQuote: Quote = {
      ...activeQuote,
      status: 'declined',
      declinedReason: declineReason,
      auditTrail: [auditEntry, ...(activeQuote.auditTrail || [])]
    };

    if (onUpdateQuote) onUpdateQuote(updatedQuote);
    setIsDeclineModalOpen(false);
    showToast('Quote status marked as declined. Our estimating team will follow up.', 'info');
  };

  const handleRequestPricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    const nowIso = new Date().toISOString();
    const auditEntry: QuoteAuditEntry = {
      id: `aud-${Date.now()}-rq`,
      timestamp: nowIso,
      action: 'amendment_requested',
      actor: project.clientName,
      actorType: 'client',
      details: `Client requested updated matrix pricing on expired quote (${activeQuote.quoteNumber}). Notes: ${requestNote || 'Refresh pricing requested.'}`,
      versionNumber: activeQuote.version || 1
    };

    const updatedQuote: Quote = {
      ...activeQuote,
      clientAmendmentRequest: `[Pricing Refresh Requested ${nowIso.slice(0, 10)}]: ${requestNote || 'Please update pricing to current price matrix schedule.'}`,
      auditTrail: [auditEntry, ...(activeQuote.auditTrail || [])]
    };

    if (onUpdateQuote) onUpdateQuote(updatedQuote);
    setIsRequestPricingModalOpen(false);
    setRequestNote('');
    showToast('Price update request submitted to Archtech estimating team. You will be notified with a revised version.', 'success');
  };

  const handleRequestAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote || !requestNote.trim()) return;

    const nowIso = new Date().toISOString();
    const auditEntry: QuoteAuditEntry = {
      id: `aud-${Date.now()}-amend`,
      timestamp: nowIso,
      action: 'amendment_requested',
      actor: project.clientName,
      actorType: 'client',
      details: `Client requested scope amendment on ${activeQuote.quoteNumber}: ${requestNote}`,
      versionNumber: activeQuote.version || 1
    };

    const updatedQuote: Quote = {
      ...activeQuote,
      clientAmendmentRequest: requestNote,
      auditTrail: [auditEntry, ...(activeQuote.auditTrail || [])]
    };

    if (onUpdateQuote) onUpdateQuote(updatedQuote);
    setIsRequestAmendmentModalOpen(false);
    setRequestNote('');
    showToast('Scope amendment request sent. Archtech will review and issue a new dated version.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* ----------------------------------------------------------------- */}
      {/* TOP HEADER: BRANDING, STATUS & NAVIGATION                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <ArchtechLogo variant="dark" className="h-9 w-auto object-left" />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider">
                Client Portal
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="font-bold text-slate-200">{project.projectNumber}</span>
              <span>·</span>
              <span>{project.siteAddress}</span>
              <span>·</span>
              <span className="text-slate-300">{project.clientName}</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight">
              {project.title}
            </h1>
          </div>

          {/* Quick Access Switches & Staff Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* View Mode Toggle: Proposal View vs Full Portal Hub */}
            <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewQuoteMode(true)}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewQuoteMode 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Quote Document</span>
              </button>

              <button
                type="button"
                onClick={() => setViewQuoteMode(false)}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  !viewQuoteMode 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Project Financials & Status</span>
              </button>
            </div>

            {/* Return to Staff CRM */}
            <button
              onClick={onReturnToStaff}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Exit to Staff CRM
            </button>
          </div>
        </div>

        {/* Global Security & Trust Banner */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>High-Trust Guarantee: All quote versions immutable. Zero silent changes.</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {isAccountActive ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Client Account Active
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pre-Acceptance Mode (Sign quote to activate)
              </span>
            )}
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 transition-all shadow-xs ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : feedbackMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : feedbackMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMessage.text}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODE 1: QUOTE DOCUMENT & 30-DAY VALIDITY / ACCEPTANCE FLOW         */}
      {/* ----------------------------------------------------------------- */}
      {viewQuoteMode && (
        <div className="space-y-6">
          {/* Quote Version Switcher Ribbon */}
          {projectQuotes.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Available Quote Versions:</span>
                <span className="text-slate-500">Every change generates a new dated version.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {projectQuotes.map((q) => {
                  const isCurrent = q.id === activeQuote?.id;
                  const isSup = q.status === 'superseded';
                  const isAcc = q.status === 'accepted';
                  const isExp = q.status === 'expired' || isQuoteExpired(q);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuoteId(q.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{q.quoteNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                        isAcc 
                          ? 'bg-emerald-500 text-white' 
                          : isSup 
                          ? 'bg-slate-300 text-slate-800'
                          : isExp
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}>
                        {isAcc ? 'Accepted' : isSup ? 'Superseded' : isExp ? 'Expired' : 'Current'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeQuote ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* QUOTE STATUS CALLOUT BANNER */}
              {isSuperseded && (
                <div className="bg-slate-100 border-b border-slate-200 p-4 text-slate-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-bold">This version is Superseded (v{activeQuote.version || 1})</span>
                      <p className="text-slate-600 mt-0.5">
                        A newer dated revision was issued on {activeQuote.supersededAt || 'site'}. Historical terms and pricing are locked.
                      </p>
                    </div>
                  </div>
                  {projectQuotes.find(q => q.status !== 'superseded') && (
                    <button
                      onClick={() => {
                        const latest = projectQuotes.find(q => q.status !== 'superseded');
                        if (latest) setSelectedQuoteId(latest.id);
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    >
                      View Latest Version →
                    </button>
                  )}
                </div>
              )}

              {isAccepted && (
                <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Quote Accepted & Contract Legally Locked</span>
                      <p className="text-emerald-800 mt-0.5">
                        Accepted by {activeQuote.acceptedBy || activeQuote.clientSignature || project.clientName} on {formatDate(activeQuote.signedAt || activeQuote.issueDate)}. Contract sum: {formatNZD(activeQuote.totalNZD)}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md font-bold">
                      Locked Version {activeQuote.version || 1}.0
                    </span>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="bg-rose-50 border-b border-rose-200 p-4 text-rose-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm">Quote Validity Expired (30-Day Window Closed)</span>
                      <p className="text-rose-800 mt-0.5">
                        This quote was valid for 30 days from issue ({formatDate(activeQuote.issueDate)}) and expired on {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}. Because metal coil, coating, and transport costs fluctuate, accept/decline is closed until pricing is refreshed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsRequestPricingModalOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Current Pricing</span>
                    </button>
                    <button
                      onClick={() => setIsRequestAmendmentModalOpen(true)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Request Scope Amendment
                    </button>
                  </div>
                </div>
              )}

              {canAcceptOrDecline && (
                <div className="bg-sky-50 border-b border-sky-200 p-4 text-sky-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-700 shrink-0" />
                    <div>
                      <span className="font-bold">Active Official Proposal · {daysRemaining} days remaining</span>
                      <p className="text-sky-800 mt-0.5">
                        Valid until {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}. Review the agreed architectural specifications below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setIsDeclineModalOpen(true)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      Decline / Questions
                    </button>
                    <button
                      onClick={() => setIsAcceptModalOpen(true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept & Authorize Quote</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DOCUMENT BODY */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Proposal Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {activeQuote.quoteNumber}
                      </span>
                      <span>·</span>
                      <span>Version {activeQuote.version || 1}.0</span>
                      <span>·</span>
                      <span>Issued: {formatDate(activeQuote.issueDate)}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                      {activeQuote.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Architectural metal roofing &amp; wall cladding supply, fabrication, and installation.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Contract Sum (NZD)</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-0.5">
                      {formatNZD(activeQuote.totalNZD)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Subtotal: {formatNZD(activeQuote.subtotalNZD)} + 15% GST: {formatNZD(activeQuote.gstNZD)}
                    </span>
                  </div>
                </div>

                {/* Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Profile System</span>
                    <div className="font-bold text-slate-900 mt-0.5">{activeQuote.profile}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Material & Coating</span>
                    <div className="font-bold text-slate-900 mt-0.5">{activeQuote.material}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Finish & Color</span>
                    <div className="font-bold text-slate-900 mt-0.5">{activeQuote.colorName}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Measured Area</span>
                    <div className="font-bold text-slate-900 mt-0.5 font-mono">{activeQuote.roofAreaM2} m²</div>
                  </div>
                </div>

                {/* Architectural Diagram */}
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block mb-2">Architectural Seam Geometry</span>
                  <ArchitecturalSvgDiagram profile={activeQuote.profile} />
                </div>

                {/* Line Items Breakdown Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Scope of Works & Line Items
                  </h3>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {/* Material line */}
                    <div className="p-3.5 bg-white flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">
                          {activeQuote.profile} Roll-Formed Trays ({activeQuote.material} - {activeQuote.colorName})
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Supply of custom length standing seam trays manufactured from TRS coil stock.
                        </p>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-right">
                        {formatNZD(activeQuote.materialTotalNZD || activeQuote.materialCostNZD)}
                      </div>
                    </div>

                    {/* Flashings line */}
                    {activeQuote.flashingsTotalNZD && activeQuote.flashingsTotalNZD > 0 && (
                      <div className="p-3.5 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Custom Architectural Folded Flashings</span>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Ridge, barge, apron, and gutter flashings fabricated in workshop to exact site measures.
                          </p>
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-right">
                          {formatNZD(activeQuote.flashingsTotalNZD)}
                        </div>
                      </div>
                    )}

                    {/* Labour line */}
                    {activeQuote.labourTotalNZD && activeQuote.labourTotalNZD > 0 && (
                      <div className="p-3.5 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Certified Trade Installation & Seaming</span>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Installation of synthetic underlay, clip fixing, mechanical seaming, and site supervision.
                          </p>
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-right">
                          {formatNZD(activeQuote.labourTotalNZD)}
                        </div>
                      </div>
                    )}

                    {/* Hardware & Fasteners */}
                    {activeQuote.hardwareTotalNZD && activeQuote.hardwareTotalNZD > 0 && (
                      <div className="p-3.5 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Stainless Steel Fixing Clips & Fasteners</span>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Sliding expansion cleats, low-profile screws, butyl sealants, and foam infills.
                          </p>
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-right">
                          {formatNZD(activeQuote.hardwareTotalNZD)}
                        </div>
                      </div>
                    )}

                    {/* Freight & Cartage */}
                    {activeQuote.freightTotalNZD && activeQuote.freightTotalNZD > 0 && (
                      <div className="p-3.5 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">Site Delivery & HIAB Crane Unloading</span>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Specialized long-length transport and rooftop crane lift to site storage zones.
                          </p>
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-right">
                          {formatNZD(activeQuote.freightTotalNZD)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit & Validity Notice Footer */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Archtech Quality & Weather Guarantee</span>
                  </div>
                  <p>
                    All works installed strictly in accordance with MRM Code of Practice and manufacturer specifications. 
                    Quote is legally binding upon digital acceptance and locks material supply rates.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Quote Token: {activeQuote.clientToken || 'sec_token_active'}</span>
                    <span>Valid Through: {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}</span>
                  </div>
                </div>

                {/* Bottom Acceptance Bar if valid */}
                {canAcceptOrDecline && (
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      <span>Ready to lock this version and authorize fabrication?</span>
                      <span className="block font-medium text-slate-800">
                        Total investment: {formatNZD(activeQuote.totalNZD)} (incl. 15% GST)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsDeclineModalOpen(true)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Decline Quote
                      </button>
                      <button
                        onClick={() => setIsAcceptModalOpen(true)}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept & Authorize Contract</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No quote selected. Choose a quote from the versions above.
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODE 2: FULL CLIENT PORTAL HUB (POST-ACCEPTANCE & TRANSPARENCY)   */}
      {/* ----------------------------------------------------------------- */}
      {!viewQuoteMode && (
        <div className="space-y-6">
          {/* Navigation Tabs Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1.5 shadow-2xs">
            <button
              onClick={() => setActiveTab('financials')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'financials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Financial Position & Claims</span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'quotes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Quote History ({projectQuotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Project Status & Dates</span>
            </button>

            {/* Conditionally rendered tab: Photos */}
            {vis.photos && (
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'photos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Site Photos ({project.photos.length})</span>
              </button>
            )}

            {/* Conditionally rendered tab: Documents */}
            {vis.documents && (
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'documents'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Documents & Warranties</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* TAB CONTENT 1: FINANCIAL POSITION & INVOICING */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              {/* Financial Position Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Agreed Contract Total
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
                    {formatNZD(agreedContractTotal)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Locked from Quote {project.currentAcceptedQuoteId || 'ARCH-Q-092'}
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Invoiced to Date
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-sky-900 mt-1">
                    {formatNZD(totalInvoiced)}
                  </div>
                  <span className="text-[11px] text-sky-700 mt-0.5 block font-semibold">
                    {agreedContractTotal > 0 ? `${Math.round((totalInvoiced / agreedContractTotal) * 100)}% of contract claimed` : '0%'}
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Paid to Date
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-1">
                    {formatNZD(totalPaid)}
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block font-semibold">
                    Confirmed bank receipts
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Balance Remaining
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
                    {formatNZD(balanceRemaining)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Retained until milestone stages
                  </span>
                </div>
              </div>

              {/* Invoices List with Attached Progress Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Progress Claims & Tax Invoices
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Progress claims against your agreed contract, each accompanied by verified site progress notes.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {projectInvoices.length > 0 ? (
                    projectInvoices.map((inv: ProjectInvoice) => {
                      const isPaid = inv.status === 'paid';
                      return (
                        <div
                          key={inv.id}
                          className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                {inv.invoiceNumber}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{inv.claimStage}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}>
                                {isPaid ? 'Paid' : 'Due'}
                              </span>
                            </div>

                            <div className="text-right font-mono">
                              <span className="text-base font-bold text-slate-900">
                                {formatNZD(inv.totalNZD)}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                (Excl. GST: {formatNZD(inv.amountNZD)})
                              </span>
                            </div>
                          </div>

                          {/* Progress Notes explaining the claim */}
                          <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Progress Notes for this Claim:
                            </span>
                            <p className="text-slate-700 leading-relaxed font-sans">
                              {inv.progressNotes || 'Progress claim corresponding to completed delivery and installation phases.'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] font-mono text-slate-500">
                            <div className="flex items-center gap-3">
                              <span>Issued: {formatDate(inv.dateIssued)}</span>
                              <span>·</span>
                              <span>Due: {formatDate(inv.dueDate)}</span>
                              {inv.paidAt && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-semibold">Paid: {formatDate(inv.paidAt)}</span>
                                </>
                              )}
                            </div>

                            <button
                              onClick={() => showToast(`Invoice ${inv.invoiceNumber} PDF download initiated`, 'info')}
                              className="text-sky-700 hover:text-sky-900 font-sans font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download GST Tax Invoice</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No progress claim invoices have been raised yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: QUOTE HISTORY & VERSION TIMELINE */}
          {activeTab === 'quotes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Quote Version History &amp; Immutability Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete record of all quotes issued for this project. Previous versions are permanently retained and marked Superseded.
                </p>
              </div>

              <div className="space-y-4">
                {projectQuotes.map((q) => {
                  const isCurrent = q.id === activeQuote?.id;
                  const isAcc = q.status === 'accepted';
                  const isSup = q.status === 'superseded';
                  const isExp = q.status === 'expired' || isQuoteExpired(q);

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-xl border transition-all ${
                        isAcc
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isSup
                          ? 'bg-slate-50 border-slate-200'
                          : isExp
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {q.quoteNumber}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              (Version {q.version || 1}.0)
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                              isAcc
                                ? 'bg-emerald-200 text-emerald-900'
                                : isSup
                                ? 'bg-slate-200 text-slate-700'
                                : isExp
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-amber-200 text-amber-900'
                            }`}>
                              {isAcc ? 'Accepted & Locked' : isSup ? 'Superseded' : isExp ? 'Expired' : 'Current'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {q.title} · {q.profile} · {q.material} ({q.colorName})
                          </p>
                          {isSup && q.supersededReason && (
                            <p className="text-[11px] text-slate-500 italic">
                              Superseded: {q.supersededReason}
                            </p>
                          )}
                          {isAcc && q.acceptedBy && (
                            <p className="text-[11px] text-emerald-800 font-medium">
                              ✓ Accepted by {q.acceptedBy} on {formatDate(q.signedAt || q.issueDate)}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <div className="text-right font-mono">
                            <span className="text-lg font-bold text-slate-900">
                              {formatNZD(q.totalNZD)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Issued {formatDate(q.issueDate)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedQuoteId(q.id);
                              setViewQuoteMode(true);
                            }}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Proposal</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: PROJECT STATUS & SENSITIVE DATES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress Overview Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Overall Project Progress
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {project.progressPercent}% Completed
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-100 uppercase tracking-wide font-mono">
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Key Dates Card (With Strict Estimated Completion Date Protection) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Key Project & Site Dates</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Delivery Date */}
                  {vis.deliveryDate && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Tray & Coil Delivery
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                        {project.deliveryDate ? formatDate(project.deliveryDate) : 'Window to be scheduled'}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">TRS HIAB truck delivery</span>
                    </div>
                  )}

                  {/* Install Start Date */}
                  {vis.installStartDate && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Installation Start Date
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                        {project.installStartDate || project.startDate ? formatDate(project.installStartDate || project.startDate) : 'To be confirmed'}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Substrate verified ready</span>
                    </div>
                  )}

                  {/* Estimated Completion Date: SENSITIVE - MUST ONLY SHOW IF vis.estimatedCompletionDate === true */}
                  {vis.estimatedCompletionDate === true ? (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 font-bold uppercase block">
                        Estimated Practical Completion
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                        {formatDate(project.estimatedCompletionDate || project.targetCompletionDate)}
                      </div>
                      <span className="text-[10px] text-amber-700 mt-0.5 block">
                        Staff enabled for client view
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Milestones Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Installation Milestones & Quality Sign-offs
                </h4>

                <div className="space-y-3">
                  {project.milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                        m.completed ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {m.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">Step 0{idx + 1}</span>
                          <h5 className="font-bold text-slate-900">{m.title}</h5>
                        </div>
                        {m.description && <p className="text-slate-600 mt-0.5">{m.description}</p>}
                        {m.completed && m.completedAt && (
                          <span className="text-[11px] font-mono text-slate-500 block mt-1">
                            Verified on {formatDate(m.completedAt)} by {m.inspectorName || 'Archtech Lead'}
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.completed ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: SITE PHOTOS (IF ENABLED) */}
          {activeTab === 'photos' && vis.photos && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Site Progress Photos</h3>
                  <p className="text-xs text-slate-500">Live photography captured by our roofing crew during installation.</p>
                </div>
                <span className="text-xs font-mono text-slate-500">{project.photos.length} photos</span>
              </div>

              {project.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {project.photos.map((photo) => (
                    <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <div className="aspect-video bg-slate-200 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-slate-900">{photo.caption}</p>
                        <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                          {formatDate(photo.takenAt)} · {photo.phase}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Photos are currently being curated by your project supervisor.
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 5: DOCUMENTS & WARRANTIES */}
          {activeTab === 'documents' && vis.documents && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Project Documents & Council Compliance</h3>
                <p className="text-xs text-slate-500">Downloadable certificates, producer statements, and manufacturer warranties.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Producer Statement PS3</h4>
                    <p className="text-slate-600 mt-0.5">Roofing &amp; Cladding Installation</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                      Council Status: {project.ps3Status?.replace('_', ' ') || 'In Progress'}
                    </span>
                  </div>
                  <Download className="w-4 h-4 text-slate-600 shrink-0 cursor-pointer" />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">The Roofing Store Warranty</h4>
                    <p className="text-slate-600 mt-0.5">25-Year Marine Grade Certificate</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                      Certificate # TRS-ARCH-2026-992
                    </span>
                  </div>
                  <Download className="w-4 h-4 text-slate-600 shrink-0 cursor-pointer" />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Care &amp; Maintenance Specs</h4>
                    <p className="text-slate-600 mt-0.5">Coastal Zone Washing Schedule</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                      Annual wash-down specs
                    </span>
                  </div>
                  <Download className="w-4 h-4 text-slate-600 shrink-0 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 6: AUDIT TRAIL & HIGH-TRUST TRANSPARENCY */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transparency Audit Trail (No Silent Changes)
                </h3>
                <p className="text-xs text-slate-500">
                  Cryptographically trackable record of every quote issuance, acceptance, matrix recalculation, and scope update.
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {activeQuote?.auditTrail && activeQuote.auditTrail.length > 0 ? (
                  activeQuote.auditTrail.map((entry: QuoteAuditEntry) => (
                    <div key={entry.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 capitalize">
                            {entry.action.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Version {entry.versionNumber}.0
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {entry.actorType}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{entry.details}</p>
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-400 shrink-0">
                        <span>{entry.actor}</span>
                        <span className="block">{entry.timestamp.replace('T', ' ').slice(0, 16)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Audit log initiated upon quote creation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 1: ACCEPT & AUTHORIZE QUOTE (ACCOUNT ACTIVATION)            */}
      {/* ----------------------------------------------------------------- */}
      {isAcceptModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                  Digital Authorization &amp; Account Activation
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Accept Quote {activeQuote.quoteNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsAcceptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Agreed Contract Sum:</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatNZD(activeQuote.totalNZD)}
                </span>
              </div>
              <div className="text-right text-slate-500">
                <span>Version {activeQuote.version || 1}.0</span>
                <span className="block text-[11px]">Valid Until: {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Full Authorized Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Julian Vance"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="e.g. julian@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Portal Password (to unlock your private portal) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-800 leading-snug">
                    I confirm I am authorized to enter this agreement. I accept this quote specification, locking this version and contract price of <strong>{formatNZD(activeQuote.totalNZD)}</strong>.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!termsAgreed}
                  className={`px-5 py-2 rounded-lg font-bold text-white transition-all ${
                    termsAgreed 
                      ? 'bg-emerald-700 hover:bg-emerald-800 shadow-md cursor-pointer' 
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Confirm Acceptance &amp; Activate Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 2: DECLINE / QUESTIONS                                      */}
      {/* ----------------------------------------------------------------- */}
      {isDeclineModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Decline Quote {activeQuote.quoteNumber}</h3>
            <p className="text-xs text-slate-500">
              Please share any feedback or requirements that would assist our detailing team in issuing a revised option.
            </p>

            <form onSubmit={handleConfirmDeclineQuote} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for declining / feedback:</label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Seeking alternative profile, budget target revision..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeclineModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 3: REQUEST CURRENT PRICING (EXPIRED QUOTES)                 */}
      {/* ----------------------------------------------------------------- */}
      {isRequestPricingModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-slate-900" />
              <h3 className="text-base font-bold text-slate-900">Request Current Pricing</h3>
            </div>
            <p className="text-xs text-slate-500">
              Because this quote expired on {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}, our team will refresh unit rates against our active coil and fabrication matrix and issue a new dated version.
            </p>

            <form onSubmit={handleRequestPricing} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional notes or timeline:</label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Planning to start in 6 weeks, please confirm lead times..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestPricingModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Pricing Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 4: REQUEST SCOPE AMENDMENT                                  */}
      {/* ----------------------------------------------------------------- */}
      {isRequestAmendmentModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Scope Amendment</h3>
            <p className="text-xs text-slate-500">
              Describe any alterations to profiles, materials, colours, or coverage areas. We will recalculate and generate a new dated version.
            </p>

            <form onSubmit={handleRequestAmendment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Scope changes required *</label>
                <textarea
                  rows={3}
                  required
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Please recalculate with 0.55mm MagnaFlow in Sandstone Grey..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestAmendmentModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Send Amendment Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function RotateCcw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
