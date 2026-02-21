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
  const location = useLocation();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
              {/* Language Selector — Desktop */}
              <div className="flex items-center gap-1">
                {LANGUAGES.map((lang, i) => (
                  <span key={lang.code} className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveLang(lang.code)}
                      className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${
                        activeLang === lang.code
                          ? 'text-cream-300 font-semibold'
                          : 'text-cream-400/40 hover:text-cream-400/70'
                      }`}
                    >
                      {lang.label}
                    </button>
                    {i < LANGUAGES.length - 1 && (
                      <span className="text-cream-400/20 text-[10px] mx-0.5">/</span>
                    )}
                  </span>
                ))}
              </div>

              <CTAButton onClick={onReservationClick}>Réserver</CTAButton>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-20 px-5">
            <Link to="/" className="flex items-center gap-2 z-50">
              <img src="/logo.png" alt="RR Ice" className="w-12 h-12 object-contain" />
            </Link>

            {/* Hamburger / Close */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 w-10 h-10 flex items-center justify-center"
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

          {/* Language Selector — Mobile */}
          <div
            className={`opacity-0 ${isOpen ? 'animate-menu-reveal' : ''}`}
            style={{ animationDelay: `${navLinks.length * 80 + 200}ms` }}
          >
            <div className="flex items-center gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code)}
                  className={`w-10 h-10 rounded-full border text-xs tracking-[0.15em] font-body transition-all duration-300 ${
                    activeLang === lang.code
                      ? 'border-cream-400/60 text-cream-300 bg-cream-400/10'
                      : 'border-cream-400/20 text-cream-400/40 hover:border-cream-400/40 hover:text-cream-400/70'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
