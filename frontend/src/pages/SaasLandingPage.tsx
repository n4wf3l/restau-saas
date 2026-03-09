import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ─── Scroll Reveal ───
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Icons (Heroicons outline) ───
const icons = {
  globe: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.729-3.558" /></svg>,
  book: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
  calendar: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
  grid: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>,
  mail: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>,
  code: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
  photo: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>,
  x: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>,
  sun: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>,
  moon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>,
  sparkles: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>,
};

// ─── Pricing plans ───
const plans = [
  {
    name: 'Starter',
    price: '0',
    period: '/mois',
    desc: 'Pour tester la plateforme',
    cta: 'Commencer gratuitement',
    popular: false,
    features: [
      { text: 'Site web personnalisé', ok: true },
      { text: 'Menu digital (jusqu\'a 20 plats)', ok: true },
      { text: 'Galerie photos (5 images)', ok: true },
      { text: 'Sous-domaine inclus', ok: true },
      { text: 'Réservations en ligne', ok: false },
      { text: 'Emails automatiques', ok: false },
      { text: 'Domaine personnalisé', ok: false },
      { text: 'Support prioritaire', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '29',
    period: '/mois',
    desc: 'Tout ce qu\'il faut pour votre restaurant',
    cta: 'Essai gratuit 14 jours',
    popular: true,
    features: [
      { text: 'Site web personnalisé', ok: true },
      { text: 'Menu digital illimité', ok: true },
      { text: 'Galerie photos illimitée', ok: true },
      { text: 'Sous-domaine inclus', ok: true },
      { text: 'Réservations en ligne', ok: true },
      { text: 'Emails automatiques', ok: true },
      { text: 'Domaine personnalisé', ok: true },
      { text: 'Support prioritaire', ok: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '79',
    period: '/mois',
    desc: 'Pour les groupes de restaurants',
    cta: 'Nous contacter',
    popular: false,
    features: [
      { text: 'Tout du plan Pro', ok: true },
      { text: 'Multi-établissements', ok: true },
      { text: 'Galerie photos illimitée', ok: true },
      { text: 'API & Widget intégrable', ok: true },
      { text: 'Réservations avancées', ok: true },
      { text: 'Analytics détaillés', ok: true },
      { text: 'Domaine personnalisé', ok: true },
      { text: 'Support prioritaire 24/7', ok: true },
    ],
  },
];

// ─── FAQ ───
const faqs = [
  { q: 'Est-ce que je peux essayer gratuitement ?', a: 'Oui. Le plan Starter est 100% gratuit, sans carte bancaire. Le plan Pro offre un essai de 14 jours sans engagement.' },
  { q: 'J\'ai déjà un site web, je peux quand même utiliser la plateforme ?', a: 'Absolument. Vous pouvez intégrer notre widget de réservation et notre menu digital directement sur votre site existant avec un simple code embed. Pas besoin de migrer.' },
  { q: 'Comment fonctionne le système de réservation ?', a: 'Vos clients voient votre plan de salle interactif en temps réel, choisissent une table et un créneau, et reçoivent une confirmation par email. Vous gérez tout depuis votre dashboard.' },
  { q: 'Puis-je utiliser mon propre nom de domaine ?', a: 'Oui, avec le plan Pro. Vous configurez un simple CNAME DNS et nous gérons le certificat SSL automatiquement.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Chaque restaurant est complètement isolé. Vos données, images et paramètres ne sont jamais accessibles par un autre compte. Chiffrement SSL sur toutes les connexions.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans frais ni engagement. Vos données restent accessibles pendant 30 jours après annulation.' },
];

export default function SaasLandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark' || theme === 'design';
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className={`min-h-screen font-body transition-colors duration-700 ease-in-out ${isDark ? 'bg-coffee-950 text-cream-100' : 'bg-white text-coffee-800'}`}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ease-in-out ${
        scrolled
          ? isDark ? 'bg-coffee-950/95 backdrop-blur-md border-b border-cream-400/10' : 'bg-white/95 backdrop-blur-md border-b border-coffee-100 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <span className={`text-lg font-display font-bold tracking-wider ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
            NA Innovations
          </span>
          <div className="hidden md:flex items-center gap-8">
            {['Fonctionnalités', 'Tarifs', 'Exemples', 'FAQ'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                className={`text-sm tracking-wide transition-colors ${isDark ? 'text-cream-400/70 hover:text-cream-200' : 'text-coffee-500 hover:text-coffee-800'}`}
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'text-cream-400/60 hover:text-cream-200 hover:bg-cream-400/10' : 'text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50'
              }`}
              aria-label="Changer de thème"
            >
              {isDark ? icons.sun : icons.moon}
            </button>
            <Link
              to="/login"
              className={`hidden sm:inline text-sm tracking-wide transition-colors ${isDark ? 'text-cream-400/70 hover:text-cream-200' : 'text-coffee-500 hover:text-coffee-800'}`}
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className={`text-sm px-5 py-2 font-semibold tracking-[0.1em] uppercase transition-all ${
                isDark
                  ? 'border border-cream-400/50 text-cream-300 hover:bg-cream-400/10'
                  : 'bg-coffee-800 text-white hover:bg-coffee-700'
              }`}
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-coffee-900/50 to-transparent' : 'bg-gradient-to-b from-coffee-50/60 to-transparent'}`} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-wide mb-8 ${
              isDark ? 'bg-cream-400/10 text-cream-400' : 'bg-coffee-100 text-coffee-600'
            }`}>
              {icons.sparkles}
              <span>Plateforme tout-en-un pour restaurants</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-wide leading-[1.1] ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
              Votre restaurant{' '}
              <span className={isDark ? 'text-cream-400' : 'text-coffee-500'}>en ligne</span>,{' '}
              <br className="hidden md:block" />
              en quelques clics
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 ${isDark ? 'text-cream-400/70' : 'text-coffee-500'}`}>
              Site web, menu digital, réservations en temps réel, gestion complète.
              Tout ce dont vous avez besoin pour moderniser votre restaurant, <strong>sans aucune compétence technique</strong>.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className={`px-10 py-4 font-bold text-sm tracking-[0.15em] uppercase transition-colors ${
                  isDark ? 'bg-cream-400 text-coffee-950 hover:bg-cream-300' : 'bg-coffee-800 text-white hover:bg-coffee-700'
                }`}
              >
                Créer mon restaurant
              </Link>
              <a
                href="#exemples"
                className={`px-10 py-4 border text-sm tracking-[0.15em] uppercase transition-all ${
                  isDark ? 'border-cream-400/40 text-cream-400 hover:bg-cream-400/10' : 'border-coffee-300 text-coffee-600 hover:bg-coffee-50'
                }`}
              >
                Voir un exemple
              </a>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <p className={`mt-6 text-xs ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>
              Gratuit pour commencer. Aucune carte bancaire requise.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ SOCIAL PROOF ══════════════ */}
      <section className={`py-12 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '150+', label: 'Restaurants actifs' },
              { value: '50K+', label: 'Réservations/mois' },
              { value: '99.9%', label: 'Disponibilité' },
              { value: '4.9/5', label: 'Satisfaction client' },
            ].map(stat => (
              <div key={stat.label}>
                <div className={`text-2xl md:text-3xl font-display font-bold mb-1 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>{stat.value}</div>
                <div className={`text-xs tracking-wide ${isDark ? 'text-cream-400/50' : 'text-coffee-400'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="fonctionnalites" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Fonctionnalités
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Tout pour votre restaurant
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: icons.globe, title: 'Site web personnalisé', desc: 'Un site élégant à votre image avec hero slider, galerie, horaires, liens sociaux et page de contact. Prêt en 5 minutes.' },
              { icon: icons.book, title: 'Menu digital interactif', desc: 'Carte complète avec catégories, photos, prix et badges (halal, végétarien). Upload PDF ou gestion plat par plat.' },
              { icon: icons.calendar, title: 'Réservation en temps réel', desc: 'Plan de salle interactif, créneaux automatiques, gestion des capacités. Vos clients voient les tables disponibles en direct.' },
              { icon: icons.grid, title: 'Dashboard tout-en-un', desc: 'Gérez réservations, menu, images, horaires et paramètres depuis une seule interface. Mode sombre inclus.' },
              { icon: icons.mail, title: 'Emails automatiques', desc: 'Confirmation de réservation, demandes en attente, annulations — tout est envoyé automatiquement à vos clients.' },
              { icon: icons.photo, title: 'Galerie & médias', desc: 'Organisez vos photos par catégories (restaurant, carte, héro). Drag & drop, redimensionnement, tri personnalisé.' },
              { icon: icons.code, title: 'Widget intégrable', desc: 'Vous avez déjà un site ? Intégrez notre widget de réservation ou menu en un copier-coller. Compatible tout CMS.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className={`p-8 h-full border transition-all duration-300 group ${
                  isDark
                    ? 'border-cream-400/10 bg-coffee-900/30 hover:border-cream-400/25 hover:bg-coffee-900/50'
                    : 'border-coffee-100 bg-white hover:border-coffee-200 hover:shadow-lg'
                }`}>
                  <div className={`mb-4 transition-colors ${isDark ? 'text-cream-400 group-hover:text-cream-300' : 'text-coffee-500 group-hover:text-coffee-700'}`}>{f.icon}</div>
                  <h3 className={`text-lg font-display font-bold mb-2 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SHOWCASE: SITE WEB ══════════════ */}
      <section id="exemples" className={`py-20 md:py-28 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Exemples concrets
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide mb-4 ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Ce que vos clients verront
              </h2>
              <p className={`max-w-2xl mx-auto ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                Chaque restaurant obtient son propre site accessible via <code className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-cream-400/10' : 'bg-coffee-100'}`}>votreplateforme.com/r/votre-restaurant</code>
              </p>
            </div>
          </Reveal>

          {/* Example: Homepage */}
          <Reveal>
            <div className={`grid md:grid-cols-2 gap-12 items-center mb-20 ${isDark ? '' : ''}`}>
              <div>
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Site web</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Page d'accueil du restaurant
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Hero avec slider d'images, présentation du restaurant, aperçu de la carte avec photos,
                  section réservation avec CTA, vidéo d'ambiance, horaires d'ouverture et liens sociaux.
                  Tout est personnalisable depuis le dashboard.
                </p>
                <ul className="space-y-2">
                  {['Slider hero avec vos photos', 'Galerie restaurant', 'Aperçu du menu avec images', 'Section réservation intégrée', 'Horaires & réseaux sociaux'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={isDark ? 'text-green-400' : 'text-green-600'}>{icons.check}</span>
                      <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-lg overflow-hidden border transition-all duration-700 ease-in-out ${isDark ? 'border-cream-400/10 bg-coffee-900/50' : 'border-coffee-200 bg-white shadow-xl'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-cream-400/10 bg-coffee-900/80' : 'border-coffee-100 bg-coffee-50'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className={`flex-1 text-center text-xs ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>votreplateforme.com/r/mon-restaurant</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className={`h-40 rounded flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-coffee-800 to-coffee-900' : 'bg-gradient-to-br from-coffee-100 to-coffee-200'}`}>
                    <span className={`text-3xl font-display font-bold ${isDark ? 'text-cream-300' : 'text-coffee-600'}`}>Mon Restaurant</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-20 rounded ${isDark ? 'bg-coffee-800' : 'bg-coffee-100'}`} />
                    ))}
                  </div>
                  <div className={`h-10 rounded flex items-center justify-center text-xs font-semibold tracking-wider uppercase ${isDark ? 'border border-cream-400/30 text-cream-400' : 'bg-coffee-800 text-white'}`}>
                    Réserver une table
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Example: Menu */}
          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className={`order-2 md:order-1 rounded-lg overflow-hidden border transition-all duration-700 ease-in-out ${isDark ? 'border-cream-400/10 bg-coffee-900/50' : 'border-coffee-200 bg-white shadow-xl'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-cream-400/10 bg-coffee-900/80' : 'border-coffee-100 bg-coffee-50'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className={`flex-1 text-center text-xs ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>votreplateforme.com/r/mon-restaurant/menu</div>
                </div>
                <div className="p-6 space-y-3">
                  {['Entrées', 'Plats', 'Desserts'].map((cat, ci) => (
                    <div key={cat}>
                      <div className={`text-xs font-semibold tracking-wider uppercase mb-2 ${isDark ? 'text-cream-400' : 'text-coffee-500'}`}>{cat}</div>
                      {[1, 2].map(i => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded mb-1.5 ${isDark ? 'bg-coffee-800/50' : 'bg-coffee-50'}`}>
                          <div className={`w-12 h-12 rounded shrink-0 ${isDark ? 'bg-coffee-700' : 'bg-coffee-200'}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`h-3 w-24 rounded ${isDark ? 'bg-cream-400/20' : 'bg-coffee-200'}`} />
                            <div className={`h-2 w-32 rounded mt-1.5 ${isDark ? 'bg-cream-400/10' : 'bg-coffee-100'}`} />
                          </div>
                          <div className={`text-sm font-bold ${isDark ? 'text-cream-300' : 'text-coffee-700'}`}>{(ci + 1) * 8 + i * 4}€</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Menu digital</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Votre carte, sublimée
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Présentez vos plats avec photos, ingrédients, prix et badges.
                  Classés par catégorie, filtrables, et mis à jour en temps réel depuis votre dashboard.
                  Vous pouvez aussi uploader votre menu PDF existant.
                </p>
                <ul className="space-y-2">
                  {['Photos haute qualité par plat', 'Catégories personnalisables', 'Badges halal, végétarien, etc.', 'Upload menu PDF', 'Drag & drop pour réordonner'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={isDark ? 'text-green-400' : 'text-green-600'}>{icons.check}</span>
                      <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Example: Reservation */}
          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Réservation</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Réservation interactive
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Vos clients voient votre plan de salle en direct, choisissent leur table préférée,
                  sélectionnent un créneau et reçoivent une confirmation par email.
                  Vous validez ou refusez depuis le dashboard.
                </p>
                <ul className="space-y-2">
                  {['Plan de salle interactif', 'Disponibilité en temps réel', 'Optimisation automatique des tables', 'Confirmations par email', 'Gestion no-show'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={isDark ? 'text-green-400' : 'text-green-600'}>{icons.check}</span>
                      <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-lg overflow-hidden border transition-all duration-700 ease-in-out ${isDark ? 'border-cream-400/10 bg-coffee-900/50' : 'border-coffee-200 bg-white shadow-xl'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-cream-400/10 bg-coffee-900/80' : 'border-coffee-100 bg-coffee-50'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className={`flex-1 text-center text-xs ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>Réservation en ligne</div>
                </div>
                <div className="p-6">
                  {/* Mini floor plan mockup */}
                  <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-coffee-800/50' : 'bg-coffee-50'}`}>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { seats: 2, status: 'free' }, { seats: 4, status: 'free' },
                        { seats: 4, status: 'taken' }, { seats: 6, status: 'free' },
                        { seats: 2, status: 'taken' }, { seats: 4, status: 'selected' },
                        { seats: 2, status: 'free' }, { seats: 4, status: 'taken' },
                      ].map((t, i) => (
                        <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          t.status === 'selected'
                            ? isDark ? 'border-green-400 bg-green-400/20 text-green-300' : 'border-green-500 bg-green-50 text-green-700'
                            : t.status === 'taken'
                            ? isDark ? 'border-cream-400/10 bg-cream-400/5 text-cream-400/30' : 'border-coffee-200 bg-coffee-100 text-coffee-300'
                            : isDark ? 'border-cream-400/20 bg-coffee-800 text-cream-400/60' : 'border-coffee-200 bg-white text-coffee-500'
                        }`}>
                          {t.seats}p
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs mb-3">
                    <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded border-2 ${isDark ? 'border-cream-400/20 bg-coffee-800' : 'border-coffee-200 bg-white'}`} /> Libre</span>
                    <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded border-2 ${isDark ? 'border-green-400 bg-green-400/20' : 'border-green-500 bg-green-50'}`} /> Sélectionnée</span>
                    <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded border-2 ${isDark ? 'border-cream-400/10 bg-cream-400/5' : 'border-coffee-200 bg-coffee-100'}`} /> Occupée</span>
                  </div>
                  <div className={`h-10 rounded flex items-center justify-center text-xs font-semibold tracking-wider uppercase ${
                    isDark ? 'bg-green-500/20 border border-green-400/30 text-green-300' : 'bg-green-600 text-white'
                  }`}>
                    Confirmer la réservation
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ INTEGRATION / WIDGET ══════════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className={`rounded-xl p-8 md:p-14 border ${isDark ? 'border-cream-400/10 bg-coffee-900/30' : 'border-coffee-100 bg-coffee-50'}`}>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-wide mb-4 ${isDark ? 'bg-blue-400/10 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {icons.code}
                    <span>Intégration</span>
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                    Vous avez déjà un site web ?
                  </h3>
                  <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                    Pas besoin de migrer. Intégrez notre widget de réservation ou menu digital
                    directement sur votre site existant avec un simple code embed.
                    Compatible WordPress, Wix, Squarespace, et tout site HTML.
                  </p>
                  <ul className="space-y-2">
                    {['Widget de réservation intégrable', 'Menu digital en iframe', 'Personnalisation CSS', 'API REST documentée'].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{icons.check}</span>
                        <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-cream-400/10 bg-coffee-950' : 'border-coffee-200 bg-white'}`}>
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-cream-400/10' : 'border-coffee-100'}`}>
                    <span className={`text-xs font-mono ${isDark ? 'text-cream-400/50' : 'text-coffee-400'}`}>votre-site.html</span>
                  </div>
                  <pre className={`p-4 text-xs leading-relaxed overflow-x-auto ${isDark ? 'text-cream-400/70' : 'text-coffee-600'}`}>
{`<!-- Widget de réservation -->
<div
  id="na-reservation-widget"
  data-restaurant="votre-slug"
  data-theme="auto"
></div>
<script src="https://votre
plateforme.com/widget.js">
</script>`}
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="tarifs" className={`py-20 md:py-28 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Tarifs
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide mb-4 ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Simple, transparent, sans surprise
              </h2>
              <p className={`max-w-xl mx-auto ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                Pas de frais cachés, pas de commission sur les réservations. Annulable à tout moment.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`relative p-8 h-full flex flex-col border transition-all ${
                  plan.popular
                    ? isDark
                      ? 'border-cream-400/30 bg-coffee-900/60 ring-1 ring-cream-400/20'
                      : 'border-coffee-300 bg-white ring-2 ring-coffee-200 shadow-xl'
                    : isDark
                      ? 'border-cream-400/10 bg-coffee-900/30'
                      : 'border-coffee-100 bg-white'
                }`}>
                  {plan.popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold tracking-wider uppercase ${
                      isDark ? 'bg-cream-400 text-coffee-950' : 'bg-coffee-800 text-white'
                    }`}>
                      Populaire
                    </div>
                  )}
                  <div className={`text-xs tracking-wider uppercase font-semibold mb-4 ${isDark ? 'text-cream-400' : 'text-coffee-500'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl md:text-5xl font-display font-bold ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>{plan.price}€</span>
                    <span className={`text-sm ${isDark ? 'text-cream-400/50' : 'text-coffee-400'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm mb-6 ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>{plan.desc}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f.text} className="flex items-center gap-2">
                        <span className={f.ok ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-cream-400/20' : 'text-coffee-300')}>
                          {f.ok ? icons.check : icons.x}
                        </span>
                        <span className={`text-sm ${f.ok ? (isDark ? 'text-cream-400/80' : 'text-coffee-600') : (isDark ? 'text-cream-400/30' : 'text-coffee-300')}`}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`block text-center py-3 text-sm font-semibold tracking-[0.1em] uppercase transition-all ${
                      plan.popular
                        ? isDark ? 'bg-cream-400 text-coffee-950 hover:bg-cream-300' : 'bg-coffee-800 text-white hover:bg-coffee-700'
                        : isDark ? 'border border-cream-400/30 text-cream-400 hover:bg-cream-400/10' : 'border border-coffee-300 text-coffee-600 hover:bg-coffee-50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                FAQ
              </p>
              <h2 className={`text-3xl md:text-4xl font-display font-bold tracking-wide ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Questions fréquentes
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`border transition-all ${isDark ? 'border-cream-400/10' : 'border-coffee-100'}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                      isDark ? 'hover:bg-cream-400/5' : 'hover:bg-coffee-50'
                    }`}
                  >
                    <span className={`text-sm font-semibold pr-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>{faq.q}</span>
                    <svg className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''} ${isDark ? 'text-cream-400/50' : 'text-coffee-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className={`px-5 pb-5 text-sm leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className={`py-20 md:py-28 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className={`text-3xl md:text-5xl font-display font-bold mb-4 tracking-wide leading-tight ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
              Prêt à digitaliser votre restaurant ?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className={`text-base mb-10 max-w-xl mx-auto ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
              Créez votre compte gratuitement et configurez votre restaurant en moins de 5 minutes.
              Aucune carte bancaire requise.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className={`px-12 py-4 font-bold text-sm tracking-[0.15em] uppercase transition-colors ${
                  isDark ? 'bg-cream-400 text-coffee-950 hover:bg-cream-300' : 'bg-coffee-800 text-white hover:bg-coffee-700'
                }`}
              >
                Commencer gratuitement
              </Link>
              <Link
                to="/login"
                className={`px-12 py-4 border text-sm tracking-[0.15em] uppercase transition-all ${
                  isDark ? 'border-cream-400/40 text-cream-400 hover:bg-cream-400/10' : 'border-coffee-300 text-coffee-600 hover:bg-coffee-50'
                }`}
              >
                J'ai déjà un compte
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className={`border-t py-10 px-6 transition-colors duration-700 ease-in-out ${isDark ? 'border-cream-400/10' : 'border-coffee-100'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className={`text-lg font-display font-bold tracking-wider ${isDark ? 'text-cream-300' : 'text-coffee-700'}`}>NA Innovations</span>
            <span className={`text-xs ${isDark ? 'text-cream-400/30' : 'text-coffee-400'}`}>&copy; {new Date().getFullYear()} Tous droits réservés.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className={`text-xs tracking-wide transition-colors ${isDark ? 'text-cream-400/40 hover:text-cream-400/70' : 'text-coffee-400 hover:text-coffee-600'}`}>
              Connexion
            </Link>
            <a href="#tarifs" className={`text-xs tracking-wide transition-colors ${isDark ? 'text-cream-400/40 hover:text-cream-400/70' : 'text-coffee-400 hover:text-coffee-600'}`}>
              Tarifs
            </a>
            <a href="#faq" className={`text-xs tracking-wide transition-colors ${isDark ? 'text-cream-400/40 hover:text-cream-400/70' : 'text-coffee-400 hover:text-coffee-600'}`}>
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
