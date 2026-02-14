/**
 * Remark plugin to transform directive syntax (:::note, :::tip, etc.) into admonition divs
 * This plugin converts markdown like:
 * 
 * :::note
 * Content here
 * :::
 * 
 * Or with custom properties:
 * :::tip{label="HELLO WORLD"}
 * Content here
 * :::
 * 
 * Or with custom colors:
 * :::custom{side-color="#ff0000" bg-color="#ff000020" label="Custom Title"}
 * Content here
 * :::
 * 
 * Into divs with proper classes and data attributes for React components
 */

import { visit } from 'unist-util-visit';

/**
 * Parse custom attributes from string (legacy support)
 * e.g., 'side-color="#ff0000", bg-color="#ff000020", label="Title"'
 */
function parseCustomAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  // Match key="value" or key='value' patterns
  const regex = /(\w+(?:-\w+)*)=["']([^"']+)["']/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
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
        
        // Check node.attributes (remark-directive puts brace content here)
        if (node.attributes) {
          // Get label from attributes
          if (node.attributes.label) {
            customLabel = node.attributes.label;
          }
          
          // Get icon attribute
          if (node.attributes.icon !== undefined) {
            customIcon = node.attributes.icon;
          }
          
          // Get color attributes
          if (node.attributes['side-color']) {
            sideColor = node.attributes['side-color'];
          }
          if (node.attributes['bg-color']) {
            bgColor = node.attributes['bg-color'];
          }
        }
        
        // If we still don't have colors but the directive is custom,
        // try to parse from the label attribute (legacy support)
        if (directiveType === 'custom' && node.attributes?.label && !sideColor) {
          const labelContent = node.attributes.label;
          const attrs = parseCustomAttributes(labelContent);
          if (Object.keys(attrs).length > 0) {
            sideColor = attrs['side-color'];
            bgColor = attrs['bg-color'];
            customLabel = attrs['label'];
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
