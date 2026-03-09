<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index()
    {
        $restaurants = Restaurant::with(['users', 'modules', 'settings'])
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

        $restaurant->update($validated);

        return response()->json($restaurant->fresh()->load(['users', 'modules']));
    }

    public function updateModules(Request $request, Restaurant $restaurant)
    {
        $validated = $request->validate([
            'reservations_enabled' => 'sometimes|boolean',
            'menu_enabled'         => 'sometimes|boolean',
            'website_enabled'      => 'sometimes|boolean',
        ]);

        $modules = $restaurant->modules;
        if ($modules) {
            $modules->update($validated);
        }

        return response()->json($restaurant->fresh()->load('modules'));
    }
}
