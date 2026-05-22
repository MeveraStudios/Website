/**
 * Precompile Documentation Script
 *
 * This script runs at build time to:
 * 1. Read all markdown files from the docs folder
 * 2. Parse frontmatter and category metadata
 * 3. Organize docs into projects → versions → categories
 * 4. Generate static JSON files for runtime consumption
 *
 * Versioning model
 * ----------------
 * Every project under `docs/<project>/` MUST contain at least one version
 * subfolder named `v<digits>` (e.g. `v1`, `v3`, `v4`). The highest-numbered
 * `vN` is treated as the project's default ("latest") version.
 *
 * Output URLs are `/docs/<project>/<version>/<slug>` and content lands in
 * `public/docs-content/<project>/<version>/<slug>.json`.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root directory
const ROOT_DIR = join(__dirname, '..');
const DOCS_DIR = join(ROOT_DIR, 'docs');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const CONFIG_PATH = join(ROOT_DIR, 'src', 'data', 'projects.json');

// Canonical public URL (override via SITE_URL env var for staging builds).
const SITE_URL = (process.env.SITE_URL || 'https://docs.mevera.studio').replace(/\/$/, '');
const VERBOSE_DOCS = process.env.PRECOMPILE_VERBOSE === '1';

type YamlValue = string | number | boolean;

interface ProjectConfig {
    id: string;
    logoPath: string;
    title: string;
    description: string;
    docLink?: string;
    color: string;
    featured?: boolean;
    githubRepo?: string;
    hoverAnimator?: string;
    titleColor?: string;
    titleHoverColor?: string;
    /**
     * Override which version is treated as `latest`. Must match a folder
     * name like `v3`. When omitted, the highest-numbered `vN` wins.
     */
    defaultVersion?: string;
}

// Ensure public directory exists
if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Load project configuration
const projectsConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as ProjectConfig[];

// TypeScript interfaces (matching src/types/docs.ts)
interface DocFrontmatter {
    title: string;
    description?: string;
    slug?: string;
    category?: string;
    order?: number;
    hidden?: boolean;
    sidebarLabel?: string;
}

interface DocContributor {
    name: string;
    email: string;
    /** Gravatar / GitHub-derived avatar URL, best-effort. */
    avatar?: string;
}

interface DocFile {
    slug: string;
    path: string;
    content: string;
    frontmatter: DocFrontmatter;
    project: string;
    version: string;
    category: string;
    extension: string;
    lastUpdatedAt?: string;
    contributors?: DocContributor[];
}

function githubUsernameFromEmail(email: string): string | null {
    const match = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
    return match ? match[1].toLowerCase() : null;
}

function contributorKey(name: string, email: string): string {
    const githubUsername = githubUsernameFromEmail(email);
    if (githubUsername) return `github:${githubUsername}`;

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail) return `email:${normalizedEmail}`;

    return `name:${name.trim().toLowerCase()}`;
}

function collectGitDocMetadata(): Map<string, GitDocMetadata> {
    const metadataByPath = new Map<string, GitDocMetadata>();
    const contributorKeysByPath = new Map<string, Set<string>>();

    try {
        const log = execSync('git log --format="commit:%H%x1f%aI%x1f%an%x1f%ae" --name-only -- docs', {
            cwd: ROOT_DIR,
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 50,
            stdio: ['pipe', 'pipe', 'ignore'],
        });

        let currentCommit: { date: string; name: string; email: string } | null = null;

        for (const rawLine of log.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line) continue;

            if (line.startsWith('commit:')) {
                const [, date, name, email] = line.slice('commit:'.length).split('\x1f');
                currentCommit = { date, name, email };
                continue;
            }

            if (!currentCommit || !/\.(md|mdx)$/i.test(line)) continue;

            const metadata = metadataByPath.get(line) || {};
            if (!metadata.lastUpdatedAt) {
                metadata.lastUpdatedAt = currentCommit.date;
            }

            const key = contributorKey(currentCommit.name, currentCommit.email);
            let contributorKeys = contributorKeysByPath.get(line);
            if (!contributorKeys) {
                contributorKeys = new Set<string>();
                contributorKeysByPath.set(line, contributorKeys);
            }

            if (!contributorKeys.has(key)) {
                contributorKeys.add(key);
                const contributors = metadata.contributors || [];
                if (contributors.length < 10) {
                    const githubUsername = githubUsernameFromEmail(currentCommit.email);
                    contributors.push({
                        name: currentCommit.name,
                        email: currentCommit.email,
                        avatar: githubUsername ? `https://github.com/${githubUsername}.png?size=64` : undefined,
                    });
                    metadata.contributors = contributors;
                }
            }

            metadataByPath.set(line, metadata);
        }
    } catch {
        // Git metadata is best-effort. Builds outside a git checkout still work.
    }

    return metadataByPath;
}

