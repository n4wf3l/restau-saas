<?php

namespace App\Services;

use App\Models\Restaurant;

class TenantContext
{
    private ?Restaurant $restaurant = null;

    public function set(Restaurant $restaurant): void
    {
        $this->restaurant = $restaurant;
    }

    public function get(): ?Restaurant
    {
        return $this->restaurant;
    }

    public function id(): ?int
    {
        return $this->restaurant?->id;
    }

    public function require(): Restaurant
    {
        return $this->restaurant ?? abort(404, 'Restaurant not found');
    }
}
