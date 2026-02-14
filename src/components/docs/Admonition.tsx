/**
 * Admonition Component
 * 
 * Renders styled callout boxes for notes, tips, warnings, etc.
 */

import type { ReactNode } from 'react';
import { Info, Lightbulb, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdmonitionProps {
  type?: string;
  children: ReactNode;
  className?: string;
}

const ADMONITION_CONFIG = {
  note: { icon: Info, label: 'Note', className: 'border-blue-500/50 bg-blue-500/10' },
  tip: { icon: Lightbulb, label: 'Tip', className: 'border-green-500/50 bg-green-500/10' },
  info: { icon: Info, label: 'Info', className: 'border-blue-500/50 bg-blue-500/10' },
  warning: { icon: AlertTriangle, label: 'Warning', className: 'border-yellow-500/50 bg-yellow-500/10' },
  danger: { icon: AlertOctagon, label: 'Danger', className: 'border-red-500/50 bg-red-500/10' },
  caution: { icon: AlertTriangle, label: 'Caution', className: 'border-orange-500/50 bg-orange-500/10' },
};

export function Admonition({ type = 'note', children, className }: AdmonitionProps) {
  const config = ADMONITION_CONFIG[type as keyof typeof ADMONITION_CONFIG] || ADMONITION_CONFIG.note;
  const Icon = config.icon;

  return (
    <div className={cn(
      'my-6 rounded-lg border-l-4 p-4',
      config.className,
      className
    )}>
      <div className="flex items-center gap-2 mb-2 font-semibold">
        <Icon className="h-5 w-5" />
        <span>{config.label}</span>
      </div>
      <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export default Admonition;
