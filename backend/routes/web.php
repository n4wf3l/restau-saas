<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Widget demo — served by Laravel so origin is http://localhost:8000 (no CORS issue)
Route::get('/widget-demo', function () {
    $path = base_path('../playground/widget-demo.html');
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path, ['Content-Type' => 'text/html']);
});

require __DIR__.'/auth.php';
