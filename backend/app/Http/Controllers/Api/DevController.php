<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Local-dev helpers. Every action here MUST guard on
 * app()->environment('local') and return 404 otherwise — nothing in this
 * controller should be reachable in staging or production.
 *
 * Rationale: developers create tenants often (RR Ice, Chez Chegrouni, new
 * demos) and don't want to remember or reset the owner password every time
 * to log in. This exposes a one-click impersonation shortcut on the Login
 * page's dev banner.
 */
class DevController extends Controller
{
    /**
     * Log the caller in as a given tenant's owner without a password.
     * Body: { tenant: "<slug>" }
     */
    public function loginAsOwner(Request $request)
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        $validated = $request->validate([
            'tenant' => 'required|string|max:255',
        ]);

        $restaurant = Restaurant::where('slug', $validated['tenant'])->first();
        if (!$restaurant) {
            return response()->json(['error' => 'Restaurant not found'], 404);
        }

        $owner = $restaurant->users()->first();
        if (!$owner) {
            return response()->json(['error' => 'No owner user for this restaurant'], 404);
        }

        Auth::login($owner);
        // Session middleware may not be attached in some test flows — regenerate
        // only when the store is actually there so we don't blow up.
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $owner->load(['restaurant.modules', 'restaurant.settings:id,restaurant_id,restaurant_name,logo_url']);

        return response()->json($owner);
    }

    /**
     * List all tenants + their owner email + their status. Used by the Login
     * page to display a dev-only banner when no tenant slug is in the URL.
     */
    public function listTenants()
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        return response()->json(
            Restaurant::with(['users:id,name,email,restaurant_id'])
                ->orderBy('name')
                ->get()
                ->map(fn ($r) => [
                    'slug'        => $r->slug,
                    'name'        => $r->name,
                    'status'      => $r->status,
                    'owner_email' => $r->users->first()->email ?? null,
                    'owner_name'  => $r->users->first()->name  ?? null,
                ])
        );
    }
}
