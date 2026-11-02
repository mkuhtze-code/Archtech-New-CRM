/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lead, 
  Project, 
  CoilStock, 
  AccessoryStock, 
  Quote, 
  EmailAutomationRule, 
  OutboxEmail,
  SiteVisitInspection,
  MasterPricingCatalogue,
  TimeEntry,
  ActivityLogItem,
  TeamMember 
} from './types/crm';
import { 
  INITIAL_LEADS, 
  INITIAL_PROJECTS, 
  INITIAL_COIL_STOCK, 
  INITIAL_ACCESSORY_STOCK, 
  INITIAL_QUOTES, 
  INITIAL_EMAIL_RULES, 
  INITIAL_OUTBOX, 
  INITIAL_SITE_INSPECTIONS,
  INITIAL_TEAM_MEMBERS 
} from './data/initialData';
import { INITIAL_PRICING_CATALOGUE } from './data/pricingCatalogue';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { JobStatusBoard } from './components/JobStatusBoard';
import { LeadPipeline } from './components/LeadPipeline';
import { ProjectProgress } from './components/ProjectProgress';
import { InventoryManager } from './components/InventoryManager';
import { QuoteBuilder } from './components/QuoteBuilder';
import { PricingCatalogueManager } from './components/PricingCatalogueManager';
import { EmailAutomations } from './components/EmailAutomations';
import { ClientPortal } from './components/ClientPortal';
import { MobileSiteVisit } from './components/MobileSiteVisit';
import { OnsiteJobHub } from './components/OnsiteJobHub';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { LogTimeModal } from './components/LogTimeModal';
import { NewJobModal } from './components/NewJobModal';
import { OneDriveSyncModal } from './components/OneDriveSyncModal';
import { FlashingWorkshop } from './components/FlashingWorkshop';

