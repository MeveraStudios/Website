import { useEffect, useState } from 'react';

const CACHE_KEY = 'gh-stars';
const CACHE_TTL = 3600000;
const ORG = 'MeveraStudios';
const EXTRA_REPOS = ['iiAhmedYT/ModernDisguise'];

interface DocsNavProject {
  id: string;
  meta: { githubRepo: string | null };
  versions: { categories: { docs: unknown[] }[] }[];
}

interface UseStatsResult {
  totalStars: number | null;
  docCount: number | null;
  projectCount: number | null;
  platformCount: number | null;
}

function getCachedStars(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: { total: number; cachedAt: number } = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > CACHE_TTL) return null;
    return cache.total;
  } catch {
    return null;
  }
}

function setCachedStars(total: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ total, cachedAt: Date.now() }));
  } catch {
    // storage full — ignore
  }
}

export function useStats(): UseStatsResult {
  const [totalStars, setTotalStars] = useState<number | null>(getCachedStars());
  const [docCount, setDocCount] = useState<number | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [platformCount, setPlatformCount] = useState<number | null>(null);

  // Fetch docs-nav.json for local counts
  useEffect(() => {
    fetch('/docs-nav.json')
      .then((r) => r.json())
      .then((data: { projects: DocsNavProject[] }) => {
        const projects = data.projects;
        setProjectCount(projects.filter((p) => p.meta.githubRepo).length);

        let docs = 0;
        for (const proj of projects) {
          for (const ver of proj.versions) {
            for (const cat of ver.categories) {
              docs += cat.docs.length;
            }
          }
        }
        setDocCount(docs);

        const platforms = projects
          .find((p) => p.id === 'Imperat')
          ?.versions
          .flatMap((v) => v.categories)
          .find((c) => c.docs.some((d) => (d as { slug: string }).slug === 'Bukkit'))
          ?.docs.length ?? 7;
        setPlatformCount(platforms);
      })
      .catch(() => {});
  }, []);

  // Fetch GitHub stars (with localStorage caching)
  useEffect(() => {
    if (getCachedStars() !== null) return;

    let cancelled = false;
    async function fetchStars() {
      let total = 0;

      try {
        const orgRes = await fetch(
          `https://api.github.com/search/repositories?q=user:${ORG}&per_page=100`,
          { headers: { 'User-Agent': 'mevera-stats' } },
        );
        if (orgRes.ok) {
          const body: { items: { stargazers_count: number }[] } = await orgRes.json();
          for (const item of body.items) {
            total += item.stargazers_count;
          }
        }
      } catch {
        // skip
      }

      for (const repo of EXTRA_REPOS) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: { 'User-Agent': 'mevera-stats' },
          });
          if (res.ok) {
            const data: { stargazers_count: number } = await res.json();
            total += data.stargazers_count;
          }
        } catch {
          // skip
        }
      }

      if (!cancelled) {
        setTotalStars(total);
        setCachedStars(total);
      }
    }
    fetchStars();
    return () => { cancelled = true; };
  }, []);

  return { totalStars, docCount, projectCount, platformCount };
}
