<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurants', 'status')) {
            Schema::table('restaurants', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('logo_url');
            });

            // Existing restaurants are already active
            \App\Models\Restaurant::query()->update(['status' => 'active']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('restaurants', 'status')) {
            Schema::table('restaurants', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
