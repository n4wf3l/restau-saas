<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'ingredients',
        'price',
        'is_halal',
        'image_url',
        'category',
        'is_available',
        'order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_halal' => 'boolean',
        'is_available' => 'boolean',
        'order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
