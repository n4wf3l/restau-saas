import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSettings, updateSeoChecklist } from '../lib/api';
import type { RestaurantSettings } from '../lib/types';
import toast from 'react-hot-toast';
import { Spinner } from '../components/ui/Spinner';
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  GlobeAltIcon,
  BuildingStorefrontIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

/**
 * SEO checklist — a two-column tracker:
 *   • Auto items derived from restaurant_settings state (Google can't score you
 *     if these are empty). Owner can't tick these; they just complete the fields.
 *   • Manual items the owner claims they've done off-platform (Google Business
 *     Profile, TripAdvisor listing, review process, etc.). Stored as an array
 *     of item keys in restaurant_settings.seo_checklist.
 */

type ManualItem = {
  key: string;
  title: string;
  desc: string;
  cta?: { label: string; href: string };
};

type Category = {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  intro: string;
  auto?: {
    key: string;
    title: string;
    desc: string;
    done: (s: RestaurantSettings) => boolean;
  }[];
  manual?: ManualItem[];
};

const CATEGORIES: Category[] = [
  {
    id: 'onsite',
    title: 'Sur votre site',
    icon: BuildingStorefrontIcon,
    intro: "Le minimum vital que Google et vos clients attendent de voir sur votre page. Ces éléments se cochent automatiquement quand vous les remplissez dans les Paramètres.",
    auto: [
      { key: 'has_logo',            title: 'Logo uploadé',                 desc: 'Utilisé pour le favicon, les partages sociaux, la fiche Google.', done: s => !!s.logo_url },
      { key: 'has_meta_description', title: 'Description SEO renseignée',   desc: 'Le texte sous le titre de votre site dans Google.', done: s => !!(s.meta_description && s.meta_description.length >= 50) },
      { key: 'has_address',         title: 'Adresse renseignée',           desc: 'Alimente la fiche schema.org Restaurant.', done: s => !!s.address },
      { key: 'has_phone',           title: 'Téléphone renseigné',          desc: 'Google Maps utilise ce numéro pour lier votre site à votre fiche GMB.', done: s => !!s.phone },
      { key: 'has_cuisine',         title: 'Type de cuisine renseigné',    desc: 'Améliore la catégorisation dans les résultats.', done: s => !!s.cuisine_type },
      { key: 'has_price_range',     title: 'Gamme de prix renseignée',     desc: '€ à €€€€. Affiché sur la fiche Google.', done: s => !!s.price_range },
      { key: 'has_opening_hours',   title: "Horaires d'ouverture complets", desc: '7 jours renseignés (ouvert ou fermé).', done: s => !!s.opening_hours && Object.keys(s.opening_hours).length >= 7 },
      { key: 'has_og_image',        title: 'Image de partage définie',     desc: "Ce qui s'affiche quand quelqu'un partage votre site sur Facebook/WhatsApp.", done: s => !!(s.og_image_url) },
      { key: 'has_socials',         title: 'Au moins un réseau social actif', desc: 'Instagram, Facebook, TikTok — améliore le E-A-T pour Google.', done: s => !!s.social_links && Object.values(s.social_links).some(l => l?.enabled && l.url) },
    ],
  },
  {
    id: 'gmb',
    title: 'Google Business Profile',
    icon: MapPinIcon,
    intro: "C'est le lien le plus important pour un restaurant local. 80% de vos clients vont d'abord vous chercher sur Google Maps. Sans fiche GMB, vous êtes invisible.",
    manual: [
      { key: 'gmb_created',     title: 'Fiche Google Business créée',       desc: 'Rendez-vous sur business.google.com pour la créer gratuitement.', cta: { label: 'Créer ma fiche', href: 'https://www.google.com/business/' } },
      { key: 'gmb_verified',    title: 'Adresse vérifiée',                  desc: 'Google envoie une carte postale ou passe un appel. Sans vérification, votre fiche est cachée.' },
      { key: 'gmb_photos',      title: '≥ 5 photos ajoutées sur GMB',       desc: 'Photos du plat signature, de la salle, de la façade, de l\'équipe. Les fiches avec photos reçoivent 42% plus de demandes d\'itinéraire.' },
      { key: 'gmb_menu_linked', title: 'Menu / lien vers votre site ajouté', desc: 'Dans la fiche GMB, ajoutez le lien vers votre page menu et vers votre site public.' },
    ],
  },
  {
    id: 'listings',
    title: 'Plateformes tierces',
    icon: GlobeAltIcon,
    intro: "Chaque citation cohérente (même nom, même adresse, même téléphone) sur un annuaire réputé renforce votre autorité locale aux yeux de Google.",
    manual: [
      { key: 'tripadvisor_listed', title: 'Fiche TripAdvisor à jour',  desc: 'Photos, description, horaires, réponses aux avis.', cta: { label: 'TripAdvisor', href: 'https://www.tripadvisor.fr/Owners' } },
      { key: 'thefork_listed',     title: 'Présent sur TheFork / LaFourchette', desc: 'Génère de la visibilité et des réservations directes.', cta: { label: 'TheFork', href: 'https://www.thefork.com/register-restaurant' } },
      { key: 'yelp_listed',        title: 'Fiche Yelp créée (si pertinent)', desc: 'Moins populaire au Maroc mais utile pour les touristes.', cta: { label: 'Yelp', href: 'https://biz.yelp.com/' } },
    ],
  },
  {
    id: 'reviews',
    title: 'Avis clients',
    icon: StarIcon,
    intro: "Les avis sont le premier signal de confiance. Google favorise fortement les restaurants qui accumulent des avis récents et qui y répondent — bons comme mauvais.",
    manual: [
      { key: 'review_ask_process', title: 'Processus pour demander des avis', desc: "QR code sur les tables, phrase sur l'addition, follow-up email après une réservation confirmée." },
      { key: 'review_responses',   title: 'Réponse à tous les avis',         desc: 'Répondez sous 48h. Réponse pro et courte pour les négatifs, personnalisée pour les positifs.' },
    ],
  },
  {
    id: 'content',
    title: 'Contenu & présence',
    icon: MagnifyingGlassIcon,
    intro: 'Signaux long terme : plus vous publiez, plus vous êtes vu comme actif et crédible.',
    manual: [
      { key: 'blog_posts',   title: 'Publier des nouveautés / événements', desc: 'Nouvelle carte de saison, événement spécial. Utilisez la fonctionnalité Événements de la plateforme.' },
      { key: 'social_active', title: 'Réseaux sociaux actifs (≥ 1 post / semaine)', desc: 'Un post Instagram régulier avec les mêmes hashtags locaux (#TangerFood, #restaurantTanger).' },
    ],
  },
];

