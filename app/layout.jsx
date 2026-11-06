import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { NavigationProvider } from '../context/NavigationContext';

export const metadata = {
  title: 'Tesla Navigator & Live Traffic',
  description: 'In-car Google Maps Navigation with Live Traffic, Anti-Refresh, and Anti-Sleep for Tesla Browser',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0b0e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka" className="dark bg-[#0a0b0e] h-full w-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="h-full w-full overflow-hidden bg-[#0a0b0e] text-white antialiased">
        <AuthProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
