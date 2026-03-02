<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RR Ice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0eb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f0eb;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">

                    {{-- Header --}}
                    <tr>
                        <td align="center" style="background-color: #1a1410; padding: 28px 24px; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #e8ddd0; letter-spacing: 3px;">
                                RR ICE
                            </h1>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="background-color: #ffffff; padding: 32px 28px;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="background-color: #1a1410; padding: 24px; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0 0 6px; font-size: 13px; color: #a89a8a;">
                                RR Ice — Ghandouri, Tanger
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #7a6e60;">
                                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
