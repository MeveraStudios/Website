/**
 * MDXRenderer Component
 *
 * Renders MDX content (markdown with JSX) using @mdx-js/mdx.
 * Heading IDs are assigned at the AST level by rehypeHeadingIds — no React-side
 * counter or ref needed, so StrictMode double-rendering is a non-issue.
 */

import { memo, useEffect, useState } from 'react';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkAdmonitions from './remark-admonitions';
import { CodeBlock } from './CodeBlock';
import { Admonition } from './Admonition';
import { MermaidDiagram } from '@lightenna/react-mermaid-diagram';
import { Tabs, TabItem } from './Tabs';
import LatestVersionBlock from '@/components/LatestVersionBlock';
import { cn, slugify, rehypeHeadingIds } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/code-theme.css';
import '@/styles/tabs.css';

interface MDXRendererProps {
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

const mdxComponents = {
  // Custom MDX components
  Tabs,
  TabItem,
  LatestVersionBlock,
  Admonition,
  CodeBlock,
  MermaidDiagram,

  // Headings with anchor links — id is injected by rehypeHeadingIds
  h1: ({ id, children }: any) => <Heading level={1} id={id}>{children}</Heading>,
  h2: ({ id, children }: any) => <Heading level={2} id={id}>{children}</Heading>,
  h3: ({ id, children }: any) => <Heading level={3} id={id}>{children}</Heading>,
  h4: ({ id, children }: any) => <Heading level={4} id={id}>{children}</Heading>,
  h5: ({ id, children }: any) => <Heading level={5} id={id}>{children}</Heading>,
  h6: ({ id, children }: any) => <Heading level={6} id={id}>{children}</Heading>,

  // Standard HTML elements with enhancements
  code: ({ className, children, ...props }: any) => {
    if (!className) {
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

  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="rounded-lg max-w-full h-auto"
      {...props}
    />
  ),

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

  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),

  div: ({ className, children, ...props }: any) => {
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
};

// ─── Renderer ─────────────────────────────────────────────────────────────────

/**
 * MDXRenderer Component
 *
 * Compiles and renders MDX content with full JSX support.
 * Heading IDs are assigned during compilation by rehypeHeadingIds.
 */
export const MDXRenderer = memo(({ content, className }: MDXRendererProps) => {
  const [MDXContent, setMDXContent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Clear stale content before recompiling
    setMDXContent(null);
    setError(null);

    async function compileMDX() {
      try {
        const compiled = await compile(content, {
          outputFormat: 'function-body',
          development: false,
          remarkPlugins: [remarkGfm, remarkDirective, remarkAdmonitions],
          rehypePlugins: [rehypeHeadingIds],
        });

        if (cancelled) return;

        const { default: Component } = await run(String(compiled), {
          ...runtime,
          baseUrl: import.meta.url,
        } as any);

        setMDXContent(() => Component);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('MDX compilation error:', err);
        setError(err as Error);
      }
    }

    compileMDX();

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (error) {
    return (
      <div className={cn('prose prose-invert max-w-none', className)}>
        <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
          <h3 className="text-red-400 mb-2">MDX Compilation Error</h3>
          <pre className="text-sm text-red-300 overflow-auto">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  if (!MDXContent) {
    return (
      <div className={cn('prose prose-invert max-w-none', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <MDXContent components={mdxComponents} />
    </div>
  );
});

MDXRenderer.displayName = 'MDXRenderer';

export default MDXRenderer;