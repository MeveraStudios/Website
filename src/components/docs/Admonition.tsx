/**
 * Admonition Component
 * 
 * Renders styled callout boxes for notes, tips, warnings, etc.
 * Supports both predefined types and fully custom colors.
 */

import type { ReactNode } from 'react';
import { Info, Lightbulb, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface AdmonitionProps {
  type?: string;
  title?: string; // Custom display title
  icon?: string | null; // Custom icon name (from lucide-react), emoji/text, or null to hide
  sideColor?: string; // Custom border color (hex)
  bgColor?: string; // Custom background color (hex)
  children: ReactNode;
  className?: string;
}

// Map of icon names to Lucide icon components
const ICON_MAP: Record<string, LucideIcon> = {
  'Info': Info,
  'Lightbulb': Lightbulb,
  'LightBulb': Lightbulb, // Alternative spelling
  'AlertTriangle': AlertTriangle,
  'AlertOctagon': AlertOctagon,
};

const ADMONITION_CONFIG = {
  note: { 
    icon: Info, 
    label: '**Note**', 
    sideColor: 'rgb(59, 130, 246)', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.1)' 
  },
  tip: { 
    icon: Lightbulb, 
    label: '**Tip**', 
    sideColor: 'rgb(34, 197, 94)', // green-500
    bgColor: 'rgba(34, 197, 94, 0.1)' 
  },
  info: { 
    icon: Info, 
    label: '**Info**', 
    sideColor: 'rgb(59, 130, 246)', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.1)' 
  },
  warning: { 
    icon: AlertTriangle, 
    label: '**Warning**', 
    sideColor: 'rgb(234, 179, 8)', // yellow-500
    bgColor: 'rgba(234, 179, 8, 0.1)' 
  },
  danger: { 
    icon: AlertOctagon, 
    label: '**Danger**', 
    sideColor: 'rgb(239, 68, 68)', // red-500
    bgColor: 'rgba(239, 68, 68, 0.1)' 
  },
  caution: { 
    icon: AlertTriangle, 
    label: '**Caution**', 
    sideColor: 'rgb(249, 115, 22)', // orange-500
    bgColor: 'rgba(249, 115, 22, 0.1)' 
  },
};

export function Admonition({ 
  type = 'note', 
  title,
  icon: customIcon,
  sideColor: customSideColor,
  bgColor: customBgColor,
  children, 
  className 
}: AdmonitionProps) {
  const config = ADMONITION_CONFIG[type as keyof typeof ADMONITION_CONFIG] || ADMONITION_CONFIG.note;
  
  // Use custom colors if provided, otherwise use config colors
  const finalSideColor = customSideColor || config.sideColor;
  const finalBgColor = customBgColor || config.bgColor;
  const displayTitle = title || config.label;
  const Icon = config.icon;
  
  // Determine what icon to show
  const showDefaultIcon = customIcon === undefined;
  
  // Check if customIcon is a Lucide icon name
  const CustomIconComponent = typeof customIcon === 'string' ? ICON_MAP[customIcon] : undefined;
  const showLucideIcon = !!CustomIconComponent;
  const showTextIcon = typeof customIcon === 'string' && !CustomIconComponent && customIcon.length > 0;

  return (
    <div 
      className={cn(
        'my-6 rounded-lg border-l-4 p-4',
        className
      )}
      style={{
        borderLeftColor: finalSideColor,
        backgroundColor: finalBgColor
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {showDefaultIcon && <Icon className="h-5 w-5" />}
        {showLucideIcon && <CustomIconComponent className="h-5 w-5" />}
        {showTextIcon && (
          <span className="text-lg leading-none">{customIcon}</span>
        )}
        <div className="inline-block [&>p]:inline [&>p]:m-0 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.9em]">
          <ReactMarkdown>{displayTitle}</ReactMarkdown>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export default Admonition;
