<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('reservations', 'cancellation_code')) {
            Schema::table('reservations', function (Blueprint $table) {
                // 8-char alphanumeric code shared across all rows of one booking group
                // (a party of 4 = 4 rows, but 1 code — customer sees a single code).
                $table->string('cancellation_code', 16)->nullable()->after('status');
                $table->index('cancellation_code');
            });
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['cancellation_code']);
            $table->dropColumn('cancellation_code');
        });
    }
};
