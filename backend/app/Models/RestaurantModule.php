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
        'contact_enabled',
        'gallery_enabled',
        'events_enabled',
        'cancellation_enabled',
        'theme',
        'layout',
    ];

    protected $casts = [
        'reservations_enabled' => 'boolean',
        'menu_enabled'         => 'boolean',
        'website_enabled'      => 'boolean',
        'contact_enabled'      => 'boolean',
        'gallery_enabled'      => 'boolean',
        'events_enabled'       => 'boolean',
        'cancellation_enabled' => 'boolean',
    ];

    /**
     * Boolean module flags exposed publicly. Kept in one place so the
     * superadmin controller, public settings endpoint, and middleware all
     * agree on the list.
     */
    public const FEATURE_FLAGS = [
        'reservations_enabled',
        'menu_enabled',
        'website_enabled',
        'contact_enabled',
        'gallery_enabled',
        'events_enabled',
        'cancellation_enabled',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
