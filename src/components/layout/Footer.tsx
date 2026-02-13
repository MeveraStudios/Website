/**
 * Footer Component
 * 
 * Displays the site footer with:
 * - Brand information
 * - Quick links
 * - Team info
 * - Copyright
 */

import { Link } from 'react-router-dom';
import { Github, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { SITE_CONFIG, PROJECTS, NAVIGATION } from '@/config/site';
import faviconUrl from '@/assets/favicon.ico';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const startYear = SITE_CONFIG.copyright.startYear;
  const yearRange = startYear === currentYear
    ? String(currentYear)
    : `${startYear}-${currentYear}`;

  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <img
                src={faviconUrl}
                alt={SITE_CONFIG.brandName}
                className="h-8 w-8 transition-transform group-hover:scale-110"
              />
              <span className="text-xl font-bold">{SITE_CONFIG.brandName}</span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-4">
              {SITE_CONFIG.description}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SITE_CONFIG.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              {SITE_CONFIG.discordUrl && (
                <a
                  href={SITE_CONFIG.discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Discord"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              <Link
                to="/#projects"
                className="hover:text-primary transition-colors"
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Projects
              </Link>
            </h3>
            <ul className="space-y-2">
              {PROJECTS.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/docs/${project.id}/getting-started`}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <span>{project.emoji}</span>
                    {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              {NAVIGATION.mainNav.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => {
                      if (item.href.startsWith('/#') && window.location.pathname === '/') {
                        e.preventDefault();
                        const id = item.href.replace('/#', '');
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={SITE_CONFIG.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Made by {SITE_CONFIG.copyright.holder} with{' '}
            <Heart className="h-4 w-4 inline text-red-500 fill-red-500" />
          </p>
          <p className="text-sm text-muted-foreground">
            Copyright &copy; {yearRange} {SITE_CONFIG.copyright.holder}
          </p>
        </div>
      </div>
    </footer>
  );
}
