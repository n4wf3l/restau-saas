<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Return the authenticated user's restaurant settings.
     */
    public function show(Request $request)
    {
        $settings = RestaurantSetting::where('user_id', $request->user()->id)->first();

        if (!$settings) {
            $settings = RestaurantSetting::create(['user_id' => $request->user()->id]);
        }

        return response()->json($settings);
    }

    /**
     * PUT /api/settings
     * Update the authenticated user's restaurant settings.
     */
    public function update(UpdateSettingsRequest $request)
    {
        $validated = $request->validated();

        $settings = RestaurantSetting::where('user_id', $request->user()->id)->first();

        if (!$settings) {
            $settings = RestaurantSetting::create(array_merge($validated, ['user_id' => $request->user()->id]));
        } else {
            $settings->update($validated);
        }

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

        $settings = RestaurantSetting::where('user_id', $request->user()->id)->first();

        if (!$settings) {
            $settings = RestaurantSetting::create(['user_id' => $request->user()->id]);
        }

        // Delete old PDF if exists (validate path prefix)
        if ($settings->menu_pdf_url) {
            $oldPath = str_replace('/storage/', '', $settings->menu_pdf_url);
            if (str_starts_with($oldPath, 'menu-pdfs/')) {
                Storage::disk('public')->delete($oldPath);
            }
        }

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
        $settings = RestaurantSetting::where('user_id', $request->user()->id)->first();

        if ($settings && $settings->menu_pdf_url) {
            $oldPath = str_replace('/storage/', '', $settings->menu_pdf_url);
            if (str_starts_with($oldPath, 'menu-pdfs/')) {
                Storage::disk('public')->delete($oldPath);
            }
            $settings->update(['menu_pdf_url' => null]);
        }

        Cache::forget('public_settings');

        return response()->json(['message' => 'PDF supprimé']);
    }
}
