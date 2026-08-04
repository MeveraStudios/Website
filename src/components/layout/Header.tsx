/**
 * Header Component
 * 
 * This component displays the site header with:
 * - Logo (customizable, see LOGO PLACEMENT comment below)
 * - Navigation links
 * - Project dropdown
 * - External links (GitHub, Discord)
 * - Mobile menu toggle
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Github, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SITE_CONFIG, PROJECTS, NAVIGATION } from '@/config/site';
import faviconUrl from '@/assets/favicon.ico';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CodeThemeToggle } from '@/components/CodeThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SearchDialog } from '@/components/docs/SearchDialog';
import { DiscordIcon } from '@/components/DiscordIcon';
import { ScrollProgress } from '@/components/layout/ScrollProgress';

/**
 * =============================================================================
 * LOGO PLACEMENT
 * =============================================================================
 * 
 * To customize the logo, replace the Logo component below with your own:
 * 
 * Option 1: Use an image
 * <img src="/logo.png" alt={SITE_CONFIG.brandName} className="h-8 w-auto" />
 * 
 * Option 2: Use text
 * <span className="text-xl font-bold">{SITE_CONFIG.brandName}</span>
 * 
 * Option 3: Custom SVG
 * <svg>...</svg>
 */
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      {/* 
        LOGO PLACEMENT - Using favicon.ico as the logo
        
        The favicon is imported from src/assets/favicon.ico and displayed here.
        To use a different logo, replace the faviconUrl import at the top of this file.
      */}
      <img
        src={faviconUrl}
        alt={SITE_CONFIG.brandName}
        className="h-8 w-8 transition-transform group-hover:scale-110"
      />
      <span className="text-xl font-bold hidden sm:inline-block">
        {SITE_CONFIG.brandName}
      </span>
    </Link>
  );
}

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const getProjectHref = (project: typeof PROJECTS[number]) => project.docLink || `/docs/${project.id}`;

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname.startsWith(path);
  };

  // Code-theme picker only makes sense on doc routes.
  const onDocs = location.pathname.startsWith('/docs');
  const pathParts = location.pathname.split('/').filter(Boolean);
  const onProjectDoc = onDocs && pathParts.length >= 3;
  const projectId = onProjectDoc ? pathParts[1] : undefined;

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <ScrollProgress />
      <div className="container mx-auto px-4 h-16 flex items-center" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        {/* Logo */}
        <div className="flex-1 flex justify-start -ml-24">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {/* Projects Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-1 data-[state=open]:bg-muted"
              >
                Projects
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {PROJECTS.map((project) => (
                <DropdownMenuItem key={project.id} asChild>
                  <Link
                    to={getProjectHref(project)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span>{project.emoji}</span>
                    <span>{project.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Main Navigation Links */}
          {NAVIGATION.mainNav.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={isActive(item.href) ? 'bg-muted' : ''}
              onClick={(e) => {
                if (item.href.startsWith('/#') && window.location.pathname === '/') {
                  e.preventDefault();
                  const id = item.href.replace('/#', '');
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <Link to={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* External Links */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-1 mr-[-6rem]">
          {onProjectDoc && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-8 w-48 rounded-md border border-border/60 bg-muted/40 px-2.5 text-sm text-muted-foreground hover:bg-muted/80 hover:border-border transition-colors"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search docs...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
            </button>
          )}
          <LanguageToggle />
          <ThemeToggle />
          {onDocs && <CodeThemeToggle />}
          {SITE_CONFIG.discordUrl && (
            <Button variant="ghost" size="icon" asChild className="touch-target">
              <a
                href={SITE_CONFIG.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
              >
                <DiscordIcon className="h-5 w-5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild className="touch-target">
            <a
              href={SITE_CONFIG.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <div className="md:hidden flex items-center">
            {onProjectDoc && (
              <Button variant="ghost" size="icon" className="touch-target" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
            {onDocs && <CodeThemeToggle />}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-6 mt-8">
              {/* Mobile Logo */}
              <Logo />

              {/* Mobile Navigation */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground px-2">
                  Projects
                </p>
                {PROJECTS.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    asChild
                    className="justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to={getProjectHref(project)}>
                      <span>{project.emoji}</span>
                      {project.name}
                    </Link>
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground px-2">
                  Navigation
                </p>
                {NAVIGATION.mainNav.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    asChild
                    className="justify-start"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (item.href.startsWith('/#') && window.location.pathname === '/') {
                        e.preventDefault();
                        const id = item.href.replace('/#', '');
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <Link to={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground px-2">
                  Links
                </p>
                <Button
                  variant="ghost"
                  asChild
                  className="justify-start gap-2"
                >
                  <a
                    href={SITE_CONFIG.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                {SITE_CONFIG.discordUrl && (
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start gap-2"
                  >
                    <a
                      href={SITE_CONFIG.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DiscordIcon className="h-4 w-4" />
                      Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <SearchDialog projectId={projectId} open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
