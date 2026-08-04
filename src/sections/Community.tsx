import { MessageCircle, Star, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MotionValue } from 'framer-motion';
import { SITE_CONFIG } from '@/config/site';
import { PinnedScene } from '@/components/scroll/PinnedScene';
import { DepthLayer } from '@/components/scroll/DepthLayer';

// Everything lands by 55% of the scene; the remaining 45% is deliberate dwell,
// so the finished panel holds on screen for roughly half a viewport of
// scrolling before the page moves on.
export function Community() {
  return (
    <PinnedScene length={1.4} perspective={1200}>
      {progress => <CommunityScene progress={progress} />}
    </PinnedScene>
  );
}

/** Each line arrives from further back than the one before it. */
function CommunityScene({ progress }: { progress: MotionValue<number> }) {
  return (
    <>
      {/* Transparent at both ends, so the section has no hard top edge. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.04] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <DepthLayer progress={progress} range={[0, 0.15]} z={-260} rotateX={40} y={40}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              Community
            </span>
          </DepthLayer>

          <DepthLayer progress={progress} range={[0.08, 0.3]} z={-620} rotateX={28} y={90}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 text-balance">
              Built by developers,
              <br />
              <span className="text-primary">for developers</span>
            </h2>
          </DepthLayer>

          <DepthLayer progress={progress} range={[0.23, 0.42]} z={-380} rotateX={20} y={60}>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 text-pretty">
              Join hundreds of plugin developers building with Mevera libraries.
              Contribute, ask questions, or just see what&rsquo;s being made.
            </p>
          </DepthLayer>

          <DepthLayer
            progress={progress}
            range={[0.34, 0.55]}
            z={-300}
            rotateX={16}
            y={50}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_12px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all"
              asChild
            >
              <a href={SITE_CONFIG.discordUrl || '#'} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Join on Discord
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-primary/30 hover:border-primary/60 hover:bg-primary/5 backdrop-blur-sm"
              asChild
            >
              <a href={SITE_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
                <Star className="mr-2 h-4 w-4" />
                Star on GitHub
              </a>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="h-12 px-8 text-base text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={`${SITE_CONFIG.githubUrl}/issues`} target="_blank" rel="noopener noreferrer">
                <GitPullRequest className="mr-2 h-4 w-4" />
                Contribute
              </a>
            </Button>
          </DepthLayer>
        </div>
      </div>
    </>
  );
}
