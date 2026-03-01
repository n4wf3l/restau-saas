<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Return the shared restaurant settings.
     */
    public function show(Request $request)
    {
        $settings = RestaurantSetting::first();

        if (!$settings) {
            $settings = RestaurantSetting::create(['user_id' => $request->user()->id]);
        }

        return response()->json($settings);
    }

    /**
     * PUT /api/settings
     * Update the shared restaurant settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'reservations_enabled'     => 'sometimes|boolean',
            'service_duration_minutes' => 'sometimes|integer|min:15|max:480',
            'buffer_minutes'           => 'sometimes|integer|min:0|max:120',
            'max_occupancy_pct'        => 'sometimes|integer|min:10|max:100',
            'auto_optimize_tables'     => 'sometimes|boolean',
            'auto_confirm'             => 'sometimes|boolean',
            'send_confirmation_email'  => 'sometimes|boolean',
            'opening_hours'            => 'sometimes|nullable|array',
            'opening_hours.*.open'     => 'required_with:opening_hours|string',
            'opening_hours.*.close'    => 'required_with:opening_hours|string',
            'opening_hours.*.closed'   => 'required_with:opening_hours|boolean',
            'closure_dates'            => 'sometimes|nullable|array',
            'closure_dates.*.date'     => 'required_with:closure_dates|date',
            'closure_dates.*.reason'   => 'nullable|string|max:255',
            'menu_manual_visible'      => 'sometimes|boolean',
            'menu_pdf_visible'         => 'sometimes|boolean',
        ]);

        $settings = RestaurantSetting::first();

        if (!$settings) {
            $settings = RestaurantSetting::create(array_merge($validated, ['user_id' => $request->user()->id]));
        } else {
            $settings->update($validated);
        }

        return response()->json($settings->fresh());
    }

    /**
     * GET /api/public/settings
     * Return only public-facing settings (no auth required).
     */
    public function publicShow()
    {
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
        ]);
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

        $settings = RestaurantSetting::first();

        if (!$settings) {
            $settings = RestaurantSetting::create(['user_id' => $request->user()->id]);
        }

        // Delete old PDF if exists
        if ($settings->menu_pdf_url) {
            $oldPath = str_replace('/storage/', '', $settings->menu_pdf_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('pdf')->store('menu-pdfs', 'public');
        $settings->update(['menu_pdf_url' => '/storage/' . $path]);

        return response()->json($settings->fresh());
    }

    /**
     * DELETE /api/settings/menu-pdf
     * Remove the uploaded PDF menu.
     */
    public function deleteMenuPdf(Request $request)
    {
        $settings = RestaurantSetting::first();

        if ($settings && $settings->menu_pdf_url) {
            $oldPath = str_replace('/storage/', '', $settings->menu_pdf_url);
            Storage::disk('public')->delete($oldPath);
            $settings->update(['menu_pdf_url' => null]);
        }

        return response()->json(['message' => 'PDF supprimé']);
    }
}
