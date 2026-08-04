
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { MotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/config/site';
import { HeroCodeBlock } from '@/components/HeroCodeBlock';
import { PinnedScene } from '@/components/scroll/PinnedScene';
import { DepthLayer } from '@/components/scroll/DepthLayer';

/** Viewport heights of scroll the hero holds for before the page moves on. */
export const HERO_SCENE_LENGTH = 1;

const preloadDocsRoute = () => {
  import('@/pages/Docs').then(m => m.Docs);
  import('@/pages/DocsHome').then(m => m.DocsHome);
};

export function Hero() {
  return (
    <PinnedScene
      length={HERO_SCENE_LENGTH}
      perspective={1400}
      fallbackClassName="pt-28 pb-24 flex items-center min-h-[calc(100vh-4rem)]"
    >
      {progress => <HeroScene progress={progress} />}
    </PinnedScene>
  );
}

/**
 * The hero holds still for the first part of the scene, then recedes into depth
 * as the voxel cluster behind it opens out — so the page reads as pulling back
 * from the hero rather than scrolling past it.
 */
function HeroScene({ progress }: { progress: MotionValue<number> }) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="container px-4 mx-auto relative z-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left: Text Content */}
        <DepthLayer
          progress={progress}
          range={[0.4, 1]}
          mode="exit"
          z={-460}
          rotateX={14}
          y={-60}
          className="text-center lg:text-left"
        >
          <h1 className="text-left mb-4">
            <img
              src={resolvedTheme === 'dark' ? '/brand-mark-light.png' : '/brand-mark-dark.png'}
              alt="Mevera Studios"
              width="2749"
              height="858"
              className="w-full max-w-xl h-auto inline-block"
            />
          </h1>
          <span className="text-xl md:text-2xl text-primary block mt-2 font-normal tracking-normal">
            Plugin development, reimagined
          </span>

          <p className="text-lg text-muted-foreground mb-10 mt-6 leading-relaxed text-pretty">
            {SITE_CONFIG.description}. Guides, API references, and tools for Minecraft plugin development and beyond.
          </p>

          <div className="flex flex-col sm:flex-row items-center lg:justify-start gap-4">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_12px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all"
              asChild
              onMouseEnter={preloadDocsRoute}
            >
              <Link to={SITE_CONFIG.getStartedUrl}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/30 hover:border-primary/60 hover:bg-primary/5" asChild>
              <a href={SITE_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
                <Terminal className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </DepthLayer>

        {/* Right: Code Block — swings away slightly ahead of the text */}
        <DepthLayer
          progress={progress}
          range={[0.3, 0.95]}
          mode="exit"
          z={-300}
          rotateY={-26}
          y={-30}
          className="hidden lg:block"
        >
          <HeroCodeBlock />
        </DepthLayer>

      </div>
    </div>
  );
}
