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
  children?: (version: string) => React.ReactNode;
}

export default function LatestVersion({ owner, repo, stripV = true, codeBlock = false, version: pinnedVersion, children }: LatestVersionProps) {
  const [version, setVersion] = useState(pinnedVersion ?? 'loading...');
  const cacheKey = `${owner}/${repo}-version`;

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
            setVersion(tag);
            sessionStorage.setItem(cacheKey, tag);
          } else {
            setVersion('unknown');
          }
        })
        .catch(() => setVersion('error'));
    }
  }, [owner, repo, stripV, cacheKey, pinnedVersion]);

  if (typeof children === 'function') {
    return children(version);
  }

  return codeBlock ? <code>{version}</code> : version;
}
