/**
 * Documentation Page
 * 
 * Displays documentation content with:
 * - Sidebar navigation
 * - Markdown content rendering
 * - Table of contents
 * - Previous/next navigation
 */

import { Link, useParams, Navigate } from 'react-router-dom';
import { Edit, Calendar, AlertCircle, ChevronRight, Info } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import { MDXRenderer } from '@/components/docs/MDXRenderer';
import { TableOfContents } from '@/components/docs/TableOfContents';
import { DocNavigation } from '@/components/docs/DocNavigation';
import { DocFeedback } from '@/components/docs/DocFeedback';
import { Contributors } from '@/components/docs/Contributors';
import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useDocs, useDocContent, getDocNavigation, getLatestVersion } from '@/lib/docs';
import { SITE_CONFIG, FEATURES, PROJECTS } from '@/config/site';
import { Seo, type Breadcrumb } from '@/components/Seo';
import type { DocCategory, DocFile } from '@/types/docs';

/** Recursively flatten all docs from nested category tree. */
function allDocsFromCategories(cats: DocCategory[]): DocFile[] {
  return cats.flatMap(c => [
    ...(c.docs || []),
    ...(c.children ? allDocsFromCategories(c.children) : []),
  ]);
}

/** Walk category tree to find a category by its path segments. */
function findCategory(cats: DocCategory[], pathParts: string[]): DocCategory | undefined {
  if (pathParts.length === 0) return undefined;
  const [first, ...rest] = pathParts;
  for (const c of cats) {
    const seg = c.categoryPath?.split('/').pop();
    if (seg === first) {
      return rest.length === 0 ? c : findCategory(c.children || [], rest);
    }
  }
  return undefined;
}

/** Build flat path→name map from nested category tree (for breadcrumbs). */
function buildPathNameMap(cats: DocCategory[]): Map<string, string> {
  const map = new Map<string, string>();
  function walk(list: DocCategory[]) {
    for (const c of list) {
      if (c.categoryPath) map.set(c.categoryPath, c.name);
      if (c.children) walk(c.children);
    }
  }
  walk(cats);
  return map;
}

/** Build a doc URL, including category path when present. */
function docUrl(projectId: string, version: string, doc: DocFile): string;
function docUrl(projectId: string, version: string, slug: string, categoryPath?: string): string;
function docUrl(projectId: string, version: string, slugOrDoc: string | DocFile, categoryPath?: string): string {
  if (typeof slugOrDoc === 'object') {
    const doc = slugOrDoc;
    return doc.categoryPath
      ? `/docs/${projectId}/${version}/${doc.categoryPath}/${doc.slug}`
      : `/docs/${projectId}/${version}/${doc.slug}`;
  }
  const slug = slugOrDoc;
  return categoryPath
    ? `/docs/${projectId}/${version}/${categoryPath}/${slug}`
    : `/docs/${projectId}/${version}/${slug}`;
}

