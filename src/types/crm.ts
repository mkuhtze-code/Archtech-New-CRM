export type WindZone = 'Low' | 'Medium' | 'High' | 'Very High' | 'Extra High';
export type ExposureZone = 'Zone B (Inland)' | 'Zone C (Medium)' | 'Zone D (Severe Marine)' | 'Zone E (Geothermal)';

export type RoofingProfile = 
  | 'Archtech Super Seam 38mm'
  | 'Archtech Angle Seam'
  | 'Archtech Double Angle Seam'
  | 'Archtech Roll Seam / Roll Cap'
  | 'Archtech Interlocking Panels'
  | 'Archtech Weatherboard Step Panels'
  | 'Archtech Flat Lock Panels'
  | 'TRS Corrugate / Plumbdeck 0.55';

export type CoilMaterial = 
  | 'Kiwicolour® Vitor+ PVDF (The Roofing Store)'
  | 'Kiwicolour® Zenex+ Extreme Coastal'
  | 'UniCote® Lux Architectural Pattern'
  | 'The Roofing Store MagnaFlow®'
  | 'Architectural Copper (0.6mm)'
  | 'Terne-Coated Stainless Steel'
  | 'VMZinc® Anthra-Zinc'
  | 'Weathering Steel (CORTEN)';

export type LeadStage = 
  | 'new_inquiry'
  | 'site_measure'
  | 'quoting'
  | 'quote_sent'
  | 'contract_signed'
  | 'in_production'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  clientName: string;
  companyOrArchitect?: string;
  email: string;
  phone: string;
  projectAddress: string;
  region: string; // Auckland, Queenstown, Wanaka, etc.
  roofAreaM2: number;
  pitchDegrees: number;
  windZone: WindZone;
  exposureZone: ExposureZone;
  profilePreferred: RoofingProfile;
  materialPreferred: CoilMaterial;
  estimatedValueNZD: number;
  stage: LeadStage;
  createdAt: string;
  nextFollowUpDate: string;
  notes: string[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  inspectorName?: string;
  signoffRequired?: boolean;
}

export interface ProjectVariation {
  id: string;
  title: string;
  description: string;
  amountNZD: number;
  status: 'pending_client' | 'approved' | 'declined';
  requestedAt: string;
  approvedAt?: string;
}

export interface SitePhoto {
  id: string;
  url: string;
  caption: string;
  phase: string;
  takenAt: string;
  uploadedBy: string;
}

export type JobWorkflowStage = 
  | 'enquiry_measure' 
  | 'quoting' 
  | 'quote_sent' 
  | 'pre_start' 
  | 'active_onsite' 
  | 'qa_snagging' 
  | 'completed';

export interface JobChecklistItem {
  id: string;
  label: string;
  category: 'Substrate & Framing' | 'Underlay & Thermal' | 'Roll-forming & Trays' | 'Clips & Seaming' | 'Flashings & Penetrations' | 'Safety & Edge Protection' | 'Custom Site Check' | 'Clean Down' | 'Trays & Seaming';
  completed?: boolean;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
  photoUrl?: string;
  completedAt?: string;
  inspectorName?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  required?: boolean;
}

export interface ArchitecturalPlan {
  id: string;
  title: string;
  sheetNumber: string; // e.g. "RC-01", "A-204"
  category: 'Roof Plan' | 'Flashing Details' | 'Penetrations' | 'Elevations' | 'Engineering';
  fileUrl: string;
  revision: string;
  date: string;
  notes?: string;
  author?: string;
  scale?: string;
  scaleCalibration?: {
    knownDistanceMm: number;
    drawingUnits: number;
    mmPerDrawingUnit: number;
    calibratedAt: string;
    calibratedBy: string;
  };
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  foreman: string;
  taskType: 'Site Measure' | 'Tray Rollforming' | 'Standing Seam Installation' | 'Flashing Folding' | 'Council Inspection' | 'Travel & Cartage';
  hours: number;
  date: string;
  billable: boolean;
  notes?: string;
}

