import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicNav } from '../components/public/PublicNav';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { MobileReserveCTA } from '../components/public/MobileReserveCTA';
import { CTAButton } from '../components/public/CTAButton';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { submitContact, submitRecruitment } from '../lib/api';
import { CustomSelect } from '../components/ui/CustomSelect';
import toast from 'react-hot-toast';

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

type FormTab = 'contact' | 'recruitment';

const inputClass =
  'w-full bg-transparent border border-subtle rounded-none px-4 py-3.5 text-primary text-sm font-body placeholder:text-tertiary focus:outline-none focus:border-subtle transition-colors min-h-[48px]';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function formatTime(t: string): string {
  return t.replace(':', 'h');
}

export default function ContactPage() {
  const { t } = useTranslation();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('contact');

  const POSITION_OPTIONS = [
    { value: 'serveur',    label: t('contact.recruitment.positions.server') },
    { value: 'cuisinier',  label: t('contact.recruitment.positions.cook') },
    { value: 'plongeur',   label: t('contact.recruitment.positions.dishwasher') },
    { value: 'barman',     label: t('contact.recruitment.positions.barman') },
    { value: 'manager',    label: t('contact.recruitment.positions.manager') },
    { value: 'autre',      label: t('contact.recruitment.positions.other') },
  ];

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);

  // Recruitment form
  const [recruitForm, setRecruitForm] = useState({ name: '', email: '', phone: '', position: '', experience: '', message: '' });
  const [recruitSending, setRecruitSending] = useState(false);

  // Opening hours from settings
  const publicSettings = usePublicSettings();
  const restaurantName = publicSettings?.restaurant_name ?? 'RR Ice';
  const openingHours = publicSettings?.opening_hours ?? null;
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;
  const loadingHours = !publicSettings;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await submitContact(contactForm);
      toast.success(t('contact.form.success'));
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error(t('contact.form.errorTooMany'));
      } else {
        toast.error(t('contact.form.errorGeneric'));
      }
    } finally {
      setContactSending(false);
    }
  };

  const handleRecruitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecruitSending(true);
    try {
      await submitRecruitment(recruitForm);
      toast.success(t('contact.recruitment.success'));
      setRecruitForm({ name: '', email: '', phone: '', position: '', experience: '', message: '' });
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error(t('contact.recruitment.errorTooMany'));
      } else {
        toast.error(t('contact.recruitment.errorGeneric'));
      }
    } finally {
      setRecruitSending(false);
    }
  };

  return (
    <div className="relative bg-page text-white min-h-screen overflow-hidden">
      <PublicNav onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      {!hideReservation && <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />}

      {/* Decorative Morocco outline (with Sahara) — top-right, single instance, hidden on small screens.
          Path generated from Natural Earth 50m data via frontend/scripts/generate-morocco-svg.mjs.
          Tenant can turn this off from SettingsPage → Décorations marocaines. */}
      {(publicSettings?.show_moroccan_decorations ?? true) && (
      <div
        className="pointer-events-none absolute top-24 right-4 md:top-28 md:right-8 hidden sm:block z-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 96.39 100"
          className="h-64 md:h-80 w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M89.40,5.70L89.58,6.21L89.93,6.62L91.21,7.55L91.97,8.12L91.99,8.33L91.73,8.79L91.64,9.12L91.84,9.46L92.30,9.88L92.34,10.09L92.23,10.33L91.99,10.77L92.49,12.10L92.58,13.38L92.45,14.29L92.45,14.81L92.52,15.25L92.95,16.30L92.67,18.01L92.99,18.94L93.45,19.69L93.69,21.05L94.06,21.68L94.65,22.24L94.98,22.43L95.63,22.90L96.11,23.28L96.39,23.86L95.80,24.34L95.32,24.77L95.19,25.22L95.41,25.95L95.41,26.35L95.11,26.48L93.89,26.44L92.93,26.41L91.84,26.37L90.30,26.30L89.34,26.25L88.01,26.19L87.57,26.23L86.36,26.43L85.51,26.57L85.38,26.62L85.09,26.80L84.92,27.34L84.74,27.96L84.57,28.24L82.02,29.12L81.02,29.25L80.46,29.16L80.04,29.23L79.69,29.42L79.56,29.71L79.54,30.08L79.63,30.45L79.87,30.96L79.91,31.49L79.76,31.85L79.72,32.22L79.65,32.62L79.78,32.83L80.02,32.87L80.26,33.05L80.61,33.21L80.91,33.52L80.89,33.98L80.65,34.23L80.43,34.36L79.48,34.48L78.71,34.58L77.73,35.30L76.69,36.06L75.43,36.56L74.88,36.71L73.93,37.07L72.77,37.66L72.21,38.62L71.51,39.73L70.81,40.48L69.88,41.17L69.01,41.45L67.90,41.78L66.52,42.03L65.54,42.13L65.24,42.18L64.39,42.20L63.96,42.14L63.65,42.12L63.52,42.19L63.48,42.37L63.45,42.76L63.39,43.22L63.13,43.60L62.93,43.78L62.69,43.85L61.97,43.74L61.37,43.62L59.93,43.46L59.65,43.49L59.54,43.54L59.08,43.80L58.38,44.35L57.90,44.84L57.56,45.06L56.73,45.18L56.36,45.36L54.79,46.57L54.46,46.85L52.85,47.91L52.40,48.25L52.03,48.59L51.07,49.37L50.46,49.70L50.35,49.90L50.31,50.38L50.31,51.42L50.31,52.43L50.31,53.89L50.31,55.35L50.31,57.02L49.50,57.02L49.50,57.04L49.52,57.32L49.70,57.90L49.76,58.38L49.68,58.67L49.59,59.06L49.63,59.43L49.76,59.82L49.89,60.23L49.89,60.50L49.65,60.72L49.07,60.83L48.39,60.92L47.89,60.92L47.15,60.86L46.67,60.88L46.26,60.88L45.91,60.94L45.45,61.20L44.95,61.62L44.32,62.17L43.95,62.51L43.45,62.59L42.95,62.59L42.47,62.31L42.17,62.17L41.95,62.18L41.62,62.37L41.21,62.51L40.84,62.51L40.21,62.23L39.47,61.82L39.03,61.62L38.40,61.55L37.77,61.41L37.33,61.47L36.77,61.47L36.03,61.75L35.40,61.95L34.72,62.17L33.94,62.36L34.13,62.97L34.39,63.30L34.39,63.72L34.26,64.08L33.89,64.42L33.46,64.86L33.22,65.21L32.96,65.67L32.78,65.96L32.46,66.40L32.17,66.97L32.09,67.32L31.96,67.72L31.74,67.85L30.98,67.96L30.50,68.09L30.08,68.23L29.91,68.47L29.89,68.51L29.78,68.99L29.78,69.33L29.65,69.61L29.47,70.29L29.23,70.93L29.04,71.75L28.86,72.43L28.63,73.55L28.39,74.58L28.08,75.54L27.84,76.15L27.65,76.50L27.23,76.92L26.86,77.18L26.45,77.54L25.97,77.88L25.29,78.30L24.75,78.64L24.53,78.80L24.27,78.99L23.84,79.47L23.49,80.15L23.25,80.71L22.81,81.60L22.51,82.09L22.33,82.35L21.86,82.63L21.31,82.84L20.70,83.12L20.22,83.39L19.55,83.67L19.13,83.94L18.83,84.35L18.59,84.84L18.29,85.53L18.05,86.29L17.92,86.77L17.57,88.43L17.44,89.39L17.31,90.01L17.13,90.78L17.02,91.94L17.02,92.91L16.89,93.46L16.83,93.87L16.52,94.35L16.28,94.70L15.87,95.18L15.50,95.45L15.39,95.73L15.02,96.08L14.65,96.63L14.35,96.97L14.41,97.25L14.48,97.73L14.30,98.22L14.11,98.77L13.63,99.45L13.08,99.80L12.30,99.87L11.21,99.87L10.36,99.80L9.34,99.80L8.42,99.66L7.58,99.52L6.55,99.45L5.83,99.45L4.92,99.59L2.57,99.59L1.65,99.66L0.33,99.94L0.00,100.00L0.46,96.70L1.28,94.92L1.94,94.13L2.96,93.71L3.90,91.91L4.24,90.26L4.85,89.50L5.05,88.90L4.81,88.44L5.40,87.54L6.10,86.18L6.42,85.31L7.25,83.96L7.36,83.66L7.27,83.31L6.94,83.61L6.60,84.10L6.18,84.49L6.36,84.02L6.68,83.30L7.42,82.56L8.58,81.73L10.97,78.93L11.89,78.44L12.69,77.27L13.00,76.21L13.08,73.82L13.37,72.55L13.89,71.56L14.52,69.77L15.00,68.95L15.32,67.32L15.67,66.69L16.28,66.40L17.15,65.58L18.46,65.08L20.01,64.01L20.72,63.38L21.22,62.43L21.75,60.54L22.66,58.55L23.14,57.06L23.16,57.04L23.97,56.25L24.53,55.25L25.47,54.81L27.43,54.59L30.35,53.77L32.96,52.52L33.70,52.02L34.50,51.03L35.81,49.74L38.29,48.18L39.42,47.32L41.14,45.14L42.30,43.35L43.25,42.19L43.91,41.16L44.36,40.12L44.63,38.44L44.45,37.78L43.73,36.72L43.23,36.43L43.10,35.93L43.36,35.03L43.36,33.50L43.51,31.06L44.32,29.09L46.30,26.49L46.67,25.44L46.89,23.74L46.91,23.14L49.39,20.75L50.85,18.90L51.35,18.46L52.64,17.62L57.10,15.78L59.62,14.48L61.10,13.52L61.97,12.40L64.41,7.96L66.81,1.72L67.00,0.99L68.07,0.79L68.83,0.71L69.44,0.48L70.18,0.00L70.90,0.19L70.55,0.51L70.55,1.28L71.05,2.18L71.94,3.19L73.58,4.47L74.84,4.99L76.65,5.30L78.74,4.74L79.91,4.73L80.50,4.49L81.11,4.85L82.31,4.95L83.44,4.76L84.31,4.22L84.85,3.61L84.94,3.91L84.96,4.25L85.14,4.44L85.46,5.23L85.66,5.53L86.31,5.48L86.88,5.64L88.16,5.56L89.40,5.70Z"
            fill="#d4b18a"
            fillOpacity="0.08"
            stroke="#d4b18a"
            strokeOpacity="0.5"
            strokeWidth="0.35"
            strokeLinejoin="round"
          />
          {/* Small dot for Tangier (RR Ice location) — projected from lat 35.77°N, lon -5.80°W */}
          <circle cx="67.77" cy="1.10" r="0.9" fill="#d4b18a" fillOpacity="0.9" />
        </svg>
      </div>
      )}

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-16 px-4 text-center">
        <ScrollReveal>
          <p className="text-accent text-xs tracking-[0.35em] uppercase mb-4 font-body">
            {t('contact.eyebrow')}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary mb-6 tracking-wide">
            {t('contact.title')}
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-secondary font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t('contact.desc')}
          </p>
        </ScrollReveal>
      </section>

      {/* Info + Hours + Map */}
      <section className="relative z-10 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Address */}
            <ScrollReveal delay={0}>
              <div className="border border-subtle p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-subtle rounded-full">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <p className="text-accent text-xs tracking-[0.25em] uppercase mb-2 font-body">{t('contact.address.label')}</p>
                <p className="text-secondary font-body text-sm">{t('contact.address.value')}</p>
              </div>
            </ScrollReveal>

            {/* Phone */}
            <ScrollReveal delay={100}>
              <div className="border border-subtle p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-subtle rounded-full">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <p className="text-accent text-xs tracking-[0.25em] uppercase mb-2 font-body">{t('contact.phone.label')}</p>
                <a href="tel:+212539301039" className="text-secondary hover:text-primary font-body text-sm transition-colors">
                  +212 5393-01039
                </a>
              </div>
            </ScrollReveal>

            {/* WhatsApp */}
            <ScrollReveal delay={200}>
              <div className="border border-subtle p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-emerald-400/30 rounded-full">
                  <svg className="w-4 h-4 text-emerald-400/70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </div>
                <p className="text-accent text-xs tracking-[0.25em] uppercase mb-2 font-body">{t('contact.whatsapp.label')}</p>
                <a
                  href="https://wa.me/212539301039"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/70 hover:text-emerald-300 font-body text-sm transition-colors"
                >
                  +212 5393-01039
                </a>
              </div>
            </ScrollReveal>

            {/* Email */}
            <ScrollReveal delay={300}>
              <div className="border border-subtle p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-subtle rounded-full">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-accent text-xs tracking-[0.25em] uppercase mb-2 font-body">{t('contact.email.label')}</p>
                <a href="mailto:rr.restauration@gmail.com" className="text-secondary hover:text-primary font-body text-sm transition-colors">
                  rr.restauration@gmail.com
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Birthday & private events callout — full-width banner under the info cards,
              mirrors the phone note shown inside the reservation modal for the same use case. */}
          <ScrollReveal>
            <div className="mb-16 border border-subtle bg-tint p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-subtle rounded-full">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-accent text-xs tracking-[0.25em] uppercase mb-1 font-body">{t('contact.birthday.label')}</p>
                  <p className="text-secondary font-body text-sm leading-relaxed">{t('contact.birthday.note')}</p>
                </div>
              </div>
              <a
                href="tel:+212688927586"
                className="shrink-0 inline-flex items-center justify-center px-5 py-3 border border-subtle text-primary font-body text-sm tracking-[0.15em] uppercase hover:bg-page transition-colors min-h-[48px]"
              >
                06 88 92 75 86
              </a>
            </div>
          </ScrollReveal>

          {/* Hours + Google Maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Opening Hours */}
            <ScrollReveal>
              <div className="border border-subtle p-8 h-full">
                <h3 className="text-lg font-display font-bold text-primary mb-6 tracking-wide">
                  {t('contact.hours.title')}
                </h3>
                <div className="space-y-3 font-body text-sm">
                  {loadingHours ? (
                    <div className="flex justify-center py-6">
                      <svg className="animate-spin w-5 h-5 text-tertiary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                  ) : openingHours ? DAY_ORDER.map((key) => {
                    const dh = openingHours[key];
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-secondary">{t(`days.${key}`)}</span>
                        <span className="text-primary">
                          {dh?.closed ? t('contact.hours.closed') : dh ? `${formatTime(dh.open)} – ${formatTime(dh.close)}` : '—'}
                        </span>
                      </div>
                    );
                  }) : (
                    <p className="text-tertiary italic">{t('contact.hours.notConfigured')}</p>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Google Maps */}
            <ScrollReveal delay={150}>
              <div className="border border-subtle overflow-hidden h-full">
                <iframe
                  title={`${restaurantName} — Ghandouri, Tanger`}
                  src="https://www.google.com/maps?q=35.788289172557704,-5.7599687317466195&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '250px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* Forms — visually broken off with a subtle tint band + top hairline */}
      <section className="relative z-10 bg-tint border-t border-subtle px-4 py-20 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <ScrollReveal>
            <div role="tablist" aria-label={t('contact.tabs.contact')} className="flex justify-center gap-2 mb-12">
              {[
                { key: 'contact' as FormTab, label: t('contact.tabs.contact') },
                { key: 'recruitment' as FormTab, label: t('contact.tabs.recruitment') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`panel-${tab.key}`}
                  id={`tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 md:px-8 py-3.5 bg-transparent rounded-none border text-sm md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-body transition-all duration-300 cursor-pointer min-h-[48px] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-page ${
                    activeTab === tab.key
                      ? 'border-subtle text-accent'
                      : 'border-subtle text-tertiary hover:border-subtle hover:text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Contact Form */}
          {activeTab === 'contact' && (
            <ScrollReveal>
              <form
                onSubmit={handleContactSubmit}
                aria-label={t('contact.form.contactAria')}
                role="tabpanel"
                id="panel-contact"
                aria-labelledby="tab-contact"
                className="max-w-2xl mx-auto space-y-5 animate-fadeIn"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder={t('contact.form.fullName')}
                    aria-label={t('contact.form.fullName')}
                    autoComplete="name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder={t('contact.form.email')}
                    aria-label={t('contact.form.email')}
                    autoComplete="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="tel"
                    placeholder={t('contact.form.phone')}
                    aria-label={t('contact.form.phoneOptional')}
                    autoComplete="tel"
                    inputMode="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder={t('contact.form.subject')}
                    aria-label={t('contact.form.subject')}
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder={t('contact.form.messagePlaceholder')}
                  aria-label={t('contact.form.message')}
                  required
                  rows={6}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
                <div className="text-center pt-4">
                  <CTAButton onClick={() => {}}>
                    {contactSending ? t('contact.form.submitSending') : t('contact.form.submitButton')}
                  </CTAButton>
                </div>
              </form>
            </ScrollReveal>
          )}

          {/* Recruitment Form */}
          {activeTab === 'recruitment' && (
            <ScrollReveal>
              <form
                onSubmit={handleRecruitSubmit}
                aria-label={t('contact.form.recruitmentAria')}
                role="tabpanel"
                id="panel-recruitment"
                aria-labelledby="tab-recruitment"
                className="max-w-2xl mx-auto space-y-5 animate-fadeIn"
              >
                <div className="text-center mb-6">
                  <p className="text-secondary font-body text-sm leading-relaxed max-w-lg mx-auto">
                    {t('contact.recruitment.intro')}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder={t('contact.form.fullName')}
                    aria-label={t('contact.form.fullName')}
                    autoComplete="name"
                    required
                    value={recruitForm.name}
                    onChange={(e) => setRecruitForm({ ...recruitForm, name: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder={t('contact.form.email')}
                    aria-label={t('contact.form.email')}
                    autoComplete="email"
                    required
                    value={recruitForm.email}
                    onChange={(e) => setRecruitForm({ ...recruitForm, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="tel"
                    placeholder={t('contact.form.phone')}
                    aria-label={t('contact.form.phone')}
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={recruitForm.phone}
                    onChange={(e) => setRecruitForm({ ...recruitForm, phone: e.target.value })}
                    className={inputClass}
                  />
                  <CustomSelect
                    name="position"
                    required
                    value={recruitForm.position}
                    onChange={(v) => setRecruitForm({ ...recruitForm, position: v })}
                    options={POSITION_OPTIONS}
                    placeholder={t('contact.recruitment.positionPlaceholder')}
                    ariaLabel={t('contact.recruitment.positionPlaceholder')}
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('contact.recruitment.experiencePlaceholder')}
                  aria-label={t('contact.recruitment.experienceAria')}
                  value={recruitForm.experience}
                  onChange={(e) => setRecruitForm({ ...recruitForm, experience: e.target.value })}
                  className={inputClass}
                />
                <textarea
                  placeholder={t('contact.recruitment.motivationPlaceholder')}
                  aria-label={t('contact.recruitment.motivationAria')}
                  required
                  rows={6}
                  value={recruitForm.message}
                  onChange={(e) => setRecruitForm({ ...recruitForm, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
                <div className="text-center pt-4">
                  <CTAButton onClick={() => {}}>
                    {recruitSending ? t('contact.form.submitSending') : t('contact.recruitment.submitButton')}
                  </CTAButton>
                </div>
              </form>
            </ScrollReveal>
          )}
        </div>
      </section>

      <MobileReserveCTA onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
      <Footer onReservationClick={() => setIsReservationModalOpen(true)} hideReservation={hideReservation} />
    </div>
  );
}
