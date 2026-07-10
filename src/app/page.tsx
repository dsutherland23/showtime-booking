'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import { ArrowRight, Star, Music, Award, ShieldAlert, MapPin, Users, HelpCircle } from 'lucide-react';
import { FlowArt, FlowSection } from '@/components/ui/story-scroll';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { HeroSection } from '@/components/ui/3d-hero-section-boxes';

/* ── Animated Counter ── */
function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = React.useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { value, ref } = useCountUp(end, 1800);
  return (
    <div className="stat-item">
      <span className="stat-number" ref={ref}>
        {value}{suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function StatsBar() {
  return (
    <section className="stats-bar" aria-label="Key statistics">
      <div className="stats-bar-grid">
        <StatCounter end={200} suffix="+" label="Artists Represented" />
        <StatCounter end={35}  suffix="+" label="Countries Toured" />
        <StatCounter end={1000} suffix="+" label="Events Produced" />
        <StatCounter end={98}  suffix="%" label="Client Satisfaction" />
      </div>
    </section>
  );
}

/* ── Marquee Section ── */
const MARQUEE_ITEMS = [
  'Reggae Sumfest', 'Glastonbury', 'Coachella', 'One Love', 'Caribbean Carnival',
  'Notting Hill', 'Rototom Sunsplash', 'Rebel Salute', 'Jazz & Blues Festival',
  'Carifesta', 'Rocksteady', 'Siren Festival'
];

function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <section className="marquee-section" aria-label="Events and festivals">
      <p className="marquee-eyebrow">Trusted by global festivals &amp; promoters</p>
      <div className="marquee-track" aria-hidden="true">
        {doubled.map((item, i) => (
          <React.Fragment key={i}>
            <span className="marquee-item">{item}</span>
            <span className="marquee-dot" />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

/* ── Premium Artist Card with Hover Reveal + 3D Tilt ── */
function ArtistCardPremium({ artist }: { artist: Artist }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;
    const rotateY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }, []);

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';
  }, []);

  return (
    <div
      ref={cardRef}
      className="artist-card-premium reveal"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="artist-card-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artist.profile_image} alt={artist.stage_name} />
        {artist.booking_status === 'Available' && (
          <span className="status-available-glow">
            <span className="status-glow-dot" />
            Available
          </span>
        )}
        <div className="artist-card-reveal">
          <div className="artist-card-genre-pill">{artist.genre}</div>
          <h3 className="artist-card-name">{artist.stage_name}</h3>
          <p className="artist-card-bio">{artist.bio.substring(0, 90)}&hellip;</p>
          <Link href={`/talent/${artist.id}`} className="artist-card-cta" data-cursor="View">
            View Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
function ArtistCardPremiumCycling({ categoryArtists }: {
  categoryArtists: Artist[];
}) {
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  const [displayArtist, setDisplayArtist] = React.useState<Artist | null>(null);

  useEffect(() => {
    if (!categoryArtists || categoryArtists.length === 0) return;
    
    setDisplayArtist(categoryArtists[0]);
    if (categoryArtists.length <= 1) return;

    let activeIdx = 0;
    const delay = 6000 + Math.random() * 2500; // staggered offset

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        activeIdx = (activeIdx + 1) % categoryArtists.length;
        setCurrentIdx(activeIdx);
        setDisplayArtist(categoryArtists[activeIdx]);
        setFade(true);
      }, 500);
    }, delay);

    return () => clearInterval(interval);
  }, [categoryArtists]);

  if (!displayArtist) return null;

  return (
    <div 
      style={{ 
        opacity: fade ? 1 : 0, 
        transform: `scale(${fade ? 1 : 0.985})`, 
        transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
        width: '100%'
      }}
    >
      <ArtistCardPremium artist={displayArtist} />
    </div>
  );
}



