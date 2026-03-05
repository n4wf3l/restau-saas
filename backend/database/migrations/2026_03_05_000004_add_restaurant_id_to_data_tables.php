<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['restaurant_settings', 'restaurant_floor_plans', 'menu_items', 'site_images'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'restaurant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('restaurant_id')->nullable()->constrained()->cascadeOnDelete();
                    $table->index('restaurant_id');
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['restaurant_settings', 'restaurant_floor_plans', 'menu_items', 'site_images'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'restaurant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('restaurant_id');
                });
            }
        }
    }
};
