import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { useSiteImages } from '../contexts/SiteImagesContext';
import { useRestaurantBasePath } from '../hooks/useRestaurantBasePath';
import { CinematicNav } from '../components/cinematic/CinematicNav';
import { CinematicHero } from '../components/cinematic/CinematicHero';
import { CinematicScene } from '../components/cinematic/CinematicScene';
import { ScrollTopButton } from '../components/cinematic/ScrollTopButton';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { Link } from 'react-router-dom';

// Fallback imagery — used when tenant hasn't uploaded specific scene photos yet.
// Chosen from Unsplash's restaurant/food editorial collections.
// The admin's SiteImages (hero/restaurant/carte/gallery) are used first when available.
const FALLBACK = {
  hero:       'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=2400&q=80',
  experience: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=80',
  cuisine:    'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=2400&q=80',
  dish:       'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2400&q=80',
  space:      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=80',
  reserve:    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2400&q=80',
};

export default function CinematicHome() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const basePath = useRestaurantBasePath();
  const publicSettings = usePublicSettings();
  const siteImages = useSiteImages();
  const restaurantName = publicSettings?.restaurant_name ?? '';
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;

  // Pick tenant images when available, else fallback
  const heroPool       = siteImages?.hero?.map(i => i.image_url) ?? [];
  const restaurantPool = siteImages?.restaurant?.map(i => i.image_url) ?? [];
  const cartePool      = siteImages?.carte?.map(i => i.image_url) ?? [];
  const galleryPool    = siteImages?.gallery?.map(i => i.image_url) ?? [];

  const heroImg       = heroPool[0]       ?? FALLBACK.hero;
  const experienceImg = restaurantPool[0] ?? heroPool[1] ?? FALLBACK.experience;
  const cuisineImg    = cartePool[0]      ?? FALLBACK.cuisine;
  const dishImg       = cartePool[1]      ?? cartePool[0] ?? FALLBACK.dish;
  const spaceImg      = restaurantPool[1] ?? galleryPool[0] ?? FALLBACK.space;
  const reserveImg    = restaurantPool[2] ?? heroPool[2] ?? FALLBACK.reserve;

  const heroTagline = t('home.hero.tagline');

  return (
    <div className="bg-black text-white min-h-screen relative">
        <CinematicNav onReservationClick={() => setModalOpen(true)} hideReservation={hideReservation} />
        {!hideReservation && <ReservationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}

        <main>
          {/* ═══════════ HERO ═══════════ */}
          <CinematicHero
            image={heroImg}
            imageAlt={restaurantName}
            restaurantName={restaurantName}
            tagline={heroTagline}
          />

          {/* ═══════════ SCENE 1 — THE EXPERIENCE ═══════════ */}
          <CinematicScene
            image={experienceImg}
            eyebrow="01 — L'EXPÉRIENCE"
            title="Une histoire tissée entre le feu, le sel et le temps."
            body="Chez nous, chaque service est une composition. Une lumière, une matière, un geste — mis au service d'un moment que l'on veut inoubliable."
            alignment="left"
            imageAlt="Ambiance du restaurant"
          />

          {/* ═══════════ SCENE 2 — CUISINE ═══════════ */}
          <CinematicScene
            image={cuisineImg}
            eyebrow="02 — LA CUISINE"
            title="Le produit d'abord. Le reste suit."
            body="Poissons de la côte, viandes maturées, herbes cueillies. Notre carte évolue au rythme des saisons et des rencontres avec nos producteurs."
            alignment="left"
            imageAlt="Cuisine du restaurant"
          />

          {/* ═══════════ SCENE 3 — SIGNATURE DISH ═══════════ */}
          <CinematicScene
            image={dishImg}
            eyebrow="03 — SIGNATURE"
            title="Chaque assiette est une intention."
            body="Rien n'est laissé au hasard. La texture, la température, le tempo du dressage — tout participe à raconter la même histoire."
            alignment="right"
            imageAlt="Plat signature"
          />

          {/* ═══════════ SCENE 4 — THE SPACE ═══════════ */}
          <CinematicScene
            image={spaceImg}
            eyebrow="04 — LE LIEU"
            title="Un décor pensé pour effacer le temps."
            body="Bois brut, matières patinées, lumière basse — un écrin qui invite à ralentir. Terrasse ouverte sur l'extérieur, salle intime pour les soirs de confidence."
            alignment="left"
            imageAlt="Salle du restaurant"
          />

          {/* ═══════════ SCENE 5 — RESERVE ═══════════ */}
          <CinematicScene
            image={reserveImg}
            eyebrow="05 — RÉSERVATION"
            title="Rejoignez-nous à table."
            body="Nous vous accueillons du mardi au dimanche, midi et soir. La réservation est vivement recommandée."
            alignment="center"
            scrollLength={1.4}
            imageAlt="Réservation"
            cta={
              !hideReservation ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-4 text-white text-xs tracking-[0.3em] uppercase font-body border border-white/60 hover:bg-white/10 px-10 py-4 transition-colors"
                >
                  {t('home.reservation.cta')}
                  <span className="w-6 h-px bg-white" />
                </button>
              ) : (
                <Link
                  to={`${basePath}/menu`}
                  className="inline-flex items-center gap-4 text-white text-xs tracking-[0.3em] uppercase font-body border border-white/60 hover:bg-white/10 px-10 py-4 transition-colors"
                >
                  {t('home.menu.cta')}
                  <span className="w-6 h-px bg-white" />
                </Link>
              )
            }
          />
        </main>

      {/* Footer stays as-is — it already uses semantic theme tokens */}
      <Footer onReservationClick={() => setModalOpen(true)} hideReservation={hideReservation} />

      {/* Floating back-to-top button, appears once user has scrolled past the hero */}
      <ScrollTopButton />
    </div>
  );
}
