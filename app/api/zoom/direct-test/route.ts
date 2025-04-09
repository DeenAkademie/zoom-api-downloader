import { NextResponse } from 'next/server';

// Zoom API Konfiguration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Hilfsfunktion zum Abrufen des Zoom Access Tokens
async function getZoomAccessToken() {
  try {
    // Überprüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom API-Anmeldedaten fehlen');
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
      throw new Error(`Zoom API Fehler: ${response.status} ${errorText}`);
    }

    // Access Token aus der Antwort extrahieren
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Fehler beim Abrufen des Zoom Access Tokens:', error);
    throw error;
  }
}

// Handler für den API-Endpunkt
export async function GET() {
  try {
    // Überprüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      return NextResponse.json(
        {
          error:
            'Zoom API-Anmeldedaten fehlen. Bitte prüfe deine Umgebungsvariablen.',
        },
        { status: 500 }
      );
    }

    // Access Token abrufen
    const accessToken = await getZoomAccessToken();

    // Test-Anfrage an die Zoom API senden
    const response = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Fehler beim API-Test: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Antwort parsen und zurückgeben
    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: 'API-Verbindung erfolgreich',
      user: data,
    });
  } catch (error) {
    console.error('Fehler beim Testen der API:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Testen der API',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
