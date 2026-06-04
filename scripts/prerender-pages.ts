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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

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
    frontmatter: {
        title: string;
        sidebarLabel?: string;
        order?: number;
    };
}

interface NavCategory {
    name: string;
    order: number;
    docs: NavDoc[];
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

function prerender() {
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
            // Flatten all docs across all categories
            const allDocs = version.categories.flatMap(c => c.docs);

            for (const doc of allDocs) {
                const contentPath = join(PUBLIC, 'docs-content', project.id, version.id, `${doc.slug}.json`);
                if (!existsSync(contentPath)) {
                    console.warn(`  ⚠ Missing content: ${contentPath}`);
                    continue;
                }

                const docData: DocContent = JSON.parse(readFileSync(contentPath, 'utf-8'));
                const title = docData.frontmatter?.title || doc.slug;
                const description = docData.frontmatter?.description || '';

                const outDir = join(DIST, 'docs', project.id, version.id, doc.slug);
                mkdirSync(outDir, { recursive: true });

                let html = indexHtml;

                // Replace <title>
                html = html.replace(
                    /<title>.*?<\/title>/,
                    `<title>${escapeHtml(title)} | MeveraStudios</title>`
                );

                // Replace <meta name="description">
                if (description) {
                    html = html.replace(
                        /<meta name="description" content=".*?"/,
                        `<meta name="description" content="${escapeHtml(description)}"`
                    );
                }

                // Inject prerendered data before </head>
                const injectScript = `\n<script>window.__INITIAL_DATA__ = ${JSON.stringify(docData)}<\/script>`;
                html = html.replace('</head>', `${injectScript}</head>`);

                writeFileSync(join(outDir, 'index.html'), html);
                htmlCount++;
            }
        }
    }

    // Also generate /docs/index.html for the project picker page
    const docsDir = join(DIST, 'docs');
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

    let docsHtml = indexHtml;
    docsHtml = docsHtml.replace(
        /<title>.*?<\/title>/,
        '<title>Documentation | MeveraStudios</title>'
    );
    writeFileSync(join(docsDir, 'index.html'), docsHtml);

    // Generate /docs/<project>/index.html with meta-refresh redirect to first doc
    for (const project of navData.projects) {
        const latest = project.versions.find(v => v.latest) || project.versions[0];
        const firstDoc = latest?.categories?.[0]?.docs?.[0];
        if (!firstDoc) continue;

        const projectDir = join(DIST, 'docs', project.id);
        mkdirSync(projectDir, { recursive: true });

        const targetSlug = encodeURIComponent(firstDoc.slug);
        const redirectTo = `/docs/${project.id}/${latest.id}/${targetSlug}`;

        const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex,follow">
    <title>${escapeHtml(project.name)} | MeveraStudios</title>
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

prerender();
