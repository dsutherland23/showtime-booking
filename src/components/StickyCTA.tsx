'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const nearFooter = scrollY + winH > docH - 320;

      if (scrollY > 600 && !nearFooter) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`sticky-cta-bar${visible ? ' sticky-cta-visible' : ''}`}
      role="complementary"
      aria-label="Book talent CTA"
    >
      <div className="sticky-cta-inner">
        <div className="sticky-cta-text">
          <span className="sticky-cta-pulse" aria-hidden="true" />
          <span className="sticky-cta-label">Ready to book a headliner?</span>
        </div>
        <Link href="/book" className="sticky-cta-btn" data-cursor="Book">
          Reserve an Artist
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          className="sticky-cta-close"
          onClick={() => { setDismissed(true); setVisible(false); }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
