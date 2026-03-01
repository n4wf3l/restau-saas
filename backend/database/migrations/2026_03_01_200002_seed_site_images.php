<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('site_images') && DB::table('site_images')->count() === 0) {
            $now = now();

            $images = [
                // Hero backgrounds
                ['category' => 'hero', 'image_url' => '/rr-ice2.png', 'alt' => 'Hero 1', 'sort_order' => 0],
                ['category' => 'hero', 'image_url' => '/rr-ice3.png', 'alt' => 'Hero 2', 'sort_order' => 1],
                ['category' => 'hero', 'image_url' => '/rr-ice4.png', 'alt' => 'Hero 3', 'sort_order' => 2],

                // Restaurant section
                ['category' => 'restaurant', 'image_url' => '/rr-ice11.png', 'alt' => 'Restaurant 1', 'sort_order' => 0],
                ['category' => 'restaurant', 'image_url' => '/rr-ice13.png', 'alt' => 'Restaurant 2', 'sort_order' => 1],
                ['category' => 'restaurant', 'image_url' => '/rr-ice7.png',  'alt' => 'Restaurant 3', 'sort_order' => 2],
                ['category' => 'restaurant', 'image_url' => '/rr-ice8.png',  'alt' => 'Restaurant 4', 'sort_order' => 3],
                ['category' => 'restaurant', 'image_url' => '/rr-ice9.png',  'alt' => 'Restaurant 5', 'sort_order' => 4],
                ['category' => 'restaurant', 'image_url' => '/rr-ice10.png', 'alt' => 'Restaurant 6', 'sort_order' => 5],

                // Carte section
                ['category' => 'carte', 'image_url' => '/rr-ice14.png', 'alt' => 'Plat 1', 'sort_order' => 0],
                ['category' => 'carte', 'image_url' => '/rr-ice15.png', 'alt' => 'Plat 2', 'sort_order' => 1],
                ['category' => 'carte', 'image_url' => '/rr-ice16.png', 'alt' => 'Plat 3', 'sort_order' => 2],
                ['category' => 'carte', 'image_url' => '/rr-ice17.png', 'alt' => 'Plat 4', 'sort_order' => 3],
                ['category' => 'carte', 'image_url' => '/rr-ice19.png', 'alt' => 'Plat 5', 'sort_order' => 4],
                ['category' => 'carte', 'image_url' => '/rr-ice20.png', 'alt' => 'Plat 6', 'sort_order' => 5],

                // Gallery page
                ['category' => 'gallery', 'image_url' => 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Ambiance du restaurant', 'sort_order' => 0],
                ['category' => 'gallery', 'image_url' => '/rr-ice12.png', 'alt' => 'Entrée du restaurant', 'sort_order' => 1],
                ['category' => 'gallery', 'image_url' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Plats gastronomiques', 'sort_order' => 2],
                ['category' => 'gallery', 'image_url' => 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Cocktails signature', 'sort_order' => 3],
                ['category' => 'gallery', 'image_url' => '/rr-ice9.png', 'alt' => 'Terrasse au coucher de soleil', 'sort_order' => 4],
                ['category' => 'gallery', 'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Desserts maison', 'sort_order' => 5],
                ['category' => 'gallery', 'image_url' => '/rr-ice2.png', 'alt' => 'Vue extérieure', 'sort_order' => 6],
                ['category' => 'gallery', 'image_url' => '/rr-ice3.png', 'alt' => 'Ambiance soirée', 'sort_order' => 7],
                ['category' => 'gallery', 'image_url' => '/rr-ice4.png', 'alt' => 'Terrasse', 'sort_order' => 8],
            ];

            foreach ($images as &$img) {
                $img['created_at'] = $now;
                $img['updated_at'] = $now;
            }

            DB::table('site_images')->insert($images);
        }
    }

    public function down(): void
    {
        // Data removed when table is dropped
    }
};
