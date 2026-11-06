const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache Google Maps static and font assets
        urlPattern: /^https:\/\/(fonts\.(?:googleapis|gstatic)\.com|maps\.gstatic\.com)/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-maps-static-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      {
        // Static JS/CSS
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-assets-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate Google Maps mount in dev mode
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
