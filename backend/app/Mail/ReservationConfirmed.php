<?php

namespace App\Mail;

use App\Models\Reservation;
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
        public string $restaurantName = 'Mon Restaurant',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre réservation est confirmée — ' . $this->restaurantName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reservation-confirmed',
        );
    }
}
