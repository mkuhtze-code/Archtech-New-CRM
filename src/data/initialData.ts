import { 
  Lead, 
  Project, 
  CoilStock, 
  AccessoryStock, 
  Quote, 
  EmailAutomationRule, 
  OutboxEmail,
  SiteVisitInspection,
  TeamMember,
  PlanMarkupAnnotation,
  FlashingPin
} from '../types/crm';
import { SAMPLE_PROJECT_PLANS } from './sampleArchitecturalPlans';

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    clientName: 'Julian & Sarah Vance',
    companyOrArchitect: 'Fearon Hay Architects',
    email: 'julian.vance@nzvance.co.nz',
    phone: '+64 21 892 4110',
    projectAddress: '88 Matakana Valley Road, Matakana Coast',
    region: 'Auckland / Matakana',
    roofAreaM2: 365,
    pitchDegrees: 4,
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    profilePreferred: 'Archtech Super Seam 38mm',
    materialPreferred: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    estimatedValueNZD: 94500,
    stage: 'quote_sent',
    createdAt: '2026-10-02',
    nextFollowUpDate: '2026-10-16',
    notes: [
      'Architect requested Archtech Super Seam 38mm with 50mm folded barge drip details to conceal gutters.',
      'Wind exposure is Extra High due to ridge topography. Specified 400mm tray centers.',
      'Raw coil supply confirmed with The Roofing Store (Albany branch). Sent interactive quote v2 with 25-year Kiwicolour warranty.'
    ]
  },
  {
    id: 'lead-2',
    clientName: 'Hamish & Claire Macfarlane',
    companyOrArchitect: 'Warren and Mahoney',
    email: 'hmacfarlane@alpineholdings.co.nz',
    phone: '+64 27 449 2033',
    projectAddress: '14 Buchanan Rise, Roys Peninsula, Wanaka',
    region: 'Wanaka / Central Otago',
    roofAreaM2: 440,
    pitchDegrees: 7,
    windZone: 'Very High',
    exposureZone: 'Zone B (Inland)',
    profilePreferred: 'Archtech Double Angle Seam',
    materialPreferred: 'Kiwicolour® Zenex+ Extreme Coastal',
    estimatedValueNZD: 156000,
    stage: 'site_measure',
    createdAt: '2026-10-08',
    nextFollowUpDate: '2026-10-15',
    notes: [
      'Sub-zero alpine snow load zone. Archtech Double Angle Seam mechanical fold specified.',
      'Site measure booked with Archtech tablet LiDAR scan for Thursday morning.',
      'Client selected Kiwicolour Zenex+ with TRS stainless sliding expansion clips for thermal travel.'
    ]
  },
  {
    id: 'lead-3',
    clientName: 'Dr. Alistair & Mei Croft',
    companyOrArchitect: 'Cheshire Architects',
    email: 'croft.omaha@gmail.com',
    phone: '+64 21 553 9081',
    projectAddress: '42 Mangatawhiri Spit, Omaha Beach',
    region: 'Omaha / Northland',
    roofAreaM2: 290,
    pitchDegrees: 5,
    windZone: 'High',
    exposureZone: 'Zone D (Severe Marine)',
    profilePreferred: 'Archtech Super Seam 38mm',
    materialPreferred: 'The Roofing Store MagnaFlow®',
    estimatedValueNZD: 82000,
    stage: 'contract_signed',
    createdAt: '2026-09-24',
    nextFollowUpDate: '2026-10-18',
    notes: [
      'Severe salt spray marine environment within 80m of Omaha high tide line.',
      'Specified The Roofing Store MagnaFlow alloy coil in Slate Grey finish.',
      'Contract signed with Archtech; roll-forming scheduled at Archtech workshop for late October.'
    ]
  },
  {
    id: 'lead-4',
    clientName: 'Kereru Estate Winery',
    companyOrArchitect: 'Patterson Associates',
    email: 'projects@kereru-estate.nz',
    phone: '+64 27 884 1209',
    projectAddress: '215 Gimblett Gravels Way, Hawke’s Bay',
    region: 'Hawke’s Bay',
    roofAreaM2: 520,
    pitchDegrees: 12,
    windZone: 'Medium',
    exposureZone: 'Zone C (Medium)',
    profilePreferred: 'TRS Corrugate / Plumbdeck 0.55',
    materialPreferred: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    estimatedValueNZD: 78500,
    stage: 'quoting',
    createdAt: '2026-10-11',
    nextFollowUpDate: '2026-10-17',
    notes: [
      'Cellar door and barrel hall pavilion with deep architectural verandas.',
      'Client wants Kiwicolour FlaxPod with Archtech custom internal downpipe sumps.'
    ]
  },
  {
    id: 'lead-5',
    clientName: 'Callum & Fiona Reid',
    companyOrArchitect: 'Box Build Architects',
    email: 'callum.reid@reiddesign.co.nz',
    phone: '+64 21 330 9821',
    projectAddress: '19 Clifton Road, Takapuna, Auckland',
    region: 'Auckland North Shore',
    roofAreaM2: 210,
    pitchDegrees: 3,
    windZone: 'Very High',
    exposureZone: 'Zone D (Severe Marine)',
    profilePreferred: 'Archtech Interlocking Panels',
    materialPreferred: 'Terne-Coated Stainless Steel',
    estimatedValueNZD: 64000,
    stage: 'new_inquiry',
    createdAt: '2026-10-13',
    nextFollowUpDate: '2026-10-15',
    notes: [
      'Vertical architectural wall cladding & low-pitch roof integration.',
      'Advised client on Archtech NZBC E2/AS1 3-degree minimum pitch specification.'
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    projectNumber: 'ARCH-2026-041',
    title: 'Matakana Coastal Ridge Residence',
    clientName: 'Julian & Sarah Vance',
    clientEmail: 'julian.vance@nzvance.co.nz',
    architect: 'Fearon Hay Architects',
    headContractor: 'Cook Brothers Construction',
    siteAddress: '88 Matakana Valley Road, Matakana Coast',
    region: 'Auckland / Matakana',
    roofAreaM2: 365,
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'Slate Grey / FlaxPod (PVDF)',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    contractValueNZD: 94500,
    startDate: '2026-09-15',
    targetCompletionDate: '2026-11-20',
    deliveryDate: '2026-09-20',
    installStartDate: '2026-09-24',
    estimatedCompletionDate: '2026-11-20',
    clientAccountActivated: true,
    clientPortalToken: 'sec_tok_proj1_matakana_vance',
    currentAcceptedQuoteId: 'quote-01-v2',
    visibilitySettings: {
      photos: true,
      deliveryDate: true,
      installStartDate: true,
      estimatedCompletionDate: false, // Core Rule: default hidden, staff explicitly enables it
      documents: true
    },
    invoices: [
      {
        id: 'inv-01',
        invoiceNumber: 'INV-2026-018',
        projectId: 'proj-1',
        quoteId: 'quote-01-v2',
        quoteVersion: 2,
        dateIssued: '2026-09-23',
        dueDate: '2026-10-07',
        claimStage: 'Deposit (30%)',
        amountNZD: 24652.17,
        gstNZD: 3697.83,
        totalNZD: 28350.00,
        status: 'paid',
        paidAt: '2026-09-25',
        progressNotes: 'Initial deposit payment confirmed. Coil allocation secured with The Roofing Store and slit widths scheduled in factory.',
        lineItems: [
          { description: 'Deposit for materials, master coil reservation & scheduling (30%)', amountNZD: 24652.17 }
        ]
      },
      {
        id: 'inv-02',
        invoiceNumber: 'INV-2026-029',
        projectId: 'proj-1',
        quoteId: 'quote-01-v2',
        quoteVersion: 2,
        dateIssued: '2026-10-12',
        dueDate: '2026-10-26',
        claimStage: 'Materials Onsite & Substrate (40%)',
        amountNZD: 32869.57,
        gstNZD: 4930.43,
        totalNZD: 37800.00,
        status: 'paid',
        paidAt: '2026-10-18',
        progressNotes: 'HIAB crane delivery of The Roofing Store 0.55mm MagnaFlow coils to site. Structural ply substrate flatness and moisture probe verified at 14.2% MC (compliant). Absorbent synthetic underlay laid.',
        lineItems: [
          { description: 'Progress Claim: Coil delivery to site, substrate survey sign-off & underlay application (40%)', amountNZD: 32869.57 }
        ]
      },
      {
        id: 'inv-03',
        invoiceNumber: 'INV-2026-041',
        projectId: 'proj-1',
        quoteId: 'quote-01-v2',
        quoteVersion: 2,
        dateIssued: '2026-10-28',
        dueDate: '2026-11-12',
        claimStage: 'Tray Installation & Seaming (20%)',
        amountNZD: 16434.78,
        gstNZD: 2465.22,
        totalNZD: 18900.00,
        status: 'issued',
        progressNotes: 'Continuous tray roll-forming completed. Standing seam pans mechanically locked with thermal expansion clips. Wall flashings underway.',
        lineItems: [
          { description: 'Progress Claim: Standing seam roll-forming and pan installation (20%)', amountNZD: 16434.78 }
        ]
      }
    ],
    clientDocuments: [
      {
        id: 'doc-01',
        name: 'ARCH-Q-2026-092-v2_Accepted_Specification.pdf',
        category: 'Quote',
        fileUrl: '#',
        uploadedAt: '2026-09-18',
        uploadedBy: 'Marcus Kuhtze',
        sharedWithClient: true,
        sizeBytes: 1420000
      },
      {
        id: 'doc-02',
        name: 'The_Roofing_Store_MagnaFlow_25Yr_Warranty.pdf',
        category: 'Warranty',
        fileUrl: '#',
        uploadedAt: '2026-10-15',
        uploadedBy: 'Marcus Kuhtze',
        sharedWithClient: true,
        sizeBytes: 890000
      },
      {
        id: 'doc-03',
        name: 'Substrate_Moisture_Verification_Cert_SURV-041.pdf',
        category: 'Compliance',
        fileUrl: '#',
        uploadedAt: '2026-10-22',
        uploadedBy: 'Tane Williams',
        sharedWithClient: true,
        sizeBytes: 450000
      }
    ],
    progressPercent: 68,
    status: 'in_progress',
    jobStage: 'active_onsite',
    allocatedCoilId: 'coil-01',
    ps3Status: 'drafted',
    siteSurvey: {
      id: 'survey-proj-1',
      projectId: 'proj-1',
      surveyNumber: 'SURV-2026-041',
      date: '2026-10-22',
      dateSurveyed: '2026-10-22',
      surveyorName: 'Marcus Kuhtze (LBP BP114820)',
      surveyor: 'Marcus Kuhtze (LBP BP114820)',
      pitchDeg: 15,
      roofPitchDegrees: 15,
      substrateType: '17.5mm CD Plywood',
      moistureContentPercent: 14.2,
      signedOff: true,
      notes: 'Substrate moisture checked with digital pin probe across 12 grid points. All <16% (NZBC compliant). Structural ply fixings confirmed at 150mm edge centers.',
      substrateChecklist: {
        plyThicknessOk: true,
        purlinSpacingOk: true,
        moistureCompliant: true,
        fallVerified: true,
        underlayClearanceOk: true,
        antiPondingBoardsOk: true
      },
      lineItems: [
        {
          id: 'sml-1',
          code: 'FL-RIDGE-01',
          title: 'Main Ridge Cap (Ventilated)',
          name: 'Main Ridge Cap (Ventilated)',
          category: 'Ridge',
          measuredLengthMm: 24000,
          slopeLengthMm: 24000,
          count: 1,
          profileId: 'preset-ventilated-ridge',
          girthTier: '301-450mm',
          notes: 'Includes perforated TRS insect mesh insert and foam eaves fillers.'
        },
        {
          id: 'sml-2',
          code: 'FL-BARGE-01',
          title: 'North & South Rake Barges',
          name: 'North & South Rake Barges',
          category: 'Barge',
          measuredLengthMm: 12500,
          slopeLengthMm: 12940,
          count: 2,
          profileId: 'preset-barge-roll',
          girthTier: '151-300mm',
          notes: 'True rafter slope measured at 15° pitch (12.94m per side).'
        },
        {
          id: 'sml-3',
          code: 'FL-APRON-01',
          title: 'Upper Storey Wall Abutment Apron',
          name: 'Upper Storey Wall Abutment Apron',
          category: 'Apron',
          measuredLengthMm: 18200,
          slopeLengthMm: 18200,
          count: 1,
          profileId: 'preset-apron-kick',
          girthTier: '301-450mm',
          notes: 'NZBC E2/AS1 150mm upstand with hemmed drip edge.'
        },
        {
          id: 'sml-4',
          code: 'SS-TRAY-PAN',
          title: 'Archtech Super Seam 38mm Tray Run (North Pitch)',
          name: 'Archtech Super Seam 38mm Tray Run (North Pitch)',
          category: 'Tray',
          measuredLengthMm: 14200,
          slopeLengthMm: 14700,
          count: 42,
          profileId: 'super-seam-38',
          girthTier: '451-600mm',
          notes: '42 pans at 450mm centers. 14.70m roll-formed pans with 25mm lower end fold.'
        },
        {
          id: 'sml-5',
          code: 'FL-EAVES-01',
          title: 'Concealed Eaves Drip Flashing Cleat',
          name: 'Concealed Eaves Drip Flashing Cleat',
          category: 'Eaves',
          measuredLengthMm: 24000,
          slopeLengthMm: 24000,
          count: 1,
          profileId: 'preset-eaves-cleat',
          girthTier: '151-300mm',
          notes: 'Continuous 0.75mm galvanized anchor cleat fixed to fascia.'
        }
      ]
    },
    architecturalPlans: SAMPLE_PROJECT_PLANS,
    flashingPins: [
      {
        id: 'pin-1',
        projectId: 'proj-1',
        planId: 'plan-rc-01',
        profileId: 'preset-apron-kick',
        profileName: 'E2/AS1 Roof-to-Wall Apron Flashing',
        label: 'FL-01 (Apron)',
        lengthLm: 12.0,
        quantity: 4,
        xPercent: 51.5,
        yPercent: 32.5,
        girthTier: '301-450mm',
        material: 'Kiwicolour® Vitor+ PVDF',
        colorName: 'FlaxPod',
        notes: 'North elevation roof-to-timber cladding junction with 150mm upstand.',
        createdAt: '2026-10-22',
        createdBy: 'Marcus Kuhtze (LBP)'
      },
      {
        id: 'pin-2',
        projectId: 'proj-1',
        planId: 'plan-rc-01',
        profileId: 'preset-ventilated-ridge',
        profileName: 'Architectural Ventilated Ridge Cap',
        label: 'FL-02 (Ridge)',
        lengthLm: 12.0,
        quantity: 4,
        xPercent: 31.5,
        yPercent: 42.4,
        girthTier: '301-450mm',
        material: 'Kiwicolour® Vitor+ PVDF',
        colorName: 'FlaxPod',
        notes: 'Continuous ridge cap with air baffles and micro-mesh insect seal.',
        createdAt: '2026-10-22',
        createdBy: 'Marcus Kuhtze (LBP)'
      }
    ],
    planMarkupAnnotations: [
      {
        id: 'markup-1',
        planId: 'plan-rc-01',
        projectId: 'proj-1',
        type: 'dimension',
        calibratedLengthMm: 6000,
        payload: {
          points: [{ x: 0.1167, y: 0.7412 }, { x: 0.3167, y: 0.7412 }],
          label: 'Grid A–B Datum',
          tool: 'measure'
        },
        createdAt: '2026-10-20',
        createdBy: 'Marcus Kuhtze'
      },
      {
        id: 'markup-2',
        planId: 'plan-rc-01',
        projectId: 'proj-1',
        type: 'cloud',
        calibratedAreaM2: 74.54,
        pitchDegrees: 5,
        payload: {
          points: [
            { x: 0.1167, y: 0.1412 },
            { x: 0.5167, y: 0.1412 },
            { x: 0.5167, y: 0.4235 },
            { x: 0.1167, y: 0.4235 }
          ],
          label: 'Zone 1: North Pitch (Super Seam 38mm @ 5°)',
          tool: 'area'
        },
        createdAt: '2026-10-21',
        createdBy: 'Marcus Kuhtze'
      }
    ],
    timeEntries: [
      {
        id: 'te-101',
        projectId: 'proj-1',
        projectTitle: 'Matakana Coastal Ridge Residence',
        foreman: 'Tane Williams',
        taskType: 'Standing Seam Installation',
        hours: 6.5,
        date: '2026-10-24',
        billable: true,
        notes: 'Fixed 42 tray pans along north pitch with TRS 316 stainless sliding clips.'
      },
      {
        id: 'te-102',
        projectId: 'proj-1',
        projectTitle: 'Matakana Coastal Ridge Residence',
        foreman: 'Marcus Kuhtze',
        taskType: 'Council Inspection',
        hours: 2.0,
        date: '2026-10-22',
        billable: true,
        notes: 'Pre-seam council framing & underlay check passed with Auckland Council inspector.'
      },
      {
        id: 'te-103',
        projectId: 'proj-1',
        projectTitle: 'Matakana Coastal Ridge Residence',
        foreman: 'Wiremu Henare',
        taskType: 'Tray Rollforming',
        hours: 4.5,
        date: '2026-10-09',
        billable: true,
        notes: 'Mobile rollformer onsite outputting 365m² Kiwicolour Vitor+ 450mm trays.'
      }
    ],
    activityFeed: [
      {
        id: 'act-1',
        entityId: 'proj-1',
        entityType: 'project',
        type: 'site_visit',
        title: 'Site Visit & Tray Seaming Audit',
        details: 'Checked clip spacing at 400mm centers. Wind conditions 18km/h, moisture 13.8%.',
        author: 'Marcus Kuhtze (LBP)',
        timestamp: '2026-10-25 14:30'
      },
      {
        id: 'act-2',
        entityId: 'proj-1',
        entityType: 'project',
        type: 'variation',
        title: 'Variation #2 Submitted: Sump Box & Weir',
        details: 'Requested client approval for $2,200 heavy gauge aluminum internal box gutter upgrade.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-12 11:15'
      },
      {
        id: 'act-3',
        entityId: 'proj-1',
        entityType: 'project',
        type: 'call',
        title: 'Call with Cook Brothers PM (Hamish)',
        details: 'Confirmed scaffold handrail drops on West elevation are cleared for Friday.',
        author: 'Tane Williams',
        timestamp: '2026-10-10 09:20'
      },
      {
        id: 'act-4',
        entityId: 'proj-1',
        entityType: 'project',
        type: 'milestone',
        title: 'Milestone Completed: Roll-forming Finished',
        details: '365m² custom tray pans roll-formed in Vitor+ Slate.',
        author: 'Wiremu Henare',
        timestamp: '2026-10-09 16:45'
      }
    ],
    milestones: [
      {
        id: 'm-1',
        title: 'Pre-Start Architectural Review (Archtech & TRS)',
        description: 'Verify architectural junction details, minimum falls, and flashing lap clearances.',
        completed: true,
        completedAt: '2026-09-18',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      },
      {
        id: 'm-2',
        title: 'Substrate & Plywood Moisture Inspection',
        description: '19mm CD structural ply tested at 14.2% moisture content (compliant with <18% standard).',
        completed: true,
        completedAt: '2026-09-28',
        inspectorName: 'Tane Williams (Site Foreman)',
        signoffRequired: true
      },
      {
        id: 'm-3',
        title: 'The Roofing Store Synthetic Breather Underlay',
        description: 'Thermoplastic synthetic underlay mechanically fixed with 150mm taped overlaps.',
        completed: true,
        completedAt: '2026-10-04',
        inspectorName: 'Tane Williams',
        signoffRequired: false
      },
      {
        id: 'm-4',
        title: 'Archtech Super Seam 38mm Tray Roll-forming',
        description: 'Custom 450mm tray pans roll-formed in Kiwicolour Vitor+ PVDF steel.',
        completed: true,
        completedAt: '2026-10-09',
        inspectorName: 'Wiremu Henare (Machine Lead)',
        signoffRequired: false
      },
      {
        id: 'm-5',
        title: 'Super Seam Tray Fixing & Sliding Clips',
        description: 'TRS 316 stainless sliding clips fixed at 400mm centers to withstand Extra High wind suction.',
        completed: false,
        signoffRequired: true
      },
      {
        id: 'm-6',
        title: 'Architectural Flashings & Penetration Dressings',
        description: 'Hand-folded internal box gutters, custom ventilated ridge cap and chimney upstands.',
        completed: false,
        signoffRequired: true
      },
      {
        id: 'm-7',
        title: 'Quality Assurance Final Punch List (SiteWise Green)',
        description: 'Visual seam alignment audit, swarf removal, and scratch check.',
        completed: false,
        signoffRequired: true
      },
      {
        id: 'm-8',
        title: 'Archtech PS3 Producer Statement & Handover',
        description: 'LBP signoff issued for council Code Compliance Certificate (CCC).',
        completed: false,
        signoffRequired: true
      }
    ],
    variations: [
      {
        id: 'var-1',
        title: 'Additional Skylight Trimming & Apron Flashing Detail',
        description: 'Architect added a 1200x800mm Velux architectural roof window over main master ensuite.',
        amountNZD: 1850,
        status: 'approved',
        requestedAt: '2026-10-05',
        approvedAt: '2026-10-07'
      },
      {
        id: 'var-2',
        title: 'Concealed Rainwater Sump Box & Overflow Upgrade',
        description: 'Heavy gauge 0.8mm folded marine aluminum sump with secondary weir overflow for high rainfall events.',
        amountNZD: 2200,
        status: 'pending_client',
        requestedAt: '2026-10-12'
      }
    ],
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'North pavilion Archtech Super Seam layout showing crisp tray alignment',
        phase: 'Super Seam Installation',
        takenAt: '2026-10-11',
        uploadedBy: 'Tane Williams'
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        caption: 'The Roofing Store underlay membrane verification and ridge ventilation',
        phase: 'Underlay Membrane',
        takenAt: '2026-10-04',
        uploadedBy: 'Marcus Kuhtze'
      }
    ]
  },
  {
    id: 'proj-2',
    projectNumber: 'ARCH-2026-039',
    title: 'Wanaka Lakefront Alpine Pavilion',
    clientName: 'Hamish & Claire Macfarlane',
    clientEmail: 'hmacfarlane@alpineholdings.co.nz',
    architect: 'Warren and Mahoney',
    headContractor: 'Amalgamated Builders NZ',
    siteAddress: '14 Buchanan Rise, Roys Peninsula, Wanaka',
    region: 'Wanaka / Central Otago',
    roofAreaM2: 440,
    profile: 'Archtech Double Angle Seam',
    material: 'Kiwicolour® Zenex+ Extreme Coastal',
    colorName: 'Zenex+ Anthracite',
    windZone: 'Very High',
    exposureZone: 'Zone B (Inland)',
    contractValueNZD: 156000,
    startDate: '2026-10-01',
    targetCompletionDate: '2026-12-15',
    progressPercent: 32,
    status: 'in_progress',
    jobStage: 'pre_start',
    allocatedCoilId: 'coil-02',
    ps3Status: 'pending',
    architecturalPlans: SAMPLE_PROJECT_PLANS,
    timeEntries: [
      {
        id: 'te-201',
        projectId: 'proj-2',
        projectTitle: 'Wanaka Lakefront Alpine Pavilion',
        foreman: 'Lachlan Smith',
        taskType: 'Site Measure',
        hours: 5.0,
        date: '2026-10-10',
        billable: true,
        notes: 'Plywood substrate level check and 3D laser scan of 14m rake eaves.'
      }
    ],
    activityFeed: [
      {
        id: 'act-21',
        entityId: 'proj-2',
        entityType: 'project',
        type: 'site_visit',
        title: 'Substrate & Plywood Moisture Inspection',
        details: '19mm structural ply verified at 12.8% moisture content. Thermal expansion clips ready.',
        author: 'Lachlan Smith',
        timestamp: '2026-10-10 15:00'
      },
      {
        id: 'act-22',
        entityId: 'proj-2',
        entityType: 'project',
        type: 'note',
        title: 'Coil Dispatch from The Roofing Store',
        details: 'Zenex+ Anthracite coils dispatched via Mainfreight to Wanaka Depot.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-06 08:30'
      }
    ],
    milestones: [
      {
        id: 'm-21',
        title: 'Pre-Start Engineering & Sub-zero Thermal Calc',
        description: 'Verify sliding clip travel length for 14m tray lengths in alpine climate (-10°C to +35°C).',
        completed: true,
        completedAt: '2026-10-03',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      },
      {
        id: 'm-22',
        title: 'Plywood Substrate Moisture & Fall Signoff',
        description: '19mm structural ply verified at 12.8% moisture content.',
        completed: true,
        completedAt: '2026-10-10',
        inspectorName: 'Lachlan Smith',
        signoffRequired: true
      },
      {
        id: 'm-23',
        title: 'Breather Underlay & Drainage Mat Layer',
        description: 'Installation of structured drainage separation mesh from The Roofing Store.',
        completed: false,
        signoffRequired: false
      },
      {
        id: 'm-24',
        title: 'Archtech Double Angle Seaming',
        description: 'Double mechanical fold seaming with Archtech specialized seamer equipment.',
        completed: false,
        signoffRequired: true
      }
    ],
    variations: [],
    photos: [
      {
        id: 'p-21',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
        caption: 'Substrate plywood inspection and edge scaffolding check at Buchanan Rise site',
        phase: 'Substrate Inspection',
        takenAt: '2026-10-10',
        uploadedBy: 'Lachlan Smith'
      }
    ]
  },
  {
    id: 'proj-3',
    projectNumber: 'ARCH-2026-032',
    title: 'Omaha Coastal Dune House',
    clientName: 'Dr. Alistair & Mei Croft',
    clientEmail: 'croft.omaha@gmail.com',
    architect: 'Cheshire Architects',
    headContractor: 'Haydn & Rollett',
    siteAddress: '42 Mangatawhiri Spit, Omaha Beach',
    region: 'Omaha / Northland',
    roofAreaM2: 290,
    profile: 'Archtech Super Seam 38mm',
    material: 'The Roofing Store MagnaFlow®',
    colorName: 'MagnaFlow Slate',
    windZone: 'High',
    exposureZone: 'Zone D (Severe Marine)',
    contractValueNZD: 82000,
    startDate: '2026-08-20',
    targetCompletionDate: '2026-10-25',
    progressPercent: 94,
    status: 'snagging',
    jobStage: 'qa_snagging',
    allocatedCoilId: 'coil-04',
    ps3Status: 'lodged_with_council',
    timeEntries: [
      {
        id: 'te-301',
        projectId: 'proj-3',
        projectTitle: 'Omaha Coastal Dune House',
        foreman: 'Marcus Kuhtze',
        taskType: 'Council Inspection',
        hours: 3.5,
        date: '2026-10-13',
        billable: true,
        notes: 'Final PS3 Producer statement walk-around with Auckland Council inspector.'
      }
    ],
    activityFeed: [
      {
        id: 'act-31',
        entityId: 'proj-3',
        entityType: 'project',
        type: 'milestone',
        title: 'PS3 Producer Statement Lodged',
        details: 'Marcus Kuhtze (LBP 114820) signed off PS3 for CCC application.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-13 14:00'
      }
    ],
    milestones: [
      {
        id: 'm-31',
        title: 'Pre-Start Marine Exposure Design',
        description: 'Grade 316 stainless fixings and MagnaFlow alloy durability guarantee from The Roofing Store.',
        completed: true,
        completedAt: '2026-08-22',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      },
      {
        id: 'm-32',
        title: 'Underlay & Substrate',
        description: 'Plywood substrate approved at 13.5% moisture.',
        completed: true,
        completedAt: '2026-09-02',
        inspectorName: 'Tane Williams',
        signoffRequired: true
      },
      {
        id: 'm-33',
        title: 'Tray Installation & Seaming',
        description: 'Archtech Super Seam 38mm in MagnaFlow Slate completed across all 3 roof planes.',
        completed: true,
        completedAt: '2026-09-29',
        inspectorName: 'Tane Williams',
        signoffRequired: true
      },
      {
        id: 'm-34',
        title: 'Flashings & E2/AS1 2-piece penetrations',
        description: 'Barge and parapet flashings completed with secret lock clips.',
        completed: true,
        completedAt: '2026-10-12',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      },
      {
        id: 'm-35',
        title: 'Archtech Producer Statement PS3 Issue',
        description: 'LBP documentation submitted to Auckland Council building inspector.',
        completed: true,
        completedAt: '2026-10-13',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      }
    ],
    variations: [
      {
        id: 'var-31',
        title: 'Custom Curved Soft Zinc Eaves Trim',
        amountNZD: 3100,
        description: 'Seamless soft zinc curved return at western ocean facade.',
        status: 'approved',
        requestedAt: '2026-09-10',
        approvedAt: '2026-09-12'
      }
    ],
    photos: []
  },
  {
    id: 'proj-4',
    projectNumber: 'ARCH-2026-044',
    title: 'Oneroa Bay Clifftop Villa',
    clientName: 'Marcus & Penny Sterling',
    clientEmail: 'm.sterling@waihekeventures.co.nz',
    architect: 'Patterson Associates',
    headContractor: 'Waiheke Luxury Homes',
    siteAddress: '112 Oceanview Road, Oneroa, Waiheke Island',
    region: 'Waiheke Island',
    roofAreaM2: 320,
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'FlaxPod (Vitor+)',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    contractValueNZD: 88500,
    startDate: '2026-11-01',
    targetCompletionDate: '2027-01-15',
    progressPercent: 10,
    status: 'pre_construction',
    jobStage: 'enquiry_measure',
    ps3Status: 'pending',
    timeEntries: [
      {
        id: 'te-401',
        projectId: 'proj-4',
        projectTitle: 'Oneroa Bay Clifftop Villa',
        foreman: 'Marcus Kuhtze',
        taskType: 'Site Measure',
        hours: 3.5,
        date: '2026-10-24',
        billable: true,
        notes: 'Waiheke site visit: measured 16m rake barge and barge roll rebate.'
      }
    ],
    activityFeed: [
      {
        id: 'act-41',
        entityId: 'proj-4',
        entityType: 'project',
        type: 'site_visit',
        title: 'Initial Onsite Measure Completed',
        details: 'Checked ferry logistics with The Roofing Store HIAB barge delivery.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-24 11:30'
      }
    ],
    milestones: [
      {
        id: 'm-41',
        title: 'Site Measure & Ferry Freight Logistics',
        description: 'Verify Sealink barge transport for 16m tray coils.',
        completed: true,
        completedAt: '2026-10-24',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      },
      {
        id: 'm-42',
        title: 'Substrate & Plywood Moisture Testing',
        description: 'Moisture content verification before underlay.',
        completed: false,
        signoffRequired: true
      }
    ],
    variations: [],
    photos: []
  },
  {
    id: 'proj-5',
    projectNumber: 'ARCH-2026-046',
    title: 'Gibbston Valley Winery Barrel Hall',
    clientName: 'David Cox (Gibbston Estate)',
    clientEmail: 'david.cox@gibbstonwines.co.nz',
    architect: 'Herbst Architects',
    headContractor: 'Naylor Love Queenstown',
    siteAddress: '1820 State Highway 6, Gibbston Valley, Queenstown',
    region: 'Central Otago / Queenstown',
    roofAreaM2: 520,
    profile: 'Archtech Angle Seam',
    material: 'Weathering Steel (CORTEN)',
    colorName: 'Natural Weathered Patina',
    windZone: 'High',
    exposureZone: 'Zone B (Inland)',
    contractValueNZD: 184000,
    startDate: '2026-11-15',
    targetCompletionDate: '2027-02-28',
    progressPercent: 15,
    status: 'pre_construction',
    jobStage: 'quoting',
    ps3Status: 'pending',
    timeEntries: [],
    activityFeed: [
      {
        id: 'act-51',
        entityId: 'proj-5',
        entityType: 'project',
        type: 'note',
        title: 'Takeoff in Quoting Suite',
        details: 'Herbst Architects issued revision D drawings. Corten 0.7mm angle seam specified.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-23 16:00'
      }
    ],
    milestones: [
      {
        id: 'm-51',
        title: 'Architectural Takeoff & Girth Pricing',
        description: 'Girth tier matrix calculation for 140lm of custom Corten valley flashings.',
        completed: true,
        completedAt: '2026-10-23',
        signoffRequired: false
      }
    ],
    variations: [],
    photos: []
  },
  {
    id: 'proj-6',
    projectNumber: 'ARCH-2026-047',
    title: 'Ponsonby Urban Sanctuary Duplex',
    clientName: 'Sophie Hemi (Studio Pacific)',
    clientEmail: 'sophie.hemi@studiopacific.co.nz',
    architect: 'Studio Pacific Architecture',
    headContractor: 'LT McGuinness',
    siteAddress: '56 Richmond Road, Ponsonby, Auckland',
    region: 'Auckland Central',
    roofAreaM2: 240,
    profile: 'Archtech Interlocking Panels',
    material: 'VMZinc® Anthra-Zinc',
    colorName: 'Anthra-Zinc Charcoal',
    windZone: 'High',
    exposureZone: 'Zone C (Medium)',
    contractValueNZD: 112000,
    startDate: '2026-11-10',
    targetCompletionDate: '2027-01-20',
    progressPercent: 20,
    status: 'pre_construction',
    jobStage: 'quote_sent',
    ps3Status: 'pending',
    timeEntries: [],
    activityFeed: [
      {
        id: 'act-61',
        entityId: 'proj-6',
        entityType: 'project',
        type: 'email',
        title: 'Quote Sent: ARCH-Q-2026-092 ($112,000)',
        details: 'Interactive client proposal emailed to Sophie Hemi with 30-day validity.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-10-22 17:15'
      }
    ],
    milestones: [
      {
        id: 'm-61',
        title: 'Client Quote Review & Digital Signoff',
        description: 'Awaiting client digital authorization.',
        completed: false,
        signoffRequired: true
      }
    ],
    variations: [],
    photos: []
  },
  {
    id: 'proj-7',
    projectNumber: 'ARCH-2026-028',
    title: 'Te Arai Links Golf Lodge Pavilions',
    clientName: 'Ricochet Holdings NZ',
    clientEmail: 'projects@ricochet.co.nz',
    architect: 'Studio John Irving Architects',
    headContractor: 'Savory Construction',
    siteAddress: 'Ocean Drive, Te Arai, Mangawhai Coast',
    region: 'Mangawhai / Northland',
    roofAreaM2: 480,
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Zenex+ Extreme Coastal',
    colorName: 'Zenex+ Dune Dune / FlaxPod',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    contractValueNZD: 142000,
    startDate: '2026-06-01',
    targetCompletionDate: '2026-09-30',
    progressPercent: 100,
    status: 'completed',
    jobStage: 'completed',
    ps3Status: 'approved',
    timeEntries: [
      {
        id: 'te-701',
        projectId: 'proj-7',
        projectTitle: 'Te Arai Links Golf Lodge Pavilions',
        foreman: 'Marcus Kuhtze',
        taskType: 'Council Inspection',
        hours: 4.0,
        date: '2026-09-28',
        billable: true,
        notes: 'Final CCC inspection signed off by Kaipara District Council.'
      }
    ],
    activityFeed: [
      {
        id: 'act-71',
        entityId: 'proj-7',
        entityType: 'project',
        type: 'milestone',
        title: 'Producer Statement PS3 Approved & CCC Issued',
        details: 'Project complete. Final 100% invoice issued and paid.',
        author: 'Marcus Kuhtze',
        timestamp: '2026-09-30 16:00'
      }
    ],
    milestones: [
      {
        id: 'm-71',
        title: 'Final PS3 Council Signoff & CCC',
        description: 'All 4 pavilions handed over with 25-year TRS warranty.',
        completed: true,
        completedAt: '2026-09-30',
        inspectorName: 'Marcus Kuhtze',
        signoffRequired: true
      }
    ],
    variations: [],
    photos: []
  }
];

