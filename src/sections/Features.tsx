import { useStats } from '@/hooks/useStats';
import { Reveal } from '@/components/animators/Reveal';

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

const PLATFORMS = [
  'Bukkit', 'BungeeCord', 'Velocity', 'Minestom',
  'JDA (Discord)', 'CLI', 'Hytale', 'Paper',
];

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

const SECTIONS = [
  {
    icon: LayersIcon,
    title: 'Framework-quality engineering',
    description:
      'We design and ship production-grade APIs. Imperat serves developers across the Minecraft ecosystem with extensive documentation, multiplatform adapters, and annotation-driven architecture that proves our engineering standards — the same standards we bring to every contract.',
    visual: <StatCards />,
  },
  {
    icon: GridIcon,
    title: 'Full-stack Minecraft experience',
    description:
      'Bukkit, BungeeCord, Velocity, Minestom — we\'ve shipped across every major server platform. From network management suites (Voxy) to packet-level scoreboard engines (Scofi), we\'ve built at every layer of the Minecraft stack and know the platform inside out.',
    visual: (
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <span
            key={p}
            className="px-3 py-1.5 rounded-lg text-xs font-mono border border-border/30 bg-muted/30 text-muted-foreground"
          >
            {p}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: FileIcon,
    title: 'Documentation as a deliverable',
    description:
      'Every project ships with real documentation — guided walkthroughs, code examples, platform-specific guides, and API references. Not Javadoc dumps, but docs you can actually learn from. That\'s how we build for ourselves, and how we build for you.',
    visual: (
      <div className="rounded-xl border border-border/30 bg-muted/30 p-4 font-mono text-xs space-y-2">
        {[
          'getting-started.mdx',
          'create-your-first-command.mdx',
          'bukkit-platform.md',
          'velocity-platform.md',
          'argument-types.mdx',
          'dependency-injection.mdx',
          'migration-guide.mdx',
        ].map((file, i) => (
          <div key={file} className="flex items-center gap-2 text-muted-foreground">
            <span className="text-primary/40 w-4 text-right">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-foreground/70">{file}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-16" amount={0.5}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Why Mevera
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            We build the kind of software that makes people ask who built it.
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
