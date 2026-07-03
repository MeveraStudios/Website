import { useState, Children, isValidElement, useSyncExternalStore, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

const STORAGE_PREFIX = 'tabs-group-';

function getGroupValue(group: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${group}`);
  } catch {
    return null;
  }
}

function setGroupValue(group: string, value: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${group}`, value);
  } catch {}
  window.dispatchEvent(
    new CustomEvent('tabs-group-change', { detail: { group, value } })
  );
}

function subscribeToGroup(group: string, cb: () => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail.group === group) cb();
  };
  window.addEventListener('tabs-group-change', handler);
  return () => window.removeEventListener('tabs-group-change', handler);
}

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
  group?: string;
}

type TabChild = TabItemProps & { value: string; label: ReactNode; icon?: string; children: ReactNode };

/**
 * TabItem component - represents a single tab
 */
export function TabItem({ children }: TabItemProps) {
  return <>{children}</>;
}

interface CodeTabItemProps {
  value: string;
  label: ReactNode;
  icon?: string;
  language?: string;
  title?: string;
  highlight?: string;
  focus?: string;
  numbered?: boolean;
  wrap?: boolean;
  noCopy?: boolean;
  children: string;
}

/**
 * CodeTabItem - tab item that renders children as a CodeBlock directly,
 * without extra padding or wrappers.
 */
export function CodeTabItem({ children, language, title, highlight, focus, numbered, wrap, noCopy }: CodeTabItemProps) {
  return (
    <CodeBlock
      className={`language-${language || 'text'}`}
      title={title}
      highlight={highlight}
      focus={focus}
      numbered={numbered}
      wrap={wrap}
      noCopy={noCopy}
    >
      {String(children).replace(/^\n+/, '').replace(/\n+\s*$/, '')}
    </CodeBlock>
  );
}

function isTabElement(child: unknown): child is React.ReactElement<TabChild> {
  return isValidElement(child) && (child.type === TabItem || child.type === CodeTabItem || child.type === 'TabItem');
}

/**
 * Tabs component - container for multiple tabs with support for:
 * - Nested tabs
 * - Images/icons in tab labels
 * - Markdown and HTML content
 * - Cross-instance group sync (via `group` prop + localStorage)
 */
export function Tabs({ defaultValue, children, className, group }: TabsProps) {
  // Extract TabItem/CodeTabItem children
  const tabs = Children.toArray(children).filter(isTabElement);

  const firstTabValue = tabs.length > 0 ? tabs[0].props.value : '';

  // All tabs are CodeTabItem ⇒ code-only variant
  const allCodeTabs = tabs.length > 0 && tabs.every(t => t.type === CodeTabItem);

  // External snapshot for group-synced tabs
  const groupSnapshot = group
    ? useSyncExternalStore(
        useCallback((cb: () => void) => subscribeToGroup(group, cb), [group]),
        () => getGroupValue(group)
      )
    : null;

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (group) {
      const stored = getGroupValue(group);
      if (stored) return stored;
    }
    return defaultValue || firstTabValue;
  });

  // Sync when external group value changes
  useEffect(() => {
    if (group && groupSnapshot && groupSnapshot !== activeTab) {
      setActiveTab(groupSnapshot);
    }
  }, [group, groupSnapshot, activeTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (group) setGroupValue(group, value);
    },
    [group]
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn('tabs-container my-6', allCodeTabs && 'tabs-container-code', className)}>
      {/* Tab headers */}
      <div className="tabs-list flex flex-wrap gap-1 mb-4">
        {tabs.map((tab) => {
          const { value, label, icon } = tab.props;

          return (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
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
          const value = tab.props.value;
          const isCode = tab.type === CodeTabItem || tab.type === 'CodeTabItem';

          return (
            <div
              key={value}
              className={cn(
                'tab-panel',
                allCodeTabs && 'tab-panel-code',
                activeTab === value ? 'block animate-in fade-in duration-300' : 'hidden'
              )}
            >
              {isCode ? tab : tab.props.children}
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
