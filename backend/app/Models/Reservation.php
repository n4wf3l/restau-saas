<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    protected $fillable = [
        'floor_plan_item_id',
        'customer_name',
        'customer_email',
        'arrival_time',
        'party_size',
        'status',
        'notes',
    ];

    protected $casts = [
        'arrival_time' => 'datetime',
    ];

    public function floorPlanItem(): BelongsTo
    {
        return $this->belongsTo(RestaurantFloorPlanItem::class, 'floor_plan_item_id');
    }
}
