import { Quote, QuoteStatus, QuoteAuditEntry, MasterPricingCatalogue, RoofingProfile, CoilMaterial } from '../types/crm';

/**
 * Calculates date 30 days in the future from issueDate (ISO YYYY-MM-DD)
 */
export function calculateQuoteValidUntil(issueDateStr?: string): string {
  const base = issueDateStr ? new Date(issueDateStr) : new Date();
  const valid = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  return valid.toISOString().split('T')[0];
}

/**
 * Checks if an open quote has surpassed its 30-day validity window
 */
export function isQuoteExpired(quote: Quote): boolean {
  // Accepted, declined, superseded, or cancelled quotes have definitive non-expired terminal states
  if (['accepted', 'superseded', 'cancelled', 'declined'].includes(quote.status)) {
    return false;
  }
  
  const expiryDate = quote.validUntil || quote.expiresAt;
  if (!expiryDate) return false;
  
  const expiryTime = new Date(expiryDate).getTime() + 24 * 60 * 60 * 1000 - 1; // End of expiry day
  return Date.now() > expiryTime;
}

/**
 * Returns effective status, automatically resolving open quotes past 30 days as 'expired'
 */
export function getEffectiveQuoteStatus(quote: Quote): QuoteStatus {
  if (['accepted', 'superseded', 'cancelled', 'declined'].includes(quote.status)) {
    return quote.status;
  }
  if (isQuoteExpired(quote)) {
    return 'expired';
  }
  if (quote.status === 'viewed_by_client') {
    return 'viewed';
  }
  return quote.status;
}

/**
 * Returns integer days remaining until expiry (positive if valid, negative if expired)
 */
export function getDaysUntilExpiry(quote: Quote): number {
  const expiryDate = quote.validUntil || quote.expiresAt;
  if (!expiryDate) return 30;
  const expiryTime = new Date(expiryDate).getTime();
  const diffMs = expiryTime - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generates unique secure client link token
 */
export function generateClientQuoteToken(quoteId: string, version: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `sec_${quoteId.replace(/[^a-zA-Z0-9]/g, '')}_v${version}_${randomSuffix}`;
}

/**
 * Immutability check: Price matrix updates apply ONLY to open quotes. NEVER to accepted quotes.
 */
export function canApplyPriceMatrix(quote: Quote): boolean {
  const eff = getEffectiveQuoteStatus(quote);
  return ['draft', 'sent', 'viewed', 'viewed_by_client', 'expired'].includes(eff) && !quote.isLocked;
}

/**
 * Creates a brand new immutable version of a quote (v+1) and marks previous version Superseded
 */
export function createNewQuoteVersion(
  previousQuote: Quote,
  reason: string,
  actor: string = 'Marcus Kuhtze (Staff)',
  changes?: Partial<Quote>
): { newQuote: Quote; updatedPreviousQuote: Quote } {
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];
  const currentVersion = previousQuote.version || 1;
  const nextVersion = currentVersion + 1;
  
  // Base quote number (strip any existing -v1, -v2 suffix)
  const baseNumber = previousQuote.baseQuoteNumber || previousQuote.quoteNumber.replace(/-v\d+.*$/, '');
  const newQuoteNumber = `${baseNumber}-v${nextVersion}`;
  const newQuoteId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const auditEntrySuper: QuoteAuditEntry = {
    id: `aud-${Date.now()}-sup`,
    timestamp: nowIso,
    action: 'superseded',
    actor,
    actorType: 'staff',
    details: `Superseded by Version ${nextVersion} (${newQuoteNumber}). Reason: ${reason}`,
    versionNumber: currentVersion
  };

  const updatedPreviousQuote: Quote = {
    ...previousQuote,
    status: 'superseded',
    isLocked: true,
    supersededById: newQuoteId,
    supersededAt: todayDate,
    supersededReason: reason,
    auditTrail: [auditEntrySuper, ...(previousQuote.auditTrail || [])]
  };

  const auditEntryCreated: QuoteAuditEntry = {
    id: `aud-${Date.now()}-crt`,
    timestamp: nowIso,
    action: 'created',
    actor,
    actorType: 'staff',
    details: `Version ${nextVersion} created from ${previousQuote.quoteNumber}. ${reason}`,
    versionNumber: nextVersion
  };

  const validUntil = calculateQuoteValidUntil(todayDate);

  const newQuote: Quote = {
    ...previousQuote,
    ...changes,
    id: newQuoteId,
    quoteNumber: newQuoteNumber,
    baseQuoteNumber: baseNumber,
    version: nextVersion,
    versionLabel: `v${nextVersion}.0`,
    revision: `Rev ${String.fromCharCode(64 + nextVersion)}`,
    status: 'sent',
    isLocked: false,
    issueDate: todayDate,
    validUntil,
    createdAt: todayDate,
    expiresAt: validUntil,
    clientToken: generateClientQuoteToken(newQuoteId, nextVersion),
    supersedesId: previousQuote.id,
    supersededById: undefined,
    supersededAt: undefined,
    supersededReason: undefined,
    clientSignature: undefined,
    signedAt: undefined,
    acceptedBy: undefined,
    declinedReason: undefined,
    clientAmendmentRequest: undefined,
    auditTrail: [auditEntryCreated, ...(previousQuote.auditTrail || [])]
  };

  return { newQuote, updatedPreviousQuote };
}

