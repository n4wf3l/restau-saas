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

// ─── Public routes — tenant resolved via ?tenant=<slug> or X-Tenant header ───
// /public/settings is intentionally NOT gated — the frontend needs to read the
// module flags to know what to hide, and needs settings for branding even on a
// pending / suspended tenant so the "coming soon" screen still looks like theirs.
Route::middleware(['throttle:60,1', 'tenant'])->group(function () {
    Route::get('/public/settings', [SettingsController::class, 'publicShow']);
    Route::get('/public/sitemap', [\App\Http\Controllers\Api\SitemapController::class, 'index']);

    Route::get('/public/tables', [PublicTableController::class, 'index'])
        ->middleware(['restaurant.active', 'feature:reservations']);
    Route::get('/public/menu-items', [MenuItemController::class, 'publicIndex'])
        ->middleware(['restaurant.active', 'feature:menu']);
    Route::get('/public/site-images', [SiteImageController::class, 'publicIndex'])
        ->middleware(['restaurant.active', 'feature:website']);
});

Route::middleware(['tenant', 'restaurant.active'])->group(function () {
    Route::post('/public/check-availability', [PublicTableController::class, 'checkAvailability'])
        ->middleware(['throttle:30,1', 'feature:reservations']);
    Route::post('/public/reservations', [PublicTableController::class, 'store'])
        ->middleware(['throttle:10,1', 'feature:reservations']);
    Route::post('/public/events', [PublicTableController::class, 'storeEvent'])
        ->middleware(['throttle:10,1', 'feature:events']);
    Route::post('/public/reservations/cancel', [PublicTableController::class, 'cancel'])
        ->middleware(['throttle:10,1', 'feature:cancellation']);

    Route::post('/public/contact', [ContactController::class, 'contact'])
        ->middleware(['throttle:3,1', 'feature:contact']);
    Route::post('/public/recruit', [ContactController::class, 'recruit'])
        ->middleware(['throttle:3,1', 'feature:contact']);
});

// ─── Dev-only helpers (guarded per-endpoint inside DevController on
// app()->environment('local'), so registering the routes here is safe.
// Requires the frontend to have already hit /sanctum/csrf-cookie once). ───
Route::get('/dev/tenants', [\App\Http\Controllers\Api\DevController::class, 'listTenants']);
Route::post('/dev/login-as-owner', [\App\Http\Controllers\Api\DevController::class, 'loginAsOwner']);

// ─── Auth user route — tenant via authenticated user ───
// Intentionally NOT gated by restaurant.active — the frontend needs to read
// user.restaurant.status to know whether to show the "pending validation"
// screen or route into the dashboard.
Route::middleware(['auth:sanctum', 'auth.tenant'])->get('/user', function (Request $request) {
    $user = $request->user();
    $user->load(['restaurant.modules', 'restaurant.settings:id,restaurant_id,restaurant_name,logo_url']);
    return $user;
});

// ─── Platform admin routes ───
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/restaurants', [\App\Http\Controllers\Api\AdminController::class, 'index']);
    Route::put('/restaurants/{restaurant}', [\App\Http\Controllers\Api\AdminController::class, 'update']);
    Route::put('/restaurants/{restaurant}/modules', [\App\Http\Controllers\Api\AdminController::class, 'updateModules']);
});

// ─── Restaurant owner routes — tenant via authenticated user ───
// All owner endpoints require the restaurant to be active. Individual endpoints
// then add a `feature:X` gate for the module they belong to.
Route::middleware(['auth:sanctum', 'auth.tenant', 'restaurant.active'])->group(function () {
    // Floor Plan routes — gated by reservations (no reservations = no seating map)
    Route::get('/floor-plans/current', [FloorPlanController::class, 'current'])
        ->middleware('feature:reservations');
    Route::put('/floor-plans/current', [FloorPlanController::class, 'update'])
        ->middleware('feature:reservations');

    Route::put('/floor-plans/current/items', [FloorPlanItemController::class, 'bulkUpsert'])
        ->middleware('feature:reservations');
    Route::post('/floor-plans/current/items', [FloorPlanItemController::class, 'store'])
        ->middleware('feature:reservations');
    Route::delete('/floor-plans/current/items/{id}', [FloorPlanItemController::class, 'destroy'])
        ->middleware('feature:reservations');

    // Admin Reservation routes
    Route::get('/reservations', [ReservationController::class, 'index'])
        ->middleware('feature:reservations');
    Route::post('/reservations', [ReservationController::class, 'store'])
        ->middleware('feature:reservations');
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])
        ->middleware('feature:reservations');
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])
        ->middleware('feature:reservations');
    Route::post('/reservations/{id}/restore', [ReservationController::class, 'restore'])
        ->middleware('feature:reservations');

    // Settings routes — always available; tenant needs to reach basic info
    // even when other modules are off (e.g. update logo, hours).
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/menu-pdf', [SettingsController::class, 'uploadMenuPdf'])
        ->middleware('feature:menu');
    Route::delete('/settings/menu-pdf', [SettingsController::class, 'deleteMenuPdf'])
        ->middleware('feature:menu');
    Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);
    Route::delete('/settings/logo', [SettingsController::class, 'deleteLogo']);

    // Menu Items routes
    Route::get('/menu-items', [MenuItemController::class, 'index'])
        ->middleware('feature:menu');
    Route::post('/menu-items', [MenuItemController::class, 'store'])
        ->middleware('feature:menu');
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update'])
        ->middleware('feature:menu');
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy'])
        ->middleware('feature:menu');

    // Analytics — gated by reservations (all analytics are reservation-derived)
    Route::get('/analytics/summary', [\App\Http\Controllers\Api\AnalyticsController::class, 'summary'])
        ->middleware('feature:reservations');

    // Site Images routes — website gallery
    Route::get('/site-images', [SiteImageController::class, 'index'])
        ->middleware('feature:website');
    Route::post('/site-images', [SiteImageController::class, 'store'])
        ->middleware('feature:website');
    Route::put('/site-images/{siteImage}', [SiteImageController::class, 'update'])
        ->middleware('feature:website');
    Route::delete('/site-images/{siteImage}', [SiteImageController::class, 'destroy'])
        ->middleware('feature:website');
    Route::post('/site-images/reorder', [SiteImageController::class, 'reorder'])
        ->middleware('feature:website');
});
