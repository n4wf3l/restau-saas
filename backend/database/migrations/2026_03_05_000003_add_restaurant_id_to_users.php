<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'restaurant_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('restaurant_id')->nullable()->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'restaurant_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropConstrainedForeignId('restaurant_id');
            });
        }
    }
};
