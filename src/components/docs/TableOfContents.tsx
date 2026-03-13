import { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/types/docs';
import { List } from 'lucide-react';

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [highlighterStyle, setHighlighterStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const itemsRef = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  // 1. Intersection Observer for Scroll Tracking
  useEffect(() => {
    const observerOptions = {
      rootMargin: '-40px 0% -20% 0%',
      threshold: [0, 1],
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      setActiveIds((prev) => {
        const newActive = new Set(prev);
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            newActive.add(entry.target.id);
          } else {
            newActive.delete(entry.target.id);
          }
        });
        
        return items
          .filter(item => newActive.has(item.id))
          .map(item => item.id);
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // Tiny delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [items]);

  // Debug for subagent
  useEffect(() => {
    (window as any).__TOC_ACTIVE__ = activeIds;
  }, [activeIds]);

  // 2. Generate SVG Path for the Stepped Marker
  const [coords, setCoords] = useState<{ id: string; x: number; y: number; level: number }[]>([]);

  useEffect(() => {
    const firstId = items[0]?.id;
    if (!firstId) return;
    const navEl = itemsRef.current[firstId]?.closest('nav');
    if (!navEl) return;

    const navRect = navEl.getBoundingClientRect();

    const newCoords = items.map((item) => {
      const el = itemsRef.current[item.id];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        id: item.id,
        x: item.level === 3 ? 11 : 1,
        y: (rect.top - navRect.top) + (rect.height / 2),
        level: item.level
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    if (JSON.stringify(newCoords) !== JSON.stringify(coords)) {
      setCoords(newCoords);
    }
  }, [items, activeIds]);

  const svgPath = useMemo(() => {
    if (coords.length === 0) return '';
    
    let path = '';
    const stepHeight = 12;

    coords.forEach((c, i) => {
      if (i === 0) {
        path += `M${c.x} 0 L${c.x} ${c.y}`;
      } else {
        const prev = coords[i - 1];
        if (prev.level !== c.level) {
          const midY = c.y - (16); // Approximate half-distance between centers
          path += ` L${prev.x} ${midY - (stepHeight / 2)} L${c.x} ${midY + (stepHeight / 2)}`;
        }
        path += ` L${c.x} ${c.y}`;
      }

      if (i === coords.length - 1) {
        path += ` L${c.x} ${c.y + 20}`;
      }
    });

    return path;
  }, [coords]);

  // 3. Update Highlighter Position
  useEffect(() => {
    if (activeIds.length > 0) {
      const firstActive = itemsRef.current[activeIds[0]];
      const lastActive = itemsRef.current[activeIds[activeIds.length - 1]];
      const navEl = firstActive?.closest('nav');

      if (firstActive && lastActive && navEl) {
        const navRect = navEl.getBoundingClientRect();
        const firstRect = firstActive.getBoundingClientRect();
        const lastRect = lastActive.getBoundingClientRect();

        const top = (firstRect.top - navRect.top) + 4;
        const bottom = (lastRect.bottom - navRect.top) - 4;
        const h = bottom - top;

        setHighlighterStyle({
          top,
          height: Math.max(h, 4),
          opacity: 1
        });
        return;
      }
    }
    setHighlighterStyle(s => ({ ...s, opacity: 0 }));
  }, [activeIds, items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  const encodedPath = encodeURIComponent(svgPath);
  const maskUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' stroke='black' stroke-width='1.5' fill='none' %3E%3Cpath d='${encodedPath}' /%3E%3C/svg%3E")`;

  return (
    <div className={cn('hidden xl:block w-64 shrink-0', className)}>
      <div className="sticky top-24 pl-4">
        <div className="flex items-center gap-2 mb-4 text-foreground/80">
          <List className="w-4 h-4" />
          <p className="text-sm font-medium">On this page</p>
        </div>
        
        <nav className="relative">
          {/* The Stepped Masked Track */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-6 bg-border/40 pointer-events-none transition-all duration-300"
            style={{ 
              maskImage: maskUrl,
              WebkitMaskImage: maskUrl,
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat'
            }}
          >
            {/* The Highlighter moving within the mask */}
            <div 
              className="absolute w-full bg-primary transition-all duration-300 ease-in-out"
              style={{
                top: highlighterStyle.top,
                height: highlighterStyle.height,
                opacity: highlighterStyle.opacity,
              }}
            />
          </div>

          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  ref={el => { itemsRef.current[item.id] = el; }}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    'block py-1.5 text-sm transition-colors duration-200',
                    item.level === 2 ? 'pl-6' : 'pl-9',
                    activeIds.includes(item.id)
                      ? 'text-primary'
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