export const INITIAL_COIL_STOCK: CoilStock[] = [
  {
    id: 'coil-01',
    coilNumber: 'TRS-KC-9812',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'FlaxPod / CB01 (PVDF)',
    colorHex: '#272a2b',
    thicknessMm: 0.55,
    slitWidthMm: 450,
    totalLinearMetres: 1350,
    allocatedLinearMetres: 880,
    weightKg: 2950,
    locationBay: 'Bay TRS-01 (Archtech Auckland Hub)',
    supplier: 'The Roofing Store Ltd (East Tamaki Branch)',
    batchDate: '2026-08-14',
    minThresholdMetres: 300
  },
  {
    id: 'coil-02',
    coilNumber: 'TRS-ZX-8821',
    material: 'Kiwicolour® Zenex+ Extreme Coastal',
    colorName: 'Ebony / CB02 (Zenex+)',
    colorHex: '#18191b',
    thicknessMm: 0.55,
    slitWidthMm: 530,
    totalLinearMetres: 950,
    allocatedLinearMetres: 440,
    weightKg: 2450,
    locationBay: 'Bay TRS-02 (Wanaka Depot)',
    supplier: 'The Roofing Store Ltd (Christchurch Branch)',
    batchDate: '2026-09-02',
    minThresholdMetres: 250
  },
  {
    id: 'coil-03',
    coilNumber: 'TRS-UC-4401',
    material: 'UniCote® Lux Architectural Pattern',
    colorName: 'Weathered Zinc Silver',
    colorHex: '#4a4d52',
    thicknessMm: 0.70,
    slitWidthMm: 500,
    totalLinearMetres: 560,
    allocatedLinearMetres: 220,
    weightKg: 1820,
    locationBay: 'Bay TRS-03 (Archtech Auckland)',
    supplier: 'The Roofing Store Ltd (Albany Branch)',
    batchDate: '2026-07-20',
    minThresholdMetres: 150
  },
  {
    id: 'coil-04',
    coilNumber: 'TRS-MF-7730',
    material: 'The Roofing Store MagnaFlow®',
    colorName: 'Slate Grey (CB03)',
    colorHex: '#383b40',
    thicknessMm: 0.70,
    slitWidthMm: 450,
    totalLinearMetres: 820,
    allocatedLinearMetres: 590,
    weightKg: 1480,
    locationBay: 'Bay TRS-04 (Archtech Auckland)',
    supplier: 'The Roofing Store Ltd (East Tamaki)',
    batchDate: '2026-08-29',
    minThresholdMetres: 200
  },
  {
    id: 'coil-05',
    coilNumber: 'TRS-CP-1050',
    material: 'Architectural Copper (0.6mm)',
    colorName: 'Natural Brown Copper',
    colorHex: '#5c4233',
    thicknessMm: 0.60,
    slitWidthMm: 600,
    totalLinearMetres: 260,
    allocatedLinearMetres: 195,
    weightKg: 1350,
    locationBay: 'Secure Vault A (Archtech Auckland)',
    supplier: 'The Roofing Store Ltd',
    batchDate: '2026-06-12',
    minThresholdMetres: 100
  },
  {
    id: 'coil-06',
    coilNumber: 'TRS-TC-3320',
    material: 'Terne-Coated Stainless Steel',
    colorName: 'Matte Weathered Pewter',
    colorHex: '#747980',
    thicknessMm: 0.50,
    slitWidthMm: 450,
    totalLinearMetres: 480,
    allocatedLinearMetres: 210,
    weightKg: 1120,
    locationBay: 'Bay TRS-05 (Archtech Auckland)',
    supplier: 'The Roofing Store Ltd',
    batchDate: '2026-09-18',
    minThresholdMetres: 150
  }
];

