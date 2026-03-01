<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantSetting extends Model
{
    protected $fillable = [
        'user_id',
        'reservations_enabled',
        'service_duration_minutes',
        'buffer_minutes',
        'max_occupancy_pct',
        'auto_optimize_tables',
        'auto_confirm',
        'send_confirmation_email',
        'opening_hours',
        'closure_dates',
        'menu_pdf_url',
        'menu_manual_visible',
        'menu_pdf_visible',
        'social_links',
    ];

    protected $casts = [
        'reservations_enabled' => 'boolean',
        'service_duration_minutes' => 'integer',
        'buffer_minutes' => 'integer',
        'max_occupancy_pct' => 'integer',
        'auto_optimize_tables' => 'boolean',
        'auto_confirm' => 'boolean',
        'send_confirmation_email' => 'boolean',
        'opening_hours' => 'array',
        'closure_dates' => 'array',
        'menu_manual_visible' => 'boolean',
        'menu_pdf_visible' => 'boolean',
        'social_links' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
