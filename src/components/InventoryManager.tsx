import React, { useState } from 'react';
import { CoilStock, AccessoryStock, Project } from '../types/crm';
import { formatNZD } from '../utils/formatters';
import { 
  Layers, 
  AlertTriangle, 
  Plus, 
  Search, 
  ArrowDownToLine, 
  Check, 
  Package, 
  MapPin, 
  ShieldAlert,
  Boxes
} from 'lucide-react';

interface Props {
  coils: CoilStock[];
  accessories: AccessoryStock[];
  projects: Project[];
  onUpdateCoil: (updated: CoilStock) => void;
  onAddCoil: (newCoil: CoilStock) => void;
  onUpdateAccessory: (updated: AccessoryStock) => void;
}

export const InventoryManager: React.FC<Props> = ({
  coils,
  accessories,
  projects,
  onUpdateCoil,
  onAddCoil,
  onUpdateAccessory,
}) => {
  const [activeTab, setActiveTab] = useState<'coils' | 'accessories'>('coils');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoil, setSelectedCoil] = useState<CoilStock | null>(null);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocateMetres, setAllocateMetres] = useState<number>(100);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isNewCoilOpen, setIsNewCoilOpen] = useState(false);

  // New Coil Form State
  const [newCoilForm, setNewCoilForm] = useState<Partial<CoilStock>>({
    coilNumber: `TRS-KC-${Math.floor(1000 + Math.random() * 9000)}`,
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'FlaxPod / Slate (PVDF)',
    colorHex: '#272a2b',
    thicknessMm: 0.55,
    slitWidthMm: 450,
    totalLinearMetres: 1200,
    allocatedLinearMetres: 0,
    weightKg: 2600,
    locationBay: 'Bay TRS-01 (Archtech Auckland Hub)',
    supplier: 'The Roofing Store Ltd (East Tamaki Branch)',
    minThresholdMetres: 250
  });

  const filteredCoils = coils.filter(c => 
    c.coilNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.locationBay.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccessories = accessories.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.specification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCoilLinearMetres = coils.reduce((acc, c) => acc + c.totalLinearMetres, 0);
  const totalAllocatedMetres = coils.reduce((acc, c) => acc + c.allocatedLinearMetres, 0);
  const totalAvailableMetres = totalCoilLinearMetres - totalAllocatedMetres;
  const lowStockCoilsCount = coils.filter(c => (c.totalLinearMetres - c.allocatedLinearMetres) <= c.minThresholdMetres).length;

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoil || allocateMetres <= 0) return;

    const available = selectedCoil.totalLinearMetres - selectedCoil.allocatedLinearMetres;
    if (allocateMetres > available) {
      alert(`Cannot allocate ${allocateMetres}m. Only ${available}m available.`);
      return;
    }

    const updated: CoilStock = {
      ...selectedCoil,
      allocatedLinearMetres: selectedCoil.allocatedLinearMetres + Number(allocateMetres)
    };

    onUpdateCoil(updated);
    setSelectedCoil(updated);
    setIsAllocateOpen(false);
  };

  const handleQuickReceiveCoil = (coil: CoilStock, addMetres: number) => {
    const updated: CoilStock = {
      ...coil,
      totalLinearMetres: coil.totalLinearMetres + addMetres,
      weightKg: coil.weightKg + Math.round(addMetres * 2.3)
    };
    onUpdateCoil(updated);
    if (selectedCoil?.id === coil.id) setSelectedCoil(updated);
  };

  const handleRestockAccessory = (acc: AccessoryStock, amount: number) => {
    const updated: AccessoryStock = {
      ...acc,
      quantityOnHand: acc.quantityOnHand + amount
    };
    onUpdateAccessory(updated);
  };

  const handleCreateCoilSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CoilStock = {
      id: `coil-${Date.now()}`,
      coilNumber: newCoilForm.coilNumber || `NZS-${Date.now()}`,
      material: newCoilForm.material || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      colorName: newCoilForm.colorName || 'FlaxPod / Slate',
      colorHex: newCoilForm.colorHex || '#272a2b',
      thicknessMm: Number(newCoilForm.thicknessMm) || 0.55,
      slitWidthMm: Number(newCoilForm.slitWidthMm) || 450,
      totalLinearMetres: Number(newCoilForm.totalLinearMetres) || 1000,
      allocatedLinearMetres: 0,
      weightKg: Number(newCoilForm.weightKg) || 2200,
      locationBay: newCoilForm.locationBay || 'Bay TRS-01 (Archtech Auckland)',
      supplier: newCoilForm.supplier || 'The Roofing Store Ltd',
      batchDate: new Date().toISOString().split('T')[0],
      minThresholdMetres: Number(newCoilForm.minThresholdMetres) || 200
    };

    onAddCoil(created);
    setIsNewCoilOpen(false);
    setSelectedCoil(created);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Raw Coil Stock</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalCoilLinearMetres.toLocaleString()} m
          </p>
          <span className="text-xs text-slate-500">COLORSTEEL, VMZinc, Copper</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated to Active Jobs</span>
          <p className="text-2xl font-bold text-sky-800 mt-1 font-mono tabular-nums">
            {totalAllocatedMetres.toLocaleString()} m
          </p>
          <span className="text-xs text-slate-500">Committed to roll-forming</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Available for Quoting</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1 font-mono tabular-nums">
            {totalAvailableMetres.toLocaleString()} m
          </p>
          <span className="text-xs text-slate-500">Unreserved linear stock</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock Warnings</span>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono tabular-nums flex items-center gap-1.5">
            {lowStockCoilsCount}
            {lowStockCoilsCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-600 inline" />}
          </p>
          <span className="text-xs text-slate-500">Below minimum buffer threshold</span>
        </div>
      </div>

      {/* Control bar: search, category switch, receive new coil */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coil number, alloy, color, bay location..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('coils')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'coils' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Coils & Metal ({coils.length})
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'accessories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clips, Underlay & Fixings ({accessories.length})
            </button>
          </div>
        </div>

        {activeTab === 'coils' && (
          <button
            onClick={() => setIsNewCoilOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Receive Master Coil Delivery
          </button>
        )}
      </div>

      {/* Coils Table View */}
      {activeTab === 'coils' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Coil ID & Material</th>
                <th scope="col" className="px-4 py-3">Color Swatch</th>
                <th scope="col" className="px-4 py-3">Dimensions</th>
                <th scope="col" className="px-4 py-3 text-right">Total Length</th>
                <th scope="col" className="px-4 py-3 text-right">Allocated</th>
                <th scope="col" className="px-4 py-3 text-right">Available</th>
                <th scope="col" className="px-4 py-3">Yard Bay</th>
                <th scope="col" className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoils.map((coil) => {
                const available = coil.totalLinearMetres - coil.allocatedLinearMetres;
                const isLow = available <= coil.minThresholdMetres;

                return (
                  <tr
                    key={coil.id}
                    onClick={() => setSelectedCoil(coil)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{coil.coilNumber}</div>
                      <div className="text-[11px] text-slate-500">{coil.material}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-xs border border-slate-400 shrink-0"
                          style={{ backgroundColor: coil.colorHex }}
                        />
                        <span className="text-slate-800 font-medium">{coil.colorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      <div>{coil.thicknessMm}mm gauge</div>
                      <div className="text-[11px] text-slate-400">{coil.slitWidthMm}mm slit width</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                      {coil.totalLinearMetres} m
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-sky-800">
                      {coil.allocatedLinearMetres} m
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                      <span className={isLow ? 'text-amber-700' : 'text-emerald-700'}>
                        {available} m
                      </span>
                      {isLow && (
                        <span className="block text-[10px] text-amber-700 font-sans">Low stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {coil.locationBay}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedCoil(coil);
                            setIsAllocateOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                        >
                          Allocate
                        </button>
                        <button
                          onClick={() => handleQuickReceiveCoil(coil, 300)}
                          title="Simulate receiving 300m delivery"
                          className="px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                        >
                          +300m
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Accessories Table View */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Accessory Item & Category</th>
                <th scope="col" className="px-4 py-3">NZBC Specification & Standard</th>
                <th scope="col" className="px-4 py-3 text-right">On Hand</th>
                <th scope="col" className="px-4 py-3 text-right">Min Threshold</th>
                <th scope="col" className="px-4 py-3 text-right">Unit Cost</th>
                <th scope="col" className="px-4 py-3 text-right">Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccessories.map((acc) => {
                const isLow = acc.quantityOnHand <= acc.minStockLevel;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-500">{acc.category}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {acc.specification}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                      <span className={isLow ? 'text-amber-700' : 'text-slate-900'}>
                        {acc.quantityOnHand} {acc.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                      {acc.minStockLevel} {acc.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                      {formatNZD(acc.unitCostNZD)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestockAccessory(acc, 10)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                      >
                        +10 Units
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocate Coil Modal */}
      {isAllocateOpen && selectedCoil && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Allocate Coil to Architectural Project</h3>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
              <div><strong className="text-slate-900">Coil ID:</strong> {selectedCoil.coilNumber}</div>
              <div><strong className="text-slate-900">Material:</strong> {selectedCoil.material} ({selectedCoil.colorName})</div>
              <div><strong className="text-slate-900">Available:</strong> {selectedCoil.totalLinearMetres - selectedCoil.allocatedLinearMetres}m</div>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-900"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectNumber} · {p.title} ({p.roofAreaM2}m²)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Linear Metres to Allocate</label>
                <input
                  type="number"
                  min="1"
                  max={selectedCoil.totalLinearMetres - selectedCoil.allocatedLinearMetres}
                  value={allocateMetres}
                  onChange={(e) => setAllocateMetres(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive New Coil Modal */}
      {isNewCoilOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Receive New Coil Delivery</h3>
            <form onSubmit={handleCreateCoilSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Coil Serial Number</label>
                  <input
                    type="text"
                    required
                    value={newCoilForm.coilNumber}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, coilNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Metal / Brand</label>
                  <select
                    value={newCoilForm.material}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, material: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
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
                  <label className="block text-slate-700 font-medium mb-1">Color Name</label>
                  <input
                    type="text"
                    value={newCoilForm.colorName}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, colorName: e.target.value })}
                    placeholder="e.g. FlaxPod (CB01)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Slit Width (mm)</label>
                  <input
                    type="number"
                    value={newCoilForm.slitWidthMm}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, slitWidthMm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Linear Metres</label>
                  <input
                    type="number"
                    value={newCoilForm.totalLinearMetres}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, totalLinearMetres: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Yard Location Bay</label>
                  <input
                    type="text"
                    value={newCoilForm.locationBay}
                    onChange={(e) => setNewCoilForm({ ...newCoilForm, locationBay: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCoilOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 rounded"
                >
                  Register Coil in Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
