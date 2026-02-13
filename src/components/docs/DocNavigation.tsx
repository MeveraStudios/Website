/**
 * Document Navigation Component
 * 
 * Displays previous/next navigation links at the bottom of docs
 */

import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocFile } from '@/types/docs';

interface DocNavigationProps {
  prev?: DocFile;
  next?: DocFile;
  projectId: string;
  className?: string;
}

export function DocNavigation({ prev, next, projectId, className }: DocNavigationProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-border', className)}>
      {/* Previous Link */}
      <div className="w-full">
        {prev && (
          <Link
            to={`/docs/${projectId}/${prev.slug}`}
            className="group flex flex-col items-start w-full h-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </span>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
              {prev.frontmatter.title}
            </span>
          </Link>
        )}
      </div>

      {/* Next Link */}
      <div className="w-full">
        {next && (
          <Link
            to={`/docs/${projectId}/${next.slug}`}
            className="group flex flex-col items-end w-full h-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-right"
          >
            <span className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
              {next.frontmatter.title}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
