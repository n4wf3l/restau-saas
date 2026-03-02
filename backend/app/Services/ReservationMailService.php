<?php

namespace App\Services;

use App\Mail\ReservationCancelled;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationPending;
use App\Models\Reservation;
use App\Models\RestaurantSetting;
use Illuminate\Support\Facades\Mail;

class ReservationMailService
{
    /**
     * Send the appropriate email based on the reservation status.
     */
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

        Mail::to($reservation->customer_email)
            ->queue(new ReservationConfirmed($reservation, $tableName));
    }

    public static function sendPending(Reservation $reservation, string $tableName): void
    {
        if (!static::isEnabled()) return;

        Mail::to($reservation->customer_email)
            ->queue(new ReservationPending($reservation, $tableName));
    }

    public static function sendCancelled(Reservation $reservation): void
    {
        if (!static::isEnabled()) return;

        Mail::to($reservation->customer_email)
            ->queue(new ReservationCancelled($reservation));
    }

    private static function isEnabled(): bool
    {
        $settings = RestaurantSetting::first();

        return $settings && $settings->send_confirmation_email;
    }
}
