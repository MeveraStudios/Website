/**
 * Javadoc → MDX generator.
 *
 * Converts a Javadoc HTML output tree (produced by `javadoc -html5 ...`) into
 * a flat MDX tree under `docs/<Project>/API/` so Imperat / Lotus / Scofi /
 * Synapse can surface machine-generated class references alongside
 * hand-written guides.
 *
 * This script is intentionally dependency-light — it parses Javadoc HTML with
 * regex heuristics rather than a full DOM parser. The generator is idempotent:
 * re-running it overwrites any previously-generated MDX in the target folder.
 *
 * Usage:
 *
 *   npx tsx scripts/javadoc-to-mdx.ts \
 *       --input /path/to/javadoc-output \
 *       --project Imperat \
 *       --outDir docs
 *
 * Optional flags:
 *
 *   --clean         Wipe the output API/ folder before writing.
 *   --order <n>     Frontmatter `order` for generated category (default 900).
 *   --label <text>  Human label for the generated category (default "API").
 *
 * Expected Javadoc layout (as emitted by the standard doclet):
 *
 *   index.html
 *   allclasses-index.html
 *   <package>/<Class>.html
 *
 * Each class page is parsed for:
 *   - title (class / interface / enum name)
 *   - package
 *   - class-level description (first <section class="description">)
 *   - method summary table (method signature + first-line description)
 *
 * Output MDX frontmatter:
 *
 *   ---
 *   title: Foo
 *   description: Brief description (first sentence).
 *   order: 10
 *   sidebarLabel: Foo
 *   ---
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
  rmSync,
} from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

interface Options {
  input: string;
  project: string;
  outDir: string;
  clean: boolean;
  categoryOrder: number;
  categoryLabel: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    input: '',
    project: '',
    outDir: 'docs',
    clean: false,
    categoryOrder: 900,
    categoryLabel: 'API',
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--input':
        opts.input = argv[++i];
        break;
      case '--project':
        opts.project = argv[++i];
        break;
      case '--outDir':
        opts.outDir = argv[++i];
        break;
      case '--clean':
        opts.clean = true;
        break;
      case '--order':
        opts.categoryOrder = parseInt(argv[++i], 10) || 900;
        break;
      case '--label':
        opts.categoryLabel = argv[++i];
        break;
      default:
        if (a.startsWith('--')) {
          console.warn(`Unknown flag: ${a}`);
        }
    }
  }

  if (!opts.input || !opts.project) {
    console.error('Usage: javadoc-to-mdx --input <dir> --project <name> [--outDir docs] [--clean] [--label API] [--order 900]');
    process.exit(2);
  }
  return opts;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, acc);
    else if (s.isFile() && entry.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** Strip HTML tags, decode a minimal set of entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape a string so it is safe inside MDX body (no raw HTML/JSX triggers). */
function mdxEscape(s: string): string {
  return s.replace(/[<{}]/g, ch =>
    ({ '<': '\\<', '{': '\\{', '}': '\\}' }[ch] as string)
  );
}

interface MethodEntry {
  signature: string;
  description: string;
}

interface ParsedClass {
  name: string;
  kind: string; // "Class" | "Interface" | "Enum" | ...
  pkg: string;
  description: string;
  methods: MethodEntry[];
}

