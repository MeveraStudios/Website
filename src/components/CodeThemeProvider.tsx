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
  materialLight,
  oneLight,
  prism as prismDefault,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * IntelliJ "Dracula" Java palette.
 *
 * Matches the official JetBrains Dracula plugin colour scheme — the prism
 * `dracula` style ships a generic web variant that doesn't line up with how
 * IntelliJ paints Java tokens (keywords pink, classes green-italic,
 * annotations yellow, numbers purple, strings yellow, comments grey-italic).
 *
 * Reference colours (Dracula spec):
 *   bg #282A36 · fg #F8F8F2 · selection #44475A · comment #6272A4
 *   cyan #8BE9FD · green #50FA7B · orange #FFB86C · pink #FF79C6
 *   purple #BD93F9 · red #FF5555 · yellow #F1FA8C
 */
const draculaIntellij: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#F8F8F2',
    background: 'none',
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: 1.5,
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#F8F8F2',
    background: '#282A36',
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: 1.5,
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: 0,
    overflow: 'auto',
    borderRadius: '0.5em',
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#282A36',
    padding: '0.1em 0.3em',
    borderRadius: '0.3em',
    whiteSpace: 'normal',
  },

  comment: { color: '#6272A4', fontStyle: 'italic' },
  prolog: { color: '#6272A4', fontStyle: 'italic' },
  doctype: { color: '#6272A4', fontStyle: 'italic' },
  cdata: { color: '#6272A4', fontStyle: 'italic' },

  punctuation: { color: '#F8F8F2' },
  '.namespace': { opacity: 0.7 },

  property: { color: '#FF79C6' },
  tag: { color: '#FF79C6' },
  constant: { color: '#BD93F9' },
  symbol: { color: '#BD93F9' },
  boolean: { color: '#BD93F9' },
  number: { color: '#BD93F9' },
  deleted: { color: '#FF5555' },

  selector: { color: '#50FA7B' },
  'attr-name': { color: '#50FA7B' },
  string: { color: '#F1FA8C' },
  char: { color: '#F1FA8C' },
  builtin: { color: '#8BE9FD', fontStyle: 'italic' },
  inserted: { color: '#50FA7B' },

  operator: { color: '#FF79C6' },
  entity: { color: '#F8F8F2', cursor: 'help' },
  url: { color: '#8BE9FD' },
  '.language-css .token.string': { color: '#F1FA8C' },
  '.style .token.string': { color: '#F1FA8C' },
  variable: { color: '#F8F8F2' },

  atrule: { color: '#F1FA8C' },
  'attr-value': { color: '#F1FA8C' },
  keyword: { color: '#FF79C6', fontWeight: 'bold' },

  // Java method calls + function definitions: bright green.
  function: { color: '#50FA7B' },
  // Java class names: cyan italic (IntelliJ Dracula signature look).
  'class-name': { color: '#8BE9FD', fontStyle: 'italic' },
  // Annotations (`@Override`, `@Inject`): yellow, bold.
  annotation: { color: '#F1FA8C', fontWeight: 'bold' },

  regex: { color: '#FF5555' },
  important: { color: '#FFB86C', fontWeight: 'bold' },

  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

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
    label: 'Dracula (IntelliJ)',
    mode: 'dark',
    style: draculaIntellij,
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