export interface ActivityLogItem {
  id: string;
  entityId: string;
  entityType: 'project' | 'lead';
  type: 'note' | 'call' | 'email' | 'site_visit' | 'variation' | 'milestone' | 'time_logged' | 'status_change' | 'material_order';
  title: string;
  details: string;
  author: string;
  timestamp: string;
}

export interface ProjectVisibilitySettings {
  photos: boolean;
  deliveryDate: boolean;
  installStartDate: boolean;
  estimatedCompletionDate: boolean; // SENSITIVE: Default hidden, staff must explicitly enable
  documents: boolean;
}

export interface ProjectInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-041"
  projectId: string;
  quoteId?: string;
  quoteVersion?: number;
  dateIssued: string;
  dueDate: string;
  claimStage: string; // e.g. "Deposit (30%)", "Materials Onsite (40%)", "Tray Installation (20%)", "Practical Completion (10%)"
  amountNZD: number; // Subtotal before GST
  gstNZD: number;
  totalNZD: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  paidAt?: string;
  progressNotes: string;
  lineItems: { description: string; amountNZD: number }[];
}

export interface ProjectProgressNote {
  id: string;
  date: string;
  author: string;
  title: string;
  note: string;
  invoiceId?: string;
  isPublicToClient: boolean;
  photoUrl?: string;
}

export interface ProjectClientDocument {
  id: string;
  name: string;
  category: 'Quote' | 'Plan' | 'Warranty' | 'Compliance' | 'Specification' | 'Invoice';
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  sharedWithClient: boolean;
  sizeBytes?: number;
}

export interface Project {
  id: string;
  leadId?: string;
  projectNumber: string; // e.g. ARCH-2026-084
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  architect: string;
  headContractor: string;
  builder?: string;
  siteAddress: string;
  region: string;
  roofAreaM2: number;
  roofPitchDegrees?: number;
  profile: RoofingProfile;
  material: CoilMaterial;
  colorName: string; // e.g. FlaxPod, Titania, Ebony
  windZone: WindZone;
  exposureZone: ExposureZone;
  contractValueNZD: number;
  startDate: string;
  targetCompletionDate: string;
  
  // High-Trust Visibility Controls (Default: estimated completion hidden)
  visibilitySettings?: ProjectVisibilitySettings;
  deliveryDate?: string;
  installStartDate?: string;
  estimatedCompletionDate?: string;
  clientAccountActivated?: boolean;
  clientPortalToken?: string;
  currentAcceptedQuoteId?: string;

  // Running Financials & Client Invoices
  invoices?: ProjectInvoice[];
  publicProgressNotes?: ProjectProgressNote[];
  clientDocuments?: ProjectClientDocument[];

  progressPercent: number;
  status: 'pre_construction' | 'in_progress' | 'snagging' | 'completed' | 'on_hold';
  jobStage?: JobWorkflowStage;
  milestones: MilestoneItem[];
  customChecklist?: JobChecklistItem[];
  architecturalPlans?: ArchitecturalPlan[];
  plans?: ArchitecturalPlan[];
  variations: ProjectVariation[];
  photos: SitePhoto[];
  sitePhotos?: SitePhoto[];
  timeEntries?: TimeEntry[];
  activityFeed?: ActivityLogItem[];
  allocatedCoilId?: string;
  ps3Status: 'pending' | 'drafted' | 'lodged_with_council' | 'approved';
  siteMeetings?: SiteMeetingRecord[];
  siteMeasures?: SiteMeasureRecord[];
  siteSurvey?: SiteMeasureRecord;
  snaggingItems?: SnaggingItem[];
  materialOrders?: OnsiteMaterialOrder[];
  fieldSchedule?: SiteScheduleEvent[];
  siteTasks?: SiteTask[];
  flashingProfiles?: FlashingProfile[];
  flashingPins?: FlashingPin[];
  planMarkupAnnotations?: PlanMarkupAnnotation[];
}

