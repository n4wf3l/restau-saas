<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'floor_plan_item_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'arrival_time',
        'party_size',
        'status',
        'notes',
        'is_event',
        'event_details',
        'cancellation_code',
    ];

    protected $casts = [
        'arrival_time' => 'datetime',
        'is_event' => 'boolean',
    ];

    public function floorPlanItem(): BelongsTo
    {
        return $this->belongsTo(RestaurantFloorPlanItem::class, 'floor_plan_item_id');
    }

    /**
     * Generate a fresh unique short code shared by all rows of one booking.
     * 8-char alphanumeric uppercase, ambiguous chars removed (0/O, 1/I).
     * Retries on collision — with ~32^8 ≈ 10^12 possibilities that's rarely triggered.
     */
    public static function generateCancellationCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (self::where('cancellation_code', $code)->exists());
        return $code;
    }
}
