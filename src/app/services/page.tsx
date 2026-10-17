'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase, Plane, ShieldCheck, Music, Award, Headphones,
  Compass, HeartHandshake, Globe, Sparkles, Megaphone,
  DollarSign, Calendar, Clock, CheckCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { db, AgencyService, SEED_SERVICES } from '@/utils/db';

const ICON_MAP: Record<string, React.ReactNode> = {
  'music': <Music className="service-icon" />,
  'heart-handshake': <HeartHandshake className="service-icon" />,
  'plane': <Plane className="service-icon" />,
  'headphones': <Headphones className="service-icon" />,
  'shield-check': <ShieldCheck className="service-icon" />,
  'compass': <Compass className="service-icon" />,
  'award': <Award className="service-icon" />,
  'briefcase': <Briefcase className="service-icon" />,
  'globe': <Globe className="service-icon" />,
  'sparkles': <Sparkles className="service-icon" />,
  'megaphone': <Megaphone className="service-icon" />,
  'dollarsign': <DollarSign className="service-icon" />,
  'calendar': <Calendar className="service-icon" />,
  'clock': <Clock className="service-icon" />,
  'check-circle': <CheckCircle className="service-icon" />,
};

function renderServiceIcon(iconKey: string) {
  const key = (iconKey || '').toLowerCase();
  return ICON_MAP[key] || <Briefcase className="service-icon" />;
}

export default function Services() {
  const [services, setServices] = useState<AgencyService[]>(SEED_SERVICES);

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        const data = await db.getServices();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setServices(data.filter(s => s.active !== false));
        }
      } catch (err) {
        console.error('Failed to load agency services:', err);
      }
    };

    fetchServices();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AgencyService[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setServices(customEvent.detail.filter(s => s.active !== false));
      } else {
        fetchServices();
      }
    };

    window.addEventListener('st_services_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('st_services_updated', handleUpdate);
    };
  }, []);

  return (
    <div className="services-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">Platform Capabilities</span>
        <h2>Showtime Agency Services</h2>
        <p>Providing end-to-end talent acquisition, international travel compliance, and live production coordination.</p>
      </div>

      <div className="grid-3 service-grid">
        {services.map((srv) => (
          <div key={srv.id} className="luxury-card service-card">
            <div className="service-card-top">
              <div className="icon-wrapper-box">{renderServiceIcon(srv.icon)}</div>
              {srv.category && (
                <span className="service-cat-pill">{srv.category}</span>
              )}
            </div>

            <div className="service-body">
              <h3>{srv.title}</h3>
              <p>{srv.desc}</p>
            </div>

            <div className="service-footer">
              {srv.turnaround && (
                <span className="service-turnaround">
                  <Clock size={12} className="inline-icon" /> {srv.turnaround}
                </span>
              )}
              {srv.action_label && srv.action_url ? (
                <Link href={srv.action_url} className="service-link">
                  <span>{srv.action_label}</span>
                  <ArrowRight size={13} />
                </Link>
              ) : (
                <Link href="/book" className="service-link">
                  <span>Inquire</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="services-cta-block">
        <div className="luxury-card cta-box-inner">
          <span className="gold-badge">Custom Engagements</span>
          <h3>Need a Custom Logistics Blueprint?</h3>
          <p>Consult with our lead logistics agents or submit event details to obtain travel and permit estimations.</p>
          <div className="cta-buttons">
            <Link href="/book" className="btn btn-primary">Book Roster Talent</Link>
            <Link href="/contact" className="btn btn-secondary">Contact Our Team</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .services-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .service-grid {
          margin-top: var(--spacing-xl);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1.5rem;
        }

        .service-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(18, 14, 28, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.15);
          transition: all 0.25s ease;
        }

        .service-card:hover {
          border-color: rgba(212, 175, 55, 0.45);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.1);
        }

        .service-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .icon-wrapper-box {
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.2);
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-cat-pill {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
        }

        .service-body {
          flex: 1;
        }

        .service-card h3 {
          font-family: var(--font-body);
          font-size: 1.15rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .service-card p {
          font-size: 0.86rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
        }

        .service-footer {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .service-turnaround {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--gold-primary);
          font-weight: 500;
        }

        :global(.inline-icon) {
          vertical-align: middle;
        }

        .service-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .service-link:hover {
          color: #fff;
          transform: translateX(2px);
        }

        .services-cta-block {
          margin-top: var(--spacing-xxl);
          text-align: center;
        }

        .cta-box-inner {
          max-width: 700px;
          margin: 0 auto;
          padding: var(--spacing-xl);
          border-color: rgba(212, 175, 55, 0.25);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          margin-top: var(--spacing-md);
        }
      `}</style>
      <style jsx global>{`
        .service-icon {
          width: 20px;
          height: 20px;
          color: var(--gold-primary);
        }
      `}</style>
    </div>
  );
}
