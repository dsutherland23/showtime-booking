'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { db, SEED_USERS } from '@/utils/db';
import GoogleSignInButton, { isGoogleSignInConfigured, signInWithVerifiedGoogle, VerifiedGoogleProfile } from '@/components/auth/GoogleSignInButton';
import { Eye, EyeOff, LogIn, AlertCircle, Sparkles, Loader2, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const verified = searchParams.get('verified');
  const isAdminLogin = searchParams.get('admin') === '1' || redirect.includes('/dashboard') || redirect.includes('/admin');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);
  const { switchUser, profile, isStaff } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // Called only after /api/auth/google has verified the Google ID token.
  const handleGoogleVerified = async (profile: VerifiedGoogleProfile) => {
    setError('');
    // Google sign-in strictly defaults to Client for new accounts
    const user = await signInWithVerifiedGoogle(profile, 'Client');
    if (switchUser) await switchUser(user.id);

    const staffRoles = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
      'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent',
      'Promoter', 'Venue Manager'];

    // Strict rule: No one may access admin/dashboard via Google sign-in unless pre-assigned staff
    if (!staffRoles.includes(user.role)) {
      window.location.href = user.role === 'Artist' ? '/portal/artist' : '/portal/client';
      return;
    }

    const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') && redirect !== '/' ? redirect : '/dashboard';
    window.location.href = safeRedirect;
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          if (profile && !isStaff && (redirect.startsWith('/dashboard') || redirect.startsWith('/admin'))) {
            router.push(profile.role === 'Artist' ? '/portal/artist' : '/portal/client');
          } else {
            router.push(redirect);
          }
        }
      });
    } else if (profile && isStaff && redirect.startsWith('/dashboard')) {
      router.push('/dashboard');
    }
  }, [supabase, router, redirect, profile, isStaff]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimited) return;

    setError('');
    setLoading(true);

    try {
      if (supabase) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          const isSeedStaff = SEED_USERS.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
          if (!isSeedStaff) {
            if (signInError.message.includes('rate limit')) {
              setRateLimited(true);
              setError('Too many login attempts. Please wait a few minutes and try again.');
              setTimeout(() => setRateLimited(false), 60000);
            } else if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid_credentials')) {
              setError('Incorrect email or password. Please check your credentials and try again.');
            } else if (signInError.message.includes('Email not confirmed')) {
              setError('Please verify your email address before logging in. Check your inbox for a verification link.');
            } else {
              setError('An error occurred during login. Please try again.');
            }
            return;
          }
          // Seed admin/staff fallback if not yet provisioned in Supabase auth
        } else if (data?.user) {
          let role = '';
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();
            if (profile?.role) role = profile.role;
          } catch {}

          if (!role) {
            try {
              const { data: userRow } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();
              if (userRow?.role) role = userRow.role;
            } catch {}
          }

          if (!role) {
            role = (data.user.user_metadata?.role as string) || (data.user.app_metadata?.role as string) || '';
          }

          const trimmedEmail = email.trim().toLowerCase();
          if (!role) {
            const seed = SEED_USERS.find(u => u.email.toLowerCase() === trimmedEmail);
            if (seed) role = seed.role;
            else if (trimmedEmail === 'admin@showtimeservices.com' || trimmedEmail.includes('admin@')) {
              role = 'Super Admin';
            }
          }

          localStorage.setItem('st_active_user_id', data.user.id);

          const staffRoles = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
            'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent',
            'Promoter', 'Venue Manager'];

          if (staffRoles.includes(role)) {
            const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') && redirect !== '/' ? redirect : '/dashboard';
            window.location.href = safeRedirect;
          } else if (role === 'Artist') {
            window.location.href = '/portal/artist';
          } else {
            window.location.href = '/portal/client';
          }
          return;
        }
      }

      // Cloudflare D1 / Local Auth mode
      const trimmedEmail = email.trim().toLowerCase();
      const dbUsers = await db.getUsers();
      const users = dbUsers && dbUsers.length > 0 ? dbUsers : SEED_USERS;
      const matched = users.find(u => u.email.toLowerCase() === trimmedEmail)
        || SEED_USERS.find(u => u.email.toLowerCase() === trimmedEmail);

      if (!matched) {
        setError('No account found with this email. Please check your credentials or register a new account.');
        setLoading(false);
        return;
      }

      if (matched.status !== 'Active') {
        setError(`This account is ${matched.status.toLowerCase()}. Please contact Showtime support.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('st_active_user_id', matched.id);
      if (switchUser) {
        await switchUser(matched.id);
      }

      const staffRoles = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
        'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent',
        'Promoter', 'Venue Manager'];

      if (staffRoles.includes(matched.role)) {
        const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') && redirect !== '/' ? redirect : '/dashboard';
        window.location.href = safeRedirect;
      } else if (matched.role === 'Artist') {
        window.location.href = '/portal/artist';
      } else {
        window.location.href = '/portal/client';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Centered Showtime Logo */}
        <div className="auth-logo-center-wrap">
          <Link href="/" className="auth-logo-link" title="Showtime Global Services">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
          </Link>
        </div>

        <div className="auth-header">
          {isAdminLogin ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20, marginBottom: '0.75rem' }}>
                <ShieldCheck style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Executive Admin Portal
                </span>
              </div>
              <h1 className="auth-title">Administrative Login</h1>
              <p className="auth-subtitle">Authorized agency management &amp; assigned staff only</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your Showtime account</p>
            </>
          )}
        </div>

        {/* Social Authentication — strictly disabled for admin login per security policy */}
        {!isAdminLogin && (
          <>
            <div className="auth-social-group">
              <GoogleSignInButton
                text="signin_with"
                onVerified={handleGoogleVerified}
                onError={(msg) => setError(msg)}
              />
            </div>

            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>
          </>
        )}

        {verified && (
          <div className="auth-alert auth-alert-success" role="alert">
            <Sparkles className="alert-icon" />
            <span>Email verified successfully! You can now sign in.</span>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <AlertCircle className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          <div className="field-group">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              aria-label="Email address"
              disabled={loading}
            />
          </div>

          <div className="field-group">
            <div className="auth-label-row">
              <label htmlFor="login-password">Password</label>
              <Link href="/auth/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-label="Password"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading || rateLimited || !email || !password}
            aria-busy={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {isAdminLogin ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
              Protected Showtime Executive Portal &bull; Unauthorized access is strictly logged.
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="auth-link">
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: var(--bg-primary);
          background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.08), transparent);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 2.5rem 2rem;
          box-shadow: var(--shadow-xl);
        }
        .auth-logo-center-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin: 0 auto 1.75rem auto;
          text-align: center;
        }
        .auth-logo-link {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
          text-decoration: none;
        }
        .auth-logo {
          height: 38px;
          width: auto;
          max-width: 240px;
          object-fit: contain;
          margin: 0 auto;
          display: block;
          filter: brightness(0) invert(1);
          transition: transform 0.2s ease;
        }
        .auth-logo:hover {
          transform: scale(1.03);
        }
        .auth-social-group {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1.25rem;
        }
        .auth-social-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md, 8px);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .auth-social-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }
        .auth-social-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 0.5rem 0 1.25rem;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .auth-divider span {
          padding: 0 0.85rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .auth-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          max-width: none;
          margin: 0;
        }
        .auth-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          line-height: 1.45;
          margin-bottom: 1.25rem;
        }
        .auth-alert-error {
          background: rgba(255, 69, 58, 0.1);
          border: 1px solid rgba(255, 69, 58, 0.2);
          color: #ff453a;
        }
        .auth-alert-success {
          background: rgba(48, 209, 88, 0.1);
          border: 1px solid rgba(48, 209, 88, 0.2);
          color: #30d158;
        }
        .alert-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .auth-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .auth-forgot-link {
          font-size: 0.8125rem;
          color: var(--accent);
          opacity: 0.9;
        }
        .auth-forgot-link:hover { opacity: 1; }
        .auth-password-wrap {
          position: relative;
        }
        .auth-password-wrap input {
          padding-right: 2.75rem;
        }
        .auth-eye-btn {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast);
        }
        .auth-eye-btn:hover { color: var(--text-primary); }
        .auth-submit-btn {
          width: 100%;
          margin-top: 0.35rem;
          gap: 0.5rem;
        }
        .auth-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .auth-footer-text {
          text-align: center;
          margin-top: 1.5rem;
        }
        .auth-footer-text p {
          font-size: 0.875rem;
          color: var(--text-muted);
          max-width: none;
          margin: 0;
        }
        .auth-link {
          color: var(--accent);
          font-weight: 500;
        }
        .auth-link:hover { opacity: 0.85; }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
