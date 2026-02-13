import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PROJECTS } from '@/config/site';

import { DefaultAnimator } from '@/components/animators/DefaultAnimator';

const ANIMATORS: Record<string, any> = {

  DefaultAnimator
};

export function Projects() {
  return (
    <section id="projects" className="py-24 relative perspective-2000">
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Our Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of open-source libraries and tools designed to make development easier.
          </p>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {PROJECTS.filter(p => p.featured).map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: typeof PROJECTS[number], index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const Animator = ANIMATORS[project.hoverAnimator as string] || DefaultAnimator;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="project-card-container relative group rounded-xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* The "Depth" of the entire card cuboid */}
      <div
        className="project-card-depth rounded-xl"
        style={{
          '--project-color': project.color
        } as React.CSSProperties}
      />

      {/* The Front Face of the card that pops out */}
      <div className="project-card-3d relative bg-zinc-950/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden h-full">
        {/* Dynamic Animator Component */}
        <Animator
          isHovered={isHovered}
          mousePosition={{ x: 0, y: 0 }}
          color={project.color}
        />

        <Card className="border-0 bg-transparent h-full relative z-10">
          <CardContent className="p-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border border-white/10 bg-white/5 shadow-2xl"
                style={{
                  color: project.color,
                  boxShadow: `0 0 30px -5px ${project.color}30`
                }}
              >
                {project.emoji}
              </div>

              {project.githubRepo && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full"
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

            {/* Body */}
            <div className="flex-1">
              <h3
                className="text-2xl font-black mb-3 text-foreground group-hover:text-primary transition-colors tracking-tight"
                style={{
                  color: isHovered
                    ? (project.titleHoverColor || undefined)
                    : (project.titleColor || undefined)
                }}
              >
                {project.name}
              </h3>
              <p className="text-muted-foreground text-base leading-relaxed mb-8">
                {project.description}
              </p>
            </div>

            {/* Footer - Classic Modern Button */}
            <div className="pt-4">
              <Link
                to={project.docLink || '#'}
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold transition-all duration-300 hover:bg-primary hover:text-black hover:border-white group/btn"
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

