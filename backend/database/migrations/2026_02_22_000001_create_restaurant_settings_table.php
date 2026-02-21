<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Duration & buffer
            $table->unsignedSmallInteger('service_duration_minutes')->default(90);
            $table->unsignedSmallInteger('buffer_minutes')->default(15);

            // Capacity rules
            $table->unsignedTinyInteger('max_occupancy_pct')->default(100);

            // Auto-optimization
            $table->boolean('auto_optimize_tables')->default(false);

            // Auto-confirm
            $table->boolean('auto_confirm')->default(false);

            // Double confirmation email
            $table->boolean('send_confirmation_email')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_settings');
    }
};
