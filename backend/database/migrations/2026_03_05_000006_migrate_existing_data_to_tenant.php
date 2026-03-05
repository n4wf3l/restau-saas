<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Skip if no data exists (fresh install)
        $hasUsers = DB::table('users')->exists();
        $hasSettings = DB::table('restaurant_settings')->exists();

        if (!$hasUsers && !$hasSettings) {
            return;
        }

        // Skip if a restaurant already exists (already migrated)
        if (DB::table('restaurants')->exists()) {
            return;
        }

        // Get restaurant name from existing settings if available
        $name = 'Mon Restaurant';
        if ($hasSettings) {
            $setting = DB::table('restaurant_settings')->first();
            if ($setting && !empty($setting->restaurant_name)) {
                $name = $setting->restaurant_name;
            }
        }

        // Create the default restaurant
        $slug = Str::slug($name);
        if (DB::table('restaurants')->where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $restaurantId = DB::table('restaurants')->insertGetId([
            'name'       => $name,
            'slug'       => $slug,
            'logo_url'   => $hasSettings ? (DB::table('restaurant_settings')->first()->logo_url ?? null) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create default domain for current host
        $host = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';
        DB::table('domains')->insertOrIgnore([
            'restaurant_id' => $restaurantId,
            'domain'        => $host,
            'is_primary'    => true,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Link all existing users to the default restaurant
        DB::table('users')->whereNull('restaurant_id')->update([
            'restaurant_id' => $restaurantId,
        ]);

        // Set restaurant_id on all existing data rows
        $tables = ['restaurant_settings', 'restaurant_floor_plans', 'menu_items', 'site_images'];
        foreach ($tables as $table) {
            DB::table($table)->whereNull('restaurant_id')->update([
                'restaurant_id' => $restaurantId,
            ]);
        }

        // Create modules row for the default restaurant
        if (!DB::table('restaurant_modules')->where('restaurant_id', $restaurantId)->exists()) {
            DB::table('restaurant_modules')->insert([
                'restaurant_id'       => $restaurantId,
                'reservations_enabled' => true,
                'menu_enabled'         => true,
                'website_enabled'      => true,
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Not reversible — data migration
    }
};
