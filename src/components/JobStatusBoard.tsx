import React, { useState, useMemo } from 'react';
import { Project, JobWorkflowStage } from '../types/crm';
import { formatNZD, formatDate } from '../utils/formatters';
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Search, 
  ShieldCheck, 
  Layers, 
  Building2,
  Calendar,
  AlertCircle,
  Kanban,
  List,
  Users,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';

interface Props {
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
  onOpenProjectDetails: (projectId: string) => void;
  onCreateQuoteForProject?: (project: Project) => void;
  onAddNewProject: () => void;
}

interface ColumnDef {
  key: JobWorkflowStage;
  label: string;
  shortLabel: string;
  sublabel: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderHeader: string;
}

const STAGES: ColumnDef[] = [
  {
    key: 'enquiry_measure',
    label: '1. Enquiry & Measure',
    shortLabel: 'Measure',
    sublabel: 'Site measure & architectural review',
    accentColor: 'bg-sky-600',
    borderHeader: 'border-t-sky-600',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800'
  },
  {
    key: 'quoting',
    label: '2. Quoting & Scope',
    shortLabel: 'Quoting',
    sublabel: 'Custom pricing & girth tiers',
    accentColor: 'bg-amber-600',
    borderHeader: 'border-t-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800'
  },
  {
    key: 'quote_sent',
    label: '3. Quote Sent / Review',
    shortLabel: 'Sent',
    sublabel: 'Client review & sign-off',
    accentColor: 'bg-purple-600',
    borderHeader: 'border-t-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800'
  },
  {
    key: 'pre_start',
    label: '4. Pre-Start & Materials',
    shortLabel: 'Pre-Start',
    sublabel: 'Coil stock & ply moisture check',
    accentColor: 'bg-blue-600',
    borderHeader: 'border-t-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800'
  },
  {
    key: 'active_onsite',
    label: '5. Active On-Site',
    shortLabel: 'On-Site',
    sublabel: 'Rollforming, tray fixing & seaming',
    accentColor: 'bg-teal-600',
    borderHeader: 'border-t-teal-600',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800'
  },
  {
    key: 'qa_snagging',
    label: '6. QA & Handover',
    shortLabel: 'QA & Snag',
    sublabel: 'Punch list & completion sign-off',
    accentColor: 'bg-emerald-600',
    borderHeader: 'border-t-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800'
  },
  {
    key: 'completed',
    label: '7. Invoiced & Complete',
    shortLabel: 'Complete',
    sublabel: 'Handover & 25-yr warranty',
    accentColor: 'bg-slate-600',
    borderHeader: 'border-t-slate-600',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800'
  }
];

