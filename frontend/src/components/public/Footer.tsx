import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CTAButton } from './CTAButton';

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

interface FooterProps {
  onReservationClick: () => void;
}

export function Footer({ onReservationClick }: FooterProps) {
  return (
    <footer className="bg-coffee-950 pt-16 md:pt-24 pb-24 md:pb-10 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Address */}
        <ScrollReveal>
          <p className="text-cream-400/80 font-body text-sm md:text-base mb-8">
            Ghandouri - Tanger, Maroc
          </p>
        </ScrollReveal>

        {/* Hours */}
        <ScrollReveal delay={100}>
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
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={200}>
          <div className="mb-12">
            <CTAButton onClick={onReservationClick}>Réserver une table</CTAButton>
          </div>
        </ScrollReveal>

        {/* Social Icons */}
        <ScrollReveal delay={300}>
          <div className="flex justify-center gap-4 mb-16">
            {[
              { label: 'Facebook', icon: <FacebookIcon />, href: '#' },
              { label: 'Instagram', icon: <InstagramIcon />, href: '#' },
              { label: 'TikTok', icon: <TikTokIcon />, href: '#' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-12 h-12 rounded-full border border-cream-400/40 flex items-center justify-center text-cream-400/70 hover:bg-cream-400/10 active:bg-cream-400/20 hover:text-cream-300 transition-all duration-300"
                title={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </ScrollReveal>

        {/* Legal + Admin links */}
        <ScrollReveal delay={400}>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            <Link to="/privacy" className="text-cream-400/35 hover:text-cream-400/60 font-body text-xs tracking-wide transition-colors">
              Confidentialité
            </Link>
            <Link to="/terms" className="text-cream-400/35 hover:text-cream-400/60 font-body text-xs tracking-wide transition-colors">
              Conditions générales
            </Link>
            <Link to="/login" className="text-cream-400/35 hover:text-cream-400/60 font-body text-xs tracking-wide transition-colors">
              Espace admin
            </Link>
          </div>
        </ScrollReveal>

        {/* Separator */}
        <ScrollReveal delay={450}>
          <div className="w-16 h-px bg-cream-400/15 mx-auto mb-8" />
        </ScrollReveal>

        {/* Bottom credit — NA Innovations promo */}
        <ScrollReveal delay={500}>
          <div className="text-center">
            <p className="text-cream-400/40 font-body text-xs tracking-wide mb-1">
              Plateforme sur mesure par
            </p>
            <p className="text-cream-400/60 font-body text-sm font-semibold tracking-wide">
              NA Innovations
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
