/**
 * Search Dialog Component
 * 
 * Provides full-text search across all documentation
 * with keyboard shortcut (Cmd/Ctrl + K)
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { searchDocs, fetchSearchIndex } from '@/lib/docs';
import type { SearchResult } from '@/types/docs';

const MAX_RECENT = 3;

interface RecentSearch {
  title: string;
  href: string;
}

function storageKey(projectId?: string) {
  return projectId
    ? `mevera-recent-searches-${projectId}`
    : 'mevera-recent-searches';
}

function getRecentSearches(projectId?: string): RecentSearch[] {
  try {
    const stored = localStorage.getItem(storageKey(projectId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(projectId: string | undefined, title: string, href: string) {
  const recent = getRecentSearches(projectId).filter(s => s.href !== href);
  recent.unshift({ title, href });
  localStorage.setItem(storageKey(projectId), JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches(projectId?: string) {
  localStorage.removeItem(storageKey(projectId));
}

// Module-level ref synchronizes state across all mounted instances.
// When two instances are mounted (responsive triggers), clicking one opens only
// that instance, leaving the other closed. A global Ctrl+K toggle would then
// open the closed one while closing the open one. This shared ref prevents
// that by letting every instance know "some dialog is already open."
const sharedOpenRef = { current: false };

export function SearchDialog({
  projectId,
  open: controlledOpen,
  onOpenChange,
}: {
  projectId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChange],
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  // Sync both refs so the global listener can check cross-instance state
  sharedOpenRef.current = open;

  // Global shortcut: Cmd/Ctrl + K toggles using the shared ref.
  // When ANY instance's dialog is open we close all; when none is open we open.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (sharedOpenRef.current) {
          setOpen(false);
        } else {
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  // Preload search index + reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      fetchSearchIndex().catch(() => {});
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setIsSearching(false);
      setSearchError(null);
      setRecentSearches(getRecentSearches(projectId));
    }
  }, [open]);

  // Lock scroll directly on <html> rather than relying on react-remove-scroll-bar's
  // body overflow: hidden which causes a ~1px layout shift. Since html already has
  // scrollbar-gutter: stable, the space stays reserved even with overflow: hidden.
  useLayoutEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const saved = html.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.setProperty('padding-right', '0px', 'important');
    return () => {
      html.style.overflow = saved;
      document.body.style.removeProperty('padding-right');
    };
  }, [open]);

  // Search with 150ms debounce + AbortController for request dedup
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const searchResults = await searchDocs(query, projectId);
        if (!controller.signal.aborted) {
          setResults(searchResults);
          setSelectedIndex(0);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchError('Search failed. Check your connection and try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [query, projectId]);

  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(projectId, result.title, result.href);
    navigate(result.href);
    setOpen(false);
  }, [navigate, setOpen, projectId]);

  const handleRecentClick = useCallback((href: string) => {
    navigate(href);
    setOpen(false);
  }, [navigate, setOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const listLen = query.trim()
      ? results.length
      : recentSearches.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listLen - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : listLen - 1));
    } else if (e.key === 'Enter') {
      if (query.trim() && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (!query.trim() && recentSearches[selectedIndex]) {
        e.preventDefault();
        handleRecentClick(recentSearches[selectedIndex].href);
      }
    }
  }, [results, selectedIndex, handleSelect, query, recentSearches, handleRecentClick]);

  return (
    <>
      {!isControlled && (
        <>
          {/* Search Button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search</span>
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </Button>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          noOverlay
          showCloseButton={false}
          className="max-w-2xl p-0 gap-0 shadow-none [box-shadow:0_0_24px_hsl(var(--primary)/0.08)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90"
          style={{
            '--tw-enter-translate-x': '-50%',
            '--tw-enter-translate-y': '-50%',
            '--tw-exit-translate-x': '-50%',
            '--tw-exit-translate-y': '-50%',
          } as React.CSSProperties}
        >
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Search Documentation</DialogTitle>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search documentation..."
                className={cn(
                  'pl-10 h-12 text-lg',
                  isSearching && 'pr-10'
                )}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                role="combobox"
                aria-label="Search documentation"
                aria-expanded={results.length > 0}
                aria-busy={isSearching}
                aria-controls="search-results-listbox"
                aria-activedescendant={
                  results[selectedIndex]
                    ? `search-result-${selectedIndex}`
                    : undefined
                }
              />
              {isSearching && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  role="status"
                  aria-live="polite"
                >
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="sr-only">Searching...</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="p-4 pt-2">
            {searchError ? (
              <div
                className="text-center py-8 text-muted-foreground"
                role="alert"
              >
                <p>{searchError}</p>
              </div>
            ) : query.trim() && results.length === 0 && !isSearching ? (
              <div
                className="text-center py-8 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : !query.trim() && recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
                  <button
                    type="button"
                    onClick={() => { clearRecentSearches(projectId); setRecentSearches([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-1 list-none m-0 p-0">
                  {recentSearches.map((s, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <li key={s.href}>
                        <button
                          type="button"
                          onClick={() => handleRecentClick(s.href)}
                          className={cn(
                            'w-full text-left p-2.5 rounded-lg transition-colors flex items-center gap-3',
                            isSelected
                              ? 'bg-primary/10 ring-1 ring-primary/20'
                              : 'hover:bg-muted'
                          )}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm text-foreground">{s.title}</span>
                            <p className="text-xs text-muted-foreground truncate">{s.href}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : results.length > 0 ? (
              <ScrollArea className="max-h-[60vh]">
                <ul
                  id="search-results-listbox"
                  role="listbox"
                  aria-label="Search results"
                  className="space-y-1 list-none m-0 p-0"
                >
                  {results.map((result, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <li
                        key={result.href}
                        id={`search-result-${index}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(result)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg transition-colors',
                            isSelected
                              ? 'bg-primary/10 ring-1 ring-primary/20'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <FileText
                              className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">
                                {result.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {result.excerpt}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                in {result.project}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            ) : null}

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">
                    ↑↓
                  </kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">
                    ↵
                  </kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">
                    esc
                  </kbd>
                  to close
                </span>
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
