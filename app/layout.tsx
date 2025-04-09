import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zoom Aufnahmen Downloader',
  description: 'Lade Zoom-Aufnahmen einfach herunter',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='de'>
      <body>
        <div className='min-h-screen bg-gray-50'>
          <header className='bg-white shadow-sm'>
            <div className='container mx-auto p-4'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Zoom Aufnahmen Downloader
              </h1>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
