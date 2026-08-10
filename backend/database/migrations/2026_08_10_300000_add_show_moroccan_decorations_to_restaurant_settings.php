<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a tenant-controlled toggle for the Moroccan-themed decorative elements
 * (currently: the country outline SVG on the Contact page). Grandfathered ON
 * for existing tenants so RR Ice keeps its map without the owner having to
 * re-tick anything after deploy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('restaurant_settings', 'show_moroccan_decorations')) {
                $table->boolean('show_moroccan_decorations')->default(true)->after('layout');
            }
        });

        // Existing rows explicitly ON — cheap even at scale, and clearer than
        // relying on the column default for a semantic "kept the old behaviour".
        DB::table('restaurant_settings')->update(['show_moroccan_decorations' => true]);
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            if (Schema::hasColumn('restaurant_settings', 'show_moroccan_decorations')) {
                $table->dropColumn('show_moroccan_decorations');
            }
        });
    }
};
