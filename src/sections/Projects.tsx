import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PROJECTS } from '@/config/site';

import { DefaultAnimator } from '@/components/animators/DefaultAnimator';
import { BbbIcon } from '@/components/BbbIcon';
import { PinnedScene } from '@/components/scroll/PinnedScene';
import { DepthLayer } from '@/components/scroll/DepthLayer';
import { ImperatSvg, VoxySvg, LotusSvg, ScofiSvg, SynapseSvg } from '@/components/project-svgs';

const ANIMATORS: Record<string, any> = {
  DefaultAnimator
};

const SVG_BY_PROJECT: Record<string, React.FC<{ color: string; className?: string }>> = {
  Imperat: ImperatSvg,
  Voxy: VoxySvg,
  Lotus: LotusSvg,
  Scofi: ScofiSvg,
  Synapse: SynapseSvg,
};

function ProjectIcon({ projectId, color, className }: { projectId: string; color: string; className?: string }) {
  const Svg = SVG_BY_PROJECT[projectId];
  if (!Svg) return null;
  return <Svg color={color} className={className} />;
}

export function Projects() {
  const featured = PROJECTS.filter(p => p.featured);

  return (
    // Cards land by ~60% of the scene; the rest is dwell, so the finished grid
    // holds on screen for a beat before the page moves on.
    <PinnedScene id="projects" length={1.4} perspective={1800}>
      {progress => (
        <div className="container mx-auto px-4 relative">
          <DepthLayer
            progress={progress}
            range={[0, 0.22]}
            z={-420}
            rotateX={22}
            y={70}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Our Projects
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Frameworks, libraries, and plugins built for the Minecraft ecosystem.
            </p>
          </DepthLayer>

          {/* Cards rise out of depth one after another while the scene is
              pinned; the trailing card links to the full catalogue. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featured.map((project, index) => (
              <DepthLayer
                key={project.id}
                progress={progress}
                range={[0.1 + index * 0.05, 0.38 + index * 0.05]}
                z={-520}
                rotateX={14}
                y={70}
                className="h-full"
              >
                <ProjectCard project={project} index={index} />
              </DepthLayer>
            ))}

            <DepthLayer
              progress={progress}
              range={[0.1 + featured.length * 0.05, 0.38 + featured.length * 0.05]}
              z={-520}
              rotateX={14}
              y={70}
              className="h-full"
            >
              <ViewAllCard />
            </DepthLayer>
          </div>
        </div>
      )}
    </PinnedScene>
  );
}

/** Trailing grid cell: same footprint as a project card, points at the docs. */
function ViewAllCard() {
  return (
    <Link
      to="/docs"
      className="group/all relative flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 dark:bg-zinc-950/40 p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors group-hover/all:border-primary/60 group-hover/all:text-primary">
        <ArrowRight className="h-5 w-5 transition-transform group-hover/all:translate-x-0.5" />
      </div>
      <div className="text-lg font-bold text-foreground">View all projects</div>
      <p className="text-sm text-muted-foreground">Browse every library and its documentation</p>
    </Link>
  );
}


/** Store icons by store id; unknown stores fall back to a generic link icon. */
const STORE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  builtbybit: BbbIcon,
};

const STORE_LABELS: Record<string, string> = {
  builtbybit: 'BuiltByBit',
};

function externalLinks(project: typeof PROJECTS[number]) {
  const links: { href: string; label: string; Icon: React.FC<{ className?: string }> }[] = [];
  if (project.githubRepo) {
    links.push({ href: project.githubRepo, label: `${project.name} GitHub`, Icon: ExternalLink });
  }
  for (const store of project.stores ?? []) {
    links.push({
      href: store.url,
      label: `${project.name} on ${STORE_LABELS[store.id] ?? store.id}`,
      Icon: STORE_ICONS[store.id] ?? ExternalLink,
    });
  }
  return links;
}

function ProjectCard({ project, index }: { project: typeof PROJECTS[number], index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && resolvedTheme === 'light';

  const Animator = ANIMATORS[project.hoverAnimator as string] || DefaultAnimator;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="project-card-container relative group rounded-xl h-full"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className="project-card-depth rounded-xl"
        style={{
          '--project-color': project.color
        } as React.CSSProperties}
      />

      <div className="project-card-3d relative bg-card dark:bg-zinc-950 rounded-xl border border-border dark:border-white/10 overflow-hidden h-full">
        <Animator
          isHovered={isHovered}
          mousePosition={{ x: 0, y: 0 }}
          color={project.color}
        />

        {/* Hairline and corner glow in the project's own colour, so the four
            cards read as four projects rather than four copies of one card. */}
        <div
          className="absolute inset-x-0 top-0 h-px z-10"
          style={{ background: `linear-gradient(90deg, transparent, ${project.color}90, transparent)` }}
        />
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${project.color}14, transparent 70%)` }}
        />

        {/* Stretched overlay makes the whole card the docs link without
            nesting the external anchor inside it. */}
        <Link
          to={project.docLink || '#'}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={`${project.name} documentation`}
        />

        <Card className="border-0 bg-transparent h-full relative">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center border border-border dark:border-white/10 bg-muted dark:bg-white/5 p-2"
                style={{
                  color: project.color,
                  boxShadow: `0 0 24px -6px ${project.color}40`
                }}
              >
                <ProjectIcon projectId={project.id} color={project.color} className="w-full h-full" />
              </div>

              <h3
                className="flex-1 text-xl font-black text-foreground transition-colors tracking-tight"
                style={{
                  color: isHovered
                    ? (project.titleHoverColor || undefined)
                    : (isLight ? undefined : (project.titleColor || undefined))
                }}
              >
                {project.name}
              </h3>

              {externalLinks(project).map(link => (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative z-20 touch-target text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                  >
                    <link.Icon className="h-5 w-5" />
                  </a>
                </Button>
              ))}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {project.description}
            </p>

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {project.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md font-mono text-[11px] border border-border/40 bg-muted/30 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: project.color }}
            >
              Read the docs
              <ArrowRight className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

