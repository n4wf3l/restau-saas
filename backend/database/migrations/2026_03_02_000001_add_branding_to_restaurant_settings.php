<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('restaurant_settings', 'restaurant_name')) {
                $table->string('restaurant_name')->default('RR Ice');
            }
            if (!Schema::hasColumn('restaurant_settings', 'logo_url')) {
                $table->string('logo_url')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn(['restaurant_name', 'logo_url']);
        });
    }
};
