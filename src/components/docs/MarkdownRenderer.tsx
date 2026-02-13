import React, { useState, useCallback, createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Header } from '@/types/docs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, Info, Lightbulb, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import '@/styles/admonitions.css';
import '@/styles/tabs.css';

// Context to track heading IDs and hierarchy within a single render pass
const HeadingContext = createContext<{
  headers: Map<string, Header>;
  state: { currentParentId: string };
} | null>(null);

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Robust Remark plugin to transform :::directive into admonition divs
 */
function remarkAdmonitions() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = {
          className: cn('admonition', node.name),
          'data-admonition-type': node.name
        };
      }
    });
  };
}

const ADMONITION_CONFIG = {
  note: { icon: Info, label: 'Note' },
  tip: { icon: Lightbulb, label: 'Tip' },
  info: { icon: Info, label: 'Info' },
  warning: { icon: AlertTriangle, label: 'Warning' },
  danger: { icon: AlertOctagon, label: 'Danger' },
  caution: { icon: AlertTriangle, label: 'Caution' },
};

function Admonition({ type, children }: { type: string; children: ReactNode }) {
  const config = ADMONITION_CONFIG[type as keyof typeof ADMONITION_CONFIG] || ADMONITION_CONFIG.note;
  const Icon = config.icon;
  return (
    <div className={cn('admonition', type)}>
      <div className="admonition-header">
        <Icon className="admonition-icon" />
        <span>{config.label}</span>
      </div>
      <div className="admonition-content">{children}</div>
    </div>
  );
}

import { Prism as SyntaxProps } from 'react-syntax-highlighter';
import { vscDarkPlus, darcula, oneDark, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, TabItem } from './Tabs';

const LANGUAGE_THEMES: Record<string, any> = {
  xml: darcula,
  html: darcula,
  groovy: oneDark,
  gradle: oneDark,
  kotlin: materialDark,
  kt: materialDark,
};

export function CodeBlock({ className, children }: { className?: string; children: string }) {
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
        <SyntaxProps language={language} style={theme} PreTag="div" wrapLines={true}
          lineProps={{ style: { display: 'block', background: 'transparent', border: 'none', boxShadow: 'none' } }}
          customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '0.875rem' }}
          codeTagProps={{ style: { background: 'transparent', fontFamily: 'inherit' } }}>
          {code}
        </SyntaxProps>
      </div>
    </div>
  );
}

function Heading({ level, children }: { level: 1 | 2 | 3 | 4 | 5 | 6; children: ReactNode }) {
  const context = useContext(HeadingContext);
  const text = typeof children === 'string' ? children : '';
  const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  let id = slug;
  if (context) {
    if (level === 2) { context.state.currentParentId = slug; id = slug; }
    else if (level === 3 && context.state.currentParentId) { id = `${context.state.currentParentId}.${slug}`; }
    context.headers.set(id, { id, link: `#${id}`, display: text });
  }
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className="group scroll-mt-20">
      <a href={`#${id}`} className="no-underline hover:no-underline">
        {children}
        <span className="ml-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground">#</span>
      </a>
    </Tag>
  );
}

import LatestVersionBlock from '@/components/LatestVersionBlock';

/**
 * Official MDX transformation logic.
 * Transforms tabs, imports, and JSX elements for proper rendering
 */
