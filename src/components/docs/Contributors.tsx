/**
 * Contributors
 *
 * Surfaces the humans who've touched this doc (git log). Shown at the bottom
 * of every doc page. Avatars link to GitHub when the contributor committed
 * with a GitHub noreply email.
 */

import type { DocContributor } from '@/types/docs';

interface ContributorsProps {
  contributors?: DocContributor[];
}

function githubUsername(c: DocContributor): string | null {
  const m = c.email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
  return m ? m[1].toLowerCase() : null;
}

function contributorKey(c: DocContributor): string {
  const handle = githubUsername(c);
  if (handle) return `github:${handle}`;

  const email = c.email.trim().toLowerCase();
  if (email) return `email:${email}`;

  return `name:${c.name.trim().toLowerCase()}`;
}

function uniqueContributors(contributors: DocContributor[]): DocContributor[] {
  const seen = new Set<string>();

  return contributors.filter(c => {
    const key = contributorKey(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function Contributors({ contributors }: ContributorsProps) {
  if (!contributors || contributors.length === 0) return null;

  const unique = uniqueContributors(contributors);
  if (unique.length === 0) return null;

  return (
    <aside
      aria-labelledby="contributors-heading"
      className="mt-10 pt-6 border-t"
    >
      <h2
        id="contributors-heading"
        className="text-sm font-semibold text-muted-foreground mb-3"
      >
        Contributors
      </h2>
      <ul className="flex flex-wrap items-center gap-3 list-none p-0 m-0">
        {unique.map(c => {
          const handle = githubUsername(c);
          const profile = handle ? `https://github.com/${handle}` : null;
          const content = (
            <span className="flex items-center gap-2">
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                  className="h-7 w-7 rounded-full bg-muted"
                />
              ) : (
                <span
                  className="h-7 w-7 rounded-full bg-muted inline-flex items-center justify-center text-xs font-medium"
                  aria-hidden="true"
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-sm">{handle ? `@${handle}` : c.name}</span>
            </span>
          );
          return (
            <li key={contributorKey(c)}>
              {profile ? (
                <a
                  href={profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  aria-label={`${handle ? `@${handle}` : c.name} on GitHub`}
                >
                  {content}
                </a>
              ) : (
                <span title={c.email}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
