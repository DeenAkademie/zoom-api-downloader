// Hilfsfunktionen für die Zoom API

export async function getZoomAccessToken() {
  try {
    const response = await fetch('/api/zoom/token');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoom API Fehler: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('Fehler beim Abrufen des Zoom Access Tokens:', error);
    throw error;
  }
}

// Funktion zum Validieren und Formatieren von Datumswerten
export function validateAndFormatDate(dateString: string): string {
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
