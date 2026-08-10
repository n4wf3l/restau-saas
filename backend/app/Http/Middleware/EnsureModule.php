<?php

namespace App\Http\Middleware;

use App\Models\RestaurantModule;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route-level gate for feature modules. Usage: ->middleware('feature:menu')
 * where the argument matches the module flag *without* the `_enabled` suffix
 * (menu, reservations, contact, gallery, events, cancellation, website).
 *
 * Superadmins bypass so /api/admin/* stays reachable regardless of module
 * state. Requires the tenant to be resolved beforehand (chain after
 * `tenant` or `auth.tenant`).
 */
class EnsureModule
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'admin') {
            return $next($request);
        }

        $flag = $feature . '_enabled';
        if (!in_array($flag, RestaurantModule::FEATURE_FLAGS, true)) {
            // Programmer error, not a client error — 500 makes it loud.
            abort(500, "Unknown feature module: {$feature}");
        }

        $restaurant = app(TenantContext::class)->get();
        if (!$restaurant) {
            return response()->json(['error' => 'Tenant not resolved'], 404);
        }

        $modules = $restaurant->modules ?? $restaurant->modules()->first();
        $enabled = $modules ? (bool) $modules->{$flag} : false;

        if (!$enabled) {
            return response()->json([
                'error'   => 'module_disabled',
                'module'  => $feature,
                'message' => "Cette fonctionnalité n'est pas activée pour ce restaurant.",
            ], 403);
        }

        return $next($request);
    }
}
