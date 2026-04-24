/**
 * CodeThemeProvider
 *
 * Global syntax-highlighting theme for every <CodeBlock /> across every
 * project's docs. Themes are grouped by `mode` ('dark' | 'light') and only
 * the group matching the current website theme is offered.
 *
 * Each mode keeps its own persisted choice, so switching the site from dark
 * to light (or back) restores the user's last-picked theme for that mode.
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
import { useTheme } from 'next-themes';
import {
  materialOceanic,
  vscDarkPlus,
  dracula,
  materialLight,
  oneLight,
  prism as prismDefault,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

export type CodeThemeMode = 'dark' | 'light';

export type CodeThemeId =
  // dark
  | 'material-deep-ocean'
  | 'vs-code-dark-plus'
  | 'dracula'
  // light
  | 'material-light'
  | 'one-light'
  | 'github-light';

interface CodeThemeDef {
  id: CodeThemeId;
  label: string;
  mode: CodeThemeMode;
  style: { [key: string]: React.CSSProperties };
}

export const CODE_THEMES: CodeThemeDef[] = [
  // ─── Dark ────────────────────────────────────────────────────────────────
  {
    id: 'material-deep-ocean',
    label: 'Material Deep Ocean',
    mode: 'dark',
    style: materialOceanic as { [key: string]: React.CSSProperties },
  },
  {
    id: 'vs-code-dark-plus',
    label: 'VS Code Dark+',
    mode: 'dark',
    style: vscDarkPlus as { [key: string]: React.CSSProperties },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    mode: 'dark',
    style: dracula as { [key: string]: React.CSSProperties },
  },

  // ─── Light ───────────────────────────────────────────────────────────────
  {
    id: 'material-light',
    label: 'Material Light',
    mode: 'light',
    style: materialLight as { [key: string]: React.CSSProperties },
  },
  {
    id: 'one-light',
    label: 'One Light',
    mode: 'light',
    style: oneLight as { [key: string]: React.CSSProperties },
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    mode: 'light',
    style: prismDefault as { [key: string]: React.CSSProperties },
  },
];

const DEFAULT_BY_MODE: Record<CodeThemeMode, CodeThemeId> = {
  dark: 'material-deep-ocean',
  light: 'material-light',
};

const STORAGE_KEY = (mode: CodeThemeMode) => `meveradocs:code-theme:${mode}`;

interface CodeThemeContextValue {
  /** Themes available for the current website theme mode. */
  themes: CodeThemeDef[];
  /** Currently-selected theme id for the current mode. */
  themeId: CodeThemeId;
  /** Set the theme for the current mode. */
  setThemeId: (id: CodeThemeId) => void;
  /** Prism style object to hand directly to SyntaxHighlighter. */
  currentStyle: { [key: string]: React.CSSProperties };
  /** The active mode, derived from next-themes. */
  mode: CodeThemeMode;
}

const CodeThemeContext = createContext<CodeThemeContextValue | null>(null);

function readStored(mode: CodeThemeMode): CodeThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY(mode));
    if (stored && CODE_THEMES.some(t => t.id === stored && t.mode === mode)) {
      return stored as CodeThemeId;
    }
  } catch {
    // ignore (private mode / SSR)
  }
  return DEFAULT_BY_MODE[mode];
}

export function CodeThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mode: CodeThemeMode = resolvedTheme === 'light' ? 'light' : 'dark';

  // Remember each mode's selection independently.
  const [darkId, setDarkId] = useState<CodeThemeId>(() => readStored('dark'));
  const [lightId, setLightId] = useState<CodeThemeId>(() => readStored('light'));

  const themeId = mode === 'dark' ? darkId : lightId;

  useEffect(() => {
    document.documentElement.setAttribute('data-code-theme', themeId);
  }, [themeId]);

  const setThemeId = useCallback(
    (id: CodeThemeId) => {
      const target = CODE_THEMES.find(t => t.id === id);
      if (!target) return;
      // Only accept themes that match the current mode.
      if (target.mode !== mode) return;
      if (mode === 'dark') setDarkId(id);
      else setLightId(id);
      try {
        localStorage.setItem(STORAGE_KEY(mode), id);
      } catch {
        // ignore
      }
    },
    [mode]
  );

  const value = useMemo<CodeThemeContextValue>(() => {
    const available = CODE_THEMES.filter(t => t.mode === mode);
    const current =
      available.find(t => t.id === themeId) ??
      CODE_THEMES.find(t => t.id === DEFAULT_BY_MODE[mode])!;
    return {
      themes: available,
      themeId: current.id,
      setThemeId,
      currentStyle: current.style,
      mode,
    };
  }, [mode, themeId, setThemeId]);

  return (
    <CodeThemeContext.Provider value={value}>{children}</CodeThemeContext.Provider>
  );
}

export function useCodeTheme(): CodeThemeContextValue {
  const ctx = useContext(CodeThemeContext);
  if (!ctx) {
    const fallback = CODE_THEMES.find(t => t.id === DEFAULT_BY_MODE.dark)!;
    return {
      themes: CODE_THEMES.filter(t => t.mode === 'dark'),
      themeId: fallback.id,
      setThemeId: () => {},
      currentStyle: fallback.style,
      mode: 'dark',
    };
  }
  return ctx;
}
