'use client';

import React from 'react';
import { Target, Globe, Compass, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="about-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">Agency Profile</span>
        <h2>About Showtime Booking</h2>
        <p>Building the leading Caribbean talent booking, artist management, and entertainment logistics platform.</p>
      </div>

      <div className="about-sections-grid">
        <div className="luxury-card grid-row-span">
          <Target className="about-icon" />
          <h3>Our Vision</h3>
          <p>
            Showtime was founded with a singular, high-conviction mandate: to build the gold-standard pathway for Caribbean and international talent to conquer global markets. We streamline the complex administrative layers of booking, visa compliance, legal contracting, and touring logistics. By creating a premium, modern portal connecting clients with represented stars, we enable culture to move seamlessly onto world stages.
          </p>
        </div>

        <div className="luxury-card">
          <Globe className="about-icon" />
          <h3>Target Markets</h3>
          <p>
            We manage active booking pipelines and live concert routes across primary target territories:
          </p>
          <ul className="markets-list">
            <li>Jamaica & the Caribbean Islands</li>
            <li>United States (Coachella, Summer Stages)</li>
            <li>United Kingdom (London Arenas, Glastonbury)</li>
            <li>Canada, Continental Europe & Middle East</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .about-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
          max-width: 800px !important;
        }

        .about-sections-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-top: var(--spacing-xl);
        }

        .about-icon {
          width: 32px;
          height: 32px;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-sm);
        }

        .about-sections-grid h3 {
          color: var(--gold-primary);
          margin-bottom: var(--spacing-sm);
        }

        .about-sections-grid p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .markets-list {
          margin-top: 10px;
          padding-left: 20px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .markets-list li {
          position: relative;
          list-style: none;
        }

        .markets-list li::before {
          content: '•';
          color: var(--gold-primary);
          font-weight: bold;
          display: inline-block; 
          width: 1em;
          margin-left: -1em;
        }
      `}</style>
    </div>
  );
}
