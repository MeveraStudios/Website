/**
 * Table of Contents Component
 * 
 * Displays a sticky table of contents for the current document
 * with smooth scrolling to sections.
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/types/docs';

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Reset activeId when items change (page navigation)
  useEffect(() => {
    setActiveId('');
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = 120; // Matches scroll-mt and header height
      const headingElements = items.map(item => document.getElementById(item.id));
      const isNearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200;
      const effectiveOffset = isNearBottom ? window.innerHeight * 0.75 : offset;

      let active = '';
      let lastVisibleIdx = -1;
      for (let i = 0; i < headingElements.length; i++) {
        const element = headingElements[i];
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top <= effectiveOffset) {
          lastVisibleIdx = i;
        }
      }
      // If at bottom and last heading is not visible, highlight previous
      if (isNearBottom && lastVisibleIdx === items.length - 2) {
        active = items[lastVisibleIdx].id;
      } else if (lastVisibleIdx >= 0) {
        active = items[lastVisibleIdx].id;
      } else {
        active = '';
      }
      setActiveId(active);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('hidden xl:block w-64 shrink-0', className)}>
      <div className="sticky top-24">
        <p className="text-sm font-semibold text-muted-foreground mb-4">
          On this page
        </p>
        <nav className="relative">
          {/* Active indicator line */}
          <div className="absolute left-0 top-0 w-px h-full bg-border" />

          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'relative',
                  item.level === 2 && 'ml-0',
                  item.level === 3 && 'ml-4',
                  item.level === 4 && 'ml-8',
                  item.level === 5 && 'ml-12',
                  item.level === 6 && 'ml-16'
                )}
              >
                {/* Active indicator */}
                <div
                  className={cn(
                    'absolute left-0 top-0 w-px h-full transition-colors',
                    activeId === item.id ? 'bg-primary' : 'bg-transparent'
                  )}
                />

                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    'block py-1 pl-4 text-sm transition-colors',
                    activeId === item.id
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
