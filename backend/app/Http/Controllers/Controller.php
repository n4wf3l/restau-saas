<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

abstract class Controller
{
    /**
     * Delete a file from public storage if the URL matches the expected prefix.
     */
    protected function deleteStorageFile(?string $url, string $prefix): void
    {
        if (!$url) return;

        $path = str_replace('/storage/', '', $url);
        if (str_starts_with($path, $prefix)) {
            Storage::disk('public')->delete($path);
        }
    }
}
