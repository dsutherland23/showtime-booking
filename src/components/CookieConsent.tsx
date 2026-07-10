'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Shield, Settings, X, Check } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    functional: true,
    marketing: false,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('showtime-cookie-consent');
    if (!consent) {
      // Small delay before displaying banner for a premium entrance
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Trap focus inside customize modal for accessibility compliance
  useEffect(() => {
    if (!showCustomise || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, input[type="checkbox"], a, [tabindex="0"]'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    first.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCustomise]);

  const handleAcceptAll = () => {
    const allPref = { necessary: true, analytics: true, functional: true, marketing: true };
    localStorage.setItem('showtime-cookie-consent', JSON.stringify(allPref));
    setShowBanner(false);
    setShowCustomise(false);
  };

  const handleRejectAll = () => {
    const minPref = { necessary: true, analytics: false, functional: false, marketing: false };
    localStorage.setItem('showtime-cookie-consent', JSON.stringify(minPref));
    setShowBanner(false);
    setShowCustomise(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem('showtime-cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowCustomise(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* ── Cookie consent banner (slide up overlay) ── */}
      <div 
        className="cookie-banner" 
        role="region" 
        aria-label="Cookie consent banner" 
        aria-describedby="cookie-desc"
      >
        <div className="cookie-banner-inner">
          <div className="cookie-banner-text">
            <Shield className="cookie-shield-icon" aria-hidden="true" />
            <p id="cookie-desc">
              We use cookies to personalize your booking experience, remember secure portal credentials, analyze traffic metrics, and improve our AI-driven talent insights. Read our <Link href="/privacy" className="cookie-policy-link">Privacy Policy</Link> for details.
            </p>
          </div>
          
          <div className="cookie-actions">
            <button 
              ref={triggerRef}
              className="cookie-btn cookie-btn-customise" 
              onClick={() => setShowCustomise(true)}
              aria-haspopup="dialog"
            >
              <Settings className="w-3.5 h-3.5" />
              Customise
            </button>
            <button className="cookie-btn cookie-btn-reject" onClick={handleRejectAll}>
              Reject All
            </button>
            <button className="cookie-btn cookie-btn-accept" onClick={handleAcceptAll}>
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* ── Customise preferences modal overlay ── */}
      {showCustomise && (
        <div 
          className="cookie-modal-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="cookie-modal-title"
        >
          <div className="cookie-modal" ref={modalRef}>
            <div className="cookie-modal-header">
              <h2 id="cookie-modal-title">Cookie Preference Manager</h2>
              <button 
                className="cookie-modal-close" 
                onClick={() => setShowCustomise(false)}
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="cookie-modal-body">
              <p>Configure which tracking layers are active. Necessary cookies cannot be disabled as they run core booking and security modules.</p>
              
              <div className="cookie-option-list">
                {/* 1. Necessary */}
                <div className="cookie-option-item">
                  <div className="cookie-option-info">
                    <h3>Strictly Necessary</h3>
                    <p>Enables security, portal logins, and transaction locks. Required to run the booking service.</p>
                  </div>
                  <div className="cookie-toggle-wrap">
                    <span className="cookie-badge">Always Active</span>
                  </div>
                </div>

                {/* 2. Analytics */}
                <div className="cookie-option-item">
                  <div className="cookie-option-info">
                    <h3>Analytics &amp; Performance</h3>
                    <p>Monitors response speeds, load metrics, and user flows to help optimize loading and interface design.</p>
                  </div>
                  <label className="switch" htmlFor="toggle-analytics">
                    <input 
                      type="checkbox" 
                      id="toggle-analytics"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                {/* 3. Functional / AI */}
                <div className="cookie-option-item">
                  <div className="cookie-option-info">
                    <h3>Functional &amp; AI Personalization</h3>
                    <p>Remembers custom filters and past search criteria, allowing the AI booking assistant to provide hyper-personalized recommendations.</p>
                  </div>
                  <label className="switch" htmlFor="toggle-functional">
                    <input 
                      type="checkbox" 
                      id="toggle-functional"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                {/* 4. Marketing */}
                <div className="cookie-option-item">
                  <div className="cookie-option-info">
                    <h3>Marketing &amp; Targeting</h3>
                    <p>Tracks marketing campaign conversion performance and delivers tailored highlights on partner platforms.</p>
                  </div>
                  <label className="switch" htmlFor="toggle-marketing">
                    <input 
                      type="checkbox" 
                      id="toggle-marketing"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button className="cookie-btn cookie-btn-reject" onClick={handleRejectAll}>
                Reject All
              </button>
              <button className="cookie-btn cookie-btn-accept" onClick={handleSaveCustom}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Banner ── */
        .cookie-banner {
          position: fixed;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          background: rgba(12, 10, 23, 0.94);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
          animation: bannerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-width: 1200px;
          margin: 0 auto;
        }

        @keyframes bannerSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cookie-banner-inner {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        @media (min-width: 1024px) {
          .cookie-banner-inner {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
          }
        }

        .cookie-banner-text {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .cookie-shield-icon {
          color: var(--accent);
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cookie-banner-text p {
          font-family: var(--font-body);
          font-size: 0.875rem;
          line-height: 1.45;
          color: var(--text-secondary);
          margin: 0;
          max-width: none;
        }

        .cookie-policy-link {
          color: var(--accent);
          text-decoration: underline;
          font-weight: 500;
        }

        .cookie-policy-link:hover {
          color: var(--accent-hover);
        }

        .cookie-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .cookie-actions {
            flex-direction: column;
            width: 100%;
          }
          .cookie-actions button {
            width: 100%;
          }
        }

        .cookie-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.55rem 1.2rem;
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: none;
          min-height: 38px;
        }

        .cookie-btn-accept {
          background: var(--accent-gradient);
          color: #07050e;
        }

        .cookie-btn-accept:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .cookie-btn-reject {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .cookie-btn-reject:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .cookie-btn-customise {
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: var(--accent);
        }

        .cookie-btn-customise:hover {
          background: rgba(212, 175, 55, 0.08);
          border-color: var(--accent);
        }

        /* ── Modal Preferences ── */
        .cookie-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .cookie-modal {
          background: rgba(12, 10, 23, 0.96);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 3rem);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }

        .cookie-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .cookie-modal-header h2 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .cookie-modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cookie-modal-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .cookie-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cookie-modal-body p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .cookie-option-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cookie-option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
        }

        .cookie-option-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cookie-option-info h3 {
          font-family: var(--font-body);
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .cookie-option-info p {
          font-size: 0.78rem !important;
          color: var(--text-muted) !important;
          line-height: 1.4 !important;
        }

        .cookie-toggle-wrap {
          flex-shrink: 0;
        }

        .cookie-badge {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--accent);
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.2);
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cookie-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.01);
        }

        /* ── IOS Style Switch Toggle ── */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.15);
          transition: .3s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        input:checked + .slider {
          background-color: #30d158; /* Apple green */
          border-color: #30d158;
        }

        input:focus-visible + .slider {
          outline: 3px solid rgba(0, 113, 227, 0.6);
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </>
  );
}
