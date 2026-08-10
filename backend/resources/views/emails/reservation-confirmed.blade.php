@extends('emails.layout')

@section('content')
    {{-- Status badge --}}
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #d4edda; color: #155724; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px;">
            ✓ CONFIRMÉE
        </span>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1410; text-align: center;">
        Votre réservation est confirmée
    </h2>
    <p style="margin: 0 0 28px; font-size: 15px; color: #6b5e50; text-align: center; line-height: 1.5;">
        Bonjour {{ $reservation->customer_name }}, votre table est réservée.
    </p>

    {{-- Details card --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf7f4; border-radius: 8px; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f; width: 120px;">Date & Heure</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">
                            {{ $reservation->arrival_time->translatedFormat('l j F Y — H\hi') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Couverts</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">
                            {{ $reservation->party_size }} {{ $reservation->party_size > 1 ? 'personnes' : 'personne' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Table</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">
                            {{ $tableName }}
                        </td>
                    </tr>
                    @if($reservation->notes)
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Notes</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410;">
                            {{ $reservation->notes }}
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 24px; font-size: 13px; color: #8a7d6f; text-align: center; line-height: 1.5;">
        Merci d'arriver à l'heure afin de profiter pleinement de votre expérience.
    </p>

    @if($reservation->cancellation_code)
    {{-- Cancellation section --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e8ddd0; margin-top: 8px;">
        <tr>
            <td style="padding: 20px 24px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #8a7d6f; letter-spacing: 0.5px; text-transform: uppercase; text-align: center;">
                    Empêchement ?
                </p>
                <p style="margin: 0 0 14px; font-size: 13px; color: #6b5e50; text-align: center; line-height: 1.5;">
                    Votre code de réservation :
                </p>
                <p style="margin: 0 0 18px; text-align: center;">
                    <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #1a1410; background-color: #faf7f4; padding: 10px 18px; border-radius: 6px; border: 1px dashed #d4c4b0;">
                        {{ $reservation->cancellation_code }}
                    </span>
                </p>
                @if($cancelUrl)
                <p style="margin: 0 0 6px; text-align: center;">
                    <a href="{{ $cancelUrl }}" style="display: inline-block; font-size: 13px; color: #8f6a4f; text-decoration: underline; padding: 6px 12px;">
                        Annuler ma réservation en ligne
                    </a>
                </p>
                @endif
                <p style="margin: 0; font-size: 11px; color: #a8998a; text-align: center; line-height: 1.5;">
                    Notez ce code — il vous permet d'annuler votre réservation sur notre site à tout moment.
                </p>
            </td>
        </tr>
    </table>
    @endif
@endsection
