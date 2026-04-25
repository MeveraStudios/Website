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

/**
 * Version switcher — shown only when the project has detected version
 * folders (see `detectVersions` in scripts/precompile-docs.ts).
 *
 * It's intentionally a plain <select> for now: keyboard-accessible by
 * default and renders a native system picker on mobile.
 */
function VersionSwitcher({ project }: { project: DocProject }) {
  const versions = project.versions ?? [];
  if (versions.length <= 1) return null;

  const latest = versions.find(v => v.latest)?.id ?? versions[0].id;

  return (
    <div className="mb-4 px-3">
      <label
        htmlFor={`version-${project.id}`}
        className="block text-xs uppercase tracking-wider text-muted-foreground mb-1"
      >
        Version
      </label>
      <select
        id={`version-${project.id}`}
        defaultValue={latest}
        className="w-full rounded-md border bg-background px-2 py-1 text-sm"
        aria-label={`${project.name} version`}
      >
        {versions.map(v => (
          <option key={v.id} value={v.id}>
            {v.label}
            {v.latest ? ' (latest)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

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
  const regionId = `cat-${projectId}-${category.name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={regionId}
        className="flex items-center gap-1 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        )}
        {category.name}
      </button>

      {expanded && (
        <ul id={regionId} className="ml-4 space-y-1">
          {category.docs.map((doc) => {
            const isActive = doc.slug === currentSlug;
            return (
              <li key={doc.slug}>
                <Link
                  to={`/docs/${projectId}/${doc.slug}`}
                  aria-current={isActive ? 'page' : undefined}
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
    <aside
      aria-label={`${project.name} documentation`}
      className={cn('hidden lg:block w-64 shrink-0', className)}
    >
      <div className="sticky top-24">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="py-2 pr-4">
            {/* Project Header */}
            <div className="mb-6 px-3">
              <Link
                to={`/docs/${project.id}/getting-started`}
                className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
              >
                <span className="text-2xl" aria-hidden="true">{project.meta.emoji}</span>
                <span>{project.name}</span>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>

            <VersionSwitcher project={project} />

            {/* Categories */}
            <nav aria-label="Documentation sections">
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
      </div>
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
                <span className="text-2xl" aria-hidden="true">{project.meta.emoji}</span>
                <span>{project.name}</span>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>

            {/* Categories */}
            <nav aria-label="Documentation sections">
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
                            aria-current={isActive ? 'page' : undefined}
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
