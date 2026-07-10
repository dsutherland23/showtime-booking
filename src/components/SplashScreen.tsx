'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem('st_splash_seen');
    if (seen) return;

    setShow(true);
    sessionStorage.setItem('st_splash_seen', '1');

    // Start hiding after 1.4s
    const hideTimer = setTimeout(() => {
      setHiding(true);
    }, 1400);

    // Fully remove after animation completes
    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 2200);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`splash-screen${hiding ? ' splash-hiding' : ''}`} aria-hidden="true">
      <div className="splash-inner">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Showtime Services"
          className="splash-logo"
        />
        {/* Tagline */}
        <p className="splash-tagline">Elite Caribbean Talent</p>
        {/* Loading bar */}
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
      </div>
      {/* Wipe overlay */}
      <div className="splash-wipe" />
    </div>
  );
}
