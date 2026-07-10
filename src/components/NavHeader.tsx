'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function NavHeader() {
  const router = useRouter();
  const { user, profile, signOut, isStaff, isAdmin, isArtist, isClient } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const getPortalLink = () => {
    if (isAdmin || isStaff) return { href: '/dashboard', label: 'Dashboard' };
    if (isArtist) return { href: '/portal/artist', label: 'Artist Hub' };
    if (isClient) return { href: '/portal/client', label: 'My Portal' };
    return null;
  };

  const portalLink = getPortalLink();
  const initials = profile ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase() : '';

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
          <img src="/images/logo.png" alt="Showtime Services" className="logo-image" style={{ height: '30px' }} />
        </Link>

        {/* Desktop Menu */}
        <nav className="nav-menu" aria-label="Main navigation">
          <Link href="/talent" className="nav-link">Talent</Link>
          <Link href="/services" className="nav-link">Services</Link>
          <Link href="/events" className="nav-link">Events</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </nav>

        <div className="nav-actions">
          {user && profile ? (
            /* Authenticated user menu */
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <div className="user-avatar" aria-hidden="true">{initials}</div>
                <span className="user-name">{profile.first_name}</span>
                <ChevronDown className={`user-chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-header">
                    <div className="user-avatar-lg">{initials}</div>
                    <div>
                      <p className="dropdown-name">{profile.first_name} {profile.last_name}</p>
                      <p className="dropdown-role">{profile.role}</p>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  {portalLink && (
                    <Link
                      href={portalLink.href}
                      className="user-dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {portalLink.label}
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="user-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                  >
                    <User className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item user-dropdown-signout"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest actions */
            <div className="portal-buttons-group hidden md:flex">
              <Link href="/auth/login" className="btn btn-secondary btn-sm-padding">Sign In</Link>
              <Link href="/book" className="btn btn-primary btn-sm-padding">Book Now</Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-nav-overlay${mobileMenuOpen ? ' open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          <Link href="/talent" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Talent</Link>
          <Link href="/services" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
          <Link href="/events" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Events</Link>
          <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </nav>
        <div className="mobile-nav-actions">
          {user && profile ? (
            <>
              {portalLink && (
                <Link href={portalLink.href} className="btn btn-secondary w-full text-center" onClick={() => setMobileMenuOpen(false)}>
                  {portalLink.label}
                </Link>
              )}
              <button className="btn btn-secondary w-full" onClick={handleSignOut} style={{ gap: '0.5rem' }}>
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-secondary w-full text-center" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/book" className="btn btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>Book Now</Link>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .user-menu-wrap {
          position: relative;
        }
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-pill);
          padding: 0.35rem 0.75rem 0.35rem 0.35rem;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 0.8125rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }
        .user-menu-trigger:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(212,175,55,0.3);
        }
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: #07050e;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .user-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-chevron {
          width: 13px;
          height: 13px;
          color: var(--text-muted);
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }
        .user-chevron.open { transform: rotate(180deg); }

        @media (max-width: 767px) {
          .user-name { display: none; }
          .user-chevron { display: none; }
          .user-menu-trigger {
            padding: 0.3rem;
            border-radius: 50%;
            background: transparent;
            border-color: transparent;
          }
          .user-menu-trigger:hover {
            background: rgba(255,255,255,0.06);
            border-color: rgba(212,175,55,0.2);
          }
          .user-avatar { width: 32px; height: 32px; font-size: 0.7rem; }
          .user-dropdown { right: 0; width: 220px; }
        }
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: rgba(12, 10, 23, 0.97);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
        }
        .user-avatar-lg {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: #07050e;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dropdown-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          max-width: none;
          margin: 0 0 2px;
        }
        .dropdown-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          max-width: none;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .user-dropdown-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0;
        }
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.65rem 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .user-dropdown-item:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }
        .user-dropdown-signout {
          color: #ff453a;
        }
        .user-dropdown-signout:hover {
          background: rgba(255, 69, 58, 0.08);
          color: #ff453a;
        }
      `}</style>
    </header>
  );
}
