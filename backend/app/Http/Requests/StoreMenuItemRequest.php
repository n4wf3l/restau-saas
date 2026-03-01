<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'ingredients' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_halal' => 'boolean',
            'image' => 'nullable|image|max:5120',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ];
    }
}
