import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNav } from '../components/public/PublicNav';
import { Footer } from '../components/public/Footer';
import { cancelPublicReservation } from '../lib/api';
import { usePublicSettings } from '../contexts/PublicSettingsContext';

/**
 * Customer-facing reservation cancellation page.
 * - Reads ?code=XXXXXXXX from URL (link in confirmation email pre-fills it)
 * - Requires customer to also enter their email (defense against leaked codes)
 * - Rate-limited backend (10/min)
 */
export default function CancelReservation() {
  const [params] = useSearchParams();
  const publicSettings = usePublicSettings();
  const hideReservation = publicSettings ? !publicSettings.reservations_enabled : false;

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: 'success'; message: string; arrivalTime?: string; partySize?: number }
    | { kind: 'error'; message: string }
    | null
  >(null);

  // Pre-fill code from URL and normalize to uppercase
  useEffect(() => {
    const initial = params.get('code');
    if (initial) setCode(initial.toUpperCase());
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !email.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await cancelPublicReservation(code.trim().toUpperCase(), email.trim());
      setResult({
        kind: 'success',
        message: res.message,
        arrivalTime: res.arrival_time,
        partySize: res.party_size,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error
        ?? (status === 429 ? 'Trop de tentatives. Réessayez dans une minute.'
        : status === 404 ? 'Aucune réservation trouvée pour ce code et cet email.'
        : status === 409 ? 'Cette réservation est déjà annulée.'
        : status === 422 ? 'Cette réservation est passée et ne peut plus être annulée.'
        : 'Une erreur est survenue. Réessayez.');
      setResult({ kind: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-page text-primary min-h-screen relative">
      <PublicNav onReservationClick={() => { /* no-op on this page */ }} hideReservation={hideReservation} />

      <section className="pt-32 pb-16 px-4 text-center">
        <p className="text-accent text-xs tracking-[0.35em] uppercase mb-4 font-body">Annulation</p>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-primary mb-4 md:mb-6 tracking-wide">
          Annuler ma réservation
        </h1>
        <p className="text-secondary font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Saisissez le code reçu par email ainsi que votre adresse email pour annuler.
        </p>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-md mx-auto">
          {result?.kind === 'success' ? (
            <div className="border border-subtle bg-elevated p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-brand flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-brand">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-primary mb-2">Réservation annulée</h2>
              <p className="text-secondary font-body text-sm leading-relaxed mb-4">
                {result.message}
              </p>
              {result.arrivalTime && (
                <p className="text-tertiary text-xs font-body">
                  Prévue le {new Date(result.arrivalTime).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                  {result.partySize ? ` · ${result.partySize} ${result.partySize > 1 ? 'personnes' : 'personne'}` : ''}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" aria-label="Formulaire d'annulation">
              <div>
                <label htmlFor="cancel-code" className="block text-accent text-xs tracking-[0.2em] uppercase mb-2 font-body">
                  Code de réservation
                </label>
                <input
                  id="cancel-code"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="XXXXXXXX"
                  required
                  className="w-full bg-transparent border border-subtle rounded-none px-4 py-3.5 text-primary text-lg font-mono tracking-[0.4em] text-center placeholder:text-tertiary focus:outline-none focus:border-strong transition-colors min-h-[48px]"
                />
                <p className="text-tertiary text-xs mt-1.5 font-body">
                  Code à 8 caractères reçu par email lors de la réservation.
                </p>
              </div>

              <div>
                <label htmlFor="cancel-email" className="block text-accent text-xs tracking-[0.2em] uppercase mb-2 font-body">
                  Email de réservation
                </label>
                <input
                  id="cancel-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full bg-transparent border border-subtle rounded-none px-4 py-3.5 text-primary text-sm font-body placeholder:text-tertiary focus:outline-none focus:border-strong transition-colors min-h-[48px]"
                />
              </div>

              {result?.kind === 'error' && (
                <div className="border border-red-500/40 bg-red-500/10 text-red-300 dark:text-red-400 text-sm font-body p-3 rounded" role="alert">
                  {result.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 8 || !email}
                className="w-full py-4 border border-strong text-accent text-sm tracking-[0.15em] uppercase font-body hover:bg-tint disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[52px]"
              >
                {submitting ? 'Annulation en cours…' : 'Annuler ma réservation'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer onReservationClick={() => { /* no-op */ }} hideReservation={hideReservation} />
    </div>
  );
}
