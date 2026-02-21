<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function publicIndex()
    {
        $menuItems = MenuItem::where('is_available', true)
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
            'image' => 'nullable|image|max:5120',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu-images', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        unset($validated['image']);
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
            'image' => 'nullable|image|max:5120',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($menuItem->image_url) {
                $oldPath = str_replace('/storage/', '', $menuItem->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('menu-images', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        unset($validated['image']);
        $menuItem->update($validated);

        return response()->json($menuItem);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        // Check ownership
        if ($menuItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete image file if exists
        if ($menuItem->image_url) {
            $oldPath = str_replace('/storage/', '', $menuItem->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $menuItem->delete();

        return response()->json(['message' => 'Menu item deleted']);
    }
}