export default function App() {
  // State with LocalStorage persistence
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('archtech_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('archtech_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [coils, setCoils] = useState<CoilStock[]>(() => {
    const saved = localStorage.getItem('archtech_coils');
    return saved ? JSON.parse(saved) : INITIAL_COIL_STOCK;
  });

  const [accessories, setAccessories] = useState<AccessoryStock[]>(() => {
    const saved = localStorage.getItem('archtech_accessories');
    return saved ? JSON.parse(saved) : INITIAL_ACCESSORY_STOCK;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('archtech_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [emailRules, setEmailRules] = useState<EmailAutomationRule[]>(() => {
    const saved = localStorage.getItem('archtech_email_rules');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_RULES;
  });

  const [outbox, setOutbox] = useState<OutboxEmail[]>(() => {
    const saved = localStorage.getItem('archtech_outbox');
    return saved ? JSON.parse(saved) : INITIAL_OUTBOX;
  });

  const [inspections, setInspections] = useState<SiteVisitInspection[]>(() => {
    const saved = localStorage.getItem('archtech_inspections');
    return saved ? JSON.parse(saved) : INITIAL_SITE_INSPECTIONS;
  });

  const [catalogue, setCatalogue] = useState<MasterPricingCatalogue>(() => {
    const saved = localStorage.getItem('archtech_pricing_catalogue');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_CATALOGUE;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('archtech_team_members');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  // App Layout & Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('status_board');
  const [showAdvancedSite, setShowAdvancedSite] = useState(false);
  const [isClientPortalMode, setIsClientPortalMode] = useState<boolean>(false);
  const [activePortalProjectId, setActivePortalProjectId] = useState<string>(projects[0]?.id || '');
  const [activePortalQuoteId, setActivePortalQuoteId] = useState<string | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [prefillQuoteLead, setPrefillQuoteLead] = useState<Lead | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Deep linking via URL parameters (e.g. ?quoteId=quote-01-v2&token=sec_...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get('quoteId');
      const pId = urlParams.get('projectId') || urlParams.get('portalProject');
      if (qId) {
        setActivePortalQuoteId(qId);
        const targetQ = quotes.find(q => q.id === qId);
        if (targetQ?.projectId) {
          setActivePortalProjectId(targetQ.projectId);
        }
        setIsClientPortalMode(true);
      } else if (pId) {
        setActivePortalProjectId(pId);
        setIsClientPortalMode(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Modals state
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState<boolean>(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState<boolean>(false);
  const [isOneDriveModalOpen, setIsOneDriveModalOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('archtech_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('archtech_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('archtech_coils', JSON.stringify(coils));
  }, [coils]);

  useEffect(() => {
    localStorage.setItem('archtech_accessories', JSON.stringify(accessories));
  }, [accessories]);

  useEffect(() => {
    localStorage.setItem('archtech_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('archtech_pricing_catalogue', JSON.stringify(catalogue));
  }, [catalogue]);

  useEffect(() => {
    localStorage.setItem('archtech_email_rules', JSON.stringify(emailRules));
  }, [emailRules]);

  useEffect(() => {
    localStorage.setItem('archtech_outbox', JSON.stringify(outbox));
  }, [outbox]);

  useEffect(() => {
    localStorage.setItem('archtech_inspections', JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem('archtech_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Lead Handlers
  const handleUpdateLead = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleCreateQuoteFromLead = (lead: Lead) => {
    setPrefillQuoteLead(lead);
    setActiveTab('quotes');
  };

  // Project Handlers
  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const handleOpenClientPortal = (projectId: string) => {
    setActivePortalProjectId(projectId);
    setActivePortalQuoteId(undefined);
    setIsClientPortalMode(true);
  };

  const handleOpenQuoteInPortal = (quoteId: string, projectId?: string) => {
    setActivePortalQuoteId(quoteId);
    if (projectId) {
      setActivePortalProjectId(projectId);
    } else {
      const q = quotes.find(item => item.id === quoteId);
      if (q?.projectId) setActivePortalProjectId(q.projectId);
    }
    setIsClientPortalMode(true);
  };

  const handleOpenProjectDetails = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsClientPortalMode(false);
    setActiveTab('projects');
  };

  const handleSaveTimeEntry = (entry: TimeEntry) => {
    const targetProject = projects.find((p) => p.id === entry.projectId);
    if (!targetProject) return;

    const activityItem: ActivityLogItem = {
      id: `act-${Date.now()}`,
      entityId: targetProject.id,
      entityType: 'project',
      type: 'time_logged',
      title: `Logged ${entry.hours} hrs: ${entry.taskType}`,
      details: `${entry.foreman} recorded ${entry.hours} hrs on site. Notes: ${entry.notes || 'Routine task execution'}.`,
      author: entry.foreman,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedProject: Project = {
      ...targetProject,
      timeEntries: [entry, ...(targetProject.timeEntries || [])],
      activityFeed: [activityItem, ...(targetProject.activityFeed || [])]
    };

    handleUpdateProject(updatedProject);
  };

  // Inventory Handlers
  const handleUpdateCoil = (updated: CoilStock) => {
    setCoils((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddCoil = (newCoil: CoilStock) => {
    setCoils((prev) => [newCoil, ...prev]);
  };

  const handleUpdateAccessory = (updated: AccessoryStock) => {
    setAccessories((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // Quote Handlers
  const handleUpdateQuote = (updated: Quote) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleAddQuote = (newQuote: Quote) => {
    setQuotes((prev) => [newQuote, ...prev]);
  };

  // Pricing Catalogue Handler
  const handleUpdateCatalogue = (updated: MasterPricingCatalogue) => {
    setCatalogue(updated);
  };

  // Email Automation Handlers
  const handleUpdateRule = (updated: EmailAutomationRule) => {
    setEmailRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSendManualEmail = (email: OutboxEmail) => {
    setOutbox((prev) => [email, ...prev]);
  };

  // Site Inspection Handlers
  const handleAddInspection = (newInspection: SiteVisitInspection) => {
    setInspections((prev) => [newInspection, ...prev]);
  };

  const isFieldRoute = ['/site', '/field'].includes(window.location.pathname.replace(/\/+$/, ''));

  if (isFieldRoute) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
        <OnsiteJobHub projects={projects} onUpdateProject={handleUpdateProject} initialProjectId={selectedProjectId} teamMembers={teamMembers} onOpenAdvanced={() => { window.location.hash = '#more'; }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased overflow-x-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isClientPortalMode={isClientPortalMode}
        setIsClientPortalMode={setIsClientPortalMode}
        onQuickNewJob={() => setIsNewJobModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Navigation (Omni-Search, Quick Actions, Notifications) */}
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          projects={projects}
          quotes={quotes}
          leads={leads}
          isClientPortalMode={isClientPortalMode}
          setIsClientPortalMode={setIsClientPortalMode}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setActiveTab('projects');
          }}
          onSelectQuote={(id) => {
            setActiveTab('quotes');
          }}
          onQuickNewJob={() => setIsNewJobModalOpen(true)}
          onQuickNewQuote={() => {
            setIsClientPortalMode(false);
            setActiveTab('quotes');
          }}
          onQuickNewLead={() => {
            setIsClientPortalMode(false);
            setActiveTab('leads');
          }}
          onOpenOneDrive={() => setIsOneDriveModalOpen(true)}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1700px] w-full mx-auto">
          {isClientPortalMode ? (
            <ClientPortal
              projects={projects}
              activeProjectId={activePortalProjectId}
              quotes={quotes}
              activeQuoteId={activePortalQuoteId}
              catalogue={catalogue}
              onUpdateProject={handleUpdateProject}
              onUpdateQuote={handleUpdateQuote}
              onAddQuote={handleAddQuote}
              onReturnToStaff={() => setIsClientPortalMode(false)}
            />
          ) : (
            <>
              {activeTab === 'status_board' && (
                <JobStatusBoard
                  projects={projects}
                  onUpdateProject={handleUpdateProject}
                  onOpenProjectDetails={handleOpenProjectDetails}
                  onAddNewProject={() => setIsNewJobModalOpen(true)}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleCalendar
                  projects={projects}
                  teamMembers={teamMembers}
                  onUpdateProject={handleUpdateProject}
                  onOpenProjectDetails={handleOpenProjectDetails}
                />
              )}

              {activeTab === 'leads' && (
                <LeadPipeline
                  leads={leads}
                  onUpdateLead={handleUpdateLead}
                  onAddLead={handleAddLead}
                  onCreateQuoteFromLead={handleCreateQuoteFromLead}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectProgress
                  projects={projects}
                  onUpdateProject={handleUpdateProject}
                  onOpenClientPortal={handleOpenClientPortal}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                />
              )}

              {activeTab === 'quotes' && (
                <QuoteBuilder
                  quotes={quotes}
                  leads={leads}
                  projects={projects}
                  catalogue={catalogue}
                  onUpdateQuote={handleUpdateQuote}
                  onAddQuote={handleAddQuote}
                  prefillLead={prefillQuoteLead}
                  onNavigateToCatalogue={() => setActiveTab('catalogue')}
                  onOpenClientPortalQuote={handleOpenQuoteInPortal}
                />
              )}

              {activeTab === 'catalogue' && (
                <PricingCatalogueManager
                  catalogue={catalogue}
                  onUpdateCatalogue={handleUpdateCatalogue}
                />
              )}

              {(activeTab === 'flashing_library' || activeTab === 'flashing_orders') && (
                <FlashingWorkshop
                  view={activeTab === 'flashing_orders' ? 'orders' : 'library'}
                  onChangeView={(view) => setActiveTab(view === 'orders' ? 'flashing_orders' : 'flashing_library')}
                  projects={projects}
                  activeMemberName={teamMembers[0]?.name || 'Archtech team'}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManager
                  coils={coils}
                  accessories={accessories}
                  projects={projects}
                  onUpdateCoil={handleUpdateCoil}
                  onAddCoil={handleAddCoil}
                  onUpdateAccessory={handleUpdateAccessory}
                />
              )}

              {activeTab === 'site_visit' && (
                showAdvancedSite ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAdvancedSite(false)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                    >
                      ← Back to simple job hub
                    </button>
                    <MobileSiteVisit
                      projects={projects}
                      inspections={inspections}
                      onAddInspection={handleAddInspection}
                      onUpdateProject={handleUpdateProject}
                      initialProjectId={selectedProjectId}
                      teamMembers={teamMembers}
                      onUpdateTeamMembers={setTeamMembers}
                    />
                  </div>
                ) : (
                  <OnsiteJobHub
                    projects={projects}
                    onUpdateProject={handleUpdateProject}
                    initialProjectId={selectedProjectId}
                    teamMembers={teamMembers}
                    onOpenAdvanced={(id) => {
                      setSelectedProjectId(id);
                      setShowAdvancedSite(true);
                    }}
                  />
                )
              )}

              {activeTab === 'automations' && (
                <EmailAutomations
                  rules={emailRules}
                  outbox={outbox}
                  leads={leads}
                  onUpdateRule={handleUpdateRule}
                  onSendManualEmail={handleSendManualEmail}
                />
              )}
            </>
          )}
        </main>

        {/* Trade Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-3 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Archtech Architectural Roofing</span>
            <span>·</span>
            <span>Job Management & Client CRM Suite</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">SiteWise Green Approved</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Primary Supplier: <a href="https://www.theroofingstore.co.nz" target="_blank" rel="noreferrer" className="text-slate-900 font-medium hover:underline">The Roofing Store</a></span>
            <span>·</span>
            <span>Quality Workmanship & Weather Guarantee</span>
          </div>
        </footer>
      </div>

      {/* Labour Time Logging Modal */}
      <LogTimeModal
        isOpen={isLogTimeModalOpen}
        onClose={() => setIsLogTimeModalOpen(false)}
        projects={projects}
        activeProjectId={selectedProjectId}
        initialHours={1.5}
        onSaveTimeEntry={handleSaveTimeEntry}
      />

      {/* New Trade Job Modal */}
      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        onAddProject={handleAddProject}
      />

      {/* OneDrive Cloud Sync Hub Modal */}
      <OneDriveSyncModal
        isOpen={isOneDriveModalOpen}
        onClose={() => setIsOneDriveModalOpen(false)}
        activeQuote={quotes[0]}
        activeProject={projects.find(p => p.id === selectedProjectId) || projects[0]}
        onSyncQuote={handleUpdateQuote}
      />
    </div>
  );
}