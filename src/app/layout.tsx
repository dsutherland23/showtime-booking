import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NavHeader } from '@/components/NavHeader';
import { ScrollRevealInit } from '@/components/ScrollRevealInit';
import { ThemeProvider } from 'next-themes';
import { SmoothScroll } from '@/components/SmoothScroll';
import { CustomCursor } from '@/components/CustomCursor';
import { SplashScreen } from '@/components/SplashScreen';
import { StickyCTA } from '@/components/StickyCTA';
import Link from 'next/link';
import React from 'react';
import RoleSwitcher from '@/components/RoleSwitcher';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://showtimeservices.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Showtime Booking Agency | Elite Caribbean & International Talent',
    template: '%s | Showtime Booking Agency',
  },
  description:
    'The premier global booking agency and entertainment logistics platform for Caribbean and international talent. Book legendary reggae, dancehall, DJs, comedians, and live performers.',
  keywords: [
    'reggae artist booking',
    'dancehall artist booking',
    'talent agency',
    'entertainment logistics',
    'event production',
    'Caribbean talent booking',
    'Jamaica',
    'book DJ',
    'showtime booking',
    'live entertainment',
  ],
  authors: [{ name: 'Showtime Entertainment Group', url: siteUrl }],
  creator: 'Showtime Entertainment Group',
  publisher: 'Showtime Entertainment Group',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Showtime Booking Agency',
    title: 'Showtime Booking Agency | Elite Caribbean & International Talent',
    description: 'The premier global booking agency for Caribbean and international talent. Book reggae, dancehall, DJs, and live performers.',
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Showtime Booking Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Showtime Booking Agency | Elite Caribbean & International Talent',
    description: 'The premier global booking agency for Caribbean and international talent.',
    images: [`${siteUrl}/images/og-image.jpg`],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07050e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <div className="app-layout">
              <ScrollRevealInit />
              <SplashScreen />
              <CustomCursor />
              <NavHeader />

              <SmoothScroll>
                <main className="main-content-wrapper" id="main-content">
                  {children}
                </main>
              </SmoothScroll>

              <footer className="global-footer" role="contentinfo">
                <div className="footer-container">
                  <div className="footer-brand-section">
                    <Link href="/" className="logo-brand" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/logo.png" alt="Showtime Services" className="logo-image" style={{ height: '26px' }} />
                    </Link>
                    <p className="footer-bio">
                      Crafting extraordinary live entertainment experiences worldwide.
                      Connecting elite Caribbean and international talent with global stages.
                    </p>
                  </div>

                  <div className="footer-links-col">
                    <h4>Discover</h4>
                    <Link href="/talent">Talent Directory</Link>
                    <Link href="/services">Our Services</Link>
                    <Link href="/events">Showcase Events</Link>
                  </div>

                  <div className="footer-links-col">
                    <h4>Portals</h4>
                    <Link href="/portal/client">Client Portal</Link>
                    <Link href="/portal/artist">Artist Hub</Link>
                    <Link href="/about">About Us</Link>
                    <Link href="/book">Book an Artist</Link>
                  </div>

                  <div className="footer-links-col">
                    <h4>Contact</h4>
                    <p className="contact-item">Jamaica &bull; United Kingdom</p>
                    <p className="contact-item">info@showtimeservices.com</p>
                    <p className="contact-item">Tel: +1876 227 1666 (JM)</p>
                    <p className="contact-item">Tel: +44 7706 572197 (UK)</p>
                  </div>
                </div>

                <div className="footer-bottom">
                  <div>
                    <p>&copy; {new Date().getFullYear()} Showtime Services. All Rights Reserved.</p>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.72rem' }}>
                      Design by{' '}
                      <a
                        href="https://www.instagram.com/socialkon10_cre8tive/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}
                      >
                        socialkon10 Marketing
                      </a>
                      .
                    </p>
                  </div>
                  <p>Kingston, Jamaica &bull; London, United Kingdom</p>
                </div>
              </footer>
              <StickyCTA />
              <RoleSwitcher />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