export interface CoilStock {
  id: string;
  coilNumber: string;
  material: CoilMaterial;
  colorName: string;
  colorHex: string;
  thicknessMm: number;
  slitWidthMm: number;
  totalLinearMetres: number;
  allocatedLinearMetres: number;
  weightKg: number;
  locationBay: string;
  supplier: string;
  batchDate: string;
  minThresholdMetres: number;
}

export interface AccessoryStock {
  id: string;
  name: string;
  category: 'Clips & Fixings' | 'Underlay & Membranes' | 'Flashings' | 'Fasteners' | 'Gutters & Downpipes';
  unit: string;
  quantityOnHand: number;
  minStockLevel: number;
  unitCostNZD: number;
  specification: string;
}

// ----------------------------------------------------
// DYNAMIC PRICING SUITE & CATALOGUE MODELS
// ----------------------------------------------------

export type FlashingGirthTier = 
  | '0-150mm' 
  | '151-300mm' 
  | '301-450mm' 
  | '451-600mm' 
  | '601-900mm' 
  | '901-1200mm';

export type FlashingType = 
  | 'Ridge Cap Vent' 
  | 'Barge Flashing / Roll' 
  | 'Valley Gutter' 
  | 'Apron / Abutment Flashing' 
  | 'Parapet Capping' 
  | 'Drip Edge / Eaves Starter' 
  | 'Window Head / Jamb Flashing' 
  | 'Custom Internal Box Gutter' 
  | 'Chimney / Penetration Saddle';

export type AccessDifficulty = 'Single Storey Easy' | 'Two Storey Standard' | 'Three Storey / Cliffside / Complex';

// 1. Roll-formed & Folded Roof / Wall Cladding Zones
export interface ScopeZoneItem {
  id: string;
  title: string; // e.g. "Main Gable Roof Pitch", "North Facade Cladding"
  application: 'Roofing' | 'Wall Cladding';
  profile: RoofingProfile;
  material: CoilMaterial;
  colorName: string;
  areaM2: number;
  trayPanWidthMm: number; // e.g. 300, 450, 510
  calculatedLinearMetres: number; // areaM2 / (trayPanWidthMm / 1000)
  ratePerLm: number; // priced per linear metre
  totalNZD: number;
  pitchDegrees: number;
  notes?: string;
}

// 2. Flashings Line Items by Girth Tiers (priced per lm)
export interface FlashingLineItem {
  id: string;
  name: string; // e.g. "North Ridge Vent Flashing"
  type: FlashingType;
  girthTier: FlashingGirthTier;
  material: CoilMaterial;
  lengthLm: number;
  foldsCount: number; // standard 3 folds included
  baseRatePerLm: number;
  extraFoldRatePerLm: number;
  calculatedRatePerLm: number;
  manualRateOverride?: number; // optional custom $/lm override
  totalNZD: number;
  notes?: string;
}

// 3. Hardware, Fixings & Underlay Items
export interface HardwareLineItem {
  id: string;
  name: string;
  category: 'Clips & Fixings' | 'Underlay & Membranes' | 'Fasteners' | 'Gutters & Downpipes' | 'Consumables & Sundries';
  quantity: number;
  unit: string;
  unitCostNZD: number;
  sellRateNZD: number;
  totalNZD: number;
  supplier?: string;
  itemCode?: string;
  notes?: string;
}

// 4. Freight, Cartage & Logistics Items
export interface FreightLineItem {
  id: string;
  description: string; // e.g. "The Roofing Store HIAB Crane Delivery - Auckland Metro"
  carrier: string; // e.g. "The Roofing Store Logistics", "Mainfreight", "Specialist Hiab Transport"
  unit: string; // "trip", "load", "pallet", "tonne", "lump sum"
  quantity: number;
  costNZD: number;
  sellRateNZD: number;
  totalNZD: number;
  notes?: string;
}

