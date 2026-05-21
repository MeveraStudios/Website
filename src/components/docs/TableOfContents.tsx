import { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/types/docs';
import { List } from 'lucide-react';

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  // 1. Intersection Observer for Scroll Tracking
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [highlighterStyle, setHighlighterStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [tocOffset, setTocOffset] = useState(0);
  const lastActiveIdRef = useRef<string | null>(null);
  const intersectingIdsRef = useRef(new Set<string>());
  const itemsRef = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const navRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observerOptions = {
      rootMargin: '-40px 0% -20% 0%',
      threshold: [0, 1],
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const intersectingIds = intersectingIdsRef.current;

      // Mutate a stable set so we always work with the true current
      // intersection state, not a potentially stale closure over `prev`.
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          intersectingIds.add(entry.target.id);
        } else {
          intersectingIds.delete(entry.target.id);
        }
      });

      // If at (or near) the bottom of the page, always highlight the last header
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (nearBottom && items.length > 0) {
        lastActiveIdRef.current = items[items.length - 1].id;
        setActiveIds([items[items.length - 1].id]);
        return;
      }

      // Keep only ids in our items list, preserving document order.
      const filtered = items
        .filter(item => intersectingIds.has(item.id))
        .map(item => item.id);

      if (filtered.length > 0) {
        lastActiveIdRef.current = filtered[filtered.length - 1];
        setActiveIds(filtered);
        return;
      }

      // Fallback: nothing is currently intersecting (fast scroll, or between
      // two headings). Find the last heading already past the viewport top.
      const scrollPos = window.scrollY + 100;
      for (let i = items.length - 1; i >= 0; i--) {
        const el = document.getElementById(items[i].id);
        if (el && el.offsetTop <= scrollPos) {
          lastActiveIdRef.current = items[i].id;
          setActiveIds([items[i].id]);
          return;
        }
      }

      // Nothing passed yet (top of page) — clear highlight.
      setActiveIds([]);
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

  // 2. Generate SVG Path for the Stepped Marker
  const [coords, setCoords] = useState<{ id: string; x: number; y: number; level: number }[]>([]);

  useEffect(() => {
    const firstId = items[0]?.id;
    if (!firstId) return;
    const newCoords = items.map((item) => {
      const el = itemsRef.current[item.id];
      if (!el) return null;
      return {
        id: item.id,
        x: item.level === 3 ? 11 : 1,
        y: el.offsetTop + (el.offsetHeight / 2),
        level: item.level
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    setCoords(prev => (
      JSON.stringify(newCoords) === JSON.stringify(prev) ? prev : newCoords
    ));
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

      if (firstActive && lastActive) {
        const top = firstActive.offsetTop + 4;
        const bottom = lastActive.offsetTop + lastActive.offsetHeight - 4;
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

  useEffect(() => {
    const activeId = activeIds[activeIds.length - 1];
    const activeEl = activeId ? itemsRef.current[activeId] : null;
    const navEl = navRef.current;
    const contentEl = contentRef.current;
    if (!activeEl || !navEl || !contentEl) return;

    const activeAnchor = Math.max(36, navEl.clientHeight * 0.28);
    const activeTop = activeEl.offsetTop;
    const maxOffset = Math.max(0, contentEl.scrollHeight - navEl.clientHeight);

    setTocOffset(Math.min(Math.max(activeTop - activeAnchor, 0), maxOffset));
  }, [activeIds]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      // Move keyboard focus to the target so subsequent Tab starts there.
      element.setAttribute('tabindex', '-1');
      element.focus({ preventScroll: true });
    }
  };

  if (items.length === 0) return null;

  const encodedPath = encodeURIComponent(svgPath);
  const maskUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' stroke='black' stroke-width='1.5' fill='none' %3E%3Cpath d='${encodedPath}' /%3E%3C/svg%3E")`;

  return (
    <div className={cn('hidden xl:block w-64 shrink-0', className)}>
      <div className="sticky top-24 pl-4 max-h-[calc(100vh-7rem)]">
        <div className="flex items-center gap-2 mb-4 text-foreground/80" id="toc-heading">
          <List className="w-4 h-4" aria-hidden="true" />
          <p className="text-sm font-medium">On this page</p>
        </div>

        <nav
          ref={navRef}
          className="relative max-h-[calc(100vh-10rem)] overflow-hidden pr-2"
          aria-labelledby="toc-heading"
        >
          <div
            ref={contentRef}
            className="relative transition-transform duration-300 ease-in-out"
            style={{ transform: `translateY(-${tocOffset}px)` }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-6 bg-border/40 pointer-events-none transition-all duration-300"
              style={{
                maskImage: maskUrl,
                WebkitMaskImage: maskUrl,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat'
              }}
            >
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
                    aria-current={activeIds.includes(item.id) ? 'location' : undefined}
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
          </div>
        </nav>
      </div>
    </div>
  );
}
