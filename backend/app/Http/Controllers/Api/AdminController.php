<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RestaurantActivated;
use App\Models\Restaurant;
use App\Models\RestaurantModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const ALLOWED_THEMES  = ['coffee', 'noir', 'sable'];
    private const ALLOWED_LAYOUTS = ['classic', 'cinematic'];

    public function index()
    {
        $restaurants = Restaurant::with(['users', 'modules', 'settings'])
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END")
            ->orderByDesc('created_at')
            ->get();

        return response()->json($restaurants);
    }

    public function update(Request $request, Restaurant $restaurant)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,active,suspended',
            'name'   => 'sometimes|string|max:255',
        ]);

        $previousStatus = $restaurant->status;
        $restaurant->update($validated);

        // Fire the "your account is activated" email once, on the transition
        // pending -> active. We don't fire on suspended->active because the
        // owner already knows the site; we treat that as a re-enable, not
        // an onboarding.
        if (
            isset($validated['status']) &&
            $validated['status'] === 'active' &&
            $previousStatus === 'pending'
        ) {
            $this->notifyActivation($restaurant->fresh());
        }

        Cache::forget("public_settings:{$restaurant->id}");

        return response()->json($restaurant->fresh()->load(['users', 'modules']));
    }

    public function updateModules(Request $request, Restaurant $restaurant)
    {
        $validated = $request->validate([
            'reservations_enabled' => 'sometimes|boolean',
            'menu_enabled'         => 'sometimes|boolean',
            'website_enabled'      => 'sometimes|boolean',
            'contact_enabled'      => 'sometimes|boolean',
            'gallery_enabled'      => 'sometimes|boolean',
            'events_enabled'       => 'sometimes|boolean',
            'cancellation_enabled' => 'sometimes|boolean',
            'theme'                => ['sometimes', 'nullable', Rule::in(self::ALLOWED_THEMES)],
            'layout'               => ['sometimes', 'nullable', Rule::in(self::ALLOWED_LAYOUTS)],
        ]);

        // Guarantee a modules row exists — restaurants created before the
        // feature shipped might not have one.
        $modules = $restaurant->modules
            ?? RestaurantModule::create(['restaurant_id' => $restaurant->id]);

        $modules->update($validated);

        Cache::forget("public_settings:{$restaurant->id}");

        return response()->json($restaurant->fresh()->load('modules'));
    }

    private function notifyActivation(Restaurant $restaurant): void
    {
        $owner = $restaurant->users()->first();
        if (!$owner || !$owner->email) {
            return;
        }

        try {
            Mail::to($owner->email)->queue(new RestaurantActivated($restaurant, $owner));
        } catch (\Throwable $e) {
            \Log::warning('Activation email failed', [
                'restaurant_id' => $restaurant->id,
                'err'           => $e->getMessage(),
            ]);
        }
    }
}
