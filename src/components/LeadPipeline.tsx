import React, { useState } from 'react';
import { 
  Lead, 
  LeadStage, 
  WindZone, 
  ExposureZone, 
  RoofingProfile, 
  CoilMaterial 
} from '../types/crm';
import { formatNZD, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Building, 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  X,
  Compass
} from 'lucide-react';

interface Props {
  leads: Lead[];
  onUpdateLead: (updated: Lead) => void;
  onAddLead: (newLead: Lead) => void;
  onCreateQuoteFromLead: (lead: Lead) => void;
}

const STAGES: { key: LeadStage; label: string; countColor: string }[] = [
  { key: 'new_inquiry', label: 'New Inquiries', countColor: 'text-slate-600' },
  { key: 'site_measure', label: 'Site Measure', countColor: 'text-blue-600' },
  { key: 'quoting', label: 'Quoting', countColor: 'text-amber-600' },
  { key: 'quote_sent', label: 'Quote Sent', countColor: 'text-purple-600' },
  { key: 'contract_signed', label: 'Contract Signed', countColor: 'text-emerald-600' },
  { key: 'in_production', label: 'In Production', countColor: 'text-teal-600' },
];

export const LeadPipeline: React.FC<Props> = ({
  leads,
  onUpdateLead,
  onAddLead,
  onCreateQuoteFromLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [windFilter, setWindFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Form state for new lead
  const [newLeadForm, setNewLeadForm] = useState<Partial<Lead>>({
    clientName: '',
    companyOrArchitect: '',
    email: '',
    phone: '',
    projectAddress: '',
    region: 'Auckland',
    roofAreaM2: 280,
    pitchDegrees: 4,
    windZone: 'Very High',
    exposureZone: 'Zone D (Severe Marine)',
    profilePreferred: 'Archtech Super Seam 38mm',
    materialPreferred: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    estimatedValueNZD: 75000,
    stage: 'new_inquiry',
    notes: []
  });

  // Calculations
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.companyOrArchitect && lead.companyOrArchitect.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.projectAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWind = windFilter === 'all' || lead.windZone === windFilter;
    return matchesSearch && matchesWind;
  });

  const totalPipelineNZD = filteredLeads.reduce((acc, l) => acc + l.estimatedValueNZD, 0);
  const totalAreaM2 = filteredLeads.reduce((acc, l) => acc + l.roofAreaM2, 0);
  const averageLeadNZD = filteredLeads.length > 0 ? totalPipelineNZD / filteredLeads.length : 0;

  const handleStageAdvance = (lead: Lead) => {
    const stageOrder: LeadStage[] = [
      'new_inquiry', 
      'site_measure', 
      'quoting', 
      'quote_sent', 
      'contract_signed', 
      'in_production', 
      'won'
    ];
    const currentIndex = stageOrder.indexOf(lead.stage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      const updated = { ...lead, stage: nextStage };
      onUpdateLead(updated);
      if (selectedLead?.id === lead.id) setSelectedLead(updated);
    }
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNoteText.trim()) return;
    const updatedNotes = [
      ...selectedLead.notes,
      `${new Date().toISOString().split('T')[0]}: ${newNoteText.trim()}`
    ];
    const updated = { ...selectedLead, notes: updatedNotes };
    onUpdateLead(updated);
    setSelectedLead(updated);
    setNewNoteText('');
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.clientName || !newLeadForm.projectAddress) return;

    const created: Lead = {
      id: `lead-${Date.now()}`,
      clientName: newLeadForm.clientName || 'Unnamed Client',
      companyOrArchitect: newLeadForm.companyOrArchitect || 'Direct Client',
      email: newLeadForm.email || 'client@example.co.nz',
      phone: newLeadForm.phone || '+64 21 000 0000',
      projectAddress: newLeadForm.projectAddress || 'New Zealand',
      region: newLeadForm.region || 'Auckland',
      roofAreaM2: Number(newLeadForm.roofAreaM2) || 200,
      pitchDegrees: Number(newLeadForm.pitchDegrees) || 4,
      windZone: (newLeadForm.windZone as WindZone) || 'High',
      exposureZone: (newLeadForm.exposureZone as ExposureZone) || 'Zone C (Medium)',
      profilePreferred: (newLeadForm.profilePreferred as RoofingProfile) || 'Archtech Super Seam 38mm',
      materialPreferred: (newLeadForm.materialPreferred as CoilMaterial) || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      estimatedValueNZD: Number(newLeadForm.estimatedValueNZD) || 60000,
      stage: 'new_inquiry',
      createdAt: new Date().toISOString().split('T')[0],
      nextFollowUpDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: [
        `Inquiry logged: ${newLeadForm.profilePreferred} specification in ${newLeadForm.region}.`
      ]
    };

    onAddLead(created);
    setIsAddModalOpen(false);
    setSelectedLead(created);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Pipeline</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {formatNZD(totalPipelineNZD)}
          </p>
          <span className="text-xs text-slate-500">{filteredLeads.length} architectural projects</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Roof Surface</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalAreaM2.toLocaleString()} m²
          </p>
          <span className="text-xs text-slate-500">Standing seam & tray spec</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Project Value</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {formatNZD(averageLeadNZD)}
          </p>
          <span className="text-xs text-slate-500">NZ residential & commercial</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">High / Extra Wind</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {filteredLeads.filter(l => l.windZone === 'Very High' || l.windZone === 'Extra High').length}
          </p>
          <span className="text-xs text-slate-500">NZS 3604 engineered clips</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Modes, Add Lead CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, architect, region, address..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Wind Zone Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setWindFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                windFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Zones
            </button>
            <button
              onClick={() => setWindFilter('High')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                windFilter === 'High' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setWindFilter('Very High')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                windFilter === 'Very High' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Very High
            </button>
            <button
              onClick={() => setWindFilter('Extra High')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                windFilter === 'Extra High' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extra High
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Detailed List
            </button>
          </div>

          {/* Add Lead Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Architectural Lead
          </button>
        </div>
      </div>

      {/* Main Content: Kanban or List */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.estimatedValueNZD, 0);

            return (
              <div
                key={stage.key}
                className="bg-slate-50/80 rounded-lg border border-slate-200/90 flex flex-col min-w-[240px]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">{stage.label}</h3>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {formatNZD(stageTotal)}
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-medium ${stage.countColor}`}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="p-2 space-y-2 flex-1 min-h-[350px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="p-3 bg-white rounded-md border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                          {lead.clientName}
                        </h4>
                        <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                          {formatNZD(lead.estimatedValueNZD)}
                        </span>
                      </div>

                      {lead.companyOrArchitect && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.companyOrArchitect}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.projectAddress}</span>
                      </div>

                      {/* Clean Unboxed Metadata with Typographic Separator */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-700">{lead.profilePreferred}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lead.roofAreaM2}m²</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-800 font-medium">{lead.windZone} Wind</span>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                      No leads in stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Client / Architect</th>
                <th scope="col" className="px-4 py-3">Location & Region</th>
                <th scope="col" className="px-4 py-3">Profile & Material</th>
                <th scope="col" className="px-4 py-3">Wind / Marine Zone</th>
                <th scope="col" className="px-4 py-3 text-right">Area</th>
                <th scope="col" className="px-4 py-3 text-right">Est. Value (NZD)</th>
                <th scope="col" className="px-4 py-3">Stage</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div>{lead.clientName}</div>
                    <div className="text-[11px] text-slate-500">{lead.companyOrArchitect}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{lead.projectAddress}</div>
                    <div className="text-[11px] text-slate-400">{lead.region}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{lead.profilePreferred}</div>
                    <div className="text-[11px] text-slate-400">{lead.materialPreferred}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{lead.windZone} Wind</div>
                    <div className="text-[11px] text-slate-400">{lead.exposureZone}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                    {lead.roofAreaM2} m²
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatNZD(lead.estimatedValueNZD)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-800 capitalize">
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateQuoteFromLead(lead);
                      }}
                      className="px-2 py-1 text-[11px] font-medium text-sky-700 bg-sky-50 rounded hover:bg-sky-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Build Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Lead Details Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase">
                  Architectural Lead Details · {selectedLead.region}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedLead.clientName}</h2>
                <p className="text-xs text-slate-500">{selectedLead.projectAddress}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Stage Progress Control */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Current Pipeline Stage</span>
                  <span className="text-xs font-mono capitalize font-bold text-slate-900">
                    {selectedLead.stage.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStageAdvance(selectedLead)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Advance to Next Stage
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onCreateQuoteFromLead(selectedLead)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 bg-sky-100 rounded-md hover:bg-sky-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Create Interactive Quote
                  </button>
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">Architect / Builder</span>
                  <span className="text-slate-900 font-semibold text-sm mt-0.5 block">
                    {selectedLead.companyOrArchitect || 'Direct Homeowner'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">Estimated Contract Value</span>
                  <span className="text-slate-900 font-bold font-mono text-sm mt-0.5 block">
                    {formatNZD(selectedLead.estimatedValueNZD)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">Roof Profile Specification</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {selectedLead.profilePreferred}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">Coil Material / Alloy</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {selectedLead.materialPreferred}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">Roof Area & Pitch</span>
                  <span className="text-slate-900 font-mono font-semibold mt-0.5 block">
                    {selectedLead.roofAreaM2} m² @ {selectedLead.pitchDegrees}° pitch
                  </span>
                </div>

                <div className="p-3 bg-white rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block">NZ Wind & Exposure Zone</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {selectedLead.windZone} · {selectedLead.exposureZone}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                  Client Communications
                </h4>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href={`mailto:${selectedLead.email}`} className="text-sky-700 hover:underline">
                    {selectedLead.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href={`tel:${selectedLead.phone}`} className="text-slate-800 font-mono">
                    {selectedLead.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <Compass className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-700">Follow-up due: {formatDate(selectedLead.nextFollowUpDate)}</span>
                </div>
              </div>

              {/* Lead Log & Site Notes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                  Site Notes & Interaction Log
                </h4>
                <div className="space-y-2">
                  {selectedLead.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-slate-50 text-xs text-slate-700 rounded border border-slate-200">
                      {note}
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add site measure note, architect revision, phone log..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Architectural Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New NZ Architectural Roofing Lead</h3>
                <p className="text-xs text-slate-500">Record a new architectural inquiry, specifier, or high-end build</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.clientName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                    placeholder="e.g. Alistair & Mei Croft"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Architect / Specifier</label>
                  <input
                    type="text"
                    value={newLeadForm.companyOrArchitect}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, companyOrArchitect: e.target.value })}
                    placeholder="e.g. Fearon Hay, Warren and Mahoney"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="client@domain.co.nz"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+64 21 000 0000"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Site Address *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.projectAddress}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, projectAddress: e.target.value })}
                    placeholder="e.g. 42 Mangatawhiri Spit, Omaha Beach"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Region</label>
                  <select
                    value={newLeadForm.region}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, region: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Auckland / Matakana">Auckland / Matakana</option>
                    <option value="Queenstown / Wanaka">Queenstown / Wanaka</option>
                    <option value="Tauranga / Mount">Tauranga / Mount</option>
                    <option value="Hawke’s Bay">Hawke’s Bay</option>
                    <option value="Christchurch / Canterbury">Christchurch / Canterbury</option>
                    <option value="Wellington">Wellington</option>
                    <option value="Northland / Bay of Islands">Northland / Bay of Islands</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Archtech Roof Profile</label>
                  <select
                    value={newLeadForm.profilePreferred}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, profilePreferred: e.target.value as RoofingProfile })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Archtech Super Seam 38mm">Archtech Super Seam 38mm</option>
                    <option value="Archtech Angle Seam">Archtech Angle Seam</option>
                    <option value="Archtech Double Angle Seam">Archtech Double Angle Seam</option>
                    <option value="Archtech Roll Seam / Roll Cap">Archtech Roll Seam / Roll Cap</option>
                    <option value="Archtech Interlocking Panels">Archtech Interlocking Panels</option>
                    <option value="Archtech Weatherboard Step Panels">Archtech Weatherboard Step Panels</option>
                    <option value="Archtech Flat Lock Panels">Archtech Flat Lock Panels</option>
                    <option value="TRS Corrugate / Plumbdeck 0.55">TRS Corrugate / Plumbdeck 0.55</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Coil Material (The Roofing Store)</label>
                  <select
                    value={newLeadForm.materialPreferred}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, materialPreferred: e.target.value as CoilMaterial })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Kiwicolour® Vitor+ PVDF (The Roofing Store)">Kiwicolour® Vitor+ PVDF (The Roofing Store)</option>
                    <option value="Kiwicolour® Zenex+ Extreme Coastal">Kiwicolour® Zenex+ Extreme Coastal</option>
                    <option value="UniCote® Lux Architectural Pattern">UniCote® Lux Architectural Pattern</option>
                    <option value="The Roofing Store MagnaFlow®">The Roofing Store MagnaFlow®</option>
                    <option value="Architectural Copper (0.6mm)">Architectural Copper (0.6mm)</option>
                    <option value="Terne-Coated Stainless Steel">Terne-Coated Stainless Steel</option>
                    <option value="VMZinc® Anthra-Zinc">VMZinc® Anthra-Zinc</option>
                    <option value="Weathering Steel (CORTEN)">Weathering Steel (CORTEN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NZS 3604 Wind Zone</label>
                  <select
                    value={newLeadForm.windZone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, windZone: e.target.value as WindZone })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                    <option value="Extra High">Extra High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Roof Area (m²)</label>
                  <input
                    type="number"
                    value={newLeadForm.roofAreaM2}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, roofAreaM2: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Est. Contract Budget ($NZD)</label>
                  <input
                    type="number"
                    step="1000"
                    value={newLeadForm.estimatedValueNZD}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedValueNZD: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Architectural Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
