/**
 * Documentation loading utilities
 * 
 * This module loads precompiled documentation data from static JSON files
 * generated at build time by scripts/precompile-docs.ts
 */

import { useState, useEffect } from 'react';
import type { DocFile, DocProject, DocVersion, TocItem, Header } from '@/types/docs';
import { buildHeaderTree, flattenHeaderTree } from './utils';

// Type for cached documentation navigation data
interface CachedDocsNavData {
  projects: DocProject[];
  generatedAt?: string;
}

interface SearchDoc {
  id: number;
  title: string;
  content: string;
  href: string;
  project: string;
  projectId: string;
  version: string;
  category: string;
  slug: string;
}

// Cached data for content chunks
const docContentCache = new Map<string, DocFile>();

// Cached search index data
let searchIndexCache: SearchDoc[] | null = null;
let searchIndexLoadPromise: Promise<SearchDoc[]> | null = null;

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
 * Fetch a specific document's detailed content for a given project version.
 */
export async function fetchDocContent(projectId: string, version: string, category: string, slug: string): Promise<DocFile | null> {
  const cacheKey = `${projectId}/${version}/${category ? category + '/' : ''}${slug}`;
  if (docContentCache.has(cacheKey)) {
    return docContentCache.get(cacheKey)!;
  }

  try {
    const contentPath = category
      ? `/docs-content/${projectId}/${version}/${category}/${slug}.json`
      : `/docs-content/${projectId}/${version}/${slug}.json`;
    const response = await fetch(contentPath);
    if (!response.ok) {
      throw new Error(`Failed to load document content for ${slug}`);
    }
    const docData: DocFile = await response.json();
    docContentCache.set(cacheKey, docData);
    return docData;
  } catch (error) {
    console.error(`Error fetching document ${projectId}/${version}/${category ? category + '/' : ''}${slug}:`, error);
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
export function useDocContent(projectId: string, version: string, category: string, slug: string) {
  const cacheKey = `${projectId}/${version}/${category ? category + '/' : ''}${slug}`;
  const cached = docContentCache.get(cacheKey) ?? null;

  const [doc, setDoc] = useState<DocFile | null>(() => {
    if (cached) return cached;
    if (typeof window !== 'undefined') {
      const data = (window as any).__INITIAL_DATA__ as DocFile | undefined;
      if (data) {
        delete (window as any).__INITIAL_DATA__;
        docContentCache.set(cacheKey, data);
        return data;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(doc === null);

  useEffect(() => {
    if (!projectId || !version || !slug) return;

    const cacheKey = `${projectId}/${version}/${category ? category + '/' : ''}${slug}`;
    if (docContentCache.has(cacheKey)) {
      setDoc(docContentCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    fetchDocContent(projectId, version, category, slug).then((content) => {
      if (isMounted) {
        setDoc(content);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [projectId, version, category, slug]);

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
export function getDoc(projectId: string, version: string, slug: string): DocFile | undefined {
  const cacheKey = `${projectId}/${version}/${slug}`;
  if (docContentCache.has(cacheKey)) {
    return docContentCache.get(cacheKey);
  }

  // Fall back to finding the nav item
  if (!cachedDocsNavData) return undefined;

  const project = cachedDocsNavData.projects.find(p => p.id === projectId);
  if (!project) return undefined;

  const versionEntry = project.versions.find(v => v.id === version);
  if (!versionEntry) return undefined;

  for (const cat of versionEntry.categories) {
    const doc = cat.docs.find(d => d.slug === slug);
    if (doc) return doc;
  }

  return undefined;
}

/**
 * Resolve the latest (default) version of a project.
 */
export function getLatestVersion(project: DocProject): DocVersion | undefined {
  return project.versions.find(v => v.latest) || project.versions[0];
}

/**
 * Get all navigation items for a project version.
 */
export function getProjectNav(project: DocProject, version: DocVersion): { label: string; href: string; category: string }[] {
  const nav: { label: string; href: string; category: string }[] = [];

  version.categories.forEach(category => {
    category.docs.forEach(doc => {
      const href = doc.categoryPath
        ? `/docs/${project.id}/${version.id}/${doc.categoryPath}/${doc.slug}`
        : `/docs/${project.id}/${version.id}/${doc.slug}`;
      nav.push({
        label: doc.frontmatter.sidebarLabel || doc.frontmatter.title,
        href,
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
import { Document } from 'flexsearch';

type EnrichedHit = { field: string; result: Array<{ id: number; doc: SearchDoc }> };
let flexIndex: Document<any> | null = null;

function buildFlexIndex(docs: SearchDoc[]) {
  const idx = new Document<any>({
    tokenize: 'forward',
    cache: 100,
    document: {
      id: 'id',
      index: ['title', 'slug', 'category', 'project', 'projectId', 'version', 'content'],
      store: ['title', 'content', 'href', 'project', 'projectId', 'version', 'category', 'slug'],
    },
  });
  docs.forEach(d => idx.add(d));
  return idx;
}

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/[^a-z0-9@#]+/g, ' ');
}

function tokenizeSearchQuery(query: string): string[] {
  return normalizeSearchQuery(query).split(/\s+/).filter(Boolean);
}

export async function fetchSearchIndex(): Promise<SearchDoc[]> {
  if (searchIndexCache) return searchIndexCache;
  if (searchIndexLoadPromise) return searchIndexLoadPromise;

  searchIndexLoadPromise = (async () => {
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) {
        throw new Error(`Failed to load search index: ${res.statusText}`);
      }

      const raw = (await res.json()) as Omit<SearchDoc, 'id'>[];
      searchIndexCache = raw.map((d, i) => ({ ...d, id: i }));
      flexIndex = buildFlexIndex(searchIndexCache);
      return searchIndexCache;
    } catch (e) {
      console.error('Failed to load search index', e);
      searchIndexCache = [];
      flexIndex = null;
      return searchIndexCache;
    } finally {
      searchIndexLoadPromise = null;
    }
  })();

  return searchIndexLoadPromise;
}

function buildExcerpt(content: string, query: string, radius = 80): string {
  const terms = tokenizeSearchQuery(query);
  const lower = content.toLowerCase();
  let idx = -1;
  let matchedTerm = '';

  for (const term of terms) {
    const termIdx = lower.indexOf(term);
    if (termIdx !== -1 && (idx === -1 || termIdx < idx)) {
      idx = termIdx;
      matchedTerm = term;
    }
  }

  if (idx === -1) idx = 0;

  const focusLength = matchedTerm.length || terms[0]?.length || query.length;
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + focusLength + radius * 2);
  const prefix = start > 0 ? '… ' : '';
  const suffix = end < content.length ? ' …' : '';
  return (prefix + content.slice(start, end).replace(/[#*`]/g, '').trim() + suffix);
}

function searchFlexIndex(query: string, limit: number): EnrichedHit[] {
  if (!flexIndex) return [];
  return flexIndex.search(query, { limit, enrich: true, suggest: true }) as unknown as EnrichedHit[];
}

function mergeSearchHits(hits: EnrichedHit[], limit: number, query: string) {
  const seen = new Set<number>();
  const results: { title: string; excerpt: string; href: string; project: string; projectId: string }[] = [];

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
        projectId: doc.projectId,
      });
      if (results.length >= limit) return results;
    }
  }

  return results;
}

export async function searchDocs(query: string, projectId?: string) {
  const docs = await fetchSearchIndex();
  const normalizedQuery = normalizeSearchQuery(query);
  if (!docs.length || !flexIndex || !normalizedQuery) return [];

  const limit = 20;
  const primaryHits = searchFlexIndex(normalizedQuery, limit);
  let results = mergeSearchHits(primaryHits, limit, normalizedQuery);

  if (!results.length) {
    const terms = tokenizeSearchQuery(normalizedQuery);
    for (const term of terms) {
      results = mergeSearchHits(searchFlexIndex(term, limit), limit, term);
      if (results.length) break;
    }
  }

  if (projectId) {
    results = results.filter(r => r.projectId === projectId);
  }

  return results;
}

/**
 * Get next and previous navigation for a doc within a specific version.
 */
export function getDocNavigation(version: DocVersion, currentSlug: string): { prev?: DocFile; next?: DocFile } {
  const allDocs = version.categories.flatMap(c => c.docs);
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
