import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ─── Live site preview inside a fake browser chrome.
//     Iframe renders at fixed 1440x900 (desktop viewport) then scales down via CSS transform
//     to fit whatever width the container gets. Content stays consistent regardless of viewport. ───
function SiteMockup({ url, label, isDark }: { url: string; label: string; isDark: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => setScale(Math.max(0.15, el.clientWidth / 1440));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ouvrir ${label} en grand dans un nouvel onglet`}
      className={`block rounded-lg overflow-hidden border transition-all duration-700 ease-in-out group ${
        isDark ? 'border-cream-400/10 bg-coffee-900/50 hover:border-cream-400/25' : 'border-coffee-200 bg-white shadow-xl hover:shadow-2xl'
      }`}
    >
      {/* Browser chrome */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-cream-400/10 bg-coffee-900/80' : 'border-coffee-100 bg-coffee-50'}`}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <div className="w-3 h-3 rounded-full bg-green-400/60" />
        </div>
        <div className={`flex-1 text-center text-xs truncate ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>{label}</div>
      </div>
      {/* Iframe wrapper — aspect ratio locked to 1440:900 = 16:10 */}
      <div ref={wrapperRef} className="relative bg-black overflow-hidden" style={{ aspectRatio: '1440 / 900' }}>
        <iframe
          src={url}
          title={label}
          loading="lazy"
          tabIndex={-1}
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '1440px', height: '900px', transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
        {/* Hover hint */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 flex items-center justify-center">
          <span className="px-4 py-2 text-white text-xs font-semibold tracking-[0.15em] uppercase border border-white/60">
            Voir en grand ↗
          </span>
        </div>
      </div>
    </a>
  );
}

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
    period: '/mo',
    desc: 'To try the platform',
    cta: 'Start for free',
    popular: false,
    features: [
      { text: 'Custom website', ok: true },
      { text: 'Digital menu (up to 20 dishes)', ok: true },
      { text: 'Photo gallery (5 images)', ok: true },
      { text: 'Subdomain included', ok: true },
      { text: 'Online reservations', ok: false },
      { text: 'Automated emails', ok: false },
      { text: 'Custom domain', ok: false },
      { text: 'Priority support', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '29',
    period: '/mo',
    desc: 'Everything your restaurant needs',
    cta: 'Claim my founder spot',
    popular: true,
    founderBadge: 'Founder pricing · 10 spots left',
    features: [
      { text: 'Custom website', ok: true },
      { text: 'Unlimited digital menu', ok: true },
      { text: 'Unlimited photo gallery', ok: true },
      { text: 'Subdomain included', ok: true },
      { text: 'Online reservations', ok: true },
      { text: 'Automated emails', ok: true },
      { text: 'Custom domain', ok: true },
      { text: 'Priority support', ok: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '79',
    period: '/mo',
    desc: 'For restaurant groups',
    cta: 'Contact us',
    popular: false,
    features: [
      { text: 'Everything in Pro', ok: true },
      { text: 'Multi-location', ok: true },
      { text: 'Unlimited photo gallery', ok: true },
      { text: 'API & embeddable widget', ok: true },
      { text: 'Advanced reservations', ok: true },
      { text: 'Detailed analytics', ok: true },
      { text: 'Custom domain', ok: true },
      { text: '24/7 priority support', ok: true },
    ],
  },
];

// ─── FAQ ───
const faqs = [
  { q: 'Can I try it for free?', a: 'Yes. The Starter plan is 100% free, no credit card required. The Pro plan offers a 14-day trial with no commitment.' },
  { q: 'I already have a website — can I still use the platform?', a: 'Absolutely. You can embed our reservation widget and digital menu directly on your existing site with a simple snippet. No migration needed.' },
  { q: 'How does the reservation system work?', a: 'Your customers see your interactive floor plan in real time, pick a table and a slot, and receive an email confirmation. You manage everything from your dashboard.' },
  { q: 'Can I use my own domain name?', a: 'Yes, on the Pro plan. Just configure a CNAME record and we handle the SSL certificate automatically.' },
  { q: 'Is my data secure?', a: 'Every restaurant is fully isolated. Your data, images, and settings are never accessible from another account. SSL encryption on all connections.' },
  { q: 'Can I cancel anytime?', a: 'Yes, no fees or commitment. Your data remains accessible for 30 days after cancellation.' },
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
            {[
              { label: 'Features', anchor: 'fonctionnalites' },
              { label: 'Pricing', anchor: 'tarifs' },
              { label: 'Examples', anchor: 'exemples' },
              { label: 'FAQ', anchor: 'faq' },
            ].map(item => (
              <a
                key={item.anchor}
                href={`#${item.anchor}`}
                className={`text-sm tracking-wide transition-colors ${isDark ? 'text-cream-400/70 hover:text-cream-200' : 'text-coffee-500 hover:text-coffee-800'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'text-cream-400/60 hover:text-cream-200 hover:bg-cream-400/10' : 'text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? icons.sun : icons.moon}
            </button>
            <Link
              to="/r/rr-ice"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:inline-flex items-center gap-1.5 text-sm tracking-wide transition-colors ${isDark ? 'text-cream-300 hover:text-cream-100' : 'text-coffee-600 hover:text-coffee-900'}`}
            >
              View demo
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              to="/login"
              className={`hidden sm:inline text-sm tracking-wide transition-colors ${isDark ? 'text-cream-400/70 hover:text-cream-200' : 'text-coffee-500 hover:text-coffee-800'}`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`text-sm px-5 py-2 font-semibold tracking-[0.1em] uppercase transition-all ${
                isDark
                  ? 'border border-cream-400/50 text-cream-300 hover:bg-cream-400/10'
                  : 'bg-coffee-800 text-white hover:bg-coffee-700'
              }`}
            >
              Free trial
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
              <span>All-in-one platform for restaurants</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-wide leading-[1.1] ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
              Your restaurant{' '}
              <span className={isDark ? 'text-cream-400' : 'text-coffee-500'}>online</span>,{' '}
              <br className="hidden md:block" />
              in a few clicks
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 ${isDark ? 'text-cream-400/70' : 'text-coffee-500'}`}>
              Website, digital menu, real-time reservations, complete management.
              Everything you need to modernize your restaurant, <strong>without any technical skills</strong>.
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
                Create my restaurant
              </Link>
              <Link
                to="/r/rr-ice"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-10 py-4 border text-sm tracking-[0.15em] uppercase transition-all ${
                  isDark ? 'border-cream-400/40 text-cream-400 hover:bg-cream-400/10' : 'border-coffee-300 text-coffee-600 hover:bg-coffee-50'
                }`}
              >
                View live demo
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <p className={`mt-6 text-xs ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>
              Free to start. No credit card required.
            </p>
          </Reveal>

          {/* Live mockup of the real RR Ice site — proof, not placeholder */}
          <Reveal delay={550}>
            <div className="mt-16 md:mt-20 max-w-3xl mx-auto">
              <SiteMockup url="/r/rr-ice" label="rr-ice — restaurant pilote en production" isDark={isDark} />
              <p className={`mt-4 text-center text-xs tracking-[0.15em] uppercase ${isDark ? 'text-cream-400/40' : 'text-coffee-400'}`}>
                Preview of RR Ice website · our flagship client
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ CREDENTIALS (honest, early-stage) ══════════════ */}
      <section className={`py-12 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '🇲🇦', label: 'Built in Morocco' },
              { value: '2026', label: 'Launched' },
              { value: '1', label: 'Flagship restaurant' },
              { value: '24h', label: 'Founder support' },
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
      <section id="fonctionnalites" className="scroll-mt-20 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Features
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Everything for your restaurant
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: icons.globe, title: 'Custom website', desc: 'An elegant site tailored to your brand with hero slider, gallery, hours, social links and contact page. Ready in 5 minutes.' },
              { icon: icons.book, title: 'Interactive digital menu', desc: 'Complete menu with categories, photos, prices and badges (halal, vegetarian). Upload PDF or manage dish by dish.' },
              { icon: icons.calendar, title: 'Real-time reservations', desc: 'Interactive floor plan, automatic slots, capacity management. Your customers see available tables live.' },
              { icon: icons.grid, title: 'All-in-one dashboard', desc: 'Manage reservations, menu, images, hours and settings from a single interface. Dark mode included.' },
              { icon: icons.mail, title: 'Automated emails', desc: 'Reservation confirmations, pending requests, cancellations — everything is sent automatically to your customers.' },
              { icon: icons.photo, title: 'Gallery & media', desc: 'Organize your photos by category (restaurant, menu, hero). Drag & drop, resizing, custom ordering.' },
              { icon: icons.code, title: 'Embeddable widget', desc: 'Already have a website? Embed our reservation widget or menu with a simple snippet. Compatible with any CMS.' },
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

      {/* ══════════════ FLAGSHIP CLIENT — RR Ice ══════════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className={`relative overflow-hidden border ${isDark ? 'border-cream-400/15 bg-coffee-900/40' : 'border-coffee-200 bg-white'} p-8 md:p-14`}>
              {/* Subtle background ornament */}
              <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 opacity-[0.06]" aria-hidden="true">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <g fill="none" stroke={isDark ? '#d4b18a' : '#8f6a4f'} strokeWidth="0.5">
                    <polygon points="50,10 82,50 50,90 18,50" />
                    <polygon points="27.5,27.5 72.5,27.5 72.5,72.5 27.5,72.5" />
                  </g>
                </svg>
              </div>

              <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-8 md:gap-10 items-center">
                {/* Logo */}
                <div className={`w-24 h-24 md:w-28 md:h-28 shrink-0 flex items-center justify-center ${isDark ? 'bg-coffee-950' : 'bg-coffee-50'} border ${isDark ? 'border-cream-400/20' : 'border-coffee-200'}`}>
                  <img src="/logo.png" alt="RR Ice" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                </div>

                {/* Content */}
                <div>
                  <p className={`text-xs tracking-[0.35em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                    Flagship restaurant
                  </p>
                  <h3 className={`text-2xl md:text-3xl font-display font-bold mb-3 ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                    RR Ice · Tangier
                  </h3>
                  <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-cream-400/70' : 'text-coffee-500'}`}>
                    Restaurant in Ghandouri using the platform in production for its website,
                    digital menu and real-time reservations. Site 100% live — it's exactly
                    what you'll get.
                  </p>
                </div>

                {/* CTA */}
                <Link
                  to="/r/rr-ice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`shrink-0 inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-[0.15em] uppercase transition-all ${
                    isDark
                      ? 'border border-cream-400/40 text-cream-300 hover:bg-cream-400/10'
                      : 'bg-coffee-800 text-white hover:bg-coffee-700'
                  }`}
                >
                  Visit site
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ SHOWCASE: SITE WEB ══════════════ */}
      <section id="exemples" className={`scroll-mt-20 py-20 md:py-28 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Real examples
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide mb-4 ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                What your customers will see
              </h2>
              <p className={`max-w-2xl mx-auto ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                Every restaurant gets its own site at <code className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-cream-400/10' : 'bg-coffee-100'}`}>yourplatform.com/r/your-restaurant</code>
              </p>
            </div>
          </Reveal>

          {/* Example: Homepage */}
          <Reveal>
            <div className={`grid md:grid-cols-2 gap-12 items-center mb-20 ${isDark ? '' : ''}`}>
              <div>
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Website</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Restaurant homepage
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Hero with image slider, restaurant introduction, menu preview with photos,
                  integrated reservation section, ambiance video, opening hours and social links.
                  Everything customizable from the dashboard.
                </p>
                <ul className="space-y-2">
                  {['Hero slider with your photos', 'Restaurant gallery', 'Menu preview with images', 'Integrated reservation section', 'Hours & social media'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={isDark ? 'text-green-400' : 'text-green-600'}>{icons.check}</span>
                      <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <SiteMockup url="/r/rr-ice" label="rr-ice — homepage" isDark={isDark} />
            </div>
          </Reveal>

          {/* Example: Menu */}
          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
                <SiteMockup url="/r/rr-ice/menu" label="rr-ice — digital menu" isDark={isDark} />
              </div>
              <div className="order-1 md:order-2">
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Digital menu</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Your menu, elevated
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Showcase your dishes with photos, ingredients, prices and badges.
                  Categorized, filterable, and updated in real time from your dashboard.
                  You can also upload your existing PDF menu.
                </p>
                <ul className="space-y-2">
                  {['High-quality photos per dish', 'Custom categories', 'Halal, vegetarian and other badges', 'PDF menu upload', 'Drag & drop reordering'].map(item => (
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
                <div className={`text-xs tracking-[0.25em] uppercase mb-3 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>Reservation</div>
                <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                  Interactive booking
                </h3>
                <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                  Your customers see your floor plan live, pick their favorite table,
                  select a slot and receive an email confirmation.
                  You approve or decline from the dashboard.
                </p>
                <ul className="space-y-2">
                  {['Interactive floor plan', 'Real-time availability', 'Automatic table optimization', 'Email confirmations', 'No-show management'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={isDark ? 'text-green-400' : 'text-green-600'}>{icons.check}</span>
                      <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <SiteMockup url="/r/rr-ice/reservation" label="rr-ice — booking" isDark={isDark} />
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
                    <span>Integration</span>
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-display font-bold mb-4 ${isDark ? 'text-cream-200' : 'text-coffee-800'}`}>
                    Already have a website?
                  </h3>
                  <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                    No need to migrate. Embed our reservation widget or digital menu
                    directly on your existing site with a simple snippet.
                    Compatible with WordPress, Wix, Squarespace, and any HTML site.
                  </p>
                  <ul className="space-y-2">
                    {['Embeddable reservation widget', 'Digital menu in iframe', 'CSS customization', 'Documented REST API'].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{icons.check}</span>
                        <span className={`text-sm ${isDark ? 'text-cream-400/80' : 'text-coffee-600'}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-cream-400/10 bg-coffee-950' : 'border-coffee-200 bg-white'}`}>
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-cream-400/10' : 'border-coffee-100'}`}>
                    <span className={`text-xs font-mono ${isDark ? 'text-cream-400/50' : 'text-coffee-400'}`}>your-site.html</span>
                  </div>
                  <pre className={`p-4 text-xs leading-relaxed overflow-x-auto font-mono ${isDark ? 'text-cream-400/90' : 'text-coffee-800'}`}>
                    <code>
                      <span className={isDark ? 'text-cream-400/40' : 'text-coffee-400'}>{'<!-- Reservation widget -->'}</span>
                      {'\n'}
                      <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{'<div'}</span>
                      {'\n  '}
                      <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>id</span>
                      <span className={isDark ? 'text-cream-400/70' : 'text-coffee-500'}>=</span>
                      <span className={isDark ? 'text-green-300' : 'text-green-700'}>"na-reservation-widget"</span>
                      {'\n  '}
                      <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>data-restaurant</span>
                      <span className={isDark ? 'text-cream-400/70' : 'text-coffee-500'}>=</span>
                      <span className={isDark ? 'text-green-300' : 'text-green-700'}>"your-slug"</span>
                      {'\n  '}
                      <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>data-theme</span>
                      <span className={isDark ? 'text-cream-400/70' : 'text-coffee-500'}>=</span>
                      <span className={isDark ? 'text-green-300' : 'text-green-700'}>"auto"</span>
                      {'\n'}
                      <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{'></div>'}</span>
                      {'\n'}
                      <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{'<script '}</span>
                      <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>src</span>
                      <span className={isDark ? 'text-cream-400/70' : 'text-coffee-500'}>=</span>
                      <span className={isDark ? 'text-green-300' : 'text-green-700'}>"https://yourplatform.com/widget.js"</span>
                      <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{'>'}</span>
                      {'\n'}
                      <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{'</script>'}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="tarifs" className={`scroll-mt-20 py-20 md:py-28 px-6 ${isDark ? 'bg-black/20' : 'bg-coffee-50/50'} transition-colors duration-700 ease-in-out`}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                Pricing
              </p>
              <h2 className={`text-3xl md:text-5xl font-display font-bold tracking-wide mb-4 ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Simple, transparent, no surprises
              </h2>
              <p className={`max-w-xl mx-auto ${isDark ? 'text-cream-400/60' : 'text-coffee-500'}`}>
                No hidden fees, no commission on reservations. Cancel anytime.
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
                      Popular
                    </div>
                  )}
                  <div className={`text-xs tracking-wider uppercase font-semibold mb-4 ${isDark ? 'text-cream-400' : 'text-coffee-500'}`}>{plan.name}</div>
                  {'founderBadge' in plan && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 text-[10px] font-semibold tracking-[0.1em] uppercase rounded-full self-start ${
                      isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {(plan as { founderBadge: string }).founderBadge}
                    </div>
                  )}
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
      <section id="faq" className="scroll-mt-20 py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className={`text-xs tracking-[0.35em] uppercase mb-4 ${isDark ? 'text-cream-500' : 'text-coffee-400'}`}>
                FAQ
              </p>
              <h2 className={`text-3xl md:text-4xl font-display font-bold tracking-wide ${isDark ? 'text-cream-100' : 'text-coffee-900'}`}>
                Frequently asked questions
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

      {/* ══════════════ FINAL CTA — dark banner reversal (contrast break before footer) ══════════════ */}
      <section className="relative py-20 md:py-32 px-6 bg-coffee-950 overflow-hidden">
        {/* Subtle khatam ornament in the background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <g fill="none" stroke="#d4b18a" strokeWidth="0.3">
              <polygon points="50,15 80,50 50,85 20,50" />
              <polygon points="29.3,29.3 70.7,29.3 70.7,70.7 29.3,70.7" />
            </g>
          </svg>
        </div>
        {/* Warm ambient glows */}
        <div className="pointer-events-none absolute top-1/2 -left-24 w-96 h-96 rounded-full bg-coffee-600/20 blur-3xl -translate-y-1/2" aria-hidden="true" />
        <div className="pointer-events-none absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-cream-400/10 blur-3xl -translate-y-1/2" aria-hidden="true" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-wide leading-tight text-cream-100">
              Ready to bring your restaurant online?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-base mb-10 max-w-xl mx-auto text-cream-400/70">
              Create your account for free and set up your restaurant in under 5 minutes.
              No credit card required.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-12 py-4 font-bold text-sm tracking-[0.15em] uppercase transition-colors bg-cream-400 text-coffee-950 hover:bg-cream-300"
              >
                Start for free
              </Link>
              <Link
                to="/login"
                className="px-12 py-4 border text-sm tracking-[0.15em] uppercase transition-all border-cream-400/40 text-cream-300 hover:bg-cream-400/10"
              >
                I already have an account
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
            <span className={`text-xs ${isDark ? 'text-cream-400/30' : 'text-coffee-400'}`}>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className={`text-xs tracking-wide transition-colors ${isDark ? 'text-cream-400/40 hover:text-cream-400/70' : 'text-coffee-400 hover:text-coffee-600'}`}>
              Sign in
            </Link>
            <a href="#tarifs" className={`text-xs tracking-wide transition-colors ${isDark ? 'text-cream-400/40 hover:text-cream-400/70' : 'text-coffee-400 hover:text-coffee-600'}`}>
              Pricing
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
