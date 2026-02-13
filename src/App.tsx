/**
 * Main App Component
 * 
 * Configures React Router with routes for:
 * - Home page (/)
 * - Documentation pages (/docs/:projectId/:slug)
 * 
 * Also handles:
 * - Scroll to top on navigation
 * - Page title updates
 * - 404 handling
 */

import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Docs } from '@/pages/Docs';
import { SITE_CONFIG } from '@/config/site';
import { preloadDocs } from '@/lib/docs';
import './App.css';

// Preload documentation data
preloadDocs();

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Update page title based on route
function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title: string = SITE_CONFIG.siteTitle;

    if (path.startsWith('/docs/')) {
      // Extract project and doc from URL
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const projectId = parts[1];
        const docSlug = parts[2];
        // Capitalize project name
        const projectName = projectId.charAt(0).toUpperCase() + projectId.slice(1);
        // Format doc slug
        const docName = docSlug
          ? docSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : 'Documentation';
        title = `${docName} | ${projectName} - ${SITE_CONFIG.brandName}`;
      }
    }

    document.title = title;
  }, [location]);

  return null;
}

// 404 Page
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Page not found
      </p>
      <a
        href="/"
        className="text-primary hover:underline"
      >
        Go back home
      </a>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <PageTitle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs/:projectId/:slug" element={<Docs />} />
        <Route path="/docs/:projectId" element={<Docs />} />
        <Route path="/docs" element={<Navigate to="/docs/Imperat/getting-started" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