// 5. Labour Pricing Matrix Calculation
export interface LabourMatrixCalculation {
  id: string;
  title: string;
  application: 'Roofing' | 'Wall Cladding';
  profile: RoofingProfile;
  basis: 'm2' | 'lm' | 'hours' | 'lump_sum';
  quantity: number;
  baseRate: number;
  pitchMultiplier: number;
  accessMultiplier: number;
  windMultiplier: number;
  effectiveRate: number;
  totalNZD: number;
}

// Pricing Catalogue Master Definitions
export interface ProfileMaterialPrice {
  id: string;
  profile: RoofingProfile;
  material: CoilMaterial;
  pricePerLm: number; // wholesale / base roll-formed price per linear metre
  defaultPanWidthMm: number;
}

export interface FlashingGirthMatrixItem {
  id: string;
  girthTier: FlashingGirthTier;
  material: CoilMaterial;
  pricePerLm: number; // base folded price per linear metre for 3 standard folds
  extraFoldCostPerLm: number; // per fold over 3
}

export interface LabourMatrixRule {
  id: string;
  profile: RoofingProfile;
  application: 'Roofing' | 'Wall Cladding';
  baseRatePerM2: number;
  baseRatePerLm: number;
  pitchFactors: {
    lowPitch3to10: number; // e.g. 1.0
    standardPitch11to25: number; // e.g. 1.05
    steepPitch26to35: number; // e.g. 1.25
    extremePitchOver35: number; // e.g. 1.50
    verticalCladding: number; // e.g. 1.35
  };
  accessFactors: {
    singleStorey: number; // 1.0
    twoStorey: number; // 1.15
    threeStoreyOrCliff: number; // 1.35
  };
}

export interface HardwareCatalogueItem {
  id: string;
  name: string;
  category: 'Clips & Fixings' | 'Underlay & Membranes' | 'Fasteners' | 'Gutters & Downpipes' | 'Consumables & Sundries';
  unit: string;
  defaultCostNZD: number;
  defaultSellRateNZD: number;
  specification: string;
}

export type PriceBookCategory = 
  | 'Roll-Formed Profiles'
  | 'Folded Flashings'
  | 'Clips & Fixings'
  | 'Underlay & Membranes'
  | 'Fasteners'
  | 'Gutters & Downpipes'
  | 'Consumables & Sundries'
  | 'Freight & Cartage'
  | 'Labour & Compliance';

export interface PriceBookItem {
  id: string;
  itemCode: string;
  name: string;
  category: PriceBookCategory;
  supplier: string; // "The Roofing Store", "Kiwi Steel", "Archtech Workshop", "Thermakraft", etc.
  unit: string;
  costPriceNZD: number;
  defaultMarkupPercent: number;
  sellPriceNZD: number;
  profile?: RoofingProfile;
  material?: CoilMaterial;
  girthTier?: FlashingGirthTier;
  specification?: string;
  isCustom?: boolean;
}

export interface MasterPricingCatalogue {
  profileMaterialPrices: ProfileMaterialPrice[];
  flashingGirthMatrix: FlashingGirthMatrixItem[];
  labourMatrixRules: LabourMatrixRule[];
  hardwareCatalogue: HardwareCatalogueItem[];
  priceBook: PriceBookItem[];
}

export interface QuoteUpgradeOption {
  id: string;
  title: string;
  description: string;
  additionalCostNZD: number;
  selected: boolean;
}

export interface QuoteLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  rateNZD: number;
  totalNZD: number;
}

export interface QuoteCategoryMarkups {
  materials: number; // e.g. 15%
  flashings: number; // e.g. 15%
  hardware: number;  // e.g. 20%
  freight: number;   // e.g. 10%
  labour: number;    // e.g. 25%
}

