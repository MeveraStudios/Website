/**
 * Precompile Documentation Script
 * 
 * This script runs at build time to:
 * 1. Read all markdown files from the docs folder
 * 2. Parse frontmatter and category metadata
 * 3. Organize docs into projects/categories
 * 4. Generate static JSON files for runtime consumption
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root directory
const ROOT_DIR = join(__dirname, '..');
const DOCS_DIR = join(ROOT_DIR, 'docs');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const CONFIG_PATH = join(ROOT_DIR, 'src', 'data', 'projects.json');

// Ensure public directory exists
if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Load project configuration
const projectsConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

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

interface DocFile {
    slug: string;
    path: string;
    content: string;
    frontmatter: DocFrontmatter;
    project: string;
    category: string;
    extension: string;
    lastUpdatedAt?: string;
}

interface DocCategory {
    name: string;
    docs: DocFile[];
    order: number;
}

interface DocProject {
    id: string;
    name: string;
    description: string;
    categories: DocCategory[];
    allDocs: DocFile[];
    meta: {
        emoji: string;
        color: string;
        githubRepo?: string;
    };
}

// Omit content and frontmatter from the navigation data to keep it small
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

interface NavDocProject {
    id: string;
    name: string;
    description: string;
    categories: NavDocCategory[];
    meta: {
        emoji: string;
        color: string;
        githubRepo?: string;
    };
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
    category: string;
}

/**
 * Parse YAML-like content (simplified parser)
 */
