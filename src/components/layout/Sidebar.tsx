/**
 * Sidebar Component
 *
 * Displays the documentation sidebar with:
 * - Project header
 * - Version switcher (when the project has more than one version)
 * - Category sections + document navigation links
 * - Mobile responsive drawer
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import type { DocCategory, DocFile, DocProject, DocVersion } from '@/types/docs';

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
  const { slug } = useParams<{ slug?: string }>();

  if (versions.length <= 1) return null;

  const currentSlug = slug || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    const next = versions.find(v => v.id === nextId);
    if (!next) return;

    function flattenDocs(cats: DocCategory[]): DocFile[] {
      return cats.flatMap(c => [
        ...(c.docs || []),
        ...(c.children ? flattenDocs(c.children) : []),
      ]);
    }
    const allNextDocs = flattenDocs(next.categories);
    const sameSlug = allNextDocs.find(d => d.slug === currentSlug);
    const targetDoc = sameSlug || allNextDocs[0];
    if (!targetDoc) return;

    const targetUrl = targetDoc.categoryPath
      ? `/docs/${project.id}/${next.id}/${targetDoc.categoryPath}/${targetDoc.slug}`
      : `/docs/${project.id}/${next.id}/${targetDoc.slug}`;
    navigate(targetUrl);
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
  depth?: number;
  onNavigate?: () => void;
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
  'bg-indigo-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-sky-400',
  'bg-rose-400',
  'bg-violet-400',
  'bg-amber-400',
  'bg-cyan-400',
  'bg-lime-400',
  'bg-fuchsia-400',
  'bg-orange-400',
  'bg-teal-400',
  'bg-indigo-400',
  'bg-pink-400',
  'bg-yellow-400',
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-emerald-400',
  'bg-sky-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-lime-600',
  'bg-fuchsia-600',
  'bg-orange-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-pink-600',
  'bg-yellow-600',
  'bg-red-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-emerald-600',
];

function categoryColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return Math.abs(hash) % CATEGORY_COLORS.length;
}

/**
 * Scroll the sidebar's own scroll container so `el` is visible — but only when
 * it isn't already. Deliberately not `scrollIntoView`, which would also scroll
 * the window and yank the reader away from the doc body.
 */
function revealInSidebar(el: HTMLElement) {
  let container = el.parentElement;
  while (container) {
    const overflowY = getComputedStyle(container).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && container.scrollHeight > container.clientHeight) break;
    container = container.parentElement;
  }
  if (!container) return;

  const elRect = el.getBoundingClientRect();
  const boxRect = container.getBoundingClientRect();
  if (elRect.top >= boxRect.top && elRect.bottom <= boxRect.bottom) return;

  container.scrollTop += elRect.top - boxRect.top - (container.clientHeight - elRect.height) / 2;
}

/** A single doc entry — self-scrolling when it's the active one. */
function DocLink({ doc, to, isActive, onNavigate }: { doc: DocFile; to: string; isActive: boolean; onNavigate?: () => void }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isActive && ref.current) revealInSidebar(ref.current);
  }, [isActive]);

  return (
    <Link
      ref={ref}
      to={to}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'block px-3 py-1.5 rounded-md transition-colors',
        isActive
          ? 'bg-primary/10 text-primary text-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted text-sm',
      )}
    >
      {doc.frontmatter.sidebarLabel || doc.frontmatter.title}
    </Link>
  );
}

/** True when the active doc lives in this category or any of its descendants. */
function containsSlug(category: DocCategory, slug: string): boolean {
  if (!slug) return false;
  if (category.docs?.some(d => d.slug === slug)) return true;
  return category.children?.some(child => containsSlug(child, slug)) ?? false;
}

function CategorySection({ category, currentSlug, projectId, versionId, depth = 0, onNavigate }: CategorySectionProps) {
  const holdsActiveDoc = containsSlug(category, currentSlug);
  const [expanded, setExpanded] = useState(category.collapsed !== true || holdsActiveDoc);

  // Navigating into a collapsed category (search, links, next/prev) opens it.
  // Only forces open — a manual collapse while the doc stays active is kept.
  const [wasHoldingActiveDoc, setWasHoldingActiveDoc] = useState(holdsActiveDoc);
  if (holdsActiveDoc !== wasHoldingActiveDoc) {
    setWasHoldingActiveDoc(holdsActiveDoc);
    if (holdsActiveDoc) setExpanded(true);
  }

  const regionId = `cat-${projectId}-${versionId}-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
  const dotColor = CATEGORY_COLORS[categoryColorIndex(category.name)];
  const hasChildren = category.children && category.children.length > 0;
  const hasDocs = category.docs && category.docs.length > 0;
  const isBranch = hasChildren || hasDocs;

  if (!hasDocs && !hasChildren) return null;

  return (
    <div className={depth > 0 ? '' : 'mb-4'}>
      {/* Category header — only show if it has a name worth showing */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={regionId}
        className={cn(
          'flex items-center gap-1 w-full text-left px-3 py-2 rounded-md transition-colors',
          depth === 0
            ? 'text-sm font-semibold text-muted-foreground hover:text-foreground'
            : 'text-xs font-medium text-muted-foreground/70 hover:text-foreground',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {depth === 0 && (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
        )}
        {isBranch && (
          expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          )
        )}
        {category.name}
      </button>

      {expanded && (
        <div id={regionId}>
          {/* Recursively render child categories */}
          {hasChildren && category.children!.map(child => (
            <CategorySection
              key={child.name}
              category={child}
              currentSlug={currentSlug}
              projectId={projectId}
              versionId={versionId}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
          {/* Render docs in this category */}
          {hasDocs && (
            <ul className="space-y-1" style={{ marginLeft: `${16 + depth * 16}px` }}>
              {category.docs.map((doc) => (
                <li key={doc.slug}>
                  <DocLink
                    doc={doc}
                    to={doc.categoryPath ? `/docs/${projectId}/${versionId}/${doc.categoryPath}/${doc.slug}` : `/docs/${projectId}/${versionId}/${doc.slug}`}
                    isActive={doc.slug === currentSlug}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ project, version, className }: SidebarProps) {
  const { slug } = useParams<{ slug?: string }>();
  const currentSlug = slug || '';
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
  const { slug } = useParams<{ slug?: string }>();
  const currentSlug = slug || '';
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
                <CategorySection
                  key={category.name}
                  category={category}
                  currentSlug={currentSlug}
                  projectId={project.id}
                  versionId={version.id}
                  depth={0}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
