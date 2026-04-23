/**
 * CodeThemeProvider
 *
 * Global, user-chosen syntax-highlighting theme for every <CodeBlock /> across
 * every project's docs. Persists the choice in localStorage.
 *
 * Three built-in themes — add more by appending to `CODE_THEMES` below.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  materialOceanic,
  vscDarkPlus,
  dracula,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

export type CodeThemeId = 'material-deep-ocean' | 'vs-code-dark-plus' | 'dracula';

interface CodeThemeDef {
  id: CodeThemeId;
  label: string;
  style: { [key: string]: React.CSSProperties };
}

export const CODE_THEMES: CodeThemeDef[] = [
  {
    id: 'material-deep-ocean',
    label: 'Material Deep Ocean',
    style: materialOceanic as { [key: string]: React.CSSProperties },
  },
  {
    id: 'vs-code-dark-plus',
    label: 'VS Code Dark+',
    style: vscDarkPlus as { [key: string]: React.CSSProperties },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    style: dracula as { [key: string]: React.CSSProperties },
  },
];

const DEFAULT_THEME: CodeThemeId = 'material-deep-ocean';
const STORAGE_KEY = 'meveradocs:code-theme';

interface CodeThemeContextValue {
  themeId: CodeThemeId;
  setThemeId: (id: CodeThemeId) => void;
  themes: CodeThemeDef[];
  currentStyle: { [key: string]: React.CSSProperties };
}

const CodeThemeContext = createContext<CodeThemeContextValue | null>(null);

function readStoredTheme(): CodeThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CODE_THEMES.some(t => t.id === stored)) return stored as CodeThemeId;
  } catch {
    // ignore (SSR / private mode)
  }
  return DEFAULT_THEME;
}

export function CodeThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<CodeThemeId>(() => readStoredTheme());

  // Keep a `data-code-theme` attribute on <html> so CSS can react too
  // (e.g. to tweak the header / background when a theme changes).
  useEffect(() => {
    document.documentElement.setAttribute('data-code-theme', themeId);
  }, [themeId]);

  const setThemeId = useCallback((id: CodeThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<CodeThemeContextValue>(() => {
    const current = CODE_THEMES.find(t => t.id === themeId) ?? CODE_THEMES[0];
    return {
      themeId,
      setThemeId,
      themes: CODE_THEMES,
      currentStyle: current.style,
    };
  }, [themeId, setThemeId]);

  return (
    <CodeThemeContext.Provider value={value}>{children}</CodeThemeContext.Provider>
  );
}

export function useCodeTheme(): CodeThemeContextValue {
  const ctx = useContext(CodeThemeContext);
  if (!ctx) {
    // Fall back to default so rendering never crashes if a consumer is mounted
    // outside the provider (shouldn't happen — provider wraps <App />).
    return {
      themeId: DEFAULT_THEME,
      setThemeId: () => {},
      themes: CODE_THEMES,
      currentStyle: CODE_THEMES[0].style,
    };
  }
  return ctx;
}
