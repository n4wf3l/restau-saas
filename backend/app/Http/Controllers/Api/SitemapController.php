<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantModule;
use App\Services\TenantContext;
use Illuminate\Http\Response;

/**
 * Per-tenant XML sitemap. Emits every public sub-page that the tenant's
 * modules currently expose (so a menu-only restaurant doesn't advertise a
 * /contact URL that would 404). Submit the returned URL to Google Search
 * Console for the restaurant's domain.
 */
class SitemapController extends Controller
{
    public function index()
    {
        $tc = app(TenantContext::class);
        $restaurant = $tc->require();

        $slug = $restaurant->slug;
        $modules = $restaurant->modules ?? RestaurantModule::where('restaurant_id', $restaurant->id)->first();

        $base = rtrim(env('FRONTEND_URL', config('app.url') ?: 'http://localhost:5174'), '/');
        $prefix = "{$base}/r/{$slug}";

        // Homepage + optional pages, each gated by the matching module.
        $pages = [['loc' => $prefix, 'priority' => '1.0', 'changefreq' => 'weekly']];

        if ($modules?->menu_enabled) {
            $pages[] = ['loc' => "{$prefix}/menu", 'priority' => '0.9', 'changefreq' => 'weekly'];
        }
        if ($modules?->gallery_enabled) {
            $pages[] = ['loc' => "{$prefix}/gallery", 'priority' => '0.6', 'changefreq' => 'monthly'];
        }
        if ($modules?->reservations_enabled) {
            $pages[] = ['loc' => "{$prefix}/reservation", 'priority' => '0.9', 'changefreq' => 'monthly'];
        }
        if ($modules?->contact_enabled) {
            $pages[] = ['loc' => "{$prefix}/contact", 'priority' => '0.7', 'changefreq' => 'monthly'];
        }
        // Legal pages — low priority but should be indexed
        $pages[] = ['loc' => "{$prefix}/privacy", 'priority' => '0.2', 'changefreq' => 'yearly'];
        $pages[] = ['loc' => "{$prefix}/terms",   'priority' => '0.2', 'changefreq' => 'yearly'];

        $updated = optional($restaurant->updated_at)->toIso8601String() ?? now()->toIso8601String();

        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($pages as $p) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($p['loc'], ENT_XML1) . "</loc>\n";
            $xml .= "    <lastmod>{$updated}</lastmod>\n";
            $xml .= "    <changefreq>{$p['changefreq']}</changefreq>\n";
            $xml .= "    <priority>{$p['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }
        $xml .= '</urlset>' . "\n";

        return response($xml, 200, [
            'Content-Type'  => 'application/xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
