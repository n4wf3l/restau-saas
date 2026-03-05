<?php

namespace App\Http\Middleware;

use App\Models\Domain;
use App\Models\Restaurant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tc = app(TenantContext::class);

        // 1. Try query param ?tenant=<slug>
        $slug = $request->query('tenant') ?: $request->header('X-Tenant');

        if ($slug) {
            $restaurant = Restaurant::where('slug', $slug)->first();
            if (!$restaurant) {
                return response()->json(['error' => 'Restaurant not found'], 404);
            }
            $tc->set($restaurant);
            return $next($request);
        }

        // 2. Fallback: try Host header in domains table
        $host = $request->getHost();
        $domain = Domain::with('restaurant')->where('domain', $host)->first();

        if ($domain && $domain->restaurant) {
            $tc->set($domain->restaurant);
            return $next($request);
        }

        // 3. Dev fallback: if only one restaurant exists, use it
        $count = Restaurant::count();
        if ($count === 1) {
            $tc->set(Restaurant::first());
            return $next($request);
        }

        return response()->json(['error' => 'Tenant not specified. Use ?tenant=<slug> or X-Tenant header.'], 404);
    }
}
