import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowRight, ExternalLink, Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PROJECTS } from '@/config/site';

import { DefaultAnimator } from '@/components/animators/DefaultAnimator';
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

const FEATURED_CODE = [
  '@RootCommand({"greet"})',
  'public class GreetCommand {',
  '    @Execute',
  '    public void execute(',
  '        Player source,',
  '        @Named("name") String name',
  '    ) {',
  '        source.sendMessage("Hello, " + name + "!");',
  '    }',
  '}',
];

export function Projects() {
  const featured = PROJECTS.filter(p => p.featured);
  const [first, ...rest] = featured;

  return (
    <section id="projects" className="py-24 relative perspective-2000">
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Our Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Frameworks, libraries, and plugins built for the Minecraft ecosystem.
          </p>
        </div>

        {/* Featured Project — full-width bento card */}
        {first && (
          <div className="mb-14">
            <FeaturedProjectCard project={first} />
          </div>
        )}

        {/* Remaining Projects — 2-column grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rest.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedProjectCard({ project }: { project: typeof PROJECTS[number] }) {
  const [isHovered, setIsHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && resolvedTheme === 'light';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="project-card-container relative group rounded-xl"
    >
      <div
        className="project-card-depth rounded-xl"
        style={{ '--project-color': project.color } as React.CSSProperties}
      />

      <div className="project-card-3d relative bg-card dark:bg-zinc-950 rounded-xl border border-border dark:border-white/10 overflow-hidden">
        <Card className="border-0 bg-transparent relative z-10">
          <CardContent className="p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left: Project info */}
              <div className="flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center border border-border dark:border-white/10 bg-muted dark:bg-white/5 shadow-2xl p-2.5"
                    style={{
                      color: project.color,
                      boxShadow: `0 0 30px -5px ${project.color}30`
                    }}
                  >
                    <ProjectIcon projectId={project.id} color={project.color} className="w-full h-full" />
                  </div>

                  {project.githubRepo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="touch-target text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                    >
                      <a
                        href={project.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.name} GitHub`}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </Button>
                  )}
                </div>

                <h3
                  className="text-3xl font-black mb-3 text-foreground group-hover:text-primary transition-colors tracking-tight text-balance"
                  style={{
                    color: isHovered
                      ? (project.titleHoverColor || undefined)
                      : (isLight ? undefined : (project.titleColor || undefined))
                  }}
                >
                  {project.name}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed mb-8">
                  {project.description}
                </p>

                <div className="mt-auto pt-4">
                  <Link
                    to={project.docLink || '#'}
                    className="inline-flex items-center justify-center px-6 py-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary group/btn"
                  >
                    Read Documentation
                    <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right: Code preview */}
              <div className="hidden lg:block">
                <div className="rounded-lg border border-border/40 bg-muted/60 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/40">
                    <Code className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground/60 font-mono">GreetCommand.java</span>
                  </div>
                  <pre className="p-4 m-0 overflow-x-auto">
                    <code className="font-mono text-xs leading-relaxed text-foreground/90">
                      {FEATURED_CODE.map((line, i) => (
                        <div key={i}>
                          <span className="select-none text-muted-foreground/20 mr-3 inline-block w-4 text-right text-[10px]">
                            {i + 1}
                          </span>
                          {line}
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
      className="project-card-container relative group rounded-xl"
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

        <Card className="border-0 bg-transparent h-full relative z-10">
          <CardContent className="p-8 h-full flex flex-col">
            <div className="flex items-start justify-between mb-8">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border border-border dark:border-white/10 bg-muted dark:bg-white/5 shadow-2xl p-2"
                style={{
                  color: project.color,
                  boxShadow: `0 0 30px -5px ${project.color}30`
                }}
              >
                <ProjectIcon projectId={project.id} color={project.color} className="w-full h-full" />
              </div>

              {project.githubRepo && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="touch-target text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                >
                  <a
                    href={project.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.name} GitHub`}
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>

            <div className="flex-1">
              <h3
                className="text-2xl font-black mb-3 text-foreground group-hover:text-primary transition-colors tracking-tight text-balance"
                style={{
                  color: isHovered
                    ? (project.titleHoverColor || undefined)
                    : (isLight ? undefined : (project.titleColor || undefined))
                }}
              >
                {project.name}
              </h3>
              <p className="text-muted-foreground text-base leading-relaxed mb-8">
                {project.description}
              </p>
            </div>

            <div className="pt-4">
              <Link
                to={project.docLink || '#'}
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary group/btn"
              >
                Read Documentation
                <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

