'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import Link from 'next/link';
import { 
  Music, Award, Calendar, MapPin, CheckCircle, FileText, Play, Pause, ChevronLeft, Volume2, Camera, Video
} from 'lucide-react';

export default function ArtistProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Media player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaProgress, setMediaProgress] = useState(35);

  // Calendar dates generation helper (Current month)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed 5)
  const monthName = "June 2026";

  useEffect(() => {
    if (!id) return;
    
    const loadArtistData = async () => {
      try {
        const data = await db.getArtistById(id);
        if (data) {
          setArtist(data);
          const dates = await db.getArtistAvailability(data.id);
          setBlockedDates(dates);
        }
      } catch (err) {
        console.error('Failed to load artist:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadArtistData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container container">
        <p>Loading artist profile...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--gold-primary);
            font-size: 1.2rem;
          }
        `}</style>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="error-container container">
        <h2>Artist Profile Not Found</h2>
        <p>The talent profile you requested does not exist or has been archived.</p>
        <Link href="/talent" className="btn btn-primary">Back to Directory</Link>
        <style jsx>{`
          .error-container {
            text-align: center;
            padding: var(--spacing-xl) 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // Calendar rendering math
  const daysInMonth = 30; // June has 30 days
  const startingDayOfWeek = 1; // June 1, 2026 is a Monday (1)
  
  const calendarCells = [];
  // Empty slots for padding
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const isDateBlocked = (day: number) => {
    const formattedDate = `2026-06-${day.toString().padStart(2, '0')}`;
    return blockedDates.includes(formattedDate);
  };

  return (
    <div className="artist-profile-viewport luxury-bg">
      {/* 1. HERO COVER BANNER */}
      <section className="profile-hero-banner" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.75) 100%), url(${artist.cover_image})` }}>
        <div className="container hero-inner-alignment">
          <Link href="/talent" className="back-link">
            <ChevronLeft className="w-4 h-4" /> Back to Directory
          </Link>
          
          <div className="hero-artist-info">
            <span className="artist-category-tag">{artist.category}</span>
            <h1 className="artist-stage-name">{artist.stage_name}</h1>
            <div className="artist-meta-row">
              <span className="meta-item"><MapPin className="meta-icon" /> Jamaica</span>
              <span className="meta-item"><Music className="meta-icon" /> {artist.genre}</span>
              <span className="meta-item status-badge">
                <span className="dot"></span> {artist.booking_status}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROFILE GRID BODY */}
      <section className="profile-grid-section container">
        <div className="profile-layout-split">
          
          {/* Main Content Column */}
          <div className="profile-main-col">
            {/* Biography */}
            <div className="luxury-card card-padding">
              <h2>Biography</h2>
              <p className="profile-bio-text">{artist.bio}</p>
            </div>

            {/* Media Player Showcase */}
            <div className="luxury-card card-padding media-showcase-card">
              <h2>Featured Audio Showcase</h2>
              <div className="audio-player-container glassmorphism">
                <button 
                  className="audio-play-btn" 
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? "Pause Audio" : "Play Audio"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <div className="player-track-info">
                  <span className="track-title">Live Performance Reels &bull; 2026 Live Mix</span>
                  <span className="track-artist">{artist.stage_name}</span>
                  <div className="player-progress-bar">
                    <div className="progress-track-bg">
                      <div className="progress-fill" style={{ width: `${mediaProgress}%` }}></div>
                    </div>
                    <span className="time-duration">0:45 / 2:30</span>
                  </div>
                </div>
                <div className="player-volume">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              
              <div className="media-gallery-grid">
                {artist.media && artist.media.map((med, idx) => (
                  <div key={idx} className="media-gallery-item">
                    {med.type === 'Image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={med.url} alt={`${artist.stage_name} gallery`} className="gallery-img" />
                    ) : (
                      <div className="video-thumbnail-placeholder">
                        <Play className="w-8 h-8 text-amber-500" />
                        <span>Watch Video clip</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Riders */}
            <div className="luxury-card card-padding">
              <h2>Performance Requirements & Riders</h2>
              <div className="riders-grid-split">
                <div className="rider-col">
                  <div className="rider-header-row">
                    <FileText className="rider-icon" />
                    <h4>Technical Rider Summary</h4>
                  </div>
                  <p className="rider-body-text">{artist.technical_rider || 'Standard backline requirements apply. Contact representing agent for full rider specifications.'}</p>
                </div>
                <div className="rider-col">
                  <div className="rider-header-row">
                    <FileText className="rider-icon" />
                    <h4>Hospitality Rider Summary</h4>
                  </div>
                  <p className="rider-body-text">{artist.hospitality_rider || 'Standard hospitality catering, greenroom, and lodging specifications apply.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Action / Stats Column */}
          <div className="profile-sidebar-col">
            
            {/* Booking Action Box */}
            <div className="luxury-card sidebar-action-card">
              <h3>Secure Booking Slot</h3>
              <p>Inquire regarding availability, routing options, and estimated production costs for this artist.</p>
              <Link href={`/book?artistId=${artist.id}`} className="btn btn-primary btn-full-sidebar">
                Book {artist.stage_name}
              </Link>
            </div>

            {/* Social Metrics */}
            <div className="luxury-card stats-sidebar-card">
              <h3>Social Footprint</h3>
              {artist.socials ? (
                <div className="socials-list">
                  {Object.entries(artist.socials).map(([plat, data]) => (
                    <div key={plat} className="social-stat-row">
                      <div className="social-platform-label">
                        {plat === 'Instagram' && <Camera className="w-4 h-4 text-amber-500" />}
                        {plat === 'Spotify' && <Music className="w-4 h-4 text-amber-500" />}
                        {plat === 'TikTok' && <Award className="w-4 h-4 text-amber-500" />}
                        {plat === 'YouTube' && <Video className="w-4 h-4 text-amber-500" />}
                        <span>{plat}</span>
                      </div>
                      <span className="followers-count">{data.followers.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">Social media footprint verified. Details available on request.</p>
              )}
            </div>

            {/* Live Availability Calendar */}
            <div className="luxury-card calendar-sidebar-card">
              <h3>Availability Calendar</h3>
              <p className="calendar-desc">Shaded dates represent confirmed bookings or locked tour days.</p>
              
              <div className="calendar-container">
                <div className="calendar-header-month">
                  <span>{monthName}</span>
                </div>
                <div className="calendar-weekdays">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="calendar-days-grid">
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <span key={`empty-${idx}`} className="empty-day-cell"></span>;
                    }
                    const isBlocked = isDateBlocked(day);
                    return (
                      <span 
                        key={`day-${day}`} 
                        className={`day-cell ${isBlocked ? 'blocked' : 'available'}`}
                        title={isBlocked ? 'Confirmed Booking' : 'Available for Booking'}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot available"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot blocked"></span>
                  <span>Booked / Locked</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <style jsx>{`
        .profile-hero-banner {
          height: 380px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding-bottom: 2rem;
        }

        .hero-inner-alignment {
          display: flex;
          flex-direction: column;
          gap: 4rem;
          width: 100%;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          font-weight: 500;
          width: fit-content;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .hero-artist-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .artist-category-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--gold-light);
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .artist-stage-name {
          font-size: clamp(2.5rem, 2rem + 3vw, 4rem);
          font-weight: 700;
          color: #ffffff;
        }

        .artist-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-icon {
          width: 16px;
          height: 16px;
          color: var(--gold-light);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.8rem;
          color: #ffffff;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
          box-shadow: 0 0 6px var(--color-success);
        }

        /* Profile Layout */
        .profile-grid-section {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .profile-layout-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-lg);
        }

        @media (min-width: 1024px) {
          .profile-layout-split {
            grid-template-columns: 1.8fr 1fr;
            gap: 2rem;
          }
        }

        .profile-main-col {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .card-padding {
          padding: var(--spacing-xl);
        }

        .profile-main-col h2 {
          font-size: 1.4rem;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          padding-bottom: 10px;
        }

        .profile-bio-text {
          font-size: 1rem;
          line-height: 1.65;
          color: var(--text-secondary);
        }

        /* Audio Player */
        .audio-player-container {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
          border: 1px solid rgba(212, 175, 55, 0.15);
        }

        .audio-play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gold-gradient);
          border: none;
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform var(--transition-fast);
          box-shadow: 0 4px 10px rgba(212, 175, 55, 0.2);
        }

        .audio-play-btn:hover {
          transform: scale(1.05);
        }

        .player-track-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .track-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .track-artist {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .player-progress-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 4px;
        }

        .progress-track-bg {
          flex-grow: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: var(--gold-primary);
          border-radius: 2px;
        }

        .time-duration {
          font-size: 0.7rem;
          color: var(--text-muted);
          min-width: 60px;
          text-align: right;
        }

        .media-gallery-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .media-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .media-gallery-item {
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 16 / 10;
          border: 1px solid var(--border-color);
        }

        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .gallery-img:hover {
          transform: scale(1.03);
        }

        .video-thumbnail-placeholder {
          background: var(--bg-tertiary);
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .video-thumbnail-placeholder:hover {
          background: var(--bg-card-hover);
        }

        /* Riders Summary */
        .riders-grid-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .riders-grid-split {
            grid-template-columns: 1fr 1fr;
          }
        }

        .rider-col {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .rider-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--spacing-sm);
        }

        .rider-icon {
          width: 16px;
          height: 16px;
          color: var(--gold-primary);
        }

        .rider-col h4 {
          font-size: 0.9rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--text-primary);
        }

        .rider-body-text {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Sidebar content */
        .profile-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .sidebar-action-card {
          text-align: center;
          border-color: rgba(212, 175, 55, 0.35);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
        }

        .sidebar-action-card h3 {
          color: var(--gold-primary);
          margin-bottom: 8px;
        }

        .sidebar-action-card p {
          font-size: 0.85rem;
          margin-bottom: var(--spacing-lg);
        }

        .btn-full-sidebar {
          width: 100%;
        }

        .stats-sidebar-card h3, .calendar-sidebar-card h3 {
          font-size: 1.15rem;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .socials-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .social-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 8px;
        }

        .social-platform-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .followers-count {
          font-weight: 600;
          color: var(--gold-primary);
        }

        /* Calendar Sidebar styling */
        .calendar-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .calendar-container {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .calendar-header-month {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gold-primary);
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .day-cell.available {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .day-cell.blocked {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-decoration: line-through;
        }

        .empty-day-cell {
          aspect-ratio: 1;
        }

        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 12px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.available {
          background: var(--color-success);
        }

        .legend-dot.blocked {
          background: var(--color-error);
        }
      `}</style>
    </div>
  );
}
