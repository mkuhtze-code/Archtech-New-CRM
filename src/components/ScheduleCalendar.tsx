import React, { useState, useMemo } from 'react';
import { Project, SiteScheduleEvent, TeamMember } from '../types/crm';
import { formatDate } from '../utils/formatters';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Truck, 
  ShieldCheck, 
  Hammer, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  Check, 
  ArrowRight,
  FolderKanban,
  ExternalLink,
  Layers
} from 'lucide-react';

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateProject: (updated: Project) => void;
  onOpenProjectDetails: (projectId: string) => void;
}

type ScheduleViewMode = 'week_grid' | 'crew_lanes' | 'list';

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'HIAB Crane Delivery': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200', dot: 'bg-indigo-600' },
  'Scaffold Inspection': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-600' },
  'Rollforming Start': { bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200', dot: 'bg-sky-600' },
  'Underlay Dry-In': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200', dot: 'bg-cyan-600' },
  'Council Inspection': { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', dot: 'bg-emerald-600' },
  'PS3 Handover': { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', dot: 'bg-teal-600' },
  'Default': { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200', dot: 'bg-slate-600' }
};

export const ScheduleCalendar: React.FC<Props> = ({
  projects,
  teamMembers,
  onUpdateProject,
  onOpenProjectDetails
}) => {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('week_grid');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = this week
  const [selectedCrewFilter, setSelectedCrewFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Event Modal State
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || '');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<SiteScheduleEvent['type']>('Rollforming Start');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [assignedCrew, setAssignedCrew] = useState<string[]>([teamMembers[0]?.name || 'Marcus Kuhtze']);
  const [eventNotes, setEventNotes] = useState('');

  // Quick Reschedule Event Modal
  const [editingEvent, setEditingEvent] = useState<{ event: SiteScheduleEvent; projectId: string } | null>(null);

  // Calculate week days
  const weekDays = useMemo(() => {
    const today = new Date();
    // Start on Monday of current week
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + (currentWeekOffset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        date: d,
        isoDate,
        dayName: d.toLocaleDateString('en-NZ', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-NZ', { month: 'short' }),
        isToday
      });
    }
    return days;
  }, [currentWeekOffset]);

  // Aggregate all events from all projects
  const allEventsWithProject = useMemo(() => {
    const list: Array<{ event: SiteScheduleEvent; project: Project }> = [];
    projects.forEach(p => {
      // Direct fieldSchedule events
      if (p.fieldSchedule && p.fieldSchedule.length > 0) {
        p.fieldSchedule.forEach(evt => {
          list.push({ event: evt, project: p });
        });
      }

      // Also synthesize key milestone dates if fieldSchedule is sparse
      if (p.startDate) {
        list.push({
          event: {
            id: `start-${p.id}`,
            projectId: p.id,
            title: `Site Setup & Substrate Handover`,
            date: p.startDate,
            type: 'Rollforming Start',
            crewAssigned: ['Marcus Kuhtze', 'Tane Williams'],
            notes: `Project start for ${p.title}`
          },
          project: p
        });
      }

      if (p.targetCompletionDate) {
        list.push({
          event: {
            id: `handover-${p.id}`,
            projectId: p.id,
            title: `Final PS3 Handover & Council Sign-off`,
            date: p.targetCompletionDate,
            type: 'PS3 Handover',
            crewAssigned: ['Marcus Kuhtze (LBP)'],
            notes: `Target completion date`
          },
          project: p
        });
      }
    });

    // Remove duplicates by event id
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.event.id)) return false;
      seen.add(item.event.id);
      return true;
    });
  }, [projects]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEventsWithProject.filter(({ event, project }) => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.siteAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCrew = selectedCrewFilter === 'all' || event.crewAssigned.some(c => c.toLowerCase().includes(selectedCrewFilter.toLowerCase()));
      const matchesType = selectedTypeFilter === 'all' || event.type === selectedTypeFilter;

      return matchesSearch && matchesCrew && matchesType;
    });
  }, [allEventsWithProject, searchQuery, selectedCrewFilter, selectedTypeFilter]);

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, Array<{ event: SiteScheduleEvent; project: Project }>> = {};
    filteredEvents.forEach(item => {
      if (!map[item.event.date]) map[item.event.date] = [];
      map[item.event.date].push(item);
    });
    return map;
  }, [filteredEvents]);

  // Handle Create Event
  const handleCreateEvent = () => {
    if (!eventTitle.trim()) return;
    const targetProject = projects.find(p => p.id === targetProjectId) || projects[0];
    if (!targetProject) return;

    const newEvent: SiteScheduleEvent = {
      id: `sched-${Date.now()}`,
      projectId: targetProject.id,
      title: eventTitle.trim(),
      date: eventDate,
      type: eventType,
      crewAssigned: assignedCrew,
      notes: eventNotes.trim() || undefined
    };

    const updatedProject: Project = {
      ...targetProject,
      fieldSchedule: [newEvent, ...(targetProject.fieldSchedule || [])],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: targetProject.id,
          entityType: 'project',
          type: 'milestone',
          title: `Scheduled: ${newEvent.title} (${newEvent.date})`,
          details: `${newEvent.type} allocated to ${crewNames(newEvent.crewAssigned)}.`,
          author: teamMembers[0]?.name || 'Operations',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        ...(targetProject.activityFeed || [])
      ]
    };

    onUpdateProject(updatedProject);
    setEventTitle('');
    setEventNotes('');
    setIsAddEventOpen(false);
  };

  // Handle Quick Reschedule Event
  const handleSaveRescheduledEvent = () => {
    if (!editingEvent) return;
    const project = projects.find(p => p.id === editingEvent.projectId);
    if (!project) return;

    const updatedSchedule = (project.fieldSchedule || []).map(evt => {
      if (evt.id === editingEvent.event.id) {
        return editingEvent.event;
      }
      return evt;
    });

    onUpdateProject({
      ...project,
      fieldSchedule: updatedSchedule
    });
    setEditingEvent(null);
  };

  const crewNames = (list: string[]) => list.join(', ');

  const getStyle = (type: string) => EVENT_TYPE_STYLES[type] || EVENT_TYPE_STYLES['Default'];

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. FERGUS-GRADE OPERATIONAL CONTROLS BANNER                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Context */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-xs font-mono font-bold">
                Archtech Operations
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-600">Site Scheduling & Crew Dispatch</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Trade Schedule</span>
              <span className="text-xs font-normal text-slate-500 font-mono">
                ({filteredEvents.length} active site allocations)
              </span>
            </h1>
          </div>

          {/* Quick Actions & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('week_grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'week_grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week Calendar
              </button>
              <button
                onClick={() => setViewMode('crew_lanes')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'crew_lanes'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Crew Lanes
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List View
              </button>
            </div>

            {/* Schedule Event Button */}
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* FILTERS & WEEK NAVIGATION BAR                               */}
        {/* ----------------------------------------------------------- */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              This Week
            </button>

            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-800 ml-1">
              {weekDays[0].dayNumber} {weekDays[0].monthName} – {weekDays[6].dayNumber} {weekDays[6].monthName} {weekDays[6].date.getFullYear()}
            </span>
          </div>

          {/* Filter Dropdowns & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job or site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-600 w-40 sm:w-48"
              />
            </div>

            {/* Crew Filter */}
            <select
              value={selectedCrewFilter}
              onChange={(e) => setSelectedCrewFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Crew Members</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.name}>{m.name} ({m.role.split(' ')[0]})</option>
              ))}
            </select>

            {/* Event Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Event Types</option>
              <option value="Rollforming Start">Rollforming Start</option>
              <option value="HIAB Crane Delivery">HIAB Crane Delivery</option>
              <option value="Scaffold Inspection">Scaffold Inspection</option>
              <option value="Underlay Dry-In">Underlay Dry-In</option>
              <option value="Council Inspection">Council Inspection</option>
              <option value="PS3 Handover">PS3 Handover</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW 1: WEEK GRID (CALENDAR COLUMNS)                       */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'week_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {weekDays.map(day => {
            const dayEvents = eventsByDate[day.isoDate] || [];
            return (
              <div 
                key={day.isoDate} 
                className={`flex flex-col rounded-xl border transition-all ${
                  day.isToday 
                    ? 'bg-sky-50/40 border-sky-300 ring-1 ring-sky-200' 
                    : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Day Header */}
                <div className={`p-2.5 border-b flex items-center justify-between text-xs ${
                  day.isToday ? 'bg-sky-100/70 border-sky-200' : 'bg-slate-50/80 border-slate-100'
                }`}>
                  <div>
                    <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] block">
                      {day.dayName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {day.dayNumber} {day.monthName}
                    </span>
                  </div>
                  {day.isToday && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold text-[9px] uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>

                {/* Day Events Column */}
                <div className="p-2 space-y-2 flex-1 min-h-[140px] flex flex-col justify-between">
                  <div className="space-y-2">
                    {dayEvents.length > 0 ? (
                      dayEvents.map(({ event, project }) => {
                        const style = getStyle(event.type);
                        return (
                          <div
                            key={event.id}
                            onClick={() => setEditingEvent({ event, projectId: project.id })}
                            className={`p-2 rounded-lg border text-xs space-y-1 transition-all cursor-pointer hover:shadow-xs group ${style.bg} ${style.border}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                              <span className={`text-[10px] font-bold truncate ${style.text}`}>
                                {event.type}
                              </span>
                            </div>

                            <div className="font-bold text-slate-900 line-clamp-2 leading-tight">
                              {event.title}
                            </div>

                            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
                              <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                                {project.projectNumber}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenProjectDetails(project.id);
                                }}
                                className="text-slate-400 hover:text-slate-900"
                                title="Open Job Hub"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>

                            {event.crewAssigned && event.crewAssigned.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/50">
                                {event.crewAssigned.map((crew, idx) => (
                                  <span key={idx} className="px-1 py-0.2 rounded bg-white/80 text-slate-700 text-[9px] font-medium border border-slate-200/60 truncate">
                                    {crew.split(' ')[0]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center text-center py-6 text-[11px] text-slate-400">
                        No site events
                      </div>
                    )}
                  </div>

                  {/* Quick Add For This Day */}
                  <button
                    onClick={() => {
                      setEventDate(day.isoDate);
                      setIsAddEventOpen(true);
                    }}
                    className="w-full py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded border border-dashed border-slate-200 transition-colors cursor-pointer"
                  >
                    + Add Event
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW 2: CREW LANES (WHO IS WHERE THIS WEEK)               */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'crew_lanes' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-bold text-slate-900 w-48 shrink-0">Crew Member</th>
                  {weekDays.map(d => (
                    <th key={d.isoDate} className={`p-2.5 text-center font-bold ${d.isToday ? 'bg-sky-50 text-sky-900' : ''}`}>
                      <div className="text-[11px] uppercase tracking-wide">{d.dayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{d.dayNumber} {d.monthName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 align-top border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {member.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{member.name}</div>
                          <div className="text-[10px] text-slate-500">{member.role}</div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map(d => {
                      // Find events on this day assigned to this member
                      const dayEvents = (eventsByDate[d.isoDate] || []).filter(({ event }) =>
                        event.crewAssigned.some(c => c.toLowerCase().includes(member.name.toLowerCase()))
                      );

                      return (
                        <td key={d.isoDate} className={`p-2 align-top border-r border-slate-100 last:border-0 ${d.isToday ? 'bg-sky-50/20' : ''}`}>
                          {dayEvents.length > 0 ? (
                            <div className="space-y-1">
                              {dayEvents.map(({ event, project }) => (
                                <div
                                  key={event.id}
                                  onClick={() => onOpenProjectDetails(project.id)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] cursor-pointer"
                                  title={`${event.title} (${project.title})`}
                                >
                                  <div className="font-bold text-slate-900 truncate">{event.title}</div>
                                  <div className="text-slate-500 font-mono truncate">{project.projectNumber}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 block text-center py-2">Available</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VIEW 3: COMPACT LIST VIEW                                  */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(({ event, project }) => {
              const style = getStyle(event.type);
              return (
                <div 
                  key={event.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
                        {event.type}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {event.date}
                      </span>
                      <span className="font-bold text-slate-900">{event.title}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                      <span>Job: <strong className="text-slate-800">{project.projectNumber} · {project.title}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {project.siteAddress}
                      </span>
                      {event.notes && (
                        <>
                          <span>·</span>
                          <span className="italic">{event.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{crewNames(event.crewAssigned)}</span>
                    </div>

                    <button
                      onClick={() => onOpenProjectDetails(project.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Job</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No events found matching your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: ADD SITE SCHEDULE EVENT                             */}
      {/* ------------------------------------------------------------- */}
      {isAddEventOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Schedule Trade Event</h3>
              </div>
              <button onClick={() => setIsAddEventOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Job</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectNumber} · {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. HIAB Crane Tray Lift onto South Roof Pitch"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Rollforming Start">Rollforming Start</option>
                    <option value="HIAB Crane Delivery">HIAB Crane Delivery</option>
                    <option value="Scaffold Inspection">Scaffold Inspection</option>
                    <option value="Underlay Dry-In">Underlay Dry-In</option>
                    <option value="Council Inspection">Council Inspection</option>
                    <option value="PS3 Handover">PS3 Handover</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assign Crew</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={assignedCrew.includes(member.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedCrew(prev => [...prev, member.name]);
                          } else {
                            setAssignedCrew(prev => prev.filter(n => n !== member.name));
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-600"
                      />
                      <span>{member.name.split(' ')[0]} ({member.role.split(' ')[0]})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Site Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Traffic management approved for 07:30 AM arrival"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save Schedule Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: EDIT / RESCHEDULE EVENT                             */}
      {/* ------------------------------------------------------------- */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Scheduled Event</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Event Title</label>
                <input
                  type="text"
                  value={editingEvent.event.title}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    event: { ...editingEvent.event, title: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                <input
                  type="date"
                  value={editingEvent.event.date}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    event: { ...editingEvent.event, date: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingEvent.event.notes || ''}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    event: { ...editingEvent.event, notes: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenProjectDetails(editingEvent.projectId);
                  setEditingEvent(null);
                }}
                className="text-xs font-semibold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Job Card</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRescheduledEvent}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
