/**
 * Remark plugin to transform directive syntax (:::note, :::tip, etc.) into admonition divs
 * 
 * For Markdown (.md) files:
 * :::note
 * Content here
 * :::
 * 
 * Or with custom properties:
 * :::tip{label="HELLO WORLD"}
 * Content here
 * :::
 * 
 * Or with custom colors (use kebab-case for property names):
 * :::custom{side-color="#ff0000" bg-color="#ff000020" label="Custom Title" icon="LightBulb"}
 * Content here
 * :::
 * 
 * For MDX (.mdx) files, use JSX component syntax instead:
 * <Admonition type="custom" sideColor="#ff0000" bgColor="#ff000020" title="Custom Title" icon="LightBulb">
 * Content here
 * </Admonition>
 * 
 * Note: MDX files cannot use directive syntax with attributes due to JSX parsing conflicts.
 * Use direct component syntax with camelCase props instead.
 */

import { visit } from 'unist-util-visit';

/**
 * Parse custom attributes from string with comma separation
 * e.g., 'sideColor="#ff0000", bgColor="#ff000020", label="Title", icon="LightBulb"'
 * Also supports camelCase and kebab-case for backward compatibility
 */
function parseCustomAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  // Match key="value" or key='value' patterns, handling commas and spaces
  const regex = /(\w+(?:-\w+)*)=["']([^"']+)["']/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2];
    
    // Normalize keys: convert kebab-case to camelCase if needed
    const normalizedKey = key.includes('-') 
      ? key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      : key;
    
    attrs[normalizedKey] = value;
  }
  
  return attrs;
}

export default function remarkAdmonitions() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {});
        
        let customLabel: string | undefined;
        let directiveType = node.name;
        let sideColor: string | undefined;
        let bgColor: string | undefined;
        let customIcon: string | undefined;
        
        // First, try to parse from node.attributes (if remark-directive parsed successfully)
        if (node.attributes && Object.keys(node.attributes).length > 0) {
          // Get label from attributes
          if (node.attributes.label) {
            customLabel = node.attributes.label;
          }
          
          // Get icon attribute
          if (node.attributes.icon !== undefined) {
            customIcon = node.attributes.icon;
          }
          
          // Get color attributes (support both camelCase and kebab-case)
          if (node.attributes.sideColor) {
            sideColor = node.attributes.sideColor;
          } else if (node.attributes['side-color']) {
            sideColor = node.attributes['side-color'];
          }
          
          if (node.attributes.bgColor) {
            bgColor = node.attributes.bgColor;
          } else if (node.attributes['bg-color']) {
            bgColor = node.attributes['bg-color'];
          }
        }
        
        // Fallback: if remark-directive couldn't parse (e.g., due to comma syntax),
        // try to get raw attribute string and parse it manually
        // Check if there's attribute content that failed to parse
        if (!sideColor && !bgColor && !customLabel && !customIcon) {
          // Try to access raw attribute string from node properties
          const attrString = node.attributes?._raw || '';
          if (attrString) {
            const parsed = parseCustomAttributes(attrString);
            customLabel = parsed.label;
            customIcon = parsed.icon;
            sideColor = parsed.sideColor || parsed['side-color'];
            bgColor = parsed.bgColor || parsed['bg-color'];
          }
        }
        
        // Transform to div with classes and data attributes
        data.hName = 'div';
        data.hProperties = {
          className: ['admonition', directiveType].join(' '),
          'data-admonition-type': directiveType,
          ...(customLabel && { 'data-admonition-title': customLabel }),
          ...(customIcon !== undefined && { 'data-admonition-icon': customIcon }),
          ...(sideColor && { 'data-admonition-side-color': sideColor }),
          ...(bgColor && { 'data-admonition-bg-color': bgColor })
        };
      }
    });
  };
}
