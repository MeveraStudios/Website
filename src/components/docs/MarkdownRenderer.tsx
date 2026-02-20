/**
 * Professional MarkdownRenderer Component
 * 
 * A robust, performant markdown renderer using react-markdown with:
 * - MDX support for JSX components
 * - Custom components (Tabs, Admonitions, CodeBlocks)
 * - Proper heading IDs and table of contents support
 * - Syntax highlighting
 * - Clean architecture with separated concerns
 */

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeRaw from 'rehype-raw';
import remarkAdmonitions from './remark-admonitions';
import { CodeBlock } from './CodeBlock';
import { Admonition } from './Admonition';
import {MermaidDiagram} from '@lightenna/react-mermaid-diagram';
import { Tabs as TabsComponent, TabItem as TabItemComponent } from './Tabs.tsx';
import LatestVersionBlockComponent from '@/components/LatestVersionBlock';
import { cn } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/code-theme.css';
import '@/styles/tabs.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Heading component with automatic ID generation and anchor links
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

function Heading({ level, children }: HeadingProps) {
  const text = typeof children === 'string' ? children : String(children);
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const Tag = `h${level}` as const;

  return (
    <Tag id={slug} className="group scroll-mt-20">
      <a
        href={`#${slug}`}
        className="no-underline hover:no-underline"
        aria-label={`Link to ${text}`}
      >
        {children}
        <span className="ml-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground">
          #
        </span>
      </a>
    </Tag>
  );
}

/**
 * Custom components mapping for react-markdown
 */
const components = {
  // Code blocks with syntax highlighting
  code({ className, children, inline, ...props }: any) {
    if (inline || !className) {
      return (
        <code
          className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono text-[0.9em]"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Check if it's a mermaid diagram
    const language = className?.replace('language-', '');
    if (language === 'mermaid') {
      return <MermaidDiagram>{String(children)}</MermaidDiagram>;
    }

    return <CodeBlock className={className}>{String(children)}</CodeBlock>;
  },

  // Headings with anchor links
  h1: ({ children }: any) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }: any) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }: any) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }: any) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }: any) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }: any) => <Heading level={6}>{children}</Heading>,

  // Handle divs - for admonitions and other custom components
  div({ className, children, ...props }: any) {
    // Handle admonitions (:::note, :::tip, etc.)
    if (className?.includes('admonition')) {
      const type = (props as Record<string, any>)['data-admonition-type'] || 'note';
      const title = (props as Record<string, any>)['data-admonition-title'];
      const icon = (props as Record<string, any>)['data-admonition-icon'];
      const sideColor = (props as Record<string, any>)['data-admonition-side-color'];
      const bgColor = (props as Record<string, any>)['data-admonition-bg-color'];
      return (
        <Admonition 
          type={type} 
          title={title}
          icon={icon}
          sideColor={sideColor}
          bgColor={bgColor}
        >
          {children}
        </Admonition>
      );
    }

    return <div className={className} {...props}>{children}</div>;
  },

  // Custom JSX components (for when they're written directly in markdown)
  Tabs: ({ defaultValue, children, className }: any) => (
    <TabsComponent defaultValue={defaultValue} className={className}>
      {children}
    </TabsComponent>
  ),
  
  TabItem: ({ value, label, icon, children }: any) => (
    <TabItemComponent value={value} label={label} icon={icon}>
      {children}
    </TabItemComponent>
  ),
  
  LatestVersionBlock: ({ owner, repo, group, id }: any) => (
    <LatestVersionBlockComponent owner={owner} repo={repo} group={group} id={id} />
  ),

  // Handle lowercase JSX elements (from rehype-raw)
  latestversionblock: ({ owner, repo, group, id }: any) => (
    <LatestVersionBlockComponent owner={owner} repo={repo} group={group} id={id} />
  ),
  
  tabs: ({ defaultvalue, children, className }: any) => (
    <TabsComponent defaultValue={defaultvalue} className={className}>
      {children}
    </TabsComponent>
  ),
  
  tabitem: ({ value, label, icon, children }: any) => (
    <TabItemComponent value={value} label={label} icon={icon}>
      {children}
    </TabItemComponent>
  ),

  // Enhanced links - open external links in new tab
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },

  // Enhanced images with lazy loading
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="rounded-lg max-w-full h-auto"
      {...props}
    />
  ),

  // Enhanced blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Enhanced tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),
};

/**
 * MarkdownRenderer Component
 * 
 * Renders markdown/MDX content with full support for:
 * - GFM (GitHub Flavored Markdown)
 * - Directives (for admonitions)
 * - Custom React components
 * - Syntax highlighting
 * - Raw HTML
 */
export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  // Memoize plugins array to prevent unnecessary re-renders
  const remarkPlugins = useMemo(
    () => [remarkGfm, remarkDirective, remarkAdmonitions],
    []
  );

  const rehypePlugins = useMemo(() => [rehypeRaw], []);

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;

// Export CodeBlock for backward compatibility
export { CodeBlock } from './CodeBlock';
