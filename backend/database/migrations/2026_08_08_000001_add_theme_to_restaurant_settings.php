<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurant_settings', 'theme')) {
            Schema::table('restaurant_settings', function (Blueprint $table) {
                // Enum-like: 'coffee' | 'noir' | 'sable'. Validation is at the controller level.
                $table->string('theme', 32)->default('coffee')->after('restaurant_name');
            });
        }
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn('theme');
        });
    }
};
