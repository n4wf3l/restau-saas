<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('restaurant_modules', 'contact_enabled')) {
                $table->boolean('contact_enabled')->default(false)->after('website_enabled');
            }
            if (!Schema::hasColumn('restaurant_modules', 'gallery_enabled')) {
                $table->boolean('gallery_enabled')->default(false)->after('contact_enabled');
            }
            if (!Schema::hasColumn('restaurant_modules', 'events_enabled')) {
                $table->boolean('events_enabled')->default(false)->after('gallery_enabled');
            }
            if (!Schema::hasColumn('restaurant_modules', 'cancellation_enabled')) {
                $table->boolean('cancellation_enabled')->default(false)->after('events_enabled');
            }
            // theme/layout override — NULL means "tenant chooses in their own settings"
            if (!Schema::hasColumn('restaurant_modules', 'theme')) {
                $table->string('theme', 32)->nullable()->after('cancellation_enabled');
            }
            if (!Schema::hasColumn('restaurant_modules', 'layout')) {
                $table->string('layout', 32)->nullable()->after('theme');
            }
        });

        // Grandfather: every row that already exists gets every module ON so
        // active tenants don't wake up to a broken site. New rows created by
        // UserObserver after this migration start with everything OFF and wait
        // for superadmin validation.
        DB::table('restaurant_modules')->update([
            'contact_enabled'      => true,
            'gallery_enabled'      => true,
            'events_enabled'       => true,
            'cancellation_enabled' => true,
        ]);
    }

    public function down(): void
    {
        Schema::table('restaurant_modules', function (Blueprint $table) {
            $cols = ['contact_enabled', 'gallery_enabled', 'events_enabled', 'cancellation_enabled', 'theme', 'layout'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('restaurant_modules', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
