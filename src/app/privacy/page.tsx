'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Trash2, Mail, Info, Calendar } from 'lucide-react';

export default function PrivacyPage() {
  const [requestSent, setRequestSent] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitting(true);
    // Simulate API request to GDPR erasure endpoint
    setTimeout(() => {
      setSubmitting(false);
      setRequestSent(true);
      setEmailInput('');
    }, 1200);
  };

  return (
    <div className="privacy-viewport">
      <div className="container py-12 md:py-24">
        
        {/* Navigation back */}
        <Link href="/" className="back-link mb-8" data-cursor="Back">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <header className="privacy-header mb-12">
          <div className="privacy-badge">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span>Showtime Legal &amp; Security</span>
          </div>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: July 10, 2026</p>
        </header>

        <div className="privacy-layout">
          {/* Main content docs */}
          <main className="privacy-docs" role="main">
            <section className="doc-section">
              <h2>1. Introduction</h2>
              <p>
                At Showtime Booking Agency, privacy, transparency, and data control are foundational to our premium booking experience. This Privacy Policy details how we process user data under global compliance regulations, including the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).
              </p>
            </section>

            <section className="doc-section">
              <div className="section-eyebrow-doc">
                <Info className="w-4 h-4" />
                <h3>WHAT We Collect</h3>
              </div>
              <p>We restrict data collection to the minimum required to facilitate secure contracts and talent arrangements. This includes:</p>
              <ul>
                <li><strong>Identity &amp; Profile Data:</strong> Names, stage names, account roles (Artist or Client), and profile or cover images uploaded from your device.</li>
                <li><strong>Contact details:</strong> Email addresses and phone numbers.</li>
                <li><strong>Event Booking Records:</strong> Venue details, performance specifications, contract drafts, and deposit tracking.</li>
                <li><strong>Technical Logs:</strong> IP address, device specs, browser type, and cookie preferences to ensure layout security and performance.</li>
              </ul>
            </section>

            <section className="doc-section">
              <div className="section-eyebrow-doc">
                <Info className="w-4 h-4" />
                <h3>WHY We Collect It</h3>
              </div>
              <p>Your data is processed strictly for the following purposes:</p>
              <ul>
                <li>To authenticate portal accounts and deliver localized dashboards.</li>
                <li>To generate legal, compliant talent contract agreements between promoters and headliners.</li>
                <li>To secure escrow deposits and organize stage technical riders.</li>
                <li>To enable our AI booking assistant to make tailored talent recommendations.</li>
              </ul>
            </section>

            <section className="doc-section">
              <div className="section-eyebrow-doc">
                <Calendar className="w-4 h-4" />
                <h3>WHEN We Collect It</h3>
              </div>
              <p>Data collection occurs exclusively when you interact directly with the platform:</p>
              <ul>
                <li>When you create a client or artist account.</li>
                <li>When you fill out or edit your artist profile details, including uploading imagery.</li>
                <li>When you submit booking requests, contact forms, or technical rider specs.</li>
                <li>During navigation (strictly performance-monitoring cookies, subject to your cookie settings).</li>
              </ul>
            </section>

            <section className="doc-section" id="data-erasure">
              <div className="section-eyebrow-doc">
                <Trash2 className="w-4 h-4 text-error" />
                <h3>HOW to Delete Your Data (Right to Erasure)</h3>
              </div>
              <p>
                In compliance with GDPR Article 17 and CCPA specifications, you maintain absolute ownership of your personal information. You can request complete erasure of your credentials, files, and transaction histories at any time.
              </p>
              
              <div className="erasure-methods mt-6">
                <div className="method-card">
                  <h4>Method 1: Account Control Settings</h4>
                  <p>Log in to your account, navigate to Account Settings, scroll to the bottom, and click <strong>"Delete My Account"</strong>. This instantly and permanently redacts your profile information, files, and auth records from our primary database.</p>
                </div>

                <div className="method-card">
                  <h4>Method 2: Immediate Legal Request</h4>
                  <p>Fill out the official erasure form on the right or email our legal team directly at <a href="mailto:legal@showtimeservices.com" className="email-link">legal@showtimeservices.com</a>. We process all manual erasure requests within 24 hours.</p>
                </div>
              </div>
            </section>
          </main>

          {/* Right column: Erasure Form Widget */}
          <aside className="privacy-sidebar" aria-label="Erasure submission">
            <div className="erasure-box">
              <div className="erasure-box-header">
                <Trash2 className="w-5 h-5 text-[#ff453a]" />
                <h3>Data Deletion Form</h3>
              </div>
              
              {requestSent ? (
                <div className="erasure-success animate-fade">
                  <p className="success-title">Request Registered</p>
                  <p>A verification link has been sent to your email. Click it to confirm the permanent removal of all profile listings and booking histories.</p>
                  <button className="btn btn-secondary w-full" onClick={() => setRequestSent(false)}>
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDeleteRequest} className="erasure-form">
                  <p>Enter the email address associated with your Showtime account to request complete profile deletion and file redacting.</p>
                  
                  <div className="field-group">
                    <label htmlFor="erasure-email">Account Email Address</label>
                    <input 
                      type="email" 
                      id="erasure-email" 
                      required 
                      placeholder="e.g. artist@showtime.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn delete-btn w-full" 
                    disabled={submitting}
                  >
                    {submitting ? 'Processing request…' : 'Request Account Deletion'}
                  </button>
                  
                  <span className="erasure-disclaimer">
                    Warning: This action is permanent and cannot be undone. All active contract files and rider uploads will be deleted.
                  </span>
                </form>
              )}
            </div>
          </aside>
        </div>
        
      </div>

      <style jsx>{`
        .privacy-viewport {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--accent);
        }

        .privacy-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          margin-bottom: 0.85rem;
        }

        .privacy-header h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          letter-spacing: -0.035em;
          margin-bottom: 0.5rem;
        }

        .last-updated {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .privacy-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3.5rem;
          margin-top: 3rem;
        }

        @media (min-width: 1024px) {
          .privacy-layout {
            grid-template-columns: 1.8fr 1fr;
            align-items: start;
          }
        }

        .privacy-docs {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .doc-section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
        }

        .section-eyebrow-doc {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }

        .section-eyebrow-doc h3 {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
          color: var(--text-primary);
        }

        .doc-section p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }

        .doc-section ul {
          list-style-type: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .doc-section ul li {
          font-size: 0.9rem;
          color: var(--text-secondary);
          position: relative;
          padding-left: 1.25rem;
          line-height: 1.5;
        }

        .doc-section ul li::before {
          content: '•';
          color: var(--accent);
          position: absolute;
          left: 0.25rem;
          font-size: 1.1rem;
          line-height: 1;
        }

        .erasure-methods {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .method-card {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }

        .method-card h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .method-card p {
          font-size: 0.84rem;
          line-height: 1.5;
          margin: 0;
          color: var(--text-secondary);
        }

        .email-link {
          color: var(--accent);
          text-decoration: underline;
        }

        /* ── Erasure Box Widget ── */
        .erasure-box {
          background: rgba(12, 10, 23, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
          position: sticky;
          top: 80px;
        }

        .erasure-box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0.75rem;
        }

        .erasure-box-header h3 {
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .erasure-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .erasure-form p {
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        .delete-btn {
          background: #ff453a;
          color: #fff;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(255, 69, 58, 0.2);
        }

        .delete-btn:hover {
          background: #ff5b52;
          box-shadow: 0 6px 16px rgba(255, 69, 58, 0.35);
        }

        .erasure-disclaimer {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.45;
          text-align: center;
        }

        .erasure-success {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .success-title {
          font-weight: 700;
          color: var(--color-success);
          font-size: 1.05rem;
        }

        .erasure-success p {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
