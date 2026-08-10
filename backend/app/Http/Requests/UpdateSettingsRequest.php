<?php

namespace App\Http\Requests;

use App\Models\RestaurantSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'reservations_enabled'     => 'sometimes|boolean',
            'service_duration_minutes' => 'sometimes|integer|min:15|max:480',
            'buffer_minutes'           => 'sometimes|integer|min:0|max:120',
            'max_occupancy_pct'        => 'sometimes|integer|min:10|max:100',
            'auto_optimize_tables'     => 'sometimes|boolean',
            'auto_confirm'             => 'sometimes|boolean',
            'send_confirmation_email'  => 'sometimes|boolean',
            'opening_hours'            => 'sometimes|nullable|array',
            'opening_hours.*.open'     => 'required_with:opening_hours|string',
            'opening_hours.*.close'    => 'required_with:opening_hours|string',
            'opening_hours.*.closed'   => 'required_with:opening_hours|boolean',
            'closure_dates'            => 'sometimes|nullable|array',
            'closure_dates.*.date'     => 'required_with:closure_dates|date',
            'closure_dates.*.reason'   => 'nullable|string|max:255',
            'menu_manual_visible'      => 'sometimes|boolean',
            'menu_pdf_visible'         => 'sometimes|boolean',
            'social_links'             => 'sometimes|nullable|array',
            'restaurant_name'          => 'sometimes|string|max:100',
            'theme'                    => ['sometimes', 'string', Rule::in(RestaurantSetting::AVAILABLE_THEMES)],
            'layout'                   => ['sometimes', 'string', Rule::in(RestaurantSetting::AVAILABLE_LAYOUTS)],
            'show_moroccan_decorations' => 'sometimes|boolean',
            // SEO
            'meta_description'         => 'sometimes|nullable|string|max:300',
            'meta_keywords'            => 'sometimes|nullable|string|max:500',
            'og_image_url'             => 'sometimes|nullable|url|max:500',
            'address'                  => 'sometimes|nullable|string|max:300',
            'phone'                    => 'sometimes|nullable|string|max:40',
            'cuisine_type'             => 'sometimes|nullable|string|max:100',
            'price_range'              => ['sometimes', 'nullable', Rule::in(['€', '€€', '€€€', '€€€€'])],
            'seo_checklist'            => 'sometimes|array',
            'seo_checklist.*'          => ['string', Rule::in(RestaurantSetting::SEO_CHECKLIST_ITEMS)],
        ];
    }
}
