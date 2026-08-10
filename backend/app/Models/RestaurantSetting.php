<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantSetting extends Model
{
    protected $fillable = [
        'user_id',
        'restaurant_id',
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
        'restaurant_name',
        'logo_url',
        'theme',
        'layout',
        'show_moroccan_decorations',
        'meta_description',
        'meta_keywords',
        'og_image_url',
        'address',
        'phone',
        'cuisine_type',
        'price_range',
        'seo_checklist',
    ];

    public const AVAILABLE_THEMES = ['coffee', 'noir', 'sable'];
    public const AVAILABLE_LAYOUTS = ['classic', 'cinematic'];

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
        'seo_checklist' => 'array',
        'show_moroccan_decorations' => 'boolean',
    ];

    /**
     * Off-platform SEO checklist items — keys the owner ticks manually to
     * confirm they've done the external step. Kept as a whitelist here so
     * unknown keys can't be persisted and so the UI + validator share the truth.
     */
    public const SEO_CHECKLIST_ITEMS = [
        // Google
        'gmb_created',        // Google Business Profile claimed
        'gmb_verified',       // Postcard / phone verification done
        'gmb_photos',         // At least 5 photos uploaded to GMB
        'gmb_menu_linked',    // Menu link added on GMB
        // Third-party listings
        'tripadvisor_listed',
        'thefork_listed',
        'yelp_listed',
        // Reviews
        'review_ask_process', // A process exists to ask happy diners for reviews
        'review_responses',   // Owner replies to reviews (positive AND negative)
        // Content
        'blog_posts',         // Recurring content published
        'social_active',      // Active social media presence
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
