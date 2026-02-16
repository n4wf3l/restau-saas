<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantFloorPlanItem extends Model
{
    protected $fillable = [
        'floor_plan_id',
        'type',
        'x',
        'y',
        'rotation',
        'meta',
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
}
