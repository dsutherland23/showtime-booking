'use client';

import React, { useState, useEffect } from 'react';
import { Target, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { db, AboutUsConfig, SEED_ABOUT_CONFIG } from '@/utils/db';

export default function About() {
  const [config, setConfig] = useState<AboutUsConfig>(SEED_ABOUT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    db.getAboutConfig().then(cfg => {
      if (mounted && cfg) {
        setConfig(cfg);
      }
      if (mounted) setLoading(false);
    });

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<AboutUsConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
      }
    };

    window.addEventListener('st_about_config_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('st_about_config_updated', handleUpdate);
    };
  }, []);

  return (
    <div className="about-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">{config.badge || 'Agency Profile'}</span>
        <h2>{config.title || 'About Showtime Booking'}</h2>
        <p>{config.subtitle || 'Building the leading Caribbean talent booking, artist management, and entertainment logistics platform.'}</p>
      </div>

      <div className="about-sections-grid">
        <div className="luxury-card grid-row-span">
          <Target className="about-icon" />
          <h3>{config.vision_title || 'Our Vision'}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>
            {config.vision_content || 'Showtime was founded with a singular, high-conviction mandate: to build the gold-standard pathway for Caribbean and international talent to conquer global markets. We streamline the complex administrative layers of booking, visa compliance, legal contracting, and touring logistics. By creating a premium, modern portal connecting clients with represented stars, we enable culture to move seamlessly onto world stages.'}
          </p>
        </div>

        <div className="luxury-card">
          <Globe className="about-icon" />
          <h3>{config.markets_title || 'Target Markets'}</h3>
          <p>
            {config.markets_description || 'We manage active booking pipelines and live concert routes across primary target territories:'}
          </p>
          <ul className="markets-list">
            {(config.markets_list || []).map((market, idx) => (
              <li key={idx}>{market}</li>
            ))}
          </ul>
        </div>

        {config.highlights && config.highlights.length > 0 && (
          <div className="highlights-subgrid">
            {config.highlights.map((item, idx) => (
              <div key={idx} className="luxury-card highlight-card">
                <ShieldCheck className="about-icon" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .about-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
          max-width: 840px !important;
        }

        .about-sections-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-top: var(--spacing-xl);
        }

        .highlights-subgrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .highlights-subgrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .highlight-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius-md);
          padding: 1.5rem;
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
          gap: 8px;
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
