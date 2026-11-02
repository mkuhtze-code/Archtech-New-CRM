import React from 'react';
import { ARCHTECH_LOGOS } from '../constants/branding';

export interface ArchtechLogoProps {
  variant?: 'dark' | 'light' | 'icon' | 'stacked';
  className?: string;
  alt?: string;
  showSubtitle?: boolean;
}

export const ArchtechLogo: React.FC<ArchtechLogoProps> = ({
  variant = 'dark',
  className = '',
  alt = 'Archtech Architectural Roofing & Cladding',
}) => {
  let src: string = ARCHTECH_LOGOS.dark;
  if (variant === 'light') src = ARCHTECH_LOGOS.light;
  else if (variant === 'icon') src = ARCHTECH_LOGOS.icon;
  else if (variant === 'stacked') src = ARCHTECH_LOGOS.stacked;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};