export default function SeoChecklistPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch {
      toast.error('Erreur lors du chargement de la checklist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ticked = useMemo(() => new Set(settings?.seo_checklist ?? []), [settings]);

  const toggleManual = async (key: string) => {
    if (!settings) return;
    const next = new Set(ticked);
    next.has(key) ? next.delete(key) : next.add(key);
    setSaving(true);
    try {
      const updated = await updateSeoChecklist(Array.from(next));
      setSettings(updated);
    } catch {
      toast.error("Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  // Global progress
  const { total, done } = useMemo(() => {
    if (!settings) return { total: 0, done: 0 };
    let t = 0, d = 0;
    for (const cat of CATEGORIES) {
      for (const item of cat.auto ?? []) {
        t++;
        if (item.done(settings)) d++;
      }
      for (const item of cat.manual ?? []) {
        t++;
        if (ticked.has(item.key)) d++;
      }
    }
    return { total: t, done: d };
  }, [settings, ticked]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // "Next action" — first uncompleted item, in order of category importance
  const nextAction = useMemo(() => {
    if (!settings) return null;
    for (const cat of CATEGORIES) {
      for (const item of cat.auto ?? []) {
        if (!item.done(settings)) return { cat: cat.title, title: item.title, isManual: false };
      }
      for (const item of cat.manual ?? []) {
        if (!ticked.has(item.key)) return { cat: cat.title, title: item.title, isManual: true };
      }
    }
    return null;
  }, [settings, ticked]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Impossible de charger les paramètres.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-100">
            Référencement SEO — checklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Tout ce qui aide vos clients à vous trouver sur Google et les plateformes locales.
            Notre plateforme fait la partie technique — cette checklist vous guide pour le reste.
          </p>
        </div>

        {/* Progress card */}
        <div className="bg-white dark:bg-[#1c1a17] border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-5 md:p-6 mb-6 shadow-card dark:shadow-dark-card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Progression globale</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-cream-100 mt-0.5">
                {done} / {total} <span className="text-gray-400 dark:text-gray-500 text-base">({pct}%)</span>
              </p>
            </div>
            {saving && <Spinner size="sm" />}
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {nextAction && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Prochaine action</p>
              <p className="text-sm text-gray-900 dark:text-cream-100 font-medium mt-1">
                {nextAction.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {nextAction.cat} · {nextAction.isManual ? 'À cocher une fois fait' : 'À remplir dans les Paramètres'}
              </p>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const autoDone   = (cat.auto   ?? []).filter(i => i.done(settings)).length;
            const manualDone = (cat.manual ?? []).filter(i => ticked.has(i.key)).length;
            const catTotal = (cat.auto?.length ?? 0) + (cat.manual?.length ?? 0);
            const catDone  = autoDone + manualDone;

            return (
              <div key={cat.id} className="bg-white dark:bg-[#1c1a17] border border-gray-200/60 dark:border-gray-700/40 rounded-2xl overflow-hidden shadow-card dark:shadow-dark-card">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-cream-600 dark:text-cream-500 flex-shrink-0" />
                    <div>
                      <h2 className="text-base font-display font-semibold text-gray-900 dark:text-cream-50">{cat.title}</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.intro}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    catDone === catTotal
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {catDone} / {catTotal}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cat.auto?.map(item => {
                    const isDone = item.done(settings);
                    return (
                      <div key={item.key} className="px-5 py-3 flex items-start gap-3">
                        <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-gray-300 dark:border-gray-600 bg-transparent'
                        }`}>
                          {isDone && <CheckCircleIcon className="w-4 h-4" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${isDone ? 'text-gray-900 dark:text-cream-100' : 'text-gray-700 dark:text-gray-300'}`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              Auto
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}

                  {cat.manual?.map(item => {
                    const isDone = ticked.has(item.key);
                    return (
                      <div key={item.key} className="px-5 py-3 flex items-start gap-3">
                        <button
                          onClick={() => toggleManual(item.key)}
                          disabled={saving}
                          aria-label={`Marquer « ${item.title} » comme ${isDone ? 'à faire' : 'fait'}`}
                          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 ${
                            isDone
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:border-emerald-400'
                          }`}
                        >
                          {isDone && <CheckCircleIcon className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDone ? 'text-gray-900 dark:text-cream-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                          {item.cta && (
                            <a
                              href={item.cta.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-cream-700 dark:text-cream-400 hover:underline mt-1.5"
                            >
                              {item.cta.label}
                              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
