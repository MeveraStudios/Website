/**
 * Documentation loading utilities
 * 
 * This module loads precompiled documentation data from static JSON files
 * generated at build time by scripts/precompile-docs.ts
 */

import { useState, useEffect } from 'react';
import type { DocFile, DocProject, TocItem, Header } from '@/types/docs';
import { buildHeaderTree, flattenHeaderTree } from './utils';

// Type for cached documentation navigation data
interface CachedDocsNavData {
  projects: DocProject[];
  generatedAt?: string;
}

// Cached data for content chunks
const docContentCache = new Map<string, DocFile>();

// Cached navigation data
let cachedDocsNavData: CachedDocsNavData | null = null;
let isNavLoading = false;
let navLoadPromise: Promise<void> | null = null;
const listeners: Array<() => void> = [];

/**
 * Subscribe to data loading events
 */
function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Notify all subscribers that data has loaded
 */
function notifySubscribers() {
  listeners.forEach(callback => callback());
}

/**
 * Load lightweight precompiled documentation navigation data
 */
async function loadDocsNavData(): Promise<CachedDocsNavData> {
  if (cachedDocsNavData) return cachedDocsNavData;

  if (isNavLoading && navLoadPromise) {
    await navLoadPromise;
    return cachedDocsNavData!;
  }

  isNavLoading = true;
  navLoadPromise = (async () => {
    try {
      const response = await fetch('/docs-nav.json');
      if (!response.ok) {
        throw new Error(`Failed to load docs nav data: ${response.statusText}`);
      }
      cachedDocsNavData = await response.json();
      notifySubscribers();
    } catch (error) {
      console.error('Error loading navigation data:', error);
      cachedDocsNavData = { projects: [] };
      notifySubscribers();
    } finally {
      isNavLoading = false;
    }
  })();

  await navLoadPromise;
  return cachedDocsNavData!;
}

/**
 * Fetch a specific document's detailed content
 */
export async function fetchDocContent(projectId: string, slug: string): Promise<DocFile | null> {
  const cacheKey = `${projectId}/${slug}`;
  if (docContentCache.has(cacheKey)) {
    return docContentCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`/docs-content/${projectId}/${slug}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load document content for ${slug}`);
    }
    const docData: DocFile = await response.json();
    docContentCache.set(cacheKey, docData);
    return docData;
  } catch (error) {
    console.error(`Error fetching document ${slug}:`, error);
    return null;
  }
}

/**
 * React hook to use documentation navigation data
 */
export function useDocs() {
  const [projects, setProjects] = useState<DocProject[]>(() => {
    return cachedDocsNavData?.projects || [];
  });
  const [isLoaded, setIsLoaded] = useState(() => cachedDocsNavData !== null);

  useEffect(() => {
    if (cachedDocsNavData) {
      setProjects(cachedDocsNavData.projects);
      setIsLoaded(true);
      return;
    }

    const unsubscribe = subscribe(() => {
      if (cachedDocsNavData) {
        setProjects(cachedDocsNavData.projects);
        setIsLoaded(true);
      }
    });

    loadDocsNavData().catch(console.error);

    return unsubscribe;
  }, []);

  return { projects, isLoaded };
}

/**
 * React hook to fetch and provide a specific document's content
 */
