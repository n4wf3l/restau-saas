import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CTAButton } from './CTAButton';
import { usePublicSettings } from '../../contexts/PublicSettingsContext';
import { useRestaurantBasePath } from '../../hooks/useRestaurantBasePath';
import { API_BASE_URL } from '../../lib/api';

interface NavbarProps {
  onReservationClick: () => void;
  hideReservation?: boolean;
}

type NavLink = { label: string } & ({ href: string; to?: never } | { to: string; href?: never });

const LANGUAGES = [
  { code: 'fr', label: 'FR', nameKey: 'lang.french' },
  { code: 'en', label: 'EN', nameKey: 'lang.english' },
  { code: 'ar', label: 'AR', nameKey: 'lang.arabic' },
] as const;

export function Navbar({ onReservationClick, hideReservation }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const basePath = useRestaurantBasePath();
  const activeLang = (LANGUAGES.find(l => l.code === i18n.language)?.label) ?? 'EN';
  const navLinks: NavLink[] = [
    { label: t('nav.home'), to: basePath },
    { label: t('nav.gallery'), to: `${basePath}/gallery` },
    { label: t('nav.menu'), to: `${basePath}/menu` },
    { label: t('nav.contact'), to: `${basePath}/contact` },
  ];
  const ps = usePublicSettings();
  const restaurantName = ps?.restaurant_name ?? 'RR Ice';
  const logoSrc = ps?.logo_url ? (ps.logo_url.startsWith('http') ? ps.logo_url : `${API_BASE_URL}${ps.logo_url}`) : '/logo.png';

  // Lock body scroll when mobile menu or lang picker is open
  useEffect(() => {
    if (isOpen || langPickerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, langPickerOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const renderDesktopLink = (link: NavLink) => {
    const cls = 'text-white hover:text-cream-300 transition-colors text-sm font-medium tracking-[0.25em] uppercase';
    if (link.to) {
      return <Link key={link.label} to={link.to} className={cls}>{link.label}</Link>;
    }
    return (
      <a
        key={link.label}
        href={link.href}
        onClick={() => {
          if (link.href?.startsWith('/#') && location.pathname !== '/') {
            window.location.href = link.href;
          }
        }}
        className={cls}
      >
        {link.label}
      </a>
    );
  };

  return (
    <>
      <nav className="fixed top-0 w-full backdrop-blur-sm z-50">
        <div className="max-w-full mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center h-20">
            <div className="flex-1 flex justify-center items-center border-r border-cream-400/30 px-8">
              <Link to={basePath} className="flex items-center gap-2">
                <img src={logoSrc} alt={restaurantName} className="w-12 h-12 object-contain" />
              </Link>
            </div>

            <div className="flex-[2] flex justify-center items-center gap-16 border-r border-cream-400/30 px-8">
              {navLinks.map((link) => renderDesktopLink(link))}
            </div>

            <div className="flex-1 flex justify-center items-center gap-6 px-8">
              {/* Language Trigger — Desktop */}
              <button
                onClick={() => setLangPickerOpen(true)}
                aria-label={t('nav.langAria', { lang: activeLang })}
                aria-haspopup="dialog"
                aria-expanded={langPickerOpen}
                className="w-9 h-9 rounded-full border border-cream-400/30 flex items-center justify-center text-[11px] tracking-[0.15em] uppercase text-cream-300 font-semibold hover:border-cream-400/60 hover:bg-cream-400/5 focus:outline-none focus:ring-2 focus:ring-cream-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
              >
                {activeLang}
              </button>

              {!hideReservation && <CTAButton onClick={onReservationClick}>{t('nav.reserve')}</CTAButton>}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-16 px-5">
            <Link to="/" className="flex items-center gap-2 z-50">
              <img src={logoSrc} alt={restaurantName} className="w-12 h-12 object-contain" />
            </Link>

            {/* Hamburger / Close */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 w-12 h-12 flex items-center justify-center"
              aria-label={isOpen ? t('nav.hamburgerClose') : t('nav.hamburgerOpen')}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-[2px] bg-white rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${
                  isOpen ? 'rotate-45 translate-y-[9px]' : ''
                }`} />
                <span className={`block h-[2px] bg-white rounded-full transition-all duration-300 ${
                  isOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                }`} />
                <span className={`block h-[2px] bg-white rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${
                  isOpen ? '-rotate-45 -translate-y-[9px]' : ''
                }`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════ */}
      {/* FULLSCREEN MOBILE MENU                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={() => setIsOpen(false)}
      >
        {/* Blurred backdrop — owns the visual fade (opacity + blur transition together, no parent opacity gate) */}
        <div
          className="absolute inset-0 bg-black/60"
          style={{
            opacity: isOpen ? 1 : 0,
            backdropFilter: `blur(${isOpen ? 24 : 0}px)`,
            WebkitBackdropFilter: `blur(${isOpen ? 24 : 0}px)`,
            transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1), backdrop-filter 700ms cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 700ms cubic-bezier(0.4,0,0.2,1)',
            willChange: 'backdrop-filter, opacity',
          }}
        />

        {/* Content — clicks on empty areas bubble up to close */}
        <div className="relative h-full flex flex-col justify-center items-center px-8">

          {/* Nav Links — large, staggered */}
          <nav className="flex flex-col items-center gap-2 mb-12">
            {navLinks.map((link, index) => {
              const isActive = link.to ? location.pathname === link.to : false;

              return (
                <div
                  key={link.label}
                  className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''}`}
                  style={{ animationDelay: `${index * 80 + 100}ms` }}
                >
                  {link.to ? (
                    <Link
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className="block py-3 group"
                    >
                      <span className={`text-3xl font-display font-bold tracking-wider transition-colors duration-300 ${
                        isActive ? 'text-cream-400' : 'text-white group-hover:text-cream-300'
                      }`}>
                        {link.label}
                      </span>
                      {/* Animated underline */}
                      <div className={`h-[1px] mt-1 bg-cream-400/40 ${
                        isActive
                          ? (isOpen ? 'animate-menu-line' : 'w-0')
                          : 'w-0 group-hover:w-full transition-all duration-500'
                      }`} />
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => {
                        setIsOpen(false);
                        if (link.href?.startsWith('/#') && location.pathname !== '/') {
                          window.location.href = link.href;
                        }
                      }}
                      className="block py-3 group"
                    >
                      <span className="text-3xl font-display font-bold tracking-wider text-white group-hover:text-cream-300 transition-colors duration-300">
                        {link.label}
                      </span>
                      <div className="h-[1px] mt-1 bg-cream-400/40 w-0 group-hover:w-full transition-all duration-500" />
                    </a>
                  )}
                </div>
              );
            })}
          </nav>

          {/* CTA Button */}
          {!hideReservation && (
            <div
              className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''} mb-10`}
              style={{ animationDelay: `${navLinks.length * 80 + 100}ms` }}
            >
              <CTAButton onClick={() => { onReservationClick(); setIsOpen(false); }} className="px-16 py-5 text-sm">
                {t('nav.reserve')}
              </CTAButton>
            </div>
          )}

          {/* Language Trigger — Mobile */}
          <div
            className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''}`}
            style={{ animationDelay: `${navLinks.length * 80 + 200}ms` }}
          >
            <button
              onClick={() => { setIsOpen(false); setTimeout(() => setLangPickerOpen(true), 300); }}
              aria-label={t('nav.langAria', { lang: activeLang })}
              aria-haspopup="dialog"
              className="w-14 h-14 rounded-full border border-cream-400/30 flex items-center justify-center text-sm tracking-[0.15em] uppercase text-cream-300 font-semibold font-body hover:border-cream-400/60 hover:bg-cream-400/5 focus:outline-none focus:ring-2 focus:ring-cream-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
            >
              {activeLang}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* FULLSCREEN LANGUAGE PICKER                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ pointerEvents: langPickerOpen ? 'auto' : 'none' }}
        onClick={() => setLangPickerOpen(false)}
      >
        {/* Blurred backdrop — owns the visual fade (opacity + blur transition together, no parent opacity gate) */}
        <div
          className="absolute inset-0 bg-black/70"
          style={{
            opacity: langPickerOpen ? 1 : 0,
            backdropFilter: `blur(${langPickerOpen ? 24 : 0}px)`,
            WebkitBackdropFilter: `blur(${langPickerOpen ? 24 : 0}px)`,
            transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1), backdrop-filter 700ms cubic-bezier(0.4,0,0.2,1), -webkit-backdrop-filter 700ms cubic-bezier(0.4,0,0.2,1)',
            willChange: 'backdrop-filter, opacity',
          }}
        />

        {/* Close button */}
        <button
          onClick={() => setLangPickerOpen(false)}
          className="absolute top-5 right-5 md:top-8 md:right-8 z-10 w-12 h-12 flex items-center justify-center text-cream-400/60 hover:text-cream-200 transition-opacity duration-500"
          style={{ opacity: langPickerOpen ? 1 : 0 }}
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content — clicks on empty areas (title, gaps) bubble up to close */}
        <div
          className="relative h-full flex flex-col items-center justify-center transition-opacity duration-500 ease-out"
          style={{ opacity: langPickerOpen ? 1 : 0, transitionDelay: langPickerOpen ? '100ms' : '0ms' }}
        >
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-10 font-body">
            {t('lang.picker')}
          </p>

          <div className="flex flex-col items-center gap-4">
            {LANGUAGES.map((lang, index) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setLangPickerOpen(false); }}
                  className={`group flex items-center gap-5 px-10 py-4 rounded-none border transition-all duration-300 min-w-[200px] md:min-w-[260px] justify-center ${
                    langPickerOpen ? 'animate-menu-reveal' : 'opacity-0'
                  } ${
                    isActive
                      ? 'border-cream-400/50 bg-cream-400/10 text-cream-200'
                      : 'border-cream-400/15 text-cream-400/60 hover:border-cream-400/40 hover:text-cream-300 hover:bg-cream-400/5'
                  }`}
                  style={{ animationDelay: `${index * 80 + 100}ms` }}
                >
                  <span className="text-2xl md:text-3xl font-display font-bold tracking-wider">
                    {t(lang.nameKey)}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cream-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
