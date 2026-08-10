<?php

namespace Tests;

use App\Models\RestaurantModule;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Flip a freshly-registered tenant to `active` + every module enabled.
     * Since 2026-08-10, `UserObserver` provisions restaurants as `pending`
     * with all modules OFF, and route middleware refuses everything until
     * the superadmin validates. Feature tests that predate that change
     * (or that test unrelated behaviour) call this once in setUp to keep
     * running against a fully-enabled tenant.
     */
    protected function activateTenant(User $user): void
    {
        $restaurant = $user->restaurant()->first();
        if (!$restaurant) {
            return;
        }
        $restaurant->update(['status' => 'active']);

        $modules = $restaurant->modules()->first();
        $flags = array_fill_keys(RestaurantModule::FEATURE_FLAGS, true);
        if ($modules) {
            $modules->update($flags);
        } else {
            RestaurantModule::create(array_merge(['restaurant_id' => $restaurant->id], $flags));
        }

        // Reload relationships so subsequent `$user->restaurant->modules` reads see the update.
        $user->load('restaurant.modules');
    }
}
