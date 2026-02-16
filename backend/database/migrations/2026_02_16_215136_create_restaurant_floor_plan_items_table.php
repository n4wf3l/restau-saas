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
        Schema::create('restaurant_floor_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_plan_id')->constrained('restaurant_floor_plans')->onDelete('cascade');
            $table->string('type'); // table, chair, wall, empty
            $table->unsignedInteger('x');
            $table->unsignedInteger('y');
            $table->unsignedInteger('rotation')->default(0); // 0, 90, 180, 270
            $table->json('meta')->nullable(); // données supplémentaires (couleur, taille, etc.)
            $table->timestamps();

            $table->unique(['floor_plan_id', 'x', 'y']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_floor_plan_items');
    }
};
