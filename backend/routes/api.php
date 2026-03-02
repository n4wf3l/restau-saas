<?php

use App\Http\Controllers\Api\FloorPlanController;
use App\Http\Controllers\Api\FloorPlanItemController;
use App\Http\Controllers\Api\PublicTableController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SiteImageController;
use App\Http\Controllers\Api\ContactController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes (no auth required) — rate limited
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/public/tables', [PublicTableController::class, 'index']);
    Route::get('/public/settings', [SettingsController::class, 'publicShow']);
    Route::get('/public/menu-items', [MenuItemController::class, 'publicIndex']);
    Route::get('/public/site-images', [SiteImageController::class, 'publicIndex']);
});

Route::post('/public/check-availability', [PublicTableController::class, 'checkAvailability'])
    ->middleware('throttle:30,1');
Route::post('/public/reservations', [PublicTableController::class, 'store'])
    ->middleware('throttle:10,1');
Route::post('/public/events', [PublicTableController::class, 'storeEvent'])
    ->middleware('throttle:10,1');

Route::post('/public/contact', [ContactController::class, 'contact'])
    ->middleware('throttle:3,1');
Route::post('/public/recruit', [ContactController::class, 'recruit'])
    ->middleware('throttle:3,1');

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
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
    Route::post('/reservations/{id}/restore', [ReservationController::class, 'restore']);

    // Settings routes
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/menu-pdf', [SettingsController::class, 'uploadMenuPdf']);
    Route::delete('/settings/menu-pdf', [SettingsController::class, 'deleteMenuPdf']);
    Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);
    Route::delete('/settings/logo', [SettingsController::class, 'deleteLogo']);

    // Menu Items routes
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

    // Site Images routes
    Route::get('/site-images', [SiteImageController::class, 'index']);
    Route::post('/site-images', [SiteImageController::class, 'store']);
    Route::put('/site-images/{siteImage}', [SiteImageController::class, 'update']);
    Route::delete('/site-images/{siteImage}', [SiteImageController::class, 'destroy']);
    Route::post('/site-images/reorder', [SiteImageController::class, 'reorder']);
});
