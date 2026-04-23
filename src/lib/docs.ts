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
 * Full-text search powered by FlexSearch.
 *
 * The static `search-index.json` is the source documents. We build a
 * Document index client-side (title is weighted higher than content) and
 * query it for ranked results with a highlighted excerpt.
 */
import * as FlexSearch from 'flexsearch';

interface SearchDoc {
  id: number;
  title: string;
  content: string;
  href: string;
  project: string;
}

type EnrichedHit = { field: string; result: Array<{ id: number; doc: SearchDoc }> };

let searchIndexCache: SearchDoc[] | null = null;
let isSearchIndexLoading = false;
let flexIndex: FlexSearch.Document<SearchDoc, string[]> | null = null;

function buildFlexIndex(docs: SearchDoc[]) {
  const idx = new FlexSearch.Document<SearchDoc, string[]>({
    tokenize: 'forward',
    cache: 100,
    document: {
      id: 'id',
      index: ['title', 'content'],
      store: ['title', 'content', 'href', 'project'],
    },
  });
  docs.forEach(d => idx.add(d));
  return idx;
}

export async function fetchSearchIndex(): Promise<SearchDoc[]> {
  if (searchIndexCache) return searchIndexCache;
  if (isSearchIndexLoading) return [];

  isSearchIndexLoading = true;
  try {
    const res = await fetch('/search-index.json');
    if (res.ok) {
      const raw = (await res.json()) as Omit<SearchDoc, 'id'>[];
      searchIndexCache = raw.map((d, i) => ({ ...d, id: i }));
      flexIndex = buildFlexIndex(searchIndexCache);
    }
  } catch (e) {
    console.error('Failed to load search index', e);
  } finally {
    isSearchIndexLoading = false;
  }
  return searchIndexCache || [];
}

function buildExcerpt(content: string, query: string, radius = 80): string {
  const lower = content.toLowerCase();
  const q = query.toLowerCase();
  let idx = lower.indexOf(q);
  if (idx === -1) {
    // Fall back to first term that matches
    const firstTerm = q.split(/\s+/).find(t => t && lower.includes(t));
    idx = firstTerm ? lower.indexOf(firstTerm) : 0;
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius * 2);
  const prefix = start > 0 ? '… ' : '';
  const suffix = end < content.length ? ' …' : '';
  return (prefix + content.slice(start, end).replace(/[#*`]/g, '').trim() + suffix);
}

export async function searchDocs(query: string) {
  const docs = await fetchSearchIndex();
  if (!docs.length || !flexIndex || !query.trim()) return [];

  const limit = 20;
  const hits = flexIndex.search(query, limit, { enrich: true, suggest: true }) as unknown as EnrichedHit[];

  // Merge + dedupe by id while preserving field-priority ordering
  // (flexsearch returns one bucket per indexed field — title first).
  const seen = new Set<number>();
  const results: { title: string; excerpt: string; href: string; project: string }[] = [];

  for (const bucket of hits) {
    for (const item of bucket.result) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const doc = item.doc;
      results.push({
        title: doc.title,
        excerpt: buildExcerpt(doc.content, query),
        href: doc.href,
        project: doc.project,
      });
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

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
