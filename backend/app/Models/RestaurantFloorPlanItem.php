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

    /**
     * Get adjacent chairs for a table (orthogonally adjacent, same floor plan).
     */
    public static function adjacentChairs(self $table): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('type', 'chair')
            ->where('floor_plan_id', $table->floor_plan_id)
            ->where(function ($query) use ($table) {
                $query->where(function ($q) use ($table) {
                    $q->where('y', $table->y)
                      ->whereBetween('x', [$table->x - 1, $table->x + 1]);
                })->orWhere(function ($q) use ($table) {
                    $q->where('x', $table->x)
                      ->whereBetween('y', [$table->y - 1, $table->y + 1]);
                });
            })
            ->where(function ($query) use ($table) {
                $query->where('x', '!=', $table->x)
                      ->orWhere('y', '!=', $table->y);
            })
            ->get();
    }
}
