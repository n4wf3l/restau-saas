<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantFloorPlanItem extends Model
{
    protected $fillable = [
        'floor_plan_id',
        'type',
        'x',
        'y',
        'rotation',
        'meta',
        'floor_level',
        'floor_name',
        'table_name',
    ];

    protected $casts = [
        'x' => 'integer',
        'y' => 'integer',
        'rotation' => 'integer',
        'meta' => 'array',
    ];

    public function floorPlan(): BelongsTo
    {
        return $this->belongsTo(RestaurantFloorPlan::class, 'floor_plan_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'floor_plan_item_id');
    }
}
