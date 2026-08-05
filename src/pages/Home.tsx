/**
 * Home Page
 * 
 * The main landing page displaying:
 * - Hero section with CTA
 * - Featured projects
 * - Team section
 */

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero, HERO_SCENE_LENGTH } from '@/sections/Hero';
import { Features } from '@/sections/Features';
import { Stats } from '@/sections/Stats';
import { Projects } from '@/sections/Projects';
import { Community } from '@/sections/Community';
import { Team } from '@/sections/Team';
import { VoxelField } from '@/components/VoxelField';
import { SceneWarp } from '@/components/scroll/SceneWarp';
import { Seo } from '@/components/Seo';
import { PROJECTS } from '@/config/site';

const ACCENT_COLORS = PROJECTS.map(p => p.color).filter(Boolean) as string[];

// `overflow-x-clip`, not `overflow-x-hidden`: hidden on one axis forces the
// other to `auto`, which makes the page root a scroll container and silently
// breaks `position: sticky` for everything inside it — including the header.
// `clip` contains the same overflow without creating a scrollport.
export function Home() {
  return (
    <div className="min-h-screen flex flex-col relative bg-background overflow-x-clip">
      <Seo path="/" title="Home" type="website" />
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <VoxelField
          accentColors={ACCENT_COLORS}
          disperseViewports={HERO_SCENE_LENGTH}
          className="opacity-30 lg:opacity-80"
        />
      </div>

      <Header />
      <SceneWarp />

      <main id="main-content" tabIndex={-1} className="flex-1 relative z-10 outline-none focus-visible:outline-none">
        <Hero />
        <Stats />
        <Features />
        <Community />
        <Projects />
        <Team />
      </main>

      <Footer />
    </div>
  );
}
