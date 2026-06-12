import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { NavHeader } from '@/components/NavHeader';
import { ScrollRevealInit } from '@/components/ScrollRevealInit';
import { ThemeProvider } from 'next-themes';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  title: 'Showtime Booking Agency | Elite Entertainment & Talent Management',
  description:
    'The premier global booking agency and entertainment logistics platform for Caribbean and international talent. Book legendary reggae, dancehall, DJs, comedians, and hosts.',
  keywords:
    'reggae artist booking, dancehall artist booking, talent agency, entertainment logistics, event production, Caribbean talent booking, Jamaica, book DJ, showtime booking',
  authors: [{ name: 'Showtime Entertainment Group' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
          <div className="app-layout">
            {/* Scroll-reveal initializer (client-only, returns null) */}
            <ScrollRevealInit />

            {/* Scroll-aware Apple-style nav */}
            <NavHeader />

            {/* Main Content */}
            <main className="main-content-wrapper">{children}</main>

            {/* Footer */}
            <footer className="global-footer">
              <div className="footer-container">
                <div className="footer-brand-section">
                  <Link href="/" className="logo-brand" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/images/logo.png" 
                      alt="Showtime Services" 
                      className="logo-image" 
                      style={{ 
                        height: '26px', 
                        width: 'auto', 
                        objectFit: 'contain',
                        mixBlendMode: 'multiply'
                      }} 
                    />
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
                  <Link href="/ai-assistant">AI Booking Agent</Link>
                </div>

                <div className="footer-links-col">
                  <h4>Enterprise</h4>
                  <Link href="/dashboard">Agent CRM Dashboard</Link>
                  <Link href="/portal/client">Client Booking Portal</Link>
                  <Link href="/portal/artist">Artist Management Hub</Link>
                  <Link href="/about">Corporate Profile</Link>
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
                      className="hover:underline"
                      style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}
                    >
                      socialkon10 Marketing
                    </a>.
                  </p>
                </div>
                <p>Kingston, Jamaica &bull; London, United Kingdom</p>
              </div>
            </footer>

            {/* Floating Role Switcher (dev tool) */}
            <RoleSwitcher />
          </div>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