export const JobStatusBoard: React.FC<Props> = ({
  projects,
  onUpdateProject,
  onOpenProjectDetails,
  onAddNewProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [viewFormat, setViewFormat] = useState<'board' | 'list'>('board');
  const [crewFilter, setCrewFilter] = useState('all');

  // Helper to determine stage
  const getJobStage = (proj: Project): JobWorkflowStage => {
    if (proj.jobStage) return proj.jobStage;
    if (proj.status === 'completed') return 'completed';
    if (proj.status === 'snagging') return 'qa_snagging';
    if (proj.status === 'in_progress') return 'active_onsite';
    if (proj.progressPercent > 20) return 'pre_start';
    return 'enquiry_measure';
  };

  const handleAdvanceStage = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const stageOrder: JobWorkflowStage[] = [
      'enquiry_measure',
      'quoting',
      'quote_sent',
      'pre_start',
      'active_onsite',
      'qa_snagging',
      'completed'
    ];
    const current = getJobStage(project);
    const currentIndex = stageOrder.indexOf(current);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      handleChangeStage(project, stageOrder[currentIndex + 1]);
    }
  };

  const handleChangeStage = (project: Project, nextStage: JobWorkflowStage) => {
    const stageIndex = STAGES.findIndex(s => s.key === nextStage);
    const updatedProject: Project = {
      ...project,
      jobStage: nextStage,
      status: nextStage === 'completed' 
        ? 'completed' 
        : nextStage === 'qa_snagging' 
        ? 'snagging' 
        : nextStage === 'active_onsite' 
        ? 'in_progress' 
        : 'pre_construction',
      progressPercent: nextStage === 'completed' ? 100 : Math.max(project.progressPercent, (stageIndex + 1) * 14),
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: project.id,
          entityType: 'project',
          type: 'milestone',
          title: `Moved to ${STAGES.find(c => c.key === nextStage)?.label}`,
          details: `Stage updated on Job Status Board.`,
          author: 'Operations',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(project.activityFeed || [])
      ]
    };
    onUpdateProject(updatedProject);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.architect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.siteAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProfile = profileFilter === 'all' || p.profile === profileFilter;
      const matchesRegion = regionFilter === 'all' || p.region.toLowerCase().includes(regionFilter.toLowerCase());

      return matchesSearch && matchesProfile && matchesRegion;
    });
  }, [projects, searchTerm, profileFilter, regionFilter]);

  const totalContractValue = filteredProjects.reduce((acc, p) => acc + (p.contractValueNZD || 0), 0);
  const totalM2 = filteredProjects.reduce((acc, p) => acc + (p.roofAreaM2 || 0), 0);
  const onsiteCount = filteredProjects.filter(p => getJobStage(p) === 'active_onsite').length;

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. OPERATIONAL CONTROL HEADER                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="font-semibold text-slate-900">Archtech Trade Operations</span>
              <span>·</span>
              <span>Status Board & Pipeline</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> SiteWise Green Approved
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
              <span>Job Status Board</span>
              <span className="text-xs font-normal text-slate-500 font-mono">
                ({filteredProjects.length} Trade Jobs · {formatNZD(totalContractValue)} Total Pipeline)
              </span>
            </h1>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewFormat('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewFormat === 'board'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewFormat('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewFormat === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* New Job CTA */}
            <button
              onClick={onAddNewProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Trade Job</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job #, client, address, architect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>

            {/* Profile Filter */}
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Profiles</option>
              <option value="Archtech Super Seam 38mm">Super Seam 38mm</option>
              <option value="Archtech Angle Seam">Angle Seam</option>
              <option value="Archtech Double Angle Seam">Double Angle Seam</option>
              <option value="Archtech Interlocking Panels">Interlocking Panels</option>
            </select>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="Auckland">Auckland</option>
              <option value="Wanaka">Wanaka / Central Otago</option>
              <option value="Waiheke">Waiheke Island</option>
              <option value="Omaha">Omaha / Matakana</option>
            </select>
          </div>

          {/* Scannable Metric Ribbons */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>{onsiteCount} Jobs On Site</span>
            </div>
            <span>·</span>
            <span className="text-slate-500">
              Total Area: <strong className="text-slate-800">{totalM2.toLocaleString()} m²</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. KANBAN STATUS BOARD VIEW (COLUMNS BY TRADE STAGE)          */}
      {/* ------------------------------------------------------------- */}
      {viewFormat === 'board' && (
        <div className="flex gap-3.5 overflow-x-auto pb-6 pt-1">
          {STAGES.map((column) => {
            const colProjects = filteredProjects.filter((p) => getJobStage(p) === column.key);
            const colValue = colProjects.reduce((acc, p) => acc + (p.contractValueNZD || 0), 0);

            return (
              <div
                key={column.key}
                className="flex-shrink-0 w-80 bg-slate-100/70 rounded-xl p-2.5 flex flex-col max-h-[calc(100vh-230px)] border border-slate-200/80 shadow-2xs"
              >
                {/* Column Header */}
                <div className={`border-t-3 ${column.borderHeader} bg-white p-3 rounded-lg shadow-2xs mb-2.5`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 tracking-wide truncate">
                      {column.label}
                    </h3>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${column.badgeBg} ${column.badgeText}`}>
                      {colProjects.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{column.sublabel}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                    <span className="text-slate-400">Total:</span>
                    <span className="font-bold text-slate-800">{formatNZD(colValue)}</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colProjects.map((project) => {
                    const pendingVariations = (project.variations || []).filter(v => v.status === 'pending_client');
                    const nextMilestone = (project.milestones || []).find(m => !m.completed);

                    return (
                      <div
                        key={project.id}
                        onClick={() => onOpenProjectDetails(project.id)}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-slate-400 transition-all hover:shadow-xs cursor-pointer group space-y-2.5"
                      >
                        {/* Job Number & Progress */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                            {project.projectNumber}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {project.progressPercent}%
                          </span>
                        </div>

                        {/* Title & Client */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                            {project.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                            <span className="font-semibold text-slate-800">{project.clientName}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500">{project.architect}</span>
                          </p>
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{project.siteAddress}</span>
                        </div>

                        {/* Profile & Specs */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-800">
                            <span className="font-semibold truncate max-w-[170px]">{project.profile}</span>
                            <span className="font-mono font-bold text-[10px]">{project.roofAreaM2} m²</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {project.material} ({project.colorName})
                          </div>
                        </div>

                        {/* Next Action / Blocker */}
                        {nextMilestone && (
                          <div className="text-[10px] text-slate-600 flex items-start gap-1.5 bg-amber-50/50 p-1.5 rounded border border-amber-100">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 font-medium text-amber-900">
                              Next: {nextMilestone.title}
                            </span>
                          </div>
                        )}

                        {/* Pending Variations Alert */}
                        {pendingVariations.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-purple-800 bg-purple-50 p-1.5 rounded border border-purple-200">
                            <AlertCircle className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="font-semibold">
                              {pendingVariations.length} Variation{pendingVariations.length > 1 ? 's' : ''} Awaiting Client Sign-off
                            </span>
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full transition-all duration-300"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>

                        {/* Footer: Value & Advance */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatNZD(project.contractValueNZD)}
                          </span>

                          <div className="flex items-center gap-1">
                            {column.key !== 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => handleAdvanceStage(e, project)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                                title="Advance to next trade stage"
                              >
                                <span>Advance</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colProjects.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center p-3 text-xs text-slate-400">
                      <span>No jobs in this stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. OPERATIONAL LIST TABLE VIEW                                */}
      {/* ------------------------------------------------------------- */}
      {viewFormat === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Job Number</th>
                  <th className="p-3">Project & Client</th>
                  <th className="p-3">Site Address</th>
                  <th className="p-3">Profile & Area</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3 text-right">Value</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => {
                  const stage = STAGES.find(s => s.key === getJobStage(project)) || STAGES[0];
                  return (
                    <tr 
                      key={project.id}
                      onClick={() => onOpenProjectDetails(project.id)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-mono font-bold text-sky-800">
                        {project.projectNumber}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{project.title}</div>
                        <div className="text-[11px] text-slate-500">{project.clientName} · {project.architect}</div>
                      </td>

                      <td className="p-3 text-slate-600 max-w-xs truncate">
                        {project.siteAddress}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{project.profile}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{project.roofAreaM2} m² · {project.colorName}</div>
                      </td>

                      <td className="p-3">
                        <select
                          value={stage.key}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleChangeStage(project, e.target.value as any)}
                          className={`text-[10px] font-bold rounded px-2 py-1 border ${stage.badgeBg} ${stage.badgeText} border-slate-200 cursor-pointer`}
                        >
                          {STAGES.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-slate-900 h-full rounded-full" style={{ width: `${project.progressPercent}%` }} />
                          </div>
                          <span>{project.progressPercent}%</span>
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatNZD(project.contractValueNZD)}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProjectDetails(project.id);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-[11px] cursor-pointer"
                        >
                          Open Hub →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
