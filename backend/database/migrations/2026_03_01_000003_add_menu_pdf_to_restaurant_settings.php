<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurant_settings', 'menu_pdf_url')) {
            Schema::table('restaurant_settings', function (Blueprint $table) {
                $table->string('menu_pdf_url')->nullable()->after('closure_dates');
            });
        }
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn('menu_pdf_url');
        });
    }
};