interface DocCategory {
    name: string;
    docs: DocFile[];
    order: number;
}

/** A discovered version folder under `docs/<project>/`. */
interface DocVersion {
    /** Folder name — e.g. `v1`, `v3`, `v4`. */
    id: string;
    /** Human label — same as id unless overridden. */
    label: string;
    /** True for the project's default / latest version. */
    latest: boolean;
    categories: DocCategory[];
    allDocs: DocFile[];
}

interface DocProject {
    id: string;
    name: string;
    description: string;
    meta: {
        emoji: string;
        color: string;
        githubRepo?: string;
    };
    versions: DocVersion[];
}

// Lightweight versions of the above for the navigation JSON (no body content).
interface NavDocFile {
    slug: string;
    path: string;
    frontmatter: {
        title: string;
        sidebarLabel?: string;
        order?: number;
    };
    category: string;
}

interface NavDocCategory {
    name: string;
    docs: NavDocFile[];
    order: number;
}

interface NavDocVersion {
    id: string;
    label: string;
    latest: boolean;
    categories: NavDocCategory[];
}

interface NavDocProject {
    id: string;
    name: string;
    description: string;
    meta: {
        emoji: string;
        color: string;
        githubRepo?: string;
    };
    versions: NavDocVersion[];
}

interface TocItem {
    text: string;
    level: number;
    id: string;
}

interface SearchIndexItem {
    title: string;
    content: string;
    href: string;
    project: string;
    projectId: string;
    version: string;
    category: string;
    slug: string;
}

function normalizeSearchText(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2')
        .replace(/[>#*_~\[\]{}()|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

interface GitDocMetadata {
    lastUpdatedAt?: string;
    contributors?: DocContributor[];
}

function toGitPath(path: string): string {
    return relative(ROOT_DIR, path).replace(/\\/g, '/');
}

/**
 * Parse YAML-like content (simplified parser)
 */
function parseYAML(content: string): Record<string, YamlValue> {
    const result: Record<string, YamlValue> = {};
    content.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            let value: string | number | boolean = line.slice(colonIndex + 1).trim();

            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Parse numbers
            if (!isNaN(Number(value)) && value !== '') {
                value = Number(value);
            }

            // Parse booleans
            if (value === 'true') value = true;
            if (value === 'false') value = false;

            result[key] = value;
        }
    });
    return result;
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: DocFrontmatter; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return {
            frontmatter: { title: 'Untitled' },
            body: content
        };
    }

    const frontmatterText = match[1];
    const body = match[2];

    const frontmatter: Record<string, unknown> = {};
    frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            let value: string | number | boolean | string[] = line.slice(colonIndex + 1).trim();

            // Remove quotes
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }

            // Parse arrays
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
            }

            // Parse numbers
            if (!isNaN(Number(value)) && value !== '') {
                value = Number(value);
            }

            // Parse booleans
            if (value === 'true') value = true;
            if (value === 'false') value = false;

            frontmatter[key] = value;
        }
    });

    return {
        frontmatter: {
            title: (frontmatter.title as string) || 'Untitled',
            description: frontmatter.description as string | undefined,
            slug: frontmatter.slug as string | undefined,
            category: frontmatter.category as string | undefined,
            order: frontmatter.order as number | undefined,
            hidden: frontmatter.hidden as boolean | undefined,
            sidebarLabel: frontmatter.sidebarLabel as string | undefined,
        },
        body
    };
}

