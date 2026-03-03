import type { Metadata, Viewport } from 'next';
import { Rajdhani, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-tile',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CountDown — Daily Word & Numbers Game',
  description: 'Play the Countdown daily challenge: pick your letters, solve the numbers, beat the clock.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CountDown',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#070e1c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[#070e1c] text-white antialiased">
        <div className="mx-auto w-full max-w-2xl min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
