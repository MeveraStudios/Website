import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useStats } from '@/hooks/useStats';
import { RevealGroup, RevealItem } from '@/components/animators/Reveal';

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary/60">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary/60">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary/60">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary/60">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

const ICONS = [BookIcon, GridIcon, StarIcon, BoxIcon];

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const current = Math.min(Math.round(increment * step), value);
      setDisplayed(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{displayed.toLocaleString()}{suffix}</span>;
}

export function Stats() {
  const { totalStars, docCount, projectCount, platformCount } = useStats();

  const items = [
    { value: docCount, label: 'Documentation pages', icon: ICONS[0] },
    { value: platformCount, label: 'Platforms supported', icon: ICONS[1] },
    { value: totalStars, label: 'GitHub stars', suffix: '+', icon: ICONS[2] },
    { value: projectCount, label: 'Open-source projects', icon: ICONS[3] },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/*
        Fades in from transparent at both ends. Starting the tint at full
        strength puts a hard horizontal edge at the section boundary, which
        reads as a stray border against the empty space above.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <RevealGroup stagger={0.09} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {items.map((item) => {
              const Icon = item.icon;
              const loaded = item.value !== null;
              return (
                <RevealItem key={item.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 mb-4">
                    <Icon />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-foreground mb-1 tabular-nums">
                    {loaded ? (
                      <AnimatedNumber value={item.value!} suffix={item.suffix} />
                    ) : (
                      <span className="inline-block w-16 h-9 rounded-md bg-muted/50 animate-pulse align-middle" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </RevealItem>
              );
            })}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
