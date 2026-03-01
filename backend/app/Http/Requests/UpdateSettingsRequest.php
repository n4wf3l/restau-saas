<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        ];
    }
}