/**
 * Get category metadata from a `_category_.yml` file inside a version folder.
 */
function getCategoryMetadata(versionDir: string, categoryPath: string): { label?: string; position?: number } | null {
    const categoryFilePath = join(versionDir, categoryPath, '_category_.yml');

    if (!existsSync(categoryFilePath)) {
        return null;
    }

    const categoryContent = readFileSync(categoryFilePath, 'utf-8');
    const metadata = parseYAML(categoryContent);

    return {
        label: metadata.label as string | undefined,
        position: (metadata.order || metadata.position) as number | undefined
    };
}

/**
 * Detect version subfolders directly beneath `docs/<project>/`.
 *
 * A version is any immediate child folder whose name matches `v<digits>`.
 * If the project config supplies `defaultVersion`, that one is marked as
 * `latest`. Otherwise the highest-numbered `vN` wins. Returns `[]` if no
 * version folders exist (the project will be skipped with a warning).
 */
function detectVersionIds(projectDir: string, defaultVersion?: string): { id: string; label: string; latest: boolean }[] {
    if (!existsSync(projectDir)) return [];
    const entries = readdirSync(projectDir);
    const versions: { id: string; label: string; latest: boolean }[] = [];

    for (const entry of entries) {
        const fullPath = join(projectDir, entry);
        if (!statSync(fullPath).isDirectory()) continue;
        if (/^v\d+$/i.test(entry)) {
            versions.push({ id: entry, label: entry, latest: false });
        }
    }

    if (versions.length === 0) return [];

    versions.sort((a, b) => {
        const an = parseInt(a.id.slice(1), 10) || 0;
        const bn = parseInt(b.id.slice(1), 10) || 0;
        return an - bn;
    });

    let latestIdx = versions.length - 1;
    if (defaultVersion) {
        const overrideIdx = versions.findIndex(v => v.id.toLowerCase() === defaultVersion.toLowerCase());
        if (overrideIdx >= 0) {
            latestIdx = overrideIdx;
        } else {
            console.log(`⚠️  defaultVersion "${defaultVersion}" not found among ${versions.map(v => v.id).join(', ')} — falling back to highest vN.`);
        }
    }
    versions[latestIdx].latest = true;
    return versions;
}

/**
 * Recursively find all markdown files in a directory.
 */
function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
    const files: string[] = [];

    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...findMarkdownFiles(fullPath, baseDir));
        } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
            // Get relative path from base directory
            files.push(fullPath.replace(baseDir, '').replace(/\\/g, '/'));
        }
    }

    return files;
}

function cleanHeadingText(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')   // Remove bold
        .replace(/\*(.+?)\*/g, '$1')       // Remove italic
        .replace(/`(.+?)`/g, '$1')         // Remove inline code
        .replace(/\[(.+?)]\(.+?\)/g, '$1') // Remove links, keep text
        // Remove real HTML/JSX tags (lowercase tag names with optional attrs / self-closing)
        .replace(/<\/?[a-z][a-zA-Z0-9-]*(\s[^>]*)?\/?>/g, '')
        // For the remaining angle-bracket expressions (e.g. generic types like <T>, <A, B>)
        // strip the brackets and keep the inner text
        .replace(/<([^>]+)>/g, '$1')
        .trim();
}

function slugify(text: string): string {
    return cleanHeadingText(text)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
}

/**
 * Extract table of contents from markdown content
 */
function extractToc(content: string): TocItem[] {
    const toc: TocItem[] = [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const idCounts = new Map<string, number>();
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const baseSlug = slugify(text);

        const count = idCounts.get(baseSlug) || 0;
        const id = count > 0 ? `${baseSlug}-${count}` : baseSlug;
        idCounts.set(baseSlug, count + 1);

        toc.push({ level, text, id });
    }

    return toc;
}

/**
 * Build a single version's worth of categories + docs by walking the version
 * directory. Returns the in-memory DocVersion plus the side-channels the
 * caller needs (tocMap, search index entries).
 */
