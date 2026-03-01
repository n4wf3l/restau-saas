import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CTAButton } from './CTAButton';
import { usePublicSettings } from '../../contexts/PublicSettingsContext';
import { Spinner } from '../ui/Spinner';
import type { OpeningHours } from '../../lib/types';

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

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.928-.278.175-.1.312-.058.398-.03.123.046.263.137.263.331 0 .382-.52.504-.862.604-.158.05-.331.094-.412.139-.142.075-.18.21-.174.36.002.06.019.12.04.18.26.635.72 1.2 1.292 1.608.165.118.374.21.568.285.097.037.267.097.267.267 0 .195-.28.353-.618.47a4.06 4.06 0 0 1-.573.17c-.13.028-.248.088-.262.238-.01.1.003.203.003.283 0 .125-.053.248-.175.31-.214.108-.51.16-.808.202-.181.027-.374.052-.524.105-.08.028-.152.09-.17.15-.104.329-.234.558-.37.745-.08.112-.166.204-.252.283a4.92 4.92 0 0 1-1.37.86c-.422.177-.88.267-1.41.267-.154 0-.3-.01-.455-.035a5.186 5.186 0 0 1-.693-.14c-.2-.058-.42-.122-.693-.17-.285-.052-.563-.035-.833-.035-.274 0-.54-.017-.83.035-.275.048-.494.112-.694.17a5.2 5.2 0 0 1-.693.14 3.036 3.036 0 0 1-.454.035c-.53 0-.99-.09-1.41-.267a4.92 4.92 0 0 1-1.37-.86 3.214 3.214 0 0 1-.253-.283 3.617 3.617 0 0 1-.37-.745c-.017-.06-.09-.122-.17-.15-.149-.053-.342-.078-.523-.105-.299-.042-.595-.094-.809-.202-.12-.062-.175-.185-.175-.31 0-.08.014-.183.003-.283-.014-.15-.132-.21-.261-.238a4.06 4.06 0 0 1-.574-.17c-.338-.117-.618-.275-.618-.47 0-.17.17-.23.267-.267.194-.075.403-.167.568-.285a4.143 4.143 0 0 0 1.292-1.608c.022-.06.038-.12.04-.18.006-.15-.032-.285-.174-.36-.081-.045-.254-.089-.412-.139-.342-.1-.862-.222-.862-.604 0-.194.14-.285.263-.331.086-.028.223-.07.398.03.269.158.628.262.928.278a.755.755 0 0 0 .401-.09 43.067 43.067 0 0 1-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.653 1.069 11.016.793 12.006.793h.2Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
  </svg>
);

const SOCIAL_ICON_MAP: Record<string, React.ReactNode> = {
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  tiktok: <TikTokIcon />,
  youtube: <YouTubeIcon />,
  snapchat: <SnapchatIcon />,
  linkedin: <LinkedInIcon />,
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
};

function formatTime(t: string): string {
  return t.replace(':', 'h');
}

/** Group consecutive days with same hours into ranges like "Lun - Jeu: 11h00 - 23h00" */
function formatHoursGroups(hours: OpeningHours): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < DAY_KEYS.length) {
    const key = DAY_KEYS[i];
    const dh = hours[key];
    if (!dh || dh.closed) {
      lines.push(`${DAY_SHORT[key]}: Fermé`);
      i++;
      continue;
    }
    // Find consecutive days with same hours
    let j = i + 1;
    while (j < DAY_KEYS.length) {
      const nk = DAY_KEYS[j];
      const ndh = hours[nk];
      if (!ndh || ndh.closed || ndh.open !== dh.open || ndh.close !== dh.close) break;
      j++;
    }
    const range = j - 1 > i
      ? `${DAY_SHORT[DAY_KEYS[i]]} - ${DAY_SHORT[DAY_KEYS[j - 1]]}`
      : DAY_SHORT[key];
    lines.push(`${range}: ${formatTime(dh.open)} - ${formatTime(dh.close)}`);
    i = j;
  }
  return lines;
}

interface FooterProps {
  onReservationClick: () => void;
  hideReservation?: boolean;
}

export function Footer({ onReservationClick, hideReservation }: FooterProps) {
  const publicSettings = usePublicSettings();
  const loadingHours = !publicSettings;
  const hoursLines = publicSettings?.opening_hours ? formatHoursGroups(publicSettings.opening_hours) : [];
  const hasClosures = (publicSettings?.closure_dates && publicSettings.closure_dates.length > 0) ?? false;
  const socialLinks = publicSettings?.social_links ?? null;

  const activeSocials = socialLinks
    ? Object.entries(socialLinks).filter(([, link]) => link.enabled && link.url)
    : [];

  return (
    <footer className="bg-coffee-950 pb-24 md:pb-10 px-4">
      <hr className="border-0 h-px bg-cream-400/30 mb-16 md:mb-24" />
      <ScrollReveal>
        <div className="max-w-2xl mx-auto text-center">
          {/* Address */}
          <p className="text-cream-400/80 font-body text-sm md:text-base mb-8">
            Ghandouri - Tanger, Maroc
          </p>

          {/* Hours */}
          {loadingHours ? (
            <div className="flex justify-center mb-12">
              <Spinner size="sm" className="text-cream-400/50" />
            </div>
          ) : hoursLines.length > 0 ? (
            <>
              <p className="text-cream-100 font-body font-semibold text-sm md:text-base mb-3">
                Horaire d'ouverture :
              </p>
              <div className="text-cream-400/70 font-body text-sm md:text-base space-y-1 mb-4">
                {hoursLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              {hasClosures && (
                <p className="text-cream-400/70 font-body text-sm md:text-base mb-12">
                  Fermetures exceptionnelles — consultez la page de réservation
                </p>
              )}
              {!hasClosures && <div className="mb-12" />}
            </>
          ) : (
            <div className="mb-12" />
          )}

          {/* CTA */}
          {!hideReservation && (
            <div className="mb-12">
              <CTAButton onClick={onReservationClick}>Réserver une table</CTAButton>
            </div>
          )}
          {hideReservation && <div className="mb-12" />}

          {/* Social Icons */}
          {activeSocials.length > 0 && (
            <div className="flex justify-center gap-4 mb-16">
              {activeSocials.map(([key, link]) => (
                <a
                  key={key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-cream-400/40 flex items-center justify-center text-cream-400/70 hover:bg-cream-400/10 active:bg-cream-400/20 hover:text-cream-300 transition-all duration-300"
                  title={SOCIAL_LABELS[key] || key}
                >
                  {SOCIAL_ICON_MAP[key]}
                </a>
              ))}
            </div>
          )}
          {activeSocials.length === 0 && <div className="mb-16" />}

          {/* Legal + Admin links */}
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

          {/* Separator */}
          <div className="w-16 h-px bg-cream-400/15 mx-auto mb-8" />

          {/* Bottom credit — NA Innovations promo */}
          <div className="text-center">
            <p className="text-cream-400/40 font-body text-xs tracking-wide mb-1">
              Plateforme sur mesure par
            </p>
            <p className="text-cream-400/60 font-body text-sm font-semibold tracking-wide">
              NA Innovations
            </p>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
