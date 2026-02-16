<?php

use App\Http\Controllers\Api\FloorPlanController;
use App\Http\Controllers\Api\FloorPlanItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Floor Plan routes
    Route::get('/floor-plans/current', [FloorPlanController::class, 'current']);
    Route::put('/floor-plans/current', [FloorPlanController::class, 'update']);

    // Floor Plan Items routes
    Route::put('/floor-plans/current/items', [FloorPlanItemController::class, 'bulkUpsert']);
    Route::post('/floor-plans/current/items', [FloorPlanItemController::class, 'store']);
    Route::delete('/floor-plans/current/items/{id}', [FloorPlanItemController::class, 'destroy']);
});
