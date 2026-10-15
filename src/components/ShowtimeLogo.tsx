'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ShowtimeLogoProps {
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
}

// Module-level state ensures rapid clicks survive re-renders and route transitions
let globalLogoClickHistory: number[] = [];
let singleClickTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Showtime Logo Component with 5-rapid-click administrative entry trigger.
 * Standard single clicks navigate home (/), while clicking 5 times quickly
 * within 4.5 seconds unlocks the Executive Admin Login portal.
 */
export function ShowtimeLogo({
  height = '30px',
  className = 'logo-brand',
  style,
  onClick,
  title = 'Showtime Entertainment Global'
}: ShowtimeLogoProps) {
  const { isStaff, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);

  const registerClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    // Keep clicks occurring within the last 4500ms
    globalLogoClickHistory = globalLogoClickHistory.filter(t => now - t < 4500);
    globalLogoClickHistory.push(now);

    const clickCount = globalLogoClickHistory.length;

    if (singleClickTimer) {
      clearTimeout(singleClickTimer);
      singleClickTimer = null;
    }

    // Subtle micro-pulse feedback on clicks 2+ so the user knows rapid clicks are registering
    if (clickCount >= 2) {
      setPulse(true);
      setTimeout(() => setPulse(false), 180);
    }

    // Check for 5 rapid clicks
    if (clickCount >= 5) {
      globalLogoClickHistory = [];

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
      } catch {}

      // Check both context and localStorage so even before hydration completes it knows if logged in
      const hasCachedSession = typeof window !== 'undefined' && Boolean(localStorage.getItem('st_active_user_id'));
      const target = (isAdmin || isStaff || hasCachedSession)
        ? '/dashboard'
        : '/auth/login?redirect=/dashboard&admin=1';

      window.location.assign(target);
      return;
    }

    // Standard single click: wait briefly to see if user is multi-clicking; if not, navigate home
    if (clickCount === 1) {
      if (onClick) onClick();
      singleClickTimer = setTimeout(() => {
        singleClickTimer = null;
        if (globalLogoClickHistory.length === 1) {
          globalLogoClickHistory = [];
          if (pathname !== '/') {
            router.push('/');
          } else if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }, 320);
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
        filter: pulse ? 'drop-shadow(0 0 10px rgba(212,175,55,0.75))' : 'none',
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

