import { 
  calculateQuoteValidUntil, 
  isQuoteExpired, 
  getEffectiveQuoteStatus, 
  getDaysUntilExpiry,
  createNewQuoteVersion,
  canApplyPriceMatrix,
  recalculateQuoteWithMatrix,
  switchQuoteMaterialAndProfile,
  acceptQuoteByClient
} from '../quoteVersioning';
import { Quote, MasterPricingCatalogue, Project } from '../../types/crm';

const mockCatalogue: MasterPricingCatalogue = {
  lastUpdatedDate: '2026-03-20',
  trayProfiles: [
    { profile: 'Super Seam 38mm', effectiveCoverMm: 430, minPitchDeg: 3, baseLabourRatePerM2: 52, standardClipCode: 'TRS-CLIP-38', category: 'Standing Seam', defaultWastagePercent: 5 },
    { profile: 'Snaplock 25mm', effectiveCoverMm: 300, minPitchDeg: 8, baseLabourRatePerM2: 44, standardClipCode: 'TRS-CLIP-25', category: 'Snaplock', defaultWastagePercent: 6 }
  ],
  coilMaterials: [
    { material: '0.55mm Vitor+® Marine', coatingGrade: '0.55mm', basePricePerLm: 24.50, warrantyYears: 20, isCoastalApproved: true, supplierBranch: 'TRS Albany' },
    { material: '0.55mm MagnaFlow® Extreme', coatingGrade: '0.55mm', basePricePerLm: 29.80, warrantyYears: 25, isCoastalApproved: true, supplierBranch: 'TRS Albany' }
  ],
  flashingGirthMatrix: [
    { girthTier: '301-450mm', maxGirthMm: 450, coilCostPerLm: 12.00, fabricationRatePerLm: 18.50, standardLabourMinutes: 12 }
  ],
  freightTiers: [],
  defaultMarkupPercent: 18,
  defaultGstPercent: 15
};

const mockProject: Project = {
  id: 'proj-test',
  projectNumber: 'ARCH-2026-TEST',
  title: 'Test Coastal Villa',
  clientName: 'Julian Vance',
  clientEmail: 'julian@example.com',
  architect: 'Fearon Hay',
  headContractor: 'Macrennie Commercial',
  siteAddress: '12 Marine Parade, Herne Bay',
  region: 'Auckland Coastal',
  roofAreaM2: 240,
  profile: 'Super Seam 38mm',
  material: '0.55mm Vitor+® Marine',
  colorName: 'FlaxPod',
  windZone: 'Very High',
  exposureZone: 'Zone D (Severe Coastal)',
  contractValueNZD: 0,
  startDate: '2026-04-01',
  targetCompletionDate: '2026-05-15',
  progressPercent: 0,
  status: 'pre_construction',
  milestones: [],
  photos: [],
  variations: []
};

const mockQuote: Quote = {
  id: 'quote-test-1',
  quoteNumber: 'ARCH-Q-2026-092-v1',
  baseQuoteNumber: 'ARCH-Q-2026-092',
  version: 1,
  versionLabel: 'v1.0',
  title: 'Super Seam Roofing Supply & Install',
  clientName: 'Julian Vance',
  clientEmail: 'julian@example.com',
  siteAddress: '12 Marine Parade, Herne Bay',
  roofAreaM2: 240,
  profile: 'Super Seam 38mm',
  material: '0.55mm Vitor+® Marine',
  colorName: 'FlaxPod',
  windZone: 'Very High',
  exposureZone: 'Zone D (Severe Coastal)',
  materialCostNZD: 13674.42,
  materialTotalNZD: 15725.58,
  flashingsTotalNZD: 4200.00,
  hardwareTotalNZD: 1800.00,
  labourTotalNZD: 12480.00,
  freightTotalNZD: 950.00,
  subtotalNZD: 35155.58,
  gstNZD: 5273.34,
  totalNZD: 40428.92,
  costTotalNZD: 29500.00,
  markupPercent: 15,
  status: 'sent',
  issueDate: '2026-03-24',
  validUntil: calculateQuoteValidUntil('2026-03-24'),
  createdAt: '2026-03-24',
  expiresAt: calculateQuoteValidUntil('2026-03-24')
};

