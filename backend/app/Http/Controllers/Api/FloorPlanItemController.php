<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlanItem;
use Illuminate\Http\Request;

class FloorPlanItemController extends Controller
{
    /**
     * Bulk upsert items (save all items at once)
     */
    public function bulkUpsert(Request $request)
    {
        $floorPlan = $request->user()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'sometimes|integer|exists:restaurant_floor_plan_items,id',
            'items.*.type' => 'required|string|in:table,chair,wall,empty',
            'items.*.x' => 'required|integer|min:0',
            'items.*.y' => 'required|integer|min:0',
            'items.*.rotation' => 'sometimes|integer|in:0,90,180,270',
            'items.*.meta' => 'sometimes|array',
        ]);

        // Delete all existing items for this floor plan
        $floorPlan->items()->delete();

        // Create new items
        $items = [];
        foreach ($validated['items'] as $itemData) {
            $items[] = $floorPlan->items()->create([
                'type' => $itemData['type'],
                'x' => $itemData['x'],
                'y' => $itemData['y'],
                'rotation' => $itemData['rotation'] ?? 0,
                'meta' => $itemData['meta'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Items saved successfully',
            'items' => $items,
        ]);
    }

    /**
     * Add a single item
     */
    public function store(Request $request)
    {
        $floorPlan = $request->user()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:table,chair,wall,empty',
            'x' => 'required|integer|min:0',
            'y' => 'required|integer|min:0',
            'rotation' => 'sometimes|integer|in:0,90,180,270',
            'meta' => 'sometimes|array',
        ]);

        // Check if an item already exists at this position
        $existingItem = $floorPlan->items()
            ->where('x', $validated['x'])
            ->where('y', $validated['y'])
            ->first();

        if ($existingItem) {
            // Update existing item
            $existingItem->update($validated);
            return response()->json($existingItem);
        }

        // Create new item
        $item = $floorPlan->items()->create($validated);

        return response()->json($item, 201);
    }

    /**
     * Delete an item
     */
    public function destroy(Request $request, $id)
    {
        $floorPlan = $request->user()->floorPlan;

        if (!$floorPlan) {
            return response()->json(['message' => 'No floor plan found'], 404);
        }

        $item = $floorPlan->items()->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}
