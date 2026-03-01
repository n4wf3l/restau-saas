<?php

namespace App\Policies;

use App\Models\MenuItem;
use App\Models\User;

class MenuItemPolicy
{
    public function update(User $user, MenuItem $menuItem): bool
    {
        return $user->id === $menuItem->user_id;
    }

    public function delete(User $user, MenuItem $menuItem): bool
    {
        return $user->id === $menuItem->user_id;
    }
}
