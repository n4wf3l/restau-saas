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
     * Body: { tenant: "<slug>", user_id?: number }
     *
     * If `user_id` is provided, logs in that specific user (assuming they're
     * attached to the given restaurant). Otherwise picks the *first non-admin*
     * user attached to the restaurant — platform admins that happen to share
     * a restaurant_id must never be picked as "the owner" (else logging in
     * from a tenant's page surfaces the superadmin console — real bug we hit
     * on 2026-08-10, hence this rule).
     */
    public function loginAsOwner(Request $request)
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        $validated = $request->validate([
            'tenant'  => 'required|string|max:255',
            'user_id' => 'sometimes|integer',
        ]);

        $restaurant = Restaurant::where('slug', $validated['tenant'])->first();
        if (!$restaurant) {
            return response()->json(['error' => 'Restaurant not found'], 404);
        }

        $owner = isset($validated['user_id'])
            ? $restaurant->users()->where('id', $validated['user_id'])->first()
            : ($restaurant->users()->where('role', '!=', 'admin')->first()
                ?? $restaurant->users()->first());

        if (!$owner) {
            return response()->json([
                'error' => 'No user attached to this restaurant',
            ], 404);
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
     * List all tenants + every user attached to them (id, name, email, role).
     * Used by the Login page dev banner so the developer can see who exists
     * and pick a specific user to impersonate. A tenant may have both a
     * platform admin and a real owner attached (dev artifact) — surfacing
     * both makes that visible.
     */
    public function listTenants()
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        return response()->json(
            Restaurant::with(['users:id,name,email,role,restaurant_id'])
                ->orderBy('name')
                ->get()
                ->map(fn ($r) => [
                    'slug'   => $r->slug,
                    'name'   => $r->name,
                    'status' => $r->status,
                    'users'  => $r->users->map(fn ($u) => [
                        'id'    => $u->id,
                        'name'  => $u->name,
                        'email' => $u->email,
                        'role'  => $u->role,
                    ])->values(),
                    // Convenience: the user the "quick login" button will pick
                    // if no explicit user_id is passed (first non-admin).
                    'default_user' => (function () use ($r) {
                        $u = $r->users->firstWhere('role', '!=', 'admin') ?? $r->users->first();
                        return $u ? [
                            'id'    => $u->id,
                            'email' => $u->email,
                            'role'  => $u->role,
                        ] : null;
                    })(),
                ])
        );
    }
}
