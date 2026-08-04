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
import { Hero } from '@/sections/Hero';
import { Features } from '@/sections/Features';
import { Stats } from '@/sections/Stats';
import { Projects } from '@/sections/Projects';
import { Community } from '@/sections/Community';
import { Team } from '@/sections/Team';
import LightRays from '@/components/LightRays';
import { Seo } from '@/components/Seo';

export function Home() {
  return (
    <div className="min-h-screen flex flex-col relative bg-background overflow-x-hidden">
      <Seo path="/" title="Home" type="website" />
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <LightRays
          raysOrigin="right"
          raysColor="#ffffff"
          raysSpeed={0.8}
          lightSpread={0.6}
          rayLength={2.5}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0}
          distortion={0}
          className="opacity-50"
          pulsating={false}
          fadeDistance={1.2}
          saturation={0.8}
        />
      </div>

      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1 relative z-10 outline-none focus-visible:outline-none">
        <Hero />
        <Stats />
        <Features />
        <Projects />
        <Community />
        <Team />
      </main>

      <Footer />
    </div>
  );
}
