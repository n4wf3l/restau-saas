<?php

namespace App\Mail;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RestaurantActivated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $dashboardUrl;
    public string $publicUrl;
    public string $restaurantName;

    public function __construct(
        public Restaurant $restaurant,
        public User $owner,
    ) {
        $base = rtrim(env('FRONTEND_URL', config('app.url') ?: 'http://localhost:5174'), '/');
        $this->dashboardUrl   = $base . '/dashboard';
        $this->publicUrl      = $base . '/r/' . $restaurant->slug;
        $this->restaurantName = $restaurant->name;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre compte est activé — ' . $this->restaurantName,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.restaurant-activated');
    }
}
