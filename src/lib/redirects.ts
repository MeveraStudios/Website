/**
 * Client-side redirect map.
 *
 * `src/data/redirects.json` is the single source of truth. Keys = old path,
 * values = new path. Both absolute, both starting with `/`. The `_comment`
 * key (if present) is ignored.
 *
 * `lookupRedirect` decodes the incoming pathname before matching so entries
 * can contain spaces or other special characters without percent-escaping.
 */

import raw from '@/data/redirects.json';

const redirects: Record<string, string> = Object.fromEntries(
  Object.entries(raw as Record<string, string>).filter(
    ([k]) => !k.startsWith('_')
  )
);

export function lookupRedirect(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname);
    if (redirects[pathname]) return redirects[pathname];
    if (redirects[decoded]) return redirects[decoded];
  } catch {
    // Malformed percent-encoding — fall through.
  }
  return null;
}
