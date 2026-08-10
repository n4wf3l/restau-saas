import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  BookOpenIcon,
  SparklesIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSettings,
  getMenuItems,
  updateSettings,
  uploadLogo,
  createMenuItem,
  API_BASE_URL,
} from '../../lib/api';
import type { OpeningHours } from '../../lib/types';
import { Spinner } from '../ui/Spinner';

/**
 * Post-register onboarding wizard.
 * - Auto-detects a fresh tenant (no opening hours + no menu items)
 * - Full-screen modal that walks the admin through 5 quick steps
 * - Fully skippable (skip step / dismiss wizard) — dismissal is persisted per tenant
 * - Progress bar + step navigation
 */

type Step = 0 | 1 | 2 | 3 | 4;

const DEFAULT_HOURS: OpeningHours = {
  monday:    { open: '12:00', close: '23:00', closed: false },
  tuesday:   { open: '12:00', close: '23:00', closed: false },
  wednesday: { open: '12:00', close: '23:00', closed: false },
  thursday:  { open: '12:00', close: '23:00', closed: false },
  friday:    { open: '12:00', close: '00:00', closed: false },
  saturday:  { open: '12:00', close: '00:00', closed: false },
  sunday:    { open: '12:00', close: '22:00', closed: false },
};

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
];

export function OnboardingWizard() {
  const { user } = useAuth();
  const slug = user?.restaurant?.slug;
  const dismissKey = slug ? `onboarding_done:${slug}` : null;

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [checking, setChecking] = useState(true);

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [menuItem, setMenuItem] = useState({ name: '', price: '', category: '', ingredients: '' });
  const [saving, setSaving] = useState(false);

  // ─── Fresh-tenant detection ────────────────────────────────
  useEffect(() => {
    if (!dismissKey) return;
    try {
      if (localStorage.getItem(dismissKey) === 'true') {
        setChecking(false);
        return;
      }
    } catch { /* storage disabled */ }

    (async () => {
      try {
        const [settings, items] = await Promise.all([
          getSettings(),
          getMenuItems().catch(() => []),
        ]);
        const fresh = !settings.opening_hours && (!items || items.length === 0);
        if (fresh) {
          setRestaurantName(settings.restaurant_name || user?.restaurant?.name || '');
          setLogoUrl(settings.logo_url || null);
          setVisible(true);
        }
      } catch { /* silent: don't block the dashboard if this fails */ }
      finally { setChecking(false); }
    })();
  }, [dismissKey, user?.restaurant?.name]);

  // Body scroll lock
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const dismiss = useCallback(() => {
    if (dismissKey) {
      try { localStorage.setItem(dismissKey, 'true'); } catch { /* ignore */ }
    }
    setVisible(false);
  }, [dismissKey]);

  const goNext = () => setStep((s) => Math.min(4, (s + 1) as Step));
  const goPrev = () => setStep((s) => Math.max(0, (s - 1) as Step));

  // ─── Persist actions ──────────────────────────────────────
  const saveNameAndLogo = async () => {
    if (!restaurantName.trim()) { goNext(); return; }
    setSaving(true);
    try {
      await updateSettings({ restaurant_name: restaurantName.trim() });
      toast.success('Nom du restaurant enregistré');
      goNext();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const updated = await uploadLogo(file);
      setLogoUrl(updated.logo_url ?? null);
      toast.success('Logo uploadé');
    } catch {
      toast.error("Erreur lors de l'upload du logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const saveHours = async () => {
    setSaving(true);
    try {
      await updateSettings({ opening_hours: hours });
      toast.success('Horaires enregistrés');
      goNext();
    } catch {
      toast.error("Erreur lors de l'enregistrement des horaires");
    } finally {
      setSaving(false);
    }
  };

  const saveFirstMenuItem = async () => {
    if (!menuItem.name.trim() || !menuItem.price.trim()) { goNext(); return; }
    setSaving(true);
    try {
      await createMenuItem({
        name: menuItem.name.trim(),
        price: parseFloat(menuItem.price),
        category: menuItem.category.trim() || 'Plats',
        ingredients: menuItem.ingredients.trim() || undefined,
        is_available: true,
        is_halal: false,
        order: 0,
      });
      toast.success('Premier plat ajouté');
      goNext();
    } catch {
      toast.error("Erreur lors de l'ajout du plat");
    } finally {
      setSaving(false);
    }
  };

  const finish = () => dismiss();

  // ─── Render ───────────────────────────────────────────────
  if (checking || !visible) return null;

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const resolvedLogoSrc = logoUrl
    ? (logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}${logoUrl}`)
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-surface-bg rounded-2xl shadow-premium dark:shadow-dark-premium border border-cream-200/30 dark:border-surface-border-light w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-slide-in">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-surface-border-light">
          <div
            className="h-full bg-coffee-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-surface-border-light">
          <span className="text-xs tracking-[0.2em] uppercase font-body text-gray-400 dark:text-cream-400/50">
            Étape {step + 1} sur {totalSteps}
          </span>
          <button
            onClick={dismiss}
            aria-label="Fermer l'onboarding"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-cream-400/60 dark:hover:text-cream-200 hover:bg-gray-100 dark:hover:bg-surface-border-light transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {step === 0 && (
            <section className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-coffee-600 dark:text-cream-400" />
              </div>
              <h2 id="onboarding-title" className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-cream-50 mb-3">
                Bienvenue {restaurantName ? `chez ${restaurantName}` : ''} 👋
              </h2>
              <p className="text-gray-500 dark:text-cream-400/70 font-body text-base max-w-md mx-auto leading-relaxed">
                On configure votre restaurant en 4 étapes rapides — moins de 5 minutes. Vous pourrez tout ajuster ensuite depuis les paramètres.
              </p>
            </section>
          )}

          {step === 1 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <BuildingStorefrontIcon className="w-6 h-6 text-coffee-600 dark:text-cream-400" />
                <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-cream-50">
                  Identité du restaurant
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">
                    Nom du restaurant *
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ex : La Table du Chef"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Affiché sur le site public, les emails et le dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">
                    Logo (optionnel)
                  </label>
                  <div className="flex items-center gap-4">
                    {resolvedLogoSrc ? (
                      <img src={resolvedLogoSrc} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <label className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer bg-coffee-600 hover:bg-coffee-500 text-white transition-colors ${logoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {logoUploading ? <Spinner size="xs" className="text-white" /> : (resolvedLogoSrc ? 'Changer' : 'Uploader')}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={logoUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    PNG ou JPG, max 5 Mo. Vous pouvez l'ajouter plus tard.
                  </p>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ClockIcon className="w-6 h-6 text-coffee-600 dark:text-cream-400" />
                <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-cream-50">
                  Horaires d'ouverture
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-cream-400/70 mb-5">
                On a prérempli une semaine standard. Ajustez si besoin.
              </p>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const dh = hours[key]!;
                  return (
                    <div key={key} className="flex items-center gap-3 py-1.5">
                      <span className="w-24 text-sm font-medium text-gray-700 dark:text-cream-200">{label}</span>
                      {dh.closed ? (
                        <span className="flex-1 text-sm text-gray-400 dark:text-cream-400/40 italic">Fermé</span>
                      ) : (
                        <>
                          <input
                            type="time"
                            value={dh.open}
                            onChange={(e) => setHours({ ...hours, [key]: { ...dh, open: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            value={dh.close}
                            onChange={(e) => setHours({ ...hours, [key]: { ...dh, close: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setHours({ ...hours, [key]: { ...dh, closed: !dh.closed } })}
                        className="ml-auto text-xs tracking-wider uppercase text-gray-400 dark:text-cream-400/50 hover:text-gray-700 dark:hover:text-cream-200 transition-colors"
                      >
                        {dh.closed ? 'Rouvrir' : 'Fermé ce jour'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <BookOpenIcon className="w-6 h-6 text-coffee-600 dark:text-cream-400" />
                <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-cream-50">
                  Votre premier plat (optionnel)
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-cream-400/70 mb-5">
                Ajoutez un plat pour tester votre carte. Vous pourrez en ajouter d'autres depuis l'onglet Menu.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">Nom du plat</label>
                  <input
                    type="text"
                    value={menuItem.name}
                    onChange={(e) => setMenuItem({ ...menuItem, name: e.target.value })}
                    placeholder="Ex : Tajine de poulet aux citrons confits"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">Prix (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={menuItem.price}
                      onChange={(e) => setMenuItem({ ...menuItem, price: e.target.value })}
                      placeholder="18"
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">Catégorie</label>
                    <input
                      type="text"
                      value={menuItem.category}
                      onChange={(e) => setMenuItem({ ...menuItem, category: e.target.value })}
                      placeholder="Plats"
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1.5">Ingrédients (optionnel)</label>
                  <input
                    type="text"
                    value={menuItem.ingredients}
                    onChange={(e) => setMenuItem({ ...menuItem, ingredients: e.target.value })}
                    placeholder="Poulet fermier, citron confit, olives vertes, coriandre"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircleIcon className="w-9 h-9 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-cream-50 mb-3">
                Votre restaurant est en ligne !
              </h2>
              <p className="text-gray-500 dark:text-cream-400/70 font-body text-base max-w-md mx-auto leading-relaxed mb-8">
                Visitez votre site public pour voir le rendu. Vous pouvez continuer à personnaliser (thème, images, plats) depuis le dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {slug && (
                  <Link
                    to={`/r/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={finish}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-coffee-600 hover:bg-coffee-500 text-white text-sm font-semibold tracking-wide transition-colors"
                  >
                    Voir mon site
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={finish}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold tracking-wide transition-colors"
                >
                  Aller au dashboard
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer / navigation */}
        {step < 4 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-surface-border-light bg-gray-50/50 dark:bg-surface-bg">
            <div className="flex items-center gap-3">
              {step > 0 ? (
                <button
                  onClick={goPrev}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-cream-300 hover:text-gray-900 dark:hover:text-cream-50 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour
                </button>
              ) : (
                <button
                  onClick={dismiss}
                  className="text-xs text-gray-400 dark:text-cream-400/50 hover:text-gray-600 dark:hover:text-cream-300 tracking-wide transition-colors"
                >
                  Passer l'onboarding
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step > 0 && step < 4 && (
                <button
                  onClick={goNext}
                  className="text-xs text-gray-400 dark:text-cream-400/50 hover:text-gray-600 dark:hover:text-cream-300 tracking-wide transition-colors"
                >
                  Passer
                </button>
              )}
              <button
                onClick={
                  step === 0 ? goNext :
                  step === 1 ? saveNameAndLogo :
                  step === 2 ? saveHours :
                  step === 3 ? saveFirstMenuItem :
                  goNext
                }
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-coffee-600 hover:bg-coffee-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide transition-colors"
              >
                {saving ? <Spinner size="xs" className="text-white" /> : (
                  <>
                    {step === 0 ? 'Commencer' : 'Continuer'}
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