export function useDocContent(projectId: string, slug: string) {
  const cacheKey = `${projectId}/${slug}`;
  const cached = docContentCache.get(cacheKey) ?? null;

  const [doc, setDoc] = useState<DocFile | null>(cached);
  const [isLoading, setIsLoading] = useState(cached === null);

  useEffect(() => {
    if (!projectId || !slug) return;

    // Already in cache — nothing to do
    const cacheKey = `${projectId}/${slug}`;
    if (docContentCache.has(cacheKey)) {
      setDoc(docContentCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    fetchDocContent(projectId, slug).then((content) => {
      if (isMounted) {
        setDoc(content);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [projectId, slug]);

  return { doc, isLoading };
}

/**
 * Extract table of contents from markdown content
 * This function is kept for runtime TOC generation if needed
 */
export function extractToc(content: string): { items: TocItem[]; headers: Map<string, Header> } {
  // Build the header tree, then flatten it for the TOC and headers map.
  // Both the renderers and this function derive IDs from the same tree,
  // guaranteeing the DOM IDs always match the TOC.
  const tree = buildHeaderTree(content);
  const flat = flattenHeaderTree(tree);

  const headers = new Map<string, Header>();
  const toc: TocItem[] = [];

  for (const item of flat) {
    headers.set(item.id, {
      id: item.id,
      link: `#${item.id}`,
      display: item.text,
    });
    toc.push({ level: item.level, text: item.text, id: item.id });
  }

  return { items: toc, headers };
}

/**
 * Parse all documentation (synchronous, legacy API)
 * Note: Use useDocs() hook in React components instead
 */
export function parseDocs(): DocProject[] {
  // For SSR/initial render, return empty array
  if (typeof window === 'undefined') {
    return [];
  }

  // If data is already cached, return it synchronously
  if (cachedDocsNavData) {
    return cachedDocsNavData.projects;
  }

  // Trigger async load
  loadDocsNavData().catch(console.error);

  return [];
}

/**
 * Get a specific document from the loaded docContentCache OR basic nav info
 */
export function getDoc(projectId: string, slug: string): DocFile | undefined {
  const cacheKey = `${projectId}/${slug}`;
  if (docContentCache.has(cacheKey)) {
    return docContentCache.get(cacheKey);
  }

  // Fall back to finding the nav item
  if (!cachedDocsNavData) return undefined;

  const project = cachedDocsNavData.projects.find(p => p.id === projectId);
  if (!project) return undefined;

  for (const cat of project.categories) {
    const doc = cat.docs.find(d => d.slug === slug);
    if (doc) return doc;
  }

  return undefined;
}

/**
 * Get all navigation items for a project
 */
export function getProjectNav(project: DocProject): { label: string; href: string; category: string }[] {
  const nav: { label: string; href: string; category: string }[] = [];

  project.categories.forEach(category => {
    category.docs.forEach(doc => {
      nav.push({
        label: doc.frontmatter.sidebarLabel || doc.frontmatter.title,
        href: `/docs/${project.id}/${doc.slug}`,
        category: category.name
      });
    });
  });

  return nav;
}

/**
 * Search through all documentation using the search index directly
 */
let searchIndexCache: { title: string; content: string; href: string; project: string }[] | null = null;
let isSearchIndexLoading = false;

export async function fetchSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  if (isSearchIndexLoading) return []; // Avoid parallel disjoint fetched, or return empty temp

  isSearchIndexLoading = true;
  try {
    const res = await fetch('/search-index.json');
    if (res.ok) {
      searchIndexCache = await res.json();
    }
  } catch (e) {
    console.error("Failed to load search index", e);
  } finally {
    isSearchIndexLoading = false;
  }
  return searchIndexCache || [];
}

export async function searchDocs(query: string) {
  const indexCache = await fetchSearchIndex();

  if (!indexCache || indexCache.length === 0) {
    return [];
  }

  const results: { title: string; excerpt: string; href: string; project: string }[] = [];
  const lowerQuery = query.toLowerCase();

  indexCache.forEach(doc => {
    const content = doc.content.toLowerCase();
    const title = doc.title.toLowerCase();

    if (title.includes(lowerQuery) || content.includes(lowerQuery)) {
      const index = content.indexOf(lowerQuery);
      const safeIndex = index !== -1 ? index : 0;
      const start = Math.max(0, safeIndex - 50);
      const end = Math.min(content.length, safeIndex + query.length + 100);
      const excerpt = doc.content.slice(start, end).replace(/[#*`]/g, '');

      results.push({
        title: doc.title,
        excerpt: `...${excerpt}...`,
        href: doc.href,
        project: doc.project
      });
    }
  });

  return results;
}

/**
 * Get next and previous navigation for a doc
 */
export function getDocNavigation(project: DocProject, currentSlug: string): { prev?: DocFile; next?: DocFile } {
  const allDocs = project.categories.flatMap(c => c.docs);
  const currentIndex = allDocs.findIndex(d => d.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? allDocs[currentIndex - 1] : undefined,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : undefined
  };
}

/**
 * Preload documentation data
 * Call this early in your app to ensure data is available
 */
export async function preloadDocs(): Promise<void> {
  await loadDocsNavData();
}
