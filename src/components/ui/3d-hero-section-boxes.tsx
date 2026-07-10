"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 240;
const FRAME_DIR = '/images/ezgif-22f91a0364986244-jpg';
const SCROLL_MULTIPLIER = 3.0; // 300vh total scroll distance
const PRELOAD_INITIAL = 15;    // frames to preload immediately
const PRELOAD_MOBILE  = 8;     // fewer on mobile

// Pad frame number: 001 – 240
const frameSrc = (n: number) =>
  `${FRAME_DIR}/ezgif-frame-${String(n).padStart(3, '0')}.jpg`;

// ─── Text phases keyed to scroll progress 0→1 ─────────────────────────────
interface TextPhase {
  start: number;
  end: number;
  headline: string;
  sub?: string;
  tags?: string[];
  ctas?: { label: string; href: string; primary?: boolean }[];
}

const TEXT_PHASES: TextPhase[] = [
  {
    start: 0,
    end: 0.28,
    headline: 'Where Talent\nMeets The World.',
    sub: 'Connecting iconic artists, DJs, and selectors with unforgettable experiences.',
  },
  {
    start: 0.32,
    end: 0.65,
    headline: 'Beyond\nThe Stage.',
    tags: ['Curated Talent.', 'Global Experiences.', 'Unforgettable Moments.'],
  },
  {
    start: 0.72,
    end: 1.0,
    headline: 'Book The\nExperience.',
    sub: 'Premium entertainment. Exceptional talent.',
    ctas: [
      { label: 'Book An Artist', href: '/book', primary: true },
      { label: 'Explore Talent', href: '/talent' },
    ],
  },
];

