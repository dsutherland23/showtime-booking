'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import { ArrowRight, Star, Music, Award, ShieldAlert, Sparkles, MapPin, Users, HelpCircle } from 'lucide-react';
import { InteractiveTravelCard } from '@/components/ui/3d-card';
import { DottedSurface } from '@/components/ui/dotted-surface';

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [featuredArtists, setFeaturedArtists] = React.useState<Artist[]>([]);

  useEffect(() => {
    // Load pre-seeded artists for featured showcase
    const loadFeatured = async () => {
      const all = await db.getArtists();
      // Select 1 Reggae, 1 Dancehall, and 1 DJ to showcase a premium mix on the home page
      const reggae = all.find((a) => a.category === 'Reggae Artists');
      const dancehall = all.find((a) => a.category === 'Dancehall Artists');
      const dj = all.find((a) => a.category === 'DJs');
      const featured: Artist[] = [];
      if (reggae) featured.push(reggae);
      if (dancehall) featured.push(dancehall);
      if (dj) featured.push(dj);

      if (featured.length < 3) {
        setFeaturedArtists(all.slice(0, 3));
      } else {
        setFeaturedArtists(featured);
      }
    };
    loadFeatured();

    // Canvas Luxury Gold Dust Particle effect in Hero
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 650);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = 650;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      grow: boolean;
    }> = [];

    // Create particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedX: Math.random() * 0.4 - 0.2,
        speedY: Math.random() * 0.6 - 0.9, // Float upwards
        opacity: Math.random() * 0.5 + 0.1,
        grow: Math.random() > 0.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // We omit the solid background color gradient here so the canvas is transparent,
      // letting the CSS background image (/images/hero_ambient.jpg) and overlay show through.

      // Radial ambient glow — left center
      const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.5, 10, width * 0.2, height * 0.5, width * 0.45);
      glow1.addColorStop(0, 'rgba(91, 33, 182, 0.18)');
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Radial ambient glow — right
      const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.3, 10, width * 0.8, height * 0.3, width * 0.35);
      glow2.addColorStop(0, 'rgba(168, 85, 247, 0.10)');
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Draw and update particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Mix indigo and violet particles
        const hue = p.size > 1.5 ? `rgba(168, 85, 247, ${p.opacity})` : `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fillStyle = hue;
        ctx.shadowBlur = p.size > 1.5 ? 12 : 6;
        ctx.shadowColor = p.size > 1.5 ? '#a855f7' : '#7c3aed';
        ctx.fill();

        // Update positions
        p.x += p.speedX;
        p.y += p.speedY;

        // Pulse opacity
        if (p.grow) {
          p.opacity += 0.004;
          if (p.opacity >= 0.75) p.grow = false;
        } else {
          p.opacity -= 0.004;
          if (p.opacity <= 0.05) p.grow = true;
        }

        // Boundary wrap
        if (p.y < 0) { p.y = height; p.x = Math.random() * width; }
        if (p.x < 0 || p.x > width) { p.x = Math.random() * width; }
      });

      // Subtle grid lines
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 90;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="home-viewport">

      {/* ── 1. HERO — Apple TV+ dark cinematic, centered ── */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <canvas ref={canvasRef} className="hero-particles-canvas" />
        <div className="hero-bottom-fade" />

        <div className="hero-inner">
          <div className="hero-eyebrow animate-fade">
            <span className="hero-chip">Showtime &middot; v2026.1</span>
          </div>
          <h1 className="hero-headline">
            The world&apos;s leading<br />
            <em className="hero-em">Caribbean talent</em><br />
            booking platform.
          </h1>
          <p className="hero-description">
            Enterprise booking, tour logistics, and artist management—built for the world&apos;s leading festivals and concert routes.
          </p>
          <div className="hero-ctas">
            <Link href="/talent" className="hero-btn-primary">
              Explore Talent
            </Link>
            <Link href="/ai-assistant" className="hero-btn-secondary">
              <Sparkles className="w-4 h-4" />
              AI Concierge
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num">500+</span>
              <span className="stat-label">Confirmed Gigs</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="stat-num">7M+</span>
              <span className="stat-label">Audience Reached</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="stat-num">35+</span>
              <span className="stat-label">Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORIES — Apple product grid ── */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Roster</p>
            <h2>Discover the talent.</h2>
            <p>Award-winning artists, DJs, and live performers across all entertainment categories.</p>
          </div>
          <div className="grid-3 reveal-stagger">
            <Link href="/talent?category=Reggae" className="apple-card apple-card-link reveal-scale">
              <div className="modern-card-btn">
                <span>View Roster</span>
                <ArrowRight className="btn-icon-svg" />
              </div>
              <h3 className="apple-card-title">Reggae Artists</h3>
              <p className="apple-card-desc">From roots pioneers to lovers rock icons holding the historic foundations of rhythm and soul.</p>
            </Link>
            <Link href="/talent?category=Dancehall" className="apple-card apple-card-link reveal-scale">
              <div className="modern-card-btn">
                <span>View Roster</span>
                <ArrowRight className="btn-icon-svg" />
              </div>
              <h3 className="apple-card-title">Dancehall Artists</h3>
              <p className="apple-card-desc">High-energy crossover superstars bringing vibrant Caribbean culture to international stages.</p>
            </Link>
            <Link href="/talent?category=DJs" className="apple-card apple-card-link reveal-scale">
              <div className="modern-card-btn">
                <span>View Roster</span>
                <ArrowRight className="btn-icon-svg" />
              </div>
              <h3 className="apple-card-title">DJs &amp; Selectors</h3>
              <p className="apple-card-desc">World-class clash champions, festival DJs, and selectors setting trendsetting performance vibes.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURED ARTISTS — Apple card row ── */}
      <section className="section-pad alt-bg">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Spotlight</p>
            <h2>Represented headliners.</h2>
            <p>Award-winning icons available for booking on major upcoming tours and festival seasons.</p>
          </div>
          <div className="grid-3 reveal-stagger">
            {featuredArtists.map((artist) => (
              <div key={artist.id} className="luxury-card artist-card reveal">
                <div className="artist-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.profile_image} alt={artist.stage_name} className="artist-img" />
                  <span className="artist-genre-pill">{artist.genre}</span>
                </div>
                <div className="artist-body">
                  <h3 className="artist-name">{artist.stage_name}</h3>
                  <p className="artist-bio">{artist.bio.substring(0, 100)}&hellip;</p>
                  <div className="artist-meta">
                    <span className="artist-cat">{artist.category}</span>
                    <span className="artist-status">
                      <span className="status-dot" />
                      {artist.booking_status}
                    </span>
                  </div>
                  <Link href={`/talent/${artist.id}`} className="btn btn-secondary artist-cta">
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. SERVICES — Apple spec strip ── */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Platform</p>
            <h2>Everything you need.</h2>
            <p>We manage the complexities of live bookings, visas, tour routing, and production logistics.</p>
          </div>
          <div className="grid-4 reveal-stagger">
            {[
              { 
                title: 'Talent Booking', 
                subtitle: 'Structured deposit schedules & dynamic agreements', 
                imageUrl: '/images/artist_dancehall.jpg',
                actionText: 'Reserve Artist',
                href: '/book'
              },
              { 
                title: 'Tour Logistics', 
                subtitle: 'Route planning & transport across 35+ countries', 
                imageUrl: '/images/hero_ambient.jpg',
                actionText: 'Explore Roster',
                href: '/talent'
              },
              { 
                title: 'Visa & Permits', 
                subtitle: 'US O-Visas, UK COS & European declarations', 
                imageUrl: '/images/artist_dj.jpg',
                actionText: 'Verify Compliance',
                href: '/contact'
              },
              { 
                title: 'Event Production', 
                subtitle: 'Backline A/V & rider verification by professionals', 
                imageUrl: '/images/concert_stage.jpg',
                actionText: 'Verify Riders',
                href: '/services'
              },
            ].map((s, i) => (
              <div key={i} className="reveal" style={{ perspective: '1000px' }}>
                <InteractiveTravelCard
                  title={s.title}
                  subtitle={s.subtitle}
                  imageUrl={s.imageUrl}
                  actionText={s.actionText}
                  href={s.href}
                  onActionClick={() => router.push(s.href)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. EVENTS SHOWCASE — Apple split layout ── */}
      <section className="section-pad alt-bg">
        <div className="container">
          <div className="events-split">
            <div className="events-text reveal">
              <p className="section-eyebrow">Portfolio</p>
              <h2>Delivering under the spotlights.</h2>
              <p className="events-body">
                From 35,000-seat stadium nights in Kingston to Coachella main stages,
                Showtime handles contracting, hospitality compliance, and technical execution.
              </p>
              <div className="events-metrics">
                <div className="em-item">
                  <span className="em-num">500+</span>
                  <span className="em-label">Confirmed Gigs</span>
                </div>
                <div className="em-item">
                  <span className="em-num">7M+</span>
                  <span className="em-label">Audience Reached</span>
                </div>
                <div className="em-item">
                  <span className="em-num">35+</span>
                  <span className="em-label">Countries Toured</span>
                </div>
              </div>
              <Link href="/events" className="btn btn-secondary">View Events &rsaquo;</Link>
            </div>
            <div className="events-visual reveal" data-delay="150ms">
              <div className="luxury-card event-img-card">
                <div className="event-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/concert_stage.jpg"
                    alt="Concert Stage"
                    className="event-img"
                  />
                </div>
                <div className="event-card-caption">
                  <strong>Reggae Sumfest Montego Bay</strong>
                  <span><MapPin className="caption-icon" /> Catherine Hall Entertainment Center &bull; Jamaica</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA — Apple dark promotional band ── */}
      <section className="cta-band reveal-fade">
        <DottedSurface 
          className="absolute inset-0 w-full h-full" 
          style={{ position: 'absolute', zIndex: 0, width: '100%', height: '100%' }} 
        />
        <div className="cta-inner" style={{ position: 'relative', zIndex: 2 }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Get Started</p>
          <h2 className="cta-headline">Ready to book your headliner?</h2>
          <p className="cta-body">Submit a formal inquiry or let our AI Concierge match artists to your event, budget, and capacity.</p>
          <div className="cta-actions">
            <Link href="/book" className="cta-btn-primary">Book Talent</Link>
            <Link href="/ai-assistant" className="cta-btn-secondary">
              <Sparkles className="w-4 h-4" />
              AI Concierge
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`

        /* ── Hero ─────────────────────────────────────────── */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #060608 url(/images/hero_ambient.jpg) no-repeat center center;
          background-size: cover;
          margin-top: -52px;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(10, 6, 20, 0.45) 0%, rgba(10, 6, 20, 0.8) 100%);
          z-index: 1;
          pointer-events: none;
        }

        .hero-particles-canvas {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          z-index: 2;
          pointer-events: none;
          opacity: 0.85;
        }

        .hero-bottom-fade {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 260px;
          background: linear-gradient(to bottom, transparent 0%, #f5f5f7 100%);
          z-index: 3;
          pointer-events: none;
        }

        .hero-inner {
          position: relative;
          z-index: 4;
          text-align: center;
          max-width: 840px;
          padding: 10rem 2rem 14rem;
          margin: 0 auto;
          animation: fadeInUp 0.9s 0.1s ease both;
        }

        .hero-eyebrow { margin-bottom: 1.5rem; }

        .hero-chip {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.32rem 0.9rem;
          border-radius: 980px;
        }

        .hero-headline {
          font-family: var(--font-heading);
          font-size: clamp(3.2rem, 2rem + 5.5vw, 6.5rem);
          font-weight: 700;
          letter-spacing: -0.045em;
          line-height: 1.0;
          color: #f5f5f7;
          margin-bottom: 1.5rem;
        }

        .hero-em {
          font-style: normal;
          background: linear-gradient(90deg, #42a1ec 0%, #0071e3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
          line-height: 1.55;
          color: rgba(255,255,255,0.5);
          max-width: 52ch;
          margin: 0 auto 2.5rem;
          letter-spacing: -0.015em;
        }

        .hero-ctas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          margin-bottom: 4rem;
        }

        /* Apple hero CTA — white pill (like apple.com) */
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 1.0625rem;
          font-weight: 400;
          letter-spacing: -0.015em;
          padding: 0.72rem 1.8rem;
          border-radius: 980px;
          background: #ffffff;
          color: #000000;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }
        .hero-btn-primary:hover { opacity: 0.85; color: #000; }

        /* Apple secondary hero — translucent glass pill */
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 1.0625rem;
          font-weight: 400;
          letter-spacing: -0.015em;
          padding: 0.72rem 1.8rem;
          border-radius: 980px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.88);
          cursor: pointer;
          text-decoration: none;
          backdrop-filter: blur(10px);
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        .hero-btn-secondary:hover { background: rgba(255,255,255,0.16); opacity: 1; }

        /* Hero stats bar */
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: -0.01em;
          font-weight: 400;
        }

        .hero-stat-divider {
          width: 1px;
          height: 34px;
          background: rgba(255,255,255,0.1);
        }

        /* ── Section layout ────────────────────────────── */
        .section-pad {
          padding: var(--spacing-xxl) 0;
        }

        .alt-bg {
          background: var(--bg-secondary);
        }

        .section-eyebrow {
          display: block;
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--accent);
          max-width: none;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        /* ── Apple category cards ──────────────────────── */
        .apple-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.05);
          text-decoration: none;
          color: inherit;
          transition:
            transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94),
            box-shadow 0.28s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        .apple-card:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
          opacity: 1;
        }

        .modern-card-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.38rem 0.85rem;
          border-radius: 980px;
          width: fit-content;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.05);
          margin-bottom: 0.4rem;
          transition: all 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .btn-icon-svg {
          width: 12px;
          height: 12px;
          transition: transform 0.24s ease;
        }

        .apple-card:hover .modern-card-btn {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.18);
        }

        .apple-card:hover .modern-card-btn .btn-icon-svg {
          transform: translateX(3px);
        }

        .apple-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary);
        }

        .apple-card-desc {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.5;
          letter-spacing: -0.015em;
          max-width: none;
        }

        .apple-card-link-label {
          font-size: 0.9375rem;
          color: var(--accent);
          font-weight: 400;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        /* ── Artist cards ──────────────────────────────── */
        .artist-card {
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .artist-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          border-radius: 16px 16px 0 0;
        }

        .artist-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        .artist-card:hover .artist-img { transform: scale(1.04); }

        .artist-genre-pill {
          position: absolute;
          bottom: 10px;
          left: 10px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #fff;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 3px 10px;
          border-radius: 980px;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .artist-body {
          padding: 1.25rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .artist-name {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }

        .artist-bio {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: none;
          letter-spacing: -0.01em;
        }

        .artist-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 0.75rem;
          margin-top: auto;
        }

        .artist-status {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--color-success);
          font-size: 0.75rem;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
        }

        .artist-cta {
          margin-top: 0.85rem;
          width: 100%;
          justify-content: center;
          font-size: 0.875rem;
          border-radius: 10px;
        }

        /* ── Service tiles ─────────────────────────────── */
        .svc-tile {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .svc-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.09);
        }

        .svc-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: rgba(0,113,227,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .svc-icon {
          width: 20px;
          height: 20px;
          color: var(--accent);
        }

        .svc-title {
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .svc-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.55;
          max-width: none;
          letter-spacing: -0.01em;
        }

        /* ── Events split layout ───────────────────────── */
        .events-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .events-split { grid-template-columns: 1.1fr 1fr; gap: 5rem; }
        }

        .events-text {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .events-text h2 { margin: 0; }

        .events-body {
          font-size: 1.0625rem;
          line-height: 1.55;
          color: var(--text-secondary);
          max-width: 48ch;
          letter-spacing: -0.015em;
        }

        .events-metrics {
          display: flex;
          gap: 2.5rem;
          padding: 1.5rem 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .em-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .em-num {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          line-height: 1;
        }

        .em-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          letter-spacing: -0.01em;
        }

        .events-visual {
          display: flex;
          justify-content: center;
        }

        .event-img-card {
          padding: 0;
          width: 100%;
          max-width: 460px;
          overflow: hidden;
        }

        .event-img-wrap {
          width: 100%;
          aspect-ratio: 16/10;
          overflow: hidden;
          border-radius: 16px 16px 0 0;
        }

        .event-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .event-img-card:hover .event-img { transform: scale(1.03); }

        .event-card-caption {
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-card-caption strong {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .event-card-caption span {
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .caption-icon {
          width: 12px; height: 12px;
          color: var(--accent);
          flex-shrink: 0;
        }

        /* ── CTA Band — Apple dark section ─────────────── */
        .cta-band {
          background: #1d1d1f;
          padding: var(--spacing-xxl) 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-band::before {
          content: '';
          position: absolute;
          top: -50%; left: 15%;
          width: 900px; height: 500px;
          background: radial-gradient(ellipse, rgba(0,113,227,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cta-inner {
          max-width: 640px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .cta-headline {
          font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
          font-weight: 700;
          letter-spacing: -0.045em;
          color: #f5f5f7;
          line-height: 1.05;
          margin: 0;
        }

        .cta-body {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.5);
          max-width: 46ch;
          letter-spacing: -0.015em;
          margin-bottom: 0.5rem;
        }

        .cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 1.0625rem;
          font-weight: 400;
          letter-spacing: -0.015em;
          padding: 0.72rem 1.8rem;
          border-radius: 980px;
          background: var(--accent);
          color: #fff;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }
        .cta-btn-primary:hover { opacity: 0.88; }

        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 1.0625rem;
          font-weight: 400;
          letter-spacing: -0.015em;
          padding: 0.72rem 1.8rem;
          border-radius: 980px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.85);
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        .cta-btn-secondary:hover { background: rgba(255,255,255,0.16); opacity: 1; }

      `}</style>
    </div>
  );
}