export const INITIAL_ACCESSORY_STOCK: AccessoryStock[] = [
  {
    id: 'acc-1',
    name: 'TRS Super Seam 316 Stainless Sliding Clips (38mm)',
    category: 'Clips & Fixings',
    unit: 'boxes (500 pcs)',
    quantityOnHand: 34,
    minStockLevel: 10,
    unitCostNZD: 185,
    specification: 'Grade 316 Marine Stainless Steel supplied by The Roofing Store for long pan thermal travel.'
  },
  {
    id: 'acc-2',
    name: 'TRS Fixed Base Clips for Super Seam & Angle Seam',
    category: 'Clips & Fixings',
    unit: 'boxes (500 pcs)',
    quantityOnHand: 48,
    minStockLevel: 15,
    unitCostNZD: 140,
    specification: 'High wind suction restraint for NZS 3604 Extra High Wind zones.'
  },
  {
    id: 'acc-3',
    name: 'TRS Vapour-Permeable Synthetic Breather Underlay (50m² roll)',
    category: 'Underlay & Membranes',
    unit: 'rolls',
    quantityOnHand: 42,
    minStockLevel: 12,
    unitCostNZD: 210,
    specification: 'The Roofing Store branded NZBC E2/AS1 Table 23 compliant heavy duty underlay.'
  },
  {
    id: 'acc-4',
    name: 'TRS Structured Drainage Mat Separation Mesh',
    category: 'Underlay & Membranes',
    unit: 'rolls (30m²)',
    quantityOnHand: 18,
    minStockLevel: 6,
    unitCostNZD: 320,
    specification: '8mm polypropylene entangled filament mat for copper/zinc backside condensation drain.'
  },
  {
    id: 'acc-5',
    name: 'Kiwicolour Color-Matched EPDM Washer Screws (Vitor+)',
    category: 'Fasteners',
    unit: 'tubs (1000 pcs)',
    quantityOnHand: 26,
    minStockLevel: 8,
    unitCostNZD: 95,
    specification: 'Class 4 mechanical galvanised with UV-stabilized seal matching Kiwicolour shades.'
  },
  {
    id: 'acc-6',
    name: 'Archtech Custom Fabricated Internal Box Gutter (316 SS)',
    category: 'Gutters & Downpipes',
    unit: 'metres',
    quantityOnHand: 75,
    minStockLevel: 20,
    unitCostNZD: 110,
    specification: 'Archtech workshop folded continuous 250mm trough with integrated emergency overflow spouts.'
  }
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quote-01-v2',
    projectId: 'proj-1',
    quoteNumber: 'ARCH-Q-2026-092-v2',
    baseQuoteNumber: 'ARCH-Q-2026-092',
    version: 2,
    versionLabel: 'v2.0 (Agreed MagnaFlow Specification)',
    revision: 'Rev B',
    status: 'accepted',
    isLocked: true,
    issueDate: '2026-09-18',
    validUntil: '2026-10-18',
    clientToken: 'sec_q01v2_matakana_accepted',
    supersedesId: 'quote-01-v1',
    clientName: 'Julian & Sarah Vance',
    clientEmail: 'julian.vance@nzvance.co.nz',
    clientPhone: '+64 21 892 4110',
    architect: 'Fearon Hay Architects',
    siteAddress: '88 Matakana Valley Road, Matakana Coast',
    region: 'Auckland / Matakana',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    accessDifficulty: 'Two Storey Standard',

    // Section 1: Roofing & Wall Cladding Zones (Priced per lm & m²)
    scopeZones: [
      {
        id: 'sz-1',
        title: 'Main Gable & Clerestory Roof',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
        colorName: 'FlaxPod / Slate',
        areaM2: 285,
        trayPanWidthMm: 450,
        calculatedLinearMetres: 633.3,
        ratePerLm: 34.50,
        totalNZD: 21848.85,
        pitchDegrees: 4,
        notes: 'Continuous tray pans up to 14m length with concealed thermal expansion clips.'
      },
      {
        id: 'sz-2',
        title: 'North & West Coastal Wall Cladding',
        application: 'Wall Cladding',
        profile: 'Archtech Interlocking Panels',
        material: 'The Roofing Store MagnaFlow®',
        colorName: 'MagnaFlow Slate Grey',
        areaM2: 80,
        trayPanWidthMm: 300,
        calculatedLinearMetres: 266.7,
        ratePerLm: 36.50,
        totalNZD: 9734.55,
        pitchDegrees: 90,
        notes: '25mm shadow reveal joint with secret fastener fixings.'
      }
    ],

    // Section 2: Architectural Flashings Matrix (Priced per lm by Girth Tier)
    flashings: [
      {
        id: 'fl-1',
        name: 'Ventilated Ridge Cap Flashing',
        type: 'Ridge Cap Vent',
        girthTier: '301-450mm',
        material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
        lengthLm: 34,
        foldsCount: 3,
        baseRatePerLm: 39.00,
        extraFoldRatePerLm: 0,
        calculatedRatePerLm: 39.00,
        totalNZD: 1326.00
      },
      {
        id: 'fl-2',
        name: 'Concealed Barge & Eaves Drip Flashing',
        type: 'Barge Flashing / Roll',
        girthTier: '151-300mm',
        material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
        lengthLm: 48,
        foldsCount: 4,
        baseRatePerLm: 28.50,
        extraFoldRatePerLm: 3.00,
        calculatedRatePerLm: 31.50,
        totalNZD: 1512.00
      },
      {
        id: 'fl-3',
        name: 'Heavy Duty Parapet Transition Capping',
        type: 'Parapet Capping',
        girthTier: '451-600mm',
        material: 'The Roofing Store MagnaFlow®',
        lengthLm: 22,
        foldsCount: 4,
        baseRatePerLm: 64.00,
        extraFoldRatePerLm: 4.00,
        calculatedRatePerLm: 68.00,
        totalNZD: 1496.00
      },
      {
        id: 'fl-4',
        name: 'Workshop Fabricated Internal Box Gutter',
        type: 'Custom Internal Box Gutter',
        girthTier: '601-900mm',
        material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
        lengthLm: 26,
        foldsCount: 5,
        baseRatePerLm: 74.00,
        extraFoldRatePerLm: 10.00,
        calculatedRatePerLm: 84.00,
        totalNZD: 2184.00
      },
      {
        id: 'fl-5',
        name: 'Window Head & Penetration Dressings',
        type: 'Window Head / Jamb Flashing',
        girthTier: '0-150mm',
        material: 'The Roofing Store MagnaFlow®',
        lengthLm: 36,
        foldsCount: 3,
        baseRatePerLm: 24.50,
        extraFoldRatePerLm: 0,
        calculatedRatePerLm: 24.50,
        totalNZD: 882.00
      }
    ],

    // Section 3: Hardware, Fixings & Underlay Catalogue Items
    hardwareItems: [
      {
        id: 'hwi-1',
        name: 'TRS Super Seam 316 Stainless Sliding Expansion Clips',
        category: 'Clips & Fixings',
        quantity: 4,
        unit: 'boxes (500 pcs)',
        unitCostNZD: 185.00,
        sellRateNZD: 245.00,
        totalNZD: 980.00
      },
      {
        id: 'hwi-2',
        name: 'TRS Fixed Base Clips (Wind Suction Restraint)',
        category: 'Clips & Fixings',
        quantity: 3,
        unit: 'boxes (500 pcs)',
        unitCostNZD: 140.00,
        sellRateNZD: 185.00,
        totalNZD: 555.00
      },
      {
        id: 'hwi-3',
        name: 'TRS Vapour-Permeable Synthetic Breather Underlay',
        category: 'Underlay & Membranes',
        quantity: 8,
        unit: 'rolls (50m²)',
        unitCostNZD: 210.00,
        sellRateNZD: 295.00,
        totalNZD: 2360.00
      },
      {
        id: 'hwi-4',
        name: 'Kiwicolour Color-Matched EPDM Washer Screws (Class 4)',
        category: 'Fasteners',
        quantity: 3,
        unit: 'tubs (1000 pcs)',
        unitCostNZD: 95.00,
        sellRateNZD: 135.00,
        totalNZD: 405.00
      },
      {
        id: 'hwi-5',
        name: 'High-Performance MS Polymer Architectural Sealant',
        category: 'Consumables & Sundries',
        quantity: 18,
        unit: 'cartridges',
        unitCostNZD: 16.50,
        sellRateNZD: 26.00,
        totalNZD: 468.00
      }
    ],

    // Section 4: Labour Pricing Matrix
    labourItems: [
      {
        id: 'lbi-1',
        title: 'Roofing Tray Installation & Seaming (Super Seam 38mm)',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        basis: 'm2',
        quantity: 285,
        baseRate: 44.00,
        pitchMultiplier: 1.05,
        accessMultiplier: 1.15,
        windMultiplier: 1.10,
        effectiveRate: 58.44,
        totalNZD: 16655.40
      },
      {
        id: 'lbi-2',
        title: 'Architectural Wall Cladding Fixing (Interlocking Panels)',
        application: 'Wall Cladding',
        profile: 'Archtech Interlocking Panels',
        basis: 'm2',
        quantity: 80,
        baseRate: 58.00,
        pitchMultiplier: 1.0,
        accessMultiplier: 1.20,
        windMultiplier: 1.05,
        effectiveRate: 73.08,
        totalNZD: 5846.40
      },
      {
        id: 'lbi-3',
        title: 'Specialist Flashing Dressings, Box Gutters & Penetrations',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        basis: 'lm',
        quantity: 166,
        baseRate: 22.00,
        pitchMultiplier: 1.0,
        accessMultiplier: 1.15,
        windMultiplier: 1.0,
        effectiveRate: 25.30,
        totalNZD: 4199.80
      },
      {
        id: 'lbi-4',
        title: 'SiteWise Green Safety Protocol, Scaffold Tag & Job Handover Signoff',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        basis: 'lump_sum',
        quantity: 1,
        baseRate: 3850.00,
        pitchMultiplier: 1.0,
        accessMultiplier: 1.0,
        windMultiplier: 1.0,
        effectiveRate: 3850.00,
        totalNZD: 3850.00
      }
    ],

    // Section 5: Upgrades
    upgrades: [
      {
        id: 'up-1',
        title: 'Upgrade to Kiwicolour® Zenex+ Extreme Coastal Alloy',
        description: 'Ultimate marine corrosion resistance from The Roofing Store with 25-year coastal durability guarantee.',
        additionalCostNZD: 4800,
        selected: false
      },
      {
        id: 'up-2',
        title: 'Archtech Integrated Hidden Box Gutters with Sump Weirs',
        description: 'Completely concealed architectural eavesline with 0.8mm stainless box gutters and emergency overflows.',
        additionalCostNZD: 3450,
        selected: true
      },
      {
        id: 'up-3',
        title: 'Acoustic Sound-Dampening Decibel Strip Under Pans',
        description: 'Reduces rain noise impact on low-pitch bedroom wing by up to 14dB.',
        additionalCostNZD: 1850,
        selected: false
      }
    ],

    // Fallbacks
    roofAreaM2: 365,
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'FlaxPod / Slate',

    // Section 6: Freight & Logistics
    freightItems: [
      {
        id: 'frt-1',
        description: 'The Roofing Store HIAB Crane Delivery (Matakana Valley Site)',
        carrier: 'The Roofing Store Logistics',
        unit: 'trip',
        quantity: 1,
        costNZD: 380.00,
        sellRateNZD: 450.00,
        totalNZD: 450.00,
        notes: 'Direct delivery to site with 14m boom crane reach for scaffolding drop.'
      },
      {
        id: 'frt-2',
        description: 'Coil Pallet Return & Recyclable Packaging Clearance',
        carrier: 'The Roofing Store Logistics',
        unit: 'trip',
        quantity: 1,
        costNZD: 180.00,
        sellRateNZD: 215.00,
        totalNZD: 215.00,
        notes: 'Timber cradle recovery.'
      }
    ],

    // Totals & Markup
    materialTotalNZD: 31583.40,
    flashingsTotalNZD: 7400.00,
    hardwareTotalNZD: 4768.00,
    freightTotalNZD: 665.00,
    labourTotalNZD: 30551.60,

    costTotalNZD: 64280.00,
    markupAmountNZD: 17123.00,
    markupPercent: 20.0,
    marginPercent: 16.7,
    markupMode: 'overall',
    categoryMarkups: {
      materials: 20.0,
      flashings: 20.0,
      hardware: 25.0,
      freight: 15.0,
      labour: 20.0
    },

    subtotalNZD: 82168.00,
    gstNZD: 12325.20,
    totalNZD: 94500.00,

    status: 'accepted',
    isLocked: true,
    issueDate: '2026-09-18',
    validUntil: '2026-10-18',
    createdAt: '2026-09-18',
    expiresAt: '2026-10-18',
    clientSignature: 'Julian Vance',
    signedAt: '2026-09-22',
    acceptedBy: {
      name: 'Julian Vance',
      email: 'julian.vance@nzvance.co.nz',
      timestamp: '2026-09-22T10:45:00Z',
      ipAddress: '122.56.214.89 (Matakana, NZ)',
      notes: 'Accepted via digital portal link. Authorized to proceed with 30% deposit invoice.',
      signatureUrl: 'Julian Vance'
    },
    auditTrail: [
      {
        id: 'aud-01-v2-acc',
        timestamp: '2026-09-22T10:45:00Z',
        action: 'accepted',
        actor: 'Julian Vance (Client)',
        actorType: 'client',
        details: 'Quote accepted for $94,500.00 NZD. Immutable version locked. Client portal account activated.',
        versionNumber: 2,
        ipAddress: '122.56.214.89'
      },
      {
        id: 'aud-01-v2-view',
        timestamp: '2026-09-19T08:21:00Z',
        action: 'viewed',
        actor: 'Julian Vance (Client)',
        actorType: 'client',
        details: 'Quote viewed via secure client token link.',
        versionNumber: 2,
        ipAddress: '122.56.214.89'
      },
      {
        id: 'aud-01-v2-crt',
        timestamp: '2026-09-18T10:00:00Z',
        action: 'created',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Version 2 created replacing v1.0. Upgraded to MagnaFlow alloy per client request.',
        versionNumber: 2
      }
    ]
  },

  // 1b. PROJECT 1: VERSION 1 (SUPERSEDED)
  {
    id: 'quote-01-v1',
    projectId: 'proj-1',
    quoteNumber: 'ARCH-Q-2026-092-v1',
    baseQuoteNumber: 'ARCH-Q-2026-092',
    version: 1,
    versionLabel: 'v1.0 (Initial Standard Spec)',
    revision: 'Rev A',
    status: 'superseded',
    isLocked: true,
    issueDate: '2026-09-02',
    validUntil: '2026-10-02',
    createdAt: '2026-09-02',
    expiresAt: '2026-10-02',
    clientToken: 'sec_q01v1_matakana_initial',
    supersededById: 'quote-01-v2',
    supersededAt: '2026-09-18',
    supersededReason: 'Client requested upgrade to The Roofing Store MagnaFlow® severe marine alloy and ventilated ridge system per architect recommendation.',
    clientName: 'Julian & Sarah Vance',
    clientEmail: 'julian.vance@nzvance.co.nz',
    clientPhone: '+64 21 892 4110',
    architect: 'Fearon Hay Architects',
    siteAddress: '88 Matakana Valley Road, Matakana Coast',
    region: 'Auckland / Matakana',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    accessDifficulty: 'Two Storey Standard',
    roofAreaM2: 365,
    profile: 'Archtech Super Seam 38mm',
    material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
    colorName: 'FlaxPod / Slate',
    scopeZones: [
      {
        id: 'sz-1-v1',
        title: 'Main Gable Roof Trays (Standard Vitor+)',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
        colorName: 'FlaxPod / Slate',
        areaM2: 285,
        trayPanWidthMm: 450,
        calculatedLinearMetres: 633.3,
        ratePerLm: 31.00,
        totalNZD: 19632.30,
        pitchDegrees: 15
      }
    ],
    flashings: [],
    hardwareItems: [],
    freightItems: [],
    labourItems: [],
    upgrades: [],
    materialTotalNZD: 28400.00,
    flashingsTotalNZD: 6200.00,
    hardwareTotalNZD: 4100.00,
    freightTotalNZD: 600.00,
    labourTotalNZD: 28200.00,
    costTotalNZD: 59000.00,
    markupAmountNZD: 17700.00,
    markupPercent: 20.0,
    marginPercent: 16.7,
    subtotalNZD: 76000.00,
    gstNZD: 11400.00,
    totalNZD: 87400.00,
    auditTrail: [
      {
        id: 'aud-01-v1-sup',
        timestamp: '2026-09-18T09:12:00Z',
        action: 'superseded',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Superseded by Version 2 (ARCH-Q-2026-092-v2). MagnaFlow upgrade requested.',
        versionNumber: 1
      },
      {
        id: 'aud-01-v1-crt',
        timestamp: '2026-09-02T14:30:00Z',
        action: 'created',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Initial proposal drafted and issued to Julian & Sarah Vance.',
        versionNumber: 1
      }
    ]
  },

  // 2. PROJECT 2: EXPIRED QUOTE (OVER 30 DAYS OLD)
  {
    id: 'quote-02-v1',
    projectId: 'proj-2',
    quoteNumber: 'ARCH-Q-2026-039-v1',
    baseQuoteNumber: 'ARCH-Q-2026-039',
    version: 1,
    versionLabel: 'v1.0 (Expired Proposal)',
    revision: 'Rev A',
    status: 'expired',
    isLocked: false,
    issueDate: '2026-08-10',
    validUntil: '2026-09-09',
    createdAt: '2026-08-10',
    expiresAt: '2026-09-09',
    clientToken: 'sec_q02v1_wanaka_expired',
    clientName: 'Hamish & Claire Macfarlane',
    clientEmail: 'hmacfarlane@alpineholdings.co.nz',
    clientPhone: '+64 27 499 1042',
    architect: 'Warren and Mahoney',
    siteAddress: '14 Buchanan Rise, Roys Peninsula, Wanaka',
    region: 'Wanaka / Central Otago',
    windZone: 'Very High',
    exposureZone: 'Zone B (Inland)',
    accessDifficulty: 'Alpine Slope Access',
    roofAreaM2: 440,
    profile: 'Archtech Double Angle Seam',
    material: 'Kiwicolour® Zenex+ Extreme Coastal',
    colorName: 'Zenex+ Anthracite',
    scopeZones: [
      {
        id: 'sz-wanaka-1',
        title: 'Alpine Pavilion Roof (Double Standing Seam)',
        application: 'Roofing',
        profile: 'Archtech Double Angle Seam',
        material: 'Kiwicolour® Zenex+ Extreme Coastal',
        colorName: 'Zenex+ Anthracite',
        areaM2: 440,
        trayPanWidthMm: 430,
        calculatedLinearMetres: 1023.3,
        ratePerLm: 42.00,
        totalNZD: 42978.60,
        pitchDegrees: 25,
        notes: 'Engineered for high alpine snow loading and thermal expansion.'
      }
    ],
    flashings: [],
    hardwareItems: [],
    freightItems: [],
    labourItems: [],
    upgrades: [],
    materialTotalNZD: 58000.00,
    flashingsTotalNZD: 14200.00,
    hardwareTotalNZD: 9400.00,
    freightTotalNZD: 2400.00,
    labourTotalNZD: 51652.17,
    costTotalNZD: 105000.00,
    markupAmountNZD: 30652.17,
    markupPercent: 22.0,
    marginPercent: 18.0,
    subtotalNZD: 135652.17,
    gstNZD: 20347.83,
    totalNZD: 156000.00,
    auditTrail: [
      {
        id: 'aud-02-v1-exp',
        timestamp: '2026-09-10T00:00:00Z',
        action: 'expired',
        actor: 'System Automated Rule',
        actorType: 'system',
        details: 'Quote passed 30-day validity window (issued 2026-08-10). Status set to Expired. Accept/Decline locked out.',
        versionNumber: 1
      },
      {
        id: 'aud-02-v1-view',
        timestamp: '2026-08-12T14:15:00Z',
        action: 'viewed',
        actor: 'Hamish Macfarlane (Client)',
        actorType: 'client',
        details: 'Viewed online proposal via secure token link.',
        versionNumber: 1
      },
      {
        id: 'aud-02-v1-crt',
        timestamp: '2026-08-10T11:00:00Z',
        action: 'created',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Initial quote version issued with 30-day price lock.',
        versionNumber: 1
      }
    ]
  },

  // 3. PROJECT 3: ACTIVE SENT QUOTE (VALID - ACCEPT/DECLINE AVAILABLE)
  {
    id: 'quote-03-v1',
    projectId: 'proj-3',
    quoteNumber: 'ARCH-Q-2026-104-v1',
    baseQuoteNumber: 'ARCH-Q-2026-104',
    version: 1,
    versionLabel: 'v1.0 (Active Proposal)',
    revision: 'Rev A',
    status: 'sent',
    isLocked: false,
    issueDate: '2026-10-25',
    validUntil: '2026-11-24',
    createdAt: '2026-10-25',
    expiresAt: '2026-11-24',
    clientToken: 'sec_q03v1_waiheke_active',
    clientName: 'David & Amanda Sterling',
    clientEmail: 'david.sterling@sterlingbrands.co.nz',
    clientPhone: '+64 21 550 9182',
    architect: 'Stevens Lawson Architects',
    siteAddress: '42 Nick Johnstone Drive, Church Bay, Waiheke Island',
    region: 'Auckland / Waiheke',
    windZone: 'Extra High',
    exposureZone: 'Zone D (Severe Marine)',
    accessDifficulty: 'Island Barge Cartage',
    roofAreaM2: 290,
    profile: 'Archtech Super Seam 38mm',
    material: 'The Roofing Store MagnaFlow®',
    colorName: 'MagnaFlow FlaxPod',
    scopeZones: [
      {
        id: 'sz-waiheke-1',
        title: 'Main Roof Trays (MagnaFlow Coastal Marine)',
        application: 'Roofing',
        profile: 'Archtech Super Seam 38mm',
        material: 'The Roofing Store MagnaFlow®',
        colorName: 'MagnaFlow FlaxPod',
        areaM2: 290,
        trayPanWidthMm: 450,
        calculatedLinearMetres: 644.4,
        ratePerLm: 35.00,
        totalNZD: 22554.00,
        pitchDegrees: 5,
        notes: 'Salt spray resistant marine specification for Church Bay cliffside location.'
      }
    ],
    flashings: [],
    hardwareItems: [],
    freightItems: [
      {
        id: 'frt-waiheke',
        description: 'Sealink Vehicular Barge Cartage to Waiheke Island',
        carrier: 'Sealink NZ',
        unit: 'trip',
        quantity: 1,
        costNZD: 950.00,
        sellRateNZD: 1150.00,
        totalNZD: 1150.00
      }
    ],
    labourItems: [],
    upgrades: [],
    materialTotalNZD: 42000.00,
    flashingsTotalNZD: 9800.00,
    hardwareTotalNZD: 6200.00,
    freightTotalNZD: 1850.00,
    labourTotalNZD: 43109.57,
    costTotalNZD: 82000.00,
    markupAmountNZD: 20959.57,
    markupPercent: 20.0,
    marginPercent: 16.7,
    subtotalNZD: 102956.52,
    gstNZD: 15443.48,
    totalNZD: 118400.00,
    auditTrail: [
      {
        id: 'aud-03-v1-sent',
        timestamp: '2026-10-25T15:20:00Z',
        action: 'sent',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Sent official proposal to david.sterling@sterlingbrands.co.nz via unique secure link. Valid through 2026-11-24.',
        versionNumber: 1
      },
      {
        id: 'aud-03-v1-crt',
        timestamp: '2026-10-25T14:00:00Z',
        action: 'created',
        actor: 'Marcus Kuhtze (Staff)',
        actorType: 'staff',
        details: 'Drafted proposal v1.0 following Waiheke Island site survey.',
        versionNumber: 1
      }
    ]
  }
];

