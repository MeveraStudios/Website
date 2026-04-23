/**
 * remark-code-meta
 *
 * Forwards the fenced-code **meta** string to the resulting `<code>` element
 * as `data-meta` so React components can read it.
 *
 * Markdown input:
 *
 *   ```ts title="src/foo.ts" focus={2,5-7} highlight={3} numbered
 *   const x = 1
 *   ```
 *
 * produces:
 *
 *   <code data-meta='title="src/foo.ts" focus={2,5-7} highlight={3} numbered'>
 *
 * which our CodeBlock parses into props.
 */

import { visit } from 'unist-util-visit';

interface CodeNode {
  type: 'code';
  meta?: string | null;
  data?: {
    hProperties?: Record<string, unknown>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export default function remarkCodeMeta() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], 'code', (node: CodeNode) => {
      if (!node.meta) return;
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties['data-meta'] = node.meta;
    });
  };
}
