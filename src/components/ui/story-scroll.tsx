'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(' ');
}

export interface FlowSectionProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  'aria-label'?: string;
}

export const FlowSection: React.FC<FlowSectionProps> = ({
  className,
  style = {},
  children,
  'aria-label': ariaLabel,
}) => (
  <section
    data-flow-section
    aria-label={ariaLabel}
    className={cx('relative min-h-screen w-full overflow-hidden', className)}
  >
    <div
      data-flow-inner
      className={cx(
        'flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-6 px-[4vw] pt-[clamp(2rem,8vw,4vw)] pb-[4vw]',
        'will-change-transform',
      )}
      style={{ transformOrigin: 'bottom left', ...style }}
    >
      {children}
    </div>
  </section>
);

export interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const childCount = (children: React.ReactNode) => React.Children.count(children);

export const FlowArt: React.FC<FlowArtProps> = ({
  children,
  className,
  'aria-label': ariaLabel = 'Story scroll',
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || reducedMotion) return;

      const sections = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'),
      );
      if (sections.length === 0) return;

      const mm = gsap.matchMedia();
      const triggers: ScrollTrigger[] = [];

      // Desktop and large screen animations
      mm.add("(min-width: 1024px)", () => {
        sections.forEach((section, i) => {
          gsap.set(section, { zIndex: i + 1 });

          const inner = section.querySelector<HTMLElement>('.flow-art-container');
          if (!inner) return;

          // Card entrance animations
          if (i > 0) {
            if (i === 1) {
              // Tour Logistics: slide from right
              gsap.set(inner, { xPercent: 100, rotation: -8, transformOrigin: 'bottom right' });
              const tween = gsap.to(inner, {
                xPercent: 0,
                rotation: 0,
                ease: 'power1.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'top 15%',
                  scrub: true,
                },
              });
              if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
            } else if (i === 2) {
              // Visa & Permits: slide from left
              gsap.set(inner, { xPercent: -100, rotation: 8, transformOrigin: 'bottom left' });
              const tween = gsap.to(inner, {
                xPercent: 0,
                rotation: 0,
                ease: 'power1.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'top 15%',
                  scrub: true,
                },
              });
              if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
            } else if (i === 3) {
              // Event Production: zoom/fade from bottom
              gsap.set(inner, { yPercent: 40, scale: 0.85, opacity: 0, transformOrigin: 'center center' });
              const tween = gsap.to(inner, {
                yPercent: 0,
                scale: 1,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'top 15%',
                  scrub: true,
                },
              });
              if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
            }
          }

          // Card pinning
          if (i < sections.length - 1) {
            triggers.push(
              ScrollTrigger.create({
                trigger: section,
                start: 'bottom bottom',
                end: 'bottom top',
                pin: true,
                pinSpacing: false,
              }),
            );
          }

          // Active micro-animations trigger
          const microTrigger = ScrollTrigger.create({
            trigger: section,
            start: "top 35%",
            end: "bottom 35%",
            onEnter: () => {
              if (i === 0) {
                // Talent Booking: stagger badges
                gsap.fromTo(section.querySelectorAll('.talent-badge'), 
                  { y: 30, opacity: 0 },
                  { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out" }
                );
              } else if (i === 1) {
                // Tour Logistics: flight path draw
                const path = section.querySelector('.flight-path-draw');
                if (path) {
                  gsap.fromTo(path, 
                    { strokeDashoffset: 1000 },
                    { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }
                  );
                }
                const dot = section.querySelector('.flight-dot');
                if (dot) {
                  gsap.fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, delay: 1.2, duration: 0.4, ease: "back.out(2)" });
                }
              } else if (i === 2) {
                // Visa & Permits: approved stamp slam
                const stamp = section.querySelector('.visa-stamp');
                if (stamp) {
                  gsap.fromTo(stamp, 
                    { scale: 3.5, opacity: 0, rotation: 45 },
                    { scale: 1.0, opacity: 1, rotation: -12, duration: 0.5, ease: "back.out(1.4)" }
                  );
                }
              } else if (i === 3) {
                // Event Production: equalizer animation
                const bars = section.querySelectorAll('.eq-bar');
                bars.forEach((bar, index) => {
                  gsap.to(bar, {
                    height: `${Math.random() * 70 + 30}%`,
                    duration: 0.4 + Math.random() * 0.4,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut",
                    delay: index * 0.08
                  });
                });
                // spotlight sweep
                const sweep = section.querySelector('.spotlight-sweep');
                if (sweep) {
                  gsap.fromTo(sweep, 
                    { xPercent: -100 },
                    { xPercent: 100, duration: 3.5, repeat: -1, yoyo: true, ease: "power1.inOut" }
                  );
                }
              }
            },
            onLeaveBack: () => {
              if (i === 0) {
                const badges = section.querySelectorAll('.talent-badge');
                gsap.killTweensOf(badges);
                gsap.set(badges, { opacity: 0, y: 30 });
              } else if (i === 1) {
                const path = section.querySelector('.flight-path-draw');
                const dot = section.querySelector('.flight-dot');
                if (path) gsap.killTweensOf(path);
                if (dot) gsap.killTweensOf(dot);
                gsap.set(path, { strokeDashoffset: 1000 });
                gsap.set(dot, { scale: 0, opacity: 0 });
              } else if (i === 2) {
                const stamp = section.querySelector('.visa-stamp');
                if (stamp) gsap.killTweensOf(stamp);
                gsap.set(stamp, { opacity: 0, scale: 3.5 });
              } else if (i === 3) {
                const bars = section.querySelectorAll('.eq-bar');
                const sweep = section.querySelector('.spotlight-sweep');
                gsap.killTweensOf(bars);
                if (sweep) gsap.killTweensOf(sweep);
                gsap.set(bars, { height: '20%' });
                if (sweep) gsap.set(sweep, { xPercent: -100 });
              }
            }
          });
          triggers.push(microTrigger);
        });
        
        ScrollTrigger.refresh();
      });

      // Mobile/tablet responsive reset (let layout flow naturally)
      mm.add("(max-width: 1023px)", () => {
        sections.forEach((section) => {
          const inner = section.querySelector<HTMLElement>('.flow-art-container');
          if (inner) {
            gsap.set(inner, { clearProps: "all" });
          }
        });
      });

      return () => {
        triggers.forEach((t) => t.kill());
        mm.revert();
      };
    },
    { scope: containerRef, dependencies: [childCount(children), reducedMotion] },
  );

  return (
    <main
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx('w-full overflow-x-hidden', className)}
    >
      {children}
    </main>
  );
};

export default FlowArt;
