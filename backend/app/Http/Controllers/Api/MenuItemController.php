<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $menuItems = MenuItem::where('user_id', $request->user()->id)
            ->orderBy('order')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json($menuItems);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ingredients' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_halal' => 'boolean',
            'image_url' => 'nullable|url',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ]);

        $validated['user_id'] = $request->user()->id;

        $menuItem = MenuItem::create($validated);

        return response()->json($menuItem, 201);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        // Check ownership
        if ($menuItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'ingredients' => 'nullable|string',
            'price' => 'numeric|min:0',
            'is_halal' => 'boolean',
            'image_url' => 'nullable|url',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ]);

        $menuItem->update($validated);

        return response()->json($menuItem);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        // Check ownership
        if ($menuItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $menuItem->delete();

        return response()->json(['message' => 'Menu item deleted']);
    }
}
