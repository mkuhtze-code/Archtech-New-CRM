import React, { useState, useRef } from 'react';
import { 
  MasterPricingCatalogue, 
  ProfileMaterialPrice, 
  FlashingGirthMatrixItem, 
  LabourMatrixRule, 
  HardwareCatalogueItem,
  RoofingProfile,
  CoilMaterial,
  FlashingGirthTier,
  PriceBookItem,
  PriceBookCategory
} from '../types/crm';
import { formatNZDWithDecimals, formatNZD } from '../utils/formatters';
import { 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Edit2, 
  Layers, 
  Wrench, 
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  X,
  BookOpen,
  Copy,
  Truck,
  Tag,
  DollarSign
} from 'lucide-react';
import { INITIAL_PRICING_CATALOGUE } from '../data/pricingCatalogue';

interface Props {
  catalogue: MasterPricingCatalogue;
  onUpdateCatalogue: (updated: MasterPricingCatalogue) => void;
}

export const PricingCatalogueManager: React.FC<Props> = ({
  catalogue,
  onUpdateCatalogue,
}) => {
  const [activeTab, setActiveTab] = useState<'price_book' | 'profiles' | 'flashings' | 'labour' | 'hardware'>('price_book');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Price Book State
  const [selectedPriceBookCategory, setSelectedPriceBookCategory] = useState<'All' | PriceBookCategory>('All');
  const [isAddPriceBookOpen, setIsAddPriceBookOpen] = useState(false);
  const [editingPriceBookItem, setEditingPriceBookItem] = useState<PriceBookItem | null>(null);
  const [newPriceBookItem, setNewPriceBookItem] = useState<Partial<PriceBookItem>>({
    itemCode: '',
    name: '',
    category: 'Clips & Fixings',
    supplier: 'The Roofing Store Ltd',
    unit: 'boxes (500 pcs)',
    costPriceNZD: 100,
    defaultMarkupPercent: 30,
    sellPriceNZD: 130,
    specification: ''
  });

  // Profile Modal State
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [newProfilePrice, setNewProfilePrice] = useState<Partial<ProfileMaterialPrice>>({
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    pricePerLm: 36.00,
    defaultPanWidthMm: 450
  });

  // Flashing Modal State
  const [isAddFlashingOpen, setIsAddFlashingOpen] = useState(false);
  const [newFlashingItem, setNewFlashingItem] = useState<Partial<FlashingGirthMatrixItem>>({
    girthTier: '151-300mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    pricePerLm: 29.50,
    extraFoldCostPerLm: 3.00
  });

  // Hardware Modal State
  const [isAddHardwareOpen, setIsAddHardwareOpen] = useState(false);
  const [newHardwareItem, setNewHardwareItem] = useState<Partial<HardwareCatalogueItem>>({
    name: '',
    category: 'Clips & Fixings',
    unit: 'boxes (500 pcs)',
    defaultCostNZD: 100,
    defaultSellRateNZD: 140,
    specification: 'Archtech & The Roofing Store compliant'
  });

  // Filtered lists
  const priceBookItems = catalogue.priceBook || [];
  const filteredPriceBook = priceBookItems.filter(item => {
    const matchesCategory = selectedPriceBookCategory === 'All' || item.category === selectedPriceBookCategory;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.specification && item.specification.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredProfiles = catalogue.profileMaterialPrices.filter(p =>
    p.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFlashings = catalogue.flashingGirthMatrix.filter(f =>
    f.girthTier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHardware = catalogue.hardwareCatalogue.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.specification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Price Book Handlers
  const handleUpdatePriceBookItem = (id: string, updatedFields: Partial<PriceBookItem>) => {
    const updated = (catalogue.priceBook || []).map(item => {
      if (item.id === id) {
        const cost = updatedFields.costPriceNZD !== undefined ? updatedFields.costPriceNZD : item.costPriceNZD;
        const markup = updatedFields.defaultMarkupPercent !== undefined ? updatedFields.defaultMarkupPercent : item.defaultMarkupPercent;
        const sell = updatedFields.sellPriceNZD !== undefined ? updatedFields.sellPriceNZD : Math.round(cost * (1 + markup / 100) * 100) / 100;
        return { ...item, ...updatedFields, costPriceNZD: cost, defaultMarkupPercent: markup, sellPriceNZD: sell };
      }
      return item;
    });
    onUpdateCatalogue({ ...catalogue, priceBook: updated });
  };

  const handleAddPriceBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriceBookItem.name) return;

    const cost = Number(newPriceBookItem.costPriceNZD) || 0;
    const markup = Number(newPriceBookItem.defaultMarkupPercent) || 25;
    const sell = Number(newPriceBookItem.sellPriceNZD) || Math.round(cost * (1 + markup / 100) * 100) / 100;
    const itemCode = newPriceBookItem.itemCode || `PB-${Date.now().toString().slice(-6)}`;

    if (editingPriceBookItem) {
      handleUpdatePriceBookItem(editingPriceBookItem.id, {
        name: newPriceBookItem.name,
        itemCode,
        category: (newPriceBookItem.category as PriceBookCategory) || 'Clips & Fixings',
        supplier: newPriceBookItem.supplier || 'The Roofing Store Ltd',
        unit: newPriceBookItem.unit || 'units',
        costPriceNZD: cost,
        defaultMarkupPercent: markup,
        sellPriceNZD: sell,
        specification: newPriceBookItem.specification || ''
      });
      setEditingPriceBookItem(null);
    } else {
      const newItem: PriceBookItem = {
        id: `pb-custom-${Date.now()}`,
        itemCode,
        name: newPriceBookItem.name,
        category: (newPriceBookItem.category as PriceBookCategory) || 'Clips & Fixings',
        supplier: newPriceBookItem.supplier || 'The Roofing Store Ltd',
        unit: newPriceBookItem.unit || 'units',
        costPriceNZD: cost,
        defaultMarkupPercent: markup,
        sellPriceNZD: sell,
        specification: newPriceBookItem.specification || '',
        isCustom: true
      };

      onUpdateCatalogue({
        ...catalogue,
        priceBook: [newItem, ...(catalogue.priceBook || [])]
      });
    }

    setIsAddPriceBookOpen(false);
    setNewPriceBookItem({
      itemCode: '',
      name: '',
      category: 'Clips & Fixings',
      supplier: 'The Roofing Store Ltd',
      unit: 'boxes (500 pcs)',
      costPriceNZD: 100,
      defaultMarkupPercent: 30,
      sellPriceNZD: 130,
      specification: ''
    });
  };

  const handleDuplicatePriceBookItem = (item: PriceBookItem) => {
    const clone: PriceBookItem = {
      ...item,
      id: `pb-dup-${Date.now()}`,
      itemCode: `${item.itemCode}-COPY`,
      name: `${item.name} (Copy)`
    };
    onUpdateCatalogue({
      ...catalogue,
      priceBook: [clone, ...(catalogue.priceBook || [])]
    });
    setUploadFeedback({ type: 'success', message: `Duplicated "${item.name}" into Price Book` });
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const handleDeletePriceBookItem = (id: string) => {
    const updated = (catalogue.priceBook || []).filter(item => item.id !== id);
    onUpdateCatalogue({ ...catalogue, priceBook: updated });
  };

  const handleStartEditPriceBook = (item: PriceBookItem) => {
    setEditingPriceBookItem(item);
    setNewPriceBookItem({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      supplier: item.supplier,
      unit: item.unit,
      costPriceNZD: item.costPriceNZD,
      defaultMarkupPercent: item.defaultMarkupPercent,
      sellPriceNZD: item.sellPriceNZD,
      specification: item.specification
    });
    setIsAddPriceBookOpen(true);
  };

  // Update specific Profile Price
  const handleUpdateProfilePrice = (id: string, updatedFields: Partial<ProfileMaterialPrice>) => {
    const updated = catalogue.profileMaterialPrices.map(item => 
      item.id === id ? { ...item, ...updatedFields } : item
    );
    onUpdateCatalogue({ ...catalogue, profileMaterialPrices: updated });
  };

  // Update specific Flashing Girth Item
  const handleUpdateFlashingGirth = (id: string, updatedFields: Partial<FlashingGirthMatrixItem>) => {
    const updated = catalogue.flashingGirthMatrix.map(item => 
      item.id === id ? { ...item, ...updatedFields } : item
    );
    onUpdateCatalogue({ ...catalogue, flashingGirthMatrix: updated });
  };

  // Update specific Labour Matrix Rule
  const handleUpdateLabourRule = (id: string, updatedFields: Partial<LabourMatrixRule>) => {
    const updated = catalogue.labourMatrixRules.map(item => 
      item.id === id ? { ...item, ...updatedFields } : item
    );
    onUpdateCatalogue({ ...catalogue, labourMatrixRules: updated });
  };

  // Update Hardware Item
  const handleUpdateHardware = (id: string, updatedFields: Partial<HardwareCatalogueItem>) => {
    const updated = catalogue.hardwareCatalogue.map(item => 
      item.id === id ? { ...item, ...updatedFields } : item
    );
    onUpdateCatalogue({ ...catalogue, hardwareCatalogue: updated });
  };

  // Add new Profile Material
  const handleAddProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ProfileMaterialPrice = {
      id: `pmp-${Date.now()}`,
      profile: (newProfilePrice.profile as RoofingProfile) || 'Archtech Super Seam 38mm',
      material: (newProfilePrice.material as CoilMaterial) || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: Number(newProfilePrice.pricePerLm) || 35.00,
      defaultPanWidthMm: Number(newProfilePrice.defaultPanWidthMm) || 450
    };

    onUpdateCatalogue({
      ...catalogue,
      profileMaterialPrices: [created, ...catalogue.profileMaterialPrices]
    });
    setIsAddProfileOpen(false);
  };

  // Add new Flashing Girth
  const handleAddFlashingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: FlashingGirthMatrixItem = {
      id: `fgm-${Date.now()}`,
      girthTier: (newFlashingItem.girthTier as FlashingGirthTier) || '151-300mm',
      material: (newFlashingItem.material as CoilMaterial) || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: Number(newFlashingItem.pricePerLm) || 30.00,
      extraFoldCostPerLm: Number(newFlashingItem.extraFoldCostPerLm) || 3.00
    };

    onUpdateCatalogue({
      ...catalogue,
      flashingGirthMatrix: [created, ...catalogue.flashingGirthMatrix]
    });
    setIsAddFlashingOpen(false);
  };

  // Add Hardware
  const handleAddHardwareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHardwareItem.name) return;
    const created: HardwareCatalogueItem = {
      id: `hwc-${Date.now()}`,
      name: newHardwareItem.name,
      category: newHardwareItem.category as any,
      unit: newHardwareItem.unit || 'units',
      defaultCostNZD: Number(newHardwareItem.defaultCostNZD) || 50,
      defaultSellRateNZD: Number(newHardwareItem.defaultSellRateNZD) || 75,
      specification: newHardwareItem.specification || 'The Roofing Store specification'
    };

    onUpdateCatalogue({
      ...catalogue,
      hardwareCatalogue: [created, ...catalogue.hardwareCatalogue]
    });
    setIsAddHardwareOpen(false);
    setNewHardwareItem({
      name: '',
      category: 'Clips & Fixings',
      unit: 'boxes (500 pcs)',
      defaultCostNZD: 100,
      defaultSellRateNZD: 140,
      specification: ''
    });
  };

  // CSV Import Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Check if JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.profileMaterialPrices || parsed.flashingGirthMatrix) {
            onUpdateCatalogue({
              ...catalogue,
              ...parsed
            });
            setUploadFeedback({ type: 'success', message: 'Pricing catalogue successfully updated from JSON!' });
          } else {
            setUploadFeedback({ type: 'error', message: 'Invalid JSON schema for pricing catalogue.' });
          }
        } else {
          // Parse CSV
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            setUploadFeedback({ type: 'error', message: 'CSV file is empty or missing headers.' });
            return;
          }

          let updatedProfiles = [...catalogue.profileMaterialPrices];
          let updatedFlashings = [...catalogue.flashingGirthMatrix];
          let updatedPb = [...(catalogue.priceBook || [])];
          let updatedCount = 0;

          // Header analysis
          const header = lines[0].toLowerCase();
          
          if (header.includes('itemcode') || header.includes('code') || header.includes('markup') || header.includes('supplier')) {
            // Price Book CSV: ItemCode, Name, Category, Supplier, Unit, CostPriceNZD, DefaultMarkupPercent, SellPriceNZD, Specification
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(',').map(s => s.replace(/["']/g, '').trim());
              const [code, name, cat, supp, unit, cost, markup, sell, spec] = parts;
              if (name) {
                const parsedCost = parseFloat(cost) || 0;
                const parsedMarkup = parseFloat(markup) || 25;
                const parsedSell = parseFloat(sell) || Math.round(parsedCost * (1 + parsedMarkup / 100) * 100) / 100;
                const existingIdx = updatedPb.findIndex(p => p.itemCode === code || p.name.toLowerCase() === name.toLowerCase());
                if (existingIdx >= 0) {
                  updatedPb[existingIdx] = {
                    ...updatedPb[existingIdx],
                    costPriceNZD: parsedCost,
                    defaultMarkupPercent: parsedMarkup,
                    sellPriceNZD: parsedSell,
                    supplier: supp || updatedPb[existingIdx].supplier,
                    unit: unit || updatedPb[existingIdx].unit,
                    specification: spec || updatedPb[existingIdx].specification
                  };
                  updatedCount++;
                } else {
                  updatedPb.push({
                    id: `pb-imp-${Date.now()}-${i}`,
                    itemCode: code || `PB-${Date.now().toString().slice(-4)}-${i}`,
                    name,
                    category: (cat as PriceBookCategory) || 'Clips & Fixings',
                    supplier: supp || 'The Roofing Store Ltd',
                    unit: unit || 'units',
                    costPriceNZD: parsedCost,
                    defaultMarkupPercent: parsedMarkup,
                    sellPriceNZD: parsedSell,
                    specification: spec || '',
                    isCustom: true
                  });
                  updatedCount++;
                }
              }
            }
            onUpdateCatalogue({ ...catalogue, priceBook: updatedPb });
            setUploadFeedback({ type: 'success', message: `Imported and updated ${updatedCount} items in the Master Price Book!` });
          } else if (header.includes('girth') || header.includes('tier')) {
            // Flashing CSV: GirthTier, Material, PricePerLm, ExtraFoldCost
            for (let i = 1; i < lines.length; i++) {
              const [tier, mat, price, foldCost] = lines[i].split(',').map(s => s.replace(/["']/g, '').trim());
              if (tier && mat && price) {
                const parsedPrice = parseFloat(price);
                const existingIdx = updatedFlashings.findIndex(f => f.girthTier === tier && f.material.includes(mat));
                if (existingIdx >= 0) {
                  updatedFlashings[existingIdx].pricePerLm = parsedPrice;
                  if (foldCost) updatedFlashings[existingIdx].extraFoldCostPerLm = parseFloat(foldCost);
                  updatedCount++;
                } else {
                  updatedFlashings.push({
                    id: `fgm-imp-${Date.now()}-${i}`,
                    girthTier: tier as FlashingGirthTier,
                    material: (mat as CoilMaterial) || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
                    pricePerLm: parsedPrice,
                    extraFoldCostPerLm: foldCost ? parseFloat(foldCost) : 3.00
                  });
                  updatedCount++;
                }
              }
            }
            onUpdateCatalogue({ ...catalogue, flashingGirthMatrix: updatedFlashings });
            setUploadFeedback({ type: 'success', message: `Imported and updated ${updatedCount} flashing girth matrix rates!` });
          } else {
            // Profile & Material CSV: Profile, Material, PricePerLm, PanWidth
            for (let i = 1; i < lines.length; i++) {
              const [prof, mat, price, panWidth] = lines[i].split(',').map(s => s.replace(/["']/g, '').trim());
              if (prof && mat && price) {
                const parsedPrice = parseFloat(price);
                const existingIdx = updatedProfiles.findIndex(p => p.profile.includes(prof) && p.material.includes(mat));
                if (existingIdx >= 0) {
                  updatedProfiles[existingIdx].pricePerLm = parsedPrice;
                  if (panWidth) updatedProfiles[existingIdx].defaultPanWidthMm = parseFloat(panWidth);
                  updatedCount++;
                } else {
                  updatedProfiles.push({
                    id: `pmp-imp-${Date.now()}-${i}`,
                    profile: (prof as RoofingProfile) || 'Archtech Super Seam 38mm',
                    material: (mat as CoilMaterial) || 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
                    pricePerLm: parsedPrice,
                    defaultPanWidthMm: panWidth ? parseFloat(panWidth) : 450
                  });
                  updatedCount++;
                }
              }
            }
            onUpdateCatalogue({ ...catalogue, profileMaterialPrices: updatedProfiles });
            setUploadFeedback({ type: 'success', message: `Imported and updated ${updatedCount} profile per/lm prices from CSV!` });
          }
        }
      } catch (err: any) {
        setUploadFeedback({ type: 'error', message: `Failed to parse file: ${err.message}` });
      }
      setTimeout(() => setUploadFeedback(null), 5000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export current catalogue to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'price_book') {
      csvContent += 'ItemCode,Name,Category,Supplier,Unit,CostPriceNZD,DefaultMarkupPercent,SellPriceNZD,Specification\n';
      (catalogue.priceBook || []).forEach(item => {
        csvContent += `"${item.itemCode}","${item.name}","${item.category}","${item.supplier}","${item.unit}",${item.costPriceNZD},${item.defaultMarkupPercent},${item.sellPriceNZD},"${item.specification || ''}"\n`;
      });
    } else if (activeTab === 'flashings') {
      csvContent += 'GirthTier,Material,PricePerLmNZD,ExtraFoldCostPerLm\n';
      catalogue.flashingGirthMatrix.forEach(f => {
        csvContent += `"${f.girthTier}","${f.material}",${f.pricePerLm},${f.extraFoldCostPerLm}\n`;
      });
    } else if (activeTab === 'hardware') {
      csvContent += 'Name,Category,Unit,WholesaleCostNZD,SellRateNZD,Specification\n';
      catalogue.hardwareCatalogue.forEach(h => {
        csvContent += `"${h.name}","${h.category}","${h.unit}",${h.defaultCostNZD},${h.defaultSellRateNZD},"${h.specification}"\n`;
      });
    } else {
      csvContent += 'Profile,Material,PricePerLmNZD,DefaultPanWidthMm\n';
      catalogue.profileMaterialPrices.forEach(p => {
        csvContent += `"${p.profile}","${p.material}",${p.pricePerLm},${p.defaultPanWidthMm}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archtech_${activeTab}_pricing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV Template for the active tab
  const handleDownloadTemplate = () => {
    let templateContent = '';
    let filename = '';
    if (activeTab === 'price_book') {
      templateContent = 'ItemCode,Name,Category,Supplier,Unit,CostPriceNZD,DefaultMarkupPercent,SellPriceNZD,Specification\n"TRS-SS38-VIT","Archtech Super Seam 38mm (Kiwicolour Vitor+)","Roll-Formed Profiles","The Roofing Store Ltd","lm",26.50,30,34.50,"0.55mm G300 PVDF standing seam 450mm tray"\n"FL-G151-300-VIT","Folded Flashing Girth 151-300mm","Folded Flashings","Archtech Workshop","lm",21.50,32,28.50,"Barge, apron and eaves starter flashings"\n"TRS-CLIP-316S","TRS Super Seam 316 Stainless Sliding Clips","Clips & Fixings","The Roofing Store Ltd","boxes (500 pcs)",185.00,32,245.00,"Grade 316 marine stainless sliding expansion clips"\n"TRS-UND-BRTH","TRS Synthetic Breather Underlay","Underlay & Membranes","The Roofing Store Ltd","rolls (50m²)",210.00,40,295.00,"NZBC E2/AS1 Table 23 compliant"\n"FRT-TRS-HIAB","The Roofing Store HIAB Crane Delivery","Freight & Cartage","The Roofing Store Logistics","trip",320.00,20,385.00,"Hiab crane truck delivery to site"';
      filename = 'Archtech_Master_Price_Book_Template.csv';
    } else if (activeTab === 'flashings') {
      templateContent = 'GirthTier,Material,PricePerLmNZD,ExtraFoldCostPerLm\n"151-300mm","Kiwicolour® Vitor+ PVDF (The Roofing Store)",28.50,3.00\n"301-450mm","The Roofing Store MagnaFlow®",49.50,3.50\n"451-600mm","Architectural Copper (0.6mm)",165.00,8.00\n"601-900mm","Kiwicolour® Vitor+ PVDF (The Roofing Store)",74.00,4.50';
      filename = 'Archtech_Flashing_Girth_Matrix_Template.csv';
    } else if (activeTab === 'hardware') {
      templateContent = 'Name,Category,Unit,WholesaleCostNZD,SellRateNZD,Specification\n"TRS Super Seam 316 Stainless Sliding Clips","Clips & Fixings","boxes (500 pcs)",185.00,245.00,"The Roofing Store 38mm tray clip"\n"TRS Vapour-Permeable Synthetic Breather Underlay","Underlay & Membranes","rolls (50m²)",210.00,295.00,"NZBC E2/AS1 compliant"\n"Kiwicolour Color-Matched Screws (Class 4)","Fasteners","tubs (1000 pcs)",95.00,135.00,"Class 4 anti-corrosion"';
      filename = 'Archtech_Hardware_Catalogue_Template.csv';
    } else {
      templateContent = 'Profile,Material,PricePerLmNZD,DefaultPanWidthMm\n"Archtech Super Seam 38mm","Kiwicolour® Vitor+ PVDF (The Roofing Store)",34.50,450\n"Archtech Interlocking Panels","The Roofing Store MagnaFlow®",36.50,300\n"Archtech Angle Seam","VMZinc® Anthra-Zinc",94.00,450\n"Archtech Weatherboard Step Panels","Kiwicolour® Zenex+ Extreme Coastal",35.00,220';
      filename = 'Archtech_Profile_Material_Pricing_Template.csv';
    }
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to Factory Defaults
  const handleResetDefaults = () => {
    if (confirm('Reset all matrices to Archtech & The Roofing Store standard trade defaults?')) {
      onUpdateCatalogue(INITIAL_PRICING_CATALOGUE);
      setUploadFeedback({ type: 'success', message: 'Pricing catalogue reset to factory defaults.' });
      setTimeout(() => setUploadFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Archtech Architectural Quoting Suite</span>
            <span>·</span>
            <span className="text-sky-800 font-semibold">The Roofing Store Matrix Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Pricing Catalogue & Matrix Manager
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure roll-formed $/lm rates, flashing girth tiers, multi-factor labour multipliers, and hardware fixings
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.json"
            className="hidden"
          />

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Download CSV format template for this tab"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
            Download Sample CSV
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            Upload Price File (CSV/JSON)
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Export Matrix CSV
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to Archtech / The Roofing Store factory rates"
            className="p-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {uploadFeedback && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          uploadFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {uploadFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{uploadFeedback.message}</span>
        </div>
      )}

      {/* Control Bar: Tabs, Search, Add CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            onClick={() => { setActiveTab('price_book'); setEditingRowId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'price_book' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <span>Master Price Book</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">
              {priceBookItems.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('profiles'); setEditingRowId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profiles' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profiles Matrix ({catalogue.profileMaterialPrices.length})
          </button>
          <button
            onClick={() => { setActiveTab('flashings'); setEditingRowId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'flashings' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flashing Girth Matrix ({catalogue.flashingGirthMatrix.length})
          </button>
          <button
            onClick={() => { setActiveTab('labour'); setEditingRowId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'labour' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Labour Multipliers ({catalogue.labourMatrixRules.length})
          </button>
          <button
            onClick={() => { setActiveTab('hardware'); setEditingRowId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'hardware' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hardware & Fixings ({catalogue.hardwareCatalogue.length})
          </button>
        </div>

        {/* Right side search & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search price book & codes..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {activeTab === 'price_book' && (
            <button
              onClick={() => {
                setEditingPriceBookItem(null);
                setNewPriceBookItem({
                  itemCode: '',
                  name: '',
                  category: selectedPriceBookCategory === 'All' ? 'Clips & Fixings' : selectedPriceBookCategory,
                  supplier: 'The Roofing Store Ltd',
                  unit: 'units',
                  costPriceNZD: 50,
                  defaultMarkupPercent: 30,
                  sellPriceNZD: 65,
                  specification: ''
                });
                setIsAddPriceBookOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product to Price Book
            </button>
          )}

          {activeTab === 'profiles' && (
            <button
              onClick={() => setIsAddProfileOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Profile Rate
            </button>
          )}

          {activeTab === 'flashings' && (
            <button
              onClick={() => setIsAddFlashingOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Girth Rate
            </button>
          )}

          {activeTab === 'hardware' && (
            <button
              onClick={() => setIsAddHardwareOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Hardware
            </button>
          )}
        </div>
      </div>

      {/* TAB 0: Unified Master Price Book (All Items & Pricing) */}
      {activeTab === 'price_book' && (
        <div className="space-y-4">
          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(['All', 'Roll-Formed Profiles', 'Folded Flashings', 'Clips & Fixings', 'Underlay & Membranes', 'Fasteners', 'Gutters & Downpipes', 'Consumables & Sundries', 'Freight & Cartage', 'Labour & Compliance'] as const).map((cat) => {
              const count = cat === 'All' 
                ? priceBookItems.length 
                : priceBookItems.filter(i => i.category === cat).length;
              const isSelected = selectedPriceBookCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedPriceBookCategory(cat as any)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Filtered Products</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{filteredPriceBook.length}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Primary Supplier</span>
              <span className="text-xs font-bold text-sky-800 mt-1 block truncate">The Roofing Store Ltd</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Default Trade Markup</span>
              <span className="text-lg font-bold text-emerald-800 font-mono mt-0.5 block">+25% - 40%</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Price Book Status</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Synced & Active
              </span>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-700" />
                <span className="font-semibold text-slate-900">Archtech Trade Price Book & Product Catalogue</span>
                <span className="text-slate-400">·</span>
                <span>Click rate fields to edit inline</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                Showing {filteredPriceBook.length} of {priceBookItems.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3">Code & Product Name</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Supplier</th>
                    <th scope="col" className="px-4 py-3 text-center">Unit</th>
                    <th scope="col" className="px-4 py-3 text-right">Trade Cost (NZD)</th>
                    <th scope="col" className="px-4 py-3 text-right">Markup %</th>
                    <th scope="col" className="px-4 py-3 text-right">Sell Price (NZD)</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPriceBook.map((item) => {
                    const isEditing = editingRowId === item.id;
                    const catColors: Record<string, string> = {
                      'Roll-Formed Profiles': 'bg-sky-50 text-sky-800 border-sky-200',
                      'Folded Flashings': 'bg-indigo-50 text-indigo-800 border-indigo-200',
                      'Clips & Fixings': 'bg-amber-50 text-amber-800 border-amber-200',
                      'Underlay & Membranes': 'bg-teal-50 text-teal-800 border-teal-200',
                      'Fasteners': 'bg-slate-100 text-slate-800 border-slate-200',
                      'Gutters & Downpipes': 'bg-cyan-50 text-cyan-800 border-cyan-200',
                      'Consumables & Sundries': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      'Freight & Cartage': 'bg-purple-50 text-purple-800 border-purple-200',
                      'Labour & Compliance': 'bg-rose-50 text-rose-800 border-rose-200'
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="font-bold text-slate-700">{item.itemCode}</span>
                            {item.specification && (
                              <>
                                <span>·</span>
                                <span className="line-clamp-1 text-slate-500 max-w-xs">{item.specification}</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            catColors[item.category] || 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {item.supplier}
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-slate-600 whitespace-nowrap">
                          {item.unit}
                        </td>

                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={item.costPriceNZD}
                              onChange={(e) => handleUpdatePriceBookItem(item.id, { costPriceNZD: Number(e.target.value) })}
                              className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono"
                            />
                          ) : (
                            <span>{formatNZDWithDecimals(item.costPriceNZD)}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                          {isEditing ? (
                            <input
                              type="number"
                              step="1"
                              value={item.defaultMarkupPercent}
                              onChange={(e) => handleUpdatePriceBookItem(item.id, { defaultMarkupPercent: Number(e.target.value) })}
                              className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono"
                            />
                          ) : (
                            <span className="text-emerald-700 font-semibold">+{item.defaultMarkupPercent}%</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={item.sellPriceNZD}
                              onChange={(e) => handleUpdatePriceBookItem(item.id, { sellPriceNZD: Number(e.target.value) })}
                              className="w-22 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono font-bold"
                            />
                          ) : (
                            <span>{formatNZDWithDecimals(item.sellPriceNZD)}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRowId(isEditing ? null : item.id)}
                              title={isEditing ? 'Save Row' : 'Inline Quick Edit'}
                              className={`p-1 rounded cursor-pointer ${
                                isEditing ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleStartEditPriceBook(item)}
                              title="Full Edit Details"
                              className="p-1 text-slate-400 hover:text-sky-700 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicatePriceBookItem(item)}
                              title="Duplicate Item"
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeletePriceBookItem(item.id)}
                              title="Delete Item"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPriceBook.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-slate-700">No items found matching your filter</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing your search or add a new product to the price book.</p>
                  <button
                    onClick={() => {
                      setSelectedPriceBookCategory('All');
                      setSearchTerm('');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Profile & Material Pricing Matrix (Per Linear Metre) */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              All roll-formed and tray materials are priced per linear metre (lm). Pan width determines linear metre usage per m².
            </span>
            <span className="font-mono text-slate-500">
              Formula: Area (m²) ÷ (Pan Width ÷ 1000) = Linear Metres (lm)
            </span>
          </div>

          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Architectural Profile</th>
                <th scope="col" className="px-4 py-3">Coil Material / Alloy (The Roofing Store)</th>
                <th scope="col" className="px-4 py-3 text-right">Standard Tray Pan Width</th>
                <th scope="col" className="px-4 py-3 text-right">Price / Linear Metre (lm)</th>
                <th scope="col" className="px-4 py-3 text-right">Effective Rate / m²</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((item) => {
                const isEditing = editingRowId === item.id;
                const m2Effective = item.pricePerLm * (1000 / item.defaultPanWidthMm);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.profile}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.material}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.defaultPanWidthMm}
                          onChange={(e) => handleUpdateProfilePrice(item.id, { defaultPanWidthMm: Number(e.target.value) })}
                          className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono"
                        />
                      ) : (
                        <span>{item.defaultPanWidthMm} mm</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={item.pricePerLm}
                          onChange={(e) => handleUpdateProfilePrice(item.id, { pricePerLm: Number(e.target.value) })}
                          className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono font-bold"
                        />
                      ) : (
                        <span>{formatNZDWithDecimals(item.pricePerLm)} / lm</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                      ~{formatNZDWithDecimals(m2Effective)} / m²
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingRowId(isEditing ? null : item.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isEditing ? 'Done' : 'Edit Rate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Flashing Girth Matrix (Priced per lm by Girth Tier) */}
      {activeTab === 'flashings' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Flashings are cut from coil flat sheets according to girth tiers (width in mm) and folded. Standard rates include up to 3 folds.
            </span>
            <span className="font-mono text-slate-500">
              Formula: (Girth Tier Rate/lm + [Extra Folds × Fold Rate]) × Total Length (lm)
            </span>
          </div>

          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Girth Tier (Flat Strip Width)</th>
                <th scope="col" className="px-4 py-3">Coil Material</th>
                <th scope="col" className="px-4 py-3 text-right">Base Folded Rate (3 folds)</th>
                <th scope="col" className="px-4 py-3 text-right">Extra Fold Surcharge / lm</th>
                <th scope="col" className="px-4 py-3">Typical Applications</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlashings.map((item) => {
                const isEditing = editingRowId === item.id;
                let typicalUse = 'Drip edges, window head trims, small angles';
                if (item.girthTier === '151-300mm') typicalUse = 'Barge rolls, aprons, standard counter-flashings';
                if (item.girthTier === '301-450mm') typicalUse = 'Ridge caps, standard valley trays, parapet caps';
                if (item.girthTier === '451-600mm') typicalUse = 'Deep parapets, wide apron flashings, wall cap transitions';
                if (item.girthTier === '601-900mm') typicalUse = 'Oversized internal box gutters, boundary parapets';
                if (item.girthTier === '901-1200mm') typicalUse = 'Jumbo commercial gutters, large facade fascias';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {item.girthTier}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.material}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={item.pricePerLm}
                          onChange={(e) => handleUpdateFlashingGirth(item.id, { pricePerLm: Number(e.target.value) })}
                          className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono font-bold"
                        />
                      ) : (
                        <span>{formatNZDWithDecimals(item.pricePerLm)} / lm</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={item.extraFoldCostPerLm}
                          onChange={(e) => handleUpdateFlashingGirth(item.id, { extraFoldCostPerLm: Number(e.target.value) })}
                          className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono"
                        />
                      ) : (
                        <span>+{formatNZDWithDecimals(item.extraFoldCostPerLm)} / fold</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {typicalUse}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingRowId(isEditing ? null : item.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isEditing ? 'Done' : 'Edit Rate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Labour Pricing Matrix (Multipliers) */}
      {activeTab === 'labour' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Labour rates adapt dynamically according to profile installation difficulty, roof pitch gradient, building height access, and wind zone suction.
          </div>

          <div className="p-5 space-y-6">
            {catalogue.labourMatrixRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase">{rule.application} Scope</span>
                    <h4 className="text-sm font-bold text-slate-900">{rule.profile}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Base Rate / m²:</span>
                      <input
                        type="number"
                        step="1"
                        value={rule.baseRatePerM2}
                        onChange={(e) => handleUpdateLabourRule(rule.id, { baseRatePerM2: Number(e.target.value) })}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-right"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block">Base Rate / lm:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={rule.baseRatePerLm}
                        onChange={(e) => handleUpdateLabourRule(rule.id, { baseRatePerLm: Number(e.target.value) })}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Pitch Multipliers */}
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Pitch Gradient Multipliers
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Low (3°–10°)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.pitchFactors.lowPitch3to10}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Standard (11°–25°)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.pitchFactors.standardPitch11to25}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Steep (26°–35°)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.pitchFactors.steepPitch26to35}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Extreme (&gt;35°)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.pitchFactors.extremePitchOver35}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Vertical Cladding (90°)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.pitchFactors.verticalCladding}x</span>
                    </div>
                  </div>
                </div>

                {/* Access Multipliers */}
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Height & Site Access Multipliers
                  </span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Single Storey (Ground)</span>
                      <span className="font-mono font-bold text-slate-900">{rule.accessFactors.singleStorey}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Two Storey Standard</span>
                      <span className="font-mono font-bold text-slate-900">{rule.accessFactors.twoStorey}x</span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Three Storey / Cliffside</span>
                      <span className="font-mono font-bold text-slate-900">{rule.accessFactors.threeStoreyOrCliff}x</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Hardware, Fixings, Underlay & Consumables */}
      {activeTab === 'hardware' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Supplied items including TRS sliding expansion clips, synthetic underlay rolls, fasteners, and box gutters.
          </div>

          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Hardware Item</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Unit</th>
                <th scope="col" className="px-4 py-3 text-right">Wholesale Cost (NZD)</th>
                <th scope="col" className="px-4 py-3 text-right">Sell Rate (NZD)</th>
                <th scope="col" className="px-4 py-3 text-right">Margin %</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHardware.map((item) => {
                const isEditing = editingRowId === item.id;
                const margin = ((item.defaultSellRateNZD - item.defaultCostNZD) / item.defaultSellRateNZD) * 100;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{item.specification}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.defaultCostNZD}
                          onChange={(e) => handleUpdateHardware(item.id, { defaultCostNZD: Number(e.target.value) })}
                          className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono"
                        />
                      ) : (
                        <span>{formatNZD(item.defaultCostNZD)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.defaultSellRateNZD}
                          onChange={(e) => handleUpdateHardware(item.id, { defaultSellRateNZD: Number(e.target.value) })}
                          className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono font-bold"
                        />
                      ) : (
                        <span>{formatNZD(item.defaultSellRateNZD)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                      {margin.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingRowId(isEditing ? null : item.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isEditing ? 'Done' : 'Edit Rate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Profile Modal */}
      {isAddProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Roll-Formed Profile Rate</h3>
              <button onClick={() => setIsAddProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProfileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Architectural Profile</label>
                <select
                  value={newProfilePrice.profile}
                  onChange={(e) => setNewProfilePrice({ ...newProfilePrice, profile: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
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
                <label className="block font-medium text-slate-700 mb-1">Coil Material / Alloy</label>
                <select
                  value={newProfilePrice.material}
                  onChange={(e) => setNewProfilePrice({ ...newProfilePrice, material: e.target.value as any })}
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
                <label className="block font-medium text-slate-700 mb-1">Default Tray Pan Width (mm)</label>
                <input
                  type="number"
                  value={newProfilePrice.defaultPanWidthMm}
                  onChange={(e) => setNewProfilePrice({ ...newProfilePrice, defaultPanWidthMm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Wholesale Price / Linear Metre ($NZD/lm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newProfilePrice.pricePerLm}
                  onChange={(e) => setNewProfilePrice({ ...newProfilePrice, pricePerLm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddProfileOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded"
                >
                  Add Profile Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flashing Modal */}
      {isAddFlashingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Flashing Girth Matrix Tier</h3>
              <button onClick={() => setIsAddFlashingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddFlashingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Girth Tier</label>
                <select
                  value={newFlashingItem.girthTier}
                  onChange={(e) => setNewFlashingItem({ ...newFlashingItem, girthTier: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                >
                  <option value="0-150mm">0-150mm</option>
                  <option value="151-300mm">151-300mm</option>
                  <option value="301-450mm">301-450mm</option>
                  <option value="451-600mm">451-600mm</option>
                  <option value="601-900mm">601-900mm</option>
                  <option value="901-1200mm">901-1200mm</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Coil Material</label>
                <select
                  value={newFlashingItem.material}
                  onChange={(e) => setNewFlashingItem({ ...newFlashingItem, material: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                >
                  <option value="Kiwicolour® Vitor+ PVDF (The Roofing Store)">Kiwicolour® Vitor+ PVDF (The Roofing Store)</option>
                  <option value="Kiwicolour® Zenex+ Extreme Coastal">Kiwicolour® Zenex+ Extreme Coastal</option>
                  <option value="The Roofing Store MagnaFlow®">The Roofing Store MagnaFlow®</option>
                  <option value="Architectural Copper (0.6mm)">Architectural Copper (0.6mm)</option>
                  <option value="VMZinc® Anthra-Zinc">VMZinc® Anthra-Zinc</option>
                  <option value="Terne-Coated Stainless Steel">Terne-Coated Stainless Steel</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Base Price / lm (3 Folds Included)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newFlashingItem.pricePerLm}
                  onChange={(e) => setNewFlashingItem({ ...newFlashingItem, pricePerLm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Surcharge Per Extra Fold / lm</label>
                <input
                  type="number"
                  step="0.5"
                  value={newFlashingItem.extraFoldCostPerLm}
                  onChange={(e) => setNewFlashingItem({ ...newFlashingItem, extraFoldCostPerLm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddFlashingOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded"
                >
                  Add Girth Tier Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hardware Modal */}
      {isAddHardwareOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Hardware & Consumables</h3>
              <button onClick={() => setIsAddHardwareOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHardwareSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRS Fixed Ridge Brackets"
                  value={newHardwareItem.name}
                  onChange={(e) => setNewHardwareItem({ ...newHardwareItem, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newHardwareItem.category}
                  onChange={(e) => setNewHardwareItem({ ...newHardwareItem, category: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                >
                  <option value="Clips & Fixings">Clips & Fixings</option>
                  <option value="Underlay & Membranes">Underlay & Membranes</option>
                  <option value="Fasteners">Fasteners</option>
                  <option value="Gutters & Downpipes">Gutters & Downpipes</option>
                  <option value="Consumables & Sundries">Consumables & Sundries</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newHardwareItem.unit}
                    onChange={(e) => setNewHardwareItem({ ...newHardwareItem, unit: e.target.value })}
                    placeholder="e.g. boxes (500 pcs)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Wholesale Cost ($NZD)</label>
                  <input
                    type="number"
                    value={newHardwareItem.defaultCostNZD}
                    onChange={(e) => setNewHardwareItem({ ...newHardwareItem, defaultCostNZD: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Default Quoting Sell Rate ($NZD)</label>
                <input
                  type="number"
                  value={newHardwareItem.defaultSellRateNZD}
                  onChange={(e) => setNewHardwareItem({ ...newHardwareItem, defaultSellRateNZD: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Specification Note</label>
                <input
                  type="text"
                  value={newHardwareItem.specification}
                  onChange={(e) => setNewHardwareItem({ ...newHardwareItem, specification: e.target.value })}
                  placeholder="NZBC E2/AS1 compliant"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddHardwareOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Master Price Book Item Modal */}
      {isAddPriceBookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingPriceBookItem ? 'Edit Price Book Product' : 'Add Product to Master Price Book'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsAddPriceBookOpen(false); setEditingPriceBookItem(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPriceBookSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Product / Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRS Super Seam 316 Sliding Clips"
                    value={newPriceBookItem.name || ''}
                    onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. TRS-CLIP-316"
                    value={newPriceBookItem.itemCode || ''}
                    onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, itemCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={newPriceBookItem.category || 'Clips & Fixings'}
                    onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="Roll-Formed Profiles">Roll-Formed Profiles</option>
                    <option value="Folded Flashings">Folded Flashings</option>
                    <option value="Clips & Fixings">Clips & Fixings</option>
                    <option value="Underlay & Membranes">Underlay & Membranes</option>
                    <option value="Fasteners">Fasteners</option>
                    <option value="Gutters & Downpipes">Gutters & Downpipes</option>
                    <option value="Consumables & Sundries">Consumables & Sundries</option>
                    <option value="Freight & Cartage">Freight & Cartage</option>
                    <option value="Labour & Compliance">Labour & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. The Roofing Store Ltd"
                    value={newPriceBookItem.supplier || ''}
                    onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, supplier: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. lm, box, roll"
                    value={newPriceBookItem.unit || ''}
                    onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, unit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Trade Cost ($NZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPriceBookItem.costPriceNZD || 0}
                    onChange={(e) => {
                      const cost = Number(e.target.value);
                      const markup = newPriceBookItem.defaultMarkupPercent || 30;
                      const sell = Math.round(cost * (1 + markup / 100) * 100) / 100;
                      setNewPriceBookItem({ ...newPriceBookItem, costPriceNZD: cost, sellPriceNZD: sell });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Markup %</label>
                  <input
                    type="number"
                    step="1"
                    value={newPriceBookItem.defaultMarkupPercent || 30}
                    onChange={(e) => {
                      const markup = Number(e.target.value);
                      const cost = newPriceBookItem.costPriceNZD || 0;
                      const sell = Math.round(cost * (1 + markup / 100) * 100) / 100;
                      setNewPriceBookItem({ ...newPriceBookItem, defaultMarkupPercent: markup, sellPriceNZD: sell });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase">Calculated Quoting Sell Price</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatNZDWithDecimals(newPriceBookItem.sellPriceNZD || 0)} <span className="text-xs font-normal text-slate-500">/ {newPriceBookItem.unit || 'unit'}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Estimated Profit</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    +{formatNZDWithDecimals((newPriceBookItem.sellPriceNZD || 0) - (newPriceBookItem.costPriceNZD || 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Specification & Engineering Notes</label>
                <textarea
                  rows={2}
                  value={newPriceBookItem.specification || ''}
                  onChange={(e) => setNewPriceBookItem({ ...newPriceBookItem, specification: e.target.value })}
                  placeholder="e.g. 0.55mm Kiwicolour Vitor+ PVDF, NZBC E2/AS1 compliant"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setIsAddPriceBookOpen(false); setEditingPriceBookItem(null); }}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  {editingPriceBookItem ? 'Save Changes' : 'Add to Price Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
