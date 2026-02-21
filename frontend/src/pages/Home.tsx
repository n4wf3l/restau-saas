import { useEffect, useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { ReservationModal } from '../components/public/ReservationModal';
import { CTAButton } from '../components/public/CTAButton';

const heroImages = ['/rr-ice2.png', '/rr-ice3.png', '/rr-ice4.png'];

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.042-.379 3.408 3.408 0 0 1-1.265-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.639 1 9.014 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.639 22.988 9.014 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.361 23 14.986 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.361 1.012 14.986 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.18Z" />
  </svg>
);

export function Home() {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-slider pour les images de fond
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

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
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="RR Ice Logo" 
              className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-cream-200 tracking-wider">
            RR ICE
          </h1>
          <p className="text-lg md:text-xl text-cream-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez une expérience culinaire exceptionnelle dans une ambiance élégante et intime
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
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
      <section id="gallery" className="py-28 px-4 bg-coffee-950">
        <div className="max-w-5xl mx-auto">
          {/* Title block - Le Boma style */}
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
              <div
                key={idx}
                className="relative group overflow-hidden h-72"
              >
                <img
                  src={image}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <CTAButton href="/gallery">Voir la galerie</CTAButton>
          </div>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section 
        id="menu" 
        className="py-24 px-4 relative"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.8) 100%), url("/rr-ice21.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            Notre Carte
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg max-w-2xl mx-auto leading-relaxed">
            Une restauration 100% halal basée essentiellement sur le travail de la
            viande de qualité et la viande maturée. Découvrez nos plats signatures.
          </p>

          {/* Food images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-12">
            {['/rr-ice14.png', '/rr-ice15.png', '/rr-ice16.png', '/rr-ice17.png', '/rr-ice19.png', '/rr-ice20.png'].map((image, idx) => (
              <div key={idx} className="relative group overflow-hidden h-60">
                <img
                  src={image}
                  alt={`Plat ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <CTAButton href="/menu">Voir le menu complet</CTAButton>
          </div>
        </div>
      </section>

      {/* Reservation CTA Section - Split layout */}
      <section id="reservation">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[550px]">
          {/* Left - Image */}
          <div className="relative overflow-hidden h-80 md:h-auto">
            <img
              src="/rr-ice18.png"
              alt="Ambiance du restaurant"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right - Content */}
          <div className="flex items-center justify-center px-8 md:px-16 py-16 md:py-24 bg-[#0d1b2a]">
            <div className="max-w-md text-center">
              <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
                Réservation
              </p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-cream-100 mb-6 tracking-wide leading-tight">
                Réservez Votre Table
              </h2>
              <p className="text-cream-400/70 font-body text-sm md:text-base leading-relaxed mb-10">
                Choisissez la table exacte qui vous convient grâce à notre plan de
                salle interactif. Sélectionnez votre créneau, votre emplacement
                préféré et vivez une expérience sur mesure dès votre arrivée.
              </p>
              <CTAButton onClick={() => setIsReservationModalOpen(true)}>Réserver maintenant</CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* Video Ambiance Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/eau.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-coffee-950/70" />
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-coffee-950 pt-24 pb-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Address */}
          <p className="text-cream-400/80 font-body text-sm md:text-base mb-8">
            Ghandouri - Tanger, Maroc
          </p>

          {/* Hours */}
          <p className="text-cream-100 font-body font-semibold text-sm md:text-base mb-3">
            Horaire d'ouverture :
          </p>
          <div className="text-cream-400/70 font-body text-sm md:text-base space-y-1 mb-4">
            <p>Lun - Jeu: 11h00 - 23h00</p>
            <p>Ven - Sam: 11h00 - 00h00</p>
            <p>Dimanche: 12h00 - 22h00</p>
          </div>
          <p className="text-cream-400/70 font-body text-sm md:text-base mb-12">
            Fermé les jours fériés
          </p>

          {/* CTA */}
          <div className="mb-12">
            <CTAButton onClick={() => setIsReservationModalOpen(true)}>Réserver une table</CTAButton>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4 mb-16">
            {[
              { label: 'Facebook', icon: <FacebookIcon />, href: '#' },
              { label: 'Instagram', icon: <InstagramIcon />, href: '#' },
              { label: 'TikTok', icon: <TikTokIcon />, href: '#' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-11 h-11 rounded-full border border-cream-400/40 flex items-center justify-center text-cream-400/70 hover:bg-cream-400/10 hover:text-cream-300 transition-all duration-300"
                title={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>

          {/* Bottom credit */}
          <p className="text-cream-400/40 font-body text-xs tracking-wide">
            Made with passion & love by <span className="text-cream-400/60 font-semibold">NA Innovations</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
