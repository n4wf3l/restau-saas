<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks dashboard/API access when the tenant's restaurant is not `active`.
 * Superadmins are exempt so they can moderate from any account.
 * Chain AFTER `auth.tenant` so TenantContext is populated.
 */
class EnsureRestaurantActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Platform admins bypass — they need to reach /api/admin/* regardless
        // of their own restaurant's status.
        if ($user && $user->role === 'admin') {
            return $next($request);
        }

        $restaurant = app(TenantContext::class)->get();
        if (!$restaurant) {
            return response()->json(['error' => 'No restaurant associated'], 403);
        }

        if ($restaurant->status !== 'active') {
            return response()->json([
                'error'  => 'restaurant_not_active',
                'status' => $restaurant->status,
                'message' => $restaurant->status === 'pending'
                    ? 'Votre compte est en attente de validation par notre équipe.'
                    : 'Votre compte est suspendu. Contactez le support.',
            ], 403);
        }

        return $next($request);
    }
}
