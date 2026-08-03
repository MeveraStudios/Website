/**
 * Doc Feedback Widget
 *
 * Lightweight per-page "Was this helpful?" control.
 *  - Vote is persisted in localStorage per (project, slug) so a user doesn't
 *    see the prompt twice for the same page.
 *  - On 👎 we surface a "Tell us what was wrong" link that opens a pre-filled
 *    GitHub issue on the docs repo. No tracking/analytics are sent anywhere.
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/config/site';

type Vote = 'up' | 'down' | null;

interface DocFeedbackProps {
  projectId: string;
  version: string;
  slug: string;
  /** Category path of the doc — slugs repeat across categories. */
  categoryPath?: string;
  docTitle: string;
  /** Absolute or root-relative path to the current doc, used in the issue body. */
  docPath: string;
}

const STORAGE_PREFIX = 'meveradocs:feedback:';

function readStoredVote(key: string): Vote {
  try {
    const stored = localStorage.getItem(key) as Vote;
    if (stored === 'up' || stored === 'down') return stored;
  } catch {
    // ignore (private mode, etc.)
  }
  return null;
}

export function DocFeedback({ projectId, version, slug, categoryPath, docTitle, docPath }: DocFeedbackProps) {
  const key = `${STORAGE_PREFIX}${projectId}/${version}/${categoryPath ? `${categoryPath}/` : ''}${slug}`;
  // The parent passes a per-doc `key` so a navigation remounts this component
  // and we can simply seed state from localStorage — no effect/sync needed.
  const [vote, setVote] = useState<Vote>(() => readStoredVote(key));

  const record = (v: Vote) => {
    setVote(v);
    try {
      if (v) localStorage.setItem(key, v);
    } catch {
      // ignore
    }
  };

  const issueUrl = (() => {
    const base = SITE_CONFIG.githubUrl.replace(/\/$/, '');
    const title = `docs: feedback on "${docTitle}"`;
    const body = [
      `**Page:** \`${docPath}\``,
      `**URL:** ${typeof window !== 'undefined' ? window.location.href : ''}`,
      '',
      '### What was wrong or confusing?',
      '',
      '<!-- Your feedback here -->',
      '',
    ].join('\n');
    const q = new URLSearchParams({ title, body, labels: 'docs,feedback' });
    return `${base}/issues/new?${q.toString()}`;
  })();

  return (
    <div className="my-10 rounded-lg border bg-muted/30 p-5">
      {vote === null && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Was this page helpful?</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => record('up')}
              aria-label="Yes, this page was helpful"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => record('down')}
              aria-label="No, this page was not helpful"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        </div>
      )}

      {vote === 'up' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Thanks for the feedback! Glad it helped.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => record(null)}
            className="text-muted-foreground"
          >
            Change answer
          </Button>
        </div>
      )}

      {vote === 'down' && (
        <div className="space-y-3">
          <p className="text-sm">
            Sorry to hear that. Tell us what was wrong so we can improve this page.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-1" />
                Open feedback issue
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => record(null)}
              className="text-muted-foreground"
            >
              Change answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
