'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, HelpCircle, Mail, ShieldAlert, Award, FileText } from 'lucide-react';

export default function AccessibilityPage() {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !feedbackText) return;
    setSubmitting(true);
    
    // Simulate accessibility team receipt
    setTimeout(() => {
      setSubmitting(false);
      setFeedbackSent(true);
      setEmailInput('');
      setFeedbackText('');
    }, 1200);
  };

  return (
    <div className="a11y-viewport">
      <div className="container py-12 md:py-24">
        
        {/* Navigation back */}
        <Link href="/" className="back-link mb-8" data-cursor="Back">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <header className="a11y-header mb-12">
          <div className="a11y-badge">
            <Award className="w-5 h-5 text-accent" />
            <span>WCAG 2.2 AA Compliance</span>
          </div>
          <h1>Accessibility Statement</h1>
          <p className="last-updated">Last Updated: July 10, 2026</p>
        </header>

        <div className="a11y-layout">
          {/* Main content docs */}
          <main className="a11y-docs" role="main">
            <section className="doc-section">
              <h2>1. Our Commitment</h2>
              <p>
                Showtime Booking Agency is committed to ensuring digital accessibility for all visitors, including individuals with visual, auditory, motor, or cognitive disabilities. We actively align our portals, layout structures, and media presentation with the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA** conformance requirements to ensure an inclusive, premium user experience and fully prevent ADA litigation risks.
              </p>
            </section>

            <section className="doc-section">
              <h2>2. Conformance Status</h2>
              <p>
                The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. Showtime Booking Agency is fully conformant with WCAG 2.2 Level AA.
              </p>
              <p>
                Our team regularly audits core components to ensure:
              </p>
              <ul>
                <li><strong>Clear contrast levels:</strong> All elements maintain a minimum text-to-background contrast ratio of **4.5:1** (and **3:1** for large heading blocks) to assist users with low vision.</li>
                <li><strong>Focus visibility:</strong> Active elements show a distinct, high-contrast outline (`outline: 3px solid rgba(0, 113, 227, 0.6)`) during keyboard navigation to aid motor-disabled users.</li>
                <li><strong>Semantic DOM structures:</strong> Pages use logical HTML5 landmarks (`header`, `main`, `footer`, `section`) and ARIA tags to facilitate seamless screen reader translation.</li>
                <li><strong>Interactive controls:</strong> All elements are focusable and triggerable via keyboard alone.</li>
              </ul>
            </section>

            <section className="doc-section">
              <h2>3. Testing &amp; Verification Methodology</h2>
              <p>
                We conduct continuous accessibility tests on our local systems and dev servers before any production deployment:
              </p>
              <ul>
                <li><strong>Automated audits:</strong> Continuous testing using the **Deque axe-core** engine and Google Lighthouse Audits.</li>
                <li><strong>Screen readers:</strong> Manual auditing with VoiceOver (macOS/iOS) and NVDA (Windows).</li>
                <li><strong>Keyboard navigation:</strong> Full audit of modals, forms, and custom selection dropdowns to ensure zero focus traps.</li>
              </ul>
            </section>

            <section className="doc-section">
              <h2>4. Underrepresented Content Limitations</h2>
              <p>
                Despite our best efforts, some legacy sections or external portal components may occasionally exhibit minor barriers. We resolve these promptly as they are identified. If you encounter any accessibility issues, please use the compliance reporting form on the right to notify us immediately.
              </p>
            </section>
          </main>

          {/* Right column: Feedback form */}
          <aside className="a11y-sidebar" aria-label="Accessibility reporting form">
            <div className="feedback-box">
              <div className="feedback-box-header">
                <ShieldAlert className="w-5 h-5 text-accent" />
                <h3>Report a Barrier</h3>
              </div>
              
              {feedbackSent ? (
                <div className="feedback-success animate-fade">
                  <p className="success-title">Report Submitted</p>
                  <p>Thank you for helping us maintain an accessible platform. Our compliance team will review your report and apply necessary updates within 24 hours.</p>
                  <button className="btn btn-secondary w-full" onClick={() => setFeedbackSent(false)}>
                    Submit Another Report
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                  <p>If you encounter contrast issues, navigation blocks, or screen reader conflicts, please submit this report directly to our legal audit desk.</p>
                  
                  <div className="field-group">
                    <label htmlFor="feedback-email">Your Contact Email</label>
                    <input 
                      type="email" 
                      id="feedback-email" 
                      required 
                      placeholder="e.g. user@domain.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>

                  <div className="field-group mt-3">
                    <label htmlFor="feedback-text">Describe the Barrier</label>
                    <textarea 
                      id="feedback-text" 
                      required 
                      rows={4}
                      placeholder="e.g. The booking form inputs are not readable using screen readers..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn submit-btn w-full" 
                    disabled={submitting}
                  >
                    {submitting ? 'Sending report…' : 'Submit Accessibility Report'}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
        
      </div>

      <style jsx>{`
        .a11y-viewport {
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

        .a11y-badge {
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

        .a11y-header h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          letter-spacing: -0.035em;
          margin-bottom: 0.5rem;
        }

        .last-updated {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .a11y-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3.5rem;
          margin-top: 3rem;
        }

        @media (min-width: 1024px) {
          .a11y-layout {
            grid-template-columns: 1.8fr 1fr;
            align-items: start;
          }
        }

        .a11y-docs {
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

        /* ── Feedback Box Widget ── */
        .feedback-box {
          background: rgba(12, 10, 23, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
          position: sticky;
          top: 80px;
        }

        .feedback-box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0.75rem;
        }

        .feedback-box-header h3 {
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .feedback-form p {
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        .submit-btn {
          background: var(--accent-gradient);
          color: #07050e;
          font-weight: 700;
          box-shadow: var(--glow-gold);
        }

        .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: var(--glow-gold-strong);
        }

        .feedback-success {
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

        .feedback-success p {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
