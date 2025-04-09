import { NextResponse } from 'next/server';

// Zoom API Konfiguration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Handler für den API-Endpunkt
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Server läuft',
    credentials: {
      apiKeySet: !!ZOOM_CLIENT_ID,
      apiSecretSet: !!ZOOM_CLIENT_SECRET,
      accountIdSet: !!ZOOM_ACCOUNT_ID,
    },
  });
}
