# Zoom Aufnahmen Downloader (Next.js)

Eine Web-Anwendung zum Herunterladen von Zoom-Aufnahmen über die Zoom-API.

## Funktionen

- Abrufen und Anzeigen von Zoom-Aufnahmen für einen bestimmten Zeitraum
- Filtern der Aufnahmen nach Titel
- Herunterladen einzelner Aufnahmen mit einem Klick
- Testen der Verbindung zur Zoom-API

## Voraussetzungen

- Node.js und npm
- Zoom-Konto mit Server-to-Server OAuth App (siehe Setup-Anweisungen unten)

## Installation

1. Repository klonen:
   ```
   git clone <repository-url>
   cd zoom-api-downloader-next
   ```

2. Abhängigkeiten installieren:
   ```
   npm install
   ```

3. Umgebungsvariablen einrichten:
   - Kopiere die Datei `.env.local` und fülle sie mit deinen Zoom-API-Anmeldedaten aus:
     ```
     ZOOM_CLIENT_ID=dein_client_id
     ZOOM_CLIENT_SECRET=dein_client_secret
     ZOOM_ACCOUNT_ID=dein_account_id
     ```

## Entwicklung

Starte den Entwicklungsserver:
```
npm run dev
```

Die Anwendung wird unter [http://localhost:3000](http://localhost:3000) verfügbar sein.

## Zoom API-Setup

1. Gehe zum [Zoom App Marketplace](https://marketplace.zoom.us/).
2. Wähle "Develop" und dann "Build App".
3. Wähle "Server-to-Server OAuth" als App-Typ.
4. Fülle die erforderlichen Informationen aus und erstelle die App.
5. In der App-Konfiguration, füge den Scope `recording:read` hinzu (manchmal als `cloud_recording:read:list_account_recordings:master` bezeichnet).
6. Notiere dir die Account ID, Client ID und Client Secret, und trage sie in die `.env.local` Datei ein.

## Nutzung

1. Starte die Anwendung mit `npm run dev`.
2. Gib ein Zielverzeichnis für die Downloads ein.
3. Wähle einen Datumsbereich aus (maximal 30 Tage) und klicke auf "Aufnahmen laden".
4. Filtere die Aufnahmen nach Bedarf mit der Suchfunktion.
5. Klicke auf die Schaltfläche neben einer Aufnahme, um sie herunterzuladen.

## Deployment

Die Anwendung kann einfach auf Vercel deployt werden:

```
npm install -g vercel
vercel
```

Vergiss nicht, die Umgebungsvariablen in den Vercel-Projekteinstellungen zu konfigurieren.

## Hinweise

- Der maximale Abfragezeitraum für die Zoom-API beträgt 30 Tage.
- Du benötigst die entsprechenden Berechtigungen für den Zugriff auf die Aufnahmen.
- Das Enddatum darf nicht in der Zukunft liegen. 