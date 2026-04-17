'use client';

import { cn } from '@/lib/utils';

interface GavelIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Custom Gavel SVG icon — a proper judge's gavel (thick hammer + thin handle).
 * Designed to look unmistakably like a real courtroom gavel.
 */
export function GavelIcon({ className, style }: GavelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      style={style}
    >
      {/* 
        To avoid looking like a pen, the gavel head must be:
        1. Obviously thicker than the handle
        2. Centered perpendicularly on the handle
      */}
      
      {/* The Handle: Diagonal line from bottom-left up to the middle of the head */}
      <line x1="4" y1="20" x2="14" y2="10" strokeWidth="3" />
      
      {/* The Gavel Head: A very thick cylinder angled across the handle */}
      {/* We use a thick rounded path (strokeWidth=6) so it is bulky like a real gavel */}
      <path d="M10 6 L18 14" strokeWidth="6" strokeLinecap="round" />
      
      {/* The strike lines (action lines) near the head for impact effect */}
      <path d="M19 8 L22 11" strokeWidth="1.5" />
      <path d="M22 6 L17 1" strokeWidth="1.5" />
    </svg>
  );
}
