import { useAuth } from '../contexts/AuthContext';
import { ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

/**
 * Landing page shown when a logged-in owner's restaurant is not yet `active`.
 * Two variants: pending (waiting for superadmin validation) and suspended.
 */
export default function PendingValidationPage() {
  const { user, logout } = useAuth();
  const status = user?.restaurant?.status ?? 'pending';
  const isSuspended = status === 'suspended';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-cream-100 dark:from-[#141210] dark:to-[#0e0c0a] px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-[#1c1a17] border border-gray-200/60 dark:border-gray-700/40 rounded-2xl shadow-xl p-8 md:p-10 text-center">
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
          isSuspended
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        }`}>
          <ClockIcon className={`w-8 h-8 ${
            isSuspended ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
          }`} />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-cream-100 mb-3">
          {isSuspended ? 'Compte suspendu' : 'Compte en attente de validation'}
        </h1>

        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-body leading-relaxed mb-6">
          {isSuspended ? (
            <>
              Votre compte a été suspendu par notre équipe.
              Contactez le support pour régulariser votre situation.
            </>
          ) : (
            <>
              Bonjour <strong className="text-gray-900 dark:text-cream-100">{user?.name}</strong>,
              votre inscription a bien été enregistrée. Notre équipe examine votre demande
              et configurera votre espace selon vos besoins.
            </>
          )}
        </p>

        {!isSuspended && (
          <div className="bg-cream-50 dark:bg-[#26221e] border border-gray-200/60 dark:border-gray-700/40 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Prochaines étapes
            </p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 font-body space-y-2 list-decimal list-inside">
              <li>Nous étudions votre restaurant et vos besoins.</li>
              <li>Nous activons les fonctionnalités correspondant à votre offre.</li>
              <li>Vous recevrez un email de confirmation à <strong>{user?.email}</strong>.</li>
            </ol>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="mailto:contact@na-innovations.com"
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-coffee-600 text-cream-50 hover:bg-coffee-500 transition-colors"
          >
            Contacter le support
          </a>
          <button
            onClick={logout}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
