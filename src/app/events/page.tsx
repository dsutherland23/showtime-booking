'use client';

import React from 'react';
import { MapPin, Calendar, Users, Award } from 'lucide-react';
import Link from 'next/link';

export default function Events() {
  const eventShowcase = [
    {
      title: 'Reggae Sumfest Montego Bay',
      venue: 'Catherine Hall Entertainment Center',
      country: 'Jamaica',
      date: 'July 18, 2026',
      attendance: '35,000+',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=600',
      tag: 'Headline Festival Slot'
    },
    {
      title: 'Coachella Valley Music & Arts Festival',
      venue: 'Empire Polo Club, Indio, CA',
      country: 'United States',
      date: 'April 18, 2026',
      attendance: '125,000+',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=600',
      tag: 'Outdoor Stage Route'
    },
    {
      title: 'Showtime Arena Showcases',
      venue: 'OVO Arena Wembley, London',
      country: 'United Kingdom',
      date: 'September 12, 2026',
      attendance: '12,500+',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600',
      tag: 'Arena Tour Stop'
    }
  ];

  return (
    <div className="events-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">Live Showcase</span>
        <h2>Showtime Stage Productions</h2>
        <p>A portfolio showcase of major festivals, stadiums, and concert arenas contracted through our platform.</p>
      </div>

      <div className="grid-3 events-grid">
        {eventShowcase.map((evt, idx) => (
          <div key={idx} className="luxury-card event-show-card">
            <div className="event-img-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={evt.image} alt={evt.title} className="event-img" />
              <span className="event-tag">{evt.tag}</span>
            </div>
            
            <div className="event-body">
              <h3>{evt.title}</h3>
              
              <div className="event-details-list">
                <span className="evt-meta-item"><Calendar className="evt-icon-tiny" /> {evt.date}</span>
                <span className="evt-meta-item"><MapPin className="evt-icon-tiny" /> {evt.venue}, {evt.country}</span>
                <span className="evt-meta-item"><Users className="evt-icon-tiny" /> {evt.attendance} attendance</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .events-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .events-grid {
          margin-top: var(--spacing-xl);
        }

        .event-show-card {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .event-img-wrapper {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          width: 100%;
        }

        .event-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .event-show-card:hover .event-img {
          transform: scale(1.03);
        }

        .event-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.85);
          color: var(--gold-primary);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .event-body {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-grow: 1;
        }

        .event-body h3 {
          font-size: 1.2rem;
          line-height: 1.35;
        }

        .event-details-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: auto;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .evt-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .evt-icon-tiny {
          width: 14px;
          height: 14px;
          color: var(--gold-primary);
        }
      `}</style>
    </div>
  );
}
