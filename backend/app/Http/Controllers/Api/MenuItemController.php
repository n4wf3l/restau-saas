<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MenuItemController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    public function index()
    {
        $rid = $this->tc()->id();
        return response()->json(
            MenuItem::where('restaurant_id', $rid)
                ->orderBy('order')->orderBy('category')->orderBy('name')->get()
        );
    }

    public function publicIndex()
    {
        $rid = $this->tc()->id();

        return Cache::remember("public_menu_items:{$rid}", 1800, function () use ($rid) {
            return response()->json(
                MenuItem::where('restaurant_id', $rid)
                    ->where('is_available', true)
                    ->orderBy('order')->orderBy('category')->orderBy('name')->get()
            );
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
        $validated['restaurant_id'] = $this->tc()->id();

        $menuItem = MenuItem::create($validated);
        Cache::forget("public_menu_items:{$this->tc()->id()}");

        return response()->json($menuItem, 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $this->deleteStorageFile($menuItem->image_url, 'menu-images/');
            $path = $request->file('image')->store('menu-images', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        unset($validated['image']);
        $menuItem->update($validated);
        Cache::forget("public_menu_items:{$this->tc()->id()}");

        return response()->json($menuItem);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        $this->deleteStorageFile($menuItem->image_url, 'menu-images/');
        $menuItem->delete();
        Cache::forget("public_menu_items:{$this->tc()->id()}");

        return response()->json(['message' => 'Menu item deleted']);
    }
}
