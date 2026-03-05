<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Restaurant extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo_url',
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(RestaurantSetting::class);
    }

    public function floorPlan(): HasOne
    {
        return $this->hasOne(RestaurantFloorPlan::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function siteImages(): HasMany
    {
        return $this->hasMany(SiteImage::class);
    }

    public function modules(): HasOne
    {
        return $this->hasOne(RestaurantModule::class);
    }
}
