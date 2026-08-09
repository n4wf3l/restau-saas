import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicNav } from '../components/public/PublicNav';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { CTAButton } from '../components/public/CTAButton';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { useSiteImages } from '../contexts/SiteImagesContext';
import { ImageLightbox } from '../components/ui/ImageLightbox';

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


export default function GalleryPage() {
  const { t } = useTranslation();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const publicSettings = usePublicSettings();
  const restaurantName = publicSettings?.restaurant_name ?? 'RR Ice';
  const siteImages = useSiteImages();

  const galleryImages = (siteImages?.gallery ?? []).map(img => ({
    src: img.image_url, alt: img.alt || '',
  }));
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;

  // Moroccan zellij medallion — large khatam (8-point star) + inner octagon + center dot.
  // Tile 320px with generous space around each star so it reads as a decorative medallion,
  // not wallpaper. Cream color at low opacity to stay subtle over coffee-950.
  const zellijPattern = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'><g fill='none' stroke='%23d4b18a' stroke-width='1.4' stroke-opacity='0.18'><polygon points='160,60 260,160 160,260 60,160'/><polygon points='89.3,89.3 230.7,89.3 230.7,230.7 89.3,230.7'/><polygon points='197,175 175,197 145,197 123,175 123,145 145,123 175,123 197,145'/></g><circle cx='160' cy='160' r='2.5' fill='%23d4b18a' fill-opacity='0.28'/></svg>\")";

  return (
    <div
      className="bg-page text-white min-h-screen"
      style={{ backgroundImage: zellijPattern, backgroundRepeat: 'repeat', backgroundSize: '320px 320px' }}
    >
      <PublicNav onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      {!hideReservation && <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />}

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 text-center">
        <ScrollReveal>
          <p className="text-accent text-xs tracking-[0.35em] uppercase mb-4 font-body">
            {t('gallery.eyebrow')}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-3xl md:text-6xl font-display font-bold text-primary mb-4 md:mb-6 tracking-wide">
            {t('gallery.title')}
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-secondary font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t('gallery.desc', { restaurantName })}
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
                  onClick={() => setLightboxIndex(idx)}
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

          {!hideReservation && (
            <ScrollReveal delay={100}>
              <div className="text-center mt-16">
                <CTAButton onClick={() => setIsReservationModalOpen(true)}>{t('gallery.reserveCta')}</CTAButton>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={galleryImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
    </div>
  );
}
