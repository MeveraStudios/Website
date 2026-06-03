/**
 * Main App Component
 * 
 * Configures React Router with routes for:
 * - Home page (/)
 * - Documentation pages (/docs/:projectId/:version/:slug)
 * 
 * Also handles:
 * - Scroll to top on navigation
 * - Page title updates
 * - 404 handling
 */

import { useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  Link
} from 'react-router-dom';
import { preloadDocs } from '@/lib/docs';
import { Helmet } from 'react-helmet-async';
import { Seo } from '@/components/Seo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { lookupRedirect } from '@/lib/redirects';

// Lazy loading the main route pages to split bundles
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Docs = lazy(() => import('@/pages/Docs').then(m => ({ default: m.Docs })));
const DocsHome = lazy(() => import('@/pages/DocsHome').then(m => ({ default: m.DocsHome })));
import './App.css';

// Preload documentation data
preloadDocs();

// Scroll to top on normal navigation, or to the requested hash target once it exists.
// Also moves focus to <main id="main-content"> so screen readers and keyboard users
// land on the new page instead of being stuck on a stale element.
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';

    const focusMain = () => {
      const main = document.getElementById('main-content');
      if (main) {
        // tabIndex=-1 is set on the element so programmatic focus works
        // without making it part of the tab order.
        main.focus({ preventScroll: true });
      }
    };

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior });
      focusMain();
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    let frameId = 0;
    let attempts = 0;
    const maxAttempts = 120;

    const scrollToHash = () => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior, block: 'start' });
        return;
      }

      if (attempts < maxAttempts) {
        attempts += 1;
        frameId = window.requestAnimationFrame(scrollToHash);
      }
    };

    scrollToHash();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [pathname, hash]);

  return null;
}

// 404 Page — checks the client-side redirects map first; if the current path
// was renamed, issue a replace-navigation to the new URL. Otherwise render
// the not-found UI with a noindex tag.
function NotFound() {
  const { pathname, search, hash } = useLocation();
  const target = lookupRedirect(pathname);
  if (target) {
    return <Navigate to={`${target}${search}${hash}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Seo
        title="Page not found"
        description="The page you were looking for does not exist."
        type="website"
      />
      {/* noindex via Helmet */}
      <NoIndex />
      <p className="text-sm tracking-widest uppercase text-muted-foreground mb-2">404</p>
      <h1 className="text-5xl md:text-6xl font-bold mb-4">Page not found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
        <Link
          to="/docs"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Browse docs
        </Link>
      </div>
    </div>
  );
}

function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollManager />
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs/:projectId/:version/:slug" element={<Docs />} />
            <Route path="/docs/:projectId/:version" element={<Docs />} />
            <Route path="/docs/:projectId" element={<Docs />} />
            <Route path="/docs" element={<DocsHome />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
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
