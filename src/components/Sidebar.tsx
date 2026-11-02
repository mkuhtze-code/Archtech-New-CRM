import React from 'react';
import { 
  Kanban, 
  Calendar,
  Users, 
  FolderKanban, 
  Calculator, 
  BookOpen, 
  Boxes, 
  Smartphone, 
  Eye, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  PenTool
} from 'lucide-react';
import { Project } from '../types/crm';
import { ArchtechLogo } from './ArchtechLogo';

export type NavTab = 
  | 'status_board' 
  | 'schedule'
  | 'projects' 
  | 'leads' 
  | 'quotes' 
  | 'catalogue' 
  | 'flashing_library'
  | 'flashing_orders'
  | 'inventory' 
  | 'site_visit' 
  | 'automations' 
  | 'client_portal';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  projects: Project[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isClientPortalMode: boolean;
  setIsClientPortalMode: (portal: boolean) => void;
  onQuickNewJob: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  isCollapsed,
  setIsCollapsed,
  isClientPortalMode,
  setIsClientPortalMode,
  onQuickNewJob
}) => {
  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          key: 'status_board' as NavTab,
          label: 'Status Board',
          subtext: 'Trade Stage Pipeline',
          icon: Kanban,
          badge: projects.length.toString(),
          badgeColor: 'bg-sky-500/20 text-sky-300'
        },
        {
          key: 'schedule' as NavTab,
          label: 'Schedule',
          subtext: 'Crew & Site Calendar',
          icon: Calendar,
          badge: 'Live',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 text-[10px]'
        },
        {
          key: 'projects' as NavTab,
          label: 'Job Hub',
          subtext: 'Center of Gravity',
          icon: FolderKanban,
        },
        {
          key: 'leads' as NavTab,
          label: 'Leads & Enquiries',
          subtext: 'Client Pipeline',
          icon: Users,
          badge: '5',
          badgeColor: 'bg-amber-500/20 text-amber-300'
        }
      ]
    },
    {
      title: 'Estimating & Supply',
      items: [
        {
          key: 'quotes' as NavTab,
          label: 'Quoting Suite',
          subtext: 'Spreadsheet & Proposals',
          icon: Calculator,
        },
        {
          key: 'catalogue' as NavTab,
          label: 'Price Book',
          subtext: 'The Roofing Store Supply',
          icon: BookOpen,
          badge: 'TRS',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 text-[10px]'
        }
      ]
    },
    {
      title: 'Workshop & Stock',
      items: [
        {
          key: 'flashing_library' as NavTab,
          label: 'Flashing Workshop',
          subtext: 'Profiles & Orders',
          icon: PenTool,
        },
        {
          key: 'inventory' as NavTab,
          label: 'Coil Stock & Metal',
          subtext: 'Kiwicolour® & MagnaFlow',
          icon: Boxes,
        }
      ]
    },
    {
      title: 'Field & Client',
      items: [
        {
          key: 'site_visit' as NavTab,
          label: 'On-Site Field',
          subtext: 'Today on Site · Quick Capture',
          icon: Smartphone,
          badge: 'On Site',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 font-bold'
        },
        {
          key: 'client_portal' as NavTab,
          label: 'Client Portal',
          subtext: 'Milestones & Variations',
          icon: Eye,
          badge: 'Portal',
          badgeColor: 'bg-purple-500/20 text-purple-300'
        },
        {
          key: 'automations' as NavTab,
          label: 'Automations',
          subtext: 'Client Follow-ups',
          icon: Send,
        }
      ]
    }
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-18' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 overflow-hidden py-1 max-w-[200px]">
            <ArchtechLogo variant="dark" className="h-9 w-auto max-w-[190px] object-left" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center py-1">
            <ArchtechLogo variant="icon" className="w-9 h-9 object-contain" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {!isCollapsed && (
              <h2 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.key && !isClientPortalMode;
                const isPortalActive = item.key === 'client_portal' && isClientPortalMode;
                const active = isSelected || isPortalActive;

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.key === 'client_portal') {
                        setIsClientPortalMode(true);
                      } else {
                        setIsClientPortalMode(false);
                        setActiveTab(item.key);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                      active
                        ? 'bg-sky-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title={isCollapsed ? `${item.label} (${item.subtext})` : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="truncate">
                          <span className="block truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${active ? 'bg-white/20 text-white' : item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Button */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onQuickNewJob}
            className="w-full py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700/60 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Quick Job / Quote</span>
          </button>
        </div>
      )}

      {/* Sidebar Footer: User */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 text-xs">
                MK
              </div>
              <div className="truncate">
                <span className="block font-semibold text-slate-200 text-xs truncate">Marcus Kuhtze</span>
                <span className="text-[10px] text-slate-400 block truncate">Site Supervisor</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs" title="Marcus Kuhtze">
            MK
          </div>
        )}
      </div>
    </aside>
  );
};