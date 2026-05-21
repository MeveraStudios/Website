declare const __SITE_BUILD_ID__: string;

const VERSION_URL = '/site-version.json';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 15 * 1000;
const UPDATE_STORAGE_KEY = 'mevera:site-update-applied';
const UPDATE_QUERY_KEY = 'siteUpdate';
const RELOAD_DELAY_MS = 750;

type SiteVersion = {
  version?: string;
};

async function fetchLatestVersion(): Promise<string | null> {
  const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as SiteVersion;
  return typeof data.version === 'string' && data.version.length > 0 ? data.version : null;
}

function markReloadAttempt(version: string): boolean {
  const previousAttempt = sessionStorage.getItem(UPDATE_STORAGE_KEY);

  if (previousAttempt === version) {
    return false;
  }

  sessionStorage.setItem(UPDATE_STORAGE_KEY, version);
  return true;
}

async function refreshServiceWorkerState(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.update()));
}

function reloadWithCacheBuster(version: string) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set(UPDATE_QUERY_KEY, version);
  window.location.replace(nextUrl);
}

function clearRuntimeCachesInBackground() {
  if (!('caches' in window)) {
    return;
  }

  caches.keys()
    .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
    .catch(() => undefined);
}

function applyUpdate(version: string) {
  if (!markReloadAttempt(version)) {
    return;
  }

  clearRuntimeCachesInBackground();
  window.setTimeout(() => reloadWithCacheBuster(version), RELOAD_DELAY_MS);
}

export function installSiteUpdateCheck() {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return;
  }

  const currentVersion = __SITE_BUILD_ID__;
  let isChecking = false;

  const checkForUpdate = async () => {
    if (isChecking || document.visibilityState === 'hidden') {
      return;
    }

    isChecking = true;

    try {
      const latestVersion = await fetchLatestVersion();

      if (latestVersion && latestVersion !== currentVersion) {
        applyUpdate(latestVersion);
      }
    } catch {
      // A failed update check should never break the site.
    } finally {
      isChecking = false;
    }
  };

  window.setTimeout(checkForUpdate, INITIAL_CHECK_DELAY_MS);
  window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
  window.addEventListener('focus', checkForUpdate);
  document.addEventListener('visibilitychange', checkForUpdate);

  if ('serviceWorker' in navigator) {
    refreshServiceWorkerState().catch(() => undefined);
  }
}

export function scheduleSiteUpdateCheck() {
  if (typeof window === 'undefined') {
    return;
  }

  const install = () => installSiteUpdateCheck();

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(install, { timeout: 5000 });
    return;
  }

  setTimeout(install, 0);
}
