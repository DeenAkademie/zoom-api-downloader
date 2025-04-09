import { NextRequest, NextResponse } from 'next/server';

// Zoom API Konfiguration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Debugging aktivieren (true für detaillierte Logs)
const DEBUG = true;

// Hilfsfunktion zum Abrufen des Zoom Access Tokens
async function getZoomAccessToken() {
  try {
    if (DEBUG)
      console.log(
        `Anforderung eines Zoom Access Tokens mit Client ID: ${ZOOM_CLIENT_ID?.substring(
          0,
          5
        )}...`
      );

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
      console.error(`Zoom OAuth Token Fehler: ${response.status} ${errorText}`);
      throw new Error(`Zoom API Fehler: ${response.status} ${errorText}`);
    }

    // Access Token aus der Antwort extrahieren
    const data = await response.json();
    if (DEBUG) console.log('Zoom Access Token erfolgreich erhalten');
    return data.access_token;
  } catch (error) {
    console.error('Fehler beim Abrufen des Zoom Access Tokens:', error);
    throw error;
  }
}

// Funktion zum Validieren und Formatieren von Datumswerten
function validateAndFormatDate(dateString: string): string {
  try {
    // Prüfe ob es sich um ein gültiges Datum im Format YYYY-MM-DD handelt
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Versuche das Datum zu parsen
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Ungültiges Datum: ${dateString}`);
    }

    // Formatiere als YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Ungültiges Datum: ${dateString}`);
  }
}

// Handler für den API-Endpunkt
export async function GET(request: NextRequest) {
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

    // URL-Parameter abrufen
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Prüfen, ob die erforderlichen Parameter vorhanden sind
    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          error: 'Zeitraum (from und to) müssen angegeben werden',
        },
        { status: 400 }
      );
    }

    try {
      // Datumswerte validieren und formatieren
      const from = validateAndFormatDate(fromParam);
      const to = validateAndFormatDate(toParam);

      // Prüfen, ob der Zeitraum nicht mehr als 30 Tage beträgt
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 30) {
        return NextResponse.json(
          {
            error: 'Der Abfragezeitraum darf 30 Tage nicht überschreiten',
          },
          { status: 400 }
        );
      }

      // Prüfen, ob das Enddatum nicht in der Zukunft liegt
      if (toDate > new Date()) {
        return NextResponse.json(
          {
            error: 'Das Enddatum darf nicht in der Zukunft liegen',
          },
          { status: 400 }
        );
      }

      // Anfrage-URL erstellen
      const apiUrl = `https://api.zoom.us/v2/accounts/${ZOOM_ACCOUNT_ID}/recordings?from=${from}&to=${to}&page_size=100`;
      if (DEBUG) console.log(`Zoom API Anfrage: ${apiUrl}`);

      // Anfrage an die Zoom API senden
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Antwort als Text abrufen
      const responseText = await response.text();

      // Fehlerbehandlung
      if (!response.ok) {
        console.error(`Zoom API Fehler: ${response.status} ${responseText}`);
        return NextResponse.json(
          {
            error: `Fehler beim Abrufen der Aufnahmen: ${response.statusText}`,
            details: responseText,
          },
          { status: response.status }
        );
      }

      try {
        // Antwort parsen und zurückgeben
        const data = JSON.parse(responseText);
        if (DEBUG)
          console.log(
            `Zoom API Antwort: ${data.meetings?.length || 0} Aufnahmen gefunden`
          );
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Fehler beim Parsen der Zoom API Antwort:', parseError);
        return NextResponse.json(
          {
            error: 'Fehler beim Parsen der Zoom API Antwort',
            rawResponse: responseText,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Ungültiges Datumsformat',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufnahmen:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Fehler beim Abrufen der Aufnahmen',
      },
      { status: 500 }
    );
  }
}
