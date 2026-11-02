import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Bell, 
  ExternalLink, 
  ChevronDown, 
  FolderKanban,
  Calculator,
  UserCheck,
  Cloud,
  X
} from 'lucide-react';
import { Project, Quote, Lead } from '../types/crm';
import { formatNZD } from '../utils/formatters';
import { NavTab } from './Sidebar';
import { ArchtechLogo } from './ArchtechLogo';

interface TopBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  projects: Project[];
  quotes: Quote[];
  leads: Lead[];
  isClientPortalMode: boolean;
  setIsClientPortalMode: (portal: boolean) => void;
  onSelectProject: (projectId: string) => void;
  onSelectQuote: (quoteId: string) => void;
  onQuickNewJob: () => void;
  onQuickNewQuote: () => void;
  onQuickNewLead: () => void;
  onOpenOneDrive?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  quotes,
  leads,
  isClientPortalMode,
  setIsClientPortalMode,
  onSelectProject,
  onSelectQuote,
  onQuickNewJob,
  onQuickNewQuote,
  onQuickNewLead,
  onOpenOneDrive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) {
        setIsQuickActionOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Omni Search Results
  const matchingProjects = searchQuery.trim() 
    ? projects.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.siteAddress.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const matchingQuotes = searchQuery.trim() 
    ? quotes.filter(q =>
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.siteAddress.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const matchingLeads = searchQuery.trim() 
    ? leads.filter(l =>
        l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.companyOrArchitect && l.companyOrArchitect.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.projectAddress.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasResults = matchingProjects.length > 0 || matchingQuotes.length > 0 || matchingLeads.length > 0;

  // Pending items count
  const pendingVariations = projects.flatMap(p => (p.variations || []).filter(v => v.status === 'pending_client'));
  const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const notificationCount = pendingVariations.length + (pendingQuotes.length > 0 ? 1 : 0);

  // Tab Breadcrumb text
  const getBreadcrumbTitle = () => {
    if (isClientPortalMode) return 'Client Portal · Interactive Project Approvals';
    switch (activeTab) {
      case 'status_board': return 'Job Status Board · Trade Pipeline';
      case 'schedule': return 'Trade Schedule · Site & Crew Calendar';
      case 'projects': return 'Job Hub · Center of Gravity';
      case 'leads': return 'Leads & Enquiries · Client Pipeline';
      case 'quotes': return 'Architectural Quoting Suite';
      case 'catalogue': return 'Master Price Book · The Roofing Store';
      case 'flashing_library': return 'Flashing Workshop · Profile Designer';
      case 'flashing_orders': return 'Flashing Orders & Fabrication';
      case 'inventory': return 'Coil Stock & Metal Inventory';
      case 'site_visit': return 'On-Site Field · Today on Site';
      case 'automations': return 'Client Email Automations';
      default: return 'Archtech Architectural Roofing';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: View title & Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <ArchtechLogo variant="icon" className="w-8 h-8 object-contain shrink-0" />
        <div className="truncate">
          <span className="text-xs font-semibold text-slate-500 font-mono hidden md:inline">Archtech / </span>
          <span className="text-sm font-bold text-slate-900">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      {/* Center: Global Omni-Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, quotes, architects, addresses..."
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-lg text-slate-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 text-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {hasResults ? (
              <>
                {matchingProjects.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Projects & Jobs</span>
                    {matchingProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p.id);
                          setIsClientPortalMode(false);
                          setActiveTab('projects');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900 block truncate">{p.title}</span>
                          <span className="text-slate-500 text-[11px] truncate block">{p.projectNumber} · {p.clientName} · {p.siteAddress}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs shrink-0">{formatNZD(p.contractValueNZD)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchingQuotes.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Quoting Suite</span>
                    {matchingQuotes.map(q => (
                      <div
                        key={q.id}
                        onClick={() => {
                          onSelectQuote(q.id);
                          setIsClientPortalMode(false);
                          setActiveTab('quotes');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900 block truncate">{q.quoteNumber} — {q.clientName}</span>
                          <span className="text-slate-500 text-[11px] truncate block">{q.siteAddress}</span>
                        </div>
                        <span className="font-mono font-bold text-sky-800 text-xs shrink-0">{formatNZD(q.totalNZD)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchingLeads.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Capsule CRM Leads</span>
                    {matchingLeads.map(l => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setIsClientPortalMode(false);
                          setActiveTab('leads');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900 block truncate">{l.clientName}</span>
                          <span className="text-slate-500 text-[11px] truncate block">{l.companyOrArchitect} · {l.projectAddress}</span>
                        </div>
                        <span className="font-mono font-medium text-slate-700 text-xs shrink-0">{formatNZD(l.estimatedValueNZD)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-slate-400">
                No matching jobs, quotes, or leads found for "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Actions, Notifications, Mode toggle */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Action Dropdown (+ Button) */}
        <div ref={quickActionRef} className="relative">
          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isQuickActionOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg border border-slate-200 shadow-xl py-1.5 z-50 text-xs divide-y divide-slate-100">
              <div className="py-1">
                <button
                  onClick={() => {
                    onQuickNewJob();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800 cursor-pointer font-medium"
                >
                  <FolderKanban className="w-4 h-4 text-sky-600" />
                  <span>+ New Trade Job</span>
                </button>
                <button
                  onClick={() => {
                    onQuickNewLead();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800 cursor-pointer font-medium"
                >
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>+ New Client / Lead</span>
                </button>
                <button
                  onClick={() => {
                    onQuickNewQuote();
                    setIsQuickActionOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800 cursor-pointer font-medium"
                >
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span>+ New Quote Takeoff</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications & Approvals"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-lg border border-slate-200 shadow-xl p-3 z-50 text-xs space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-900">Pending Approvals</span>
                <span className="text-[10px] font-mono text-slate-500">{notificationCount} items</span>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingVariations.map(v => (
                  <div key={v.id} className="p-2 rounded bg-amber-50 border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-900 block truncate">{v.title}</span>
                    <span className="text-slate-600 text-[11px] block">{formatNZD(v.amountNZD)} · Awaiting Client Approval</span>
                  </div>
                ))}

                {pendingQuotes.slice(0, 2).map(q => (
                  <div key={q.id} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block truncate">Quote {q.quoteNumber}</span>
                    <span className="text-slate-600 text-[11px] block">{q.clientName} · {formatNZD(q.totalNZD)}</span>
                  </div>
                ))}

                {notificationCount === 0 && (
                  <p className="text-slate-400 text-center py-3">All variations and quotes are up to date.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OneDrive Sync Cloud Button */}
        {onOpenOneDrive && (
          <button
            onClick={onOpenOneDrive}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors cursor-pointer"
            title="Microsoft OneDrive Cloud Folders"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline">OneDrive</span>
          </button>
        )}

        {/* Client Portal Mode Switcher */}
        <button
          onClick={() => setIsClientPortalMode(!isClientPortalMode)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
            isClientPortalMode
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Toggle Client Portal Approval View"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isClientPortalMode ? 'Exit Client Portal' : 'Client View'}</span>
        </button>
      </div>
    </header>
  );
};