export interface SpreadsheetRow {
  id: string;
  sectionId: string;
  itemCode?: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  wastagePercent: number;
  unitCostNZD: number;
  markupPercent: number;
  unitSellNZD: number;
  totalNZD: number;
  formula?: string;
  notes?: string;
  supplier?: string;
  isOptionalUpgrade?: boolean;
}

export interface SpreadsheetSection {
  id: string;
  title: string;
  colorTag: string;
  collapsed?: boolean;
}

export interface OneDriveFolderMapping {
  category: 'Quotes' | 'Drawings' | 'SitePhotos' | 'Compliance' | 'SupplierOrders';
  title: string;
  folderPattern: string;
  autoSync: boolean;
  syncedFilesCount: number;
  lastSyncedAt?: string;
}

export interface OneDriveFileItem {
  id: string;
  fileName: string;
  folderPath: string;
  category: string;
  fileSizeBytes: number;
  extension: 'xlsx' | 'pdf' | 'csv' | 'dwg' | 'jpg';
  uploadedAt: string;
  webUrl: string;
  status: 'synced' | 'pending' | 'uploading';
}

export interface OneDriveConfig {
  connected: boolean;
  accountEmail?: string;
  tenantName?: string;
  rootFolderPath: string;
  autoSyncOnQuoteSave: boolean;
  mappings: OneDriveFolderMapping[];
  recentFiles: OneDriveFileItem[];
  lastSyncTimestamp?: string;
}

export type QuoteStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'viewed_by_client' 
  | 'expired' 
  | 'accepted' 
  | 'declined' 
  | 'superseded' 
  | 'cancelled';

export interface QuoteAuditEntry {
  id: string;
  timestamp: string;
  action: 
    | 'created' 
    | 'sent' 
    | 'viewed' 
    | 'accepted' 
    | 'declined' 
    | 'expired' 
    | 'superseded' 
    | 'recalculated_matrix' 
    | 'material_switched' 
    | 'manual_override' 
    | 'amendment_requested' 
    | 'pricing_requested';
  actor: string;
  actorType: 'staff' | 'client' | 'system';
  details: string;
  versionNumber: number;
  ipAddress?: string;
}

export interface Quote {
  id: string;
  projectId?: string;
  quoteNumber: string;
  baseQuoteNumber?: string; // e.g. "Q-1049"
  version?: number; // 1, 2, 3...
  versionLabel?: string; // e.g. "v1.0 Initial", "v2.0 MagnaFlow Spec"
  revision?: string; // e.g. "Rev A", "Rev B", "Rev C (Final)"
  
  // Immutability & Status
  status: QuoteStatus;
  isLocked?: boolean; // True once accepted or superseded (cannot be edited silently)
  issueDate?: string;
  validUntil?: string; // 30-day validity from issueDate
  clientToken?: string; // Secure unique link token
  
  // Versioning linkage
  supersededById?: string;
  supersedesId?: string;
  supersededReason?: string;
  supersededAt?: string;

  // Acceptance & Audit
  acceptedBy?: {
    name: string;
    email: string;
    timestamp: string;
    ipAddress?: string;
    notes?: string;
    signatureUrl?: string;
  };
  declinedReason?: string;
  clientAmendmentRequest?: {
    requestedAt: string;
    message: string;
    type: 'pricing' | 'amendment';
  };
  auditTrail?: QuoteAuditEntry[];

  clientName: string;
  clientEmail: string;
  clientPhone: string;
  architect: string;
  siteAddress: string;
  region: string;
  windZone: WindZone;
  exposureZone: ExposureZone;
  accessDifficulty: AccessDifficulty;
  
  // Dynamic scope sections
  scopeZones: ScopeZoneItem[];
  flashings: FlashingLineItem[];
  hardwareItems: HardwareLineItem[];
  freightItems: FreightLineItem[];
  labourItems: LabourMatrixCalculation[];
  upgrades: QuoteUpgradeOption[];

