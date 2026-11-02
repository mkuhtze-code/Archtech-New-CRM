import React, { useState } from 'react';
import { X, FolderKanban, Building, MapPin, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import { Project, RoofingProfile, CoilMaterial, WindZone, ExposureZone, JobWorkflowStage } from '../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (newProject: Project) => void;
}

export const NewJobModal: React.FC<Props> = ({ isOpen, onClose, onAddProject }) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [architect, setArchitect] = useState('Direct Architectural Specification');
  const [headContractor, setHeadContractor] = useState('Main Contractor TBC');
  const [siteAddress, setSiteAddress] = useState('');
  const [region, setRegion] = useState('Auckland');
  const [roofAreaM2, setRoofAreaM2] = useState<number>(260);
  const [profile, setProfile] = useState<RoofingProfile>('Archtech Super Seam 38mm');
  const [material, setMaterial] = useState<CoilMaterial>('Kiwicolour® Vitor+ PVDF (The Roofing Store)');
  const [colorName, setColorName] = useState('FlaxPod (PVDF)');
  const [windZone, setWindZone] = useState<WindZone>('Very High');
  const [exposureZone, setExposureZone] = useState<ExposureZone>('Zone D (Severe Marine)');
  const [contractValueNZD, setContractValueNZD] = useState<number>(75000);
  const [jobStage, setJobStage] = useState<JobWorkflowStage>('enquiry_measure');
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      projectNumber: `ARCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      clientName,
      clientEmail: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '.')}@example.co.nz`,
      architect,
      headContractor,
      siteAddress: siteAddress || 'New Zealand',
      region,
      roofAreaM2: Number(roofAreaM2) || 200,
      profile,
      material,
      colorName,
      windZone,
      exposureZone,
      contractValueNZD: Number(contractValueNZD) || 50000,
      startDate: new Date().toISOString().split('T')[0],
      targetCompletionDate,
      progressPercent: jobStage === 'completed' ? 100 : jobStage === 'active_onsite' ? 45 : 10,
      status: jobStage === 'completed' ? 'completed' : jobStage === 'active_onsite' ? 'in_progress' : 'pre_construction',
      jobStage,
      ps3Status: 'pending',
      milestones: [
        {
          id: `m-${Date.now()}-1`,
          title: 'Pre-Start Architectural Review (Archtech & TRS)',
          description: 'Verify architectural junction details, falls, and flashing lap clearances.',
          completed: false,
          signoffRequired: true
        },
        {
          id: `m-${Date.now()}-2`,
          title: 'Substrate & Plywood Moisture Inspection',
          description: '19mm CD structural ply tested at <18% moisture content.',
          completed: false,
          signoffRequired: true
        },
        {
          id: `m-${Date.now()}-3`,
          title: 'The Roofing Store Synthetic Breather Underlay',
          description: 'Thermoplastic synthetic underlay mechanically fixed with 150mm taped overlaps.',
          completed: false,
          signoffRequired: false
        },
        {
          id: `m-${Date.now()}-4`,
          title: `${profile} Tray Roll-forming & Seaming`,
          description: `Custom roll-formed pans in ${material}.`,
          completed: false,
          signoffRequired: true
        },
        {
          id: `m-${Date.now()}-5`,
          title: 'Archtech Job Handover & Sign-off Pack',
          description: 'Producer statement and 25-year manufacturer durability warranty issued for client and council.',
          completed: false,
          signoffRequired: true
        }
      ],
      variations: [],
      photos: [],
      timeEntries: [],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          entityId: `proj-${Date.now()}`,
          entityType: 'project',
          type: 'note',
          title: 'Trade Job Created in Pipeline',
          details: `Job initialised under ${jobStage} stage. Contract value $${contractValueNZD}.`,
          author: 'Marcus Kuhtze',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ]
    };

    onAddProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full my-8 overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm">Create New Trade Job</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Project / Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Takapuna Coastal Pavilion Residence"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Julian & Sarah Vance"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Client Email</label>
              <input
                type="email"
                placeholder="client@domain.co.nz"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Architectural Firm</label>
              <input
                type="text"
                placeholder="e.g. Fearon Hay Architects"
                value={architect}
                onChange={(e) => setArchitect(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Head Contractor / Builder</label>
              <input
                type="text"
                placeholder="e.g. Cook Brothers Construction"
                value={headContractor}
                onChange={(e) => setHeadContractor(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Site Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 88 Matakana Valley Road, Matakana Coast"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Roofing Profile</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="Archtech Super Seam 38mm">Archtech Super Seam 38mm</option>
                <option value="Archtech Angle Seam">Archtech Angle Seam</option>
                <option value="Archtech Double Angle Seam">Archtech Double Angle Seam</option>
                <option value="Archtech Interlocking Panels">Archtech Interlocking Panels</option>
                <option value="Archtech Weatherboard Step Panels">Archtech Weatherboard Step Panels</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">The Roofing Store Coil Alloy</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="Kiwicolour® Vitor+ PVDF (The Roofing Store)">Kiwicolour® Vitor+ PVDF</option>
                <option value="Kiwicolour® Zenex+ Extreme Coastal">Kiwicolour® Zenex+ Coastal</option>
                <option value="The Roofing Store MagnaFlow®">The Roofing Store MagnaFlow®</option>
                <option value="VMZinc® Anthra-Zinc">VMZinc® Anthra-Zinc</option>
                <option value="Weathering Steel (CORTEN)">Weathering Steel (CORTEN)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Roof Area (m²) *</label>
              <input
                type="number"
                min="10"
                required
                value={roofAreaM2}
                onChange={(e) => setRoofAreaM2(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contract / Estimated Value ($NZD) *</label>
              <input
                type="number"
                step="500"
                min="1000"
                required
                value={contractValueNZD}
                onChange={(e) => setContractValueNZD(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Starting Pipeline Stage</label>
              <select
                value={jobStage}
                onChange={(e) => setJobStage(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
              >
                <option value="enquiry_measure">1. Enquiry & Measure</option>
                <option value="quoting">2. Quoting & Scope</option>
                <option value="quote_sent">3. Quote Sent / Review</option>
                <option value="pre_start">4. Pre-Start & Material</option>
                <option value="active_onsite">5. Active On-Site</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
              />
            </div>
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
              Create Trade Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
