<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSiteImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'   => 'required|string|in:hero,restaurant,carte,gallery',
            'image'      => 'required|image|max:5120',
            'alt'        => 'nullable|string|max:255',
            'sort_order' => 'integer',
        ];
    }
}
