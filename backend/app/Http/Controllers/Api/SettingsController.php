<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Return the authenticated user's restaurant settings.
     */
    public function show(Request $request)
    {
        $settings = $request->user()->settings;

        if (!$settings) {
            $settings = $request->user()->settings()->create([]);
        }

        return response()->json($settings);
    }

    /**
     * PUT /api/settings
     * Update the authenticated user's restaurant settings.
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
        ]);

        $settings = $request->user()->settings;

        if (!$settings) {
            $settings = $request->user()->settings()->create($validated);
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
            ]);
        }

        return response()->json([
            'reservations_enabled' => true,
            'auto_optimize_tables' => false,
            'service_duration_minutes' => 90,
        ]);
    }
}
