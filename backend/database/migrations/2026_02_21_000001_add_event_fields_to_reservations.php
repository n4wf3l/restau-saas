<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['floor_plan_item_id']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('floor_plan_item_id')->nullable()->change();
            $table->foreign('floor_plan_item_id')
                  ->references('id')
                  ->on('restaurant_floor_plan_items')
                  ->onDelete('cascade');

            $table->boolean('is_event')->default(false)->after('notes');
            $table->text('event_details')->nullable()->after('is_event');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['is_event', 'event_details']);
            $table->dropForeign(['floor_plan_item_id']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('floor_plan_item_id')->nullable(false)->change();
            $table->foreign('floor_plan_item_id')
                  ->references('id')
                  ->on('restaurant_floor_plan_items')
                  ->onDelete('cascade');
        });
    }
};
