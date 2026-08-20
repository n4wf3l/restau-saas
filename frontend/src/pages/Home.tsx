import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/public/Navbar';
import { ReservationModal } from '../components/public/ReservationModal';
import { Footer } from '../components/public/Footer';
import { CTAButton } from '../components/public/CTAButton';
import { MobileReserveCTA } from '../components/public/MobileReserveCTA';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { useSiteImages } from '../contexts/SiteImagesContext';
import { useRestaurantBasePath } from '../hooks/useRestaurantBasePath';
import { ImageLightbox, type LightboxImage } from '../components/ui/ImageLightbox';
import { resolveLogoUrl } from '../lib/api';

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


export default function Home() {
  const { t } = useTranslation();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const basePath = useRestaurantBasePath();
  const publicSettings = usePublicSettings();
  const restaurantName = publicSettings?.restaurant_name ?? '';
  const logoSrc = resolveLogoUrl(publicSettings?.logo_url);
  const siteImages = useSiteImages();

  const heroImages = (siteImages?.hero ?? []).map(img => img.image_url);

  const restaurantImages: LightboxImage[] = (siteImages?.restaurant ?? []).map(img => ({
    src: img.image_url, alt: img.alt || '',
  }));

  const carteImages: LightboxImage[] = (siteImages?.carte ?? []).map(img => ({
    src: img.image_url, alt: img.alt || '',
  }));
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slider pour les images de fond
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      {!hideReservation && <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />}

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Instant placeholder — always visible, no pure-black flash while images load */}
        <div className="absolute inset-0 bg-page" />

        {/* Background Slider */}
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 animate-hero-zoom ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              willChange: 'transform',
              transformOrigin: 'center',
            }}
          >
            <img
              src={image}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay on top of the image */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%)' }}
            />
          </div>
        ))}

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo — image if uploaded, else themed initial-letter placeholder */}
          <div className="flex justify-center mb-8 opacity-0 animate-hero-scale" style={{ animationDelay: '200ms' }}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={restaurantName}
                className="w-32 h-32 md:w-52 md:h-52 object-contain drop-shadow-2xl"
              />
            ) : (
              <div
                className="w-32 h-32 md:w-52 md:h-52 rounded-full border-2 border-brand bg-elevated flex items-center justify-center drop-shadow-2xl"
                aria-label={restaurantName}
              >
                <span className="font-display font-bold text-6xl md:text-8xl text-brand">
                  {restaurantName ? restaurantName.charAt(0).toUpperCase() : '·'}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-6xl font-display font-bold mb-4 md:mb-6 text-primary tracking-wider opacity-0 animate-hero-fade-up" style={{ animationDelay: '500ms' }}>
            {restaurantName}
          </h1>
          <p className="text-base md:text-xl text-primary mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 opacity-0 animate-hero-fade-up" style={{ animationDelay: '700ms' }}>
            {t('home.hero.tagline')}
          </p>
          <div className="flex justify-center opacity-0 animate-hero-fade-up" style={{ animationDelay: '900ms' }}>
            <CTAButton href={`${basePath}/menu`}>{t('home.hero.menuCta')}</CTAButton>
          </div>
        </div>
      </section>

      {/* Stats Section - Hidden */}
      <section className="hidden bg-gradient-to-b from-gray-900 to-black py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">20+</div>
            <p className="text-accent text-lg">Ans de Tradition</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">⭐ 4.9</div>
            <p className="text-accent text-lg">Notes Clients</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">150+</div>
            <p className="text-accent text-lg">Plats Différents</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 md:py-28 px-4 bg-page">
        <div className="max-w-5xl mx-auto">
          {/* Title block */}
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-accent text-xs tracking-[0.35em] uppercase mb-4 font-body">
                {t('home.about.eyebrow')}
              </p>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-primary mb-6 tracking-wide">
                {t('home.about.title')}
              </h2>
              <p className="text-secondary font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                {t('home.about.desc', { restaurantName })}
              </p>
            </div>
          </ScrollReveal>

          {/* Images grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-16">
            {restaurantImages.map((img, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div
                  onClick={() => setLightbox({ images: restaurantImages, index: idx })}
                  className="relative group overflow-hidden h-52 md:h-72 cursor-pointer"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* CTA Button */}
          <ScrollReveal>
            <div className="text-center">
              <CTAButton href={`${basePath}/gallery`}>{t('home.about.galleryCta')}</CTAButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section
        id="menu"
        className="py-16 md:py-24 px-4 relative"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.8) 100%), url("/rr-ice21.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
              {t('home.menu.title')}
            </h2>
            <p className="text-gray-400 text-center mb-12 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('home.menu.desc')}
            </p>
          </ScrollReveal>

          {/* Food images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-12">
            {carteImages.map((img, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div
                  onClick={() => setLightbox({ images: carteImages, index: idx })}
                  className="relative group overflow-hidden h-48 md:h-60 cursor-pointer"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-12">
              <CTAButton href={`${basePath}/menu`}>{t('home.menu.cta')}</CTAButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Reservation CTA Section - Split layout */}
      {!hideReservation && (
        <section id="reservation">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[550px]">
            {/* Left - Image */}
            <ScrollReveal>
              <div className="relative overflow-hidden h-56 md:h-[550px]">
                <img
                  src={`${import.meta.env.BASE_URL}rr-ice18.png`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </ScrollReveal>

            {/* Right - Content */}
            <div className="flex items-center justify-center px-8 md:px-16 py-16 md:py-24 bg-[#0d1b2a]">
              <div className="max-w-md text-center">
                <ScrollReveal delay={100}>
                  <p className="text-accent text-xs tracking-[0.35em] uppercase mb-4 font-body">
                    {t('home.reservation.eyebrow')}
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={200}>
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6 tracking-wide leading-tight">
                    {t('home.reservation.title')}
                  </h2>
                </ScrollReveal>
                <ScrollReveal delay={300}>
                  <p className="text-secondary font-body text-sm md:text-base leading-relaxed mb-10">
                    {t('home.reservation.desc')}
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={400}>
                  <CTAButton onClick={() => setIsReservationModalOpen(true)}>{t('home.reservation.cta')}</CTAButton>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video Ambiance Section — semi-transparent black overlay lets the beach loop
          show through. Was `bg-coffee-950/70` before the semantic-tokens refactor,
          got flipped to fully-opaque `bg-page` which hid the video entirely. */}
      <section className="relative h-[250px] md:h-[500px] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`${import.meta.env.BASE_URL}eau.mp4`} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </section>

      <MobileReserveCTA onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollTop')}
        className={`fixed bottom-8 right-5 z-40 w-11 h-11 rounded-full border border-subtle bg-page backdrop-blur-md hidden md:flex items-center justify-center text-secondary hover:text-primary hover:border-subtle hover:bg-page active:scale-90 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
    </div>
  );
}
