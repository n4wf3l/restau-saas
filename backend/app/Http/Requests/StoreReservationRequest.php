<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'arrival_time' => 'required|date',
            'party_size' => 'required|integer|min:1|max:50',
            'table_id' => 'required|exists:restaurant_floor_plan_items,id',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
