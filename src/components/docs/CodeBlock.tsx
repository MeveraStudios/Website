/**
 * CodeBlock
 *
 * Syntax-highlighted code block with:
 *  - copy button
 *  - optional filename / title header
 *  - optional line numbers
 *  - `highlight` — emphasised lines (background tint)
 *  - `focus` — focused lines stay sharp, the rest are dimmed + blurred
 *    (hovering the block lifts the blur so everything is still readable)
 *  - word-wrap toggle
 *  - diff-language tinting
 *
 * Authoring syntax in fenced markdown (parsed by remark-code-meta):
 *
 *   ```ts title="src/foo.ts" focus={2,5-7} highlight={3} numbered wrap
 *   const a = 1
 *   ...
 *   ```
 *
 * When rendered as <CodeBlock /> directly in MDX, pass the same names as props.
 */

import { useCallback, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check, WrapText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCodeTheme } from '@/components/CodeThemeProvider';

interface CodeBlockProps {
  className?: string;
  children: string;

  /** Filename / caption shown in the header. */
  title?: string;
  /** Space/line list of focused lines, e.g. `"2,5-7"`. */
  focus?: string;
  /** Same syntax as `focus`, renders as highlighted background. */
  highlight?: string;
  /** Show 1-based line numbers. */
  numbered?: boolean;
  /** Wrap long lines instead of horizontal scroll. */
  wrap?: boolean;
  /** Hide the copy button. */
  noCopy?: boolean;
}

/** Parse `"2,5-7"` → `Set {2,5,6,7}`. */
function parseLineRanges(spec?: string): Set<number> {
  const set = new Set<number>();
  if (!spec) return set;
  for (const part of spec.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    for (let i = Math.min(start, end); i <= Math.max(start, end); i++) set.add(i);
  }
  return set;
}

export function CodeBlock({
  className,
  children,
  title,
  focus,
  highlight,
  numbered,
  wrap: wrapProp,
  noCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState<boolean>(!!wrapProp);
  const { currentStyle } = useCodeTheme();

  const language = (className?.replace('language-', '') || 'text').toLowerCase();
  const code = String(children).replace(/\n$/, '');
  const isDiff = language === 'diff' || language.startsWith('diff-');

  const focusLines = useMemo(() => parseLineRanges(focus), [focus]);
  const highlightLines = useMemo(() => parseLineRanges(highlight), [highlight]);
  const hasFocus = focusLines.size > 0;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const lineProps = useCallback(
    (lineNumber: number) => {
      const classes: string[] = ['line'];
      if (hasFocus) {
        classes.push(focusLines.has(lineNumber) ? 'focused' : 'dimmed');
      }
      if (highlightLines.has(lineNumber)) classes.push('highlighted');
      return {
        className: classes.join(' '),
        style: {
          display: 'block',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        } as React.CSSProperties,
      };
    },
    [focusLines, highlightLines, hasFocus]
  );

  return (
    <div
      className={cn(
        'code-block',
        `lang-${language}`,
        hasFocus && 'has-focus',
        numbered && 'with-line-numbers',
        wrap && 'wrap-lines',
        isDiff && 'is-diff'
      )}
    >
      <div className="code-block-header">
        <span className="code-block-language">
          {title ? <span className="code-block-title">{title}</span> : language}
        </span>
        <div className="code-block-actions">
          <Button
            variant="ghost"
            size="sm"
            className="code-block-wrap"
            onClick={() => setWrap(w => !w)}
            aria-pressed={wrap}
            title={wrap ? 'Disable wrap' : 'Enable wrap'}
          >
            <WrapText className="h-4 w-4" />
          </Button>
          {!noCopy && (
            <Button
              variant="ghost"
              size="sm"
              className={cn('code-block-copy', copied && 'copied')}
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy code'}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="code-block-content">
        <SyntaxHighlighter
          language={language}
          style={currentStyle}
          PreTag="div"
          wrapLines
          wrapLongLines={wrap}
          showLineNumbers={!!numbered}
          lineProps={lineProps}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          codeTagProps={{ style: { background: 'transparent', fontFamily: 'inherit' } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;
