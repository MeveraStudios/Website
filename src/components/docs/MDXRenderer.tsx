/**
 * MDXRenderer Component
 *
 * Renders MDX content (markdown with JSX) using @mdx-js/mdx.
 * Heading IDs are assigned at the AST level by rehypeHeadingIds — no React-side
 * counter or ref needed, so StrictMode double-rendering is a non-issue.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkAdmonitions from './remark-admonitions';
import remarkCodeMeta from './remark-code-meta';
import { CodeBlock } from './CodeBlock';
import { parseCodeMeta } from './parseCodeMeta';
import { Admonition } from './Admonition';
import { SmartImg } from './SmartImg';
import { MermaidDiagram } from '@lightenna/react-mermaid-diagram';
import { Tabs, TabItem } from './Tabs';
import LatestVersionBlock from '@/components/LatestVersionBlock';
import SnapshotRepoBlock from '@/components/SnapshotRepoBlock';
import ShadingBlock from '@/components/ShadingBlock';
import { cn, slugify, rehypeHeadingIds } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/code-theme.css';
import '@/styles/tabs.css';

interface MDXRendererProps {
  content: string;
  className?: string;
  /** Active project — used to rewrite version-less /docs/<project>/... links. */
  projectId?: string;
  /** Active version — injected into rewritten cross-doc links. */
  version?: string;
}

/**
 * If `href` points at the same project's docs without a version segment,
 * inject the active version. Authors keep writing `/docs/Imperat/foo` and
 * we make sure they land on `/docs/Imperat/v4/foo`.
 */
function rewriteDocHref(href: string | undefined, projectId?: string, version?: string): string | undefined {
  if (!href || !projectId || !version) return href;

  if (!href.startsWith('/docs/')) {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return href;
    try {
      const resolved = new URL(href, window.location.href);
      href = resolved.pathname + resolved.hash;
    } catch {
      return href;
    }
  }

  const parts = href.split('#');
  const pathPart = parts[0];
  const hashPart = parts[1] !== undefined ? `#${parts[1]}` : '';

  const segments = pathPart.split('/').filter(Boolean);
  if (segments.length < 2) return href;
  if (segments[1] !== projectId) return href;

  if (segments.length >= 3 && /^v\d+$/i.test(segments[2])) return href;

  const rest = segments.slice(2).join('/');
  return rest
    ? `/docs/${projectId}/${version}/${rest}${hashPart}`
    : `/docs/${projectId}/${version}${hashPart}`;
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

// ─── Component map factory — needs projectId/version for link rewriting. ─────

function buildMdxComponents(projectId?: string, version?: string) {
  return {
  // Custom MDX components
  Tabs,
  TabItem,
  LatestVersionBlock,
  SnapshotRepoBlock,
  ShadingBlock,
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
      return (
        <div className="my-6 w-full overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] p-6 flex justify-center [&_svg]:!max-w-[480px] [&_svg]:w-full [&_svg]:h-auto">
          <MermaidDiagram>{String(children)}</MermaidDiagram>
        </div>
      );
    }

    const meta = parseCodeMeta(props['data-meta']);
    return (
      <CodeBlock className={className} {...meta}>
        {String(children)}
      </CodeBlock>
    );
  },

  img: ({ src, alt, ...props }: any) => (
    <SmartImg
      src={src}
      alt={alt}
      className="rounded-lg max-w-full h-auto"
      {...props}
    />
  ),

  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http');
    const finalHref = isExternal ? href : rewriteDocHref(href, projectId, version);
    return (
      <a
        href={finalHref}
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
      className="bg-muted/30 rounded-lg px-5 py-4 italic my-4 text-muted-foreground"
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
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

/**
 * MDXRenderer Component
 *
 * Compiles and renders MDX content with full JSX support.
 * Heading IDs are assigned during compilation by rehypeHeadingIds.
 */
export const MDXRenderer = memo(({ content, className, projectId, version }: MDXRendererProps) => {
  const [MDXContent, setMDXContent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const mdxComponents = useMemo(() => buildMdxComponents(projectId, version), [projectId, version]);

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
          remarkPlugins: [remarkGfm, remarkDirective, remarkAdmonitions, remarkCodeMeta],
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