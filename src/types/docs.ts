/**
 * TypeScript type definitions for the documentation system
 */

// Represents a single documentation file (.md or .mdx)
export interface DocFile {
  /** File name without extension */
  slug: string;
  /** Full file path relative to docs folder */
  path: string;
  /** File content as string (optional for nav items) */
  content?: string;
  /** Parsed frontmatter */
  frontmatter: DocFrontmatter;
  /** Project this doc belongs to */
  project?: string;
  /** Category within the project */
  category: string;
  /** File extension (.md or .mdx) */
  extension?: string;
  /** Precompiled table of contents */
  toc?: TocItem[];
}

// Frontmatter metadata from markdown files
export interface DocFrontmatter {
  /** Document title */
  title: string;
  /** Document description */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Order within category */
  order?: number;
  /** Whether to hide from navigation */
  hidden?: boolean;
  /** Custom sidebar label */
  sidebarLabel?: string;
}

// Represents a category containing multiple docs
export interface DocCategory {
  /** Category name */
  name: string;
  /** Documents in this category */
  docs: DocFile[];
  /** Order in sidebar */
  order: number;
}

// Represents a project with its documentation
export interface DocProject {
  /** Project ID (folder name) */
  id: string;
  /** Project display name */
  name: string;
  /** Project description */
  description: string;
  /** Categories within this project */
  categories: DocCategory[];
  /** All docs flattened */
  allDocs?: DocFile[];
  /** Project metadata from config */
  meta: {
    emoji: string;
    color: string;
    githubRepo?: string;
  };
}

// Navigation item for sidebar
export interface NavItem {
  /** Display label */
  label: string;
  /** Link href */
  href: string;
  /** Whether this is the active page */
  active?: boolean;
  /** Child items for nested navigation */
  children?: NavItem[];
  /** Whether this section is expanded */
  expanded?: boolean;
}

// Table of contents item
export interface TocItem {
  /** Heading text */
  text: string;
  /** Heading level (2, 3, etc.) */
  level: number;
  /** Anchor link */
  id: string;
}

// Search result item
export interface SearchResult {
  /** Document title */
  title: string;
  /** Matching excerpt */
  excerpt: string;
  /** Link to document */
  href: string;
  /** Project name */
  project: string;
}

// Code block metadata
export interface CodeBlockInfo {
  /** Programming language */
  language: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Highlight specific lines */
  highlightLines?: number[];
  /** File name */
  filename?: string;
}
// Header data object for caching and unique identification
export interface Header {
  /** The unique hierarchical ID (e.g., 'bukkit.installation') */
  id: string;
  /** The full link to this header (e.g., '#bukkit.installation') */
  link: string;
  /** How the header should be displayed */
  display: string;
}
