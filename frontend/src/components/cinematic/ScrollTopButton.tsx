import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Small floating "back to top" button, bottom-right of the viewport.
 * Fades in once the user has scrolled past ~80% of a viewport height,
 * fades out at the very top. Smooth scroll to top on click.
 * Minimal cinematic styling that fits over dark imagery.
 */
export function ScrollTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('common.scrollTop')}
      className={`fixed bottom-10 right-10 z-40 w-12 h-12 rounded-full border border-white/40 bg-black/60 backdrop-blur-sm hidden md:flex items-center justify-center text-white/80 hover:text-white hover:border-white hover:bg-black/80 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}