function buildVersion(
    projectId: string,
    projectName: string,
    versionDir: string,
    versionMeta: { id: string; label: string; latest: boolean },
    gitMetadataByPath: Map<string, GitDocMetadata>,
    tocMap: Record<string, TocItem[]>,
    searchIndex: SearchIndexItem[],
    indexLatestOnlyForSearch: boolean
): DocVersion {
    const allDocs: DocFile[] = [];
    const categoryMetadataMap = new Map<string, { label: string; position: number; path: string }>();

    // Top-level _category_.yml inside the version folder, e.g. docs/Imperat/v4/_category_.yml.
    const rootCategoryMetadata = getCategoryMetadata(versionDir, '');
    const rootCategoryName = rootCategoryMetadata?.label || 'General';

    const markdownFiles = findMarkdownFiles(versionDir);

    // First pass: collect category metadata for nested folders.
    markdownFiles.forEach(relPath => {
        const parts = relPath.split('/').filter(Boolean);

        if (parts.length > 1) {
            const categoryPath = parts.slice(0, -1).join('/');
            const categoryKey = `${projectId}/${versionMeta.id}/${categoryPath}`;

            if (!categoryMetadataMap.has(categoryKey)) {
                const metadata = getCategoryMetadata(versionDir, categoryPath);
                const categoryName = parts[parts.length - 2] || 'General';

                categoryMetadataMap.set(categoryKey, {
                    label: metadata?.label || categoryName,
                    position: metadata?.position ?? 999,
                    path: categoryPath
                });
            }
        }
    });

    // Second pass: parse markdown files.
    markdownFiles.forEach(relPath => {
        const fullPath = join(versionDir, relPath.substring(1)); // Remove leading /
        const content = readFileSync(fullPath, 'utf-8');

        const parts = relPath.split('/').filter(Boolean);
        const fileName = parts[parts.length - 1];
        const extensionMatch = fileName.match(/\.(mdx?)$/);
        const extension = extensionMatch ? extensionMatch[0] : '.md';
        const fileSlug = fileName.replace(/\.mdx?$/, '');

        const { frontmatter, body } = parseFrontmatter(content);
        const slug = frontmatter.slug || fileSlug;

        // Determine category
        let categoryName = frontmatter.category || rootCategoryName;

        if (parts.length > 1) {
            const categoryPath = parts.slice(0, -1).join('/');
            const categoryKey = `${projectId}/${versionMeta.id}/${categoryPath}`;
            const metadata = categoryMetadataMap.get(categoryKey);

            if (metadata) {
                categoryName = metadata.label;
            }
        } else if (frontmatter.category) {
            categoryName = frontmatter.category;
        }

        const gitMetadata = gitMetadataByPath.get(toGitPath(fullPath));

        const docFile: DocFile = {
            slug,
            path: `/docs/${projectId}/${versionMeta.id}${relPath}`,
            content: body,
            frontmatter,
            project: projectId,
            version: versionMeta.id,
            category: categoryName,
            extension,
            lastUpdatedAt: gitMetadata?.lastUpdatedAt,
            contributors: gitMetadata?.contributors,
        };

        allDocs.push(docFile);

        // Extract TOC keyed by project/version/slug.
        const toc = extractToc(body);
        tocMap[`${projectId}/${versionMeta.id}/${slug}`] = toc;

        // Search index — include only the latest version per project to keep
        // results free of duplicates while content is mirrored across versions.
        if (!indexLatestOnlyForSearch || versionMeta.latest) {
            searchIndex.push({
                title: frontmatter.title,
                content: normalizeSearchText(body),
                href: `/docs/${projectId}/${versionMeta.id}/${slug}`,
                project: projectName,
                projectId,
                version: versionMeta.id,
                category: categoryName,
                slug,
            });
        }

        if (VERBOSE_DOCS) {
            console.log(`  ✓ ${versionMeta.id}/${slug}${extension}`);
        }
    });

    // Group docs into categories.
    const categoriesMap = new Map<string, DocCategory>();

    allDocs.forEach(doc => {
        const categoryName = doc.category;

        if (!categoriesMap.has(categoryName)) {
            let categoryOrder = 999;
            for (const [key, metadata] of categoryMetadataMap) {
                if (key.startsWith(`${projectId}/${versionMeta.id}/`) && metadata.label === categoryName) {
                    categoryOrder = metadata.position;
                    break;
                }
            }

            categoriesMap.set(categoryName, {
                name: categoryName,
                docs: [],
                order: categoryOrder,
            });
        }

        categoriesMap.get(categoryName)!.docs.push(doc);
    });

    categoriesMap.forEach(category => {
        category.docs.sort((a, b) =>
            (a.frontmatter.order || 999) - (b.frontmatter.order || 999)
        );
    });

    const categories = Array.from(categoriesMap.values()).sort((a, b) => a.order - b.order);

    return {
        id: versionMeta.id,
        label: versionMeta.label,
        latest: versionMeta.latest,
        categories,
        allDocs,
    };
}

