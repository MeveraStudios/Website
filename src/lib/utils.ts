import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip markdown formatting from heading text.
 * Real HTML/JSX tags (e.g. <span>, <br />) are removed entirely.
 * Generic type parameters (e.g. <T>, <A, B>) have their brackets stripped,
 * keeping the inner type text (Optional<T> → OptionalT).
 */
function cleanHeadingText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // Remove bold
    .replace(/\*(.+?)\*/g, '$1')       // Remove italic
    .replace(/`(.+?)`/g, '$1')         // Remove inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    // Remove real HTML/JSX tags (lowercase tag names with optional attrs / self-closing)
    .replace(/<\/?[a-z][a-zA-Z0-9-]*(\s[^>]*)?\/?>/g, '')
    // For the remaining angle-bracket expressions (e.g. generic types like <T>, <A, B>)
    // strip the brackets and keep the inner text
    .replace(/<([^>]+)>/g, '$1')
    .trim();
}

/**
 * Simple slugification for heading text (no deduplication).
 * Used for h1 headings that don't participate in the TOC.
 */
export function slugify(text: string): string {
  return cleanHeadingText(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// ─── Header Tree Data Structure ───────────────────────────────────────────────

/**
 * A node in the header tree. Represents a single heading (h2-h6).
 * Children are headings of a deeper level that appear below this heading
 * and before the next heading of equal or shallower level.
 */
export interface HeaderNode {
  /** Unique anchor-link ID */
  id: string;
  /** Clean display text (markdown stripped) */
  displayName: string;
  /** Heading level (2-6) */
  level: number;
  /** Ordered child headings */
  children: HeaderNode[];
}

/**
 * Flat representation of a header, derived from the tree traversal.
 * Used by renderers and the TOC component.
 */
export interface FlatHeader {
  id: string;
  text: string;
  level: number;
}

/**
 * Build a header tree from raw markdown/MDX content.
 *
 * Algorithm:
 * 1. Parse all h2-h6 headings in document order.
 * 2. Maintain a stack of ancestor nodes.
 * 3. For each heading, pop the stack until the top is a shallower level
 *    (i.e. a valid parent), then push the new node as its child.
 * 4. If the stack is empty, the heading is a root (top-level TOC entry).
 *
 * Duplicate heading texts receive suffixed IDs (e.g. "conclusion", "conclusion-1").
 *
 * This is a PURE function — no mutable state escapes. Safe for useMemo.
 */
export function buildHeaderTree(content: string): HeaderNode[] {
  const headingRegex = /^(#{2,6})\s+(.+?)\s*$/gm;
  const roots: HeaderNode[] = [];
  const stack: HeaderNode[] = [];
  const idCounts = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();
    const displayName = cleanHeadingText(rawText);

    // Generate unique slug
    const baseSlug = slugify(rawText);
    const count = idCounts.get(baseSlug) || 0;
    const id = count > 0 ? `${baseSlug}-${count}` : baseSlug;
    idCounts.set(baseSlug, count + 1);

    const node: HeaderNode = { id, displayName, level, children: [] };

    // Pop stack until top is a shallower level (valid parent)
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

/**
 * Depth-first flatten of the header tree into an ordered list.
 * The resulting order matches how headings appear in the document.
 */
export function flattenHeaderTree(roots: HeaderNode[]): FlatHeader[] {
  const result: FlatHeader[] = [];

  function traverse(nodes: HeaderNode[]) {
    for (const node of nodes) {
      result.push({ id: node.id, text: node.displayName, level: node.level });
      traverse(node.children);
    }
  }

  traverse(roots);
  return result;
}

// ─── Rehype Plugin: Heading IDs ───────────────────────────────────────────────

/**
 * Extract plain text content from a hast (HTML AST) node tree.
 */
function getNodeText(node: any): string {
  if (node.type === 'text') return node.value || '';
  if (node.children) return (node.children as any[]).map(getNodeText).join('');
  return '';
}

/**
 * Rehype plugin that assigns unique, deterministic IDs to h2-h6 heading elements.
 *
 * Runs during markdown/MDX compilation on the HTML AST (hast), so IDs are baked
 * into the output BEFORE React renders — no counter or ref needed at render time.
 *
 * Uses the same slugify + duplicate-counter algorithm as buildHeaderTree /
 * extractToc, so DOM IDs always match the TOC.
 */
export function rehypeHeadingIds() {
  return (tree: any) => {
    const idCounts = new Map<string, number>();

    function visit(node: any) {
      if (node.type === 'element' && /^h[2-6]$/.test(node.tagName)) {
        const text = getNodeText(node);
        const baseSlug = slugify(text);
        const count = idCounts.get(baseSlug) || 0;
        const id = count > 0 ? `${baseSlug}-${count}` : baseSlug;
        idCounts.set(baseSlug, count + 1);
        node.properties = node.properties || {};
        node.properties.id = id;
      }
      if (node.children) {
        for (const child of node.children) {
          visit(child);
        }
      }
    }

    visit(tree);
  };
}
