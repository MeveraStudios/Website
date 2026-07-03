import { useState, Children, isValidElement, useSyncExternalStore, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
 * - Cross-instance group sync (via `group` prop + localStorage)
 */
export function Tabs({ defaultValue, children, className, group }: TabsProps) {
  // Extract TabItem children
  const tabs = Children.toArray(children).filter(
    (child) => isValidElement(child) && (child.type === TabItem || child.type === 'TabItem')
  );

  const firstTabValue = isValidElement(tabs[0]) ? (tabs[0].props as TabItemProps).value : '';

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
    <div className={cn('tabs-container my-6', className)}>
      {/* Tab headers */}
      <div className="tabs-list flex flex-wrap gap-1 mb-4">
        {tabs.map((tab) => {
          if (!isValidElement(tab)) return null;
          const { value, label, icon } = tab.props as TabItemProps;

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