function parseYAML(content: string): Record<string, any> {
    const result: Record<string, any> = {};
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
 * Get category metadata from _category_.yml file
 */
function getCategoryMetadata(projectId: string, categoryPath: string): { label?: string; position?: number } | null {
    const categoryFilePath = join(DOCS_DIR, projectId, categoryPath, '_category_.yml');

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
 * Recursively find all markdown files in a directory
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
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
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
 * Main precompilation function
 */
function precompileDocs() {
    console.log('🚀 Starting documentation precompilation...\n');

    const projectsMap = new Map<string, DocProject>();
    const searchIndex: SearchIndexItem[] = [];
    const tocMap: Record<string, TocItem[]> = {};

    // Initialize projects from config
    projectsConfig.forEach((project: any) => {
        projectsMap.set(project.id, {
            id: project.id,
            name: project.title,
            description: project.description,
            categories: [],
            allDocs: [],
            meta: {
                emoji: project.logoPath,
                color: project.color,
                githubRepo: project.githubRepo,
            }
        });
    });

    // Collect category metadata
    const categoryMetadataMap = new Map<string, { label: string; position: number; path: string }>();

    // Process each project directory
    for (const [projectId, project] of projectsMap) {
        const projectDir = join(DOCS_DIR, projectId);

        if (!existsSync(projectDir)) {
            console.log(`⚠️  Warning: Project directory not found: ${projectId}`);
            continue;
        }

        console.log(`📁 Processing project: ${projectId}`);

        // Check for root-level _category_.yml for files directly in the project folder
        const rootCategoryMetadata = getCategoryMetadata(projectId, '');
        const rootCategoryName = rootCategoryMetadata?.label || 'General';

        // Find all markdown files
        const markdownFiles = findMarkdownFiles(projectDir);

        // First pass: collect category metadata
        markdownFiles.forEach(relPath => {
            const parts = relPath.split('/').filter(Boolean);

            if (parts.length > 1) {
                const categoryPath = parts.slice(0, -1).join('/');
                const categoryKey = `${projectId}/${categoryPath}`;

                if (!categoryMetadataMap.has(categoryKey)) {
                    const metadata = getCategoryMetadata(projectId, categoryPath);
                    const categoryName = parts[parts.length - 2] || 'General';

                    categoryMetadataMap.set(categoryKey, {
                        label: metadata?.label || categoryName,
                        position: metadata?.position ?? 999,
                        path: categoryPath
                    });
                }
            }
        });

        // Second pass: parse markdown files
        markdownFiles.forEach(relPath => {
            const fullPath = join(projectDir, relPath.substring(1)); // Remove leading /
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
                const categoryKey = `${projectId}/${categoryPath}`;
                const metadata = categoryMetadataMap.get(categoryKey);

                if (metadata) {
                    categoryName = metadata.label;
                }
            } else if (frontmatter.category) {
                // If frontmatter has explicit category, use it
                categoryName = frontmatter.category;
            }
            // Otherwise, use rootCategoryName from _category_.yml in project root

            // Get last updated date from git
            let lastUpdatedAt = undefined;
            try {
                // Get the timestamp of the last commit that modified this file
                const stdout = execSync(`git log -1 --format="%aI" -- "${fullPath}"`, { 
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'ignore'] 
                }).trim();
                
                if (stdout) {
                    lastUpdatedAt = stdout;
                }
            } catch (e) {
                // Ignore errors (e.g., file not tracked by git yet)
            }

            const docFile: DocFile = {
                slug,
                path: `/docs${relPath}`,
                content: body,
                frontmatter,
                project: projectId,
                category: categoryName,
                extension,
                lastUpdatedAt
            };

            project.allDocs.push(docFile);

            // Extract TOC
            const toc = extractToc(body);
            tocMap[`${projectId}/${slug}`] = toc;

            // Add to search index
            searchIndex.push({
                title: frontmatter.title,
                content: body.replace(/[#*`]/g, '').substring(0, 500), // Clean and limit content
                href: `/docs/${projectId}/${slug}`,
                project: project.name,
                projectId: projectId,
                category: categoryName
            });

            console.log(`  ✓ ${slug}${extension}`);
        });
    }

    // Organize docs into categories
    projectsMap.forEach(project => {
        const categoriesMap = new Map<string, DocCategory>();

        project.allDocs.forEach(doc => {
            const categoryName = doc.category;

            if (!categoriesMap.has(categoryName)) {
                // Find the category metadata by searching for matching label
                let categoryOrder = 999;
                
                for (const [key, metadata] of categoryMetadataMap) {
                    if (key.startsWith(`${project.id}/`) && metadata.label === categoryName) {
                        categoryOrder = metadata.position;
                        break;
                    }
                }

                categoriesMap.set(categoryName, {
                    name: categoryName,
                    docs: [],
                    order: categoryOrder
                });
            }

            categoriesMap.get(categoryName)!.docs.push(doc);
        });

        // Sort docs within categories
        categoriesMap.forEach(category => {
            category.docs.sort((a, b) =>
                (a.frontmatter.order || 999) - (b.frontmatter.order || 999)
            );
        });

        // Sort categories
        project.categories = Array.from(categoriesMap.values())
            .sort((a, b) => a.order - b.order);
    });

    // Write output files
    
    // 1. Generate Navigation Data (lightweight)
    const navProjects: NavDocProject[] = Array.from(projectsMap.values()).map(project => {
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            meta: project.meta,
            categories: project.categories.map(category => ({
                name: category.name,
                order: category.order,
                docs: category.docs.map(doc => ({
                    slug: doc.slug,
                    path: doc.path,
                    category: doc.category,
                    frontmatter: {
                        title: doc.frontmatter.title,
                        sidebarLabel: doc.frontmatter.sidebarLabel,
                        order: doc.frontmatter.order
                    }
                }))
            }))
        };
    });

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

    // 2. Generate Individual Doc Content Files
    let contentFilesWritten = 0;
    projectsMap.forEach(project => {
        const projectContentDir = join(docsContentDir, project.id);
        if (!existsSync(projectContentDir)) {
            mkdirSync(projectContentDir, { recursive: true });
        }

        project.allDocs.forEach(doc => {
            const docContentData = {
                ...doc,
                toc: tocMap[`${project.id}/${doc.slug}`] || []
            };
            const docPath = join(projectContentDir, `${doc.slug}.json`);
            writeFileSync(docPath, JSON.stringify(docContentData), 'utf-8');
            contentFilesWritten++;
        });
    });

    console.log('\n✅ Precompilation complete!');
    console.log(`   📄 Generated: ${docsNavPath} (Navigation only)`);
    console.log(`   🔍 Generated: ${searchIndexPath}`);
    console.log(`   📂 Generated: ${contentFilesWritten} individual document files in public/docs-content/`);
    console.log(`   📊 Total projects: ${projectsMap.size}`);
    console.log(`   📚 Total documents: ${searchIndex.length}`);
}

// Run precompilation
try {
    precompileDocs();
} catch (error) {
    console.error('❌ Precompilation failed:', error);
    process.exit(1);
}
