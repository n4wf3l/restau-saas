<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    private function getSettings(): RestaurantSetting
    {
        return RestaurantSetting::firstOrCreate([]);
    }

    /**
     * GET /api/settings
     * Return the authenticated user's restaurant settings.
     */
    public function show(Request $request)
    {
        return response()->json($this->getSettings());
    }

    /**
     * PUT /api/settings
     * Update the authenticated user's restaurant settings.
     */
    public function update(UpdateSettingsRequest $request)
    {
        $settings = $this->getSettings();
        $settings->update($request->validated());

        Cache::forget('public_settings');

        return response()->json($settings->fresh());
    }

    /**
     * GET /api/public/settings
     * Return only public-facing settings (no auth required).
     */
    public function publicShow()
    {
        return Cache::remember('public_settings', 3600, function () {
            $settings = RestaurantSetting::first();

            if ($settings) {
                return response()->json([
                    'reservations_enabled' => (bool) $settings->reservations_enabled,
                    'auto_optimize_tables' => (bool) $settings->auto_optimize_tables,
                    'service_duration_minutes' => (int) $settings->service_duration_minutes,
                    'opening_hours' => $settings->opening_hours,
                    'closure_dates' => $settings->closure_dates,
                    'menu_pdf_url' => $settings->menu_pdf_url,
                    'menu_manual_visible' => (bool) $settings->menu_manual_visible,
                    'menu_pdf_visible' => (bool) $settings->menu_pdf_visible,
                    'social_links' => $settings->social_links,
                    'restaurant_name' => $settings->restaurant_name ?? 'RR Ice',
                    'logo_url' => $settings->logo_url,
                ]);
            }

            return response()->json([
                'reservations_enabled' => true,
                'auto_optimize_tables' => false,
                'service_duration_minutes' => 90,
                'opening_hours' => null,
                'closure_dates' => null,
                'menu_pdf_url' => null,
                'menu_manual_visible' => true,
                'menu_pdf_visible' => false,
                'social_links' => null,
                'restaurant_name' => 'RR Ice',
                'logo_url' => null,
            ]);
        });
    }

    /**
     * POST /api/settings/menu-pdf
     * Upload a PDF menu file.
     */
    public function uploadMenuPdf(Request $request)
    {
        $request->validate([
            'pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        $settings = $this->getSettings();

        // Delete old PDF if exists
        $this->deleteStorageFile($settings->menu_pdf_url, 'menu-pdfs/');

        $path = $request->file('pdf')->store('menu-pdfs', 'public');
        $settings->update(['menu_pdf_url' => '/storage/' . $path]);

        Cache::forget('public_settings');

        return response()->json($settings->fresh());
    }

    /**
     * DELETE /api/settings/menu-pdf
     * Remove the uploaded PDF menu.
     */
    public function deleteMenuPdf(Request $request)
    {
        $settings = $this->getSettings();

        if ($settings->menu_pdf_url) {
            $this->deleteStorageFile($settings->menu_pdf_url, 'menu-pdfs/');
            $settings->update(['menu_pdf_url' => null]);
        }

        Cache::forget('public_settings');

        return response()->json(['message' => 'PDF supprimé']);
    }

    /**
     * POST /api/settings/logo
     * Upload a logo image.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:5120',
        ]);

        $settings = $this->getSettings();

        // Delete old logo if exists
        $this->deleteStorageFile($settings->logo_url, 'logos/');

        $path = $request->file('logo')->store('logos', 'public');
        $settings->update(['logo_url' => '/storage/' . $path]);

        Cache::forget('public_settings');

        return response()->json($settings->fresh());
    }

    /**
     * DELETE /api/settings/logo
     * Remove the uploaded logo.
     */
    public function deleteLogo(Request $request)
    {
        $settings = $this->getSettings();

        if ($settings->logo_url) {
            $this->deleteStorageFile($settings->logo_url, 'logos/');
            $settings->update(['logo_url' => null]);
        }

        Cache::forget('public_settings');

        return response()->json(['message' => 'Logo supprimé']);
    }
}