export const INITIAL_EMAIL_RULES: EmailAutomationRule[] = [
  {
    id: 'rule-1',
    title: 'Post-Quote 48h Follow-up & Spec Review',
    triggerEvent: 'quote_sent_48h',
    delayHours: 48,
    enabled: true,
    sendCount: 16,
    subjectTemplate: 'Archtech Roofing Specification Follow-up - {{project_name}}',
    bodyTemplate: 'Kia ora {{client_name}},\n\nI hope your week is going well. We sent through the comprehensive architectural proposal and wind zone engineering notes for {{project_name}} on {{site_address}}.\n\nOur quote specifies the {{profile}} system in {{material}} ({{color_name}}), supplied in partnership with The Roofing Store and engineered to meet the NZBC E2/AS1 requirements for {{wind_zone}} wind exposure.\n\nWould you and {{architect}} like to arrange a 15-minute technical review or view physical metal sample swatches at our Auckland workshop?\n\nNgā mihi,\nArchtech Architectural Roofing Team\nwww.archtech.co.nz · Official Installer for The Roofing Store (www.theroofingstore.co.nz)'
  },
  {
    id: 'rule-2',
    title: 'Quote Expiry Notice (7 Days - The Roofing Store Coil Lock)',
    triggerEvent: 'quote_expiring_7d',
    delayHours: 552,
    enabled: true,
    sendCount: 9,
    subjectTemplate: '7-Day Price Lock Reminder: Archtech Roofing Quote for {{project_name}}',
    bodyTemplate: 'Kia ora {{client_name}},\n\nJust a quick courtesy notice regarding Quote #{{quote_number}} for {{project_name}}.\n\nDue to scheduled quarterly price adjustments from our raw material supplier The Roofing Store, our quoted coil allocation and pricing of {{quote_amount}} is guaranteed through to {{expiry_date}}.\n\nYou can review, toggle upgrades, or digitally sign the acceptance directly in your online Archtech client portal.\n\nNgā mihi,\nMarcus Kuhtze | Managing Director\nArchtech Architectural Roofing (www.archtech.co.nz)'
  },
  {
    id: 'rule-3',
    title: 'Post-Site Measure Confirmation & CAD Layout',
    triggerEvent: 'site_measure_completed',
    delayHours: 2,
    enabled: true,
    sendCount: 24,
    subjectTemplate: 'Site Measure Complete: Laser Survey & Substrate Details for {{project_name}}',
    bodyTemplate: 'Kia ora {{client_name}},\n\nOur Archtech site foreman has completed the 3D laser site survey at {{site_address}}. Plywood substrate flatness and roof falls were recorded at {{pitch_degrees}}°.\n\nWe have coordinated with The Roofing Store for master coil slitting. You can follow active milestone updates through your client portal.\n\nBest regards,\nArchtech Field Operations (SiteWise Green Certified)'
  },
  {
    id: 'rule-4',
    title: 'Milestone Progress: Super Seam Completed & QA Review',
    triggerEvent: 'project_qa_completed',
    delayHours: 1,
    enabled: true,
    sendCount: 21,
    subjectTemplate: 'Milestone Achieved: Super Seam Trays Installed at {{project_name}}',
    bodyTemplate: 'Kia ora {{client_name}},\n\nGreat news! Our Archtech installation crew has completed the standing seam trays on {{project_name}}. High-resolution site photographs have been uploaded to your client portal for your viewing.\n\nOur Licensed Building Practitioner (LBP) will perform the final penetration and flashing audit tomorrow prior to lodging the PS3 with council.\n\nNgā mihi,\nArchtech QA & Project Management\nwww.archtech.co.nz'
  }
];

