'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
        </Link>

        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,69,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Mail style={{ width: 28, height: 28, color: '#ff453a' }} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>Verification failed</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              This verification link has expired or is invalid. Please request a new one.
            </p>
            <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(48, 209, 88, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 style={{ width: 28, height: 28, color: '#30d158' }} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>Email Verified</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Your email address has been verified successfully. You can now sign in to your Showtime account.
            </p>
            <Link href="/auth/login?verified=true" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
              Sign In to Your Account
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--bg-primary); background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.08), transparent); }
        .auth-card { width: 100%; max-width: 420px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem 2rem; box-shadow: var(--shadow-xl); }
        .auth-logo-link { display: flex; justify-content: center; margin-bottom: 2rem; opacity: 1; }
        .auth-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
