/**
 * Image manifest builder.
 *
 * - Copies repo-root `assets/` into `public/assets/` so they're served at
 *   `/assets/...` URLs.
 * - Walks the copied tree and, for every raster image (PNG/JPG/JPEG/WEBP),
 *   reads width/height via `sharp` and records it in
 *   `public/image-manifest.json`.
 * - GIFs, SVGs and anything sharp can't read fall through without dims —
 *   they still ship, just without CLS-preventing `width`/`height` attrs.
 *
 * The generated manifest is consumed by <SmartImg /> at runtime to stamp
 * intrinsic dimensions onto <img> so the browser reserves space before the
 * bytes arrive (zero Cumulative Layout Shift on doc pages).
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from 'fs';
import { join, relative, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const ASSETS_SRC = join(ROOT_DIR, 'assets');
const ASSETS_DEST = join(ROOT_DIR, 'public', 'assets');
const MANIFEST_PATH = join(ROOT_DIR, 'public', 'image-manifest.json');

interface ImageMeta {
  /** Intrinsic width in pixels (if readable). */
  width?: number;
  /** Intrinsic height in pixels (if readable). */
  height?: number;
  /** Byte size of the source file. */
  bytes: number;
}

type Manifest = Record<string, ImageMeta>;

const RASTER_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function copyTree(src: string, dest: string): string[] {
  const out: string[] = [];
  if (!existsSync(src)) return out;
  ensureDir(dest);
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    const stat = statSync(s);
    if (stat.isDirectory()) {
      out.push(...copyTree(s, d));
    } else if (stat.isFile()) {
      copyFileSync(s, d);
      out.push(d);
    }
  }
  return out;
}

async function main() {
  console.log('🖼  Building image manifest…');

  if (!existsSync(ASSETS_SRC)) {
    console.log(`   (no assets/ dir at ${ASSETS_SRC} — nothing to do)`);
    writeFileSync(MANIFEST_PATH, JSON.stringify({}), 'utf-8');
    return;
  }

  const copied = copyTree(ASSETS_SRC, ASSETS_DEST);
  console.log(`   Copied ${copied.length} file(s) to public/assets/`);

  const manifest: Manifest = {};

  for (const file of copied) {
    const publicPath = '/' + relative(join(ROOT_DIR, 'public'), file).replace(/\\/g, '/');
    const bytes = statSync(file).size;
    const ext = extname(file).toLowerCase();

    const meta: ImageMeta = { bytes };

    if (RASTER_EXTS.has(ext)) {
      try {
        const { width, height } = await sharp(file).metadata();
        if (typeof width === 'number') meta.width = width;
        if (typeof height === 'number') meta.height = height;
      } catch (err) {
        // sharp couldn't read it (unusual format / corrupt) — still ship the file.
        console.warn(`   ⚠  sharp failed on ${publicPath}:`, (err as Error).message);
      }
    } else if (ext === '.svg') {
      // Best-effort viewBox extraction for SVGs.
      try {
        const svgText = readFileSync(file, 'utf-8');
        const vb = svgText.match(/viewBox\s*=\s*["']([\d.\s-]+)["']/i);
        if (vb) {
          const parts = vb[1].trim().split(/\s+/).map(Number);
          if (parts.length === 4) {
            meta.width = Math.round(parts[2]);
            meta.height = Math.round(parts[3]);
          }
        }
      } catch {
        // ignore
      }
    }
    // GIFs: dims not read by default sharp build — skip silently.

    manifest[publicPath] = meta;
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`   ✓ Wrote ${MANIFEST_PATH} (${Object.keys(manifest).length} entries)`);
}

main().catch(err => {
  console.error('❌ Image manifest build failed:', err);
  process.exit(1);
});