export default function Home() {
  const router = useRouter();
  const [reggaePool, setReggaePool] = React.useState<Artist[]>([]);
  const [dancehallPool, setDancehallPool] = React.useState<Artist[]>([]);
  const [djPool, setDjPool] = React.useState<Artist[]>([]);
  const [bandsPool, setBandsPool] = React.useState<Artist[]>([]);
  const [dancersPool, setDancersPool] = React.useState<Artist[]>([]);
  const [socaAfroPool, setSocaAfroPool] = React.useState<Artist[]>([]);

  useEffect(() => {
    const loadFeatured = async () => {
      const all = await db.getArtists();

      const sortFeaturedFirst = (list: Artist[]) => {
        return [...list].sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return 0;
        });
      };

      const reggae = all.filter(a => a.category === 'Reggae Artists');
      const dancehall = all.filter(a => a.category === 'Dancehall Artists');
      const djs = all.filter(a => a.category === 'DJs');
      const bands = all.filter(a => a.category === 'Bands');
      const dancers = all.filter(a => a.category === 'Dancers');
      const socaAfro = all.filter(a => a.category === 'Soca Artists' || a.category === 'Afrobeats Artists');

      setReggaePool(sortFeaturedFirst(reggae));
      setDancehallPool(sortFeaturedFirst(dancehall));
      setDjPool(sortFeaturedFirst(djs));
      setBandsPool(sortFeaturedFirst(bands));
      setDancersPool(sortFeaturedFirst(dancers));
      setSocaAfroPool(sortFeaturedFirst(socaAfro));
    };
    loadFeatured();
  }, []);

  return (
    <div className="home-viewport">

      {/* ── 1. HERO ── */}
      <HeroSection />

      {/* ── 1b. STATS COUNTER BAR ── */}
      <StatsBar />

      {/* ── 1c. CLIENT LOGOS MARQUEE ── */}
      <MarqueeSection />

      {/* ── 2. CATEGORIES ── */}
      <section className="section-pad border-t border-white/5 bg-[#07050e]">
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
      <section className="section-pad alt-bg border-t border-b border-white/5 bg-[#0c0a17]">
        <div className="container">
          <div className="section-header reveal">
            <p className="section-eyebrow">Spotlight</p>
            <h2>Represented headliners.</h2>
            <p>Award-winning icons available for booking on major upcoming tours and festival seasons.</p>
          </div>
          <div className="grid-3 reveal-stagger">
            <ArtistCardPremiumCycling categoryArtists={reggaePool} />
            <ArtistCardPremiumCycling categoryArtists={dancehallPool} />
            <ArtistCardPremiumCycling categoryArtists={djPool} />
          </div>
          <div className="grid-3 reveal-stagger" style={{ marginTop: '2rem' }}>
            <ArtistCardPremiumCycling categoryArtists={bandsPool} />
            <ArtistCardPremiumCycling categoryArtists={dancersPool} />
            <ArtistCardPremiumCycling categoryArtists={socaAfroPool} />
          </div>
        </div>
      </section>

      {/* ── 4. SERVICES — GSAP Story Scroll ── */}
      <section id="services-flow" className="relative w-full bg-[#07050e] border-b border-white/5">
        <div className="container py-16">
          <div className="section-header reveal text-center max-w-2xl mx-auto mb-4">
            <p className="section-eyebrow">Platform</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Everything you need.</h2>
            <p className="text-white/60 text-base md:text-lg">
              We manage the complexities of live bookings, visas, tour routing, and production logistics.
            </p>
          </div>
        </div>

        <FlowArt aria-label="Services Story Scroll">
          {/* Section 01: Talent Booking */}
          <FlowSection aria-label="Talent Booking" style={{ backgroundColor: '#0f0a1d', color: '#fff' }} className="border-t border-white/5">
            <div className="flex flex-col justify-between h-full min-h-[calc(100vh-8vw)] w-full">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">01 &mdash; Talent Booking</p>
                <span className="text-xs font-semibold text-white/50 tracking-wider">Showtime Booking</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
                <div className="lg:col-span-7 flex flex-col items-start gap-4 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                  <h3 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.0] tracking-tighter uppercase">
                    Reserve <br />
                    <span className="text-[#d4af37]">Elite</span> Talent.
                  </h3>
                  <p className="text-base md:text-lg text-white/70 max-w-xl mt-4 leading-relaxed">
                    Structured deposit schedules &amp; dynamic performance agreements. We connect festivals and promoters directly with the legendary names of Caribbean reggae, dancehall, and live sounds.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-6">
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl talent-badge">
                      <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Contracting</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Automated Escrow &amp; Deposit Management</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl talent-badge">
                      <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Guarantees</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Rider Compliance &amp; Date Holds</p>
                    </div>
                  </div>

                  <div className="mt-8 flex w-full sm:w-auto pointer-events-auto">
                    <Link href="/book" className="btn pointer-events-auto w-full sm:w-auto text-center justify-center font-semibold py-3.5 px-8 rounded-full hover:scale-105 transition duration-300 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #f5d061 0%, #d4af37 100%)', color: '#07050e' }}>
                      Reserve Artist <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[#d4af37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)] shadow-2xl group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/images/artist_dancehall.jpg" 
                      alt="Talent Booking" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-xs text-[#d4af37] font-bold tracking-widest uppercase">Live Performance</p>
                      <p className="text-sm font-bold text-white">Dancehall &amp; Reggae Headliners</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40">
                <span>SHOWTIME booking portal</span>
                <span>Est. 2026</span>
              </div>
            </div>
          </FlowSection>

          {/* Section 02: Tour Logistics */}
          <FlowSection aria-label="Tour Logistics" style={{ backgroundColor: '#070f1a', color: '#fff' }} className="border-t border-white/5">
            <div className="flex flex-col justify-between h-full min-h-[calc(100vh-8vw)] w-full">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]">02 &mdash; Tour Logistics</p>
                <span className="text-xs font-semibold text-white/50 tracking-wider">Showtime Operations</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
                <div className="lg:col-span-7 flex flex-col items-start gap-4 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                  <h3 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.0] tracking-tighter uppercase">
                    Global <br />
                    <span className="text-[#a855f7]">Tour</span> Logistics.
                  </h3>
                  <p className="text-base md:text-lg text-white/70 max-w-xl mt-4 leading-relaxed">
                    Route planning, flight bookings, and transport coordination across 35+ countries. From itinerary optimization to private ground transport, we keep your tour moving on schedule.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-6">
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#a855f7] uppercase tracking-wider mb-1">Routing</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Multi-City &amp; Multi-Leg Flight Booking</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#a855f7] uppercase tracking-wider mb-1">Ground Transport</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Coordinated VIP Sprinters &amp; Chauffeurs</p>
                    </div>
                  </div>

                  <div className="mt-8 flex w-full sm:w-auto pointer-events-auto">
                    <Link href="/talent" className="btn pointer-events-auto w-full sm:w-auto text-center justify-center font-semibold py-3.5 px-8 rounded-full border border-white/20 hover:border-[#a855f7] hover:text-[#a855f7] transition duration-300 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
                      Explore Roster <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/images/hero_ambient.jpg" 
                      alt="Tour Logistics" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* SVG Flight Path Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 300" fill="none">
                      <path 
                        d="M 50,250 Q 200,50 350,250" 
                        stroke="rgba(168, 85, 247, 0.15)" 
                        strokeWidth="3" 
                        strokeDasharray="6,6" 
                      />
                      <path 
                        className="flight-path-draw"
                        d="M 50,250 Q 200,50 350,250" 
                        stroke="#a855f7" 
                        strokeWidth="3.5" 
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                        strokeLinecap="round"
                      />
                      <circle 
                        className="flight-dot" 
                        cx="350" 
                        cy="250" 
                        r="5" 
                        fill="#a855f7" 
                        filter="drop-shadow(0 0 6px #a855f7)"
                      />
                    </svg>

                    <div className="absolute bottom-4 left-4 z-20">
                      <p className="text-xs text-[#a855f7] font-bold tracking-widest uppercase">Operations</p>
                      <p className="text-sm font-bold text-white">35+ Countries Toured</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40">
                <span>SHOWTIME logistics hub</span>
                <span>Est. 2026</span>
              </div>
            </div>
          </FlowSection>

          {/* Section 03: Visa & Permits */}
          <FlowSection aria-label="Visa & Permits" style={{ backgroundColor: '#130413', color: '#fff' }} className="border-t border-white/5">
            <div className="flex flex-col justify-between h-full min-h-[calc(100vh-8vw)] w-full">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">03 &mdash; Visa &amp; Permits</p>
                <span className="text-xs font-semibold text-white/50 tracking-wider">Showtime Compliance</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
                <div className="lg:col-span-7 flex flex-col items-start gap-4 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                  <h3 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.0] tracking-tighter uppercase">
                    Visa &amp; <br />
                    <span className="text-[#d4af37]">Permit</span> Compliance.
                  </h3>
                  <p className="text-base md:text-lg text-white/70 max-w-xl mt-4 leading-relaxed">
                    US O-Visas, UK Certificates of Sponsorship (COS), Schengen declarations, and work permits handled by dedicated compliance managers to guarantee border clearance.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-6">
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">O-1 &amp; COS</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Sponsorship Filing &amp; Petition Support</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-1">Border Clearance</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Dual Citizenship &amp; Permit Verification</p>
                    </div>
                  </div>

                  <div className="mt-8 flex w-full sm:w-auto pointer-events-auto">
                    <Link href="/contact" className="btn pointer-events-auto w-full sm:w-auto text-center justify-center font-semibold py-3.5 px-8 rounded-full border border-white/20 hover:border-[#d4af37] hover:text-[#d4af37] transition duration-300 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
                      Verify Compliance <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/images/artist_dj.jpg" 
                      alt="Visa &amp; Permits" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Passport Stamp Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="visa-stamp border-[5px] border-[#d4af37] text-[#d4af37] font-black text-2xl md:text-3xl uppercase tracking-widest px-4 py-1.5 rounded-xl rotate-[-12deg] scale-[2.5] opacity-0 bg-black/45 backdrop-blur-[1px] shadow-[0_0_15px_rgba(212,175,55,0.35)]">
                        Approved
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 z-20">
                      <p className="text-xs text-[#d4af37] font-bold tracking-widest uppercase">Compliance</p>
                      <p className="text-sm font-bold text-white">Hassle-Free Border Clearances</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40">
                <span>SHOWTIME legal &amp; advisory</span>
                <span>Est. 2026</span>
              </div>
            </div>
          </FlowSection>

          {/* Section 04: Event Production */}
          <FlowSection aria-label="Event Production" style={{ backgroundColor: '#0b1614', color: '#fff' }} className="border-t border-white/5">
            <div className="flex flex-col justify-between h-full min-h-[calc(100vh-8vw)] w-full">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a855f7]">04 &mdash; Event Production</p>
                <span className="text-xs font-semibold text-white/50 tracking-wider">Showtime Audio-Visual</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
                <div className="lg:col-span-7 flex flex-col items-start gap-4 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                  <h3 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.0] tracking-tighter uppercase">
                    Live Stage <br />
                    <span className="text-[#a855f7]">Production</span> A/V.
                  </h3>
                  <p className="text-base md:text-lg text-white/70 max-w-xl mt-4 leading-relaxed">
                    Sound system riders, live sound engineers, backline setups, and audio-visual layouts verified by industry professionals. We ensure the stage is perfect for every performance.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-6">
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#a855f7] uppercase tracking-wider mb-1">A/V Backline</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Sound System, Lighting &amp; FX Rigging</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4 rounded-xl">
                      <h4 className="text-[11px] font-bold text-[#a855f7] uppercase tracking-wider mb-1">Rider Verification</h4>
                      <p className="text-xs md:text-sm font-medium text-white/90">Hospitality &amp; Technical Compliance Auditing</p>
                    </div>
                  </div>

                  <div className="mt-8 flex w-full sm:w-auto pointer-events-auto">
                    <Link href="/services" className="btn pointer-events-auto w-full sm:w-auto text-center justify-center font-semibold py-3.5 px-8 rounded-full border border-white/20 hover:border-[#a855f7] hover:text-[#a855f7] transition duration-300 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
                      Verify Riders <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/images/concert_stage.jpg" 
                      alt="Event Production" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Spotlight Sweep overlay */}
                    <div className="spotlight-sweep absolute inset-0 bg-gradient-to-r from-transparent via-[#a855f7]/15 to-transparent -translate-x-full pointer-events-none mix-blend-screen" />
                    
                    {/* Equalizer overlay */}
                    <div className="absolute bottom-4 right-4 flex items-end gap-1 h-8 pointer-events-none z-10 bg-black/60 px-2 py-1.5 rounded-lg border border-white/10">
                      <span className="w-1 bg-[#a855f7] rounded-t eq-bar" style={{ height: '20%' }} />
                      <span className="w-1 bg-[#a855f7] rounded-t eq-bar" style={{ height: '20%' }} />
                      <span className="w-1 bg-[#a855f7] rounded-t eq-bar" style={{ height: '20%' }} />
                      <span className="w-1 bg-[#a855f7] rounded-t eq-bar" style={{ height: '20%' }} />
                      <span className="w-1 bg-[#a855f7] rounded-t eq-bar" style={{ height: '20%' }} />
                    </div>

                    <div className="absolute bottom-4 left-4 z-20">
                      <p className="text-xs text-[#a855f7] font-bold tracking-widest uppercase">Stage A/V</p>
                      <p className="text-sm font-bold text-white">Full backline rider compliance</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40">
                <span>SHOWTIME audio-visual staging</span>
                <span>Est. 2026</span>
              </div>
            </div>
          </FlowSection>
        </FlowArt>
      </section>

      {/* ── 5. EVENTS SHOWCASE — Apple split layout ── */}
      <section className="section-pad alt-bg border-b border-white/5 bg-[#0c0a17]">
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
          <p className="cta-body">Submit a formal inquiry and our team will match the perfect artist to your event, budget, and capacity.</p>
          <div className="cta-actions">
            <Link href="/book" className="cta-btn-primary">Book Talent</Link>
            <Link href="/contact" className="cta-btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>

      <style jsx>{`

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
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          text-decoration: none;
          color: inherit;
          transition:
            transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94),
            box-shadow 0.28s cubic-bezier(0.25,0.46,0.45,0.94),
            border-color 0.28s ease;
        }

        .apple-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.35);
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
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 0.4rem;
          transition: all 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .btn-icon-svg {
          width: 12px;
          height: 12px;
          transition: transform 0.24s ease;
        }

        .apple-card:hover .modern-card-btn {
          background: var(--accent-gradient);
          color: #07050e;
          border-color: var(--accent);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
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
