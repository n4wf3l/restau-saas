<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\RestaurantModule;
use App\Models\RestaurantSetting;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    private function getSettings(): RestaurantSetting
    {
        $rid = $this->tc()->id();
        return RestaurantSetting::where('restaurant_id', $rid)
            ->firstOrCreate(['restaurant_id' => $rid]);
    }

    public function show(Request $request)
    {
        return response()->json($this->getSettings());
    }

    public function update(UpdateSettingsRequest $request)
    {
        $settings = $this->getSettings();
        $settings->update($request->validated());
        Cache::forget("public_settings:{$this->tc()->id()}");
        return response()->json($settings->fresh());
    }

    public function publicShow()
    {
        $rid = $this->tc()->id();
        $restaurant = $this->tc()->get();

        return Cache::remember("public_settings:{$rid}", 3600, function () use ($rid, $restaurant) {
            $settings = RestaurantSetting::where('restaurant_id', $rid)->first();
            $modules  = RestaurantModule::where('restaurant_id', $rid)->first();

            // Superadmin module OFF wins over any tenant setting. This is the
            // single source of truth the frontend consumes to hide nav items,
            // routes and CTAs.
            $reservationsAllowed = ($modules?->reservations_enabled ?? true)
                && ($settings?->reservations_enabled ?? true);

            // Theme/layout: module override (if set) wins over tenant setting.
            $theme  = $modules?->theme  ?? $settings?->theme  ?? 'coffee';
            $layout = $modules?->layout ?? $settings?->layout ?? 'classic';

            $moduleFlags = [
                'reservations_enabled' => (bool) ($modules?->reservations_enabled ?? true),
                'menu_enabled'         => (bool) ($modules?->menu_enabled         ?? true),
                'website_enabled'      => (bool) ($modules?->website_enabled      ?? true),
                'contact_enabled'      => (bool) ($modules?->contact_enabled      ?? true),
                'gallery_enabled'      => (bool) ($modules?->gallery_enabled      ?? true),
                'events_enabled'       => (bool) ($modules?->events_enabled       ?? true),
                'cancellation_enabled' => (bool) ($modules?->cancellation_enabled ?? true),
            ];

            return response()->json([
                'restaurant_status'        => $restaurant?->status ?? 'active',
                'modules'                  => $moduleFlags,
                'reservations_enabled'     => $reservationsAllowed,
                'auto_optimize_tables'     => (bool) ($settings?->auto_optimize_tables ?? false),
                'service_duration_minutes' => (int)  ($settings?->service_duration_minutes ?? 90),
                'opening_hours'            => $settings?->opening_hours,
                'closure_dates'            => $settings?->closure_dates,
                'menu_pdf_url'             => $settings?->menu_pdf_url,
                'menu_manual_visible'      => (bool) ($settings?->menu_manual_visible ?? true),
                'menu_pdf_visible'         => (bool) ($settings?->menu_pdf_visible ?? false),
                'social_links'             => $settings?->social_links,
                'restaurant_name'          => $settings?->restaurant_name ?? $restaurant?->name ?? 'Mon Restaurant',
                'logo_url'                 => $settings?->logo_url,
                'theme'                    => $theme,
                'layout'                   => $layout,
                // SEO — exposed on the public settings endpoint so TenantSEO and
                // the future sitemap can render the same data the tenant edited.
                'meta_description'         => $settings?->meta_description,
                'meta_keywords'            => $settings?->meta_keywords,
                'og_image_url'             => $settings?->og_image_url,
                'address'                  => $settings?->address,
                'phone'                    => $settings?->phone,
                'cuisine_type'             => $settings?->cuisine_type,
                'price_range'              => $settings?->price_range,
            ]);
        });
    }

    public function uploadMenuPdf(Request $request)
    {
        $request->validate(['pdf' => 'required|file|mimes:pdf|max:10240']);
        $settings = $this->getSettings();
        $this->deleteStorageFile($settings->menu_pdf_url, 'menu-pdfs/');
        $path = $request->file('pdf')->store('menu-pdfs', 'public');
        $settings->update(['menu_pdf_url' => '/storage/' . $path]);
        Cache::forget("public_settings:{$this->tc()->id()}");
        return response()->json($settings->fresh());
    }

    public function deleteMenuPdf(Request $request)
    {
        $settings = $this->getSettings();
        if ($settings->menu_pdf_url) {
            $this->deleteStorageFile($settings->menu_pdf_url, 'menu-pdfs/');
            $settings->update(['menu_pdf_url' => null]);
        }
        Cache::forget("public_settings:{$this->tc()->id()}");
        return response()->json(['message' => 'PDF supprimé']);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate(['logo' => 'required|image|max:5120']);
        $settings = $this->getSettings();
        $this->deleteStorageFile($settings->logo_url, 'logos/');
        $path = $request->file('logo')->store('logos', 'public');
        $settings->update(['logo_url' => '/storage/' . $path]);
        Cache::forget("public_settings:{$this->tc()->id()}");
        return response()->json($settings->fresh());
    }

    public function deleteLogo(Request $request)
    {
        $settings = $this->getSettings();
        if ($settings->logo_url) {
            $this->deleteStorageFile($settings->logo_url, 'logos/');
            $settings->update(['logo_url' => null]);
        }
        Cache::forget("public_settings:{$this->tc()->id()}");
        return response()->json(['message' => 'Logo supprimé']);
    }
}
