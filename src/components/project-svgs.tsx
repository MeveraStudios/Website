import { type SVGProps } from 'react';

type SvgIconProps = SVGProps<SVGSVGElement> & { color: string };

export function ImperatSvg({ color, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="8" y="13" width="32" height="22" rx="3" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="19" r="1.5" fill={color} opacity="0.5" />
      <circle cx="19" cy="19" r="1.5" fill={color} opacity="0.5" />
      <circle cx="24" cy="19" r="1.5" fill={color} opacity="0.5" />
      <path d="M15 28l8 6 11-12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VoxySvg({ color, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="6" y="13" width="12" height="22" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="17" x2="16" y2="17" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="8" y1="25" x2="16" y2="25" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="30" cy="19" r="5" stroke={color} strokeWidth="1.5" />
      <path d="M30 21l-2 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="30" cy="16" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="38" cy="32" r="5" stroke={color} strokeWidth="1.5" />
      <path d="M38 34l-2 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38" cy="29" r="2" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="22" x2="25" y2="19" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <line x1="18" y1="28" x2="33" y2="30" stroke={color} strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

export function LotusSvg({ color, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="10" y="10" width="28" height="28" rx="4" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="22" x2="38" y2="22" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="10" y1="31" x2="38" y2="31" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="22" y1="10" x2="22" y2="38" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="31" y1="10" x2="31" y2="38" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="16" cy="17" r="3" fill={color} opacity="0.6" />
      <circle cx="27" cy="17" r="3" fill={color} opacity="0.3" />
      <circle cx="35" cy="26" r="3" fill={color} opacity="0.4" />
    </svg>
  );
}

export function ScofiSvg({ color, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="8" y="8" width="32" height="32" rx="4" stroke={color} strokeWidth="1.5" />
      <rect x="12" y="13" width="24" height="4" rx="2" fill={color} opacity="0.7" />
      <rect x="12" y="20" width="18" height="4" rx="2" fill={color} opacity="0.5" />
      <rect x="12" y="27" width="12" height="4" rx="2" fill={color} opacity="0.3" />
    </svg>
  );
}

export function SynapseSvg({ color, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="7" stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill={color} opacity="0.5" />
      <circle cx="32" cy="32" r="7" stroke={color} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2.5" fill={color} opacity="0.5" />
      <path d="M21 20l6 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M27 15l-2 5 5 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}
