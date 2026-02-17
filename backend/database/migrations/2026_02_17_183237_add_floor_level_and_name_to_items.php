<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('restaurant_floor_plan_items', function (Blueprint $table) {
            $table->unsignedInteger('floor_level')->default(1)->after('floor_plan_id');
            $table->string('floor_name')->nullable()->after('floor_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurant_floor_plan_items', function (Blueprint $table) {
            $table->dropColumn(['floor_level', 'floor_name']);
        });
    }
};
