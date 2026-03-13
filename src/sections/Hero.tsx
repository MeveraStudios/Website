
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/config/site';
import { fetchDocContent } from '@/lib/docs';

// Expose a way to preload the Docs chunk and initial data
const preloadDocsRoute = () => {
  import('@/pages/Docs').then(m => m.Docs);
  // Prefetch the initial 'Get Started' payload
  const parts = SITE_CONFIG.getStartedUrl.split('/').filter(Boolean);
  if (parts.length >= 3 && parts[1] && parts[2]) {
    fetchDocContent(parts[1], parts[2]);
  }
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">

      {/* Content Container */}
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge / Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            v2.0 Documentation Live
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-fade-in [animation-delay:200ms]">
            Mevera Studios <br />
            <span className="text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-blue-600 animate-pulse block mt-4 font-normal tracking-wide">
              Where ideas becomes reality
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in [animation-delay:400ms]">
            {SITE_CONFIG.description}. Access comprehensive guides, API references, and tools designed for the next generation of development.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:600ms]">
            <Button 
              size="lg" 
              className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all" 
              asChild
              onMouseEnter={preloadDocsRoute}
            >
              <Link to={SITE_CONFIG.getStartedUrl}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/30 hover:border-primary/60 hover:bg-primary/5 backdrop-blur-sm" asChild>
              <a href={SITE_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
                <Terminal className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>

        </div>
      </div>

    </section>
  );
}
