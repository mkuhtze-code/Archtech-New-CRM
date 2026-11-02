/**
 * Archtech Architectural Roofing - High-Precision CAD Vector Plan Sheets
 *
 * Generates clean, crisp architectural SVG plan sheets for PlanMarkupTool,
 * with standard architectural title blocks, grids, dimensions, and detail callouts.
 */

import { ArchitecturalPlan } from '../types/crm';

// High-resolution Vector SVG for Roof Plan (Sheet RC-01)
const ROOF_PLAN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850" style="background:#ffffff; font-family:'Courier New', monospace;">
  <!-- Grid Background -->
  <defs>
    <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
    </pattern>
    <marker id="dimTick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 2 8 L 8 2" stroke="#0f172a" stroke-width="2"/>
    </marker>
  </defs>
  
  <rect width="1200" height="850" fill="#f8fafc"/>
  <rect x="20" y="20" width="1160" height="810" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  <rect x="25" y="25" width="1150" height="800" fill="url(#cadGrid)" stroke="#cbd5e1" stroke-width="1"/>
  
  <!-- Architectural Title Block -->
  <g transform="translate(850, 680)">
    <rect width="320" height="140" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <line x1="0" y1="35" x2="320" y2="35" stroke="#0f172a" stroke-width="1.5"/>
    <line x1="0" y1="70" x2="320" y2="70" stroke="#0f172a" stroke-width="1"/>
    <line x1="0" y1="105" x2="320" y2="105" stroke="#0f172a" stroke-width="1"/>
    <line x1="160" y1="70" x2="160" y2="140" stroke="#0f172a" stroke-width="1"/>
    
    <text x="15" y="24" font-size="14" font-weight="bold" fill="#0f172a">FEARON HAY ARCHITECTS</text>
    <text x="15" y="55" font-size="12" font-weight="bold" fill="#0284c7">MATAKANA RESIDENCE · ROOF PLAN</text>
    
    <text x="15" y="88" font-size="9" fill="#64748b">SCALE @ A1</text>
    <text x="15" y="100" font-size="11" font-weight="bold" fill="#0f172a">1:100 (CALIBRATED)</text>
    
    <text x="175" y="88" font-size="9" fill="#64748b">DATE / STATUS</text>
    <text x="175" y="100" font-size="11" font-weight="bold" fill="#0f172a">OCT 2026 / FOR CONST.</text>
    
    <text x="15" y="123" font-size="9" fill="#64748b">PROJECT NO.</text>
    <text x="15" y="135" font-size="11" font-weight="bold" fill="#0f172a">ARCH-2026-041</text>
    
    <text x="175" y="123" font-size="9" fill="#64748b">SHEET NO.</text>
    <text x="175" y="135" font-size="13" font-weight="bold" fill="#0f172a">RC-01 Rev C</text>
  </g>
  
  <!-- Structural Grid Lines -->
  <!-- Vertical Grids A, B, C, D -->
  <g stroke="#94a3b8" stroke-width="1" stroke-dasharray="8 4">
    <line x1="140" y1="60" x2="140" y2="680"/>
    <line x1="380" y1="60" x2="380" y2="680"/>
    <line x1="620" y1="60" x2="620" y2="680"/>
    <line x1="860" y1="60" x2="860" y2="680"/>
    <!-- Horizontal Grids 1, 2, 3 -->
    <line x1="80" y1="120" x2="900" y2="120"/>
    <line x1="80" y1="360" x2="900" y2="360"/>
    <line x1="80" y1="600" x2="900" y2="600"/>
  </g>
  
  <!-- Grid Bubbles -->
  <g font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">
    <circle cx="140" cy="50" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="140" y="54">A</text>
    <circle cx="380" cy="50" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="380" y="54">B</text>
    <circle cx="620" cy="50" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="620" y="54">C</text>
    <circle cx="860" cy="50" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="860" y="54">D</text>
    
    <circle cx="60" cy="120" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="60" y="124">1</text>
    <circle cx="60" cy="360" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="60" y="364">2</text>
    <circle cx="60" cy="600" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <text x="60" y="604">3</text>
  </g>
  
  <!-- Main Gable & Wing Roof Geometry -->
  <!-- Zone 1: Main North Pitch (Super Seam 38mm @ 5° Fall) -->
  <polygon points="140,120 620,120 620,360 140,360" fill="#e0f2fe" fill-opacity="0.35" stroke="#0f172a" stroke-width="3"/>
  <!-- Zone 2: South Pitch -->
  <polygon points="140,360 620,360 620,600 140,600" fill="#e0f2fe" fill-opacity="0.25" stroke="#0f172a" stroke-width="3"/>
  <!-- Zone 3: East Pavilion Wing (Connecting Valley & Parapet) -->
  <polygon points="620,200 860,200 860,520 620,520" fill="#f0fdf4" fill-opacity="0.4" stroke="#0f172a" stroke-width="3"/>
  
  <!-- Standing Seam Tray Pan Lines (450mm Centers Representation) -->
  <g stroke="#0284c7" stroke-width="1.2" opacity="0.75">
    <!-- North Pitch Trays -->
    <line x1="180" y1="120" x2="180" y2="360"/>
    <line x1="220" y1="120" x2="220" y2="360"/>
    <line x1="260" y1="120" x2="260" y2="360"/>
    <line x1="300" y1="120" x2="300" y2="360"/>
    <line x1="340" y1="120" x2="340" y2="360"/>
    <line x1="380" y1="120" x2="380" y2="360"/>
    <line x1="420" y1="120" x2="420" y2="360"/>
    <line x1="460" y1="120" x2="460" y2="360"/>
    <line x1="500" y1="120" x2="500" y2="360"/>
    <line x1="540" y1="120" x2="540" y2="360"/>
    <line x1="580" y1="120" x2="580" y2="360"/>
    <!-- South Pitch Trays -->
    <line x1="180" y1="360" x2="180" y2="600"/>
    <line x1="220" y1="360" x2="220" y2="600"/>
    <line x1="260" y1="360" x2="260" y2="600"/>
    <line x1="300" y1="360" x2="300" y2="600"/>
    <line x1="340" y1="360" x2="340" y2="600"/>
    <line x1="380" y1="360" x2="380" y2="600"/>
    <line x1="420" y1="360" x2="420" y2="600"/>
    <line x1="460" y1="360" x2="460" y2="600"/>
    <line x1="500" y1="360" x2="500" y2="600"/>
    <line x1="540" y1="360" x2="540" y2="600"/>
    <line x1="580" y1="360" x2="580" y2="600"/>
  </g>
  
  <!-- Architectural Ridge Line (Bold Centerline) -->
  <line x1="130" y1="360" x2="630" y2="360" stroke="#b45309" stroke-width="4"/>
  <text x="380" y="352" font-size="12" font-weight="bold" fill="#b45309" text-anchor="middle">MAIN VENTILATED RIDGE (12.00m)</text>
  
  <!-- Valley Junction Line -->
  <line x1="620" y1="200" x2="620" y2="360" stroke="#059669" stroke-width="3.5" stroke-dasharray="6 2"/>
  <text x="635" y="280" font-size="11" font-weight="bold" fill="#059669">VALLEY GUTTER</text>
  
  <!-- Skylight Opening -->
  <rect x="260" y="200" width="80" height="60" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5"/>
  <line x1="260" y1="200" x2="340" y2="260" stroke="#7c3aed" stroke-width="1"/>
  <line x1="260" y1="260" x2="340" y2="200" stroke="#7c3aed" stroke-width="1"/>
  <text x="300" y="275" font-size="10" font-weight="bold" fill="#7c3aed" text-anchor="middle">VELUX 1200x800</text>
  
  <!-- Chimney Penetration -->
  <rect x="460" y="440" width="60" height="60" fill="#f1f5f9" stroke="#be123c" stroke-width="2.5"/>
  <text x="490" y="475" font-size="9" font-weight="bold" fill="#be123c" text-anchor="middle">CHIMNEY</text>
  
  <!-- Fall Arrows -->
  <g stroke="#0f172a" stroke-width="1.5" fill="#0f172a">
    <line x1="380" y1="280" x2="380" y2="170" marker-end="url(#dimTick)"/>
    <text x="390" y="230" font-size="11" font-weight="bold">FALL 5° (NORTH)</text>
    <line x1="380" y1="440" x2="380" y2="550" marker-end="url(#dimTick)"/>
    <text x="390" y="500" font-size="11" font-weight="bold">FALL 5° (SOUTH)</text>
  </g>
  
  <!-- Reference Calibration Dimension Line (Known 6,000 mm between Grids A and B) -->
  <g stroke="#0f172a" stroke-width="1.8">
    <line x1="140" y1="630" x2="380" y2="630" marker-start="url(#dimTick)" marker-end="url(#dimTick)"/>
    <line x1="140" y1="615" x2="140" y2="645"/>
    <line x1="380" y1="615" x2="380" y2="645"/>
    <text x="260" y="624" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">6000 mm (CALIBRATION DATUM)</text>
    
    <line x1="380" y1="630" x2="620" y2="630" marker-start="url(#dimTick)" marker-end="url(#dimTick)"/>
    <line x1="620" y1="615" x2="620" y2="645"/>
    <text x="500" y="624" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">6000 mm</text>
    
    <!-- Total Building Length -->
    <line x1="140" y1="660" x2="620" y2="660" marker-start="url(#dimTick)" marker-end="url(#dimTick)"/>
    <text x="380" y="654" font-size="13" font-weight="bold" fill="#0284c7" text-anchor="middle">12,000 mm (TOTAL GABLE SPAN)</text>
  </g>
  
  <!-- Compass Rose -->
  <g transform="translate(1080, 100)">
    <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
    <polygon points="0,-24 7,-5 0,0 -7,-5" fill="#0f172a"/>
    <polygon points="0,24 7,5 0,0 -7,5" fill="#94a3b8"/>
    <text x="0" y="-30" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">N</text>
  </g>
