import { Helmet } from 'react-helmet-async';

/**
 * SEO for the SaaS marketing pages (/, /login, /register, /embed/reserve).
 *
 * Kept intentionally separate from TenantSEO — this component sells "NA Innovations
 * the platform" and MUST NEVER be mounted on tenant routes. Restaurant sites use
 * TenantSEO which pulls dynamic per-tenant title/description/JSON-LD from
 * `usePublicSettings()`.
 *
 * Pass `page="landing"` for the home marketing page (emits SoftwareApplication
 * + Organization JSON-LD), or `page="auth"` for login/register (noindex).
 */

interface SaasSEOProps {
  page: 'landing' | 'auth' | 'embed';
  /** Optional per-page overrides. Fallback values below are SaaS defaults. */
  title?: string;
  description?: string;
}

const DEFAULTS = {
  landing: {
    title: 'NA Innovations — SaaS de réservation pour restaurants',
    description: 'La plateforme sur-mesure qui aide les restaurants à digitaliser leur activité : réservations en ligne, gestion de menu, site web professionnel, référencement local. Développé au Maroc.',
  },
  auth: {
    title: 'Espace client — NA Innovations',
    description: 'Connexion à votre espace de gestion.',
  },
  embed: {
    title: 'Réservation',
    description: 'Réservez votre table en ligne.',
  },
};

const BRAND = 'NA Innovations';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://na-innovations.com';

export function SaasSEO({ page, title, description }: SaasSEOProps) {
  const t = title ?? DEFAULTS[page].title;
  const d = description ?? DEFAULTS[page].description;
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : undefined;

  // Auth + embed pages: noindex — keep them out of Google to avoid indexing
  // login/register (weak SEO value + wastes crawl budget) and the iframe endpoint.
  const shouldIndex = page === 'landing';

  const softwareLd = page === 'landing' ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: d,
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MAD',
      description: 'Tarif sur devis selon les modules activés',
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Restaurateurs',
    },
    inLanguage: ['fr', 'en', 'ar'],
  } : null;

  const orgLd = page === 'landing' ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Éditeur de logiciels sur-mesure pour restaurants au Maroc.',
    // sameAs and contactPoint intentionally omitted until you provide real social/support URLs
  } : null;

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      {!shouldIndex && <meta name="robots" content="noindex,nofollow" />}
      {shouldIndex && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={`${SITE_URL}/logo.png`} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />

      {/* Reset favicon to the SaaS one — tenant pages override this with the tenant logo */}
      <link rel="icon" type="image/png" href="/logo.png" />

      {/* JSON-LD graph (landing only) */}
      {softwareLd && (
        <script type="application/ld+json">
          {JSON.stringify(softwareLd)}
        </script>
      )}
      {orgLd && (
        <script type="application/ld+json">
          {JSON.stringify(orgLd)}
        </script>
      )}
    </Helmet>
  );
}
