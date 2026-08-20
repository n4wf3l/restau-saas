import { useTranslation } from 'react-i18next';

interface MobileReserveCTAProps {
  onReservationClick: () => void;
  hideReservation?: boolean;
}

/**
 * Full-width sticky "Réserver" bar pinned to the bottom of the viewport on
 * mobile. Hidden on md+ (the desktop navbar's CTA covers that case) and when
 * the tenant has reservations disabled. Because this is always on screen on
 * phones, the fullscreen hamburger menu no longer includes a Réserver entry.
 */
export function MobileReserveCTA({ onReservationClick, hideReservation }: MobileReserveCTAProps) {
  const { t } = useTranslation();
  if (hideReservation) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-black via-black/95 to-transparent">
      <button
        onClick={onReservationClick}
        className="w-full py-4 bg-brand text-page font-body font-bold text-sm tracking-[0.15em] uppercase hover:bg-brand-hover active:bg-brand-hover transition-colors"
      >
        {t('home.reservation.mobileButton')}
      </button>
    </div>
  );
}
