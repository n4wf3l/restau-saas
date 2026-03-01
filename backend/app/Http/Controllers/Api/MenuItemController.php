<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MenuItemController extends Controller
{
    public function index()
    {
        $menuItems = MenuItem::orderBy('order')
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
            $this->deleteStorageFile($menuItem->image_url, 'menu-images/');
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
        // Delete image file if exists
        $this->deleteStorageFile($menuItem->image_url, 'menu-images/');

        $menuItem->delete();

        Cache::forget('public_menu_items');

        return response()->json(['message' => 'Menu item deleted']);
    }
}