</svg>
`)}`;

// High-resolution Vector SVG for Flashing Details (Sheet DT-04)
const FLASHING_DETAILS_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850" style="background:#ffffff; font-family:'Courier New', monospace;">
  <rect width="1200" height="850" fill="#f8fafc"/>
  <rect x="20" y="20" width="1160" height="810" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  
  <!-- Title Block -->
  <g transform="translate(850, 680)">
    <rect width="320" height="140" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <text x="15" y="24" font-size="14" font-weight="bold" fill="#0f172a">ARCHTECH WORKSHOP DETAILS</text>
    <text x="15" y="55" font-size="12" font-weight="bold" fill="#0284c7">E2/AS1 FLASHING JUNCTIONS</text>
    <text x="15" y="100" font-size="11" font-weight="bold" fill="#0f172a">SCALE 1:5 · NZBC E2/AS1</text>
    <text x="175" y="135" font-size="13" font-weight="bold" fill="#0f172a">DT-04 Rev B</text>
  </g>

  <!-- Detail 1: Roof-to-Wall Apron Flashing -->
  <g transform="translate(80, 80)">
    <rect width="480" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="20" y="30" font-size="14" font-weight="bold" fill="#0f172a">DETAIL 1: ROOF TO WALL APRON (E2/AS1 FIG 8)</text>
    <!-- Wall Substrate -->
    <rect x="80" y="60" width="40" height="200" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
    <text x="65" y="150" font-size="10" transform="rotate(-90 65 150)" fill="#7c2d12">TIMBER STUD</text>
    <!-- Roof Plywood Substrate -->
    <polygon points="120,240 420,265 420,285 120,260" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
    <text x="250" y="280" font-size="10" fill="#854d0e">19mm CD PLYWOOD (5° PITCH)</text>
    <!-- Standing Seam Tray Pan -->
    <line x1="150" y1="237" x2="420" y2="260" stroke="#64748b" stroke-width="3"/>
    <!-- Folded Metal Apron Flashing (Vitor+ 0.55mm) -->
    <polyline points="105,70 125,70 125,230 320,246 320,260 330,260" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Callout Notes -->
    <text x="135" y="90" font-size="10" font-weight="bold" fill="#0284c7">150mm UPSTAND (NZBC COMPLIANT)</text>
    <text x="190" y="225" font-size="10" font-weight="bold" fill="#0284c7">120mm COVER OVER TRAYS</text>
    <text x="335" y="255" font-size="10" font-weight="bold" fill="#0284c7">15mm DRIP KICK</text>
  </g>

  <!-- Detail 2: Parapet Capping & Bird-Beak Drip -->
  <g transform="translate(600, 80)">
    <rect width="480" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="20" y="30" font-size="14" font-weight="bold" fill="#0f172a">DETAIL 2: PARAPET CAPPING (NZBC FIG 9)</text>
    <!-- Parapet Wall Top -->
    <rect x="140" y="100" width="200" height="180" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
    <!-- Sloped Timber Capping Plate (5° fall) -->
    <polygon points="130,100 350,85 350,110 130,110" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
    <!-- Folded Metal Capping (MagnaFlow 0.75mm) -->
    <polyline points="115,190 125,180 125,95 355,80 355,165 365,175" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="140" y="70" font-size="10" font-weight="bold" fill="#0284c7">5° CROSS FALL (WATER RUN-OFF)</text>
    <text x="60" y="140" font-size="10" font-weight="bold" fill="#0284c7">70mm SKIRT</text>
    <text x="370" y="130" font-size="10" font-weight="bold" fill="#0284c7">70mm SKIRT</text>
  </g>

  <!-- Detail 3: Internal Box Gutter with Overflow -->
  <g transform="translate(80, 450)">
    <rect width="740" height="340" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="20" y="30" font-size="14" font-weight="bold" fill="#0f172a">DETAIL 3: CONCEALED INTERNAL BOX GUTTER (E2/AS1 FIG 11)</text>
    <!-- Gutter Framing Trough -->
    <path d="M 120 70 L 160 70 L 160 220 L 460 220 L 460 70 L 500 70" fill="none" stroke="#ca8a04" stroke-width="3"/>
    <!-- Folded 316 Marine Stainless Gutter Lining -->
    <polyline points="100,60 150,60 150,210 470,210 470,60 520,60" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Emergency Weir Overflow -->
    <rect x="470" y="140" width="60" height="30" fill="#38bdf8" fill-opacity="0.4" stroke="#0284c7" stroke-width="1.5"/>
    <text x="240" y="160" font-size="12" font-weight="bold" fill="#0284c7">300mm TROUGH WIDTH (MIN 250mm)</text>
    <text x="240" y="180" font-size="10" fill="#64748b">1:100 FALL TO ARCHTECH SUMP DROPPER</text>
    <text x="480" y="130" font-size="10" font-weight="bold" fill="#be123c">EMERGENCY WEIR</text>
  </g>
