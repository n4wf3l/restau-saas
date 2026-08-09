import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRestaurantBasePath } from '../../hooks/useRestaurantBasePath';
import { usePublicSettings } from '../../contexts/PublicSettingsContext';
import { resolveLogoUrl } from '../../lib/api';

interface CinematicNavProps {
  onReservationClick: () => void;
  hideReservation?: boolean;
}

/**
 * Minimal cinematic navigation:
 * - Fully transparent — always floats over the imagery (no bg tint at any scroll)
 * - Text readability comes from the vignette on the images + text-shadow on links
 * - Fullscreen overlay menu (fade + backdrop-blur, staggered links)
 * - Reserve CTA always accessible
 */
export function CinematicNav({ onReservationClick, hideReservation }: CinematicNavProps) {
  const { t } = useTranslation();
  const basePath = useRestaurantBasePath();
  const ps = usePublicSettings();
  const restaurantName = ps?.restaurant_name ?? '';
  const logoSrc = resolveLogoUrl(ps?.logo_url);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { label: t('nav.home'),    to: basePath },
    { label: t('nav.gallery'), to: `${basePath}/gallery` },
    { label: t('nav.menu'),    to: `${basePath}/menu` },
    { label: t('nav.contact'), to: `${basePath}/contact` },
  ];

  return (
    <>
      {/* Top bar — always transparent, floats over imagery */}
      <header className="fixed top-0 inset-x-0 z-50 bg-transparent"
        style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
      >
        <div className="flex items-center justify-between px-6 sm:px-10 md:px-14 h-20">
          {/* Logo */}
          <Link to={basePath} className="flex items-center gap-3 group">
            {logoSrc ? (
              <img src={logoSrc} alt={restaurantName} className="w-10 h-10 object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center"
                aria-label={restaurantName}
              >
                <span className="text-white font-display font-medium text-lg">
                  {restaurantName ? restaurantName.charAt(0).toUpperCase() : '·'}
                </span>
              </div>
            )}
            <span className="hidden sm:inline text-white text-sm tracking-[0.2em] uppercase font-body">
              {restaurantName}
            </span>
          </Link>

          {/* Right cluster */}
          <div className="flex items-center gap-6 md:gap-10">
            {!hideReservation && (
              <button
                onClick={onReservationClick}
                className="hidden md:inline-flex text-white text-xs tracking-[0.3em] uppercase font-body border-b border-white/50 hover:border-white pb-1 transition-colors"
              >
                {t('nav.reserve')}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-3 text-white text-xs tracking-[0.3em] uppercase font-body group"
              aria-label={t('nav.hamburgerOpen')}
            >
              <span className="hidden sm:inline">MENU</span>
              <span className="flex flex-col gap-1.5">
                <span className="block w-8 h-px bg-white transition-transform group-hover:translate-x-1" />
                <span className="block w-5 h-px bg-white ml-auto transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen menu overlay */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className="absolute inset-0 bg-black"
          style={{
            opacity: menuOpen ? 0.94 : 0,
            backdropFilter: `blur(${menuOpen ? 20 : 0}px)`,
            WebkitBackdropFilter: `blur(${menuOpen ? 20 : 0}px)`,
            transition: 'opacity 600ms cubic-bezier(0.4,0,0.2,1), backdrop-filter 600ms cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 600ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />

        {/* Close */}
        <button
          onClick={() => setMenuOpen(false)}
          aria-label={t('common.close')}
          className="absolute top-8 right-8 md:top-10 md:right-14 z-10 text-white/80 hover:text-white flex items-center gap-3 text-xs tracking-[0.3em] uppercase font-body"
          style={{ opacity: menuOpen ? 1 : 0, transition: 'opacity 400ms 200ms' }}
        >
          <span className="hidden sm:inline">{t('common.close')}</span>
          <span className="relative w-8 h-8">
            <span className="absolute inset-x-0 top-1/2 h-px bg-current rotate-45" />
            <span className="absolute inset-x-0 top-1/2 h-px bg-current -rotate-45" />
          </span>
        </button>

        {/* Content */}
        <div
          className="relative h-full flex flex-col justify-center px-6 sm:px-10 md:px-20 lg:px-28 max-w-7xl mx-auto"
          style={{ opacity: menuOpen ? 1 : 0, transition: 'opacity 500ms 150ms' }}
        >
          <nav aria-label="Main menu">
            <ul className="space-y-4 md:space-y-6">
              {navLinks.map((link, i) => (
                <li
                  key={link.label}
                  style={{
                    transitionDelay: `${menuOpen ? 200 + i * 80 : 0}ms`,
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="group inline-flex items-baseline gap-4 text-white font-display leading-none"
                  >
                    <span className="text-white/40 text-sm md:text-base tabular-nums font-body">
                      0{i + 1}
                    </span>
                    <span
                      className="tracking-tight transition-all duration-500 group-hover:pl-6 group-hover:text-brand"
                      style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)' }}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {!hideReservation && (
            <div
              className="mt-12 md:mt-16"
              style={{
                transitionDelay: `${menuOpen ? 200 + navLinks.length * 80 : 0}ms`,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); onReservationClick(); }}
                className="inline-flex items-center gap-4 text-white text-xs tracking-[0.3em] uppercase font-body border border-white/50 hover:border-white hover:bg-white/5 px-8 py-4 transition-colors"
              >
                {t('nav.reserve')}
                <span className="w-6 h-px bg-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
