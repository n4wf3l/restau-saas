<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('restaurant_modules')) {
            Schema::create('restaurant_modules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('restaurant_id')->unique()->constrained()->cascadeOnDelete();
                $table->boolean('reservations_enabled')->default(true);
                $table->boolean('menu_enabled')->default(true);
                $table->boolean('website_enabled')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_modules');
    }
};
