import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { SITE_CONFIG } from '@/config/site';
import { Reveal } from '@/components/animators/Reveal';

function HammerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" />
      <path d="m18 15 4-4" />
      <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}

/** Mock commission ticket: the three states a job moves through. */
function CommissionCard() {
  const steps = [
    { label: 'Brief', detail: 'You describe the system you need', done: true },
    { label: 'Scoped', detail: 'Fixed scope, timeline, and quote', done: true },
    { label: 'Shipped', detail: 'Running on your server, source included', done: false },
  ];
  return (
    <div className="rounded-xl border border-border/30 bg-muted/30 p-5 space-y-4">
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>COMMISSION-0042</span>
        <span className="px-2 py-0.5 rounded-full border border-primary/30 text-primary">in progress</span>
      </div>
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
              step.done
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border/50 text-muted-foreground'
            }`}
          >
            {step.done ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <div>
            <div className={`text-sm font-semibold ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </div>
            <div className="text-xs text-muted-foreground">{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The stack, top to bottom, with the library that proves each layer. */
function LayerStack() {
  const layers = [
    { label: 'Developer tooling & APIs', proof: 'Imperat · Synapse', color: '#e11d48' },
    { label: 'Network infrastructure', proof: 'Voxy', color: '#3b82f6' },
    { label: 'Server runtime & UI', proof: 'Lotus', color: '#ec4899' },
    { label: 'Packets & protocol', proof: 'Scofi', color: '#8b5cf6' },
  ];
  return (
    <div className="rounded-xl border border-border/30 bg-muted/30 p-4 space-y-2">
      {layers.map(layer => (
        <div
          key={layer.label}
          className="flex items-center justify-between gap-4 rounded-lg border border-border/30 bg-background/40 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
            <span className="text-sm text-foreground/80">{layer.label}</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground shrink-0">{layer.proof}</span>
        </div>
      ))}
    </div>
  );
}

function StatCards() {
  const { totalStars, docCount, platformCount } = useStats();
  const cards = [
    { value: totalStars, label: 'GitHub stars', suffix: '+' },
    { value: docCount, label: 'Doc pages' },
    { value: platformCount, label: 'Platforms' },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border/30 bg-muted/30 p-4 text-center">
          {c.value !== null ? (
            <>
              <div className="text-2xl font-black text-foreground">{c.value.toLocaleString()}{c.suffix}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </>
          ) : (
            <>
              <div className="h-7 w-14 mx-auto rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-12 mx-auto mt-2 rounded bg-muted/50 animate-pulse" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

interface FeatureRow {
  icon: () => ReactNode;
  title: string;
  description: string;
  cta?: { label: string; href: string; external?: boolean };
  visual: ReactNode;
}

const SECTIONS: FeatureRow[] = [
  {
    icon: HammerIcon,
    title: 'Custom systems, built to order',
    description:
      'Gameplay mechanics, network infrastructure, performance rescues on live servers: we take commissions of any shape and ship them production-ready. You bring the idea; we scope it, build it, and stand behind it after launch.',
    cta: { label: 'Commission us', href: SITE_CONFIG.discordUrl || '#', external: true },
    visual: <CommissionCard />,
  },
  {
    icon: LayersIcon,
    title: 'Every layer of the stack',
    description:
      'From raw packets to player-facing tooling, we have shipped at every level: packet-based rendering in Scofi, full network orchestration in Voxy, menu systems in Lotus, and frameworks that run on Bukkit, Velocity, Minestom, Discord, and the command line.',
    visual: <LayerStack />,
  },
  {
    icon: LibraryIcon,
    title: 'The libraries others build on',
    description:
      'We don\'t just use frameworks, we author them. Imperat, Lotus, and Synapse are adopted by other developers, documented end to end, and maintained in the open. The standard you can inspect is the standard your commission inherits.',
    visual: <StatCards />,
  },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-16" amount={0.5}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            What we build
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Open-source libraries in public, commissioned systems on demand. Same team, same standards.
          </p>
        </Reveal>

        <div className="max-w-5xl mx-auto space-y-20">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const isReversed = i % 2 === 1;
            return (
              // Rows drift in from the side their text sits on, so the zig-zag
              // layout is reinforced by the motion rather than fought by it.
              <Reveal
                key={section.title}
                direction={isReversed ? 'left' : 'right'}
                amount={0.25}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isReversed ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''}`}
              >
                <div className={isReversed ? 'lg:text-right' : ''}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 mb-4 ${isReversed ? 'lg:ml-auto' : ''}`}>
                    <Icon />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4 text-balance">
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-pretty">
                    {section.description}
                  </p>
                  {section.cta && (
                    <a
                      href={section.cta.href}
                      {...(section.cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex items-center gap-2 mt-6 text-primary font-semibold hover:gap-3 transition-all"
                    >
                      {section.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div>
                  {section.visual}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