export function Docs() {
  const { projectId, version, category, slug } = useParams<{
    projectId: string;
    version: string;
    category: string;
    slug: string;
  }>();

  // Use the hook to get documentation data
  const { projects, isLoaded } = useDocs();

  // Resolve the active project + version up front so we can hand the right
  // version id to the content fetcher (and avoid a second render cycle).
  const projectForFetch = projects.find(p => p.id === projectId);
  const resolvedVersionId = (() => {
    if (!projectForFetch) return version || '';
    if (version && projectForFetch.versions.some(v => v.id === version)) {
      return version;
    }
    return getLatestVersion(projectForFetch)?.id || '';
  })();

  // Fetch the current document content (unconditionally call hooks)
  const { doc, isLoading } = useDocContent(projectId || '', resolvedVersionId, category || '', slug || '');

  // Show loading state while data is being fetched
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 flex items-center justify-center">
            <div className="w-full max-w-4xl mx-auto py-12">
              <div className="flex gap-8 mb-10">
                <div className="hidden lg:block w-64 shrink-0 space-y-3">
                    {[75, 55, 65, 45, 60].map((w, i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-muted rounded w-48 animate-pulse mb-2" />
                  <div className="h-10 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
                </div>
              </div>
            </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Find the current project
  const project = projects.find(p => p.id === projectId);

  // Redirect to first project if project not found
  if (!project) {
    const firstProject = projects[0];
    if (firstProject) {
      const latest = getLatestVersion(firstProject);
      const firstDoc = latest?.categories[0]?.docs[0];
      if (latest && firstDoc) {
        return <Navigate to={docUrl(firstProject.id, latest.id, firstDoc)} replace />;
      }
    }
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-5xl font-bold text-muted-foreground/20 mb-4">404</p>
            <h1 className="text-2xl font-bold mb-2">Page not found</h1>
            <p className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Resolve the active version: use the URL segment when valid, otherwise
  // fall back to the project's latest. Unknown / missing versions trigger
  // a replace-navigation so the URL bar reflects the canonical version.
  const latestVersion = getLatestVersion(project);
  const activeVersion =
    (version && project.versions.find(v => v.id === version)) || latestVersion;

  // Redirect old flat URLs (/docs/:projectId/:version/:slug) to new
  // categorized URLs when the doc is found in the nav data.
  if (!category && slug && activeVersion) {
    const matchedDoc = allDocsFromCategories(activeVersion.categories)
      .find(d => d.slug === slug);
    if (matchedDoc && matchedDoc.categoryPath) {
      return <Navigate to={docUrl(project.id, activeVersion.id, matchedDoc)} replace />;
    }
  }

  if (!activeVersion) {
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Nothing here yet</h1>
            <p className="text-muted-foreground">
              The documentation you&apos;re looking for hasn&apos;t been written yet.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!version || version !== activeVersion.id) {
    const firstDoc = activeVersion.categories[0]?.docs[0];
    const targetSlug = slug || firstDoc?.slug;
    if (targetSlug) {
      const matchedDoc = firstDoc?.slug === targetSlug ? firstDoc : undefined;
      if (matchedDoc) {
        return <Navigate to={docUrl(project.id, activeVersion.id, matchedDoc)} replace />;
      }
      return <Navigate to={`/docs/${project.id}/${activeVersion.id}/${targetSlug}`} replace />;
    }
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Nothing here yet</h1>
            <p className="text-muted-foreground">
              The documentation you&apos;re looking for hasn&apos;t been written yet.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Redirect to first doc when no slug provided.
  if (!slug) {
    const targetCategory = category
      ? findCategory(activeVersion.categories, category.split('/'))
      : undefined;
    const allDocList = targetCategory
      ? allDocsFromCategories([targetCategory])
      : allDocsFromCategories(activeVersion.categories);
    const firstDoc = allDocList[0];
    if (firstDoc) {
      return <Navigate to={docUrl(project.id, activeVersion.id, firstDoc)} replace />;
    }
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Nothing here yet</h1>
            <p className="text-muted-foreground">
              The documentation you&apos;re looking for hasn&apos;t been written yet.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get prev/next navigation within the active version.
  const { prev, next } = getDocNavigation(activeVersion, slug);

  // Docs live in the MeveraDocs/Website repo, so "Edit this page" always
  // targets that repo (not the per-project source repo).
  const editUrl = doc
    ? `${SITE_CONFIG.githubUrl}/edit/main${doc.path}`
    : null;

  // "Report issue" links to the *project's* source repo, so bug reports about
  // a library's behavior land where maintainers will see them.
  const projectMeta = PROJECTS.find(p => p.id === project.id);
  const reportIssueUrl = projectMeta?.githubRepo
    ? `${projectMeta.githubRepo.replace(/\/$/, '')}/issues/new`
    : null;

  const versionedBase = `/docs/${project.id}/${activeVersion.id}`;
  const fullDocUrl = doc ? docUrl(project.id, activeVersion.id, doc) : versionedBase;
  const projectUrl = versionedBase;
  const pathNameMap = doc ? buildPathNameMap(activeVersion.categories) : new Map<string, string>();
  const categoryCrumbs: Breadcrumb[] = doc?.categoryPath
    ? doc.categoryPath.split('/').map((_, i, arr) => {
        const partial = arr.slice(0, i + 1).join('/');
        return {
          name: pathNameMap.get(partial) || partial.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          url: `/docs/${project.id}/${activeVersion.id}/${partial}`,
        };
      })
    : [];
  const breadcrumbs: Breadcrumb[] | undefined = doc
    ? [
        { name: 'Home', url: '/' },
        { name: project.name, url: projectUrl },
        ...categoryCrumbs,
        { name: doc.frontmatter.title, url: fullDocUrl },
      ]
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-docs">
      {doc ? (
        <Seo
          title={`${doc.frontmatter.title} – ${project.name}`}
          description={doc.frontmatter.description || project.description}
          path={fullDocUrl}
          type="article"
          isArticle
          lastUpdated={doc.lastUpdatedAt}
          breadcrumbs={breadcrumbs}
        />
      ) : (
        <Seo
          title={project.name}
          description={project.description}
          path={versionedBase}
        />
      )}
      <Header />

      <div className="flex-1 container mx-auto px-4">
        <div className="flex gap-8 py-8">
          {/* Sidebar Navigation */}
          <Sidebar project={project} version={activeVersion} className="-ml-24" />
          <main id="main-content" className="flex-1 min-w-0 outline-none focus-visible:outline-none" tabIndex={-1}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center mb-6">
              <MobileSidebar project={project} version={activeVersion} />
            </div>

            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-4 bg-muted rounded w-40 animate-pulse mb-6" />
                <div className="h-10 bg-muted rounded w-3/5 animate-pulse mb-4" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-11/12 animate-pulse" />
                <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
              </div>
            ) : !doc ? (
              <div className="py-16">
                <div className="text-center mb-10">
                  <p className="text-6xl font-bold text-muted-foreground/20 mb-4">404</p>
                  <h2 className="text-2xl font-bold mb-2">Page not found</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This documentation page doesn&apos;t exist. Try searching with <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">&larr;&#x2325;K</kbd> or browse the sections below.
                  </p>
                </div>
                <div className="max-w-lg mx-auto">
                  <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
                    Browse {project.name} documentation
                  </p>
                  <div className="space-y-2">
                    {activeVersion.categories.map(cat => {
                      const flatDocs = allDocsFromCategories([cat]);
                      const firstDoc = flatDocs[0];
                      if (!firstDoc) return null;
                      return (
                        <Link
                          key={cat.name}
                          to={docUrl(project.id, activeVersion.id, firstDoc)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">{flatDocs.length} {flatDocs.length === 1 ? 'doc' : 'docs'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div key={slug} className="animate-fadein mx-auto max-w-4xl">
                {/* Document Header */}
                <div className="mb-8">
                  {breadcrumbs && (
                    <div className="flex items-center gap-2 mb-4">
                      <Breadcrumbs items={breadcrumbs} className="flex-1" />
                      {doc.frontmatter.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="end" className="max-w-xs">
                            {doc.frontmatter.description}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="mb-8" />

                {/* Document Content */}
                {doc.extension === '.mdx' ? (
                  <MDXRenderer
                    content={doc.content || ''}
                    projectId={project.id}
                    version={activeVersion.id}
                  />
                ) : (
                  <MarkdownRenderer
                    content={doc.content || ''}
                    projectId={project.id}
                    version={activeVersion.id}
                  />
                )}

                {/* Feedback */}
                <DocFeedback
                  key={`${project.id}/${activeVersion.id}/${doc.slug}`}
                  projectId={project.id}
                  version={activeVersion.id}
                  slug={doc.slug}
                  docTitle={doc.frontmatter.title}
                  docPath={doc.path}
                />

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
                  {FEATURES.lastUpdated && doc.lastUpdatedAt && (
                    <div className="flex items-center gap-1 mr-auto">
                      <Calendar className="h-4 w-4" />
                      <span>Last updated: {new Date(doc.lastUpdatedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 ml-auto">
                    {FEATURES.editPageLinks && editUrl && (
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <a
                          href={editUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit this page
                        </a>
                      </Button>
                    )}

                    {reportIssueUrl && (
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <a
                          href={reportIssueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          aria-label={`Report an issue on ${project.name}'s repository`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          Report issue
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Document Navigation */}
                <DocNavigation
                  prev={prev}
                  next={next}
                  projectId={project.id}
                  version={activeVersion.id}
                />

                {/* Contributors */}
                <Contributors contributors={doc.contributors} />
              </div>
            )}
          </main>

          {/* Table of Contents */}
          {FEATURES.tableOfContents && doc && doc.toc && !isLoading && (
            <TableOfContents key={doc.slug} items={doc.toc} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
