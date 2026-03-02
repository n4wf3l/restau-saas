<?php

namespace App\Mail;

use App\Models\Reservation;
use App\Models\RestaurantSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservationConfirmed extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Reservation $reservation,
        public string $tableName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre réservation est confirmée — ' . (RestaurantSetting::first()?->restaurant_name ?? 'RR Ice'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reservation-confirmed',
        );
    }
}
