@extends('emails.layout')

@section('content')
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px;">
            👤 CANDIDATURE
        </span>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1410; text-align: center;">
        Nouvelle candidature
    </h2>
    <p style="margin: 0 0 28px; font-size: 15px; color: #6b5e50; text-align: center; line-height: 1.5;">
        Un candidat a postulé via le formulaire de recrutement.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf7f4; border-radius: 8px; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f; width: 100px;">Nom</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">{{ $data['name'] }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Email</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">
                            <a href="mailto:{{ $data['email'] }}" style="color: #1a1410;">{{ $data['email'] }}</a>
                        </td>
                    </tr>
                    @if(!empty($data['phone']))
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Téléphone</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">{{ $data['phone'] }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Poste</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">{{ $data['position'] }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8a7d6f;">Expérience</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #1a1410; font-weight: 600;">{{ $data['experience'] }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @if(!empty($data['message']))
    <div style="background-color: #faf7f4; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #8a7d6f;">Message :</p>
        <p style="margin: 0; font-size: 14px; color: #1a1410; line-height: 1.6; white-space: pre-line;">{{ $data['message'] }}</p>
    </div>
    @endif
@endsection
