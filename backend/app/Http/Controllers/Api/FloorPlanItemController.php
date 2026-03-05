<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TenantContext;
use Illuminate\Http\Request;

class FloorPlanItemController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    public function bulkUpsert(Request $request)
    {
        $floorPlan = $this->tc()->require()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'items'            => 'required|array',
            'items.*.id'       => 'sometimes|integer|exists:restaurant_floor_plan_items,id',
            'items.*.type'     => 'required|string|in:table,chair,wall,empty',
            'items.*.x'        => 'required|integer|min:0',
            'items.*.y'        => 'required|integer|min:0',
            'items.*.rotation' => 'sometimes|integer|in:0,90,180,270',
            'items.*.meta'     => 'sometimes|array',
            'items.*.floor_level' => 'sometimes|integer|min:1',
            'items.*.floor_name'  => 'sometimes|string|nullable',
            'items.*.table_name'  => 'sometimes|string|nullable|max:100',
        ]);

        $floorPlan->items()->delete();

        $items = [];
        foreach ($validated['items'] as $itemData) {
            $items[] = $floorPlan->items()->create([
                'type'        => $itemData['type'],
                'x'           => $itemData['x'],
                'y'           => $itemData['y'],
                'rotation'    => $itemData['rotation'] ?? 0,
                'meta'        => $itemData['meta'] ?? null,
                'floor_level' => $itemData['floor_level'] ?? 1,
                'floor_name'  => $itemData['floor_name'] ?? null,
                'table_name'  => $itemData['table_name'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Items saved successfully',
            'items'   => $items,
        ]);
    }

    public function store(Request $request)
    {
        $floorPlan = $this->tc()->require()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'type'       => 'required|string|in:table,chair,wall,empty',
            'x'          => 'required|integer|min:0',
            'y'          => 'required|integer|min:0',
            'rotation'   => 'sometimes|integer|in:0,90,180,270',
            'meta'       => 'sometimes|array',
            'table_name' => 'sometimes|string|nullable|max:100',
        ]);

        $existingItem = $floorPlan->items()
            ->where('x', $validated['x'])
            ->where('y', $validated['y'])
            ->first();

        if ($existingItem) {
            $existingItem->update($validated);
            return response()->json($existingItem);
        }

        $item = $floorPlan->items()->create($validated);
        return response()->json($item, 201);
    }

    public function destroy(Request $request, $id)
    {
        $floorPlan = $this->tc()->require()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $item = $floorPlan->items()->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}
