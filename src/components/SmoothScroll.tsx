'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Do not hijack wheel/trackpad scrolling inside Admin Dashboard or Portals
    // where nested scrollable sidebars, tables, and modals require native scrolling.
    if (
      pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/portal')
    ) {
      return;
    }

    // Only apply Lenis smooth scroll on pointer:fine devices (mouse/trackpad)
    // Touch devices have native momentum scrolling that is superior and
    // interferes with the image sequence hero scroll animation.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false,
      prevent: (node: HTMLElement) =>
        Boolean(
          node?.closest?.(
            '[data-lenis-prevent], .dash-sidebar, .showtime-modal-card, dialog.admin-modal'
          )
        ),
    });

    // Connect Lenis to GSAP ScrollTrigger updates
    lenis.on('scroll', ScrollTrigger.update);

    // Frame request loop
    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
