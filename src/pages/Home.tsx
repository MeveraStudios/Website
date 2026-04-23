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
import { Projects } from '@/sections/Projects';
import { Team } from '@/sections/Team';
import LightRays from '@/components/LightRays';
import { Seo } from '@/components/Seo';

export function Home() {
  return (
    <div className="min-h-screen flex flex-col relative bg-background overflow-x-hidden">
      <Seo path="/" type="website" />
      {/* Background Effect */}
      <div className="absolute inset-0 h-full pointer-events-none z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="opacity-40"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1 relative z-10">
        <Hero />
        <Projects />
        <Team />
      </main>

      <Footer />
    </div>
  );
}
