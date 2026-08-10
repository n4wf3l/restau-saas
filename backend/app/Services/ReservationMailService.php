<?php

namespace App\Services;

use App\Mail\ReservationCancelled;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationPending;
use App\Models\Reservation;
use App\Models\RestaurantSetting;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Mail;

class ReservationMailService
{
    public static function sendByStatus(Reservation $reservation, string $tableName): void
    {
        match ($reservation->status) {
            'confirmed' => static::sendConfirmed($reservation, $tableName),
            'pending' => static::sendPending($reservation, $tableName),
            default => null,
        };
    }

    public static function sendConfirmed(Reservation $reservation, string $tableName): void
    {
        if (!static::isEnabled()) return;

        $name = static::restaurantName();
        $cancelUrl = static::cancelUrl($reservation);
        Mail::to($reservation->customer_email)
            ->queue(new ReservationConfirmed($reservation, $tableName, $name, $cancelUrl));
    }

    public static function sendPending(Reservation $reservation, string $tableName): void
    {
        if (!static::isEnabled()) return;

        $name = static::restaurantName();
        $cancelUrl = static::cancelUrl($reservation);
        Mail::to($reservation->customer_email)
            ->queue(new ReservationPending($reservation, $tableName, $name, $cancelUrl));
    }

    public static function sendCancelled(Reservation $reservation): void
    {
        if (!static::isEnabled()) return;

        $name = static::restaurantName();
        Mail::to($reservation->customer_email)
            ->queue(new ReservationCancelled($reservation, $name));
    }

    private static function isEnabled(): bool
    {
        $tc = app(TenantContext::class);
        $rid = $tc->id();
        if (!$rid) return false;

        $settings = RestaurantSetting::where('restaurant_id', $rid)->first();
        return $settings && $settings->send_confirmation_email;
    }

    private static function restaurantName(): string
    {
        $tc = app(TenantContext::class);
        $rid = $tc->id();
        if (!$rid) return 'Mon Restaurant';

        $settings = RestaurantSetting::where('restaurant_id', $rid)->first();
        return $settings?->restaurant_name ?? 'Mon Restaurant';
    }

    /**
     * Build the public self-serve cancel URL for a reservation.
     * Uses FRONTEND_URL env var so admin can point to their prod frontend,
     * falling back to APP_URL (Laravel default) then localhost dev URL.
     */
    private static function cancelUrl(Reservation $reservation): ?string
    {
        $tc = app(TenantContext::class);
        $slug = $tc->get()?->slug;
        if (!$slug || !$reservation->cancellation_code) return null;

        $base = rtrim(env('FRONTEND_URL', config('app.url') ?: 'http://localhost:5174'), '/');
        return "{$base}/r/{$slug}/cancel?code={$reservation->cancellation_code}";
    }
}