</svg>
`)}`;

export const SAMPLE_PROJECT_PLANS: ArchitecturalPlan[] = [
  {
    id: 'plan-rc-01',
    title: 'Architectural Roof Plan & Drainage Layout',
    sheetNumber: 'RC-01',
    category: 'Roof Plan',
    fileUrl: ROOF_PLAN_SVG,
    revision: 'Rev C',
    date: '2026-10-18',
    scale: '1:100',
    author: 'Fearon Hay Architects',
    notes: 'Approved for construction. Substrate 19mm CD structural ply. Kiwicolour Vitor+ 450mm tray pans.',
    scaleCalibration: {
      knownDistanceMm: 6000,
      drawingUnits: 0.20, // 240px / 1200px = 0.20
      mmPerDrawingUnit: 30000, // 1.0 unit = 30,000mm
      calibratedAt: '2026-10-20',
      calibratedBy: 'Marcus Kuhtze (LBP)'
    }
  },
  {
    id: 'plan-dt-04',
    title: 'E2/AS1 Flashing Junction Details',
    sheetNumber: 'DT-04',
    category: 'Flashing Details',
    fileUrl: FLASHING_DETAILS_SVG,
    revision: 'Rev B',
    date: '2026-10-14',
    scale: '1:5',
    author: 'Archtech Detailing Desk',
    notes: 'Fabrication workshop folding specification for Aprons, Parapet Cappings and Gutter Trays.',
    scaleCalibration: {
      knownDistanceMm: 1200,
      drawingUnits: 0.30,
      mmPerDrawingUnit: 4000,
      calibratedAt: '2026-10-21',
      calibratedBy: 'Marcus Kuhtze (LBP)'
    }
  }
];
