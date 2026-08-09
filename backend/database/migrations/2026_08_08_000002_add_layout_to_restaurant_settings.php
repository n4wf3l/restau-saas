<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurant_settings', 'layout')) {
            Schema::table('restaurant_settings', function (Blueprint $table) {
                // 'classic' = original page layout (RR Ice style)
                // 'cinematic' = FYN-inspired scroll storytelling
                $table->string('layout', 32)->default('classic')->after('theme');
            });
        }
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn('layout');
        });
    }
};
