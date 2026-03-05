<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveAuthTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->restaurant) {
            return response()->json(['error' => 'No restaurant associated with this user'], 403);
        }

        app(TenantContext::class)->set($user->restaurant);

        return $next($request);
    }
}
