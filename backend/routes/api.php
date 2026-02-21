<?php

use App\Http\Controllers\Api\FloorPlanController;
use App\Http\Controllers\Api\FloorPlanItemController;
use App\Http\Controllers\Api\PublicTableController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\MenuItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes (no auth required)
Route::get('/public/tables', [PublicTableController::class, 'index']);
Route::post('/public/check-availability', [PublicTableController::class, 'checkAvailability']);
Route::post('/public/reservations', [PublicTableController::class, 'store']);
Route::post('/public/events', [PublicTableController::class, 'storeEvent']);

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

    // Admin Reservation routes
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);

    // Menu Items routes
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);
});
