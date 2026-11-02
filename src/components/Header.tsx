import React from 'react';
import { Smartphone, ExternalLink, HardHat } from 'lucide-react';
import { ArchtechLogo } from './ArchtechLogo';

export type ActiveTab = 'leads' | 'projects' | 'inventory' | 'quotes' | 'catalogue' | 'automations' | 'site_visit' | 'client_portal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isClientPortalMode: boolean;
  setIsClientPortalMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isClientPortalMode,
  setIsClientPortalMode,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsClientPortalMode(false);
                setActiveTab('leads');
              }}
              className="text-left group cursor-pointer focus:outline-none flex items-center"
            >
              <ArchtechLogo variant="light" className="h-9 w-auto max-w-[200px] object-left" />
            </button>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-500">
              Preferred Installer: The Roofing Store · Architectural Metal Specialists
            </span>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          {!isClientPortalMode ? (
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => setActiveTab('leads')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  activeTab === 'leads' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Client Leads
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  activeTab === 'projects' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Projects & Progress
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  activeTab === 'inventory' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Coil & Stock
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  activeTab === 'quotes' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Quoting Suite
              </button>
              <button
                onClick={() => setActiveTab('catalogue')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'catalogue' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Price Book & Catalogue
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                  Price Book
                </span>
              </button>
              <button
                onClick={() => setActiveTab('automations')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  activeTab === 'automations' ? 'text-slate-950 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
                }`}
              >
                Follow-up Engine
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span className="text-slate-900 font-semibold">Client Portal Preview</span>
              <span className="text-slate-300">/</span>
              <span>Project Milestone & Approval Center</span>
            </div>
          )}

          {/* Zone 3: 1 primary action / Mode Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {!isClientPortalMode ? (
              <>
                <button
                  onClick={() => setActiveTab('site_visit')}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'site_visit'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                  Site Visit Tool
                </button>

                <button
                  onClick={() => setIsClientPortalMode(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Client Portal
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsClientPortalMode(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <HardHat className="w-3.5 h-3.5" />
                Return to Staff CRM
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        {!isClientPortalMode && (
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-100 no-scrollbar">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'leads' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'projects' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'quotes' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Quotes
            </button>
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'catalogue' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Price Book & Catalogue
            </button>
            <button
              onClick={() => setActiveTab('automations')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'automations' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              Email Rules
            </button>
            <button
              onClick={() => setActiveTab('site_visit')}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
                activeTab === 'site_visit' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              Site Mode
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
