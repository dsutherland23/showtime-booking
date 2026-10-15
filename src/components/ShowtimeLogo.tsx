'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ShowtimeLogoProps {
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
}

/**
 * Showtime Logo Component with 5-rapid-click administrative entry trigger.
 * Standard clicks navigate home (/), while clicking 5 times quickly within
 * 2.5 seconds unlocks the Executive Admin Login portal.
 */
export function ShowtimeLogo({
  height = '30px',
  className = 'logo-brand',
  style,
  onClick,
  title = 'Showtime Entertainment Global'
}: ShowtimeLogoProps) {
  const router = useRouter();
  const { isStaff, isAdmin } = useAuth();
  const clickTimesRef = useRef<number[]>([]);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onClick) onClick();

    const now = Date.now();
    // Keep clicks occurring within the last 2500ms
    const recent = clickTimesRef.current.filter(t => now - t < 2500);
    recent.push(now);
    clickTimesRef.current = recent;

    // Check for 5 rapid clicks
    if (recent.length >= 5) {
      e.preventDefault();
      e.stopPropagation();
      clickTimesRef.current = [];

      // If already logged in as staff or admin, route straight to dashboard
      if (isAdmin || isStaff) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login?redirect=/dashboard&admin=1');
      }
    }
  };

  return (
    <Link
      href="/"
      className={className}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ...style }}
      onClick={handleLogoClick}
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.png"
        alt="Showtime Services"
        className="logo-image"
        style={{ height, objectFit: 'contain' }}
      />
    </Link>
  );
}

export default ShowtimeLogo;
