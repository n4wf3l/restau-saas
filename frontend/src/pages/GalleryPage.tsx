import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/public/Navbar';
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
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const publicSettings = usePublicSettings();
  const restaurantName = publicSettings?.restaurant_name ?? 'RR Ice';
  const siteImages = useSiteImages();

  const galleryImages = (siteImages?.gallery ?? []).map(img => ({
    src: img.image_url, alt: img.alt || '',
  }));
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;

  return (
    <div className="bg-coffee-950 text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      {!hideReservation && <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />}

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
            Plongez dans l'atmosphère de {restaurantName} à travers nos photos
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
                <CTAButton onClick={() => setIsReservationModalOpen(true)}>Réserver une table</CTAButton>
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
