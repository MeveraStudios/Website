/**
 * SmartImg
 *
 * Drop-in <img> replacement for every image shown inside rendered docs.
 *
 *  - Rewrites docs-authoring paths like `../../assets/foo.png` → `/assets/foo.png`
 *    (the public URL the asset actually lives at after the image-manifest
 *    build script copies `assets/` into `public/`).
 *  - Reads the precompiled `/image-manifest.json` to stamp intrinsic
 *    `width` / `height` onto the element, eliminating Cumulative Layout Shift.
 *  - Defaults to `loading="lazy"` + `decoding="async"`.
 */

import { useEffect, useState, useCallback } from 'react';

interface ImageMeta {
  width?: number;
  height?: number;
  bytes?: number;
}

type Manifest = Record<string, ImageMeta>;

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch('/image-manifest.json')
    .then(r => (r.ok ? r.json() : {}))
    .then((data: Manifest) => {
      manifestCache = data;
      return data;
    })
    .catch(() => {
      manifestCache = {};
      return manifestCache;
    });
  return manifestPromise;
}

/** Rewrite common docs-relative asset paths to their public URL. */
export function normalizeAssetPath(src: string): string {
  if (!src) return src;
  // External URL — leave alone.
  if (/^(https?:)?\/\//i.test(src)) return src;
  // Data / blob / hash — leave alone.
  if (/^(data:|blob:|#)/i.test(src)) return src;

  // `../../assets/foo.png` (any depth of `..`) → `/assets/foo.png`
  const assetMatch = src.match(/(?:\.\.\/)+assets\/(.+)$/);
  if (assetMatch) return `/assets/${assetMatch[1]}`;

  // `assets/foo.png` → `/assets/foo.png`
  if (src.startsWith('assets/')) return `/${src}`;

  return src;
}

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string;
};

export function SmartImg({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  className,
  ...rest
}: Props) {
  const resolved = src ? normalizeAssetPath(src) : src;
  const [erroredImages, setErroredImages] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<ImageMeta | undefined>(() =>
    resolved && manifestCache ? manifestCache[resolved] : undefined
  );

  useEffect(() => {
    if (!resolved) return;
    let alive = true;
    loadManifest().then(m => {
      if (alive) setMeta(m[resolved]);
    });
    return () => {
      alive = false;
    };
  }, [resolved]);

  const handleError = useCallback(() => {
    setErroredImages(prev => {
      if (!resolved) return prev;
      const next = new Set(prev);
      next.add(resolved);
      return next;
    });
  }, [resolved]);

  // Explicit width/height props always win; fall back to manifest.
  const finalWidth = width ?? meta?.width;
  const finalHeight = height ?? meta?.height;

  if (!resolved || (resolved && erroredImages.has(resolved))) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground ${className ?? ''}`}
        role="img"
        aria-label={alt ?? 'Image failed to load'}
      >
        <span aria-hidden="true">&#x1F5BC;</span>
        {alt || 'Image'}
      </span>
    );
  }

  return (
    <img
      key={resolved}
      src={resolved}
      alt={alt ?? ''}
      width={finalWidth}
      height={finalHeight}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}

export default SmartImg;
