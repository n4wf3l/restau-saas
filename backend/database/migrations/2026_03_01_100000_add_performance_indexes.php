<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->index(['floor_plan_item_id', 'status', 'arrival_time'], 'res_item_status_arrival');
            $table->index('customer_email', 'res_customer_email');
        });

        Schema::table('restaurant_floor_plan_items', function (Blueprint $table) {
            $table->index(['floor_plan_id', 'type', 'floor_level'], 'items_plan_type_floor');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['user_id', 'is_available'], 'menu_user_available');
        });

        Schema::table('restaurant_floor_plans', function (Blueprint $table) {
            $table->index('user_id', 'plans_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('res_item_status_arrival');
            $table->dropIndex('res_customer_email');
        });

        Schema::table('restaurant_floor_plan_items', function (Blueprint $table) {
            $table->dropIndex('items_plan_type_floor');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('menu_user_available');
        });

        Schema::table('restaurant_floor_plans', function (Blueprint $table) {
            $table->dropIndex('plans_user_id');
        });
    }
};
