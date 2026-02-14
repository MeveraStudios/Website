/**
 * Remark plugin to transform directive syntax (:::note, :::tip, etc.) into admonition divs
 * This plugin converts markdown like:
 * 
 * :::note
 * Content here
 * :::
 * 
 * Into divs with proper classes and data attributes for React components
 */

import { visit } from 'unist-util-visit';

export default function remarkAdmonitions() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {});
        // Transform to div with classes and data attributes
        data.hName = 'div';
        data.hProperties = {
          className: ['admonition', node.name].join(' '),
          'data-admonition-type': node.name
        };
      }
    });
  };
}
