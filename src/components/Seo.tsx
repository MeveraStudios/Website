/**
 * Per-page SEO / social-sharing metadata.
 *
 * Renders <title>, description, canonical, Open Graph, Twitter Card,
 * and (optionally) TechArticle / BreadcrumbList JSON-LD into <head>.
 *
 * Must be rendered inside a <HelmetProvider> (wired up in main.tsx).
 */

import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG } from '@/config/site';

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface SeoProps {
  title?: string;
  description?: string;
  /** Path starting with `/` — canonical URL becomes `${siteUrl}${path}`. Defaults to current location. */
  path?: string;
  /** Absolute or root-relative OG image. */
  image?: string;
  /** `website` (default) for landing pages, `article` for doc pages. */
  type?: 'website' | 'article';
  /** ISO timestamp of the last modification (article pages). */
  lastUpdated?: string;
  /** Breadcrumb trail (home → project → doc). Omit for landing/home. */
  breadcrumbs?: Breadcrumb[];
  /** Whether to emit a TechArticle JSON-LD block. */
  isArticle?: boolean;
  author?: string;
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = SITE_CONFIG.siteUrl.replace(/\/$/, '');
  const p = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
}

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  lastUpdated,
  breadcrumbs,
  isArticle,
  author,
}: SeoProps) {
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.brandName}`
    : SITE_CONFIG.siteTitle;
  const desc = description || SITE_CONFIG.description;
  const currentPath =
    path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonical = absoluteUrl(currentPath);
  const ogImage = absoluteUrl(image || SITE_CONFIG.ogImage);

  const jsonLd: Record<string, unknown>[] = [];

  if (isArticle) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title || SITE_CONFIG.siteTitle,
      description: desc,
      url: canonical,
      image: ogImage,
      ...(lastUpdated ? { dateModified: lastUpdated } : {}),
      author: {
        '@type': 'Organization',
        name: author || SITE_CONFIG.brandName,
        url: SITE_CONFIG.siteUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.brandName,
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/icon-512.png'),
        },
      },
    });
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: absoluteUrl(b.url),
      })),
    });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_CONFIG.brandName} />
      <meta property="og:locale" content={SITE_CONFIG.locale} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      {SITE_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={`@${SITE_CONFIG.twitterHandle}`} />
      )}

      {lastUpdated && <meta property="article:modified_time" content={lastUpdated} />}

      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