/**
 * Re-prices eligible open quote line items against current Master Matrix Pricing
 */
export function recalculateQuoteWithMatrix(
  quote: Quote,
  catalogue: MasterPricingCatalogue,
  actor: string = 'Staff (Price Matrix Engine)'
): { newQuote: Quote; updatedPreviousQuote?: Quote } {
  if (!canApplyPriceMatrix(quote)) {
    throw new Error('Price matrix updates can only be applied to open quotes (Sent, Viewed, Expired). Accepted quotes are legally locked.');
  }

  // Look up rates in catalogue
  const coilEntry = catalogue.coilMaterials.find(
    c => c.material === quote.material && c.coatingGrade === '0.55mm'
  ) || catalogue.coilMaterials[0];
  const coilBaseRate = coilEntry?.basePricePerLm || 24.50;

  const profileEntry = catalogue.trayProfiles.find(p => p.profile === quote.profile) || catalogue.trayProfiles[0];
  const panWidthMm = profileEntry?.effectiveCoverMm || 430;
  const linealFactor = 1000 / panWidthMm; // e.g. 2.325 lm per m2

  const updatedMaterialCost = Number((quote.roofAreaM2 * linealFactor * coilBaseRate).toFixed(2));
  const markupMult = 1 + (quote.markupPercent || 15) / 100;
  const updatedMaterialTotal = Number((updatedMaterialCost * markupMult).toFixed(2));

  // Recalculate flashings if present
  let flashingsTotal = quote.flashingsTotalNZD || 0;
  if (quote.flashings && quote.flashings.length > 0) {
    const recalculatedFlashings = quote.flashings.map(fl => {
      const girthTier = fl.girthTier || '301-450mm';
      const girthEntry = catalogue.flashingGirthMatrix.find(g => g.girthTier === girthTier);
      const unitRate = (girthEntry?.fabricationRatePerLm || 18.50) + (girthEntry?.coilCostPerLm || 12.00);
      const total = Number(((fl.quantityLm || 10) * unitRate * markupMult).toFixed(2));
      return { ...fl, unitSellNZD: Number((unitRate * markupMult).toFixed(2)), totalNZD: total };
    });
    flashingsTotal = recalculatedFlashings.reduce((sum, f) => sum + (f.totalNZD || 0), 0);
  }

  const subtotal = Number((updatedMaterialTotal + flashingsTotal + (quote.hardwareTotalNZD || 0) + (quote.labourTotalNZD || 0) + (quote.freightTotalNZD || 0)).toFixed(2));
  const gst = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));

  // If quote is already Sent/Viewed/Expired, create a new clean dated version (immutable history rule)
  if (quote.status !== 'draft') {
    return createNewQuoteVersion(
      quote,
      `Master Matrix Pricing refreshed (${catalogue.lastUpdatedDate || new Date().toISOString().slice(0, 10)} schedule). New total: $${total.toLocaleString('en-NZ', { minimumFractionDigits: 2 })} NZD`,
      actor,
      {
        materialCostNZD: updatedMaterialCost,
        materialTotalNZD: updatedMaterialTotal,
        flashingsTotalNZD: flashingsTotal,
        subtotalNZD: subtotal,
        gstNZD: gst,
        totalNZD: total
      }
    );
  }

  // If still in Draft, update in place with audit log
  const nowIso = new Date().toISOString();
  const auditEntry: QuoteAuditEntry = {
    id: `aud-${Date.now()}-matrix`,
    timestamp: nowIso,
    action: 'recalculated_matrix',
    actor,
    actorType: 'staff',
    details: `Updated unit rates from master price matrix (${catalogue.lastUpdatedDate}). Subtotal: $${subtotal}`,
    versionNumber: quote.version || 1
  };

  const newQuote: Quote = {
    ...quote,
    materialCostNZD: updatedMaterialCost,
    materialTotalNZD: updatedMaterialTotal,
    flashingsTotalNZD: flashingsTotal,
    subtotalNZD: subtotal,
    gstNZD: gst,
    totalNZD: total,
    auditTrail: [auditEntry, ...(quote.auditTrail || [])]
  };

  return { newQuote };
}

