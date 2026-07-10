'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError('Authentication is not configured yet.');
      return;
    }
    // The token from the email link sets a session automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        setError('This reset link is invalid or has expired. Please request a new one.');
      }
    });

    // Handle hash params from Supabase email link
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
        setSessionReady(true);
      });
    }
  }, [supabase, searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Authentication is not configured yet.'); return; }

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/\d/.test(password)) { setError('Password must contain at least one number.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError('Failed to update password. Your reset link may have expired. Please request a new one.');
        return;
      }

      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push('/auth/login'), 3000);
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

        {success ? (
          <div className="success-state">
            <div className="success-icon-wrap"><CheckCircle2 className="success-icon" /></div>
            <h2>Password updated</h2>
            <p>Your password has been reset successfully. Redirecting you to sign in…</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Choose a strong password for your account</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <AlertCircle className="alert-icon" />
                <span>{error}</span>
                {error.includes('expired') && (
                  <Link href="/auth/forgot-password" className="auth-link" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Request new link</Link>
                )}
              </div>
            )}

            <form onSubmit={handleReset} className="auth-form" noValidate>
              <div className="field-group">
                <label htmlFor="reset-password">New password</label>
                <div className="auth-password-wrap">
                  <input id="reset-password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" autoFocus disabled={loading || !sessionReady} />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input id="reset-confirm" type={showPassword ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={loading || !sessionReady} />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading || !sessionReady || !password || !confirmPassword} aria-busy={loading}>
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>) : (<><Lock className="w-4 h-4" /> Update Password</>)}
              </button>
            </form>
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
        .auth-password-wrap { position: relative; }
        .auth-password-wrap input { padding-right: 2.75rem; }
        .auth-eye-btn { position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; display: flex; align-items: center; }
        .auth-eye-btn:hover { color: var(--text-primary); }
        .auth-submit-btn { width: 100%; gap: 0.5rem; }
        .auth-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-link { color: var(--accent); font-weight: 500; }
        .success-state { text-align: center; }
        .success-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(48, 209, 88, 0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
        .success-icon { width: 28px; height: 28px; color: #30d158; }
        .success-state h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
        .success-state p { font-size: 0.9rem; color: var(--text-secondary); max-width: none; line-height: 1.55; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
