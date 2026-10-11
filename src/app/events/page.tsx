'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Users, Award, Ticket, Music,
  Clock, ArrowRight, Search, Sparkles, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { db, ShowEvent } from '@/utils/db';

export default function Events() {
  const [events, setEvents] = useState<ShowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = async () => {
    try {
      const data = await db.getEvents();
      // Only show Published and Upcoming events on the live website
      const publicEvents = data.filter(e => e.status !== 'Draft');
      setEvents(publicEvents);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'st_events') {
        loadEvents();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const categories = ['All', 'Festival', 'Concert', 'Arena Tour', 'Club Showcase', 'Gala'];

  const filteredEvents = events.filter(evt => {
    const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.tagline && evt.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.lineup && evt.lineup.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00Z'));
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="events-viewport container luxury-bg">
      {/* Hero Header */}
      <div className="section-header">
        <span className="gold-badge">Live Showcase &amp; World Tours</span>
        <h2>Showtime Stage Productions</h2>
        <p>
          A global showcase of premier festivals, stadiums, and concert arenas contracted and powered through Showtime Entertainment.
        </p>
      </div>

      {/* Interactive Controls: Search & Category Filter */}
      <div className="events-controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search events, cities, venues, or artists…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="events-loading">
          <div className="spinner" />
          <span>Curating upcoming stage productions…</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <Music size={40} className="empty-icon" />
          <h3>No events found</h3>
          <p>We couldn&apos;t find any productions matching your filter. Try adjusting your search or category.</p>
          <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-3 events-grid">
          {filteredEvents.map(evt => {
            const displayImg = evt.poster_image || evt.header_image || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800';

            return (
              <div key={evt.id} className={`luxury-card event-show-card ${evt.is_featured ? 'featured-border' : ''}`}>
                {/* Visual Image Banner with 2026 Glass Badges */}
                <div className="event-img-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayImg} alt={evt.title} className="event-img" />
                  <div className="event-badge-row">
                    <span className="event-tag">{evt.category}</span>
                    {evt.is_featured && (
                      <span className="spotlight-tag">
                        <Sparkles size={11} /> Spotlight
                      </span>
                    )}
                  </div>
                  {evt.status === 'Upcoming' && (
                    <span className="status-indicator-pill">Upcoming Tour</span>
                  )}
                </div>

                <div className="event-body">
                  <div className="title-area">
                    <h3>{evt.title}</h3>
                    {evt.tagline && <p className="event-tagline">{evt.tagline}</p>}
                  </div>

                  <div className="event-details-list">
                    <span className="evt-meta-item">
                      <Calendar className="evt-icon-tiny" />
                      <strong>{formatDate(evt.date)}</strong>
                      {evt.time && <span className="time-sub">• {evt.time}</span>}
                    </span>
                    <span className="evt-meta-item">
                      <MapPin className="evt-icon-tiny" />
                      <span>{evt.venue}{evt.city ? `, ${evt.city}` : ''}, {evt.country}</span>
                    </span>
                    {evt.attendance && (
                      <span className="evt-meta-item">
                        <Users className="evt-icon-tiny" />
                        <span>{evt.attendance} capacity</span>
                      </span>
                    )}
                    {evt.lineup && (
                      <span className="evt-meta-item lineup-item">
                        <Music className="evt-icon-tiny" />
                        <span className="lineup-text">{evt.lineup}</span>
                      </span>
                    )}
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="event-footer">
                    <div className="price-tag-block">
                      <span className="price-label">Tickets</span>
                      <span className="price-val">
                        {evt.ticket_price_starting ? `From $${evt.ticket_price_starting}` : 'Concierge'}
                      </span>
                    </div>

                    <div className="actions-cluster">
                      {evt.ticket_link ? (
                        <a
                          href={evt.ticket_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ticket"
                        >
                          <Ticket size={13} />
                          <span>Get Tickets</span>
                        </a>
                      ) : (
                        <Link
                          href={`/booking?event=${encodeURIComponent(evt.title)}`}
                          className="btn-ticket"
                        >
                          <span>Book Talent</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Production Concierge Callout */}
      <div className="production-callout">
        <div className="callout-content">
          <span className="gold-badge">Promoters &amp; Arena Bookings</span>
          <h3>Looking to Headline or Sponsor a Major Event?</h3>
          <p>
            Showtime Entertainment manages contracting, talent routing, and full technical rider execution for arenas and festivals across North America, Europe, and the Caribbean.
          </p>
        </div>
        <Link href="/booking" className="btn btn-primary callout-btn">
          <span>Inquire With Concierge</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <style jsx>{`
        .events-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .events-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-top: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(12px);
        }

        .search-box {
          position: relative;
          min-width: 280px;
          flex: 1;
          max-width: 420px;
        }

        .search-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: var(--radius-md);
          padding: 0.65rem 1rem 0.65rem 2.4rem;
          font-size: 0.85rem;
          color: #fff;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .search-input:focus {
          border-color: var(--gold-primary);
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
        }

        :global(.search-icon) {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .category-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .cat-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 0.45rem 0.95rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .cat-pill:hover {
          color: #fff;
          border-color: rgba(212, 175, 55, 0.4);
        }

        .cat-pill.active {
          background: var(--gold-primary);
          color: #07050e;
          border-color: var(--gold-primary);
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
        }

        .events-grid {
          margin-top: 1rem;
        }

        .event-show-card {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .event-show-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.15);
        }

        .featured-border {
          border-color: rgba(212, 175, 55, 0.45);
        }

        .event-img-wrapper {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          width: 100%;
          background: #000;
        }

        .event-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .event-show-card:hover .event-img {
          transform: scale(1.05);
        }

        .event-badge-row {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }

        .event-tag {
          background: rgba(7, 5, 14, 0.85);
          color: var(--gold-primary);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
        }

        .spotlight-tag {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(184, 134, 11, 0.9));
          color: #07050e;
          border-radius: var(--radius-sm);
          font-size: 0.68rem;
          font-weight: 800;
          padding: 4px 8px;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-indicator-pill {
          position: absolute;
          bottom: 10px;
          right: 12px;
          background: rgba(0, 0, 0, 0.75);
          color: #64d2ff;
          border: 1px solid rgba(100, 210, 255, 0.3);
          border-radius: 12px;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 8px;
          backdrop-filter: blur(6px);
        }

        .event-body {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
        }

        .title-area h3 {
          font-size: 1.25rem;
          line-height: 1.3;
          margin-bottom: 4px;
          color: #fff;
        }

        .event-tagline {
          font-size: 0.82rem;
          color: var(--gold-primary);
          margin: 0;
          font-style: italic;
        }

        .event-details-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 4px;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .evt-meta-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .time-sub {
          color: var(--text-muted);
          font-size: 0.76rem;
        }

        .lineup-item {
          align-items: flex-start;
          margin-top: 2px;
        }

        .lineup-text {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.8rem;
          line-height: 1.35;
        }

        :global(.evt-icon-tiny) {
          width: 15px;
          height: 15px;
          color: var(--gold-primary);
          flex-shrink: 0;
        }

        .event-footer {
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .price-tag-block {
          display: flex;
          flex-direction: column;
        }

        .price-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--gold-primary);
        }

        .btn-ticket {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: var(--gold-primary);
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .btn-ticket:hover {
          background: var(--gold-primary);
          color: #07050e;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }

        .events-loading, .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: var(--gold-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .production-callout {
          margin-top: var(--spacing-xxl);
          padding: var(--spacing-xl);
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(20, 15, 38, 0.6) 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: var(--radius-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .callout-content {
          max-width: 650px;
        }

        .callout-content h3 {
          font-size: 1.45rem;
          margin-top: 8px;
          margin-bottom: 8px;
        }

        .callout-content p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .callout-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.6rem;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