// ─── easeInOutCubic for smooth frame interpolation ─────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Hook: preload images into an array ───────────────────────────────────
function useImageSequence() {
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array(TOTAL_FRAMES).fill(null)
  );
  const loadedRef = useRef<boolean[]>(Array(TOTAL_FRAMES).fill(false));
  const [initialReady, setInitialReady] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const preloadCount = isMobile ? PRELOAD_MOBILE : PRELOAD_INITIAL;
    let readyCount = 0;

    const onLoad = (i: number) => {
      loadedRef.current[i] = true;
      readyCount++;
      if (readyCount >= preloadCount) setInitialReady(true);
    };

    // Phase 1: preload first N frames immediately
    for (let i = 0; i < preloadCount; i++) {
      const img = new Image();
      img.src = frameSrc(i + 1);
      img.onload = () => onLoad(i);
      img.onerror = () => onLoad(i); // still count as done
      imagesRef.current[i] = img;
    }

    // Phase 2: load rest in background after a short delay
    const timer = setTimeout(() => {
      for (let i = preloadCount; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = frameSrc(i + 1);
        img.onload = () => { loadedRef.current[i] = true; };
        imagesRef.current[i] = img;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return { imagesRef, loadedRef, initialReady };
}

// ─── Main Hero Component ───────────────────────────────────────────────────
const HeroSection: React.FC = () => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const stickyRef      = useRef<HTMLDivElement>(null);
  const rafRef         = useRef<number>(0);
  const lastFrameRef   = useRef<number>(-1);
  const progressRef    = useRef<number>(0);

  const { imagesRef, loadedRef, initialReady } = useImageSequence();

  // ── Draw a specific frame index onto the canvas ──────────────────────────
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = imagesRef.current[frameIdx];
    if (!img || !loadedRef.current[frameIdx]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cover-fit the image to canvas
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth  || 1920;
    const ih = img.naturalHeight || 1080;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, [imagesRef, loadedRef]);

  // ── Resize canvas to match window ────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Redraw current frame after resize
    const fi = Math.min(
      Math.round(progressRef.current * (TOTAL_FRAMES - 1)),
      TOTAL_FRAMES - 1
    );
    drawFrame(fi);
  }, [drawFrame]);

  // ── RAF-driven scroll handler ─────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const rect   = wrapper.getBoundingClientRect();
        const total  = wrapper.offsetHeight - window.innerHeight;
        const scrolled = -rect.top; // pixels scrolled into wrapper
        const rawProgress = Math.max(0, Math.min(1, scrolled / total));

        // Smooth easing so it doesn't feel 1:1 mechanical
        const easedProgress = easeInOutCubic(rawProgress);
        progressRef.current = easedProgress;

        const frameIdx = Math.min(
          Math.round(easedProgress * (TOTAL_FRAMES - 1)),
          TOTAL_FRAMES - 1
        );

        if (frameIdx !== lastFrameRef.current) {
          lastFrameRef.current = frameIdx;
          drawFrame(frameIdx);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();
    drawFrame(0);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, resizeCanvas]);

  // Draw frame 0 once initial frames are ready
  useEffect(() => {
    if (initialReady) {
      resizeCanvas();
      drawFrame(0);
    }
  }, [initialReady, drawFrame, resizeCanvas]);

  return (
    <div
      ref={wrapperRef}
      style={{
        height: `${SCROLL_MULTIPLIER * 100}dvh`,
        position: 'relative',
        background: '#050505',
      }}
    >
      {/* ── Sticky viewport that pins during scroll ── */}
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100dvh',
          overflow: 'hidden',
          background: '#050505',
        }}
      >
        {/* Canvas — full viewport, hardware-accelerated */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />

        {/* Dark vignette edges — blends canvas into page bg */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(5,5,5,0.85) 0%, transparent 70%),
              radial-gradient(ellipse 100% 30% at 50% 0%, rgba(5,5,5,0.6) 0%, transparent 60%),
              linear-gradient(to right, rgba(5,5,5,0.55) 0%, transparent 15%, transparent 85%, rgba(5,5,5,0.55) 100%)
            `,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* ── Overlay text phases ── */}
        <TextOverlay progressRef={progressRef} />

        {/* Scroll cue — only visible at very start */}
        <ScrollCue />
      </div>
    </div>
  );
};

// ─── Text Overlay — updates on RAF tick independently ─────────────────────
function TextOverlay({ progressRef }: { progressRef: React.RefObject<number> }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(-1);

  useEffect(() => {
    const tick = () => {
      const p = progressRef.current;
      if (Math.abs(p - lastRef.current) > 0.001) {
        lastRef.current = p;
        setProgress(p);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [progressRef]);

  // Determine which phase is active
  const activePhase = TEXT_PHASES.find(ph => progress >= ph.start && progress <= ph.end) ?? null;
  const prevPhase   = TEXT_PHASES.find(ph => progress > ph.end && progress < ph.end + 0.08) ?? null;

  // Use the leaving phase for fade-out
  const displayPhase = activePhase ?? prevPhase;

  let phaseProgress = 0;
  let visible = false;
  if (displayPhase) {
    const range = displayPhase.end - displayPhase.start;
    const local = progress - displayPhase.start;
    phaseProgress = Math.max(0, Math.min(1, local / range));
    visible = activePhase !== null;
  }

  // Fade in first 15% of phase, hold, fade out last 15%
  const fadeIn  = Math.min(1, phaseProgress / 0.15);
  const fadeOut = phaseProgress > 0.85 ? Math.max(0, 1 - (phaseProgress - 0.85) / 0.15) : 1;
  const opacity = visible ? fadeIn * fadeOut : 0;
  const translateY = visible ? (1 - fadeIn) * 20 : 10;

  return (
    <div className={`hero-text-container ${opacity > 0.1 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <style jsx>{`
        .hero-text-container {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 8dvh;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          text-align: center;
        }

        .hero-inner-wrap {
          max-width: 760px;
          width: 100%;
          transition: none;
        }

        .hero-headline {
          font-family: var(--font-heading);
          font-size: clamp(2.5rem, 6.5vw, 5.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin: 0 0 1.25rem;
          white-space: pre-line;
          text-shadow: 0 4px 30px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.8);
        }

        .hero-sub {
          font-family: var(--font-body);
          font-size: clamp(0.95rem, 1.8vw, 1.25rem);
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin: 0 auto 2rem;
          max-width: 520px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.95), 0 1px 5px rgba(0,0,0,0.85);
        }

        .hero-tags-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .hero-tag-pill {
          font-family: var(--font-body);
          font-size: clamp(0.82rem, 1.4vw, 1rem);
          color: #ffffff;
          border: 1px solid rgba(212,175,55,0.4);
          border-radius: 100px;
          padding: 0.45rem 1.25rem;
          background: rgba(7, 5, 14, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }

        .hero-ctas-wrapper {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 2.2rem;
          border-radius: 100px;
          font-family: var(--font-body);
          font-size: 0.9375rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
          cursor: pointer;
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #f5d061 0%, #d4af37 100%);
          color: #07050e;
          font-weight: 700;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 32px rgba(212,175,55,0.25);
          border: none;
        }

        .hero-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(212,175,55,0.4);
        }

        .hero-btn-secondary {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.2);
          color: #ffffff;
          font-weight: 500;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .hero-btn-secondary:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(212,175,55,0.5);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .hero-text-container {
            justify-content: center;
            padding-bottom: 3.5rem;
          }
          .hero-headline {
            font-size: clamp(2rem, 7.5vw, 3.25rem);
            margin-bottom: 1rem;
          }
          .hero-sub {
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
            max-width: 90%;
            padding: 0 0.5rem;
          }
          .hero-tags-wrapper {
            gap: 0.4rem;
            margin-bottom: 1.5rem;
          }
          .hero-tag-pill {
            font-size: 0.75rem;
            padding: 0.3rem 0.8rem;
          }
          .hero-ctas-wrapper {
            flex-direction: column;
            gap: 0.65rem;
            width: 100%;
            max-width: 280px;
            margin: 0 auto;
          }
          .hero-btn {
            width: 100%;
            padding: 0.8rem 1.5rem;
            font-size: 0.875rem;
          }
        }
      `}</style>

      {displayPhase && (
        <div
          className="hero-inner-wrap"
          style={{
            opacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          {/* Headline */}
          <h1 className="hero-headline">{displayPhase.headline}</h1>

          {/* Sub */}
          {displayPhase.sub && <p className="hero-sub">{displayPhase.sub}</p>}

          {/* Tags */}
          {displayPhase.tags && (
            <div className="hero-tags-wrapper">
              {displayPhase.tags.map((t, i) => (
                <span key={i} className="hero-tag-pill">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          {displayPhase.ctas && (
            <div className="hero-ctas-wrapper">
              {displayPhase.ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={cta.primary ? "hero-btn hero-btn-primary" : "hero-btn hero-btn-secondary"}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scroll cue ───────────────────────────────────────────────────────────
function ScrollCue() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 80) setVisible(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
        }}
      >
        Scroll
      </span>
      <div
        style={{
          width: 1,
          height: 40,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)',
          animation: 'scrollCuePulse 1.6s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes scrollCuePulse {
          0%, 100% { opacity: 0.35; transform: scaleY(1); }
          50%       { opacity: 0.8;  transform: scaleY(1.15); }
        }
      `}</style>
    </div>
  );
}

export { HeroSection };
