/**
 * MDXRenderer Component
 * 
 * Renders MDX content (markdown with JSX) using @mdx-js/react
 * This properly compiles and renders JSX components embedded in markdown
 */

import { memo, useEffect, useState } from 'react';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkAdmonitions from './remark-admonitions';
import { CodeBlock } from './CodeBlock';
import { Admonition } from './Admonition';
import { Tabs, TabItem } from './Tabs';
import LatestVersionBlock from '@/components/LatestVersionBlock';
import { cn } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/code-theme.css';
import '@/styles/tabs.css';

interface MDXRendererProps {
  content: string;
  className?: string;
}

/**
 * Heading component with automatic ID generation and anchor links
 * Same implementation as MarkdownRenderer for consistency
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
 * MDX components that will be available in MDX files
 */
const mdxComponents = {
  // Custom components
  Tabs,
  TabItem,
  LatestVersionBlock,
  Admonition,
  CodeBlock,

  // Headings with anchor links (same as MarkdownRenderer)
  h1: ({ children }: any) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }: any) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }: any) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }: any) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }: any) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }: any) => <Heading level={6}>{children}</Heading>,

  // Standard HTML elements with enhancements
  code: ({ className, children, ...props }: any) => {
    // Inline code
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
    // Code block
    return <CodeBlock className={className}>{String(children)}</CodeBlock>;
  },

  // Enhanced images
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="rounded-lg max-w-full h-auto"
      {...props}
    />
  ),

  // Enhanced links
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

  // Handle divs for admonitions
  div: ({ className, children, ...props }: any) => {
    if (className?.includes('admonition')) {
      const type = (props as Record<string, any>)['data-admonition-type'] || 'note';
      return <Admonition type={type}>{children}</Admonition>;
    }
    return <div className={className} {...props}>{children}</div>;
  },
};

/**
 * MDXRenderer Component
 * 
 * Compiles and renders MDX content with full JSX support
 */
export const MDXRenderer = memo(({ content, className }: MDXRendererProps) => {
  const [MDXContent, setMDXContent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function compileMDX() {
      try {
        // Compile MDX to JavaScript
        const compiled = await compile(content, {
          outputFormat: 'function-body',
          development: false,
          remarkPlugins: [remarkGfm, remarkDirective, remarkAdmonitions],
          // Note: rehype-raw is not compatible with MDX - MDX already handles JSX natively
        });

        if (cancelled) return;

        // Run the compiled code to get the component
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

  // Show error state
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

  // Show loading state
  if (!MDXContent) {
    return (
      <div className={cn('prose prose-invert max-w-none', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Render the MDX content
  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <MDXContent components={mdxComponents} />
    </div>
  );
});

MDXRenderer.displayName = 'MDXRenderer';

export default MDXRenderer;
