import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: '**.paypalobjects.com' },
      { protocol: 'https', hostname: '**.paypal.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://*.firebaseapp.com https://*.paypal.com https://*.paypalobjects.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.supabase.in https://prod.spline.design https://*.spline.design https://*.googleusercontent.com https://lh3.googleusercontent.com https://*.paypalobjects.com https://www.paypalobjects.com https://*.paypal.com https://www.paypal.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://prod.spline.design https://*.spline.design https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.paypal.com https://www.paypal.com",
              "media-src 'self' https: blob:",
              "worker-src 'self' blob:",
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.paypal.com https://www.paypal.com",
              "base-uri 'self'",
              "form-action 'self' https://www.paypal.com https://*.paypal.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
