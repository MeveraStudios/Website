import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PROJECTS } from '@/config/site';
import { Seo } from '@/components/Seo';

export function DocsHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        path="/docs"
        title="Documentation"
        description="Browse documentation for all Mevera Studio projects"
        type="website"
      />
      <Header />
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Documentation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
              Choose a Project
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select a project to view its guides, API references, and documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PROJECTS.map((project) => (
              <Link
                key={project.id}
                to={project.docLink || '#'}
                className="group relative rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_hsl(var(--primary)/0.06)]"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-border/50 bg-muted/50 shrink-0 p-2"
                    style={{ color: project.color }}
                  >
                    <span className="text-2xl">{project.emoji}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Read Documentation
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
