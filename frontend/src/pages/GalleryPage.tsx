import { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { CTAButton } from '../components/public/CTAButton';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ─── Scroll Reveal ───
function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80', alt: 'Ambiance du restaurant' },
  { src: '/rr-ice12.png', alt: 'Entrée du restaurant' },
  { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80', alt: 'Plats gastronomiques' },
  { src: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80', alt: 'Cocktails signature' },
  { src: '/rr-ice9.png', alt: 'Terrasse au coucher de soleil' },
  { src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80', alt: 'Desserts maison' },
  { src: '/rr-ice2.png', alt: 'Vue extérieure' },
  { src: '/rr-ice3.png', alt: 'Ambiance soirée' },
  { src: '/rr-ice4.png', alt: 'Terrasse' },
];

export function GalleryPage() {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
  }, [lightboxIndex]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
  }, [lightboxIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, goNext, goPrev]);

  // Touch swipe
  useEffect(() => {
    if (lightboxIndex === null) return;
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) goNext();
        else goPrev();
      }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [lightboxIndex, goNext, goPrev]);

  return (
    <div className="bg-coffee-950 text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 text-center">
        <ScrollReveal>
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
            Galerie
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-3xl md:text-6xl font-display font-bold text-cream-100 mb-4 md:mb-6 tracking-wide">
            Notre Univers
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-cream-400/70 font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Plongez dans l'atmosphère de RR Ice à travers nos photos
          </p>
        </ScrollReveal>
      </section>

      {/* Gallery Grid */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {galleryImages.map((img, idx) => (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div
                  onClick={() => openLightbox(idx)}
                  className="relative group cursor-pointer overflow-hidden aspect-[4/3]"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-end">
                    <span className="text-white text-xs font-body tracking-wider uppercase px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {img.alt}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={100}>
            <div className="text-center mt-16">
              <CTAButton onClick={() => setIsReservationModalOpen(true)}>Réserver une table</CTAButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-cream-400/60 hover:text-cream-200 active:text-cream-100 transition-colors z-10 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-cream-400/50 text-xs font-body tracking-widest z-10">
            {lightboxIndex + 1} / {galleryImages.length}
          </div>

          {/* Prev */}
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 text-cream-400/50 hover:text-cream-200 active:text-cream-100 transition-colors z-10 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Image */}
          <div className="max-w-5xl max-h-[80vh] w-full mx-4 md:mx-16 flex items-center justify-center">
            <img
              src={galleryImages[lightboxIndex].src}
              alt={galleryImages[lightboxIndex].alt}
              className="max-w-full max-h-[80vh] object-contain animate-fadeIn"
            />
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 text-cream-400/50 hover:text-cream-200 active:text-cream-100 transition-colors z-10 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <ChevronRightIcon className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Caption */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-cream-400/60 text-sm font-body tracking-wider">
              {galleryImages[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} />
    </div>
  );
}
