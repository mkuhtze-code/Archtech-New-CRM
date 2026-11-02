import React, { useState, useEffect, useRef } from 'react';
import { 
  Quote, 
  SpreadsheetSection, 
  SpreadsheetRow, 
  Lead, 
  MasterPricingCatalogue,
  RoofingProfile,
  CoilMaterial,
  Project,
  FlashingGirthTier
} from '../types/crm';
import { formatNZD, formatNZDWithDecimals, calculateGST, formatDate } from '../utils/formatters';
import { evaluateFormula, exportToCSV, copyTableForExcel } from '../utils/excelExporter';
import { OneDriveSyncModal } from './OneDriveSyncModal';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Printer, 
  ShieldCheck, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  FileSpreadsheet, 
  Calculator, 
  Download, 
  Copy, 
  Cloud, 
  ExternalLink, 
  Sparkles, 
  Percent, 
  Sliders, 
  FileText, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FolderSync, 
  HelpCircle,
  Building,
  UserCheck,
  Search,
  UploadCloud,
  FileUp,
  Table,
  ArrowDownToLine,
  Compass,
  Ruler,
  Droplets,
  HardHat
} from 'lucide-react';
import { ArchtechLogo } from './ArchtechLogo';
import { 
  createNewQuoteVersion, 
  recalculateQuoteWithMatrix, 
  switchQuoteMaterialAndProfile, 
  canApplyPriceMatrix, 
  isQuoteExpired, 
  getEffectiveQuoteStatus, 
  getDaysUntilExpiry 
} from '../utils/quoteVersioning';

interface Props {
  quotes: Quote[];
  leads: Lead[];
  projects?: Project[];
  catalogue: MasterPricingCatalogue;
  onUpdateQuote: (quote: Quote) => void;
  onAddQuote: (quote: Quote) => void;
  prefillLead?: Lead | null;
  onNavigateToCatalogue?: () => void;
  onOpenClientPortalQuote?: (quoteId: string, projectId?: string) => void;
}

