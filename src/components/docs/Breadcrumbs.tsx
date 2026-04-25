/**
 * Breadcrumbs
 *
 * Visual trail mirroring the BreadcrumbList JSON-LD emitted in Seo.tsx.
 * Rendered above each doc's <h1>. Last segment is the current page and
 * carries aria-current="page".
 */

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Breadcrumb } from '@/components/Seo';

interface BreadcrumbsProps {
  items: Breadcrumb[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 list-none m-0 p-0 text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.url}-${i}`}>
              <li className="inline-flex items-center">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-foreground"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.url}
                    className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="inline-flex items-center">
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
