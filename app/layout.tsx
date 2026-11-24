import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mi Recetario PWA',
  description: 'Recetario digital rápido y disponible sin conexión.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recetario',
  },
  icons: {
    apple: '/img/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}