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
      // Check if we're at the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;

      if (isAtBottom && items.length > 0) {
        setActiveId(items[items.length - 1].id);
        return;
      }

      // Find the heading that is closest to the top of the viewport but still above the offset
      const offset = 120; // Matches scroll-mt and header height
      const headingElements = items.map(item => document.getElementById(item.id));

      let currentActiveId = items[0]?.id || '';

      for (const element of headingElements) {
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top <= offset) {
          currentActiveId = element.id;
        } else {
          // Since headings are in order, we can stop once we find one below the offset
          break;
        }
      }

      setActiveId(currentActiveId);
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
                  item.level === 3 && 'ml-4'
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
