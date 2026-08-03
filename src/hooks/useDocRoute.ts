/**
 * Doc route parsing
 *
 * Docs live at `/docs/<project>/<version>/<category-path>/<slug>` where the
 * category path can be nested to any depth (`guides/basic/Intro`). The router
 * therefore matches everything after the version with a splat and this hook
 * splits it: the last segment is the slug, everything before it is the
 * category path.
 *
 * Legacy flat URLs (`/docs/<project>/<version>/<slug>`) yield an empty
 * category path — `pages/Docs.tsx` redirects those to the canonical URL.
 */

import { useParams } from 'react-router-dom';

export interface DocRoute {
  projectId: string;
  version: string;
  /** Slugified category path of any depth; '' for flat/legacy URLs. */
  categoryPath: string;
  /** Last path segment; '' when the URL stops at the project or version. */
  slug: string;
  /** Everything after the version, normalised (no leading/trailing slashes). */
  rest: string;
}

/** Split a path tail into `{ categoryPath, slug }`. */
export function parseDocPath(rest: string): { categoryPath: string; slug: string; rest: string } {
  const segments = rest.split('/').filter(Boolean);
  return {
    categoryPath: segments.slice(0, -1).join('/'),
    slug: segments[segments.length - 1] || '',
    rest: segments.join('/'),
  };
}

export function useDocRoute(): DocRoute {
  const params = useParams();
  // React Router decodes param values already — do not decode again.
  const { categoryPath, slug, rest } = parseDocPath(params['*'] || '');

  return {
    projectId: params.projectId || '',
    version: params.version || '',
    categoryPath,
    slug,
    rest,
  };
}
