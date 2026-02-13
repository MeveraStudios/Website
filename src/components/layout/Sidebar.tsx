/**
 * Sidebar Component
 * 
 * Displays the documentation sidebar with:
 * - Project selector
 * - Category sections
 * - Document navigation links
 * - Mobile responsive drawer
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, BookOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { DocProject, DocCategory } from '@/types/docs';

interface SidebarProps {
  project: DocProject;
  className?: string;
}

interface CategorySectionProps {
  category: DocCategory;
  currentSlug: string;
  projectId: string;
}

function CategorySection({ category, currentSlug, projectId }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {category.name}
      </button>

      {expanded && (
        <ul className="ml-4 space-y-1">
          {category.docs.map((doc) => {
            const isActive = doc.slug === currentSlug;
            return (
              <li key={doc.slug}>
                <Link
                  to={`/docs/${projectId}/${doc.slug}`}
                  className={cn(
                    'block px-3 py-1.5 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {doc.frontmatter.sidebarLabel || doc.frontmatter.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({ project, className }: SidebarProps) {
  const location = useLocation();
  const currentSlug = location.pathname.split('/').pop() || '';

  return (
    <aside className={cn('hidden lg:block w-64 shrink-0', className)}>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="py-6 pr-4">
          {/* Project Header */}
          <div className="mb-6 px-3">
            <Link
              to={`/docs/${project.id}/getting-started`}
              className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
            >
              <span className="text-2xl">{project.meta.emoji}</span>
              <span>{project.name}</span>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          </div>

          {/* Categories */}
          <nav>
            {project.categories.map((category) => (
              <CategorySection
                key={category.name}
                category={category}
                currentSlug={currentSlug}
                projectId={project.id}
              />
            ))}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}

// Mobile Sidebar
export function MobileSidebar({ project }: { project: DocProject }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentSlug = location.pathname.split('/').pop() || '';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden flex items-center gap-2"
        >
          <Menu className="h-4 w-4" />
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Project Header */}
            <div className="mb-6">
              <Link
                to={`/docs/${project.id}/getting-started`}
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setOpen(false)}
              >
                <span className="text-2xl">{project.meta.emoji}</span>
                <span>{project.name}</span>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>

            {/* Categories */}
            <nav>
              {project.categories.map((category) => (
                <div key={category.name} className="mb-4">
                  <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                    {category.name}
                  </p>
                  <ul className="ml-4 space-y-1">
                    {category.docs.map((doc) => {
                      const isActive = doc.slug === currentSlug;
                      return (
                        <li key={doc.slug}>
                          <Link
                            to={`/docs/${project.id}/${doc.slug}`}
                            className={cn(
                              'block px-3 py-1.5 text-sm rounded-md transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                            onClick={() => setOpen(false)}
                          >
                            {doc.frontmatter.sidebarLabel || doc.frontmatter.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
