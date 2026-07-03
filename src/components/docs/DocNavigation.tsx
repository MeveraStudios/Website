import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocFile } from '@/types/docs';

interface DocNavigationProps {
  prev?: DocFile;
  next?: DocFile;
  projectId: string;
  version: string;
  className?: string;
}

function NavCard({
  doc,
  direction,
  projectId,
  version,
}: {
  doc: DocFile;
  direction: 'prev' | 'next';
  projectId: string;
  version: string;
}) {
  const isPrev = direction === 'prev';

  return (
    <Link
      to={doc.categoryPath ? `/docs/${projectId}/${version}/${doc.categoryPath}/${doc.slug}` : `/docs/${projectId}/${version}/${doc.slug}`}
      className={cn(
        'group flex flex-col w-full h-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all',
        isPrev ? 'items-start text-left' : 'items-end text-right',
      )}
    >
      <span className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
        {isPrev && <ChevronLeft className="h-4 w-4" />}
        {isPrev ? 'Previous' : 'Next'}
        {!isPrev && <ChevronRight className="h-4 w-4" />}
      </span>
      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
        {doc.frontmatter.title}
      </span>
      {doc.frontmatter.description && (
        <span className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
          {doc.frontmatter.description}
        </span>
      )}
      <span className="text-xs text-muted-foreground/50 mt-2">
        in {doc.category}
      </span>
    </Link>
  );
}

export function DocNavigation({ prev, next, projectId, version, className }: DocNavigationProps) {
  if (!prev && !next) return null;

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-border', className)}>
      <div className="w-full">
        {prev && (
          <NavCard
            doc={prev}
            direction="prev"
            projectId={projectId}
            version={version}
          />
        )}
      </div>
      <div className="w-full">
        {next && (
          <NavCard
            doc={next}
            direction="next"
            projectId={projectId}
            version={version}
          />
        )}
      </div>
    </div>
  );
}
