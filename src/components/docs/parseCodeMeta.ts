/**
 * Parse the fenced-code **meta** string into CodeBlock props.
 *
 * Recognised tokens:
 *   - `title="src/foo.ts"` (double or single quotes)
 *   - `focus={2,5-7}`
 *   - `highlight={3}` (alias: `highlights={...}`, `hl={...}`)
 *   - `numbered` / `showLineNumbers`
 *   - `wrap`
 *   - `nocopy` / `no-copy`
 *
 * Unknown tokens are ignored.
 */

export interface ParsedCodeMeta {
  title?: string;
  focus?: string;
  highlight?: string;
  numbered?: boolean;
  wrap?: boolean;
  noCopy?: boolean;
}

export function parseCodeMeta(meta?: string | null): ParsedCodeMeta {
  const out: ParsedCodeMeta = {};
  if (!meta) return out;

  // title="…" | title='…'
  const titleMatch = meta.match(/\btitle\s*=\s*(?:"([^"]*)"|'([^']*)')/);
  if (titleMatch) out.title = titleMatch[1] ?? titleMatch[2];

  // key={…}
  const braceAt = (key: string) => {
    const re = new RegExp(`\\b${key}\\s*=?\\s*\\{([^}]*)\\}`);
    const m = meta.match(re);
    return m ? m[1].trim() : undefined;
  };
  out.focus = braceAt('focus');
  out.highlight = braceAt('highlight') ?? braceAt('highlights') ?? braceAt('hl');

  if (/\b(numbered|showLineNumbers)\b/.test(meta)) out.numbered = true;
  if (/\bwrap\b/.test(meta)) out.wrap = true;
  if (/\b(nocopy|no-copy)\b/.test(meta)) out.noCopy = true;

  return out;
}
