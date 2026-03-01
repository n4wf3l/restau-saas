<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:pending,confirmed,cancelled,completed,no_show',
            'customer_name' => 'sometimes|string|max:255',
            'customer_email' => 'sometimes|email|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'arrival_time' => 'sometimes|date',
            'party_size' => 'sometimes|integer|min:1|max:50',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
