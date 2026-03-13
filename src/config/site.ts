/**
 * =============================================================================
 * SITE CONFIGURATION
 * =============================================================================
 * 
 * This file contains all the customizable variables for your documentation site.
 * Modify these values to match your brand and project details.
 */

// =============================================================================
// BRANDING - Replace with your own logo and brand colors
// =============================================================================

/**
 * LOGO PLACEMENT:
 * To add your logo, replace the Logo component in:
 * src/components/layout/Header.tsx
 * 
 * Look for the comment: "<!-- LOGO PLACEMENT -->"
 * 
 * You can either:
 * 1. Replace the SVG with your own logo SVG
 * 2. Use an <img> tag pointing to your logo file in the public folder
 * 3. Use a text-based logo with your brand name
 */

export const SITE_CONFIG = {
  // Brand name displayed in header and throughout the site
  brandName: 'Mevera Studios',

  // Full site title used in browser tab and SEO
  siteTitle: 'Mevera Studios | Documentation',

  // Tagline shown in the hero section
  tagline: 'projects documentation',

  // Description for SEO meta tags
  description: 'Documentation for Mevera Studio development libraries and tools',

  // URL for the "Get Started" button on homepage
  getStartedUrl: '/docs/Imperat/getting-started',

  // URL for the GitHub button on homepage
  githubUrl: 'https://github.com/MeveraStudios/Website',

  // Discord invite URL (set to null if not applicable)
  discordUrl: 'https://discord.mevera.studio',

  // Twitter/X URL (set to null if not applicable)
  twitterUrl: null,

  // Copyright year and holder
  copyright: {
    year: new Date().getFullYear(),
    holder: 'Mevera Studios',
    startYear: 2024,
  },
} as const;

import projectsData from '../data/projects.json';
import teamsData from '../data/teams.json';

// =============================================================================
// PROJECTS - Outsourced to src/data/projects.json
// =============================================================================

export const PROJECTS = projectsData.map(p => ({
  id: p.id,
  name: p.title,
  description: p.description,
  emoji: p.logoPath,
  color: p.color,
  featured: p.featured,
  githubRepo: p.githubRepo,
  docLink: p.docLink,
  hoverAnimator: p.hoverAnimator,
  titleColor: (p as any).titleColor,
  titleHoverColor: (p as any).titleHoverColor
}));

// =============================================================================
// TEAM MEMBERS - Outsourced to src/data/teams.json
// =============================================================================

export const TEAM_MEMBERS = teamsData.map(m => ({
  name: m["github-user"],
  displayName: (m as any)["display-name"],
  role: m["role-description"],
  github: m.github,
  discord: m["discord-user"],
  avatar: m.avatar,
  color: (m as any).color,
  electric: (m as any).electric,
  electricColor: (m as any)["electric-color"]
}));

// =============================================================================
// NAVIGATION - Configure header and footer links
// =============================================================================

export const NAVIGATION = {
  // Main navigation items in header
  mainNav: [
    { label: 'Team', href: '/#team' },
  ],

  // External links in header
  externalLinks: [
    {
      label: 'GitHub',
      href: SITE_CONFIG.githubUrl,
      icon: 'github'
    },
    ...(SITE_CONFIG.discordUrl ? [{
      label: 'Discord',
      href: SITE_CONFIG.discordUrl,
      icon: 'discord' as const,
    }] : []),
  ],
} as const;

// =============================================================================
// THEME CONFIGURATION - Customize colors and appearance
// =============================================================================

export const THEME_CONFIG = {
  // Primary brand color (used for buttons, links, accents)
  primaryColor: '#3b82f6',

  // Dark mode background colors
  darkBackground: '#0f172a',
  darkSurface: '#1e293b',

  // Light mode background colors
  lightBackground: '#ffffff',
  lightSurface: '#f8fafc',

  // Text colors
  textDark: '#0f172a',
  textLight: '#f8fafc',

  // Code block theme (see src/styles/code-theme.css for full customization)
  codeTheme: 'dark', // 'dark' | 'light' | 'custom'
} as const;

// =============================================================================
// FEATURE FLAGS - Enable/disable features
// =============================================================================

export const FEATURES = {
  // Enable dark mode toggle
  darkMode: true,

  // Enable search functionality
  search: true,

  // Enable "Edit this page" links in docs
  editPageLinks: true,

  // Enable last updated timestamp in docs
  lastUpdated: true,

  // Enable table of contents in docs
  tableOfContents: true,

  // Enable team section on homepage
  teamSection: true,

  // Enable contributors link in footer
  contributorsLink: true,
} as const;

// Type exports for TypeScript
export type Project = typeof PROJECTS[number];
export type TeamMember = typeof TEAM_MEMBERS[number];
export type SiteConfig = typeof SITE_CONFIG;
