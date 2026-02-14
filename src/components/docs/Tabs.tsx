import { useState, Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabItemProps {
  value: string;
  label: ReactNode;
  icon?: string;
  children: ReactNode;
}

interface TabsProps {
  defaultValue?: string;
  children: ReactNode;
  className?: string;
  groupId?: string;
}

/**
 * TabItem component - represents a single tab
 */
export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}

/**
 * Tabs component - container for multiple tabs with support for:
 * - Nested tabs
 * - Images/icons in tab labels
 * - Markdown and HTML content
 */
export function Tabs({ defaultValue, children, className }: TabsProps) {
  // Extract TabItem children
  const tabs = Children.toArray(children).filter(
    (child) => isValidElement(child) && (child.type === TabItem || child.type === 'TabItem')
  );

  const [activeTab, setActiveTab] = useState(
    defaultValue || (isValidElement(tabs[0]) ? (tabs[0].props as TabItemProps).value : '')
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn('tabs-container my-6', className)}>
      {/* Tab headers */}
      <div className="tabs-list flex flex-wrap gap-1 mb-4">
        {tabs.map((tab) => {
          if (!isValidElement(tab)) return null;
          const { value, label, icon } = tab.props as TabItemProps;

          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={cn(
                'tab-trigger',
                activeTab === value && 'active'
              )}
            >
              <span className="flex items-center gap-2">
                {icon && (
                  <img
                    src={icon}
                    alt={`${label} icon`}
                    className="h-5 w-5 object-contain"
                    style={{ maxHeight: '20px', maxWidth: '20px' }}
                  />
                )}
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="tabs-content">
        {tabs.map((tab) => {
          if (!isValidElement(tab)) return null;
          const { value, children: tabChildren } = tab.props as TabItemProps;

          return (
            <div
              key={value}
              className={cn(
                'tab-panel',
                activeTab === value ? 'block animate-in fade-in duration-300' : 'hidden'
              )}
            >
              {tabChildren}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CodeTabs component - specialized tabs for code blocks with language selection
 */
interface CodeTabsProps {
  children: ReactNode;
  className?: string;
}

export function CodeTabs({ children, className }: CodeTabsProps) {
  return <Tabs className={cn('code-tabs', className)}>{children}</Tabs>;
}
