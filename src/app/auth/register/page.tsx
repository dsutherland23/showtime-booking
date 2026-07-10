'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
    { label: 'One special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const score = checks.filter((c) => c.valid).length;
  const colors = ['', '#ff453a', '#ff9f0a', '#d4af37', '#30d158'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pw-bar"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <span className="pw-label" style={{ color: colors[score] }}>{labels[score]}</span>
      <ul className="pw-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.valid ? 'valid' : ''}>
            <CheckCircle2 className="w-3 h-3" />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Client' | 'Artist'>('Client');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = (): string => {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'A valid email address is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/\d/.test(password)) return 'Password must contain at least one number.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) { setError('Authentication is not configured yet.'); return; }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role,
          },
          emailRedirectTo: `${siteUrl}/auth/callback?next=/auth/verify-email`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError('Registration failed. Please try again.');
        }
        return;
      }

      if (data?.user) {
        // Create profile record
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          role,
          status: 'Active',
        });

        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Link href="/" className="auth-logo-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
          </Link>
          <div className="success-state">
            <div className="success-icon-wrap">
              <CheckCircle2 className="success-icon" />
            </div>
            <h2>Check your inbox</h2>
            <p>
              We&apos;ve sent a verification link to <strong>{email}</strong>.
              Click the link to activate your account and start booking.
            </p>
            <p className="success-note">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                className="auth-link resend-btn"
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client');
                  const sb = createClient();
                  if (!sb) return;
                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                  await sb.auth.resend({
                    type: 'signup',
                    email,
                    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/auth/verify-email` },
                  });
                }}
              >
                resend the email
              </button>
              .
            </p>
            <Link href="/auth/login" className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
        <style jsx>{`
          .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--bg-primary); background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.08), transparent); }
          .auth-card { width: 100%; max-width: 420px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem 2rem; box-shadow: var(--shadow-xl); }
          .auth-logo-link { display: flex; justify-content: center; margin-bottom: 2rem; opacity: 1; }
          .auth-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
          .success-state { text-align: center; }
          .success-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(48, 209, 88, 0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
          .success-icon { width: 28px; height: 28px; color: #30d158; }
          .success-state h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
          .success-state p { font-size: 0.9rem; color: var(--text-secondary); max-width: none; line-height: 1.55; margin-bottom: 0.6rem; }
          .success-note { font-size: 0.8125rem !important; }
          .auth-link { color: var(--accent); font-weight: 500; }
          .resend-btn { background: none; border: none; cursor: pointer; padding: 0; font-size: inherit; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join the Showtime platform today</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <AlertCircle className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form" noValidate>
          <div className="auth-name-row">
            <div className="field-group">
              <label htmlFor="reg-first">First name</label>
              <input id="reg-first" type="text" placeholder="First" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" disabled={loading} />
            </div>
            <div className="field-group">
              <label htmlFor="reg-last">Last name</label>
              <input id="reg-last" type="text" placeholder="Last" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" disabled={loading} />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={loading} />
          </div>

          <div className="field-group">
            <label htmlFor="reg-role">I am a</label>
            <select id="reg-role" value={role} onChange={(e) => setRole(e.target.value as 'Client' | 'Artist')} disabled={loading}>
              <option value="Client">Client / Event Organizer</option>
              <option value="Artist">Artist / Performer</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="reg-password">Password</label>
            <div className="auth-password-wrap">
              <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="field-group">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading || !email || !password || !confirmPassword || !firstName || !lastName} aria-busy={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>) : (<><UserPlus className="w-4 h-4" /> Create Account</>)}
          </button>
        </form>

        <div className="auth-footer-text">
          <p>Already have an account?{' '}<Link href="/auth/login" className="auth-link">Sign in</Link></p>
        </div>

        <p className="auth-terms">
          By creating an account you agree to our{' '}
          <a href="/privacy" className="auth-link">Privacy Policy</a> and{' '}
          <a href="/terms" className="auth-link">Terms of Service</a>.
        </p>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--bg-primary); background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.08), transparent); }
        .auth-card { width: 100%; max-width: 460px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem 2rem; box-shadow: var(--shadow-xl); }
        .auth-logo-link { display: flex; justify-content: center; margin-bottom: 2rem; opacity: 1; }
        .auth-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
        .auth-header { text-align: center; margin-bottom: 1.75rem; }
        .auth-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text-primary); margin-bottom: 0.35rem; }
        .auth-subtitle { font-size: 0.875rem; color: var(--text-secondary); max-width: none; margin: 0; }
        .auth-alert { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.45; margin-bottom: 1.25rem; }
        .auth-alert-error { background: rgba(255, 69, 58, 0.1); border: 1px solid rgba(255, 69, 58, 0.2); color: #ff453a; }
        .alert-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .auth-name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .auth-password-wrap { position: relative; }
        .auth-password-wrap input { padding-right: 2.75rem; }
        .auth-eye-btn { position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; display: flex; align-items: center; transition: color var(--transition-fast); }
        .auth-eye-btn:hover { color: var(--text-primary); }
        .auth-submit-btn { width: 100%; margin-top: 0.35rem; gap: 0.5rem; }
        .auth-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-footer-text { text-align: center; margin-top: 1.5rem; }
        .auth-footer-text p { font-size: 0.875rem; color: var(--text-muted); max-width: none; margin: 0; }
        .auth-link { color: var(--accent); font-weight: 500; }
        .auth-terms { text-align: center; font-size: 0.75rem !important; color: var(--text-muted); max-width: none; margin: 1rem 0 0; }
        .pw-strength { margin-top: 0.6rem; }
        .pw-bars { display: flex; gap: 4px; margin-bottom: 0.35rem; }
        .pw-bar { height: 3px; flex: 1; border-radius: 2px; transition: background 0.3s ease; }
        .pw-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        .pw-checks { list-style: none; display: flex; flex-direction: column; gap: 3px; margin-top: 0.5rem; }
        .pw-checks li { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--text-muted); }
        .pw-checks li.valid { color: #30d158; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
