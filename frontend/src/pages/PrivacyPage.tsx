import { useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
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
              Politique de Confidentialité
            </h1>
            <p className="text-cream-400/50 font-body text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 font-body text-cream-400/70 text-sm md:text-base leading-relaxed">
            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                1. Introduction
              </h2>
              <p>
                RR Ice (« nous », « notre ») s'engage à protéger la vie privée de ses clients et utilisateurs.
                Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons
                vos informations personnelles lorsque vous utilisez notre site web et nos services de réservation.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                2. Données collectées
              </h2>
              <p className="mb-3">Nous collectons les informations suivantes :</p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span><strong className="text-cream-300">Informations d'identité :</strong> nom, prénom, adresse email, numéro de téléphone</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span><strong className="text-cream-300">Données de réservation :</strong> date, heure, nombre de convives, préférences de table</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span><strong className="text-cream-300">Données de navigation :</strong> adresse IP, type de navigateur, pages visitées</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                3. Utilisation des données
              </h2>
              <p className="mb-3">Vos données personnelles sont utilisées pour :</p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Gérer vos réservations et vous envoyer des confirmations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Améliorer nos services et personnaliser votre expérience</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Vous contacter concernant votre réservation ou vos demandes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Respecter nos obligations légales et réglementaires</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                4. Protection des données
              </h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées
                pour protéger vos données personnelles contre l'accès non autorisé, la modification,
                la divulgation ou la destruction. Vos données sont stockées sur des serveurs sécurisés
                et ne sont accessibles qu'au personnel autorisé.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                5. Partage des données
              </h2>
              <p>
                Nous ne vendons, ne louons ni ne partageons vos informations personnelles avec des tiers
                à des fins commerciales. Vos données peuvent être partagées uniquement avec nos prestataires
                de services techniques nécessaires au fonctionnement de la plateforme, dans le strict respect
                de cette politique de confidentialité.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                6. Durée de conservation
              </h2>
              <p>
                Vos données personnelles sont conservées pendant la durée nécessaire à la finalité pour
                laquelle elles ont été collectées. Les données de réservation sont conservées pendant
                une durée maximale de 24 mois après votre dernière interaction avec nos services.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                7. Vos droits
              </h2>
              <p className="mb-3">Conformément à la réglementation en vigueur, vous disposez des droits suivants :</p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Droit d'accès à vos données personnelles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Droit de rectification des données inexactes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Droit à l'effacement de vos données</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-cream-400/40 mt-2.5 shrink-0" />
                  <span>Droit à la limitation du traitement</span>
                </li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à{' '}
                <a href="mailto:rr.restauration@gmail.com" className="text-cream-400/80 hover:text-cream-300 underline underline-offset-4 decoration-cream-400/30 transition-colors">
                  rr.restauration@gmail.com
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-display font-bold text-cream-200 mb-4 tracking-wide">
                8. Contact
              </h2>
              <p>
                Pour toute question relative à cette politique de confidentialité, vous pouvez nous contacter
                via notre{' '}
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
