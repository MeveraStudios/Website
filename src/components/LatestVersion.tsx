import { useEffect, useState } from 'react';

interface LatestVersionProps {
  owner: string;
  repo: string;
  stripV?: boolean;
  codeBlock?: boolean;
  /**
   * When supplied, this literal version is rendered instead of fetching the
   * latest GitHub tag. Lets a doc page pin a specific snapshot/release
   * without losing the auto-fetched default for unpinned pages.
   */
  version?: string;
  /**
   * When true, derive the next-minor `-SNAPSHOT` from the resolved tag.
   * E.g. `3.4.0` → `3.5.0-SNAPSHOT` (matches the documented convention).
   * Combined with `version`, the pin still wins.
   */
  snapshot?: boolean;
  children?: (version: string) => React.ReactNode;
}

/**
 * Compute the next-minor `-SNAPSHOT` from a release tag, mirroring the
 * "snapshot of the next minor" convention shown in the docs.
 */
function nextSnapshotVersion(tag: string): string {
  const cleaned = tag.replace(/^v/i, '').split('-')[0]; // drop pre-release suffix
  const parts = cleaned.split('.').map(p => parseInt(p, 10));
  while (parts.length < 3) parts.push(0);
  const [maj, min] = parts;
  if (Number.isNaN(maj) || Number.isNaN(min)) return `${tag}-SNAPSHOT`;
  return `${maj}.${min + 1}.0-SNAPSHOT`;
}

export default function LatestVersion({ owner, repo, stripV = true, codeBlock = false, version: pinnedVersion, snapshot = false, children }: LatestVersionProps) {
  const [version, setVersion] = useState(pinnedVersion ?? 'loading...');
  // Cache key includes the snapshot flag so a snapshot-derived value never
  // clobbers the release value (or vice versa) for the same owner/repo.
  const cacheKey = `${owner}/${repo}-version${snapshot ? '-snapshot' : ''}`;

  useEffect(() => {
    // Page pinned an explicit version — skip the network round-trip entirely.
    if (pinnedVersion) {
      setVersion(pinnedVersion);
      return;
    }

    const cachedVersion = sessionStorage.getItem(cacheKey);
    if (cachedVersion) {
      setVersion(cachedVersion);
    } else {
      const url = `https://api.github.com/repos/${owner}/${repo}/tags`;

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('API error');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            let tag = data[0].name;
            if (stripV && tag.startsWith('v')) {
              tag = tag.slice(1);
            }
            const resolved = snapshot ? nextSnapshotVersion(tag) : tag;
            setVersion(resolved);
            sessionStorage.setItem(cacheKey, resolved);
          } else {
            setVersion('unknown');
          }
        })
        .catch(() => setVersion('error'));
    }
  }, [owner, repo, stripV, cacheKey, pinnedVersion, snapshot]);

  if (typeof children === 'function') {
    return children(version);
  }

  return codeBlock ? <code>{version}</code> : version;
}
