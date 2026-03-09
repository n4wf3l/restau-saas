<?php

namespace App\Observers;

use App\Models\Domain;
use App\Models\Restaurant;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantModule;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Support\Str;

class UserObserver
{
    public function created(User $user): void
    {
        // Each new user gets their own restaurant (pending activation by admin)
        $restaurant = Restaurant::create([
            'name'   => $user->name,
            'slug'   => Str::slug($user->name) . '-' . $user->id,
            'status' => 'pending',
        ]);

        // Default domain (optional, for dev)
        Domain::create([
            'restaurant_id' => $restaurant->id,
            'domain'        => $restaurant->slug . '.localhost',
            'is_primary'    => true,
        ]);

        // Link user to restaurant
        $user->update(['restaurant_id' => $restaurant->id]);

        // Bootstrap floor plan
        RestaurantFloorPlan::create([
            'user_id'       => $user->id,
            'restaurant_id' => $restaurant->id,
            'name'          => 'Mon Restaurant',
            'width'         => 40,
            'height'        => 30,
        ]);

        // Bootstrap settings
        RestaurantSetting::create([
            'user_id'       => $user->id,
            'restaurant_id' => $restaurant->id,
        ]);

        // Bootstrap modules (all enabled by default)
        RestaurantModule::create([
            'restaurant_id' => $restaurant->id,
        ]);
    }

    public function updated(User $user): void {}
    public function deleted(User $user): void {}
    public function restored(User $user): void {}
    public function forceDeleted(User $user): void {}
}
