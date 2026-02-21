import { useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { Link } from 'react-router-dom';

export function TermsPage() {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  return (
    <div className="bg-coffee-950 text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      <section className="pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
              Légal
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-cream-100 mb-6 tracking-wide">
              Conditions Générales
            </h1>
            <p className="text-cream-400/50 font-body text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 font-body text-cream-400/70 text-sm md:text-base leading-relaxed">
            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                1. Objet
              </h2>
              <p>
                Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation
                du site web de RR Ice, incluant le service de réservation en ligne, la consultation du menu
                et toute interaction avec notre plateforme numérique. En utilisant notre site, vous acceptez
                ces conditions dans leur intégralité.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                2. Services proposés
              </h2>
              <p className="mb-3">Notre site web offre les services suivants :</p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Consultation du menu et de la carte du restaurant</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Réservation de tables en ligne avec sélection interactive du plan de salle</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Consultation des informations pratiques (horaires, localisation, contact)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Galerie photos du restaurant et de nos plats</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                3. Réservations
              </h2>
              <p className="mb-3">
                Les réservations effectuées via notre plateforme sont soumises aux conditions suivantes :
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Les réservations sont confirmées sous réserve de disponibilité</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Tout retard supérieur à 15 minutes peut entraîner l'annulation de la réservation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Les annulations doivent être effectuées au moins 2 heures avant l'heure prévue</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Les informations fournies lors de la réservation doivent être exactes et complètes</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                4. Propriété intellectuelle
              </h2>
              <p>
                L'ensemble des contenus présents sur ce site (textes, images, logos, photographies, vidéos,
                design, code source) sont la propriété exclusive de RR Ice ou de ses partenaires.
                Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation
                préalable écrite, est strictement interdite.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                5. Responsabilité
              </h2>
              <p>
                RR Ice s'efforce d'assurer l'exactitude des informations publiées sur son site.
                Toutefois, nous ne pouvons garantir l'absence d'erreurs ou d'omissions. Les prix,
                la disponibilité des plats et les horaires d'ouverture sont donnés à titre indicatif
                et peuvent être modifiés sans préavis. RR Ice ne saurait être tenu responsable des
                dommages directs ou indirects résultant de l'utilisation du site.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                6. Données personnelles
              </h2>
              <p>
                La collecte et le traitement de vos données personnelles sont régis par notre{' '}
                <Link to="/privacy" className="text-cream-400/80 hover:text-cream-300 underline underline-offset-4 decoration-cream-400/30 transition-colors">
                  Politique de Confidentialité
                </Link>.
                En utilisant notre site et nos services, vous consentez à la collecte et au traitement
                de vos données conformément à cette politique.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                7. Modification des CGU
              </h2>
              <p>
                RR Ice se réserve le droit de modifier les présentes conditions générales à tout moment.
                Les modifications prennent effet dès leur publication sur le site. Il est conseillé de
                consulter régulièrement cette page pour prendre connaissance des éventuelles mises à jour.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                8. Droit applicable
              </h2>
              <p>
                Les présentes conditions générales sont régies par le droit marocain.
                Tout litige relatif à l'utilisation du site sera soumis à la compétence exclusive
                des tribunaux de Tanger, Maroc.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                9. Contact
              </h2>
              <p>
                Pour toute question concernant ces conditions générales, contactez-nous via notre{' '}
                <Link to="/contact" className="text-cream-400/80 hover:text-cream-300 underline underline-offset-4 decoration-cream-400/30 transition-colors">
                  page de contact
                </Link>
                {' '}ou par email à{' '}
                <a href="mailto:rr.restauration@gmail.com" className="text-cream-400/80 hover:text-cream-300 underline underline-offset-4 decoration-cream-400/30 transition-colors">
                  rr.restauration@gmail.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} />
    </div>
  );
}
