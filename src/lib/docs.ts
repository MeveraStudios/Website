/**
 * Documentation loading utilities
 * 
 * This module loads precompiled documentation data from static JSON files
 * generated at build time by scripts/precompile-docs.ts
 */

import { useState, useEffect } from 'react';
import type { DocFile, DocProject, TocItem, Header } from '@/types/docs';

// Type for cached documentation data
interface CachedDocsData {
  projects: DocProject[];
  toc: Record<string, TocItem[]>;
  generatedAt?: string;
}

// Cached data
let cachedDocsData: CachedDocsData | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
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
 * Load precompiled documentation data
 */
async function loadDocsData(): Promise<CachedDocsData> {
  // Return cached data if available
  if (cachedDocsData) {
    return cachedDocsData;
  }

  // If already loading, wait for the existing promise
  if (isLoading && loadPromise) {
    await loadPromise;
    return cachedDocsData!;
  }

  // Start loading
  isLoading = true;
  loadPromise = (async () => {
    try {
      const response = await fetch('/docs-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load docs data: ${response.statusText}`);
      }
      cachedDocsData = await response.json();
      notifySubscribers(); // Notify all components that data is ready
    } catch (error) {
      console.error('Error loading documentation data:', error);
      // Fallback to empty data
      cachedDocsData = { projects: [], toc: {} };
      notifySubscribers();
    } finally {
      isLoading = false;
    }
  })();

  await loadPromise;
  return cachedDocsData!;
}

/**
 * React hook to use documentation data
 * This ensures components re-render when data loads
 */
export function useDocs() {
  const [projects, setProjects] = useState<DocProject[]>(() => {
    return cachedDocsData?.projects || [];
  });
  const [isLoaded, setIsLoaded] = useState(() => cachedDocsData !== null);

  useEffect(() => {
    // If data is already loaded, we're done
    if (cachedDocsData) {
      setProjects(cachedDocsData.projects);
      setIsLoaded(true);
      return;
    }

    // Subscribe to data loading
    const unsubscribe = subscribe(() => {
      if (cachedDocsData) {
        setProjects(cachedDocsData.projects);
        setIsLoaded(true);
      }
    });

    // Trigger load if not already loading
    loadDocsData().catch(console.error);

    return unsubscribe;
  }, []);

  return { projects, isLoaded };
}

/**
 * Extract table of contents from markdown content
 * This function is kept for runtime TOC generation if needed
 */
export function extractToc(content: string): { items: TocItem[]; headers: Map<string, Header> } {
  const toc: TocItem[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  const headers = new Map<string, Header>();
  let currentParentId = '';

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    let id = slug;

    if (level === 2) {
      currentParentId = slug;
      id = slug;
    } else if (level === 3 && currentParentId) {
      id = `${currentParentId}.${slug}`;
    }

    headers.set(id, {
      id,
      link: `#${id}`,
      display: text
    });

    toc.push({ level, text, id });
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
  if (cachedDocsData) {
    return cachedDocsData.projects;
  }

  // Trigger async load (this will populate cache for subsequent calls)
  loadDocsData().catch(console.error);

  // Return empty array for now (components will re-render when data loads)
  return [];
}

/**
 * Get a specific document by project and slug
 */
export function getDoc(projectId: string, slug: string): DocFile | undefined {
  if (!cachedDocsData) {
    return undefined;
  }

  const project = cachedDocsData.projects.find(p => p.id === projectId);
  if (!project) return undefined;

  return project.allDocs.find(d => d.slug === slug);
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
 * Search through all documentation
 */
export function searchDocs(query: string): { title: string; excerpt: string; href: string; project: string }[] {
  if (!cachedDocsData) {
    return [];
  }

  const results: { title: string; excerpt: string; href: string; project: string }[] = [];
  const lowerQuery = query.toLowerCase();

  cachedDocsData.projects.forEach(project => {
    project.allDocs.forEach(doc => {
      const content = doc.content.toLowerCase();
      const title = doc.frontmatter.title.toLowerCase();

      if (title.includes(lowerQuery) || content.includes(lowerQuery)) {
        // Find excerpt around the match
        const index = content.indexOf(lowerQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 100);
        const excerpt = doc.content.slice(start, end).replace(/[#*`]/g, '');

        results.push({
          title: doc.frontmatter.title,
          excerpt: `...${excerpt}...`,
          href: `/docs/${project.id}/${doc.slug}`,
          project: project.name
        });
      }
    });
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
  await loadDocsData();
}
