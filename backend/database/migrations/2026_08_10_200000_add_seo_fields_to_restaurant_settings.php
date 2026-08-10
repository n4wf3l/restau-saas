<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            // Editable SEO meta (drives <title>, meta description, OG image)
            if (!Schema::hasColumn('restaurant_settings', 'meta_description')) {
                $table->string('meta_description', 300)->nullable()->after('logo_url');
            }
            if (!Schema::hasColumn('restaurant_settings', 'meta_keywords')) {
                $table->string('meta_keywords', 500)->nullable()->after('meta_description');
            }
            if (!Schema::hasColumn('restaurant_settings', 'og_image_url')) {
                $table->string('og_image_url', 500)->nullable()->after('meta_keywords');
            }

            // NAP + business info — feeds JSON-LD schema.org/Restaurant so Google
            // knows this is a physical restaurant, where, what cuisine, price tier.
            // Consistency of NAP across the web is a major local-SEO signal.
            if (!Schema::hasColumn('restaurant_settings', 'address')) {
                $table->string('address', 300)->nullable()->after('og_image_url');
            }
            if (!Schema::hasColumn('restaurant_settings', 'phone')) {
                $table->string('phone', 40)->nullable()->after('address');
            }
            if (!Schema::hasColumn('restaurant_settings', 'cuisine_type')) {
                $table->string('cuisine_type', 100)->nullable()->after('phone');
            }
            // price_range: schema.org convention is 1–4 dollar/euro signs
            if (!Schema::hasColumn('restaurant_settings', 'price_range')) {
                $table->string('price_range', 4)->nullable()->after('cuisine_type');
            }

            // Off-platform checklist state — array of item keys the owner has ticked
            // (e.g. ["gmb_created","tripadvisor_listed"]). Auto-computed items are
            // NOT stored here; they're derived at render time from other fields.
            if (!Schema::hasColumn('restaurant_settings', 'seo_checklist')) {
                $table->json('seo_checklist')->nullable()->after('price_range');
            }
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            foreach (['meta_description','meta_keywords','og_image_url','address','phone','cuisine_type','price_range','seo_checklist'] as $col) {
                if (Schema::hasColumn('restaurant_settings', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