  // Excel-grade spreadsheet grid rows & sections
  spreadsheetSections?: SpreadsheetSection[];
  spreadsheetRows?: SpreadsheetRow[];
  oneDriveSyncStatus?: 'synced' | 'pending' | 'not_synced';
  oneDriveFolderUrl?: string;

  // Fallbacks & compatibility line items
  items?: QuoteLineItem[];
  roofAreaM2: number;
  profile: RoofingProfile;
  material: CoilMaterial;
  colorName: string;

  // Commercial totals & Markup
  materialCostNZD?: number;
  materialTotalNZD: number;
  
  flashingsCostNZD?: number;
  flashingsTotalNZD: number;
  
  hardwareCostNZD?: number;
  hardwareTotalNZD: number;
  
  freightCostNZD?: number;
  freightTotalNZD: number;
  
  labourCostNZD?: number;
  labourTotalNZD: number;

  costTotalNZD?: number; // wholesale cost
  markupAmountNZD?: number;
  markupPercent: number; // e.g. 15%
  marginPercent: number; // gross margin % (e.g. 13%)
  markupMode?: 'overall' | 'category';
  categoryMarkups?: QuoteCategoryMarkups;

  subtotalNZD: number;
  gstNZD: number;
  totalNZD: number;

  createdAt: string;
  expiresAt: string;
  clientSignature?: string;
  signedAt?: string;
  notes?: string;
}

export interface EmailAutomationRule {
  id: string;
  title: string;
  triggerEvent: 
    | 'quote_sent_48h'
    | 'quote_expiring_7d'
    | 'site_measure_completed'
    | 'milestone_substrate_ready'
    | 'project_qa_completed';
  subjectTemplate: string;
  bodyTemplate: string;
  enabled: boolean;
  delayHours: number;
  sendCount: number;
}

export interface OutboxEmail {
  id: string;
  ruleTitle: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'delivered' | 'opened' | 'clicked';
}

export interface SiteVisitInspection {
  id: string;
  projectId: string;
  projectTitle: string;
  projectAddress?: string;
  siteAddress?: string;
  inspector?: string;
  inspectorName?: string;
  date: string;
  weatherCondition: string;
  windSpeedKmh?: number;
  plywoodMoisturePercent?: number;
  moisturePercent?: number;
  items?: JobChecklistItem[];
  checklist?: JobChecklistItem[] | {
    substrateFlatness: boolean;
    plyMoistureCompliant: boolean;
    minimumFallVerified: boolean;
    underlayTensionAndLaps: boolean;
    expansionClipsCorrectlySpaced: boolean;
    penetrationUpstandsCompliant: boolean;
    fallProtectionCertified: boolean;
  };
  passed?: boolean;
  notes: string;
  punchList?: string[];
  punchListItems?: string[];
  photos?: any[];
  signoffSignature?: string;
}

// ----------------------------------------------------
// UNIVERSAL ON-SITE FIELD HUB & AUTHORITY MODELS
// ----------------------------------------------------

export type AccessLayer = 'light' | 'standard' | 'full' | 'office';

export type TeamRole = 
  | 'Managing Director (LBP)' 
  | 'Site Foreman' 
  | 'Machine / Rollforming Lead' 
  | 'Installer / Tradesman' 
  | 'Apprentice' 
  | 'Project Coordinator';

export interface FieldAuthority {
  canSignPS3: boolean;
  canApproveMilestones: boolean;
  canOrderMaterials: boolean;
  canConductSiteMeetings: boolean;
  canLogMeasures: boolean;
  canManageSnagging: boolean;
  canEditAuthorities: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  accessLayer?: AccessLayer;
  lbpNumber?: string;
  phone: string;
  email: string;
  authority: FieldAuthority;
  activeOnSite?: boolean;
}

