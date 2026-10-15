'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ShowtimeLogoProps {
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
}

// Module-level timestamp array ensures rapid clicks survive re-renders and route transitions
let globalLogoClickHistory: number[] = [];

/**
 * Showtime Logo Component with 5-rapid-click administrative entry trigger.
 * Standard single clicks navigate home (/), while clicking 5 times quickly
 * within 3.8 seconds unlocks the Executive Admin Login portal.
 */
export function ShowtimeLogo({
  height = '30px',
  className = 'logo-brand',
  style,
  onClick,
  title = 'Showtime Entertainment Global'
}: ShowtimeLogoProps) {
  const { isStaff, isAdmin } = useAuth();
  const [pulse, setPulse] = useState(false);

  const registerClick = (e: React.SyntheticEvent) => {
    if (onClick) onClick();

    const now = Date.now();
    // Keep clicks occurring within the last 3800ms
    globalLogoClickHistory = globalLogoClickHistory.filter(t => now - t < 3800);
    globalLogoClickHistory.push(now);

    const clickCount = globalLogoClickHistory.length;

    // If rapid clicks are in progress (2 or more clicks within the window),
    // prevent default Link navigation to avoid canceling subsequent clicks
    if (clickCount >= 2) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Subtle micro-pulse feedback on clicks 3+ so the user knows rapid clicks are registering
    if (clickCount >= 3) {
      setPulse(true);
      setTimeout(() => setPulse(false), 200);
    }

    // Check for 5 rapid clicks
    if (clickCount >= 5) {
      e.preventDefault();
      e.stopPropagation();
      globalLogoClickHistory = [];

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
      } catch {}

      // If already logged in as staff or admin, route straight to dashboard
      const target = (isAdmin || isStaff)
        ? '/dashboard'
        : '/auth/login?redirect=/dashboard&admin=1';

      window.location.assign(target);
    }
  };

  return (
    <Link
      href="/"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'transform 0.15s ease, filter 0.15s ease',
        transform: pulse ? 'scale(1.08)' : 'scale(1)',
        filter: pulse ? 'drop-shadow(0 0 10px rgba(212,175,55,0.7))' : 'none',
        ...style,
      }}
      onClick={registerClick}
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.png"
        alt="Showtime Services"
        className="logo-image"
        style={{ height, objectFit: 'contain', pointerEvents: 'none' }}
      />
    </Link>
  );
}

export default ShowtimeLogo;