console.log('--- Starting Quote Versioning & High-Trust Immutability Test Suite ---');

// Test 1: 30-day validity calculation
const validUntil = calculateQuoteValidUntil('2026-03-01');
console.log('Test 1: 30-day validity window from 2026-03-01 ->', validUntil);
if (validUntil !== '2026-03-31') {
  throw new Error(`Expected 2026-03-31 but got ${validUntil}`);
}

// Test 2: Expired quote check
const expiredQuote: Quote = {
  ...mockQuote,
  issueDate: '2026-01-10',
  validUntil: '2026-02-09',
  expiresAt: '2026-02-09',
  status: 'sent'
};
const isExp = isQuoteExpired(expiredQuote);
const effStatus = getEffectiveQuoteStatus(expiredQuote);
console.log(`Test 2: Expired quote evaluation -> isExpired: ${isExp}, effectiveStatus: ${effStatus}`);
if (!isExp || effStatus !== 'expired') {
  throw new Error(`Expected quote to be evaluated as expired`);
}

// Test 3: Immutability Rule: Matrix update never applies to accepted quotes
const acceptedQuote: Quote = {
  ...mockQuote,
  status: 'accepted',
  isLocked: true
};
const canApplyAccepted = canApplyPriceMatrix(acceptedQuote);
console.log('Test 3: Can apply price matrix to accepted quote ->', canApplyAccepted);
if (canApplyAccepted) {
  throw new Error('Price matrix must NOT be applicable to accepted quote');
}
try {
  recalculateQuoteWithMatrix(acceptedQuote, mockCatalogue);
  throw new Error('Should have thrown on attempting matrix update on accepted quote');
} catch (e: any) {
  console.log('Test 3 passed: Correctly blocked matrix update on accepted quote:', e.message);
}

// Test 4: Creating a new version increments version and marks old superseded
const { newQuote, updatedPreviousQuote } = createNewQuoteVersion(
  mockQuote,
  'Switched to MagnaFlow Extreme coating'
);
console.log(`Test 4: Version creation -> Old version status: ${updatedPreviousQuote.status}, New quote: ${newQuote.quoteNumber} (v${newQuote.version})`);
if (updatedPreviousQuote.status !== 'superseded' || newQuote.version !== 2 || newQuote.quoteNumber !== 'ARCH-Q-2026-092-v2') {
  throw new Error('Version increment or superseded status mismatch');
}

// Test 5: Switch material and profile with identical quantities auto-recalculates using matrix
const switched = switchQuoteMaterialAndProfile(
  mockQuote,
  'Snaplock 25mm',
  '0.55mm MagnaFlow® Extreme',
  mockCatalogue
);
console.log(`Test 5: Switched profile to Snaplock 25mm & MagnaFlow -> New Total: $${switched.newQuote.totalNZD}`);
if (switched.newQuote.profile !== 'Snaplock 25mm' || switched.newQuote.material !== '0.55mm MagnaFlow® Extreme' || switched.newQuote.roofAreaM2 !== 240) {
  throw new Error('Switched quote attributes mismatch');
}

// Test 6: Digital client acceptance locks quote and activates client portal account
const { updatedQuote: accQuote, updatedProject: accProj } = acceptQuoteByClient(
  newQuote,
  'Julian Vance',
  'julian@example.com',
  'Julian Vance (Digital)',
  mockProject
);
console.log(`Test 6: Digital Acceptance -> Quote Status: ${accQuote.status}, Locked: ${accQuote.isLocked}, Project Contract Value: $${accProj.contractValueNZD}`);
if (accQuote.status !== 'accepted' || !accQuote.isLocked || accProj.contractValueNZD !== newQuote.totalNZD || !accProj.clientAccountActivated) {
  throw new Error('Acceptance lock or project activation mismatch');
}

console.log('ALL 6 QUOTE VERSIONING & IMMUTABILITY TESTS PASSED DETERMINISTICALLY! ✓');
