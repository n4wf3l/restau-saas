import { Helmet } from 'react-helmet-async';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { useSiteImages } from '../contexts/SiteImagesContext';
import { API_BASE_URL, resolveLogoUrl } from '../lib/api';
import type { OpeningHours } from '../lib/types';

/**
 * Per-tenant SEO metadata for /r/:slug/* routes.
 *
 * Sets a dynamic <title>, meta description, Open Graph and Twitter card tags
 * based on the current restaurant + the sub-page (home / menu / gallery / contact).
 * Also emits schema.org/Restaurant JSON-LD so Google can render the rich
 * business card in local search (address, phone, hours, price range, cuisine).
 *
 * Google renders JS so <title> and description will be indexed correctly.
 * OG tags will show in browser tab / bookmarks, but social crawlers (Facebook,
 * LinkedIn, Twitter) usually don't run JS — proper social preview would need
 * SSR or a pre-render step. This is documented as a follow-up.
 */

const SUBPAGES: Record<string, { titleKey: string; descKey: string }> = {
  '':           { titleKey: 'nav.home',     descKey: 'home.hero.tagline' },
  'gallery':    { titleKey: 'nav.gallery',  descKey: 'gallery.desc' },
  'menu':       { titleKey: 'nav.menu',     descKey: 'menu.desc' },
  'contact':    { titleKey: 'nav.contact',  descKey: 'contact.desc' },
  'reservation':{ titleKey: 'nav.reserve',  descKey: 'home.reservation.desc' },
  'privacy':    { titleKey: 'footer.privacy',descKey: '' },
  'terms':      { titleKey: 'footer.terms', descKey: '' },
};

/** schema.org OpeningHoursSpecification day names */
const DAY_MAP: Record<string, string> = {
  monday:    'Monday',
  tuesday:   'Tuesday',
  wednesday: 'Wednesday',
  thursday:  'Thursday',
  friday:    'Friday',
  saturday:  'Saturday',
  sunday:    'Sunday',
};

function buildOpeningHoursSpec(hours: OpeningHours | null | undefined) {
  if (!hours) return undefined;
  const spec: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string;
    opens: string;
    closes: string;
  }> = [];
  Object.entries(hours).forEach(([day, h]) => {
    if (!h || h.closed || !h.open || !h.close) return;
    const dayName = DAY_MAP[day];
    if (!dayName) return;
    spec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayName,
      opens: h.open,
      closes: h.close,
    });
  });
  return spec.length ? spec : undefined;
}

export function TenantSEO() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const settings = usePublicSettings();
  const siteImages = useSiteImages();

  const restaurantName = settings?.restaurant_name || slug || '';
  const logoUrl = resolveLogoUrl(settings?.logo_url) || undefined;
  const heroImage = siteImages?.hero?.[0]?.image_url;
  // Precedence: tenant-provided og_image_url > hero image > logo
  const tenantOg = settings?.og_image_url || null;
  const ogImage = tenantOg
    ? (tenantOg.startsWith('http') ? tenantOg : window.location.origin + tenantOg)
    : heroImage
      ? (heroImage.startsWith('http') ? heroImage : window.location.origin + heroImage)
      : logoUrl;

  // Detect sub-page from the URL segment after /r/:slug/
  const segments = location.pathname.split('/').filter(Boolean); // ['r', slug, sub?]
  const subKey = segments[2] || '';
  const sub = SUBPAGES[subKey] || SUBPAGES[''];

  // Build title: "<Section> — <Restaurant>" (home has just the name)
  const sectionTitle = subKey ? t(sub.titleKey, { restaurantName }) : '';
  const title = sectionTitle && subKey ? `${sectionTitle} — ${restaurantName}` : restaurantName;
  // Tenant-authored description wins on the homepage; sub-pages keep the i18n fallback
  // to avoid every page having identical meta description.
  const description = (!subKey && settings?.meta_description)
    ? settings.meta_description
    : sub.descKey
      ? t(sub.descKey, { restaurantName })
      : t('home.hero.tagline');

  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${location.pathname}`
    : undefined;
  const restaurantUrl = typeof window !== 'undefined' && slug
    ? `${window.location.origin}/r/${slug}`
    : undefined;

  // JSON-LD schema.org/Restaurant. Only emit on the homepage to avoid duplicate
  // graphs across sub-pages (Google prefers one canonical business entity per site).
  const emitJsonLd = subKey === '' && settings;
  const openingHoursSpec = emitJsonLd ? buildOpeningHoursSpec(settings.opening_hours) : undefined;
  const sameAs = emitJsonLd && settings.social_links
    ? Object.values(settings.social_links)
        .filter((l): l is { enabled: boolean; url: string } => !!l && l.enabled && !!l.url)
        .map(l => l.url)
    : [];

  const jsonLd = emitJsonLd
    ? {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurantName,
        ...(description ? { description } : {}),
        ...(restaurantUrl ? { url: restaurantUrl } : {}),
        ...(logoUrl ? { logo: logoUrl } : {}),
        ...(ogImage ? { image: ogImage } : {}),
        ...(settings.phone ? { telephone: settings.phone } : {}),
        ...(settings.address
          ? {
              address: {
                '@type': 'PostalAddress',
                streetAddress: settings.address,
              },
            }
          : {}),
        ...(settings.cuisine_type ? { servesCuisine: settings.cuisine_type } : {}),
        ...(settings.price_range ? { priceRange: settings.price_range } : {}),
        ...(openingHoursSpec ? { openingHoursSpecification: openingHoursSpec } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        acceptsReservations: settings.reservations_enabled,
      }
    : null;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {settings?.meta_keywords && <meta name="keywords" content={settings.meta_keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="restaurant.restaurant" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={restaurantName} />
      <meta property="og:locale" content={i18n.language} />

      {/* Twitter card */}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Favicon override — use the restaurant's logo if uploaded */}
      {logoUrl && <link rel="icon" type="image/png" href={logoUrl} />}

      {/* Sitemap discovery — Google auto-fetches this. Points at the tenant-aware backend endpoint. */}
      {slug && (
        <link
          rel="sitemap"
          type="application/xml"
          href={`${API_BASE_URL}/api/public/sitemap?tenant=${slug}`}
        />
      )}

      {/* schema.org/Restaurant JSON-LD (homepage only) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
