import { 
  MasterPricingCatalogue, 
  RoofingProfile, 
  CoilMaterial, 
  FlashingGirthTier,
  PriceBookItem 
} from '../types/crm';

export const INITIAL_PRICING_CATALOGUE: MasterPricingCatalogue = {
  // 1. Roll-Formed & Tray Panels (Price Per Linear Metre)
  profileMaterialPrices: [
    // Archtech Super Seam 38mm
    {
      id: 'pmp-1',
      profile: 'Archtech Super Seam 38mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 34.50,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-2',
      profile: 'Archtech Super Seam 38mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 41.50,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-3',
      profile: 'Archtech Super Seam 38mm',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 45.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-4',
      profile: 'Archtech Super Seam 38mm',
      material: 'UniCote® Lux Architectural Pattern',
      pricePerLm: 43.50,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-5',
      profile: 'Archtech Super Seam 38mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 98.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-6',
      profile: 'Archtech Super Seam 38mm',
      material: 'Terne-Coated Stainless Steel',
      pricePerLm: 110.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-7',
      profile: 'Archtech Super Seam 38mm',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 89.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-8',
      profile: 'Archtech Super Seam 38mm',
      material: 'Weathering Steel (CORTEN)',
      pricePerLm: 66.00,
      defaultPanWidthMm: 450
    },

    // Archtech Angle Seam (90° Fold)
    {
      id: 'pmp-9',
      profile: 'Archtech Angle Seam',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 37.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-10',
      profile: 'Archtech Angle Seam',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 44.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-11',
      profile: 'Archtech Angle Seam',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 94.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-12',
      profile: 'Archtech Angle Seam',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 104.00,
      defaultPanWidthMm: 450
    },

    // Archtech Double Angle Seam
    {
      id: 'pmp-13',
      profile: 'Archtech Double Angle Seam',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 39.50,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-14',
      profile: 'Archtech Double Angle Seam',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 47.00,
      defaultPanWidthMm: 450
    },
    {
      id: 'pmp-15',
      profile: 'Archtech Double Angle Seam',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 99.00,
      defaultPanWidthMm: 450
    },

    // Archtech Interlocking Panels (Wall Cladding)
    {
      id: 'pmp-16',
      profile: 'Archtech Interlocking Panels',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 28.50,
      defaultPanWidthMm: 300 // narrower face width
    },
    {
      id: 'pmp-17',
      profile: 'Archtech Interlocking Panels',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 34.00,
      defaultPanWidthMm: 300
    },
    {
      id: 'pmp-18',
      profile: 'Archtech Interlocking Panels',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 36.50,
      defaultPanWidthMm: 300
    },
    {
      id: 'pmp-19',
      profile: 'Archtech Interlocking Panels',
      material: 'Terne-Coated Stainless Steel',
      pricePerLm: 82.00,
      defaultPanWidthMm: 300
    },

    // Archtech Weatherboard Step Panels
    {
      id: 'pmp-20',
      profile: 'Archtech Weatherboard Step Panels',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 29.50,
      defaultPanWidthMm: 220
    },
    {
      id: 'pmp-21',
      profile: 'Archtech Weatherboard Step Panels',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 35.00,
      defaultPanWidthMm: 220
    },

    // Archtech Flat Lock Panels
    {
      id: 'pmp-22',
      profile: 'Archtech Flat Lock Panels',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 36.00,
      defaultPanWidthMm: 350
    },
    {
      id: 'pmp-23',
      profile: 'Archtech Flat Lock Panels',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 95.00,
      defaultPanWidthMm: 350
    },

    // TRS Corrugate / Plumbdeck 0.55
    {
      id: 'pmp-24',
      profile: 'TRS Corrugate / Plumbdeck 0.55',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 18.50,
      defaultPanWidthMm: 762 // standard sheet cover width
    },
    {
      id: 'pmp-25',
      profile: 'TRS Corrugate / Plumbdeck 0.55',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 22.50,
      defaultPanWidthMm: 762
    }
  ],

  // 2. Flashings Girth Tier Pricing Matrix (Price Per Linear Metre)
  flashingGirthMatrix: [
    // 0-150mm Girth Tier
    {
      id: 'fgm-1',
      girthTier: '0-150mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 18.50,
      extraFoldCostPerLm: 2.50
    },
    {
      id: 'fgm-2',
      girthTier: '0-150mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 22.00,
      extraFoldCostPerLm: 2.50
    },
    {
      id: 'fgm-3',
      girthTier: '0-150mm',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 24.50,
      extraFoldCostPerLm: 2.50
    },
    {
      id: 'fgm-4',
      girthTier: '0-150mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 58.00,
      extraFoldCostPerLm: 4.50
    },
    {
      id: 'fgm-5',
      girthTier: '0-150mm',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 54.00,
      extraFoldCostPerLm: 4.00
    },

    // 151-300mm Girth Tier
    {
      id: 'fgm-6',
      girthTier: '151-300mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 28.50,
      extraFoldCostPerLm: 3.00
    },
    {
      id: 'fgm-7',
      girthTier: '151-300mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 33.50,
      extraFoldCostPerLm: 3.00
    },
    {
      id: 'fgm-8',
      girthTier: '151-300mm',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 36.00,
      extraFoldCostPerLm: 3.00
    },
    {
      id: 'fgm-9',
      girthTier: '151-300mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 88.00,
      extraFoldCostPerLm: 5.50
    },
    {
      id: 'fgm-10',
      girthTier: '151-300mm',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 82.00,
      extraFoldCostPerLm: 5.00
    },

    // 301-450mm Girth Tier
    {
      id: 'fgm-11',
      girthTier: '301-450mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 39.00,
      extraFoldCostPerLm: 3.50
    },
    {
      id: 'fgm-12',
      girthTier: '301-450mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 46.00,
      extraFoldCostPerLm: 3.50
    },
    {
      id: 'fgm-13',
      girthTier: '301-450mm',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 49.50,
      extraFoldCostPerLm: 3.50
    },
    {
      id: 'fgm-14',
      girthTier: '301-450mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 124.00,
      extraFoldCostPerLm: 6.50
    },
    {
      id: 'fgm-15',
      girthTier: '301-450mm',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 115.00,
      extraFoldCostPerLm: 6.00
    },

    // 451-600mm Girth Tier
    {
      id: 'fgm-16',
      girthTier: '451-600mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 52.00,
      extraFoldCostPerLm: 4.00
    },
    {
      id: 'fgm-17',
      girthTier: '451-600mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 59.00,
      extraFoldCostPerLm: 4.00
    },
    {
      id: 'fgm-18',
      girthTier: '451-600mm',
      material: 'The Roofing Store MagnaFlow®',
      pricePerLm: 64.00,
      extraFoldCostPerLm: 4.00
    },
    {
      id: 'fgm-19',
      girthTier: '451-600mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 165.00,
      extraFoldCostPerLm: 8.00
    },
    {
      id: 'fgm-20',
      girthTier: '451-600mm',
      material: 'VMZinc® Anthra-Zinc',
      pricePerLm: 152.00,
      extraFoldCostPerLm: 7.50
    },

    // 601-900mm Girth Tier
    {
      id: 'fgm-21',
      girthTier: '601-900mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 74.00,
      extraFoldCostPerLm: 5.00
    },
    {
      id: 'fgm-22',
      girthTier: '601-900mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 84.00,
      extraFoldCostPerLm: 5.00
    },
    {
      id: 'fgm-23',
      girthTier: '601-900mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 235.00,
      extraFoldCostPerLm: 10.00
    },

    // 901-1200mm Girth Tier
    {
      id: 'fgm-24',
      girthTier: '901-1200mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      pricePerLm: 98.00,
      extraFoldCostPerLm: 6.00
    },
    {
      id: 'fgm-25',
      girthTier: '901-1200mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      pricePerLm: 112.00,
      extraFoldCostPerLm: 6.00
    },
    {
      id: 'fgm-26',
      girthTier: '901-1200mm',
      material: 'Architectural Copper (0.6mm)',
      pricePerLm: 310.00,
      extraFoldCostPerLm: 14.00
    }
  ],

  // 3. Labour Pricing Matrix Rules (Pitch, Height, Access)
  labourMatrixRules: [
    {
      id: 'lmr-1',
      profile: 'Archtech Super Seam 38mm',
      application: 'Roofing',
      baseRatePerM2: 44.00,
      baseRatePerLm: 19.80,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.05,
        steepPitch26to35: 1.25,
        extremePitchOver35: 1.50,
        verticalCladding: 1.35
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.15,
        threeStoreyOrCliff: 1.35
      }
    },
    {
      id: 'lmr-2',
      profile: 'Archtech Super Seam 38mm',
      application: 'Wall Cladding',
      baseRatePerM2: 52.00,
      baseRatePerLm: 23.40,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.0,
        steepPitch26to35: 1.1,
        extremePitchOver35: 1.2,
        verticalCladding: 1.0
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.20,
        threeStoreyOrCliff: 1.45
      }
    },
    {
      id: 'lmr-3',
      profile: 'Archtech Double Angle Seam',
      application: 'Roofing',
      baseRatePerM2: 56.00,
      baseRatePerLm: 25.20,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.08,
        steepPitch26to35: 1.30,
        extremePitchOver35: 1.55,
        verticalCladding: 1.40
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.18,
        threeStoreyOrCliff: 1.40
      }
    },
    {
      id: 'lmr-4',
      profile: 'Archtech Interlocking Panels',
      application: 'Wall Cladding',
      baseRatePerM2: 58.00,
      baseRatePerLm: 17.40,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.0,
        steepPitch26to35: 1.1,
        extremePitchOver35: 1.2,
        verticalCladding: 1.0
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.18,
        threeStoreyOrCliff: 1.40
      }
    },
    {
      id: 'lmr-5',
      profile: 'Archtech Flat Lock Panels',
      application: 'Wall Cladding',
      baseRatePerM2: 68.00,
      baseRatePerLm: 23.80,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.05,
        steepPitch26to35: 1.20,
        extremePitchOver35: 1.35,
        verticalCladding: 1.0
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.25,
        threeStoreyOrCliff: 1.50
      }
    },
    {
      id: 'lmr-6',
      profile: 'TRS Corrugate / Plumbdeck 0.55',
      application: 'Roofing',
      baseRatePerM2: 26.00,
      baseRatePerLm: 19.80,
      pitchFactors: {
        lowPitch3to10: 1.0,
        standardPitch11to25: 1.0,
        steepPitch26to35: 1.20,
        extremePitchOver35: 1.40,
        verticalCladding: 1.20
      },
      accessFactors: {
        singleStorey: 1.0,
        twoStorey: 1.12,
        threeStoreyOrCliff: 1.28
      }
    }
  ],

  // 4. Hardware, Fixings, Underlay & Consumables Catalogue
  hardwareCatalogue: [
    {
      id: 'hwc-1',
      name: 'TRS Super Seam 316 Stainless Sliding Expansion Clips',
      category: 'Clips & Fixings',
      unit: 'boxes (500 pcs)',
      defaultCostNZD: 185.00,
      defaultSellRateNZD: 245.00,
      specification: 'Grade 316 Marine Stainless Steel supplied by The Roofing Store for thermal pan expansion.'
    },
    {
      id: 'hwc-2',
      name: 'TRS Fixed Base Clips for Super Seam & Angle Seam',
      category: 'Clips & Fixings',
      unit: 'boxes (500 pcs)',
      defaultCostNZD: 140.00,
      defaultSellRateNZD: 185.00,
      specification: 'High wind suction restraint for NZS 3604 Extra High Wind zones.'
    },
    {
      id: 'hwc-3',
      name: 'TRS Vapour-Permeable Synthetic Breather Underlay (50m² roll)',
      category: 'Underlay & Membranes',
      unit: 'rolls (50m²)',
      defaultCostNZD: 210.00,
      defaultSellRateNZD: 295.00,
      specification: 'The Roofing Store branded NZBC E2/AS1 Table 23 compliant heavy duty absorbent synthetic.'
    },
    {
      id: 'hwc-4',
      name: 'TRS Structured Drainage Mat Separation Mesh (Copper/Zinc)',
      category: 'Underlay & Membranes',
      unit: 'rolls (30m²)',
      defaultCostNZD: 320.00,
      defaultSellRateNZD: 440.00,
      specification: '8mm polypropylene entangled filament mat for backside condensation drainage.'
    },
    {
      id: 'hwc-5',
      name: 'Kiwicolour Color-Matched EPDM Washer Screws (Class 4)',
      category: 'Fasteners',
      unit: 'tubs (1000 pcs)',
      defaultCostNZD: 95.00,
      defaultSellRateNZD: 135.00,
      specification: 'Mechanical galvanised with UV-stabilized seal matching Kiwicolour / TRS shades.'
    },
    {
      id: 'hwc-6',
      name: 'Archtech Custom Fabricated Internal Box Gutter (316 SS)',
      category: 'Gutters & Downpipes',
      unit: 'metres',
      defaultCostNZD: 110.00,
      defaultSellRateNZD: 165.00,
      specification: 'Archtech workshop folded continuous 250mm trough with integrated emergency overflow spouts.'
    },
    {
      id: 'hwc-7',
      name: 'High-Performance MS Polymer Architectural Sealant',
      category: 'Consumables & Sundries',
      unit: 'cartridges',
      defaultCostNZD: 16.50,
      defaultSellRateNZD: 26.00,
      specification: 'UV-resistant neutral cure sealant for lap joints and flashing upstands.'
    },
    {
      id: 'hwc-8',
      name: 'Ventilated Ridge & Apron Foam Infill Strip',
      category: 'Consumables & Sundries',
      unit: 'metres',
      defaultCostNZD: 12.00,
      defaultSellRateNZD: 18.50,
      specification: 'Permeable insect and ember-proof mesh strip for ridge venting.'
    },
    {
      id: 'hwc-9',
      name: 'Sealed Aluminum Architectural Blind Rivets',
      category: 'Fasteners',
      unit: 'boxes (500 pcs)',
      defaultCostNZD: 42.00,
      defaultSellRateNZD: 65.00,
      specification: 'Water-tight closed end rivets matching coil coating.'
    }
  ],

  // 5. Unified Master Price Book (All Categories, Products & Materials)
  priceBook: [
    // Roll-Formed Profiles
    {
      id: 'pb-rf-1',
      itemCode: 'TRS-SS38-VIT',
      name: 'Archtech Super Seam 38mm (Kiwicolour Vitor+)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 26.50,
      defaultMarkupPercent: 30,
      sellPriceNZD: 34.50,
      profile: 'Archtech Super Seam 38mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: '0.55mm G300 PVDF Architectural standing seam, 450mm tray pan'
    },
    {
      id: 'pb-rf-2',
      itemCode: 'TRS-SS38-ZNX',
      name: 'Archtech Super Seam 38mm (Kiwicolour Zenex+ Coastal)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 32.00,
      defaultMarkupPercent: 30,
      sellPriceNZD: 41.50,
      profile: 'Archtech Super Seam 38mm',
      material: 'Kiwicolour® Zenex+ Extreme Coastal',
      specification: '0.55mm Marine Grade Extreme Coastal standing seam, 450mm tray'
    },
    {
      id: 'pb-rf-3',
      itemCode: 'TRS-SS38-MAG',
      name: 'Archtech Super Seam 38mm (The Roofing Store MagnaFlow®)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 34.50,
      defaultMarkupPercent: 30,
      sellPriceNZD: 45.00,
      profile: 'Archtech Super Seam 38mm',
      material: 'The Roofing Store MagnaFlow®',
      specification: '0.70mm Magnesium-Zinc alloy for severe marine applications'
    },
    {
      id: 'pb-rf-4',
      itemCode: 'TRS-SS38-COP',
      name: 'Archtech Super Seam 38mm (Architectural Copper 0.6mm)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 75.00,
      defaultMarkupPercent: 30,
      sellPriceNZD: 98.00,
      profile: 'Archtech Super Seam 38mm',
      material: 'Architectural Copper (0.6mm)',
      specification: 'Pure architectural natural half-hard copper, 450mm pan'
    },
    {
      id: 'pb-rf-5',
      itemCode: 'TRS-INT-VIT',
      name: 'Archtech Interlocking Panels (Kiwicolour Vitor+ PVDF)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 22.00,
      defaultMarkupPercent: 30,
      sellPriceNZD: 28.50,
      profile: 'Archtech Interlocking Panels',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Secret-fix architectural wall cladding, 300mm cover face with express reveal'
    },
    {
      id: 'pb-rf-6',
      itemCode: 'TRS-ANG-VIT',
      name: 'Archtech Angle Seam (Kiwicolour Vitor+ PVDF)',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 28.50,
      defaultMarkupPercent: 30,
      sellPriceNZD: 37.00,
      profile: 'Archtech Angle Seam',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Architectural single fold facade seam, 450mm width'
    },
    {
      id: 'pb-rf-7',
      itemCode: 'TRS-COR-VIT',
      name: 'TRS Corrugate / Plumbdeck 0.55',
      category: 'Roll-Formed Profiles',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 14.20,
      defaultMarkupPercent: 30,
      sellPriceNZD: 18.50,
      profile: 'TRS Corrugate / Plumbdeck 0.55',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Traditional 762mm corrugated profile in 0.55mm Kiwicolour steel'
    },

    // Folded Flashings
    {
      id: 'pb-fl-1',
      itemCode: 'FL-G0-150-VIT',
      name: 'Folded Flashing Girth 0-150mm (Kiwicolour Vitor+)',
      category: 'Folded Flashings',
      supplier: 'Archtech Workshop / TRS',
      unit: 'lm',
      costPriceNZD: 14.00,
      defaultMarkupPercent: 32,
      sellPriceNZD: 18.50,
      girthTier: '0-150mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Custom folded trims up to 150mm girth, 3 standard folds included'
    },
    {
      id: 'pb-fl-2',
      itemCode: 'FL-G151-300-VIT',
      name: 'Folded Flashing Girth 151-300mm (Kiwicolour Vitor+)',
      category: 'Folded Flashings',
      supplier: 'Archtech Workshop / TRS',
      unit: 'lm',
      costPriceNZD: 21.50,
      defaultMarkupPercent: 32,
      sellPriceNZD: 28.50,
      girthTier: '151-300mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Barge, apron and eaves starter flashings up to 300mm girth'
    },
    {
      id: 'pb-fl-3',
      itemCode: 'FL-G301-450-VIT',
      name: 'Folded Flashing Girth 301-450mm (Kiwicolour Vitor+)',
      category: 'Folded Flashings',
      supplier: 'Archtech Workshop / TRS',
      unit: 'lm',
      costPriceNZD: 29.50,
      defaultMarkupPercent: 32,
      sellPriceNZD: 39.00,
      girthTier: '301-450mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Ventilated ridge cap, wide parapet and valley flashings'
    },
    {
      id: 'pb-fl-4',
      itemCode: 'FL-G451-600-VIT',
      name: 'Folded Flashing Girth 451-600mm (Kiwicolour Vitor+)',
      category: 'Folded Flashings',
      supplier: 'Archtech Workshop / TRS',
      unit: 'lm',
      costPriceNZD: 39.00,
      defaultMarkupPercent: 33,
      sellPriceNZD: 52.00,
      girthTier: '451-600mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Heavy commercial parapet and wide step transition cappings'
    },
    {
      id: 'pb-fl-5',
      itemCode: 'FL-G601-900-VIT',
      name: 'Folded Flashing Girth 601-900mm (Kiwicolour Vitor+)',
      category: 'Folded Flashings',
      supplier: 'Archtech Workshop / TRS',
      unit: 'lm',
      costPriceNZD: 55.00,
      defaultMarkupPercent: 35,
      sellPriceNZD: 74.00,
      girthTier: '601-900mm',
      material: 'Kiwicolour® Vitor+ PVDF (The Roofing Store)',
      specification: 'Internal box gutter linings and architectural fascias up to 900mm'
    },

    // Clips & Fixings
    {
      id: 'pb-cl-1',
      itemCode: 'TRS-CLIP-316S',
      name: 'TRS Super Seam 316 Stainless Sliding Clips (38mm)',
      category: 'Clips & Fixings',
      supplier: 'The Roofing Store Ltd',
      unit: 'boxes (500 pcs)',
      costPriceNZD: 185.00,
      defaultMarkupPercent: 32,
      sellPriceNZD: 245.00,
      specification: 'Grade 316 marine stainless sliding expansion clips for long trays'
    },
    {
      id: 'pb-cl-2',
      itemCode: 'TRS-CLIP-FIX',
      name: 'TRS Fixed Base Restraint Clips (Wind Suction)',
      category: 'Clips & Fixings',
      supplier: 'The Roofing Store Ltd',
      unit: 'boxes (500 pcs)',
      costPriceNZD: 140.00,
      defaultMarkupPercent: 32,
      sellPriceNZD: 185.00,
      specification: 'Fixed anchor clips for ridge and eaves wind suction restraint'
    },
    {
      id: 'pb-cl-3',
      itemCode: 'TRS-CLEAT-CONT',
      name: 'Continuous Starter Galvanised Secret Cleat (0.75mm)',
      category: 'Clips & Fixings',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 9.50,
      defaultMarkupPercent: 35,
      sellPriceNZD: 12.80,
      specification: 'Drip edge and verge engagement hook strip'
    },

    // Underlay & Membranes
    {
      id: 'pb-un-1',
      itemCode: 'TRS-UND-BRTH',
      name: 'TRS Vapour-Permeable Synthetic Breather Underlay',
      category: 'Underlay & Membranes',
      supplier: 'The Roofing Store Ltd',
      unit: 'rolls (50m²)',
      costPriceNZD: 210.00,
      defaultMarkupPercent: 40,
      sellPriceNZD: 295.00,
      specification: 'NZBC E2/AS1 Table 23 compliant non-woven micro-porous membrane'
    },
    {
      id: 'pb-un-2',
      itemCode: 'MEM-SA-HT',
      name: 'Self-Adhesive High-Temp Vapour Barrier Underlay',
      category: 'Underlay & Membranes',
      supplier: 'Thermakraft / Archtech',
      unit: 'rolls (30m²)',
      costPriceNZD: 275.00,
      defaultMarkupPercent: 38,
      sellPriceNZD: 380.00,
      specification: 'SBS rubberized self-healing membrane for eaves and low pitches (<5°)'
    },
    {
      id: 'pb-un-3',
      itemCode: 'MEM-3D-DRAIN',
      name: '3D Mesh Drainage Mat Underlay (Zinc / Copper)',
      category: 'Underlay & Membranes',
      supplier: 'Archtech Special Systems',
      unit: 'rolls (25m²)',
      costPriceNZD: 320.00,
      defaultMarkupPercent: 37,
      sellPriceNZD: 440.00,
      specification: '8mm polypropylene entangled filament mat for backside condensation drainage'
    },

    // Fasteners
    {
      id: 'pb-fa-1',
      itemCode: 'SCR-KC-CL4',
      name: 'Kiwicolour Color-Matched EPDM Washer Screws (Class 4)',
      category: 'Fasteners',
      supplier: 'The Roofing Store Ltd',
      unit: 'tubs (1000 pcs)',
      costPriceNZD: 95.00,
      defaultMarkupPercent: 42,
      sellPriceNZD: 135.00,
      specification: 'Class 4 mechanical galvanised with UV-stabilized seal matching Kiwicolour shades'
    },
    {
      id: 'pb-fa-2',
      itemCode: 'RIV-ALU-COAT',
      name: 'Sealed Aluminum Architectural Blind Rivets',
      category: 'Fasteners',
      supplier: 'The Roofing Store Ltd',
      unit: 'boxes (500 pcs)',
      costPriceNZD: 42.00,
      defaultMarkupPercent: 55,
      sellPriceNZD: 65.00,
      specification: 'Water-tight closed end rivets matching coil coating'
    },
    {
      id: 'pb-fa-3',
      itemCode: 'SCR-SS316-30',
      name: '316 Stainless Substrate Timber Screws (10g x 30mm)',
      category: 'Fasteners',
      supplier: 'Simpson Strong-Tie / TRS',
      unit: 'boxes (500 pcs)',
      costPriceNZD: 68.00,
      defaultMarkupPercent: 40,
      sellPriceNZD: 95.00,
      specification: 'Low profile countersunk head for plywood substrate fixing'
    },

    // Gutters & Downpipes
    {
      id: 'pb-gt-1',
      itemCode: 'GUT-BOX-316',
      name: 'Archtech Custom Fabricated Internal Box Gutter (316 SS)',
      category: 'Gutters & Downpipes',
      supplier: 'Archtech Workshop',
      unit: 'lm',
      costPriceNZD: 110.00,
      defaultMarkupPercent: 50,
      sellPriceNZD: 165.00,
      specification: 'Continuous 250mm trough folded with expansion joints and overflow spouts'
    },
    {
      id: 'pb-gt-2',
      itemCode: 'GUT-SUMP-WEIR',
      name: 'Concealed Rainwater Sump Box & Emergency Overflow Weir',
      category: 'Gutters & Downpipes',
      supplier: 'Archtech Workshop',
      unit: 'each',
      costPriceNZD: 160.00,
      defaultMarkupPercent: 40,
      sellPriceNZD: 225.00,
      specification: 'Heavy gauge 0.8mm folded marine aluminum sump with secondary weir overflow'
    },
    {
      id: 'pb-gt-3',
      itemCode: 'DP-RND-80',
      name: 'Color-Matched Round 80mm Downpipe (3m length)',
      category: 'Gutters & Downpipes',
      supplier: 'The Roofing Store Ltd',
      unit: 'length',
      costPriceNZD: 45.00,
      defaultMarkupPercent: 35,
      sellPriceNZD: 61.00,
      specification: 'Seamless powder-coated round downpipe with concealed stand-off brackets'
    },

    // Consumables & Sundries
    {
      id: 'pb-cs-1',
      itemCode: 'SLT-MS-POLY',
      name: 'High-Performance MS Polymer Architectural Sealant',
      category: 'Consumables & Sundries',
      supplier: 'Sika / Bostik',
      unit: 'cartridges',
      costPriceNZD: 16.50,
      defaultMarkupPercent: 57,
      sellPriceNZD: 26.00,
      specification: 'UV-resistant neutral cure sealant for lap joints and flashing upstands'
    },
    {
      id: 'pb-cs-2',
      itemCode: 'FRP-FOAM-VENT',
      name: 'Ventilated Ridge & Apron Foam Infill Strip',
      category: 'Consumables & Sundries',
      supplier: 'The Roofing Store Ltd',
      unit: 'lm',
      costPriceNZD: 12.00,
      defaultMarkupPercent: 54,
      sellPriceNZD: 18.50,
      specification: 'Permeable insect and ember-proof mesh strip for ridge venting'
    },
    {
      id: 'pb-cs-3',
      itemCode: 'TPE-BUTYL-50',
      name: 'Butyl Waterproof Flashing Lap Tape (50mm x 20m)',
      category: 'Consumables & Sundries',
      supplier: 'Thermakraft / TRS',
      unit: 'rolls',
      costPriceNZD: 28.00,
      defaultMarkupPercent: 40,
      sellPriceNZD: 39.00,
      specification: 'High tack double-sided butyl mastic sealing tape'
    },

    // Freight, Cartage & Logistics
    {
      id: 'pb-fr-1',
      itemCode: 'FRT-TRS-HIAB-AKL',
      name: 'The Roofing Store HIAB Crane Delivery (Auckland Metro)',
      category: 'Freight & Cartage',
      supplier: 'The Roofing Store Logistics',
      unit: 'trip',
      costPriceNZD: 320.00,
      defaultMarkupPercent: 20,
      sellPriceNZD: 385.00,
      specification: 'Hiab crane truck delivery direct to ground or first scaffolding stage'
    },
    {
      id: 'pb-fr-2',
      itemCode: 'FRT-LONG-HAUL-NI',
      name: 'Long-Run Tray Transport & Oversize Escort (North Island)',
      category: 'Freight & Cartage',
      supplier: 'Mainfreight / Specialist Transport',
      unit: 'trip',
      costPriceNZD: 650.00,
      defaultMarkupPercent: 18,
      sellPriceNZD: 770.00,
      specification: 'Long-length transport for continuous trays exceeding 12m'
    },
    {
      id: 'pb-fr-3',
      itemCode: 'FRT-INTER-ISLAND-SI',
      name: 'Inter-Island Freight Transfer (Auckland to Wanaka/Queenstown)',
      category: 'Freight & Cartage',
      supplier: 'Mainfreight Linehaul',
      unit: 'load',
      costPriceNZD: 950.00,
      defaultMarkupPercent: 15,
      sellPriceNZD: 1090.00,
      specification: 'Containerized freight for South Island architectural contracts'
    },
    {
      id: 'pb-fr-4',
      itemCode: 'FRT-CRANE-LIFT',
      name: 'Specialist 20-Tonne Crane Scaffolding Lift',
      category: 'Freight & Cartage',
      supplier: 'Auckland Mobile Crane Co',
      unit: 'hour',
      costPriceNZD: 450.00,
      defaultMarkupPercent: 20,
      sellPriceNZD: 540.00,
      specification: 'Precision boom lift for steep cliffside and multi-storey tray drops'
    },
    {
      id: 'pb-fr-5',
      itemCode: 'FRT-RETURN-PALLET',
      name: 'Site Return, Coil Pallet & Cradle Retrieval',
      category: 'Freight & Cartage',
      supplier: 'The Roofing Store Logistics',
      unit: 'trip',
      costPriceNZD: 180.00,
      defaultMarkupPercent: 20,
      sellPriceNZD: 215.00,
      specification: 'Return collection of TRS coil cradles and timber crating'
    },

    // Labour & Compliance
    {
      id: 'pb-lb-1',
      itemCode: 'LBR-SS38-INST',
      name: 'Archtech Super Seam Roofing Tray Installation',
      category: 'Labour & Compliance',
      supplier: 'Archtech Installation Team',
      unit: 'm2',
      costPriceNZD: 35.00,
      defaultMarkupPercent: 25,
      sellPriceNZD: 44.00,
      specification: 'LBP qualified tray fixing, mechanical seaming, and substrate inspection'
    },
    {
      id: 'pb-lb-2',
      itemCode: 'LBR-CLAD-INST',
      name: 'Archtech Architectural Wall Cladding Installation',
      category: 'Labour & Compliance',
      supplier: 'Archtech Installation Team',
      unit: 'm2',
      costPriceNZD: 45.00,
      defaultMarkupPercent: 29,
      sellPriceNZD: 58.00,
      specification: 'Precision vertical/horizontal interlocking facade panel installation'
    },
    {
      id: 'pb-lb-3',
      itemCode: 'LBR-FL-SEAM',
      name: 'Specialist Flashing Seaming, Box Gutters & Penetrations',
      category: 'Labour & Compliance',
      supplier: 'Archtech Installation Team',
      unit: 'lm',
      costPriceNZD: 16.00,
      defaultMarkupPercent: 37,
      sellPriceNZD: 22.00,
      specification: 'Hand dressing, locked hems, soakers, and valley seams'
    },
    {
      id: 'pb-lb-4',
      itemCode: 'LBR-SAFETY-PS3',
      name: 'SiteWise Green Safety Protocol, Scaffold Tag & LBP PS3 Sign-off',
      category: 'Labour & Compliance',
      supplier: 'Archtech Certified LBP',
      unit: 'lump sum',
      costPriceNZD: 2800.00,
      defaultMarkupPercent: 37,
      sellPriceNZD: 3850.00,
      specification: 'Producer Statement PS3 documentation, QA punch list, and council CCC sign-off'
    }
  ]
};