export const QuoteBuilder: React.FC<Props> = ({
  quotes,
  leads,
  projects = [],
  catalogue,
  onUpdateQuote,
  onAddQuote,
  prefillLead,
  onNavigateToCatalogue,
  onOpenClientPortalQuote
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quotes[0]?.id || '');
  const activeQuote = quotes.find(q => q.id === selectedQuoteId) || quotes[0];

  // Primary View Mode: Excel Spreadsheet Estimator vs Client Interactive Proposal Portal
  const [viewMode, setViewMode] = useState<'spreadsheet' | 'client_portal'>('spreadsheet');

  // OneDrive modal state
  const [isOneDriveModalOpen, setIsOneDriveModalOpen] = useState(false);

  // Excel Paste Modal
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Column visibility toggles for Excel mode
  const [showCostColumns, setShowCostColumns] = useState(true);
  const [showWastageColumn, setShowWastageColumn] = useState(true);
  const [showFormulaColumn, setShowFormulaColumn] = useState(true);
  const [showSupplierColumn, setShowSupplierColumn] = useState(false);

  // Active cell in formula bar
  const [selectedCellInfo, setSelectedCellInfo] = useState<{ rowId: string; colKey: string; cellLabel: string; value: string }>({
    rowId: '',
    colKey: '',
    cellLabel: 'A1',
    value: ''
  });

  // Client Portal State
  const [clientSignerName, setClientSignerName] = useState('');
  const [clientAgreedTerms, setClientAgreedTerms] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Versioning & Master Matrix Pricing State
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [versionReason, setVersionReason] = useState('');
  const [isSwitchSpecModalOpen, setIsSwitchSpecModalOpen] = useState(false);
  const [switchProfile, setSwitchProfile] = useState<RoofingProfile>(activeQuote.profile || 'Super Seam 38mm');
  const [switchMaterial, setSwitchMaterial] = useState<CoilMaterial>(activeQuote.material || '0.55mm MagnaFlow® Extreme');
  const [matrixToast, setMatrixToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showMatrixToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setMatrixToast({ text, type });
    setTimeout(() => setMatrixToast(null), 4500);
  };

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionReason.trim()) return;
    try {
      const { newQuote, updatedPreviousQuote } = createNewQuoteVersion(
        activeQuote,
        versionReason.trim(),
        'Marcus Kuhtze (Estimator)'
      );
      onUpdateQuote(updatedPreviousQuote);
      onAddQuote(newQuote);
      setSelectedQuoteId(newQuote.id);
      setIsNewVersionModalOpen(false);
      setVersionReason('');
      showMatrixToast(`Created Version ${newQuote.version}.0 (${newQuote.quoteNumber}). Previous version marked Superseded.`, 'success');
    } catch (err: any) {
      showMatrixToast(err.message || 'Failed to create new version.', 'error');
    }
  };

  const handleRecalculateCurrentMatrix = () => {
    if (!canApplyPriceMatrix(activeQuote)) {
      showMatrixToast('Price matrix updates can only be applied to open quotes (Sent/Viewed/Expired). Accepted quotes are legally locked.', 'error');
      return;
    }

    try {
      const { newQuote, updatedPreviousQuote } = recalculateQuoteWithMatrix(activeQuote, catalogue, 'Marcus Kuhtze (Estimator)');
      if (updatedPreviousQuote) {
        onUpdateQuote(updatedPreviousQuote);
        onAddQuote(newQuote);
        setSelectedQuoteId(newQuote.id);
        showMatrixToast(`Master price matrix refreshed (${catalogue.lastUpdatedDate}). Issued new dated Version ${newQuote.version}.0!`, 'success');
      } else {
        onUpdateQuote(newQuote);
        showMatrixToast(`Draft quote unit rates updated against Master Price Matrix (${catalogue.lastUpdatedDate}).`, 'success');
      }
    } catch (err: any) {
      showMatrixToast(err.message || 'Failed to recalculate with matrix.', 'error');
    }
  };

  const handleExecuteSwitchProfileMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { newQuote, updatedPreviousQuote } = switchQuoteMaterialAndProfile(
        activeQuote,
        switchProfile,
        switchMaterial,
        catalogue,
        'Marcus Kuhtze (Estimator)'
      );
      onUpdateQuote(updatedPreviousQuote);
      onAddQuote(newQuote);
      setSelectedQuoteId(newQuote.id);
      setIsSwitchSpecModalOpen(false);
      showMatrixToast(`Switched specification to ${switchProfile} & ${switchMaterial} with identical quantities. Generated Version ${newQuote.version}.0!`, 'success');
    } catch (err: any) {
      showMatrixToast(err.message || 'Failed to switch profile/material.', 'error');
    }
  };

  const handleCopyClientLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = `${origin}${path}?quoteId=${activeQuote.id}&token=${activeQuote.clientToken || 'active'}`;
    navigator.clipboard?.writeText(url);
    showMatrixToast(`Copied secure client portal link (${activeQuote.quoteNumber}) to clipboard!`, 'info');
  };

  // Matching Project & Takeoff Import Modal State
  const matchingProject = projects.find(p => 
    (p.clientName && activeQuote.clientName && p.clientName.toLowerCase() === activeQuote.clientName.toLowerCase()) ||
    (p.siteAddress && activeQuote.siteAddress && (
      p.siteAddress.toLowerCase().includes(activeQuote.siteAddress.toLowerCase()) ||
      activeQuote.siteAddress.toLowerCase().includes(p.siteAddress.toLowerCase())
    ))
  ) || projects[0];

  const [selectedTakeoffProjectId, setSelectedTakeoffProjectId] = useState<string>(matchingProject?.id || '');
  const [isTakeoffModalOpen, setIsTakeoffModalOpen] = useState(false);
  const [takeoffToast, setTakeoffToast] = useState<string | null>(null);

  const activeTakeoffProject = projects.find(p => p.id === selectedTakeoffProjectId) || matchingProject;

  // Quote Presentation Controls (Fergus-inspired presentation shaping)
  const [detailLevel, setDetailLevel] = useState<'itemized_rates' | 'itemized_no_rates' | 'section_summary'>('itemized_rates');
  const [hiddenSectionIds, setHiddenSectionIds] = useState<string[]>([]);
  const [showCoverLetter, setShowCoverLetter] = useState(true);
  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState(
    `Thank you for the opportunity to present our comprehensive quotation for the architectural metal roofing and wall cladding package at ${activeQuote.siteAddress || 'the specified site'}.\n\nArchtech is an accredited specialist installer of premium standing seam tray profiles and custom-folded architectural flashings. All roll-forming and coil substrates are sourced directly from The Roofing Store (NZ), fabricated with Vitor+® and MagnaFlow® prepainted steel to withstand New Zealand's severe marine and high-wind environments.\n\nAll installations are managed by registered Licensed Building Practitioners (LBP) under the supervision of Marcus Kuhtze (BP134821), ensuring complete compliance with NZBC E2/AS1, MRM Code of Practice, and local council Producer Statement PS3 requirements.`
  );
  const [showWarrantyBlock, setShowWarrantyBlock] = useState(true);
  const [showPaymentMilestones, setShowPaymentMilestones] = useState(true);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(true);
  const [showPresentationControls, setShowPresentationControls] = useState(false);
  const [showSectionPickerModal, setShowSectionPickerModal] = useState(false);

  // Copy of spreadsheet sections & rows for the active quote
  const defaultSections: SpreadsheetSection[] = [
    { id: 'sec-1', title: '1. Roll-Formed Roofing & Wall Cladding Trays', colorTag: 'border-l-sky-500' },
    { id: 'sec-2', title: '2. Custom Folded Architectural Flashings (Girth Matrix)', colorTag: 'border-l-amber-500' },
    { id: 'sec-3', title: '3. Fixing Hardware, Thermal Clips & Screws', colorTag: 'border-l-purple-500' },
    { id: 'sec-4', title: '4. Synthetic Breather Underlay & Vapour Control', colorTag: 'border-l-indigo-500' },
    { id: 'sec-5', title: '5. Skylights, Penetrations & Flashings', colorTag: 'border-l-teal-500' },
    { id: 'sec-6', title: '6. Architectural Labour & Mechanical Seaming', colorTag: 'border-l-emerald-600' },
    { id: 'sec-7', title: '7. HIAB Crane Delivery, Scaffolding & Cartage', colorTag: 'border-l-orange-500' },
    { id: 'sec-8', title: '8. Producer Statement PS3 Compliance & CCC Sign-off', colorTag: 'border-l-slate-600' }
  ];

  const defaultRows: SpreadsheetRow[] = [
    // Section 1: Roll-formed Trays
    {
      id: 'row-1',
      sectionId: 'sec-1',
      itemCode: 'SS-38-FLAX',
      description: 'Archtech Super Seam 38mm Tray Pans (450mm centers, 0.55mm Vitor+ PVDF)',
      category: 'Roofing Trays',
      quantity: 633.3,
      unit: 'lm',
      wastagePercent: 5,
      unitCostNZD: 28.50,
      markupPercent: 21,
      unitSellNZD: 34.50,
      totalNZD: 21848.85,
      formula: '=633.3 * 34.50',
      notes: 'Main Gable Roof. Continuous roll-formed pans up to 14.2m with thermal slide clips.',
      supplier: 'The Roofing Store (Albany)'
    },
    {
      id: 'row-2',
      sectionId: 'sec-1',
      itemCode: 'IP-300-MAGNA',
      description: 'Archtech Interlocking Wall Panels (300mm reveal, MagnaFlow® Extreme)',
      category: 'Wall Cladding',
      quantity: 266.7,
      unit: 'lm',
      wastagePercent: 8,
      unitCostNZD: 29.80,
      markupPercent: 22.5,
      unitSellNZD: 36.50,
      totalNZD: 9734.55,
      formula: '=266.7 * 36.50',
      notes: 'North & West Coastal Elevation. 25mm shadow reveal joint.',
      supplier: 'The Roofing Store (Albany)'
    },
    // Section 2: Flashings
    {
      id: 'row-3',
      sectionId: 'sec-2',
      itemCode: 'FL-RIDGE-300',
      description: 'Ventilated Ridge Cap Flashing (Girth 301-450mm, 3 Folds, PVDF)',
      category: 'Flashings',
      quantity: 34,
      unit: 'lm',
      wastagePercent: 5,
      unitCostNZD: 31.00,
      markupPercent: 25.8,
      unitSellNZD: 39.00,
      totalNZD: 1326.00,
      formula: '=34 * 39.00',
      notes: 'Baffled ridge with breathable mesh insert.',
      supplier: 'Archtech Workshop'
    },
    {
      id: 'row-4',
      sectionId: 'sec-2',
      itemCode: 'FL-BARGE-150',
      description: 'Concealed Barge Drip Flashing (Girth 151-300mm, 4 Folds)',
      category: 'Flashings',
      quantity: 48,
      unit: 'lm',
      wastagePercent: 5,
      unitCostNZD: 24.50,
      markupPercent: 28.5,
      unitSellNZD: 31.50,
      totalNZD: 1512.00,
      formula: '=48 * 31.50',
      notes: 'Hemmed onto continuous hooked cleat.',
      supplier: 'Archtech Workshop'
    },
    {
      id: 'row-5',
      sectionId: 'sec-2',
      itemCode: 'FL-APRON-300',
      description: 'Apron Wall Abutment Flashing with 150mm turn-up (Girth 301-450mm)',
      category: 'Flashings',
      quantity: 22,
      unit: 'lm',
      wastagePercent: 5,
      unitCostNZD: 29.00,
      markupPercent: 24.1,
      unitSellNZD: 36.00,
      totalNZD: 792.00,
      formula: '=22 * 36.00',
      notes: 'Chased into weatherboard reglet.',
      supplier: 'Archtech Workshop'
    },
    // Section 3: Hardware
    {
      id: 'row-6',
      sectionId: 'sec-3',
      itemCode: 'CLIP-SS-SLIDE',
      description: 'TRS 316 Stainless Steel Sliding Thermal Movement Clips',
      category: 'Hardware',
      quantity: 1600,
      unit: 'ea',
      wastagePercent: 0,
      unitCostNZD: 0.85,
      markupPercent: 35.3,
      unitSellNZD: 1.15,
      totalNZD: 1840.00,
      formula: '=1600 * 1.15',
      notes: 'Installed at 400mm centers along tray seam.',
      supplier: 'The Roofing Store'
    },
    {
      id: 'row-7',
      sectionId: 'sec-3',
      itemCode: 'FAST-CL4-SS',
      description: 'Class 4 Galvanised / Marine 316 Low-Profile Fixing Screws',
      category: 'Hardware',
      quantity: 3200,
      unit: 'ea',
      wastagePercent: 5,
      unitCostNZD: 0.16,
      markupPercent: 37.5,
      unitSellNZD: 0.22,
      totalNZD: 704.00,
      formula: '=3200 * 0.22',
      notes: 'Wafer head for concealed clip fixing.',
      supplier: 'The Roofing Store'
    },
    // Section 4: Underlay
    {
      id: 'row-8',
      sectionId: 'sec-4',
      itemCode: 'UND-SYN-TRS',
      description: 'The Roofing Store Heavy-Duty Synthetic Breather Membrane Underlay',
      category: 'Underlay',
      quantity: 320,
      unit: 'm2',
      wastagePercent: 12,
      unitCostNZD: 4.80,
      markupPercent: 30.2,
      unitSellNZD: 6.25,
      totalNZD: 2000.00,
      formula: '=320 * 6.25',
      notes: '150mm laps taped with approved butyl tape.',
      supplier: 'The Roofing Store'
    },
    // Section 5: Labour
    {
      id: 'row-9',
      sectionId: 'sec-6',
      itemCode: 'LAB-SEAM-INSTALL',
      description: 'Archtech Certified LBP Standing Seam Installation & Mechanical Double Seaming',
      category: 'Labour',
      quantity: 285,
      unit: 'm2',
      wastagePercent: 0,
      unitCostNZD: 68.00,
      markupPercent: 25.0,
      unitSellNZD: 85.00,
      totalNZD: 24225.00,
      formula: '=285 * 85.00',
      notes: 'Marcus Kuhtze (LBP) site supervision & double mechanical seaming.',
      supplier: 'Archtech Internal Labour'
    },
    // Section 6: Freight
    {
      id: 'row-10',
      sectionId: 'sec-7',
      itemCode: 'FRT-TRS-HIAB',
      description: 'The Roofing Store Dedicated HIAB Crane Truck Delivery (Direct to Roof Level)',
      category: 'Freight',
      quantity: 2,
      unit: 'trip',
      wastagePercent: 0,
      unitCostNZD: 650.00,
      markupPercent: 15.4,
      unitSellNZD: 750.00,
      totalNZD: 1500.00,
      formula: '=2 * 750.00',
      notes: 'Matakana Coast delivery including specialized crane lift.',
      supplier: 'The Roofing Store Logistics'
    },
    // Section 7: Compliance
    {
      id: 'row-11',
      sectionId: 'sec-8',
      itemCode: 'COMP-PS3-CCC',
      description: 'Archtech Producer Statement PS3 Construction Sign-off for Council CCC',
      category: 'Compliance',
      quantity: 1,
      unit: 'sum',
      wastagePercent: 0,
      unitCostNZD: 650.00,
      markupPercent: 30.7,
      unitSellNZD: 850.00,
      totalNZD: 850.00,
      formula: '=1 * 850.00',
      notes: 'Official LBP record of work lodged for Auckland Council code compliance.',
      supplier: 'Archtech LBP'
    }
  ];

  const sections: SpreadsheetSection[] = activeQuote.spreadsheetSections || defaultSections;
  const rows: SpreadsheetRow[] = activeQuote.spreadsheetRows || defaultRows;

  // Calculate live totals from spreadsheet rows
  const subtotalNZD = rows.reduce((acc, r) => acc + (r.totalNZD || 0), 0);
  const costTotalNZD = rows.reduce((acc, r) => acc + ((r.unitCostNZD || 0) * (r.quantity || 0) * (1 + (r.wastagePercent || 0) / 100)), 0);
  const gstNZD = calculateGST(subtotalNZD).gst;
  const totalNZD = subtotalNZD + gstNZD;
  const grossMarginPercent = subtotalNZD > 0 ? Math.round(((subtotalNZD - costTotalNZD) / subtotalNZD) * 1000) / 10 : 0;
  const overallMarkupPercent = costTotalNZD > 0 ? Math.round(((subtotalNZD - costTotalNZD) / costTotalNZD) * 1000) / 10 : 0;

  // Synchronize spreadsheet rows back to quote state
  const syncQuoteSpreadsheet = (newSections: SpreadsheetSection[], newRows: SpreadsheetRow[]) => {
    const newSubtotal = newRows.reduce((acc, r) => acc + (r.totalNZD || 0), 0);
    const newCost = newRows.reduce((acc, r) => acc + ((r.unitCostNZD || 0) * (r.quantity || 0) * (1 + (r.wastagePercent || 0) / 100)), 0);
    const newGst = calculateGST(newSubtotal).gst;
    const newTotal = newSubtotal + newGst;

    const updated: Quote = {
      ...activeQuote,
      spreadsheetSections: newSections,
      spreadsheetRows: newRows,
      subtotalNZD: newSubtotal,
      costTotalNZD: newCost,
      gstNZD: newGst,
      totalNZD: newTotal,
      markupPercent: newCost > 0 ? Math.round(((newSubtotal - newCost) / newCost) * 100) : 18,
      marginPercent: newSubtotal > 0 ? Math.round(((newSubtotal - newCost) / newSubtotal) * 100) : 15
    };
    onUpdateQuote(updated);
  };

  // Cell Edit Handler (Real Excel inline editing)
  const handleCellChange = (rowId: string, field: keyof SpreadsheetRow, value: any) => {
    const updatedRows = rows.map(r => {
      if (r.id !== rowId) return r;

      const updatedRow = { ...r, [field]: value };

      // Recalculate if quantity, unitSellNZD, unitCostNZD, or wastage changed
      if (field === 'quantity' || field === 'unitSellNZD' || field === 'unitCostNZD' || field === 'markupPercent' || field === 'wastagePercent') {
        const qty = Number(field === 'quantity' ? value : r.quantity) || 0;
        let cost = Number(field === 'unitCostNZD' ? value : r.unitCostNZD) || 0;
        let markup = Number(field === 'markupPercent' ? value : r.markupPercent) || 0;
        let sell = Number(field === 'unitSellNZD' ? value : r.unitSellNZD) || 0;

        if (field === 'unitCostNZD' || field === 'markupPercent') {
          sell = Math.round(cost * (1 + markup / 100) * 100) / 100;
          updatedRow.unitSellNZD = sell;
        } else if (field === 'unitSellNZD' && cost > 0) {
          markup = Math.round(((sell - cost) / cost) * 1000) / 10;
          updatedRow.markupPercent = markup;
        }

        updatedRow.totalNZD = Math.round(qty * sell * 100) / 100;
        updatedRow.formula = `=${qty} * ${sell}`;
      }

      // If user typed directly into the formula
      if (field === 'formula' && typeof value === 'string' && value.startsWith('=')) {
        const calculated = evaluateFormula(value, r.totalNZD);
        updatedRow.totalNZD = calculated;
        if (r.quantity > 0) {
          updatedRow.unitSellNZD = Math.round((calculated / r.quantity) * 100) / 100;
        }
      }

      return updatedRow;
    });

    syncQuoteSpreadsheet(sections, updatedRows);
  };

  // Add a new row to a specific section
  const handleAddRowToSection = (sectionId: string) => {
    const newRow: SpreadsheetRow = {
      id: `row-${Date.now()}`,
      sectionId,
      itemCode: 'CUSTOM',
      description: 'New Architectural Scope Item (Custom Line)',
      category: 'General',
      quantity: 1,
      unit: 'sum',
      wastagePercent: 0,
      unitCostNZD: 250.00,
      markupPercent: 20,
      unitSellNZD: 300.00,
      totalNZD: 300.00,
      formula: '=1 * 300',
      notes: 'Custom line item entered directly into takeoff spreadsheet.',
      supplier: 'The Roofing Store'
    };
    syncQuoteSpreadsheet(sections, [...rows, newRow]);
  };

  // Delete a row
  const handleDeleteRow = (rowId: string) => {
    syncQuoteSpreadsheet(sections, rows.filter(r => r.id !== rowId));
  };

  // Add a brand new custom section
  const handleAddSection = () => {
    const sectionNum = sections.length + 1;
    const colors = ['border-l-sky-500', 'border-l-indigo-500', 'border-l-teal-500', 'border-l-emerald-500', 'border-l-amber-500', 'border-l-rose-500'];
    const newSection: SpreadsheetSection = {
      id: `sec-${Date.now()}`,
      title: `${sectionNum}. Custom Architectural Package (Section ${sectionNum})`,
      colorTag: colors[sectionNum % colors.length]
    };
    syncQuoteSpreadsheet([...sections, newSection], rows);
  };

  // Batch Markup Adjustment
  const handleApplyGlobalMarkup = (newMarkup: number) => {
    const updatedRows = rows.map(r => {
      const sell = Math.round(r.unitCostNZD * (1 + newMarkup / 100) * 100) / 100;
      return {
        ...r,
        markupPercent: newMarkup,
        unitSellNZD: sell,
        totalNZD: Math.round(r.quantity * sell * 100) / 100,
        formula: `=${r.quantity} * ${sell}`
      };
    });
    syncQuoteSpreadsheet(sections, updatedRows);
  };

  // Export to CSV / Excel
  const handleExportExcel = () => {
    exportToCSV(
      activeQuote.quoteNumber,
      activeQuote.clientName,
      sections,
      rows,
      subtotalNZD,
      gstNZD,
      totalNZD
    );
  };

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    const success = await copyTableForExcel(sections, rows);
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Paste from TSV / Excel
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText.trim().split('\n');
    const newRowsToAdd: SpreadsheetRow[] = [];
    const targetSectionId = sections[0]?.id || 'sec-1';

    lines.forEach((line, idx) => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const desc = parts[1] || parts[0] || 'Imported Line';
        const qty = Number(parts[2]) || Number(parts[1]) || 1;
        const unit = parts[3] || 'ea';
        const cost = Number(parts[4]) || 50;
        const sell = Number(parts[5]) || cost * 1.25;

        newRowsToAdd.push({
          id: `pasted-${Date.now()}-${idx}`,
          sectionId: targetSectionId,
          itemCode: parts[0] && parts[0].length < 15 ? parts[0] : 'IMP',
          description: desc,
          category: 'Pasted Items',
          quantity: qty,
          unit,
          wastagePercent: 0,
          unitCostNZD: cost,
          markupPercent: 25,
          unitSellNZD: sell,
          totalNZD: Math.round(qty * sell * 100) / 100,
          formula: `=${qty} * ${sell}`,
          notes: 'Pasted from external Excel / clipboard.'
        });
      }
    });

    if (newRowsToAdd.length > 0) {
      syncQuoteSpreadsheet(sections, [...rows, ...newRowsToAdd]);
      setIsPasteModalOpen(false);
      setPastedText('');
    }
  };

  // Import from Onsite Site Survey
  const handleImportSurveyTakeoff = () => {
    if (!activeTakeoffProject || !activeTakeoffProject.siteSurvey || !activeTakeoffProject.siteSurvey.lineItems?.length) {
      alert('Selected project does not have any recorded site survey measurements.');
      return;
    }

    const survey = activeTakeoffProject.siteSurvey;
    const traySection = sections.find(s => s.id === 'sec-1') || sections[0];
    const flashingSection = sections.find(s => s.id === 'sec-2') || sections[1] || sections[0];

    const newRows: SpreadsheetRow[] = [];

    (survey.lineItems || []).forEach((item, idx) => {
      const itemTitle = item.title || item.name || 'Measured Line';
      const isTray = item.category === 'Tray' || itemTitle.toLowerCase().includes('tray') || itemTitle.toLowerCase().includes('seam');
      const targetSec = isTray ? traySection.id : flashingSection.id;
      const count = item.count || 1;
      const effectiveLengthMm = item.slopeLengthMm || item.measuredLengthMm || item.lengthMm || 0;
      const totalLm = Math.round(((effectiveLengthMm / 1000) * count) * 10) / 10;

      let unitSell = 34.50;
      let unitCost = 28.00;
      let category = isTray ? 'Roofing Trays' : 'Flashings';
      let itemCode = item.code || (isTray ? 'SS-38' : 'FL-CUSTOM');

      if (!isTray) {
        // Girth pricing
        const tier = item.girthTier || '301-450mm';
        switch (tier) {
          case '0-150mm': unitSell = 24.50; unitCost = 18.00; break;
          case '151-300mm': unitSell = 31.50; unitCost = 23.50; break;
          case '301-450mm': unitSell = 39.00; unitCost = 29.50; break;
          case '451-600mm': unitSell = 47.00; unitCost = 36.00; break;
          case '601-900mm': unitSell = 59.00; unitCost = 45.00; break;
          case '901-1200mm': unitSell = 74.00; unitCost = 57.00; break;
        }
      }

      newRows.push({
        id: `survey-takeoff-${Date.now()}-${idx}`,
        sectionId: targetSec,
        itemCode,
        description: `${itemTitle} (${item.slopeLengthMm ? 'True Rafter Slope ' + (item.slopeLengthMm/1000).toFixed(2) + 'm' : ((item.measuredLengthMm || item.lengthMm || 0)/1000).toFixed(2) + 'm'}${item.girthTier ? ', Girth: ' + item.girthTier : ''})`,
        category,
        quantity: totalLm,
        unit: 'lm',
        wastagePercent: 5,
        unitCostNZD: unitCost,
        markupPercent: Math.round(((unitSell - unitCost) / unitCost) * 100),
        unitSellNZD: unitSell,
        totalNZD: Math.round(totalLm * unitSell * 100) / 100,
        formula: `=${totalLm} * ${unitSell}`,
        notes: `Imported from Onsite Survey (${survey.surveyNumber || 'SURV-01'}) - Measured by ${survey.surveyorName || survey.surveyor || 'LBP Roofer'}`,
        supplier: isTray ? 'The Roofing Store (Albany)' : 'Archtech Workshop'
      });
    });

    if (newRows.length > 0) {
      syncQuoteSpreadsheet(sections, [...rows, ...newRows]);
      setTakeoffToast(`Successfully imported ${newRows.length} measured line items (${survey.surveyNumber || 'Site Survey'}) into takeoff matrix!`);
      setTimeout(() => setTakeoffToast(null), 4000);
      setIsTakeoffModalOpen(false);
    }
  };

  // Import from Flashing Pins / Workshop Orders
  const handleImportFlashingPinsTakeoff = () => {
    if (!activeTakeoffProject) return;
    const pins = activeTakeoffProject.flashingPins || [];
    if (!pins.length) {
      alert('Selected project does not have any drawing flashing pins.');
      return;
    }

    const flashingSection = sections.find(s => s.id === 'sec-2') || sections[1] || sections[0];
    const newRows: SpreadsheetRow[] = [];

    pins.forEach((pin, idx) => {
      const totalLm = Math.round((pin.lengthLm * (pin.quantity || 1)) * 10) / 10;
      let unitSell = 39.00;
      let unitCost = 29.50;
      const tier = pin.girthTier || '301-450mm';
      switch (tier) {
        case '0-150mm': unitSell = 24.50; unitCost = 18.00; break;
        case '151-300mm': unitSell = 31.50; unitCost = 23.50; break;
        case '301-450mm': unitSell = 39.00; unitCost = 29.50; break;
        case '451-600mm': unitSell = 47.00; unitCost = 36.00; break;
        case '601-900mm': unitSell = 59.00; unitCost = 45.00; break;
        case '901-1200mm': unitSell = 74.00; unitCost = 57.00; break;
      }

      newRows.push({
        id: `pin-takeoff-${Date.now()}-${idx}`,
        sectionId: flashingSection.id,
        itemCode: pin.label.split(' ')[0] || 'FL-PIN',
        description: `${pin.profileName} [${pin.label}] (${pin.girthTier || '301-450mm'}, ${pin.material || 'Vitor+ 0.55mm'})`,
        category: 'Flashings',
        quantity: totalLm,
        unit: 'lm',
        wastagePercent: 5,
        unitCostNZD: unitCost,
        markupPercent: Math.round(((unitSell - unitCost) / unitCost) * 100),
        unitSellNZD: unitSell,
        totalNZD: Math.round(totalLm * unitSell * 100) / 100,
        formula: `=${totalLm} * ${unitSell}`,
        notes: `Imported from CAD Drawing Pin (${pin.planId || 'Plan RC-01'}) - ${pin.notes || ''}`,
        supplier: 'Archtech Workshop'
      });
    });

    if (newRows.length > 0) {
      syncQuoteSpreadsheet(sections, [...rows, ...newRows]);
      setTakeoffToast(`Successfully imported ${newRows.length} flashing pins from architectural drawing markups into quote!`);
      setTimeout(() => setTakeoffToast(null), 4000);
      setIsTakeoffModalOpen(false);
    }
  };

  // Client Portal interactive options
  const [selectedOptionalUpgrades, setSelectedOptionalUpgrades] = useState<{ [id: string]: boolean }>({
    'opt-1': false,
    'opt-2': true,
    'opt-3': false
  });

  const optionalUpgradesList = [
    {
      id: 'opt-1',
      title: 'Kiwicolour® Zenex+ Extreme Coastal Heavy Coating Upgrade',
      description: 'Increases marine warranty from 20 to 25 years with upgraded 200g/m² zinc-aluminium substrate.',
      additionalCostNZD: 4200.00
    },
    {
      id: 'opt-2',
      title: 'Integrated Velux Skylight Custom Flashing & Trimming Package',
      description: 'Custom folded saddle and side soaker aprons factory hemmed to Super Seam 38mm pans.',
      additionalCostNZD: 1850.00
    },
    {
      id: 'opt-3',
      title: 'Architectural Snow & Ice Retention Cleats (Central Otago Prep)',
      description: 'Extruded dual-bar powdercoated snow guards mechanically clamped to standing seams.',
      additionalCostNZD: 3100.00
    }
  ];

  const upgradesTotal = optionalUpgradesList
    .filter(u => selectedOptionalUpgrades[u.id])
    .reduce((sum, u) => sum + u.additionalCostNZD, 0);

  const clientPortalSubtotal = subtotalNZD + upgradesTotal;
  const clientPortalGst = calculateGST(clientPortalSubtotal).gst;
  const clientPortalGrandTotal = clientPortalSubtotal + clientPortalGst;

  // Handle Client Acceptance
  const handleClientAcceptQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSignerName.trim() || !clientAgreedTerms) return;

    setIsSignedSuccess(true);
    const updated: Quote = {
      ...activeQuote,
      status: 'accepted',
      clientSignature: clientSignerName,
      signedAt: new Date().toISOString()
    };
    onUpdateQuote(updated);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="font-semibold text-slate-900">Archtech Estimating Engine</span>
              <span>·</span>
              <span className="text-sky-700 font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" /> Excel-Grade Takeoff Matrix
              </span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-sky-500" /> OneDrive Sync Ready
              </span>
            </div>
            
            <div className="flex items-center gap-3 mt-1.5">
              <ArchtechLogo variant="light" className="h-7 w-auto max-w-[130px] object-left shrink-0 hidden sm:block" />
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Quoting Suite & Matrix
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {activeQuote.quoteNumber} ({activeQuote.revision || 'Rev A'})
                  </span>
                </h2>
                <span className="text-xs text-slate-500 hidden md:inline">
                  {activeQuote.clientName} · {activeQuote.siteAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('spreadsheet')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'spreadsheet'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-sky-600" />
                <span>Estimator Spreadsheet (Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('client_portal')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'client_portal'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client & Architect Portal View</span>
              </button>
            </div>

            {/* OneDrive Sync Cloud Button */}
            <button
              type="button"
              onClick={() => setIsOneDriveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-md transition-colors cursor-pointer"
              title="Open OneDrive Folder Sync & Cloud Settings"
            >
              <Cloud className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">OneDrive Folders</span>
            </button>
          </div>
        </div>

        {/* Versioning & Price Matrix Controls Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">Select Quote:</span>
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              {quotes.map((q) => {
                const effStatus = getEffectiveQuoteStatus(q);
                return (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber} (v{q.version || 1}.0) — {q.clientName} [{effStatus.toUpperCase()}] - {formatNZD(q.totalNZD)}
                  </option>
                );
              })}
            </select>

            {/* Status indicator badge */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
              activeQuote.status === 'accepted'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : activeQuote.status === 'superseded'
                ? 'bg-slate-200 text-slate-700'
                : (activeQuote.status === 'expired' || isQuoteExpired(activeQuote))
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {activeQuote.status === 'accepted' ? '🔒 Accepted & Locked' : activeQuote.status === 'superseded' ? 'Superseded' : (activeQuote.status === 'expired' || isQuoteExpired(activeQuote)) ? '⏱️ Expired' : 'Active Open'}
            </span>
          </div>

          {/* Versioning Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsNewVersionModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="Create an immutable new dated version (v+1) and mark current version Superseded"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>+ New Version (v{(activeQuote.version || 1) + 1})</span>
            </button>

            <button
              type="button"
              onClick={handleRecalculateCurrentMatrix}
              disabled={!canApplyPriceMatrix(activeQuote)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                canApplyPriceMatrix(activeQuote)
                  ? 'text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={canApplyPriceMatrix(activeQuote) ? `Refresh unit rates against Master Price Matrix (${catalogue.lastUpdatedDate})` : 'Accepted quotes are legally locked. Immutability rule: master matrix updates cannot be applied to accepted quotes.'}
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600" />
              <span>Update Price Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSwitchProfile(activeQuote.profile || 'Super Seam 38mm');
                setSwitchMaterial(activeQuote.material || '0.55mm MagnaFlow® Extreme');
                setIsSwitchSpecModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="Change material or profile with identical quantities and auto-recalculate new version using matrix pricing"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Switch Profile/Material</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClientLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
              title="Copy secure client proposal link with unique authorization token"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Client Link</span>
            </button>

            {onOpenClientPortalQuote && (
              <button
                type="button"
                onClick={() => onOpenClientPortalQuote(activeQuote.id, activeQuote.projectId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer shadow-2xs"
                title="Preview client view in Client Portal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Client Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Immutability & 30-Day Notice Banner */}
        {activeQuote.status === 'accepted' && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Legally Locked:</strong> Accepted on {formatDate(activeQuote.signedAt || activeQuote.issueDate)} by {activeQuote.acceptedBy || activeQuote.clientSignature || activeQuote.clientName}. Contract total {formatNZD(activeQuote.totalNZD)} is fixed. Under the Archtech high-trust rules, price matrix updates never apply to accepted quotes. To adjust scope, click <strong>+ New Version</strong>.
              </span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase shrink-0">
              Locked
            </span>
          </div>
        )}

        {(activeQuote.status === 'expired' || isQuoteExpired(activeQuote)) && activeQuote.status !== 'accepted' && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-950 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>30-Day Validity Expired:</strong> Quote issued {formatDate(activeQuote.issueDate)} (expired {formatDate(activeQuote.validUntil || activeQuote.expiresAt)}). In the client portal, Accept/Decline has been disabled and replaced with &quot;Request current pricing&quot;. Click <strong>Update Price Matrix</strong> to refresh unit rates and issue the next version.
              </span>
            </div>
            <button
              onClick={handleRecalculateCurrentMatrix}
              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Refresh Pricing Now
            </button>
          </div>
        )}

        {/* Financial KPI Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-mono">Wholesale Cost (TRS & Labour)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{formatNZD(costTotalNZD)}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-mono">Sell Subtotal (Excl. GST)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{formatNZD(subtotalNZD)}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-mono">Gross Margin</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">{grossMarginPercent}%</span>
            <span className="text-[10px] text-slate-500 font-mono block">Markup: {overallMarkupPercent}%</span>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-mono">GST (15% NZ)</span>
            <span className="font-mono font-bold text-slate-700 text-sm">{formatNZD(gstNZD)}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 text-white border border-slate-800">
            <span className="text-slate-300 block text-[10px] font-mono">Total Incl. GST</span>
            <span className="font-mono font-bold text-emerald-400 text-base">{formatNZD(totalNZD)}</span>
          </div>
        </div>
      </div>

      {copiedToast && (
        <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Copied complete spreadsheet matrix to clipboard! You can now paste directly into Microsoft Excel or Google Sheets.</span>
        </div>
      )}

      {takeoffToast && (
        <div className="p-2.5 bg-sky-50 border border-sky-300 rounded text-xs text-sky-900 font-medium flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{takeoffToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setTakeoffToast(null)}
            className="text-sky-700 hover:text-sky-900 font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: EXCEL-GRADE SPREADSHEET MATRIX VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'spreadsheet' && (
        <div className="space-y-3">
          {/* Spreadsheet Controls & Formula Bar */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2.5">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  <span>+ New Scope Section</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTakeoffModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded transition-colors cursor-pointer shadow-2xs"
                  title="Import field survey measures or architectural drawing pins into quote matrix"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-sky-600" />
                  <span>Import Takeoff (Survey / Pins)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  title="Paste tab-separated rows from Excel directly into this quote"
                >
                  <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paste from Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  title="Copy formatted table to paste into Excel"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy for Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer shadow-2xs"
                  title="Download .CSV spreadsheet matrix for Microsoft Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export to Excel (.CSV)</span>
                </button>
              </div>

              {/* Column Visibility Toggles & Batch Markup */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                  <span className="text-[11px] text-slate-500 font-medium">Columns:</span>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showCostColumns}
                      onChange={(e) => setShowCostColumns(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600"
                    />
                    <span>Cost & Markup</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showWastageColumn}
                      onChange={(e) => setShowWastageColumn(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600"
                    />
                    <span>Wastage %</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showFormulaColumn}
                      onChange={(e) => setShowFormulaColumn(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600"
                    />
                    <span>Formulas</span>
                  </label>
                </div>

                {/* Quick Markup Preset */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-mono">Batch Markup:</span>
                  {[15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyGlobalMarkup(pct)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Formula Bar (Excel fx bar) */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
              <div className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 text-center shrink-0">
                {selectedCellInfo.cellLabel}
              </div>
              <div className="px-2 font-mono font-bold text-slate-400 italic shrink-0">fx</div>
              <input
                type="text"
                placeholder="Enter mathematical formula (e.g. =285 * 34.50) or type cell value directly..."
                value={selectedCellInfo.value}
                onChange={(e) => {
                  setSelectedCellInfo(prev => ({ ...prev, value: e.target.value }));
                  if (selectedCellInfo.rowId && selectedCellInfo.colKey) {
                    handleCellChange(selectedCellInfo.rowId, selectedCellInfo.colKey as any, e.target.value);
                  }
                }}
                className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Excel Spreadsheet Table Sections */}
          <div className="space-y-4">
            {sections.map((section, sIdx) => {
              const sectionRows = rows.filter(r => r.sectionId === section.id);
              const sectionCost = sectionRows.reduce((sum, r) => sum + ((r.unitCostNZD || 0) * (r.quantity || 0) * (1 + (r.wastagePercent || 0) / 100)), 0);
              const sectionSell = sectionRows.reduce((sum, r) => sum + (r.totalNZD || 0), 0);
              const sectionMargin = sectionSell > 0 ? Math.round(((sectionSell - sectionCost) / sectionSell) * 1000) / 10 : 0;

              return (
                <div key={section.id} className={`bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden border-l-4 ${section.colorTag}`}>
                  {/* Section Header */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 text-xs">#{sIdx + 1}</span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s);
                          syncQuoteSpreadsheet(updated, rows);
                        }}
                        className="font-bold text-slate-900 text-xs bg-transparent hover:bg-white px-2 py-0.5 rounded border border-transparent hover:border-slate-300 focus:bg-white focus:border-slate-800 focus:outline-none w-72 sm:w-96"
                      />
                      <span className="text-[11px] font-mono text-slate-400">({sectionRows.length} lines)</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        {showCostColumns && (
                          <span className="text-slate-400 text-[11px]">Cost: {formatNZD(sectionCost)}</span>
                        )}
                        <span className="font-bold text-slate-900">Subtotal: {formatNZD(sectionSell)}</span>
                        {showCostColumns && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                            {sectionMargin}% Margin
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddRowToSection(section.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Matrix Spreadsheet Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-mono">
                      <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-2.5 w-10 text-center">#</th>
                          <th className="py-2 px-2 w-24">Item Code</th>
                          <th className="py-2 px-3 min-w-[260px] font-sans">Scope Description / Spec</th>
                          <th className="py-2 px-2.5 w-24">Category</th>
                          <th className="py-2 px-2 w-20 text-right">Qty</th>
                          <th className="py-2 px-2 w-16">Unit</th>
                          {showWastageColumn && <th className="py-2 px-2 w-16 text-right">Waste %</th>}
                          {showCostColumns && <th className="py-2 px-2 w-24 text-right">Unit Cost</th>}
                          {showCostColumns && <th className="py-2 px-2 w-20 text-right">Markup %</th>}
                          <th className="py-2 px-2 w-24 text-right">Sell Rate</th>
                          <th className="py-2 px-3 w-28 text-right bg-slate-100 font-bold">Line Total</th>
                          {showFormulaColumn && <th className="py-2 px-3 min-w-[200px]">Formula / Calc</th>}
                          <th className="py-2 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sectionRows.map((row, rIdx) => (
                          <tr key={row.id} className="hover:bg-sky-50/50 transition-colors group">
                            {/* Row Index */}
                            <td className="py-1 px-2.5 text-center text-slate-400 text-[10px]">
                              {rIdx + 1}
                            </td>

                            {/* Item Code */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.itemCode || ''}
                                onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'itemCode', cellLabel: `B${rIdx+1}`, value: row.itemCode || '' })}
                                onChange={(e) => handleCellChange(row.id, 'itemCode', e.target.value)}
                                className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-slate-700 font-semibold text-[11px]"
                              />
                            </td>

                            {/* Description */}
                            <td className="py-1 px-3 font-sans">
                              <input
                                type="text"
                                value={row.description}
                                onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'description', cellLabel: `C${rIdx+1}`, value: row.description })}
                                onChange={(e) => handleCellChange(row.id, 'description', e.target.value)}
                                className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-slate-900 font-medium text-xs"
                              />
                            </td>

                            {/* Category */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.category || ''}
                                onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'category', cellLabel: `D${rIdx+1}`, value: row.category || '' })}
                                onChange={(e) => handleCellChange(row.id, 'category', e.target.value)}
                                className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-slate-500 text-[11px]"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                step="any"
                                value={row.quantity}
                                onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'quantity', cellLabel: `E${rIdx+1}`, value: String(row.quantity) })}
                                onChange={(e) => handleCellChange(row.id, 'quantity', e.target.value)}
                                className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-right font-bold text-slate-900 text-xs"
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-1 px-2">
                              <select
                                value={row.unit}
                                onChange={(e) => handleCellChange(row.id, 'unit', e.target.value)}
                                className="w-full bg-transparent px-1 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-slate-700 text-xs"
                              >
                                <option value="lm">lm</option>
                                <option value="m2">m²</option>
                                <option value="ea">ea</option>
                                <option value="hrs">hrs</option>
                                <option value="rolls">rolls</option>
                                <option value="trip">trip</option>
                                <option value="sum">sum</option>
                                <option value="pack">pack</option>
                                <option value="kg">kg</option>
                              </select>
                            </td>

                            {/* Wastage % */}
                            {showWastageColumn && (
                              <td className="py-1 px-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={row.wastagePercent || 0}
                                  onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'wastagePercent', cellLabel: `G${rIdx+1}`, value: String(row.wastagePercent || 0) })}
                                  onChange={(e) => handleCellChange(row.id, 'wastagePercent', e.target.value)}
                                  className="w-full bg-transparent px-1 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-right text-slate-500 text-xs"
                                />
                              </td>
                            )}

                            {/* Unit Cost */}
                            {showCostColumns && (
                              <td className="py-1 px-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.unitCostNZD || 0}
                                  onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'unitCostNZD', cellLabel: `H${rIdx+1}`, value: String(row.unitCostNZD || 0) })}
                                  onChange={(e) => handleCellChange(row.id, 'unitCostNZD', e.target.value)}
                                  className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-right text-slate-600 text-xs"
                                />
                              </td>
                            )}

                            {/* Markup % */}
                            {showCostColumns && (
                              <td className="py-1 px-2 text-right">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={row.markupPercent || 0}
                                  onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'markupPercent', cellLabel: `I${rIdx+1}`, value: String(row.markupPercent || 0) })}
                                  onChange={(e) => handleCellChange(row.id, 'markupPercent', e.target.value)}
                                  className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-right text-slate-700 font-semibold text-xs"
                                />
                              </td>
                            )}

                            {/* Sell Rate */}
                            <td className="py-1 px-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={row.unitSellNZD || 0}
                                onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'unitSellNZD', cellLabel: `J${rIdx+1}`, value: String(row.unitSellNZD || 0) })}
                                onChange={(e) => handleCellChange(row.id, 'unitSellNZD', e.target.value)}
                                className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-right font-bold text-slate-900 text-xs"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="py-1 px-3 text-right bg-slate-50 font-bold text-slate-900 text-xs">
                              {formatNZD(row.totalNZD)}
                            </td>

                            {/* Formula / Calc Notes */}
                            {showFormulaColumn && (
                              <td className="py-1 px-3">
                                <input
                                  type="text"
                                  placeholder="=Qty * Rate"
                                  value={row.formula || ''}
                                  onFocus={() => setSelectedCellInfo({ rowId: row.id, colKey: 'formula', cellLabel: `L${rIdx+1}`, value: row.formula || '' })}
                                  onChange={(e) => handleCellChange(row.id, 'formula', e.target.value)}
                                  className="w-full bg-transparent px-1.5 py-1 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-600 focus:outline-none text-slate-500 font-mono text-[11px]"
                                />
                              </td>
                            )}

                            {/* Delete Action */}
                            <td className="py-1 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                title="Delete line row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {sectionRows.length === 0 && (
                          <tr>
                            <td colSpan={13} className="py-4 text-center text-slate-400 text-xs font-sans">
                              No line items in this section. Click "+ Add Row" above to insert.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CLIENT & ARCHITECT INTERACTIVE PROPOSAL PORTAL */}
      {/* ========================================================================= */}
      {viewMode === 'client_portal' && (
        <div className="space-y-4">
          {/* Quote Presentation Controls Bar (Fergus-inspired presentation customizer) */}
          <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs print:hidden space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  Presentation Layout:
                </span>
                
                {/* Detail Level Selector */}
                <div className="bg-slate-100 p-0.5 rounded-md border border-slate-200 flex items-center">
                  <button
                    type="button"
                    onClick={() => setDetailLevel('itemized_rates')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      detailLevel === 'itemized_rates'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Itemized + Rates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLevel('itemized_no_rates')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      detailLevel === 'itemized_no_rates'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Shows items and quantities but hides individual unit rates"
                  >
                    Items Only (No Rates)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLevel('section_summary')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      detailLevel === 'section_summary'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Executive summary showing package totals only"
                  >
                    Package Summary
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresentationControls(!showPresentationControls)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showPresentationControls
                      ? 'bg-sky-50 border-sky-300 text-sky-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sections & Blocks</span>
                  {showPresentationControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Print proposal or save to PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Expandable Presentation Settings Drawer */}
            {showPresentationControls && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg">
                <div>
                  <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">Included Document Blocks</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCoverLetter}
                        onChange={(e) => setShowCoverLetter(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700">Scope Cover Letter</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showTechnicalSpecs}
                        onChange={(e) => setShowTechnicalSpecs(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700">Technical Specs & Wind Zones</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showWarrantyBlock}
                        onChange={(e) => setShowWarrantyBlock(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700">25-Yr Vitor+ Guarantee Block</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPaymentMilestones}
                        onChange={(e) => setShowPaymentMilestones(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700">Payment Milestones (NZ CCA)</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Visible Scope Sections</span>
                    {hiddenSectionIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHiddenSectionIds([])}
                        className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold cursor-pointer"
                      >
                        Show All
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {sections.map(sec => {
                      const isHidden = hiddenSectionIds.includes(sec.id);
                      return (
                        <label key={sec.id} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!isHidden}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setHiddenSectionIds(prev => prev.filter(id => id !== sec.id));
                              } else {
                                setHiddenSectionIds(prev => [...prev, sec.id]);
                              }
                            }}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span className={`truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {sec.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">Scope Narrative Letter</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingCoverLetter(!isEditingCoverLetter)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isEditingCoverLetter ? 'Done Editing' : 'Customize Letter'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Tune the formal scope intro letter shown directly on the client presentation proposal.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actual Client & Architect Proposal Document Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto space-y-6 p-6 sm:p-8 text-xs print:border-none print:shadow-none print:p-0">
            {/* Proposal Brand Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <ArchtechLogo variant="light" className="h-12 sm:h-14 w-auto max-w-xs mb-3 object-left" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {activeQuote.quoteNumber}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1 font-mono text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Architectural Specification
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Site Verified
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-2">Architectural Roofing & Cladding Proposal</h1>
                <p className="text-xs text-slate-600 mt-1">
                  Prepared by <strong className="text-slate-900">Archtech</strong> — Preferred Installer for The Roofing Store (NZ)
                </p>
              </div>

              <div className="text-right font-mono text-xs space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Date Issued</span>
                <span className="font-bold text-slate-900">{formatDate(activeQuote.createdAt)}</span>
                <span className="text-slate-400 block text-[10px] mt-1">Valid Until</span>
                <span className="font-semibold text-amber-700">{formatDate(activeQuote.expiresAt)}</span>
              </div>
            </div>

            {/* Client & Project Specification Details */}
            {showTechnicalSpecs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Client & Site</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{activeQuote.clientName}</h4>
                  <p className="text-slate-600 mt-0.5">{activeQuote.siteAddress}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">{activeQuote.clientEmail} · {activeQuote.clientPhone}</p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Architectural Specification</span>
                  <p className="font-bold text-slate-900 mt-0.5">Architect: {activeQuote.architect}</p>
                  <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                    Profile: <strong>{activeQuote.profile}</strong> ({activeQuote.material})
                  </p>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 mt-1">
                    <span>Wind Design: {activeQuote.windZone}</span>
                    <span>·</span>
                    <span>Environment: {activeQuote.exposureZone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Onsite Field Verification & Substrate Handover */}
            {matchingProject?.siteSurvey && (
              <div className="bg-sky-50/50 border border-sky-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-200">
                      {matchingProject.siteSurvey.surveyNumber || 'SURV-01'}
                    </span>
                    <span className="text-slate-800 font-semibold flex items-center gap-1 font-mono text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Site Measure & Substrate Readiness Verified
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Surveyed {matchingProject.siteSurvey.dateSurveyed} by {matchingProject.siteSurvey.surveyorName?.replace(/\s*\(.*?\)/g, '') || 'Marcus Kuhtze'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded border border-sky-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                      <Compass className="w-3.5 h-3.5 text-sky-600" />
                      <span>Verified Pitch</span>
                    </div>
                    <div className="mt-0.5 font-bold text-sm text-slate-900 font-mono">
                      {matchingProject.siteSurvey.pitchDeg ?? 15}°
                      <span className="text-[11px] text-emerald-700 ml-1.5 font-normal">
                        ({(matchingProject.siteSurvey.pitchDeg ?? 15) >= 3 ? 'Standard Fall' : 'Low Fall Membrane'})
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-sky-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      <span>Substrate Moisture</span>
                    </div>
                    <div className="mt-0.5 font-bold text-sm text-emerald-700 font-mono">
                      {matchingProject.siteSurvey.moistureContentPercent || 14.2}%
                      <span className="text-[11px] text-slate-500 ml-1.5 font-normal">(Dry / Install Ready)</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-sky-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                      <Ruler className="w-3.5 h-3.5 text-sky-600" />
                      <span>Substrate Grade</span>
                    </div>
                    <div className="mt-0.5 font-bold text-xs text-slate-900">
                      {matchingProject.siteSurvey.substrateType || '17.5mm CD Structural Ply'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scope Introduction / Cover Letter Block */}
            {showCoverLetter && (
              <div className="p-4 bg-slate-50/60 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    Scope of Works & Methodology
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingCoverLetter(!isEditingCoverLetter)}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer print:hidden"
                  >
                    {isEditingCoverLetter ? 'Save Text' : 'Edit Text'}
                  </button>
                </div>

                {isEditingCoverLetter ? (
                  <textarea
                    rows={5}
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    className="w-full p-2.5 border border-sky-300 rounded bg-white text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-slate-700 text-xs whitespace-pre-line leading-relaxed">
                    {coverLetterText}
                  </p>
                )}
              </div>
            )}

            {/* Scope of Works Breakdown (Rendered according to detailLevel) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Scope of Works Breakdown
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {detailLevel === 'itemized_rates' && 'Full Itemized Rates & Measurements'}
                  {detailLevel === 'itemized_no_rates' && 'Itemized Schedule of Components (Unit Rates Bundled)'}
                  {detailLevel === 'section_summary' && 'Executive Summary by Package'}
                </span>
              </div>

              {/* Render Sections */}
              <div className="space-y-3">
                {sections
                  .filter(sec => !hiddenSectionIds.includes(sec.id))
                  .map(sec => {
                    const secRows = rows.filter(r => r.sectionId === sec.id);
                    if (secRows.length === 0) return null;
                    const secSubtotal = secRows.reduce((a, b) => a + b.totalNZD, 0);

                    // Case A: Section Summary Mode
                    if (detailLevel === 'section_summary') {
                      return (
                        <div key={sec.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{sec.title}</span>
                            <span className="text-slate-500 text-[11px] block mt-0.5">
                              {secRows.length} component{secRows.length === 1 ? '' : 's'} included · {secRows.map(r => r.category).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                            </span>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <span className="font-bold text-slate-900 text-sm">{formatNZD(secSubtotal)}</span>
                            <span className="text-[10px] text-slate-400 block font-sans">Excl. GST</span>
                          </div>
                        </div>
                      );
                    }

                    // Case B: Itemized Rates or Itemized No Rates Mode
                    return (
                      <div key={sec.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="p-3 bg-slate-50 flex items-center justify-between font-semibold text-slate-900 border-b border-slate-100">
                          <span>{sec.title}</span>
                          <span className="font-mono font-bold">{formatNZD(secSubtotal)}</span>
                        </div>
                        <div className="divide-y divide-slate-100 p-3 space-y-2">
                          {secRows.map(r => (
                            <div key={r.id} className="flex items-start justify-between text-xs pt-2 first:pt-0">
                              <div className="pr-4">
                                <span className="font-medium text-slate-900 block">{r.description}</span>
                                {r.notes && <span className="text-slate-500 text-[11px] block">{r.notes}</span>}
                              </div>
                              <div className="text-right font-mono shrink-0">
                                {detailLevel === 'itemized_rates' ? (
                                  <>
                                    <span className="text-slate-500 text-[11px] block">
                                      {r.quantity} {r.unit} @ {formatNZD(r.unitSellNZD)}
                                    </span>
                                    <span className="font-bold text-slate-900">{formatNZD(r.totalNZD)}</span>
                                  </>
                                ) : (
                                  <span className="font-semibold text-slate-700 text-xs">
                                    {r.quantity} {r.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 25-Year Manufacturer Warranty & Workmanship Guarantee Block */}
            {showWarrantyBlock && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs">
                      25-Year Vitor+® / MagnaFlow® Performance Guarantee & Workmanship Warranty
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      All roll-formed Super Seam 38mm / Interlocking panels and custom flashings carry The Roofing Store's 25-year substrate and coating durability guarantee against marine corrosion, delamination, and UV fade. Archtech warrants all installation weathertightness for 15 years in full accordance with NZBC E2/AS1.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[11px] text-emerald-900 bg-white/80 px-3 py-1.5 rounded border border-emerald-300">
                  <span className="font-bold block">AS/NZS 2728 Tested</span>
                  <span className="text-slate-500">ISO 9223 C1–C4</span>
                </div>
              </div>
            )}

            {/* Interactive Optional Scope Upgrades for Client / Architect */}
            <div className="p-5 bg-gradient-to-br from-sky-50/70 to-indigo-50/70 rounded-xl border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    Optional Architectural Scope Enhancements
                  </h4>
                  <p className="text-xs text-sky-800">
                    Select optional upgrades to include in this contract. Total recalculates dynamically.
                  </p>
                </div>
                <span className="font-mono font-bold text-sky-900 text-xs">
                  +{formatNZD(upgradesTotal)} Selected
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {optionalUpgradesList.map(opt => {
                  const isSelected = !!selectedOptionalUpgrades[opt.id];
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOptionalUpgrades(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-white border-sky-500 shadow-2xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{opt.title}</span>
                          <span className="text-slate-600 text-[11px] block mt-0.5">{opt.description}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sky-900 shrink-0 text-xs">
                        +{formatNZD(opt.additionalCostNZD)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Schedule & Milestones */}
            {showPaymentMilestones && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Contract Payment Milestones (NZ Construction Contracts Act)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">1. Deposit & Coil Order (20%)</span>
                    <span className="font-bold text-slate-900">{formatNZD(clientPortalGrandTotal * 0.20)}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">2. Trays Delivered to Site (30%)</span>
                    <span className="font-bold text-slate-900">{formatNZD(clientPortalGrandTotal * 0.30)}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">3. Dry-in & Seaming (35%)</span>
                    <span className="font-bold text-slate-900">{formatNZD(clientPortalGrandTotal * 0.35)}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">4. PS3 & CCC Sign-off (15%)</span>
                    <span className="font-bold text-slate-900">{formatNZD(clientPortalGrandTotal * 0.15)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Final Financial Totals */}
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Base Contract Subtotal:</span>
                <span>{formatNZD(subtotalNZD)}</span>
              </div>
              {upgradesTotal > 0 && (
                <div className="flex items-center justify-between text-xs text-sky-400">
                  <span>Selected Architectural Upgrades:</span>
                  <span>+{formatNZD(upgradesTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Total Excl. GST:</span>
                <span className="font-bold">{formatNZD(clientPortalSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>GST (15% NZ):</span>
                <span>{formatNZD(clientPortalGst)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-emerald-400 pt-3 border-t border-slate-700">
                <span>Total Contract Value (Incl. GST):</span>
                <span>{formatNZD(clientPortalGrandTotal)}</span>
              </div>
            </div>

          {/* Interactive Electronic Acceptance & Signature Pad */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-sm text-slate-900">Digital Acceptance & Electronic Sign-off</h4>
              <span className="text-[10px] font-mono text-slate-500">Legal Agreement</span>
            </div>

            {isSignedSuccess || activeQuote.status === 'accepted' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Proposal Accepted & Signed!</span>
                </div>
                <p className="text-xs">
                  Digitally signed by <strong>{activeQuote.clientSignature || clientSignerName}</strong> on {formatDate(activeQuote.signedAt || new Date().toISOString())}.
                </p>
                <p className="text-[11px] text-emerald-700 font-mono mt-1">
                  Coil reservation submitted to The Roofing Store. Production slot secured.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClientAcceptQuote} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Authorised Signer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Julian Vance"
                      value={clientSignerName}
                      onChange={(e) => setClientSignerName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="text"
                      readOnly
                      value={new Date().toLocaleDateString('en-NZ', { dateStyle: 'full' })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="clientAgreed"
                    checked={clientAgreedTerms}
                    onChange={(e) => setClientAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 cursor-pointer"
                  />
                  <label htmlFor="clientAgreed" className="text-slate-700 text-xs cursor-pointer">
                    I confirm acceptance of Archtech Architectural Roofing terms of trade, substrate inspection requirements, and payment schedule for Quote {activeQuote.quoteNumber}.
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!clientSignerName.trim() || !clientAgreedTerms}
                    className="px-5 py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors cursor-pointer shadow-sm text-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Approve & Electronically Sign Quote</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      )}

      {/* PASTE FROM EXCEL MODAL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-slate-900 text-sm">Paste Rows from Excel / CSV</h4>
              </div>
              <button onClick={() => setIsPasteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Copy rows directly from your Microsoft Excel or Google Sheets workbook and paste them below:
            </p>

            <textarea
              rows={6}
              placeholder="e.g. Code [TAB] Description [TAB] Quantity [TAB] Unit [TAB] Cost [TAB] Sell"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer transition-colors shadow-2xs"
              >
                Insert Rows into Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAKEOFF IMPORT MODAL (Onsite Survey & Flashing Pins) */}
      {isTakeoffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-slate-900 text-sm">Import Takeoff into Estimating Matrix</h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsTakeoffModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Project Picker */}
            <div>
              <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                Source Project / Job:
              </label>
              <select
                value={selectedTakeoffProjectId}
                onChange={(e) => setSelectedTakeoffProjectId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-medium text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.projectNumber} - {proj.title} ({proj.siteAddress})
                  </option>
                ))}
              </select>
            </div>

            {/* Option A: Site Survey Measures */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ruler className="w-4 h-4 text-sky-600" />
                  <span>On-Site Survey Measurements</span>
                </div>
                {activeTakeoffProject?.siteSurvey?.lineItems?.length ? (
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeTakeoffProject.siteSurvey.lineItems.length} lines measured ({activeTakeoffProject.siteSurvey.surveyNumber || 'SURV-01'})
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">No survey record</span>
                )}
              </div>

              {activeTakeoffProject?.siteSurvey?.lineItems?.length ? (
                <>
                  <p className="text-slate-600 text-[11px]">
                    Import rafter pitch calculations ({activeTakeoffProject.siteSurvey.pitchDeg}° pitch) and true slope lineal measures recorded on site directly into Section 1 (Trays) and Section 2 (Flashings).
                  </p>
                  <div className="max-h-32 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded bg-white text-[11px]">
                    {(activeTakeoffProject.siteSurvey.lineItems || []).map(item => (
                      <div key={item.id} className="p-1.5 flex items-center justify-between">
                        <span className="font-medium text-slate-800">{item.title || item.name || 'Measured Line'}</span>
                        <span className="font-mono font-bold text-slate-700">
                          {(((item.slopeLengthMm || item.measuredLengthMm || item.lengthMm || 0) / 1000) * (item.count || 1)).toFixed(1)} lm
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleImportSurveyTakeoff}
                      className="px-3 py-1.5 font-bold text-xs text-white bg-sky-700 hover:bg-sky-800 rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Import {(activeTakeoffProject.siteSurvey.lineItems || []).length} Survey Measures</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No site survey measurements recorded yet for this project. Open the On-Site Tool or Survey tab to record field dimensions.
                </p>
              )}
            </div>

            {/* Option B: CAD Drawing Pins */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>Architectural Drawing Flashing Pins</span>
                </div>
                {activeTakeoffProject?.flashingPins?.length ? (
                  <span className="text-[11px] font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {activeTakeoffProject.flashingPins.length} pins placed
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">No pins on plans</span>
                )}
              </div>

              {activeTakeoffProject?.flashingPins?.length ? (
                <>
                  <p className="text-slate-600 text-[11px]">
                    Import custom flashing profiles pinned onto Plan RC-01 drawings with pre-calculated girth tiers into Section 2 (Flashings).
                  </p>
                  <div className="max-h-28 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded bg-white text-[11px]">
                    {activeTakeoffProject.flashingPins.map(pin => (
                      <div key={pin.id} className="p-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{pin.label}</span>
                          <span className="text-slate-500 ml-1">({pin.profileName})</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {(pin.lengthLm * (pin.quantity || 1)).toFixed(1)} lm ({pin.girthTier || '301-450mm'})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleImportFlashingPinsTakeoff}
                      className="px-3 py-1.5 font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Import {activeTakeoffProject.flashingPins.length} Drawing Pins</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No flashing pins marked up on drawings for this project. Use the Plan Markup Tool to place flashing pins.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTakeoffModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATRIX TOAST NOTIFICATION */}
      {matrixToast && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 shadow-xs ${
          matrixToast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' 
            : matrixToast.type === 'error'
            ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
            : 'bg-sky-50 border-sky-300 text-sky-950 font-medium'
        }`}>
          <div className="flex items-center gap-2">
            {matrixToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : matrixToast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span>{matrixToast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMatrixToast(null)}
            className="text-slate-500 hover:text-slate-800 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* MODAL: CREATE NEW VERSION */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase">
                  Immutability & Version Control
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Create Version {(activeQuote.version || 1) + 1}.0
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The existing version (<strong>{activeQuote.quoteNumber}</strong>) will be locked and marked <strong>Superseded</strong>. A fresh version will be created with its own 30-day validity window and complete audit trail.
            </p>

            <form onSubmit={handleCreateNewVersion} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Revision Reason / Scope Adjustment Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={versionReason}
                  onChange={(e) => setVersionReason(e.target.value)}
                  placeholder="e.g. Switched to 0.55mm MagnaFlow Extreme and added ventilated ridge flashings per client request."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Version {(activeQuote.version || 1) + 1}.0</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SWITCH PROFILE & MATERIAL (AUTO-RECALCULATE) */}
      {isSwitchSpecModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase">
                  Matrix Auto-Recalculate
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Switch Specification (Keep Quantities)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitchSpecModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select an alternative tray profile or coil coating. Archtech will preserve all takeoff dimensions ({activeQuote.roofAreaM2} m² area, flashing lengths), pull live rates from the Master Pricing Matrix ({catalogue.lastUpdatedDate}), and generate a new dated version.
            </p>

            <form onSubmit={handleExecuteSwitchProfileMaterial} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Profile</label>
                  <select
                    value={switchProfile}
                    onChange={(e) => setSwitchProfile(e.target.value as RoofingProfile)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-semibold"
                  >
                    <option value="Super Seam 38mm">Super Seam 38mm</option>
                    <option value="Snaplock 25mm">Snaplock 25mm</option>
                    <option value="Standing Seam 25mm">Standing Seam 25mm</option>
                    <option value="Interlocking Panel 300mm">Interlocking Panel 300mm</option>
                    <option value="Corrugate 760mm">Corrugate 760mm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Material & Coating</label>
                  <select
                    value={switchMaterial}
                    onChange={(e) => setSwitchMaterial(e.target.value as CoilMaterial)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-semibold"
                  >
                    <option value="0.55mm MagnaFlow® Extreme">0.55mm MagnaFlow® Extreme</option>
                    <option value="0.55mm Vitor+® Marine">0.55mm Vitor+® Marine</option>
                    <option value="0.75mm Architectural Aluminium">0.75mm Architectural Aluminium</option>
                    <option value="0.6mm Pure Copper">0.6mm Pure Copper</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span>Current Spec:</span>
                  <span className="font-bold text-slate-800">{activeQuote.profile} · {activeQuote.material}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Current Total:</span>
                  <span className="font-bold text-slate-800">{formatNZD(activeQuote.totalNZD)}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  * New total will be computed automatically using TRS coil base price and effective pan coverage.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSwitchSpecModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Generate New Matrix Version</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONEDRIVE SYNC & CLOUD SETTINGS MODAL */}
      <OneDriveSyncModal
        isOpen={isOneDriveModalOpen}
        onClose={() => setIsOneDriveModalOpen(false)}
        activeQuote={activeQuote}
        onSyncQuote={(updated) => onUpdateQuote(updated)}
      />
    </div>
  );
};