function compileMDX(content: string): string {
  // 1. Strip MDX imports and JS comments using global block matching
  let compiled = content
    .replace(/import\s+[\s\S]*?\s+from\s+['"].*?['"];?/g, '')
    .replace(/{\/\*[\s\S]*?\*\/}/g, '');

  // 2. Transform TabItem structure directly to data attributes
  // New syntax: <Tabs><TabItem value="x" label="Y" icon="z">content</TabItem></Tabs>
  // Also supports: label={<>...</>} for JSX/HTML content
  compiled = compiled.replace(
    /<Tabs[^>]*>([\s\S]*?)<\/Tabs>/gi,
    (match, tabsContent) => {
      // Check if using new TabItem syntax
      if (tabsContent.includes('<TabItem')) {
        // Split by TabItem tags more reliably
        const items: Array<{value: string; label: string; icon: string; content: string}> = [];
        
        // Find all TabItem blocks
        let currentIndex = 0;
        while (currentIndex < tabsContent.length) {
          const tabItemStart = tabsContent.indexOf('<TabItem', currentIndex);
          if (tabItemStart === -1) break;
          
          // Find the end of the opening tag
          const openTagEnd = tabsContent.indexOf('>', tabItemStart);
          if (openTagEnd === -1) break;
          
          const openingTag = tabsContent.substring(tabItemStart, openTagEnd + 1);
          
          // Find the closing tag
          const closingTag = '</TabItem>';
          const tabItemEnd = tabsContent.indexOf(closingTag, openTagEnd);
          if (tabItemEnd === -1) break;
          
          const content = tabsContent.substring(openTagEnd + 1, tabItemEnd);
          
          // Extract value
          const valueMatch = openingTag.match(/value=["']([^"']+)["']/i);
          const value = valueMatch ? valueMatch[1] : '';
          
          // Extract label and icon
          let label = '';
          let icon = '';
          
          // Check if label uses JSX syntax: label={...}
          if (openingTag.includes('label={')) {
            // Extract everything between label={ and the next closing }
            // that's not inside another attribute
            const labelStart = openingTag.indexOf('label={') + 7;
            let braceDepth = 0;
            let labelEnd = labelStart;
            let inString = false;
            let stringChar = '';
            
            for (let i = labelStart; i < openingTag.length; i++) {
              const char = openingTag[i];
              const prevChar = i > 0 ? openingTag[i - 1] : '';
              
              // Handle strings
              if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                if (!inString) {
                  inString = true;
                  stringChar = char;
                } else if (char === stringChar) {
                  inString = false;
                }
              }
              
              if (!inString) {
                if (char === '{') braceDepth++;
                else if (char === '}') {
                  if (braceDepth === 0) {
                    labelEnd = i;
                    break;
                  }
                  braceDepth--;
                }
              }
            }
            
            const labelContent = openingTag.substring(labelStart, labelEnd);
            
            // Extract img src
            const imgMatch = labelContent.match(/<img[^>]*src=["']([^"']+)["']/i);
            if (imgMatch) {
              icon = imgMatch[1];
            }
            
            // Extract text, remove all HTML tags
            label = labelContent
              .replace(/<[^>]+>/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          } else {
            // Simple string label
            const labelMatch = openingTag.match(/label=["']([^"']+)["']/i);
            label = labelMatch ? labelMatch[1] : value;
            
            const iconMatch = openingTag.match(/icon=["']([^"']+)["']/i);
            if (iconMatch) {
              icon = iconMatch[1];
            }
          }
          
          items.push({ value, label, icon, content });
          currentIndex = tabItemEnd + closingTag.length;
        }
        
        if (items.length === 0) {
          return match;
        }
        
        // Build output
        let newStructure = '<div data-component="tabs" class="tabs-wrapper">\n';
        
        items.forEach(item => {
          // Convert code blocks in content
          let processedContent = item.content.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (_m: string, lang: string, code: string) => {
            const language = lang || 'text';
            const escapedCode = code
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
          });
          
          newStructure += `  <div data-component="tabitem" data-value="${item.value}" data-label="${item.label}"`;
          if (item.icon) {
            newStructure += ` data-icon="${item.icon}"`;
          }
          newStructure += `>\n${processedContent}\n  </div>\n`;
        });
        
        newStructure += '</div>';
        return newStructure;
      }
      
      // Old syntax with TabList/Tab/TabPanel (for backward compatibility)
      const tabListMatch = tabsContent.match(/<TabList[^>]*>([\s\S]*?)<\/TabList>/i);
      const tabPanelsMatch = tabsContent.match(/<TabPanel[^>]*>([\s\S]*?)<\/TabPanel>/gi);
      
      if (!tabListMatch || !tabPanelsMatch) {
        return match; // Return original if structure is invalid
      }

      // Extract individual tabs from TabList (with optional attributes)
      const tabMatches = tabListMatch[1].matchAll(/<Tab[^>]*>([\s\S]*?)<\/Tab>/gi);
      const tabs = Array.from(tabMatches).map((m) => (m as RegExpMatchArray)[1].trim());

      // Extract TabPanel contents (with optional attributes)
      const panels = tabPanelsMatch.map((panel: string) => 
        panel.replace(/<\/?TabPanel[^>]*>/gi, '').trim()
      );

      // Build new structure with TabItem components
      let newStructure = '<div data-component="tabs" class="tabs-wrapper">\n';
      
      tabs.forEach((tabLabel, index) => {
        let panelContent = panels[index] || '';
        
        // Convert code blocks (```language ... ```) to <pre><code> tags for proper rendering inside tabs
        panelContent = panelContent.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (_match: string, lang: string, code: string) => {
          const language = lang || 'text';
          // Escape the code content to preserve it
          const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
        });
        
        // Extract image from tab label if present
        const imgMatch = tabLabel.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        const imgSrc = imgMatch ? imgMatch[1] : null;
        
        // Remove image tag from label to get clean text
        const cleanLabel = tabLabel.replace(/<img[^>]*>/gi, '').trim();
        
        // Generate a value from the label
        const value = cleanLabel.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        
        newStructure += `  <div data-component="tabitem" data-value="${value}" data-label="${cleanLabel}"`;
        if (imgSrc) {
          newStructure += ` data-icon="${imgSrc}"`;
        }
        newStructure += `>\n${panelContent}\n  </div>\n`;
      });
      
      newStructure += '</div>';
      return newStructure;
    }
  );

  // 3. Transform any remaining standalone JSX components
  const transformProps = (tagStr: string) => {
    let result = tagStr;
    // Convert JSX-style props: attr={value} -> attr="value"
    result = result.replace(/(\w+)={([^}]*)}/g, '$1="$2"');
    return result;
  };

  // Handle LatestVersionBlock as a custom component (both self-closing and regular)
  // First handle self-closing tags: <LatestVersionBlock ... />
  compiled = compiled.replace(/<LatestVersionBlock\b([^>]*?)\/>/gi, (_match, attrs) => {
    const transformedAttrs = transformProps(attrs);
    return `<div data-component="latestversionblock" ${transformedAttrs.trim()}></div>`;
  });

  // Then handle regular opening tags: <LatestVersionBlock ... >
  compiled = compiled.replace(/<LatestVersionBlock\b([^>]*)>/gi, (_match, attrs) => {
    const transformedAttrs = transformProps(attrs);
    return `<div data-component="latestversionblock" ${transformedAttrs.trim()}>`;
  });

  // Handle closing tags
  compiled = compiled.replace(/<\/LatestVersionBlock>/gi, () => '</div>');

  return compiled;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const compiledContent = useMemo(() => {
    const result = compileMDX(content);
    // Debug: Log the compiled content to see what's being generated
    if (content.includes('<Tabs>') || content.includes('<TabList>')) {
      console.log('Original content includes tabs');
      console.log('Compiled MDX:', result.substring(0, 500));
    }
    return result;
  }, [content]);

  const headingContextValue = useMemo(() => ({
    headers: new Map<string, Header>(),
    state: { currentParentId: '' }
  }), [content]);

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <HeadingContext.Provider value={headingContextValue}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkDirective, remarkAdmonitions]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ className, children, ...props }: any) {
              if (className) return <CodeBlock className={className}>{String(children)}</CodeBlock>;
              return <code className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono text-[0.9em]" {...props}>{children}</code>;
            },

            h1: ({ children }: any) => <Heading level={1}>{children}</Heading>,
            h2: ({ children }: any) => <Heading level={2}>{children}</Heading>,
            h3: ({ children }: any) => <Heading level={3}>{children}</Heading>,
            h4: ({ children }: any) => <Heading level={4}>{children}</Heading>,
            h5: ({ children }: any) => <Heading level={5}>{children}</Heading>,
            h6: ({ children }: any) => <Heading level={6}>{children}</Heading>,

            div({ className, children, ...props }: any) {
              // Handle tabs wrapper
              const dataComponent = (props as Record<string, any>)['data-component'];
              if (dataComponent === 'tabs') {
                console.log('Found tabs wrapper with props:', props);
                console.log('Children:', children);
                
                // Extract tabitem children - they come as div elements with data attributes
                const tabItems: any[] = [];
                
                React.Children.forEach(children, (child: any) => {
                  if (React.isValidElement(child)) {
                    const childProps = child.props as Record<string, any>;
                    if (childProps?.['data-component'] === 'tabitem') {
                    const value = childProps['data-value'];
                    const label = childProps['data-label'];
                    const icon = childProps['data-icon'];
                    
                    console.log('Found tabitem:', { value, label, icon });
                    
                    tabItems.push({
                      value,
                      label,
                      icon,
                      children: childProps.children
                    });
                  }
                  }
                });
                
                console.log('Total tab items found:', tabItems.length);
                
                if (tabItems.length === 0) {
                  return <div className={className}>{children}</div>;
                }
                
                return (
                  <Tabs defaultValue={tabItems[0]?.value}>
                    {tabItems.map((item) => (
                      <TabItem
                        key={item.value}
                        value={item.value}
                        label={item.label}
                        icon={item.icon}
                      >
                        {item.children}
                      </TabItem>
                    ))}
                  </Tabs>
                );
              }
              
              // Handle tabitem - just return as div, the tabs wrapper will process it
              if (dataComponent === 'tabitem') {
                return children; // Return raw children, will be processed by tabs wrapper
              }
              
              // Handle LatestVersionBlock
              if (dataComponent === 'latestversionblock') {
                return <LatestVersionBlock {...props} />;
              }
              
              // Handle admonitions
              if (className?.includes('admonition')) {
                return <Admonition type={props['data-admonition-type'] || 'note'}>{children}</Admonition>;
              }
              
              return <div className={className} {...props}>{children}</div>;
            },

            LatestVersionBlock: (props: any) => <LatestVersionBlock {...props} />
          } as any}
        >
          {compiledContent}
        </ReactMarkdown>
      </HeadingContext.Provider>
    </div>
  );
}
