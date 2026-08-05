/**
 * Post-build Prerender Script
 *
 * Reads the built SPA shell (dist/index.html) and for every doc page generates
 * a static index.html at dist/docs/<project>/<version>/<slug>/ with:
 *   - Correct <title> and <meta description>
 *   - Doc content embedded as window.__INITIAL_DATA__
 *   - The normal SPA bundle (for hydration + client-side nav)
 *
 * Googlebot gets content immediately without executing JS.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

const SITE_URL = 'https://mevera.studio';

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

/**
 * Renders doc markdown to plain HTML for the crawler-visible body. MDX
 * component tags survive as unknown elements (browsers and crawlers read the
 * text inside them); import/export lines and admonition fences are stripped
 * since they are authoring syntax, not content.
 */
const mdProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });

async function mdToHtml(source: string): Promise<string> {
    const cleaned = source
        .replace(/^import\s.*$/gm, '')
        .replace(/^export\s.*$/gm, '')
        .replace(/^:::\w.*$/gm, '')
        .replace(/^:::\s*$/gm, '');
    const file = await mdProcessor.process(cleaned);
    return String(file);
}

/** Swaps the head tags the SPA shell carries for this page's own values. */
function rewriteHead(
    html: string,
    opts: { title: string; description: string; url: string; type?: string }
): string {
    const title = escapeHtml(opts.title);
    const description = escapeHtml(opts.description);
    const url = escapeHtml(opts.url);

    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`);
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
    if (opts.type) {
        html = html.replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${opts.type}$2`);
    }
    if (opts.description) {
        html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
        html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`);
        html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);
    }
    return html;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

interface NavDoc {
    slug: string;
    path: string;
    category: string;
    categoryPath?: string;
    frontmatter: {
        title: string;
        sidebarLabel?: string;
        order?: number;
    };
}

interface NavCategory {
    name: string;
    order: number;
    categoryPath?: string;
    docs: NavDoc[];
    children?: NavCategory[];
}

interface NavVersion {
    id: string;
    label: string;
    latest: boolean;
    categories: NavCategory[];
}

interface NavProject {
    id: string;
    name: string;
    description: string;
    meta: { emoji: string; color: string; githubRepo?: string };
    versions: NavVersion[];
}

interface NavData {
    projects: NavProject[];
    generatedAt: string;
}

interface DocContent {
    slug: string;
    path: string;
    content: string;
    frontmatter: {
        title: string;
        description?: string;
        order?: number;
        hidden?: boolean;
        sidebarLabel?: string;
    };
    project: string;
    version: string;
    category: string;
    extension: string;
    toc: Array<{ level: number; text: string; id: string }>;
    lastUpdatedAt?: string;
    contributors?: Array<{ name: string; email: string; avatar?: string }>;
}

/** Categories form a tree — collect docs from every level, not just the top. */
function flattenDocs(categories: NavCategory[]): NavDoc[] {
    return categories.flatMap(c => [
        ...c.docs,
        ...(c.children ? flattenDocs(c.children) : []),
    ]);
}

async function prerender() {
    const start = Date.now();
    console.log('\n🔧 Generating static HTML pages...');

    const distIndex = join(DIST, 'index.html');
    if (!existsSync(distIndex)) {
        console.error('❌ dist/index.html not found. Run `vite build` first.');
        process.exit(1);
    }

    const indexHtml = readFileSync(distIndex, 'utf-8');

    const navPath = join(PUBLIC, 'docs-nav.json');
    if (!existsSync(navPath)) {
        console.error('❌ public/docs-nav.json not found. Run `npm run precompile` first.');
        process.exit(1);
    }

    const navData: NavData = JSON.parse(readFileSync(navPath, 'utf-8'));
    let htmlCount = 0;

    for (const project of navData.projects) {
        for (const version of project.versions) {
            // Flatten all docs across the whole category tree
            const allDocs = flattenDocs(version.categories);

            for (const doc of allDocs) {
                const segments = doc.categoryPath ? doc.categoryPath.split('/') : [];
                const contentPath = join(PUBLIC, 'docs-content', project.id, version.id, ...segments, `${doc.slug}.json`);
                if (!existsSync(contentPath)) {
                    console.warn(`  ⚠ Missing content: ${contentPath}`);
                    continue;
                }

                const docData: DocContent = JSON.parse(readFileSync(contentPath, 'utf-8'));
                const title = docData.frontmatter?.title || doc.slug;
                const description = docData.frontmatter?.description || '';

                const routePath = ['/docs', project.id, version.id, ...segments, doc.slug].join('/');
                const pageUrl = `${SITE_URL}${encodePath(routePath)}`;

                const outDir = join(DIST, 'docs', project.id, version.id, ...segments, doc.slug);
                mkdirSync(outDir, { recursive: true });

                let html = rewriteHead(indexHtml, {
                    title: `${title} | Mevera Studios`,
                    description,
                    url: pageUrl,
                    type: 'article'
                });

                // Article structured data, tied to the organization node the
                // shell already declares.
                const articleLd = {
                    '@context': 'https://schema.org',
                    '@type': 'TechArticle',
                    headline: title,
                    ...(description ? { description } : {}),
                    url: pageUrl,
                    ...(docData.lastUpdatedAt ? { dateModified: docData.lastUpdatedAt } : {}),
                    isPartOf: { '@id': `${SITE_URL}/#website` },
                    author: { '@id': `${SITE_URL}/#organization` }
                };

                // Inject prerendered data before </head>
                const injectScript =
                    `\n<script type="application/ld+json">${JSON.stringify(articleLd)}</script>` +
                    `\n<script>window.__INITIAL_DATA__ = ${JSON.stringify(docData)}<\/script>`;
                html = html.replace('</head>', `${injectScript}</head>`);

                // Crawler-visible content: the rendered article sits in the app
                // root until the SPA bundle mounts and replaces it.
                const contentHtml = await mdToHtml(docData.content || '');
                html = html.replace(
                    '<div id="root"></div>',
                    `<div id="root"><main><article><h1>${escapeHtml(title)}</h1>\n${contentHtml}</article></main></div>`
                );

                writeFileSync(join(outDir, 'index.html'), html);
                htmlCount++;
            }
        }
    }

    // Also generate /docs/index.html for the project picker page
    const docsDir = join(DIST, 'docs');
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

    const docsHtml = rewriteHead(indexHtml, {
        title: 'Documentation | Mevera Studios',
        description: 'Documentation for all Mevera Studios libraries: Imperat, Voxy, Lotus, Scofi, and Synapse.',
        url: `${SITE_URL}/docs`
    });
    writeFileSync(join(docsDir, 'index.html'), docsHtml);

    // Generate /docs/<project>/index.html with meta-refresh redirect to first doc
    for (const project of navData.projects) {
        const latest = project.versions.find(v => v.latest) || project.versions[0];
        const firstDoc = latest ? flattenDocs(latest.categories)[0] : undefined;
        if (!firstDoc) continue;

        const projectDir = join(DIST, 'docs', project.id);
        mkdirSync(projectDir, { recursive: true });

        const targetPath = firstDoc.categoryPath
            ? `${encodePath(firstDoc.categoryPath)}/${encodeURIComponent(firstDoc.slug)}`
            : encodeURIComponent(firstDoc.slug);
        const redirectTo = `/docs/${project.id}/${latest.id}/${targetPath}`;

        const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex,follow">
    <title>${escapeHtml(project.name)} | Mevera Studios</title>
    <meta http-equiv="refresh" content="0;url=${redirectTo}">
    <script>location.replace("${redirectTo}")<\/script>
</head>
<body>
    <a href="${redirectTo}">Redirecting to ${escapeHtml(project.name)} documentation...</a>
</body>
</html>`;
        writeFileSync(join(projectDir, 'index.html'), redirectHtml);

        // Also generate /docs/<project>/<version>/index.html if not latest (latest already redirects from project root)
        // Actually skip per-version redirects — they're rarely linked externally and add clutter.
    }

    console.log(`   📄 Generated ${htmlCount} static doc pages in ${Date.now() - start}ms`);
}

prerender().catch(err => {
    console.error('❌ Prerender failed:', err);
    process.exit(1);
});
