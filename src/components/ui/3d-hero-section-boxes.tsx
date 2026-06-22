"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline';
import { Sparkles } from 'lucide-react';

function HeroSplineBackground() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      pointerEvents: 'auto',
      overflow: 'hidden',
    }}>
      {isDesktop ? (
        <Spline
          style={{
            width: '100%',
            height: '100vh',
            pointerEvents: 'auto',
          }}
          scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
        />
      ) : (
        <div className="absolute inset-0 bg-[#07050e] overflow-hidden">
          {/* Animated gold ambient glow */}
          <div className="absolute top-[20%] left-[10%] w-[250px] h-[250px] rounded-full bg-[#d4af37]/10 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
          {/* Animated purple ambient glow */}
          <div className="absolute bottom-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#a855f7]/8 blur-[110px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: `
            linear-gradient(to right, rgba(7, 5, 14, 0.85), transparent 30%, transparent 70%, rgba(7, 5, 14, 0.85)),
            linear-gradient(to bottom, transparent 40%, rgba(7, 5, 14, 1))
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function ScreenshotSection({ screenshotRef }: { screenshotRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 mt-11 md:mt-12">
      <div 
        ref={screenshotRef} 
        className="bg-[#0c0a17]/80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 w-full md:w-[80%] lg:w-[70%] mx-auto backdrop-blur-md transition-all duration-300 hover:border-[#d4af37]/30"
        style={{
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.05)',
        }}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/concert_stage.jpg"
            alt="Showtime Booking Concert Stage Production"
            className="w-full h-full object-cover block"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07050e] via-transparent to-transparent opacity-60" />
        </div>
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="text-white px-6 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-16 gap-8">

      <div className="w-full lg:w-3/5 pr-0 lg:pr-8 mb-4 lg:mb-0">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-[11px] font-semibold tracking-wider text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full uppercase">
            Showtime &middot; Live 3D Experience
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-[1.05] tracking-tight">
          The world's leading <br />
          <span 
            className="font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #f5d061 0%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Caribbean talent
          </span><br />
          booking platform.
        </h1>
        <div className="text-[11px] font-bold text-[#d4af37] tracking-[0.2em] mt-6 flex items-center gap-2">
          ROOTS <span className="opacity-30">&middot;</span> DANCEHALL <span className="opacity-30">&middot;</span> REGGAE <span className="opacity-30">&middot;</span> SELECTORS <span className="opacity-30">&middot;</span> SOUNDS
        </div>
      </div>

      <div className="w-full lg:w-2/5 pl-0 lg:pl-8 flex flex-col items-start">
         <p className="text-base sm:text-lg text-white/60 mb-8 max-w-md leading-relaxed">
           Enterprise booking, tour logistics, and compliance management—built for the world's leading festivals and concert routes.
        </p>
        <div className="flex pointer-events-auto flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
             <Link 
               href="/talent" 
               className="btn btn-secondary py-3.5 px-8 rounded-full border border-white/20 hover:border-[#d4af37] text-white hover:text-[#d4af37] transition duration-300 w-full sm:w-auto text-center justify-center font-medium"
             >
                Explore Talent
            </Link>
            <Link 
              href="/ai-assistant" 
              className="pointer-events-auto btn btn-primary py-3.5 px-8 rounded-full transition duration-300 hover:scale-105 flex items-center justify-center w-full sm:w-auto font-semibold gap-2"
              style={{
                background: 'linear-gradient(135deg, #f5d061 0%, #d4af37 100%)',
                color: '#07050e',
              }}
            >
               <Sparkles className="w-4 h-4 text-[#07050e]" />
               AI Concierge
            </Link>
        </div>
      </div>

    </div>
  );
}

const HeroSection = () => {
  const screenshotRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;

          if (screenshotRef.current) {
            screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.35}px)`;
          }

          const maxScroll = 500;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
             heroContentRef.current.style.opacity = opacity.toString();
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative mt-[-52px]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground />
        </div>

        <div ref={heroContentRef} className="relative z-10 min-h-screen flex items-center justify-center pointer-events-none w-full py-24 md:py-32">
          <HeroContent />
        </div>
      </div>

      <div className="bg-[#07050e] relative z-10" style={{ marginTop: '-15vh' }}>
        <ScreenshotSection screenshotRef={screenshotRef} />
      </div>
    </div>
  );
};

export { HeroSection };
