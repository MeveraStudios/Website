# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**MeveraDocs** — public documentation site for Mevera Studios' open-source libraries (Imperat, Lotus, Scofi, Synapse). Vite + React 19 + TypeScript, Tailwind, Radix UI, MDX.

## Commands

- `npm run dev` — runs `precompile` then Vite dev server.
- `npm run build` — `precompile` → `tsc -b` → `vite build`.
- `npm run precompile` — `tsx scripts/precompile-docs.ts`. Must run after changing anything under `docs/` or `src/data/projects.json`.
- `npm run lint` — ESLint.
- `npm run preview` — serve production build.

The dev/build scripts already chain `precompile`; only run it standalone when regenerating `public/docs.json` without starting Vite.

## Architecture

### Build-time doc pipeline
`scripts/precompile-docs.ts` walks `docs/<Project>/<Category>/<Doc>.(md|mdx)`, parses frontmatter with `gray-matter`, reads each folder's `_category_.yml`, and emits static JSON into `public/` for runtime fetch. Projects are declared in `src/data/projects.json`; the script respects that order.

### Runtime
- `src/main.tsx` → `src/App.tsx` sets up `BrowserRouter` with routes:
  - `/` → `pages/Home.tsx` (Hero, Projects, Team sections)
  - `/docs/:projectId/:slug` → `pages/Docs.tsx`
  - `/docs/:projectId` and `/docs` redirect via `SITE_CONFIG.getStartedUrl`
- `ScrollManager` + `PageTitle` live in `App.tsx` and handle hash scrolling and per-route titles.
- Docs pages are lazy-loaded via `React.lazy`; `preloadDocs()` warms the JSON fetch.

### Docs rendering
- `src/components/docs/MarkdownRenderer.tsx` / `MDXRenderer.tsx` — unified pipeline using `remark-gfm`, `remark-directive`, `rehype-slug`, `rehype-autolink-headings`, `rehype-highlight`.
- `remark-admonitions.ts` converts `:::tip`/`:::note`/`:::info`/`:::caution`/`:::danger` directives into `<Admonition>` nodes.
- Built-in MDX components: `<LatestVersionBlock>`, `<ShadingBlock>`, `<SnapshotRepoBlock>`, `<CodeBlock>`, `<Tabs>`.
- `TableOfContents.tsx` + `DocNavigation.tsx` + `SearchDialog.tsx` drive the docs shell alongside `components/layout/Sidebar.tsx`.

### Layout & styling
- `src/components/layout/` — `Header`, `Footer`, `Sidebar`.
- `src/components/ui/` — shadcn-style Radix wrappers.
- Tailwind config uses class-based dark mode (`darkMode: ["class"]`). Design tokens are CSS variables in `src/index.css` (`--background`, `--foreground`, `--primary`, etc.) consumed via `tailwind.config.js`.
- Supplementary CSS: `src/styles/code-theme.css` (syntax highlighting, both themes), `src/styles/admonitions.css`, `src/styles/tabs.css`.
- Theme switching uses `next-themes` with `attribute="class"`; a `.light` class on `<html>` flips the token set.

### Configuration
- `src/config/site.ts` — brand name, URLs, navigation, feature flags.
- `src/data/projects.json` — canonical project list (id, title, colors, `docLink`, GitHub repo).

## Authoring docs

- Path: `docs/<Project>/<Category-Folder>/<Doc>.mdx`. URL is `/docs/<Project>/<filename>` — the category folder name is **not** in the URL.
- Every category folder needs a `_category_.yml` (`label`, `order`, `collapsed`).
- Every doc needs frontmatter: `title`, `description`, `order`.
- **Cross-doc links must be absolute** (`/docs/<Project>/<File>`), not relative — relative paths do not resolve after flattening.
- Prefer admonitions over bold-text warnings.
- Lotus authoritative source lives at `D:\Projects 2025\Lotus\docs\*.md` — mirror from there when updating Lotus docs.

## Conventions

- Path alias `@/*` → `src/*` (see `tsconfig.app.json`, `vite.config.ts`).
- Absolute import with `@/` is preferred over relative for `src/`.
- Don't commit generated `public/docs.json` edits by hand — regenerate via `npm run precompile`.
