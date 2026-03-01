<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteImageRequest;
use App\Http\Requests\UpdateSiteImageRequest;
use App\Models\SiteImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SiteImageController extends Controller
{
    /**
     * Admin: list images, optionally filtered by category.
     */
    public function index(Request $request)
    {
        $query = SiteImage::orderBy('category')->orderBy('sort_order');

        if ($request->has('category')) {
            $request->validate([
                'category' => 'string|in:hero,restaurant,carte,gallery',
            ]);
            $query->where('category', $request->category);
        }

        return response()->json($query->get());
    }

    /**
     * Admin: upload a new site image.
     */
    public function store(StoreSiteImageRequest $request)
    {
        $validated = $request->validated();

        $path = $request->file('image')->store('site-images', 'public');
        $validated['image_url'] = '/storage/' . $path;

        if (!isset($validated['sort_order'])) {
            $maxOrder = SiteImage::where('category', $validated['category'])->max('sort_order');
            $validated['sort_order'] = ($maxOrder ?? -1) + 1;
        }

        unset($validated['image']);
        $siteImage = SiteImage::create($validated);

        Cache::forget('public_site_images');

        return response()->json($siteImage, 201);
    }

    /**
     * Admin: update alt text or sort_order.
     */
    public function update(UpdateSiteImageRequest $request, SiteImage $siteImage)
    {
        $siteImage->update($request->validated());

        Cache::forget('public_site_images');

        return response()->json($siteImage);
    }

    /**
     * Admin: delete a site image.
     */
    public function destroy(SiteImage $siteImage)
    {
        $this->deleteStorageFile($siteImage->image_url, 'site-images/');

        $siteImage->delete();

        Cache::forget('public_site_images');

        return response()->json(['message' => 'Image supprimée']);
    }

    /**
     * Admin: bulk update sort_order for a category.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'category' => 'required|string|in:hero,restaurant,carte,gallery',
            'ids'      => 'required|array',
            'ids.*'    => 'integer|exists:site_images,id',
        ]);

        foreach ($request->ids as $index => $id) {
            SiteImage::where('id', $id)
                ->where('category', $request->category)
                ->update(['sort_order' => $index]);
        }

        Cache::forget('public_site_images');

        return response()->json(['message' => 'Ordre mis à jour']);
    }

    /**
     * Public: return all images grouped by category, cached 30 min.
     */
    public function publicIndex()
    {
        $data = Cache::remember('public_site_images', 1800, function () {
            $images = SiteImage::orderBy('sort_order')->get();

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
