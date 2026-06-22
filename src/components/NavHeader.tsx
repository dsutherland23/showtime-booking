'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import { PortalLinks } from '@/components/PortalLinks';

export function NavHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className={`global-header glassmorphism${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <Link 
          href="/" 
          className="logo-brand" 
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/logo.png" 
            alt="Showtime Services" 
            className="logo-image" 
            style={{ height: '30px' }}
          />
        </Link>

        {/* Desktop Menu links */}
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
          {/* Desktop Actions */}
          <div className="portal-buttons-group hidden md:flex">
            <PortalLinks />
          </div>
          <Link href="/book" className="btn btn-primary btn-sm-padding hidden sm:inline-flex">
            Book Now
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Drawer Overlay */}
      <div className={`mobile-nav-overlay${mobileMenuOpen ? ' open' : ''}`}>
        <div className="mobile-nav-links">
          <Link href="/talent" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Talent</Link>
          <Link href="/services" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
          <Link href="/events" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Events</Link>
          <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <Link href="/ai-assistant" className="mobile-nav-link ai-link" onClick={() => setMobileMenuOpen(false)}>
            <Sparkles style={{ display: 'inline', width: 16, height: 16, marginRight: 6, verticalAlign: '-1px' }} />
            AI Assistant
          </Link>
        </div>
        <div className="mobile-nav-actions">
          <PortalLinks onClick={() => setMobileMenuOpen(false)} />
          <Link href="/book" className="btn btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
