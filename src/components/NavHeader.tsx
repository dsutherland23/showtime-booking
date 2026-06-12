'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PortalLinks } from '@/components/PortalLinks';

export function NavHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`global-header glassmorphism${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="logo-brand" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/logo.png" 
            alt="Showtime Services" 
            className="logo-image" 
            style={{ 
              height: '30px', 
              width: 'auto', 
              objectFit: 'contain',
              mixBlendMode: 'multiply'
            }} 
          />
        </Link>

        <nav className="nav-menu">
          <Link href="/talent"       className="nav-link">Talent</Link>
          <Link href="/services"     className="nav-link">Services</Link>
          <Link href="/events"       className="nav-link">Events</Link>
          <Link href="/about"        className="nav-link">About</Link>
          <Link href="/contact"      className="nav-link">Contact</Link>
          <Link href="/ai-assistant" className="nav-link ai-link">
            <Sparkles
              style={{ display: 'inline', width: 13, height: 13,
                       marginRight: 4, verticalAlign: '-1px' }}
            />
            AI Assistant
          </Link>
        </nav>

        <div className="nav-actions">
          <div className="portal-buttons-group">
            <PortalLinks />
          </div>
          <Link href="/book" className="btn btn-primary btn-sm-padding">
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
