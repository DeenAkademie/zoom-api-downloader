import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
export async function POST(request: NextRequest) {
  try {
    // Request-Body abrufen
    const body = await request.json();
    const { downloadUrl, filename, targetDir } = body;

    // Prüfen, ob die erforderlichen Parameter vorhanden sind
    if (!downloadUrl || !filename || !targetDir) {
      return NextResponse.json(
        {
          error:
            'Fehlende Parameter: downloadUrl, filename und targetDir sind erforderlich',
        },
        { status: 400 }
      );
    }

    // Access Token abrufen
    const accessToken = await getZoomAccessToken();

    // Zielverzeichnis erstellen, falls es nicht existiert
    try {
      await fs.mkdir(targetDir, { recursive: true });
      console.log(`Verzeichnis erstellt/geprüft: ${targetDir}`);
    } catch (err) {
      console.error(
        `Fehler beim Erstellen des Verzeichnisses ${targetDir}:`,
        err
      );
      return NextResponse.json(
        {
          error: `Fehler beim Erstellen des Verzeichnisses: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 500 }
      );
    }

    console.log(`Starte Download von: ${downloadUrl}`);
    console.log(`Speichere unter: ${path.join(targetDir, filename)}`);

    // Anfrage an die Zoom API senden, um die Datei herunterzuladen
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Zoom API Fehler: ${response.status} ${errorText}`);
      return NextResponse.json(
        {
          error: `Fehler beim Herunterladen: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Datei speichern
    const filePath = path.join(targetDir, filename);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    // Erfolgreiche Antwort zurückgeben
    return NextResponse.json({
      success: true,
      message: 'Datei erfolgreich heruntergeladen',
      filePath,
    });
  } catch (error) {
    console.error('Fehler beim Herunterladen der Aufnahme:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Fehler beim Herunterladen der Aufnahme',
      },
      { status: 500 }
    );
  }
}
