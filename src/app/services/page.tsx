'use client';

import React from 'react';
import { Briefcase, Plane, ShieldCheck, Music, Award, Headphones, Compass, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

export default function Services() {
  const serviceList = [
    { icon: <Music className="service-icon" />, title: 'Talent Booking', desc: 'Direct contracting for reggae, dancehall, and international roster performers, with secure invoice management.' },
    { icon: <HeartHandshake className="service-icon" />, title: 'Artist Representation', desc: 'Elite career planning, brand alignment, global synchronization license placements, and media uploader suites.' },
    { icon: <Plane className="service-icon" />, title: 'Tour Routing & Routing', desc: 'Full routing optimization across North America, Europe, the United Kingdom, and Middle East territories.' },
    { icon: <Headphones className="service-icon" />, title: 'Production Management', desc: 'Stage sound system checks, lighting backline specs alignment, and on-site acoustic coordination.' },
    { icon: <ShieldCheck className="service-icon" />, title: 'Visa & Work Permits', desc: 'Legally vetted US O-1/O-2 petitions, UK Certificate of Sponsorship (CoS), and European work clearances.' },
    { icon: <Compass className="service-icon" />, title: 'Event Logistics', desc: 'Premium ground transportation, flight bookings, accommodation, and hospitality rider execution.' },
    { icon: <Award className="service-icon" />, title: 'PR & Press Marketing', desc: 'Press kit packaging, media interviews, campaign strategies, and social footprint growth operations.' },
    { icon: <Briefcase className="service-icon" />, title: 'Financial Settlements', desc: 'Multi-currency payment gateways (Stripe, Wise, Bank Wire) with automated tax withholding calculations.' }
  ];

  return (
    <div className="services-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">Platform Capabilities</span>
        <h2>Showtime Agency Services</h2>
        <p>Providing end-to-end talent acquisition, international travel compliance, and live production coordination.</p>
      </div>

      <div className="grid-3 service-grid">
        {serviceList.map((srv, idx) => (
          <div key={idx} className="luxury-card service-card">
            <div className="icon-wrapper-box">{srv.icon}</div>
            <h3>{srv.title}</h3>
            <p>{srv.desc}</p>
          </div>
        ))}
      </div>

      <div className="services-cta-block">
        <div className="luxury-card cta-box-inner">
          <h3>Need a Custom Logistics Blueprint?</h3>
          <p>Consult with our lead logistics agents or submit event details to obtain travel and permit estimations.</p>
          <div className="cta-buttons">
            <Link href="/book" className="btn btn-primary">Book Roster Talent</Link>
            <Link href="/ai-assistant" className="btn btn-secondary">AI Assistant Estimates</Link>
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
        }

        .service-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .icon-wrapper-box {
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.15);
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-card h3 {
          font-family: var(--font-body);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--gold-primary);
        }

        .service-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
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
