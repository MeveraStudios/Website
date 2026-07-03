/**
 * Sidebar Component
 *
 * Displays the documentation sidebar with:
 * - Project header
 * - Version switcher (when the project has more than one version)
 * - Category sections + document navigation links
 * - Mobile responsive drawer
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronsUpDown, BookOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/config/site';
import type { DocCategory, DocProject, DocVersion } from '@/types/docs';

/**
 * Version switcher — shown only when the project has detected version
 * folders (see `detectVersionIds` in scripts/precompile-docs.ts).
 *
 * Switching versions navigates to the same slug under the new version when
 * it exists; otherwise lands on the version's first doc.
 */
function VersionSwitcher({ project, version }: { project: DocProject; version: DocVersion }) {
  const versions = project.versions ?? [];
  const navigate = useNavigate();
  const location = useLocation();

  if (versions.length <= 1) return null;

  const currentSlug = location.pathname.split('/').pop() || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    const next = versions.find(v => v.id === nextId);
    if (!next) return;

    const sameSlug = next.categories
      .flatMap(c => c.docs)
      .find(d => d.slug === currentSlug);
    const targetSlug = sameSlug?.slug || next.categories[0]?.docs[0]?.slug;
    if (!targetSlug) return;

    navigate(`/docs/${project.id}/${next.id}/${targetSlug}`);
  };

  return (
    <div className="mb-2 px-4">
      <select
        id={`version-${project.id}`}
        value={version.id}
        onChange={handleChange}
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
  version: DocVersion;
  className?: string;
}

interface CategorySectionProps {
  category: DocCategory;
  currentSlug: string;
  projectId: string;
  versionId: string;
}

const CATEGORY_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
];

function categoryColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return Math.abs(hash) % CATEGORY_COLORS.length;
}

function CategorySection({ category, currentSlug, projectId, versionId }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const regionId = `cat-${projectId}-${versionId}-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
  const dotColor = CATEGORY_COLORS[categoryColorIndex(category.name)];

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={regionId}
        className="flex items-center gap-1 w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
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
                  to={`/docs/${projectId}/${versionId}/${doc.slug}`}
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

export function Sidebar({ project, version, className }: SidebarProps) {
  const location = useLocation();
  const currentSlug = location.pathname.split('/').pop() || '';
  const navigate = useNavigate();

  const navigateToProject = (target: typeof PROJECTS[number]) => {
    navigate(target.docLink || `/docs/${target.id}`);
  };

  return (
    <aside
      aria-label={`${project.name} documentation`}
      className={cn('hidden lg:block w-64 shrink-0', className)}
    >
      <div className="sticky top-24">
        <div className="h-[calc(100vh-8rem)] overflow-y-scroll py-2 pr-4">
          {/* Project Header */}
          <div className="mb-6 px-3">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 w-full rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-colors pl-2 pr-3 py-2 text-left">
                  <span className="text-2xl" aria-hidden="true">{project.meta.emoji}</span>
                  <span className="font-semibold truncate flex-1">{project.name}</span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {PROJECTS.map(p => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => navigateToProject(p)}
                    className={p.id === project.id ? 'bg-muted' : ''}
                  >
                    <span className="mr-2">{p.emoji}</span>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <VersionSwitcher project={project} version={version} />

          {/* Categories */}
          <nav aria-label="Documentation sections">
            {version.categories.map((category) => (
              <CategorySection
                key={category.name}
                category={category}
                currentSlug={currentSlug}
                projectId={project.id}
                versionId={version.id}
              />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

// Mobile Sidebar
export function MobileSidebar({ project, version }: { project: DocProject; version: DocVersion }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentSlug = location.pathname.split('/').pop() || '';
  const navigate = useNavigate();



  const navigateToProject = (target: typeof PROJECTS[number]) => {
    setOpen(false);
    navigate(target.docLink || `/docs/${target.id}`);
  };

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
        <div className="h-full overflow-y-scroll p-6">
            {/* Project Header */}
            <div className="mb-6">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 w-full rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-colors px-3 py-2 text-left">
                    <span className="text-2xl" aria-hidden="true">{project.meta.emoji}</span>
                    <span className="font-semibold truncate flex-1">{project.name}</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {PROJECTS.map(p => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => { setOpen(false); navigateToProject(p); }}
                      className={p.id === project.id ? 'bg-muted' : ''}
                    >
                      <span className="mr-2">{p.emoji}</span>
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <VersionSwitcher project={project} version={version} />

            {/* Categories */}
            <nav aria-label="Documentation sections">
              {version.categories.map((category) => (
                <div key={category.name} className="mb-4">
                  <p className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_COLORS[categoryColorIndex(category.name)]}`} aria-hidden="true" />
                    {category.name}
                  </p>
                  <ul className="ml-4 space-y-1">
                    {category.docs.map((doc) => {
                      const isActive = doc.slug === currentSlug;
                      return (
                        <li key={doc.slug}>
                          <Link
                            to={`/docs/${project.id}/${version.id}/${doc.slug}`}
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
      </SheetContent>
    </Sheet>
  );
}
