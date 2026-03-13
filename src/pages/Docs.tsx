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
import { Edit, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import { MDXRenderer } from '@/components/docs/MDXRenderer';
import { TableOfContents } from '@/components/docs/TableOfContents';
import { DocNavigation } from '@/components/docs/DocNavigation';
import { SearchDialog } from '@/components/docs/SearchDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDocs, useDocContent, getDocNavigation } from '@/lib/docs';
import { SITE_CONFIG, FEATURES } from '@/config/site';

export function Docs() {
  const { projectId, slug } = useParams<{ projectId: string; slug: string }>();

  // Use the hook to get documentation data
  const { projects, isLoaded } = useDocs();

  // Fetch the current document content (unconditionally call hooks)
  const { doc, isLoading } = useDocContent(projectId || '', slug || '');

  // Show loading state while data is being fetched
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-docs">
        <Header />
        <div className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading documentation...</p>
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
      const firstDoc = firstProject.categories[0]?.docs[0];
      if (firstDoc) {
        return <Navigate to={`/docs/${firstProject.id}/${firstDoc.slug}`} replace />;
      }
    }
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found</div><Footer /></div>;
  }

  // Redirect to first doc in project if no slug provided
  if (!slug) {
    const firstDoc = project.categories[0]?.docs[0];
    if (firstDoc) {
      return <Navigate to={`/docs/${project.id}/${firstDoc.slug}`} replace />;
    }
    return <div className="min-h-screen flex flex-col bg-docs"><Header /><div className="flex-1 flex items-center justify-center">No documentation found for this project</div><Footer /></div>;
  }

  // Get prev/next navigation
  const { prev, next } = getDocNavigation(project, slug);

  // Generate edit URL (fallback if doc not loaded)
  const editUrl = doc 
    ? `${SITE_CONFIG.githubUrl}/edit/main/docs/${project.id}${doc.path.replace(/^\/docs/, '')}`
    : `${SITE_CONFIG.githubUrl}/edit/main/docs/${project.id}/${slug}.md`;

  return (
    <div className="min-h-screen flex flex-col bg-docs">
      <Header />

      <div className="flex-1 container mx-auto px-4">
        <div className="flex gap-8 py-8">
          {/* Sidebar Navigation */}
          <Sidebar project={project} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <MobileSidebar project={project} />
              <SearchDialog />
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex justify-end mb-6">
              <SearchDialog />
            </div>

            {isLoading || !doc ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading page...</p>
              </div>
            ) : (
              <>
                {/* Document Header */}
                <div className="mb-8">
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
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                      </div>
                    )}

                    {FEATURES.editPageLinks && (
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
                  </div>
                </div>

                <Separator className="mb-8" />

                {/* Document Content */}
                {doc.extension === '.mdx' ? (
                  <MDXRenderer content={doc.content || ''} />
                ) : (
                  <MarkdownRenderer content={doc.content || ''} />
                )}

                {/* Document Navigation */}
                <DocNavigation
                  prev={prev}
                  next={next}
                  projectId={project.id}
                />
              </>
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