export const INITIAL_OUTBOX: OutboxEmail[] = [
  {
    id: 'out-1',
    ruleTitle: 'Post-Quote 48h Follow-up & Spec Review',
    recipientEmail: 'julian.vance@nzvance.co.nz',
    recipientName: 'Julian Vance',
    subject: 'Archtech Roofing Specification Follow-up - Matakana Coastal Ridge',
    body: 'Kia ora Julian,\n\nI hope your week is going well. We sent through the comprehensive architectural proposal and wind zone engineering notes for Matakana Coastal Ridge...',
    sentAt: '2026-10-04 09:30',
    status: 'opened'
  },
  {
    id: 'out-2',
    ruleTitle: 'Post-Site Measure Confirmation & CAD Layout',
    recipientEmail: 'hmacfarlane@alpineholdings.co.nz',
    recipientName: 'Hamish Macfarlane',
    subject: 'Site Measure Complete: Laser Survey & Substrate Details for Wanaka Lakefront Alpine',
    body: 'Kia ora Hamish,\n\nOur Archtech site foreman has completed the 3D laser site survey at 14 Buchanan Rise, Roys Peninsula, Wanaka...',
    sentAt: '2026-10-10 14:15',
    status: 'clicked'
  },
  {
    id: 'out-3',
    ruleTitle: 'Milestone Progress: Super Seam Completed & QA Review',
    recipientEmail: 'croft.omaha@gmail.com',
    recipientName: 'Dr. Alistair Croft',
    subject: 'Milestone Achieved: Super Seam Trays Installed at Omaha Coastal Dune House',
    body: 'Kia ora Alistair,\n\nGreat news! Our installation crew has completed the standing seam trays on Omaha Coastal Dune House...',
    sentAt: '2026-10-13 16:45',
    status: 'delivered'
  }
];