/**
 * Main precompilation function
 */
function precompileDocs() {
    console.log('🚀 Starting documentation precompilation...\n');

    const projectsMap = new Map<string, DocProject>();
    const searchIndex: SearchIndexItem[] = [];
    const tocMap: Record<string, TocItem[]> = {};
    const gitMetadataByPath = collectGitDocMetadata();

    // Process each declared project.
    projectsConfig.forEach((projectCfg) => {
        const projectDir = join(DOCS_DIR, projectCfg.id);

        if (!existsSync(projectDir)) {
            console.log(`⚠️  Warning: Project directory not found: ${projectCfg.id}`);
            return;
        }

        const detectedVersions = detectVersionIds(projectDir, projectCfg.defaultVersion);
        if (detectedVersions.length === 0) {
            console.log(`⚠️  Warning: ${projectCfg.id} has no version subfolders (expected docs/${projectCfg.id}/v1/...). Skipping.`);
            return;
        }

        console.log(`📁 Processing project: ${projectCfg.id}`);

        const versions: DocVersion[] = detectedVersions.map(v =>
            buildVersion(
                projectCfg.id,
                projectCfg.title,
                join(projectDir, v.id),
                v,
                gitMetadataByPath,
                tocMap,
                searchIndex,
                /* indexLatestOnlyForSearch = */ true,
            )
        );

        const projectDocCount = versions.reduce((sum, version) => sum + version.allDocs.length, 0);
        console.log(`  ✓ ${projectDocCount} docs across ${versions.length} version(s)`);

        projectsMap.set(projectCfg.id, {
            id: projectCfg.id,
            name: projectCfg.title,
            description: projectCfg.description,
            meta: {
                emoji: projectCfg.logoPath,
                color: projectCfg.color,
                githubRepo: projectCfg.githubRepo,
            },
            versions,
        });
    });

    // Write output files

    // 1. Generate Navigation Data (lightweight)
    const navProjects: NavDocProject[] = Array.from(projectsMap.values()).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        meta: project.meta,
        versions: project.versions.map(version => ({
            id: version.id,
            label: version.label,
            latest: version.latest,
            categories: version.categories.map(category => ({
                name: category.name,
                order: category.order,
                docs: category.docs.map(doc => ({
                    slug: doc.slug,
                    path: doc.path,
                    category: doc.category,
                    frontmatter: {
                        title: doc.frontmatter.title,
                        sidebarLabel: doc.frontmatter.sidebarLabel,
                        order: doc.frontmatter.order,
                    },
                })),
            })),
        })),
    }));

    const docsNavData = {
        projects: navProjects,
        generatedAt: new Date().toISOString()
    };

    const docsNavPath = join(PUBLIC_DIR, 'docs-nav.json');
    const searchIndexPath = join(PUBLIC_DIR, 'search-index.json');
    const docsContentDir = join(PUBLIC_DIR, 'docs-content');

    if (!existsSync(docsContentDir)) {
        mkdirSync(docsContentDir, { recursive: true });
    }

    writeFileSync(docsNavPath, JSON.stringify(docsNavData), 'utf-8');
    writeFileSync(searchIndexPath, JSON.stringify(searchIndex), 'utf-8');

    // 2. Generate Individual Doc Content Files — one per (project, version, slug).
    let contentFilesWritten = 0;
    projectsMap.forEach(project => {
        const projectContentDir = join(docsContentDir, project.id);
        if (!existsSync(projectContentDir)) {
            mkdirSync(projectContentDir, { recursive: true });
        }

        project.versions.forEach(version => {
            const versionContentDir = join(projectContentDir, version.id);
            if (!existsSync(versionContentDir)) {
                mkdirSync(versionContentDir, { recursive: true });
            }

            version.allDocs.forEach(doc => {
                const docContentData = {
                    ...doc,
                    toc: tocMap[`${project.id}/${version.id}/${doc.slug}`] || [],
                };
                const docPath = join(versionContentDir, `${doc.slug}.json`);
                writeFileSync(docPath, JSON.stringify(docContentData), 'utf-8');
                contentFilesWritten++;
            });
        });
    });

    // 3. Generate sitemap.xml — every (project, version, doc) URL is canonical.
    const nowIso = new Date().toISOString();
    const urlEntries: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [];

    const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

    urlEntries.push({ loc: `${SITE_URL}/`, lastmod: nowIso, priority: '1.0', changefreq: 'weekly' });

    projectsMap.forEach(project => {
        const latest = project.versions.find(v => v.latest) || project.versions[0];
        const firstDoc = latest?.categories[0]?.docs[0];
        if (firstDoc) {
            urlEntries.push({
                loc: `${SITE_URL}${encodePath(`/docs/${project.id}`)}`,
                lastmod: firstDoc.lastUpdatedAt || nowIso,
                priority: '0.9',
                changefreq: 'weekly',
            });
        }
        project.versions.forEach(version => {
            version.allDocs.forEach(doc => {
                urlEntries.push({
                    loc: `${SITE_URL}${encodePath(`/docs/${project.id}/${version.id}/${doc.slug}`)}`,
                    lastmod: doc.lastUpdatedAt || nowIso,
                    priority: version.latest ? '0.8' : '0.5',
                    changefreq: 'weekly',
                });
            });
        });
    });

    const xmlEscape = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    const sitemapXml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urlEntries
            .map(
                e =>
                    `  <url>\n` +
                    `    <loc>${xmlEscape(e.loc)}</loc>\n` +
                    (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
                    `    <changefreq>${e.changefreq}</changefreq>\n` +
                    `    <priority>${e.priority}</priority>\n` +
                    `  </url>`
            )
            .join('\n') +
        `\n</urlset>\n`;

    const sitemapPath = join(PUBLIC_DIR, 'sitemap.xml');
    writeFileSync(sitemapPath, sitemapXml, 'utf-8');

    // 4. Generate robots.txt
    const robotsTxt =
        `User-agent: *\n` +
        `Allow: /\n` +
        `Disallow: /docs-content/\n` +
        `\n` +
        `Sitemap: ${SITE_URL}/sitemap.xml\n`;
    const robotsPath = join(PUBLIC_DIR, 'robots.txt');
    writeFileSync(robotsPath, robotsTxt, 'utf-8');

    const totalDocs = Array.from(projectsMap.values())
        .flatMap(p => p.versions)
        .reduce((sum, v) => sum + v.allDocs.length, 0);

    console.log('\n✅ Precompilation complete!');
    console.log(`   📄 Generated: ${docsNavPath} (Navigation only)`);
    console.log(`   🔍 Generated: ${searchIndexPath} (latest-version-only entries)`);
    console.log(`   📂 Generated: ${contentFilesWritten} individual document files in public/docs-content/`);
    console.log(`   🗺️  Generated: ${sitemapPath} (${urlEntries.length} URLs)`);
    console.log(`   🤖 Generated: ${robotsPath}`);
    console.log(`   📊 Total projects: ${projectsMap.size}`);
    console.log(`   📚 Total documents (across all versions): ${totalDocs}`);
}

// Run precompilation
try {
    precompileDocs();
} catch (error) {
    console.error('❌ Precompilation failed:', error);
    process.exit(1);
}
