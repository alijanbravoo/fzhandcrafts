const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'unsplash-images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'picsum.photos',
      'via.placeholder.com',
      'lh3.googleusercontent.com',
      'drive.google.com',
      'i.imgur.com',
      'imgur.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = withPWA(nextConfig)


