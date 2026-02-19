<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class FloorPlanController extends Controller
{
    /**
     * Get the current user's floor plan with items
     */
    public function current(Request $request)
    {
        $floorPlan = $request->user()->floorPlan()->with('items')->first();

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        return response()->json($floorPlan);
    }

    /**
     * Update the current user's floor plan (name, width, height)
     */
    public function update(Request $request)
    {
        $floorPlan = $request->user()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'width' => 'sometimes|integer|min:5|max:100',
            'height' => 'sometimes|integer|min:5|max:100',
            'floors' => 'sometimes|array',
            'floors.*.level' => 'required_with:floors|integer|min:1',
            'floors.*.name' => 'required_with:floors|string|max:255',
        ]);

        $floorPlan->update($validated);

        return response()->json($floorPlan);
    }
}
