import { useEffect, useState, useRef } from 'react';
import { Navbar } from '../components/public/Navbar';
import { ReservationModal } from '../components/public/ReservationModal';
import { Footer } from '../components/public/Footer';
import { CTAButton } from '../components/public/CTAButton';
import { usePublicSettings } from '../contexts/PublicSettingsContext';

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

const heroImages = ['/rr-ice2.png', '/rr-ice3.png', '/rr-ice4.png'];


export default function Home() {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const publicSettings = usePublicSettings();
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
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      {!hideReservation && <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />}

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Background Slider */}
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%), url("${image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8 opacity-0 animate-hero-scale" style={{ animationDelay: '200ms' }}>
            <img
              src="/logo.png"
              alt="RR Ice Logo"
              className="w-32 h-32 md:w-52 md:h-52 object-contain drop-shadow-2xl"
            />
          </div>

          <h1 className="text-3xl md:text-6xl font-display font-bold mb-4 md:mb-6 text-cream-200 tracking-wider opacity-0 animate-hero-fade-up" style={{ animationDelay: '500ms' }}>
            RR ICE
          </h1>
          <p className="text-base md:text-xl text-cream-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 opacity-0 animate-hero-fade-up" style={{ animationDelay: '700ms' }}>
            Découvrez une expérience culinaire exceptionnelle dans une ambiance élégante et intime
          </p>
          <div className="flex justify-center opacity-0 animate-hero-fade-up" style={{ animationDelay: '900ms' }}>
            <CTAButton href="/menu">Découvrir la carte</CTAButton>
          </div>
        </div>
      </section>

      {/* Stats Section - Hidden */}
      <section className="hidden bg-gradient-to-b from-gray-900 to-black py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">20+</div>
            <p className="text-cream-400 text-lg">Ans de Tradition</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">⭐ 4.9</div>
            <p className="text-cream-400 text-lg">Notes Clients</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">150+</div>
            <p className="text-cream-400 text-lg">Plats Différents</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 md:py-28 px-4 bg-coffee-950">
        <div className="max-w-5xl mx-auto">
          {/* Title block */}
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
                À Propos
              </p>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-cream-100 mb-6 tracking-wide">
                Notre Restaurant
              </h2>
              <p className="text-cream-400/70 font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Situé au cœur de Ghandouri à Tanger, RR Ice vous accueille dans un cadre
                élégant avec une terrasse panoramique offrant une vue imprenable sur la
                corniche, du port jusqu'au cap Mnar, avec l'Espagne en toile de fond
                depuis notre 2e étage.
              </p>
            </div>
          </ScrollReveal>

          {/* Images grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-16">
            {[
              '/rr-ice11.png',
              '/rr-ice13.png',
              '/rr-ice7.png',
              '/rr-ice8.png',
              '/rr-ice9.png',
              '/rr-ice10.png',
            ].map((image, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="relative group overflow-hidden h-52 md:h-72">
                  <img
                    src={image}
                    alt={`Gallery ${idx + 1}`}
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
              <CTAButton href="/gallery">Voir la galerie</CTAButton>
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
              Notre Carte
            </h2>
            <p className="text-gray-400 text-center mb-12 text-lg max-w-2xl mx-auto leading-relaxed">
              Une restauration 100% halal basée essentiellement sur le travail de la
              viande de qualité et la viande maturée. Découvrez nos plats signatures.
            </p>
          </ScrollReveal>

          {/* Food images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-12">
            {['/rr-ice14.png', '/rr-ice15.png', '/rr-ice16.png', '/rr-ice17.png', '/rr-ice19.png', '/rr-ice20.png'].map((image, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="relative group overflow-hidden h-48 md:h-60">
                  <img
                    src={image}
                    alt={`Plat ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-12">
              <CTAButton href="/menu">Voir le menu complet</CTAButton>
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
                  src="/rr-ice18.png"
                  alt="Ambiance du restaurant"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </ScrollReveal>

            {/* Right - Content */}
            <div className="flex items-center justify-center px-8 md:px-16 py-16 md:py-24 bg-[#0d1b2a]">
              <div className="max-w-md text-center">
                <ScrollReveal delay={100}>
                  <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
                    Réservation
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={200}>
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-cream-100 mb-6 tracking-wide leading-tight">
                    Réservez Votre Table
                  </h2>
                </ScrollReveal>
                <ScrollReveal delay={300}>
                  <p className="text-cream-400/70 font-body text-sm md:text-base leading-relaxed mb-10">
                    Choisissez la table exacte qui vous convient grâce à notre plan de
                    salle interactif. Sélectionnez votre créneau, votre emplacement
                    préféré et vivez une expérience sur mesure dès votre arrivée.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={400}>
                  <CTAButton onClick={() => setIsReservationModalOpen(true)}>Réserver maintenant</CTAButton>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video Ambiance Section */}
      <section className="relative h-[250px] md:h-[500px] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/eau.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-coffee-950/70" />
      </section>

      {/* Sticky Mobile CTA — always accessible */}
      {!hideReservation && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-black via-black/95 to-transparent">
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="w-full py-4 bg-cream-500 text-coffee-950 font-body font-bold text-sm tracking-[0.15em] uppercase active:bg-cream-600 transition-colors"
          >
            Réserver une table
          </button>
        </div>
      )}

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Retour en haut"
        className={`fixed bottom-20 md:bottom-8 right-5 z-40 w-11 h-11 rounded-full border border-cream-400/30 bg-coffee-950/80 backdrop-blur-md flex items-center justify-center text-cream-400/70 hover:text-cream-200 hover:border-cream-400/60 hover:bg-coffee-950 active:scale-90 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
    </div>
  );
}
