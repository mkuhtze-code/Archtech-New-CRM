import React from 'react';
import { RoofingProfile } from '../types/crm';

interface Props {
  profile: RoofingProfile;
  className?: string;
  fillColor?: string;
}

export const ArchitecturalSvgDiagram: React.FC<Props> = ({
  profile,
  className = 'w-full h-24',
  fillColor = '#1e293b',
}) => {
  // 1. Archtech Super Seam 38mm
  if (profile.includes('Super Seam')) {
    return (
      <svg
        viewBox="0 0 340 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Archtech Super Seam 38mm architectural cross-section"
      >
        <line x1="10" y1="68" x2="330" y2="68" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 3" />
        <text x="12" y="80" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Archtech Spec: 19mm CD Ply + Vapour Breather Underlay · NZBC E2/AS1 3° Fall
        </text>

        {/* Super Seam profile pans with concealed fixing clip */}
        <path
          d="M 15 65 L 15 28 Q 15 22 22 22 L 25 22 L 25 65 L 160 65 L 160 28 Q 160 22 168 22 L 172 22 L 172 65 L 310 65"
          stroke={fillColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Concealed fixing clip from The Roofing Store */}
        <rect x="156" y="38" width="7" height="26" fill="#f59e0b" rx="1.5" />
        <line x1="159" y1="65" x2="159" y2="72" stroke="#d97706" strokeWidth="2" />

        {/* Seam cap */}
        <path
          d="M 153 65 L 153 25 Q 153 19 164 19 L 176 19 Q 179 19 179 25 L 179 65"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <text x="188" y="27" fontSize="9" fill="#0284c7" fontWeight="700" fontFamily="JetBrains Mono">
          Archtech Super Seam 38mm
        </text>
        <text x="50" y="58" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Flat Tray Pan (450mm–510mm)
        </text>
      </svg>
    );
  }

  // 2. Archtech Angle Seam or Double Angle Seam
  if (profile.includes('Angle Seam')) {
    const isDouble = profile.includes('Double');
    return (
      <svg
        viewBox="0 0 340 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label={`${profile} architectural cross-section`}
      >
        <line x1="10" y1="68" x2="330" y2="68" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 3" />
        <text x="12" y="80" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Archtech Cladding & Low Pitch System · Pre-painted PVDF / Zinc / Copper
        </text>

        {/* 90-degree Angle Fold Seam */}
        <path
          d="M 20 65 L 150 65 L 150 25 L 162 25 L 162 38 L 158 38 L 158 65 L 305 65"
          stroke={fillColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text x="172" y="28" fontSize="9" fill="#0284c7" fontWeight="700" fontFamily="JetBrains Mono">
          {isDouble ? 'Double Angle Seam' : 'Archtech Angle Seam (90° Fold)'}
        </text>
        <text x="55" y="58" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Facade / Wall Pan
        </text>
      </svg>
    );
  }

  // 3. Archtech Interlocking or Weatherboard Panels
  if (profile.includes('Interlocking') || profile.includes('Weatherboard')) {
    return (
      <svg
        viewBox="0 0 340 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Archtech Interlocking Panels cross-section"
      >
        <line x1="10" y1="68" x2="330" y2="68" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 3" />
        <text x="12" y="80" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Archtech Interlocking Cladding · Concealed Fastener Tongue & Groove Reveal
        </text>

        {/* Interlocking tongue & groove panels */}
        <path
          d="M 20 62 L 140 62 L 140 50 L 155 50 L 155 58 L 165 58 L 165 62 L 290 62"
          stroke={fillColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Overlapping tongue */}
        <path
          d="M 130 54 L 145 54 L 145 62"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <text x="175" y="44" fontSize="9" fill="#0284c7" fontWeight="700" fontFamily="JetBrains Mono">
          Concealed Interlocking Joint
        </text>
        <text x="45" y="52" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
          Flush Reveal Pan (25mm depth)
        </text>
      </svg>
    );
  }

  // 4. Roll Seam / Cap or Flat Lock or TRS Corrugate
  return (
    <svg
      viewBox="0 0 340 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${profile} architectural cross-section`}
    >
      <line x1="10" y1="68" x2="330" y2="68" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="6 3" />
      <path
        d="M 20 62 Q 35 45 50 62 Q 65 79 80 62 Q 95 45 110 62 Q 125 79 140 62 Q 155 45 170 62 Q 185 79 200 62 Q 215 45 230 62 Q 245 79 260 62 Q 275 45 290 62"
        stroke={fillColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <text x="12" y="80" fontSize="8.5" fill="#64748b" fontFamily="JetBrains Mono">
        The Roofing Store Supply · Kiwicolour / UniCote / MagnaFlow · NZBC E2/AS1
      </text>
    </svg>
  );
};
