'use client';

import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const pos = useRef({ x: -200, y: -200 });
  const ring = useRef({ x: -200, y: -200 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Only on desktop — skip on touch devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);
    const onDown = () => setIsPressed(true);
    const onUp = () => setIsPressed(false);

    // Label detection on interactive elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest('a, button, [data-cursor]') as HTMLElement | null;
      if (!el) { setLabel(''); return; }

      const cursorLabel = el.getAttribute('data-cursor');
      if (cursorLabel) { setLabel(cursorLabel); return; }

      const text = el.textContent?.trim() || '';
      if (el.tagName === 'A') {
        if (text.toLowerCase().includes('book') || text.toLowerCase().includes('reserv')) setLabel('Book');
        else if (text.toLowerCase().includes('view') || text.toLowerCase().includes('profile')) setLabel('View');
        else if (text.toLowerCase().includes('explore') || text.toLowerCase().includes('talent')) setLabel('Explore');
        else setLabel('');
      } else if (el.tagName === 'BUTTON') {
        setLabel(text.length > 0 && text.length < 12 ? text : '');
      } else {
        setLabel('');
      }
    };

    const onMouseOut = () => setLabel('');

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });

    // Smooth ring follow with lerp
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  const hasLabel = label.length > 0;

  return (
    <>
      {/* Inner dot — snaps instantly */}
      <div
        ref={dotRef}
        className={`cursor-dot${isVisible ? ' visible' : ''}${isPressed ? ' pressed' : ''}`}
        aria-hidden="true"
      />
      {/* Outer ring — lags behind for depth */}
      <div
        ref={ringRef}
        className={`cursor-ring${isVisible ? ' visible' : ''}${hasLabel ? ' expanded' : ''}${isPressed ? ' pressed' : ''}`}
        aria-hidden="true"
      >
        {hasLabel && <span className="cursor-label">{label}</span>}
      </div>
    </>
  );
}