export interface SiteMeetingRecord {
  id: string;
  projectId: string;
  date: string;
  time: string;
  attendees: {
    architect?: string;
    builder?: string;
    client?: string;
    archtechLead: string;
    others?: string;
  };
  meetingType: 'Pre-Start Coordination' | 'Architectural Detail Review' | 'Progress & Snag Walk' | 'Council Inspection Alignment';
  notes: string;
  actionItems: {
    id: string;
    action: string;
    assignedTo: string;
    dueDate: string;
    completed: boolean;
  }[];
  signedOffBy?: string;
}

export interface SiteMeasureLineItem {
  id: string;
  name?: string; // e.g. "North Ridge Line", "Barge Rake Left", "Chimney Apron Upstand"
  title?: string;
  code?: string;
  reference?: string;
  category: 'Ridge' | 'Barge' | 'Eaves' | 'Valley' | 'Apron' | 'Parapet' | 'Penetration' | 'Wall Cladding' | 'Cladding' | 'Custom' | 'Tray';
  lengthMm?: number;
  measuredLengthMm?: number;
  planLengthMm?: number;
  pitchDegrees?: number;
  slopeLengthMm?: number; // Calculated true slope length if pitch is applied
  count?: number;
  girthTier?: FlashingGirthTier;
  profileId?: string;
  method?: 'tape_manual' | 'laser_edm' | 'calibrated_drawing' | 'calculated' | 'estimate' | 'laser' | 'tape' | 'plan';
  linkedFlashingProfileId?: string;
  linkedFlashingPresetId?: string;
  notes?: string;
  photoUrl?: string;
}

export interface SubstrateChecklist {
  plywoodThicknessMm?: number; // e.g. 17mm or 19mm CD structural
  substrateType?: string;
  moistureContentPercent?: number; // NZBC standard requires <18%
  timberMoisturePercent?: number;
  isCompliantMoisture?: boolean;
  moistureCompliant?: boolean;
  expansionGapsChecked?: boolean; // 2mm to 3mm expansion joints
  fastenerFlushChecked?: boolean; // Screws countersunk flush
  cavityBattensChecked?: boolean;
  ventilationCavityChecked?: boolean;
  underlayType?: string;
  underlayLapsTaped?: boolean;
  underlayTapedLapsChecked?: boolean;
  plyThicknessOk?: boolean;
  purlinSpacingOk?: boolean;
  fallVerified?: boolean;
  underlayClearanceOk?: boolean;
  antiPondingBoardsOk?: boolean;
  notes?: string;
}

