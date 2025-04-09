import { NextResponse } from 'next/server';

// Zoom API Konfiguration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Handler für den API-Endpunkt
export async function GET() {
  try {
    // Überprüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      console.error('FEHLER: Zoom API-Anmeldedaten fehlen');
      return NextResponse.json(
        {
          error:
            'Zoom API-Anmeldedaten fehlen. Bitte prüfe deine Umgebungsvariablen.',
        },
        { status: 500 }
      );
    }

    // Anfrage an Zoom API senden, um den Access Token zu erhalten
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID,
        client_id: ZOOM_CLIENT_ID,
        client_secret: ZOOM_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Zoom OAuth Token Fehler: ${response.status} ${errorText}`);
      return NextResponse.json(
        {
          error: `Zoom API Fehler: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Access Token aus der Antwort extrahieren
    const data = await response.json();
    return NextResponse.json({ accessToken: data.access_token });
  } catch (error) {
    console.error('Fehler beim Abrufen des Zoom Access Tokens:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen des Zoom Access Tokens',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
