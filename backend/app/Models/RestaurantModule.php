<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantModule extends Model
{
    protected $fillable = [
        'restaurant_id',
        'reservations_enabled',
        'menu_enabled',
        'website_enabled',
    ];

    protected $casts = [
        'reservations_enabled' => 'boolean',
        'menu_enabled'         => 'boolean',
        'website_enabled'      => 'boolean',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
