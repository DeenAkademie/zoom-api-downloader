'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface Recording {
  uuid: string;
  topic: string;
  start_time: string;
  recording_files: {
    download_url: string;
    recording_type: string;
    file_type: string;
    file_size: number;
  }[];
}

export default function RecordingsList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [targetDir, setTargetDir] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  useEffect(() => {
    checkServerConnection();
  }, []);

  useEffect(() => {
    filterRecordings();
  }, [recordings, searchTerm]);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('/api/zoom/test');
      const data = await response.json();

      if (data.status === 'ok') {
        setConnectionStatus('success');

        if (
          !data.credentials.apiKeySet ||
          !data.credentials.apiSecretSet ||
          !data.credentials.accountIdSet
        ) {
          setError(
            'Zoom API-Anmeldedaten fehlen. Bitte prüfe deine .env-Datei.'
          );
        }
      } else {
        setConnectionStatus('error');
        setError('Server ist nicht erreichbar');
      }
    } catch (err) {
      console.error('Server-Verbindungsfehler:', err);
      setConnectionStatus('error');
      setError('Server ist nicht erreichbar');
    }
  };

  const testZoomApi = async () => {
    try {
      setError(null);
      setLoading(true);
      setShowTestResult(true);

      const response = await fetch('/api/zoom/direct-test');

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `API-Test fehlgeschlagen: ${response.statusText}`;

        try {
          const errorData = JSON.parse(responseText);
          setApiTestResult(errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('API-Test Details:', errorData.details);
          }
        } catch (parseError) {
          setApiTestResult({ error: responseText });
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApiTestResult(data);
      console.log('API-Test erfolgreich:', data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'API-Test fehlgeschlagen';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      const from = fromDate;
      const to = toDate;

      console.log(
        `Anfrage an /api/zoom/recordings mit Zeitraum: ${from} bis ${to}`
      );

      const response = await fetch(
        `/api/zoom/recordings?from=${from}&to=${to}`
      );

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Fehler beim Abrufen der Aufnahmen: ${response.statusText}`;

        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('API-Fehler Details:', errorData.details);
          }
        } catch (parseError) {
          errorMessage += ` - ${responseText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecordings(data.meetings || []);
      console.log(`${data.meetings?.length || 0} Aufnahmen geladen`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Laden der Aufnahmen';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterRecordings = () => {
    if (!searchTerm.trim()) {
      setFilteredRecordings(recordings);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = recordings.filter((recording) =>
      recording.topic.toLowerCase().includes(term)
    );
    setFilteredRecordings(filtered);
  };

  const handleDownload = async (recording: Recording, fileIndex: number) => {
    if (!targetDir) {
      setError('Bitte wähle ein Zielverzeichnis aus');
      return;
    }

    try {
      setLoading(true);
      const file = recording.recording_files[fileIndex];
      const filename = `${recording.topic}_${new Date(
        recording.start_time
      ).toISOString()}_${file.recording_type}.${file.file_type.toLowerCase()}`;

      const response = await fetch('/api/zoom/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadUrl: file.download_url,
          filename,
          targetDir,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Herunterladen');
      }

      alert(`Datei erfolgreich heruntergeladen nach: ${result.filePath}`);
    } catch (err) {
      setError('Fehler beim Herunterladen der Aufnahme');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (connectionStatus === 'loading') {
    return (
      <div className='flex justify-center p-8'>
        Verbindung zum Server wird hergestellt...
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className='flex flex-col items-center p-8'>
        <div className='text-red-500 mb-4'>
          Verbindung zum Server fehlgeschlagen. Stelle sicher, dass der
          Backend-Server läuft.
        </div>
        <Button onClick={checkServerConnection}>Erneut versuchen</Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-8'>
      <div className='bg-white p-6 rounded-lg shadow-sm mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Einstellungen</h2>

        <div className='mb-4'>
          <label className='block text-sm font-medium mb-2'>
            Zielverzeichnis:
          </label>
          <input
            type='text'
            value={targetDir}
            onChange={(e) => setTargetDir(e.target.value)}
            className='w-full p-2 border rounded'
            placeholder='/pfad/zum/zielverzeichnis'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Von Datum:</label>
            <input
              type='date'
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className='w-full p-2 border rounded'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Bis Datum:</label>
            <input
              type='date'
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className='w-full p-2 border rounded'
            />
          </div>
        </div>

        <div className='flex gap-4 flex-wrap'>
          <Button onClick={fetchRecordings} disabled={loading}>
            {loading ? 'Lädt...' : 'Aufnahmen laden'}
          </Button>
          <Button onClick={testZoomApi} disabled={loading} variant='outline'>
            Zoom API Verbindung testen
          </Button>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6'>
          <p>{error}</p>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setError(null)}
            className='mt-2'
          >
            Schließen
          </Button>
        </div>
      )}

      {showTestResult && apiTestResult && (
        <div className='bg-white p-6 rounded-lg shadow-sm mb-6'>
          <h3 className='font-medium mb-2'>API Test Ergebnis:</h3>
          <div className='bg-gray-100 p-4 rounded overflow-auto max-h-80'>
            <pre className='text-xs'>
              {JSON.stringify(apiTestResult, null, 2)}
            </pre>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowTestResult(false)}
            className='mt-2'
          >
            Schließen
          </Button>
        </div>
      )}

      <div className='bg-white p-6 rounded-lg shadow-sm mb-6'>
        <div className='mb-4'>
          <label className='block text-sm font-medium mb-2'>
            Nach Titel suchen:
          </label>
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full p-2 border rounded'
            placeholder='Suchbegriff eingeben...'
          />
        </div>

        <p className='text-sm text-gray-500'>
          {filteredRecordings.length} Aufnahmen gefunden
        </p>
      </div>

      {filteredRecordings.length === 0 && !loading ? (
        <div className='text-center p-8 bg-white rounded-lg'>
          <p>Keine Aufnahmen gefunden.</p>
          <p className='text-sm text-gray-500 mt-2'>
            Versuche einen anderen Zeitraum auszuwählen oder prüfe deine
            API-Anmeldedaten.
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {filteredRecordings.map((recording) => (
            <div
              key={recording.uuid}
              className='border rounded-lg p-4 shadow-sm bg-white'
            >
              <h3 className='font-medium mb-2'>{recording.topic}</h3>
              <p className='text-sm text-gray-500 mb-4'>
                {new Date(recording.start_time).toLocaleString()}
              </p>
              <div className='flex flex-wrap gap-2'>
                {recording.recording_files.map((file, index) => (
                  <Button
                    key={index}
                    variant='outline'
                    size='sm'
                    onClick={() => handleDownload(recording, index)}
                    disabled={loading}
                  >
                    {file.recording_type} (
                    {(file.file_size / 1024 / 1024).toFixed(1)} MB)
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
