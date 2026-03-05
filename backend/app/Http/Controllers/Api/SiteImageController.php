<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteImageRequest;
use App\Http\Requests\UpdateSiteImageRequest;
use App\Models\SiteImage;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SiteImageController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    public function index(Request $request)
    {
        $rid = $this->tc()->id();
        $query = SiteImage::where('restaurant_id', $rid)
            ->orderBy('category')->orderBy('sort_order');

        if ($request->has('category')) {
            $request->validate([
                'category' => 'string|in:hero,restaurant,carte,gallery',
            ]);
            $query->where('category', $request->category);
        }

        return response()->json($query->get());
    }

    public function store(StoreSiteImageRequest $request)
    {
        $rid = $this->tc()->id();
        $validated = $request->validated();

        $path = $request->file('image')->store('site-images', 'public');
        $validated['image_url'] = '/storage/' . $path;

        if (!isset($validated['sort_order'])) {
            $maxOrder = SiteImage::where('restaurant_id', $rid)
                ->where('category', $validated['category'])->max('sort_order');
            $validated['sort_order'] = ($maxOrder ?? -1) + 1;
        }

        unset($validated['image']);
        $validated['restaurant_id'] = $rid;
        $siteImage = SiteImage::create($validated);

        Cache::forget("public_site_images:{$rid}");

        return response()->json($siteImage, 201);
    }

    public function update(UpdateSiteImageRequest $request, SiteImage $siteImage)
    {
        $siteImage->update($request->validated());
        Cache::forget("public_site_images:{$this->tc()->id()}");
        return response()->json($siteImage);
    }

    public function destroy(SiteImage $siteImage)
    {
        $this->deleteStorageFile($siteImage->image_url, 'site-images/');
        $siteImage->delete();
        Cache::forget("public_site_images:{$this->tc()->id()}");
        return response()->json(['message' => 'Image supprimée']);
    }

    public function reorder(Request $request)
    {
        $rid = $this->tc()->id();
        $request->validate([
            'category' => 'required|string|in:hero,restaurant,carte,gallery',
            'ids'      => 'required|array',
            'ids.*'    => 'integer|exists:site_images,id',
        ]);

        foreach ($request->ids as $index => $id) {
            SiteImage::where('id', $id)
                ->where('restaurant_id', $rid)
                ->where('category', $request->category)
                ->update(['sort_order' => $index]);
        }

        Cache::forget("public_site_images:{$rid}");

        return response()->json(['message' => 'Ordre mis à jour']);
    }

    public function publicIndex()
    {
        $rid = $this->tc()->id();

        $data = Cache::remember("public_site_images:{$rid}", 1800, function () use ($rid) {
            $images = SiteImage::where('restaurant_id', $rid)
                ->orderBy('sort_order')->get();

            $grouped = [
                'hero'       => [],
                'restaurant' => [],
                'carte'      => [],
                'gallery'    => [],
            ];

            foreach ($images as $img) {
                if (isset($grouped[$img->category])) {
                    $grouped[$img->category][] = [
                        'id'         => $img->id,
                        'image_url'  => $img->image_url,
                        'alt'        => $img->alt,
                        'sort_order' => $img->sort_order,
                    ];
                }
            }

            return $grouped;
        });

        return response()->json($data);
    }
}
