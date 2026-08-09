import { lazy, Suspense } from 'react';
import { usePublicSettings } from '../contexts/PublicSettingsContext';

/**
 * Chooses which Home variant to render based on the tenant's `layout` setting.
 * - 'classic'   → original Home (RR Ice style)
 * - 'cinematic' → scroll-storytelling CinematicHome (FYN-inspired)
 * Falls back to classic while settings load, then swaps if needed.
 */
const Home = lazy(() => import('./Home'));
const CinematicHome = lazy(() => import('./CinematicHome'));

export default function HomeSwitch() {
  const settings = usePublicSettings();
  const layout = settings?.layout ?? 'classic';

  const Component = layout === 'cinematic' ? CinematicHome : Home;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-page">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}
