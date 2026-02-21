import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { CTAButton } from '../components/public/CTAButton';
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
  'w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3.5 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/70 transition-colors min-h-[48px]';

export function ContactPage() {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('contact');

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);

  // Recruitment form
  const [recruitForm, setRecruitForm] = useState({ name: '', email: '', phone: '', position: '', experience: '', message: '' });
  const [recruitSending, setRecruitSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Message envoyé avec succès !');
    setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setContactSending(false);
  };

  const handleRecruitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecruitSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Candidature envoyée avec succès !');
    setRecruitForm({ name: '', email: '', phone: '', position: '', experience: '', message: '' });
    setRecruitSending(false);
  };

  return (
    <div className="bg-coffee-950 text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <ScrollReveal>
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
            Contact
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-cream-100 mb-6 tracking-wide">
            Contactez-Nous
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-cream-400/70 font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Une question, une demande particulière ou envie de rejoindre notre équipe ?
          </p>
        </ScrollReveal>
      </section>

      {/* Content */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Address */}
            <ScrollReveal delay={0}>
              <div className="border border-cream-400/15 p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-cream-400/30 rounded-full">
                  <svg className="w-4 h-4 text-cream-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Adresse</p>
                <p className="text-cream-400/70 font-body text-sm">Ghandouri, Tanger, Maroc</p>
              </div>
            </ScrollReveal>

            {/* Phone */}
            <ScrollReveal delay={100}>
              <div className="border border-cream-400/15 p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-cream-400/30 rounded-full">
                  <svg className="w-4 h-4 text-cream-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Téléphone</p>
                <a href="tel:+212539301039" className="text-cream-400/70 hover:text-cream-300 font-body text-sm transition-colors">
                  +212 5393-01039
                </a>
              </div>
            </ScrollReveal>

            {/* WhatsApp */}
            <ScrollReveal delay={200}>
              <div className="border border-cream-400/15 p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-emerald-400/30 rounded-full">
                  <svg className="w-4 h-4 text-emerald-400/70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </div>
                <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">WhatsApp</p>
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
              <div className="border border-cream-400/15 p-6 text-center h-full">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border border-cream-400/30 rounded-full">
                  <svg className="w-4 h-4 text-cream-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Email</p>
                <a href="mailto:rr.restauration@gmail.com" className="text-cream-400/70 hover:text-cream-300 font-body text-sm transition-colors">
                  rr.restauration@gmail.com
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Hours + Google Maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Opening Hours */}
            <ScrollReveal>
              <div className="border border-cream-400/15 p-8 h-full">
                <h3 className="text-lg font-display font-bold text-cream-100 mb-6 tracking-wide">
                  Horaires d'ouverture
                </h3>
                <div className="space-y-3 font-body text-sm">
                  {[
                    { day: 'Lundi', hours: '12h00 – 23h00' },
                    { day: 'Mardi', hours: '12h00 – 23h00' },
                    { day: 'Mercredi', hours: '12h00 – 23h00' },
                    { day: 'Jeudi', hours: '12h00 – 23h00' },
                    { day: 'Vendredi', hours: '12h00 – 00h00' },
                    { day: 'Samedi', hours: '12h00 – 00h00' },
                    { day: 'Dimanche', hours: '12h00 – 23h00' },
                  ].map(({ day, hours }) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-cream-400/70">{day}</span>
                      <span className="text-cream-200">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Google Maps */}
            <ScrollReveal delay={150}>
              <div className="border border-cream-400/15 overflow-hidden h-full">
                <iframe
                  title="RR Ice — Ghandouri, Tanger"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3237.5!2d-5.8128!3d35.7595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0b8!2sGhandouri%2C+Tanger!5e0!3m2!1sfr!2sma!4v1700000000000"
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

          {/* Tabs */}
          <ScrollReveal>
            <div className="flex justify-center gap-2 mb-12">
              {[
                { key: 'contact' as FormTab, label: 'Nous contacter' },
                { key: 'recruitment' as FormTab, label: 'Rejoindre l\'équipe' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 md:px-8 py-3.5 bg-transparent rounded-none border text-sm md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-body transition-all duration-300 cursor-pointer min-h-[48px] ${
                    activeTab === tab.key
                      ? 'border-cream-400/60 text-cream-400'
                      : 'border-cream-400/20 text-cream-400/40 hover:border-cream-400/40 hover:text-cream-400/60'
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
              <form onSubmit={handleContactSubmit} className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Sujet"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Votre message..."
                  required
                  rows={6}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
                <div className="text-center pt-4">
                  <CTAButton onClick={() => {}}>
                    {contactSending ? 'Envoi en cours...' : 'Envoyer le message'}
                  </CTAButton>
                </div>
              </form>
            </ScrollReveal>
          )}

          {/* Recruitment Form */}
          {activeTab === 'recruitment' && (
            <ScrollReveal>
              <form onSubmit={handleRecruitSubmit} className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
                <div className="text-center mb-6">
                  <p className="text-cream-400/60 font-body text-sm leading-relaxed max-w-lg mx-auto">
                    Vous êtes passionné par la restauration et souhaitez faire partie de notre équipe ?
                    Remplissez le formulaire ci-dessous et nous vous recontacterons.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    required
                    value={recruitForm.name}
                    onChange={(e) => setRecruitForm({ ...recruitForm, name: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={recruitForm.email}
                    onChange={(e) => setRecruitForm({ ...recruitForm, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    required
                    value={recruitForm.phone}
                    onChange={(e) => setRecruitForm({ ...recruitForm, phone: e.target.value })}
                    className={inputClass}
                  />
                  <select
                    required
                    value={recruitForm.position}
                    onChange={(e) => setRecruitForm({ ...recruitForm, position: e.target.value })}
                    className={`${inputClass} ${!recruitForm.position ? 'text-cream-400/40' : ''}`}
                  >
                    <option value="" disabled>Poste souhaité</option>
                    <option value="serveur">Serveur / Serveuse</option>
                    <option value="cuisinier">Cuisinier / Cuisinière</option>
                    <option value="plongeur">Plongeur</option>
                    <option value="barman">Barman / Barmaid</option>
                    <option value="manager">Manager</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Années d'expérience en restauration"
                  value={recruitForm.experience}
                  onChange={(e) => setRecruitForm({ ...recruitForm, experience: e.target.value })}
                  className={inputClass}
                />
                <textarea
                  placeholder="Parlez-nous de vous, de votre motivation..."
                  required
                  rows={6}
                  value={recruitForm.message}
                  onChange={(e) => setRecruitForm({ ...recruitForm, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
                <div className="text-center pt-4">
                  <CTAButton onClick={() => {}}>
                    {recruitSending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                  </CTAButton>
                </div>
              </form>
            </ScrollReveal>
          )}
        </div>
      </section>

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} />
    </div>
  );
}