function parseClassHtml(html: string, fallbackName: string): ParsedClass | null {
  // Title: look for <h1 class="title">Class|Interface|Enum FooBar</h1>
  const titleMatch =
    html.match(/<h1[^>]*class="title"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([\s\S]*?)<\/title>/i);
  const titleRaw = titleMatch ? stripHtml(titleMatch[1]) : fallbackName;
  const kindMatch = titleRaw.match(/^(Class|Interface|Enum|Record|Annotation Type)\s+(.+)$/i);
  const kind = kindMatch ? kindMatch[1] : 'Class';
  const name = kindMatch ? kindMatch[2] : titleRaw;

  // Package
  const pkgMatch = html.match(/<div[^>]*class="sub-title"[^>]*>\s*<span[^>]*>Package<\/span>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
  const pkg = pkgMatch ? stripHtml(pkgMatch[1]) : '';

  // Description: first <section class="description"> or <div class="block">
  const descMatch =
    html.match(/<section[^>]*class="description"[^>]*>([\s\S]*?)<\/section>/i) ||
    html.match(/<div[^>]*class="block"[^>]*>([\s\S]*?)<\/div>/i);
  const description = descMatch ? stripHtml(descMatch[1]) : '';

  // Method summary — rows of the method-summary table
  const methods: MethodEntry[] = [];
  const summaryMatch = html.match(/<section[^>]*id="method-summary"[^>]*>([\s\S]*?)<\/section>/i);
  const summary = summaryMatch ? summaryMatch[1] : '';
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(summary)) !== null) {
    const row = m[1];
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => stripHtml(c[1]));
    if (cells.length >= 2) {
      const signature = cells[1] || cells[0];
      const description = cells[2] || '';
      if (signature) methods.push({ signature, description });
    }
  }

  if (!name) return null;
  return { name, kind, pkg, description, methods };
}

function renderClassMdx(c: ParsedClass, order: number): string {
  const firstSentence =
    (c.description.split(/(?<=[.!?])\s+/)[0] || '').trim() || `${c.kind} ${c.name}`;

  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: ${c.name}`);
  lines.push(`description: ${firstSentence.replace(/[\r\n]+/g, ' ')}`);
  lines.push(`order: ${order}`);
  lines.push(`sidebarLabel: ${c.name}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${c.name}`);
  lines.push('');
  if (c.pkg) lines.push(`**Package:** \`${c.pkg}\``);
  lines.push(`**Kind:** ${c.kind}`);
  lines.push('');
  if (c.description) {
    lines.push(mdxEscape(c.description));
    lines.push('');
  }

  if (c.methods.length > 0) {
    lines.push('## Methods');
    lines.push('');
    lines.push('| Signature | Description |');
    lines.push('| --- | --- |');
    for (const mm of c.methods) {
      const sig = mdxEscape(mm.signature).replace(/\|/g, '\\|');
      const desc = mdxEscape(mm.description).replace(/\|/g, '\\|');
      lines.push(`| \`${sig}\` | ${desc} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  const opts = parseArgs(process.argv);

  if (!existsSync(opts.input)) {
    console.error(`Input not found: ${opts.input}`);
    process.exit(1);
  }

  const outProjectDir = join(ROOT_DIR, opts.outDir, opts.project);
  const outApiDir = join(outProjectDir, opts.categoryLabel);

  if (opts.clean && existsSync(outApiDir)) {
    rmSync(outApiDir, { recursive: true, force: true });
  }
  mkdirSync(outApiDir, { recursive: true });

  // Emit _category_.yml for the generated category.
  writeFileSync(
    join(outApiDir, '_category_.yml'),
    `label: ${opts.categoryLabel}\norder: ${opts.categoryOrder}\ncollapsed: true\n`,
    'utf-8'
  );

  const htmlFiles = walk(opts.input).filter(f => !/\/(index|allclasses|overview|deprecated|serialized-form)[-\w]*\.html$/i.test(f));
  let emitted = 0;
  htmlFiles.forEach((file, i) => {
    const html = readFileSync(file, 'utf-8');
    const fallback = file.split(/[\\/]/).pop()!.replace(/\.html$/, '');
    const parsed = parseClassHtml(html, fallback);
    if (!parsed) return;

    const mdx = renderClassMdx(parsed, i + 1);
    const safeName = parsed.name.replace(/[^\w.-]+/g, '_');
    const outFile = join(outApiDir, `${safeName}.mdx`);
    writeFileSync(outFile, mdx, 'utf-8');
    emitted++;
  });

  console.log(`✓ Javadoc → MDX: wrote ${emitted} class files to ${relative(ROOT_DIR, outApiDir)}`);
}

main();
