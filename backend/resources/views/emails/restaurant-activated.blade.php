@extends('emails.layout')

@section('content')
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #d4edda; color: #155724; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px;">
            ✓ COMPTE ACTIVÉ
        </span>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1410; text-align: center;">
        Bienvenue, {{ $owner->name }}
    </h2>
    <p style="margin: 0 0 28px; font-size: 15px; color: #6b5e50; text-align: center; line-height: 1.5;">
        Votre restaurant <strong>{{ $restaurantName }}</strong> vient d'être validé par notre équipe.
        Vous pouvez dès maintenant vous connecter à votre espace d'administration.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf7f4; border-radius: 8px; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px 24px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #8a7d6f; letter-spacing: 0.5px; text-transform: uppercase;">
                    Vos liens
                </p>
                <p style="margin: 0 0 10px; font-size: 14px; color: #1a1410;">
                    <strong>Espace admin :</strong>
                    <a href="{{ $dashboardUrl }}" style="color: #8f6a4f; text-decoration: underline; word-break: break-all;">{{ $dashboardUrl }}</a>
                </p>
                <p style="margin: 0; font-size: 14px; color: #1a1410;">
                    <strong>Site public :</strong>
                    <a href="{{ $publicUrl }}" style="color: #8f6a4f; text-decoration: underline; word-break: break-all;">{{ $publicUrl }}</a>
                </p>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 24px; font-size: 13px; color: #8a7d6f; text-align: center; line-height: 1.5;">
        Les fonctionnalités actives sur votre compte ont été configurées par notre équipe selon votre offre.
        Pour toute question ou modification, contactez-nous.
    </p>

    <p style="margin: 0; text-align: center;">
        <a href="{{ $dashboardUrl }}" style="display: inline-block; background-color: #1a1410; color: #e8ddd0; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">
            Accéder à mon espace
        </a>
    </p>
@endsection
