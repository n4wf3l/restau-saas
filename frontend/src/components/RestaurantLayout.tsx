import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { PublicSettingsProvider, usePublicSettings } from '../contexts/PublicSettingsContext';
import { SiteImagesProvider } from '../contexts/SiteImagesContext';

/** Read initial theme synchronously from localStorage so first paint uses the right palette. */
function readCachedTheme(slug: string): string {
  try {
    const raw = localStorage.getItem(`publicSettings:${slug}`);
    if (!raw) return 'coffee';
    const parsed = JSON.parse(raw) as { theme?: string };
    return parsed.theme || 'coffee';
  } catch { return 'coffee'; }
}

/** Applies data-theme on <html> based on the tenant's current settings. */
function ThemeApplier({ children }: { children: React.ReactNode }) {
  const settings = usePublicSettings();
  const theme = settings?.theme || null;
  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return <>{children}</>;
}

/**
 * Wrapper layout for all `/r/:slug/*` routes.
 * Reads the slug from the URL and provides tenant-scoped contexts.
 */
export function RestaurantLayout() {
  const { slug } = useParams<{ slug: string }>();

  // Remember the last visited tenant so global routes like /login can apply its branding.
  // Also apply the cached theme synchronously to avoid a first-paint flash.
  useEffect(() => {
    if (!slug) return;
    try { localStorage.setItem('lastTenant', slug); } catch { /* storage disabled */ }
    document.documentElement.dataset.theme = readCachedTheme(slug);
  }, [slug]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Restaurant introuvable.</p>
      </div>
    );
  }

  // Key on slug so contexts re-fetch when navigating between restaurants
  return (
    <PublicSettingsProvider key={slug}>
      <SiteImagesProvider key={slug}>
        <ThemeApplier>
          <Outlet />
        </ThemeApplier>
      </SiteImagesProvider>
    </PublicSettingsProvider>
  );
}
