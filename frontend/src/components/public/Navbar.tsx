import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CTAButton } from './CTAButton';

interface NavbarProps {
  onReservationClick: () => void;
}

type NavLink = { label: string } & ({ href: string; to?: never } | { to: string; href?: never });

const navLinks: NavLink[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Galerie', to: '/gallery' },
  { label: 'Menu', to: '/menu' },
  { label: 'Contact', to: '/contact' },
];

const LANGUAGES = [
  { code: 'FR', label: 'FR' },
  { code: 'EN', label: 'EN' },
  { code: 'AR', label: 'AR' },
];

export function Navbar({ onReservationClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('FR');
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const location = useLocation();

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
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="RR Ice" className="w-12 h-12 object-contain" />
              </Link>
            </div>

            <div className="flex-[2] flex justify-center items-center gap-16 border-r border-cream-400/30 px-8">
              {navLinks.map((link) => renderDesktopLink(link))}
            </div>

            <div className="flex-1 flex justify-center items-center gap-6 px-8">
              {/* Language Trigger — Desktop */}
              <button
                onClick={() => setLangPickerOpen(true)}
                className="w-9 h-9 rounded-full border border-cream-400/30 flex items-center justify-center text-[11px] tracking-[0.15em] uppercase text-cream-300 font-semibold hover:border-cream-400/60 hover:bg-cream-400/5 transition-all duration-300"
              >
                {activeLang}
              </button>

              <CTAButton onClick={onReservationClick}>Réserver</CTAButton>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-16 px-5">
            <Link to="/" className="flex items-center gap-2 z-50">
              <img src="/logo.png" alt="RR Ice" className="w-12 h-12 object-contain" />
            </Link>

            {/* Hamburger / Close */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 w-12 h-12 flex items-center justify-center"
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
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
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Blurred backdrop */}
        <div className={`absolute inset-0 backdrop-blur-2xl bg-black/60 transition-all duration-700 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Content */}
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
          <div
            className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''} mb-10`}
            style={{ animationDelay: `${navLinks.length * 80 + 100}ms` }}
          >
            <CTAButton onClick={() => { onReservationClick(); setIsOpen(false); }} className="px-16 py-5 text-sm">
              Réserver
            </CTAButton>
          </div>

          {/* Language Trigger — Mobile */}
          <div
            className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''}`}
            style={{ animationDelay: `${navLinks.length * 80 + 200}ms` }}
          >
            <button
              onClick={() => { setIsOpen(false); setTimeout(() => setLangPickerOpen(true), 300); }}
              className="w-14 h-14 rounded-full border border-cream-400/30 flex items-center justify-center text-sm tracking-[0.15em] uppercase text-cream-300 font-semibold font-body hover:border-cream-400/60 hover:bg-cream-400/5 transition-all duration-300"
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
        className={`fixed inset-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          langPickerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Blurred backdrop */}
        <div
          className={`absolute inset-0 backdrop-blur-2xl bg-black/70 transition-all duration-700 ${
            langPickerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setLangPickerOpen(false)}
        />

        {/* Close button */}
        <button
          onClick={() => setLangPickerOpen(false)}
          className="absolute top-5 right-5 md:top-8 md:right-8 z-10 w-12 h-12 flex items-center justify-center text-cream-400/60 hover:text-cream-200 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center">
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-10 font-body">
            Langue
          </p>

          <div className="flex flex-col items-center gap-4">
            {LANGUAGES.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => { setActiveLang(lang.code); setLangPickerOpen(false); }}
                className={`group flex items-center gap-5 px-10 py-4 rounded-none border transition-all duration-300 min-w-[200px] md:min-w-[260px] justify-center ${
                  langPickerOpen ? 'animate-menu-reveal' : 'opacity-0'
                } ${
                  activeLang === lang.code
                    ? 'border-cream-400/50 bg-cream-400/10 text-cream-200'
                    : 'border-cream-400/15 text-cream-400/60 hover:border-cream-400/40 hover:text-cream-300 hover:bg-cream-400/5'
                }`}
                style={{ animationDelay: `${index * 80 + 100}ms` }}
              >
                <span className="text-2xl md:text-3xl font-display font-bold tracking-wider">
                  {lang.code === 'FR' ? 'Français' : lang.code === 'EN' ? 'English' : 'العربية'}
                </span>
                {activeLang === lang.code && (
                  <span className="w-2 h-2 rounded-full bg-cream-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
