import { Outlet, useParams } from 'react-router-dom';
import { PublicSettingsProvider } from '../contexts/PublicSettingsContext';
import { SiteImagesProvider } from '../contexts/SiteImagesContext';

/**
 * Wrapper layout for all `/r/:slug/*` routes.
 * Reads the slug from the URL and provides tenant-scoped contexts.
 */
export function RestaurantLayout() {
  const { slug } = useParams<{ slug: string }>();

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
        <Outlet />
      </SiteImagesProvider>
    </PublicSettingsProvider>
  );
}
