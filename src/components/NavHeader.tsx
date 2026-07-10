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
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  if (!userMenuOpen) setMobileMenuOpen(false);
                }}
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
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) setUserMenuOpen(false);
            }}
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
          top: calc(100% + 10px);
          right: 0;
          width: 250px;
          background: rgba(10, 8, 20, 0.76);
          backdrop-filter: blur(36px) saturate(210%);
          -webkit-backdrop-filter: blur(36px) saturate(210%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.12); /* Glossy top bevel */
          overflow: hidden;
          animation: premiumDropdownIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1000;
        }
        @keyframes premiumDropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.1rem;
          background: rgba(255, 255, 255, 0.015);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .user-avatar-lg {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: #07050e;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
        }
        .dropdown-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          max-width: none;
          margin: 0 0 3px;
          letter-spacing: -0.01em;
        }
        .dropdown-role {
          font-size: 0.65rem;
          color: var(--accent);
          max-width: none;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .user-dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.04);
          margin: 0;
        }
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1.1rem;
          font-size: 0.84rem;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
        }
        .user-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-primary);
          padding-left: 1.3rem; /* Micro-slide on hover */
        }
        .user-dropdown-item svg {
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .user-dropdown-item:hover svg {
          color: var(--accent);
        }
        .user-dropdown-signout {
          color: #ff453a;
        }
        .user-dropdown-signout:hover {
          background: rgba(255, 69, 58, 0.06);
          color: #ff453a;
          padding-left: 1.3rem;
        }
        .user-dropdown-signout:hover svg {
          color: #ff453a;
        }
      `}</style>
    </header>
  );
}
