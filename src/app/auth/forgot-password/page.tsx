'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      if (!supabase) { setError('Authentication is not configured yet.'); return; }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${siteUrl}/auth/reset-password`,
      });

      if (error) {
        setError('Unable to send reset email. Please try again later.');
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
        </Link>

        {sent ? (
          <div className="sent-state">
            <div className="sent-icon-wrap">
              <CheckCircle2 className="sent-icon" />
            </div>
            <h2>Reset link sent</h2>
            <p>
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Check your inbox and click the link to create a new password.
            </p>
            <p className="sent-note">The link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
            <Link href="/auth/login" className="btn btn-secondary back-btn">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Forgot your password?</h1>
              <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <AlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="field-group">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading || !email} aria-busy={loading}>
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : (<><Mail className="w-4 h-4" /> Send Reset Link</>)}
              </button>
            </form>

            <div className="auth-footer-text">
              <Link href="/auth/login" className="back-link">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--bg-primary); background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.08), transparent); }
        .auth-card { width: 100%; max-width: 420px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem 2rem; box-shadow: var(--shadow-xl); }
        .auth-logo-link { display: flex; justify-content: center; margin-bottom: 2rem; opacity: 1; }
        .auth-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
        .auth-header { text-align: center; margin-bottom: 1.75rem; }
        .auth-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text-primary); margin-bottom: 0.35rem; }
        .auth-subtitle { font-size: 0.875rem; color: var(--text-secondary); max-width: none; margin: 0; }
        .auth-alert { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.45; margin-bottom: 1.25rem; }
        .auth-alert-error { background: rgba(255, 69, 58, 0.1); border: 1px solid rgba(255, 69, 58, 0.2); color: #ff453a; }
        .alert-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .auth-submit-btn { width: 100%; gap: 0.5rem; }
        .auth-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-footer-text { text-align: center; margin-top: 1.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--text-muted); }
        .back-link:hover { color: var(--text-primary); opacity: 1; }
        .sent-state { text-align: center; }
        .sent-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(212, 175, 55, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
        .sent-icon { width: 28px; height: 28px; color: var(--accent); }
        .sent-state h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
        .sent-state p { font-size: 0.9rem; color: var(--text-secondary); max-width: none; line-height: 1.55; margin-bottom: 0.6rem; }
        .sent-note { font-size: 0.8rem !important; color: var(--text-muted) !important; }
        .back-btn { width: 100%; justify-content: center; margin-top: 1.5rem; gap: 0.5rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
