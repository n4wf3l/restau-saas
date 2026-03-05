<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TenantContext;
use Illuminate\Http\Request;

class FloorPlanController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    public function current(Request $request)
    {
        $floorPlan = $this->tc()->require()->floorPlan()->with('items')->first();

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        return response()->json($floorPlan);
    }

    public function update(Request $request)
    {
        $floorPlan = $this->tc()->require()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'width'          => 'sometimes|integer|min:5|max:100',
            'height'         => 'sometimes|integer|min:5|max:100',
            'floors'         => 'sometimes|array',
            'floors.*.level' => 'required_with:floors|integer|min:1',
            'floors.*.name'  => 'required_with:floors|string|max:255',
        ]);

        $floorPlan->update($validated);

        return response()->json($floorPlan);
    }
}
