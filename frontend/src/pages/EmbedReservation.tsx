import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicSettingsProvider, usePublicSettings } from '../contexts/PublicSettingsContext';
import { SiteImagesProvider } from '../contexts/SiteImagesContext';
import { ReservationModal } from '../components/public/ReservationModal';
import { SaasSEO } from '../components/SaasSEO';

/**
 * Chrome-free reservation flow, meant to be rendered inside the widget iframe.
 * URL: /embed/reserve?tenant=<slug>
 *
 * - No navbar, no footer, no cinematic — just the reservation modal
 * - Applies the tenant's theme so colors match
 * - On close, posts a message to the parent window so the widget can dismiss
 *   the iframe modal from outside.
 */

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const settings = usePublicSettings();
  const theme = settings?.theme || null;
  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return <>{children}</>;
}

function EmbedInner() {
  const notifyClose = () => {
    try { window.parent.postMessage({ type: 'na-widget:close' }, '*'); }
    catch { /* iframe in same origin fallback: just no-op */ }
  };

  return (
    <div className="min-h-screen bg-page">
      <ReservationModal isOpen={true} onClose={notifyClose} />
    </div>
  );
}

export default function EmbedReservation() {
  const [params] = useSearchParams();
  const slug = params.get('tenant');

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/70 font-body p-6 text-center">
        <p>Missing <code>?tenant=&lt;slug&gt;</code> parameter.</p>
      </div>
    );
  }

  return (
    <PublicSettingsProvider key={slug}>
      <SiteImagesProvider key={slug}>
        <SaasSEO page="embed" />
        <ThemeApplier>
          <EmbedInner />
        </ThemeApplier>
      </SiteImagesProvider>
    </PublicSettingsProvider>
  );
}