/**
 * Auto-recalculates a new version when switching profile or material while keeping exact quantities identical
 */
export function switchQuoteMaterialAndProfile(
  quote: Quote,
  targetProfile: RoofingProfile,
  targetMaterial: CoilMaterial,
  catalogue: MasterPricingCatalogue,
  targetColor: string = quote.colorName || 'FlaxPod',
  actor: string = 'Marcus Kuhtze (Staff)'
): { newQuote: Quote; updatedPreviousQuote: Quote } {
  const profileEntry = catalogue?.trayProfiles?.find(p => p.profile === targetProfile) || catalogue?.trayProfiles?.[0];
  const coilEntry = catalogue?.coilMaterials?.find(c => c.material === targetMaterial) || catalogue?.coilMaterials?.[0];
  
  const panWidthMm = profileEntry?.effectiveCoverMm || 430;
  const linealFactor = 1000 / panWidthMm;
  const coilRate = coilEntry?.basePricePerLm || 28.50;

  const markupMult = 1 + (quote.markupPercent || 15) / 100;
  const materialCost = Number((quote.roofAreaM2 * linealFactor * coilRate).toFixed(2));
  const materialTotal = Number((materialCost * markupMult).toFixed(2));

  const subtotal = Number((materialTotal + (quote.flashingsTotalNZD || 0) + (quote.hardwareTotalNZD || 0) + (quote.labourTotalNZD || 0) + (quote.freightTotalNZD || 0)).toFixed(2));
  const gst = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));

  const reason = `Specification updated to ${targetProfile} in ${targetMaterial} (${targetColor}). Quantities preserved (${quote.roofAreaM2} m²). Rates recalculated per matrix.`;

  return createNewQuoteVersion(quote, reason, actor, {
    profile: targetProfile,
    material: targetMaterial,
    colorName: targetColor,
    materialCostNZD: materialCost,
    materialTotalNZD: materialTotal,
    subtotalNZD: subtotal,
    gstNZD: gst,
    totalNZD: total
  });
}

/**
 * Handles client acceptance of a quote, locking it and producing an audit entry
 */
export function acceptQuoteByClient(
  quote: Quote,
  clientName: string,
  clientEmail: string,
  notes?: string,
  project?: Project
): { updatedQuote: Quote; updatedProject: Project } {
  if (isQuoteExpired(quote)) {
    throw new Error('Quote has passed its 30-day validity window and is expired. Please request current pricing.');
  }

  const nowIso = new Date().toISOString();
  const auditEntry: QuoteAuditEntry = {
    id: `aud-${Date.now()}-acc`,
    timestamp: nowIso,
    action: 'accepted',
    actor: `${clientName} (Client)`,
    actorType: 'client',
    details: `Quote ${quote.quoteNumber} (Version ${quote.version || 1}) digitally accepted for $${quote.totalNZD.toLocaleString('en-NZ', { minimumFractionDigits: 2 })} NZD. Quote locked.`,
    versionNumber: quote.version || 1,
    ipAddress: '122.56.214.89 (Auckland, NZ)'
  };

  const updatedQuote: Quote = {
    ...quote,
    status: 'accepted',
    isLocked: true,
    clientSignature: clientName,
    signedAt: nowIso.split('T')[0],
    acceptedBy: {
      name: clientName,
      email: clientEmail,
      timestamp: nowIso,
      ipAddress: '122.56.214.89 (Client Verified Session)',
      notes
    },
    auditTrail: [auditEntry, ...(quote.auditTrail || [])]
  };

  const updatedProject: Project = project ? {
    ...project,
    contractValueNZD: quote.totalNZD,
    currentAcceptedQuoteId: quote.id,
    clientAccountActivated: true
  } : ({
    id: quote.projectId || 'proj-auto',
    projectNumber: 'ARCH-PROJ-AUTO',
    title: quote.title,
    clientName: clientName,
    clientEmail: clientEmail,
    architect: quote.architect || 'Archtech Architectural Studio',
    headContractor: 'Macrennie Commercial',
    siteAddress: quote.siteAddress || 'Site Address',
    region: 'Auckland',
    roofAreaM2: quote.roofAreaM2,
    profile: quote.profile,
    material: quote.material,
    colorName: quote.colorName,
    windZone: quote.windZone,
    exposureZone: quote.exposureZone,
    contractValueNZD: quote.totalNZD,
    startDate: nowIso.split('T')[0],
    targetCompletionDate: calculateQuoteValidUntil(nowIso.split('T')[0]),
    progressPercent: 5,
    status: 'pre_construction',
    milestones: [],
    photos: [],
    variations: [],
    clientAccountActivated: true,
    currentAcceptedQuoteId: quote.id
  } as Project);

  return { updatedQuote, updatedProject };
}
