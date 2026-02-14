/**
 * CodeBlock Component
 * 
 * Syntax highlighted code block with copy functionality
 * This matches the exact implementation from the old MarkdownRenderer
 */

import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, darcula, oneDark, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  className?: string;
  children: string;
}

const LANGUAGE_THEMES: Record<string, any> = {
  xml: darcula,
  html: darcula,
  groovy: oneDark,
  gradle: oneDark,
  kotlin: materialDark,
  kt: materialDark,
};

export function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const theme = LANGUAGE_THEMES[language.toLowerCase()] || vscDarkPlus;
  const code = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={cn("code-block", `lang-${language}`)}>
      <div className="code-block-header">
        <span className="code-block-language">{language}</span>
        <Button variant="ghost" size="sm" className={cn('code-block-copy', copied && 'copied')} onClick={handleCopy}>
          {copied ? <><Check className="h-4 w-4" /><span>Copied!</span></> : <><Copy className="h-4 w-4" /><span>Copy</span></>}
        </Button>
      </div>
      <div className="code-block-content">
        <SyntaxHighlighter language={language} style={theme} PreTag="div" wrapLines={true}
          lineProps={{ style: { display: 'block', background: 'transparent', border: 'none', boxShadow: 'none' } }}
          customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '0.875rem' }}
          codeTagProps={{ style: { background: 'transparent', fontFamily: 'inherit' } }}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;
