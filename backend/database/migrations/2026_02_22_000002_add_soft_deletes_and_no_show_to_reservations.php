<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('reservations', 'deleted_at')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Note: SQLite stores enums as text - the 'no_show' status is validated
        // at the controller level. No column modification needed.
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
