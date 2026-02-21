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
    ];

    protected $casts = [
        'reservations_enabled' => 'boolean',
        'service_duration_minutes' => 'integer',
        'buffer_minutes' => 'integer',
        'max_occupancy_pct' => 'integer',
        'auto_optimize_tables' => 'boolean',
        'auto_confirm' => 'boolean',
        'send_confirmation_email' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
