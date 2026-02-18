<?php

namespace App\Observers;

use App\Models\User;
use App\Models\RestaurantFloorPlan;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Créer un floor plan par défaut lors de l'inscription
        RestaurantFloorPlan::create([
            'user_id' => $user->id,
            'name' => 'Mon Restaurant',
            'width' => 40,
            'height' => 30,
        ]);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        //
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
