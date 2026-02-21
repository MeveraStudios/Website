/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with react-markdown.
 * Heading IDs are assigned at the AST level by rehypeHeadingIds — no React-side
 * counter or ref needed, so StrictMode double-rendering is a non-issue.
 */

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeRaw from 'rehype-raw';
import remarkAdmonitions from './remark-admonitions';
import { CodeBlock } from './CodeBlock';
import { Admonition } from './Admonition';
import { MermaidDiagram } from '@lightenna/react-mermaid-diagram';
import { Tabs as TabsComponent, TabItem as TabItemComponent } from './Tabs.tsx';
import LatestVersionBlockComponent from '@/components/LatestVersionBlock';
import { cn, slugify, rehypeHeadingIds } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/code-theme.css';
import '@/styles/tabs.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ─── Heading (pure presentational — reads `id` prop from rehype plugin) ───────

function Heading({ level, id, children }: { level: 1|2|3|4|5|6; id?: string; children: React.ReactNode }) {
  const text = typeof children === 'string' ? children : String(children);
  const slug = id || slugify(text);
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

// ─── Static component map (no dynamic state — safe at module level) ───────────

const components = {
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
    const language = className?.replace('language-', '');
    if (language === 'mermaid') {
      return <MermaidDiagram>{String(children)}</MermaidDiagram>;
    }
    return <CodeBlock className={className}>{String(children)}</CodeBlock>;
  },

  h1: ({ id, children }: any) => <Heading level={1} id={id}>{children}</Heading>,
  h2: ({ id, children }: any) => <Heading level={2} id={id}>{children}</Heading>,
  h3: ({ id, children }: any) => <Heading level={3} id={id}>{children}</Heading>,
  h4: ({ id, children }: any) => <Heading level={4} id={id}>{children}</Heading>,
  h5: ({ id, children }: any) => <Heading level={5} id={id}>{children}</Heading>,
  h6: ({ id, children }: any) => <Heading level={6} id={id}>{children}</Heading>,

  div({ className, children, ...props }: any) {
    if (className?.includes('admonition')) {
      const type = (props as Record<string, any>)['data-admonition-type'] || 'note';
      const title = (props as Record<string, any>)['data-admonition-title'];
      const icon = (props as Record<string, any>)['data-admonition-icon'];
      const sideColor = (props as Record<string, any>)['data-admonition-side-color'];
      const bgColor = (props as Record<string, any>)['data-admonition-bg-color'];
      return (
        <Admonition type={type} title={title} icon={icon} sideColor={sideColor} bgColor={bgColor}>
          {children}
        </Admonition>
      );
    }
    return <div className={className} {...props}>{children}</div>;
  },

  Tabs: ({ defaultValue, children, className }: any) => (
    <TabsComponent defaultValue={defaultValue} className={className}>{children}</TabsComponent>
  ),
  TabItem: ({ value, label, icon, children }: any) => (
    <TabItemComponent value={value} label={label} icon={icon}>{children}</TabItemComponent>
  ),
  LatestVersionBlock: ({ owner, repo, group, id }: any) => (
    <LatestVersionBlockComponent owner={owner} repo={repo} group={group} id={id} />
  ),
  latestversionblock: ({ owner, repo, group, id }: any) => (
    <LatestVersionBlockComponent owner={owner} repo={repo} group={group} id={id} />
  ),
  tabs: ({ defaultvalue, children, className }: any) => (
    <TabsComponent defaultValue={defaultvalue} className={className}>{children}</TabsComponent>
  ),
  tabitem: ({ value, label, icon, children }: any) => (
    <TabItemComponent value={value} label={label} icon={icon}>{children}</TabItemComponent>
  ),

  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http');
    return (
      <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} {...props}>
        {children}
      </a>
    );
  },

  img: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} loading="lazy" className="rounded-lg max-w-full h-auto" {...props} />
  ),

  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),

  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-border" {...props}>{children}</table>
    </div>
  ),
};

// ─── Renderer ─────────────────────────────────────────────────────────────────

export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  const remarkPlugins = useMemo(() => [remarkGfm, remarkDirective, remarkAdmonitions], []);
  const rehypePlugins = useMemo(() => [rehypeRaw, rehypeHeadingIds], []);

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

export { CodeBlock } from './CodeBlock';
