<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
        return Cache::remember('public_menu_items', 1800, function () {
            $menuItems = MenuItem::where('is_available', true)
                ->orderBy('order')
                ->orderBy('category')
                ->orderBy('name')
                ->get();

            return response()->json($menuItems);
        });
    }

    public function store(StoreMenuItemRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu-images', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        unset($validated['image']);
        $validated['user_id'] = $request->user()->id;

        $menuItem = MenuItem::create($validated);

        Cache::forget('public_menu_items');

        return response()->json($menuItem, 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem)
    {
        // Authorization handled by UpdateMenuItemRequest::authorize()
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($menuItem->image_url) {
                $oldPath = str_replace('/storage/', '', $menuItem->image_url);
                if (str_starts_with($oldPath, 'menu-images/')) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            $path = $request->file('image')->store('menu-images', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        unset($validated['image']);
        $menuItem->update($validated);

        Cache::forget('public_menu_items');

        return response()->json($menuItem);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        if ($menuItem->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Delete image file if exists
        if ($menuItem->image_url) {
            $oldPath = str_replace('/storage/', '', $menuItem->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $menuItem->delete();

        Cache::forget('public_menu_items');

        return response()->json(['message' => 'Menu item deleted']);
    }
}