export const INITIAL_SITE_INSPECTIONS: SiteVisitInspection[] = [
  {
    id: 'insp-1',
    projectId: 'proj-1',
    projectTitle: 'Matakana Coastal Ridge Residence',
    siteAddress: '88 Matakana Valley Road, Matakana Coast',
    inspector: 'Marcus Kuhtze (Archtech LBP 114820)',
    date: '2026-10-12',
    weatherCondition: 'Fine, 18°C, Light NW Breeze',
    windSpeedKmh: 14,
    plywoodMoisturePercent: 13.8,
    checklist: {
      substrateFlatness: true,
      plyMoistureCompliant: true,
      minimumFallVerified: true,
      underlayTensionAndLaps: true,
      expansionClipsCorrectlySpaced: true,
      penetrationUpstandsCompliant: true,
      fallProtectionCertified: true
    },
    notes: 'Substrate moisture is 13.8% (well below 18% limit). Valley gutter pans laid with 150mm laps. Sliding clips from The Roofing Store verified on east pitch.',
    punchListItems: [
      'Ensure temporary edge flashing is weighed down over weekend rain front',
      'Double check soft zinc dressing around plumber solar pipe penetration'
    ]
  }
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Marcus Kuhtze',
    role: 'Managing Director (LBP)',
    accessLayer: 'full',
    lbpNumber: 'BP 114820 (Roofing & Cladding)',
    phone: '+64 21 555 0192',
    email: 'marcus@archtech.co.nz',
    authority: {
      canSignPS3: true,
      canApproveMilestones: true,
      canOrderMaterials: true,
      canConductSiteMeetings: true,
      canLogMeasures: true,
      canManageSnagging: true,
      canEditAuthorities: true
    },
    activeOnSite: true
  },
  {
    id: 'team-2',
    name: 'Tane Williams',
    role: 'Site Foreman',
    accessLayer: 'standard',
    phone: '+64 21 842 9011',
    email: 'tane@archtech.co.nz',
    authority: {
      canSignPS3: false,
      canApproveMilestones: true,
      canOrderMaterials: true,
      canConductSiteMeetings: true,
      canLogMeasures: true,
      canManageSnagging: true,
      canEditAuthorities: false
    },
    activeOnSite: true
  },
  {
    id: 'team-3',
    name: 'Wiremu Henare',
    role: 'Machine / Rollforming Lead',
    accessLayer: 'standard',
    phone: '+64 27 639 4812',
    email: 'wiremu@archtech.co.nz',
    authority: {
      canSignPS3: false,
      canApproveMilestones: false,
      canOrderMaterials: true,
      canConductSiteMeetings: false,
      canLogMeasures: true,
      canManageSnagging: true,
      canEditAuthorities: false
    },
    activeOnSite: false
  },
  {
    id: 'team-4',
    name: 'Lachlan Smith',
    role: 'Installer / Tradesman',
    accessLayer: 'light',
    phone: '+64 22 194 3302',
    email: 'lachlan@archtech.co.nz',
    authority: {
      canSignPS3: false,
      canApproveMilestones: false,
      canOrderMaterials: false,
      canConductSiteMeetings: false,
      canLogMeasures: false,
      canManageSnagging: true,
      canEditAuthorities: false
    },
    activeOnSite: true
  },
  {
    id: 'team-5',
    name: 'Aroha Davis',
    role: 'Project Coordinator',
    accessLayer: 'office',
    phone: '+64 21 488 2910',
    email: 'aroha@archtech.co.nz',
    authority: {
      canSignPS3: false,
      canApproveMilestones: true,
      canOrderMaterials: true,
      canConductSiteMeetings: true,
      canLogMeasures: false,
      canManageSnagging: true,
      canEditAuthorities: false
    },
    activeOnSite: false
  }
];