export interface SiteMeasureRecord {
  id: string;
  projectId: string;
  surveyNumber?: string;
  measuredBy?: string;
  surveyor?: string;
  surveyorName?: string;
  date: string;
  dateSurveyed?: string;
  status?: 'draft' | 'reviewed' | 'approved';
  ridgeLengthLm?: number;
  eavesLengthLm?: number;
  bargeLengthLm?: number;
  valleyLengthLm?: number;
  roofPitchDegrees?: number;
  pitchDeg?: number;
  substrateType?: string;
  moistureContentPercent?: number;
  signedOff?: boolean;
  notes?: string;
  panTrayCount?: number;
  longestTrayLm?: number;
  laserScanCompleted?: boolean;
  substrateMoisturePercent?: number;
  flashingGirthNotes?: string;
  customNotes?: string;
  lineItems?: SiteMeasureLineItem[];
  substrateChecklist?: SubstrateChecklist;
  weatherConditions?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SnaggingItem {
  id: string;
  projectId: string;
  title: string;
  location: string;
  severity: 'Critical (Water Ingress Risk)' | 'Moderate (Aesthetic / Flashing)' | 'Minor (Clean / Scuff)';
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  photoUrl?: string;
  status: 'Open' | 'In Progress' | 'Resolved & Verified';
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface OnsiteMaterialOrder {
  id: string;
  orderNumber: string;
  projectId: string;
  projectNumber: string;
  orderedBy: string;
  supplier: 'The Roofing Store (Albany)' | 'The Roofing Store (East Tamaki)' | 'The Roofing Store (Highbrook)' | 'The Roofing Store (Hamilton)';
  orderDate: string;
  urgency: 'Standard Delivery' | 'Urgent Same-Day HIAB' | 'Foreman Branch Collection';
  items: {
    id: string;
    itemDescription: string;
    category: string;
    quantity: number;
    unit: string;
    urgencyReason?: string;
  }[];
  deliverySiteAddress: string;
  status: 'Draft' | 'Sent to The Roofing Store' | 'Dispatched / In Transit' | 'Received On Site';
  deliveryEta?: string;
  trspoReference?: string;
}

export interface SiteScheduleEvent {
  id: string;
  projectId: string;
  title: string;
  date: string;
  type: 'Scaffold Inspection' | 'HIAB Crane Delivery' | 'Rollforming Start' | 'Underlay Dry-In' | 'Council Inspection' | 'PS3 Handover';
  crewAssigned: string[];
  notes?: string;
}


// ----------------------------------------------------
// ONSITE COMMUNICATION LAYER + FLASHING MARKUP
// ----------------------------------------------------

export interface SiteTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'open' | 'done';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  priority?: 'normal' | 'high';
}

export type FlashingSegmentKind = 'leg' | 'open_hem' | 'closed_hem' | 'crush_fold' | 'drip' | 'return' | 'hem' | 'safety_fold';
export type PaintSide = 'left' | 'right' | 'outside' | 'inside';

export interface FlashingSegment {
  id: string;
  lengthMm: number;
  angleDeg: number; // interior bend angle after this segment (0 = straight continuation)
  /** Signed turn direction for reconstructing the drawn outline; omitted on legacy profiles. */
  turnDirection?: -1 | 1;
  kind: FlashingSegmentKind;
  hemGapMm?: number;
}

export interface FlashingProfile {
  id: string;
  name: string;
  segments: FlashingSegment[];
  /** Exact drawn outline in millimetres relative to the first point (Y positive upward). */
  geometryPointsMm?: { x: number; y: number }[];
  /** Direction of the first drawn leg in degrees; fallback for legacy profiles without geometryPointsMm. */
  startHeadingDeg?: number;
  material?: string;
  thicknessMm?: number;
  insideRadiusMm?: number;
  kFactor?: number;
  colorName?: string;
  /** Which face of the sheet is painted / finished when looking along the drawn path */
  paintSide?: PaintSide;
  notes?: string;
  isTemplate?: boolean;
  category?: string;
  developedLengthMm?: number;
  developedBlankWidthMm?: number;
  totalBendDeductionMm?: number;
  girthTier?: FlashingGirthTier;
  recommendedSlitWidthMm?: number;
  totalRunLm?: number;
  pieceLengthLm?: number;
  pieceCount?: number;
  status?: 'draft' | 'approved' | 'in_production';
  linkedProjectId?: string;
  linkedMarkupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashingPin {
  id: string;
  projectId: string;
  planId?: string; // ArchitecturalPlan id
  profileId: string;
  profileName?: string;
  label: string;
  lengthLm: number;
  quantity: number;
  xPercent: number; // 0–100 position on plan
  yPercent: number;
  girthTier?: FlashingGirthTier;
  material?: string;
  colorName?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface PlanMarkupAnnotation {
  id: string;
  planId: string;
  projectId: string;
  type: 'dimension' | 'arrow' | 'text' | 'cloud' | 'freehand' | 'pin';
  payload: Record<string, unknown>;
  calibratedLengthMm?: number;
  calibratedAreaM2?: number;
  pitchDegrees?: number;
  linkedFlashingPinId?: string;
  category?: string;
  isLocked?: boolean;
  createdAt: string;
  createdBy: string;
}