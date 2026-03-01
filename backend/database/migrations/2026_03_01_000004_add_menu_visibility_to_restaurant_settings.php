<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('restaurant_settings', 'menu_manual_visible')) {
                $table->boolean('menu_manual_visible')->default(true)->after('menu_pdf_url');
            }
            if (!Schema::hasColumn('restaurant_settings', 'menu_pdf_visible')) {
                $table->boolean('menu_pdf_visible')->default(false)->after('menu_manual_visible');
            }
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn(['menu_manual_visible', 'menu_pdf_visible']);
        });
    }
};
