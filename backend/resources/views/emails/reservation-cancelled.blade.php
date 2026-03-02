@extends('emails.layout')

@section('content')
    {{-- Status badge --}}
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #f8d7da; color: #721c24; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px;">
            ✕ ANNULÉE
        </span>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1410; text-align: center;">
        Votre réservation a été annulée
    </h2>
    <p style="margin: 0 0 28px; font-size: 15px; color: #6b5e50; text-align: center; line-height: 1.5;">
        Bonjour {{ $reservation->customer_name }}, votre réservation a été annulée.
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

    <p style="margin: 0; font-size: 13px; color: #8a7d6f; text-align: center; line-height: 1.5;">
        N'hésitez pas à effectuer une nouvelle réservation sur notre site.
    </p>
@endsection
