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
    ];

    protected $casts = [
        'arrival_time' => 'datetime',
        'is_event' => 'boolean',
    ];

    public function floorPlanItem(): BelongsTo
    {
        return $this->belongsTo(RestaurantFloorPlanItem::class, 'floor_plan_item_id');
    }
}
