<?php

namespace App\Policies;

use App\Models\MenuItem;
use App\Models\User;

class MenuItemPolicy
{
    public function update(User $user, MenuItem $menuItem): bool
    {
        return true; // All authenticated admins can manage menu items
    }

    public function delete(User $user, MenuItem $menuItem): bool
    {
        return true; // All authenticated admins can manage menu items
    }
}
