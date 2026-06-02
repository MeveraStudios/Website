/**
 * Documentation Page
 * 
 * Displays documentation content with:
 * - Sidebar navigation
 * - Markdown content rendering
 * - Table of contents
 * - Previous/next navigation
 */

import { useParams, Navigate } from 'react-router-dom';
import { Edit, Calendar, AlertCircle } from 'lucide-react';
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
import { SearchDialog } from '@/components/docs/SearchDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDocs, useDocContent, getDocNavigation, getLatestVersion } from '@/lib/docs';
import { SITE_CONFIG, FEATURES, PROJECTS } from '@/config/site';
import { Seo, type Breadcrumb } from '@/components/Seo';

export function Docs() {
  const { projectId, version, slug } = useParams<{
    projectId: string;
    version: string;
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
  const { doc, isLoading } = useDocContent(projectId || '', resolvedVersionId, slug || '');

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
        return <Navigate to={`/docs/${firstProject.id}/${latest.id}/${firstDoc.slug}`} replace />;
      }
    }
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found</div><Footer /></div>;
  }

  // Resolve the active version: use the URL segment when valid, otherwise
  // fall back to the project's latest. Unknown / missing versions trigger
  // a replace-navigation so the URL bar reflects the canonical version.
  const latestVersion = getLatestVersion(project);
  const activeVersion =
    (version && project.versions.find(v => v.id === version)) || latestVersion;

  if (!activeVersion) {
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found for this project</div><Footer /></div>;
  }

  if (!version || version !== activeVersion.id) {
    const firstDoc = activeVersion.categories[0]?.docs[0];
    const targetSlug = slug || firstDoc?.slug;
    if (targetSlug) {
      return <Navigate to={`/docs/${project.id}/${activeVersion.id}/${targetSlug}`} replace />;
    }
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found for this project</div><Footer /></div>;
  }

  // Redirect to first doc in version if no slug provided.
  if (!slug) {
    const firstDoc = activeVersion.categories[0]?.docs[0];
    if (firstDoc) {
      return <Navigate to={`/docs/${project.id}/${activeVersion.id}/${firstDoc.slug}`} replace />;
    }
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found for this project</div><Footer /></div>;
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
  const breadcrumbs: Breadcrumb[] | undefined = doc
    ? [
        { name: 'Home', url: '/' },
        { name: project.name, url: versionedBase },
        ...(doc.category ? [{ name: doc.category, url: versionedBase }] : []),
        { name: doc.frontmatter.title, url: `${versionedBase}/${doc.slug}` },
      ]
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-docs">
      {doc ? (
        <Seo
          title={`${doc.frontmatter.title} – ${project.name}`}
          description={doc.frontmatter.description || project.description}
          path={`${versionedBase}/${doc.slug}`}
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
          <Sidebar project={project} version={activeVersion} />

          {/* Main Content */}
          <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <MobileSidebar project={project} version={activeVersion} />
              <SearchDialog projectId={project.id} />
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex justify-end mb-6">
              <SearchDialog projectId={project.id} />
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
              <div className="py-20 text-center">
                <p className="text-4xl font-bold mb-4">404</p>
                <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
              </div>
            ) : (
              <div key={slug} className="animate-fadein mx-auto max-w-4xl">
                {/* Document Header */}
                <div className="mb-8">
                  {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-4" />}
                  <h1 className="text-4xl font-bold tracking-tight mb-4">
                    {doc.frontmatter.title}
                  </h1>

                  {doc.frontmatter.description && (
                    <p className="text-xl text-muted-foreground">
                      {doc.frontmatter.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                    {FEATURES.lastUpdated && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Last updated: {doc.lastUpdatedAt ? new Date(doc.lastUpdatedAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    )}

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
