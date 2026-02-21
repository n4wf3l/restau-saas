import { useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { ReservationModal } from '../components/public/ReservationModal';
import { CTAButton } from '../components/public/CTAButton';
import toast from 'react-hot-toast';

type FormTab = 'contact' | 'recruitment';

const inputClass =
  'w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/70 transition-colors';

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
    <div className="bg-[#0d1b2a] text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
          Contact
        </p>
        <h1 className="text-4xl md:text-6xl font-display font-bold text-cream-100 mb-6 tracking-wide">
          Contactez-Nous
        </h1>
        <p className="text-cream-400/70 font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Une question, une demande particulière ou envie de rejoindre notre équipe ?
        </p>
      </section>

      {/* Content */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Info bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-center">
            <div>
              <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Adresse</p>
              <p className="text-cream-400/70 font-body text-sm">Ghandouri, Tanger, Maroc</p>
            </div>
            <div>
              <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Téléphone</p>
              <p className="text-cream-400/70 font-body text-sm">+212 5393-01039</p>
            </div>
            <div>
              <p className="text-cream-500 text-xs tracking-[0.25em] uppercase mb-2 font-body">Email</p>
              <p className="text-cream-400/70 font-body text-sm">rr.restauration@gmail.com</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-12">
            {[
              { key: 'contact' as FormTab, label: 'Nous contacter' },
              { key: 'recruitment' as FormTab, label: 'Rejoindre l\'équipe' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-8 py-3 bg-transparent rounded-none border text-xs tracking-[0.2em] uppercase font-body transition-all duration-300 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-cream-400/60 text-cream-400'
                    : 'border-cream-400/20 text-cream-400/40 hover:border-cream-400/40 hover:text-cream-400/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contact Form */}
          {activeTab === 'contact' && (
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
          )}

          {/* Recruitment Form */}
          {activeTab === 'recruitment' && (
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
          )}
        </div>
      </section>
    </div>
  );
}
