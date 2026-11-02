import React, { useState } from 'react';
import { X, Clock, CheckCircle2, User, FileText, Calendar, DollarSign } from 'lucide-react';
import { Project, TimeEntry } from '../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  initialHours: number;
  onSaveTimeEntry: (entry: TimeEntry) => void;
}

export const LogTimeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  initialHours,
  onSaveTimeEntry
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || projects[0]?.id || '');
  const [foreman, setForeman] = useState('Marcus Kuhtze (Site Supervisor)');
  const [taskType, setTaskType] = useState<TimeEntry['taskType']>('Standing Seam Installation');
  const [hours, setHours] = useState<number>(Math.max(0.5, Math.round(initialHours * 10) / 10 || 1.5));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find(p => p.id === selectedProjectId) || projects[0];
    if (!proj) return;

    const newEntry: TimeEntry = {
      id: `te-${Date.now()}`,
      projectId: proj.id,
      projectTitle: proj.title,
      foreman,
      taskType,
      hours: Number(hours),
      date,
      billable,
      notes: notes.trim() || undefined
    };

    onSaveTimeEntry(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">Archtech Site Labour Log</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Trade Job / Project *</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} · {p.title} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tradesman / Foreman *</label>
              <select
                value={foreman}
                onChange={(e) => setForeman(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="Marcus Kuhtze (Site Supervisor)">Marcus Kuhtze (Site Supervisor)</option>
                <option value="Tane Williams">Tane Williams (Site Foreman)</option>
                <option value="Wiremu Henare">Wiremu Henare (Machine Lead)</option>
                <option value="Lachlan Smith">Lachlan Smith (Installer)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Task Category *</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="Site Measure">Site Measure</option>
                <option value="Tray Rollforming">Tray Rollforming</option>
                <option value="Standing Seam Installation">Standing Seam Installation</option>
                <option value="Flashing Folding">Flashing Folding</option>
                <option value="Council Inspection">Council Inspection</option>
                <option value="Travel & Cartage">Travel & Cartage</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Hours Logged *</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isBillable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded border-slate-300 text-slate-900"
            />
            <label htmlFor="isBillable" className="text-slate-700 font-medium cursor-pointer">
              Billable contract labor (chargeable to client / included in quote)
            </label>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Site Work Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Completed mechanical seaming on North pitch. Checked clip spacing at 400mm centers."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs cursor-pointer"
            >
              Save Time to Job Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
