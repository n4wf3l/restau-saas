<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // All authenticated admins can manage menu items
    }

    public function rules(): array
    {
        return [
            'name' => 'string|max:255',
            'ingredients' => 'nullable|string',
            'price' => 'numeric|min:0',
            'is_halal' => 'boolean',
            'image' => 'nullable|image|max:5120',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'order' => 'integer',
        ];
    }
}
