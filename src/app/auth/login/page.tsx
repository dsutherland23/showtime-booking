'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseReady } from '@/lib/supabase/client';
import { Eye, EyeOff, LogIn, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const verified = searchParams.get('verified');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirect);
    });
  }, [supabase, router, redirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimited) return;
    if (!supabase) { setError('Authentication is not configured yet.'); return; }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          setRateLimited(true);
          setError('Too many login attempts. Please wait a few minutes and try again.');
          setTimeout(() => setRateLimited(false), 60000);
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setError('Incorrect email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in. Check your inbox for a verification link.');
        } else {
          setError('An error occurred during login. Please try again.');
        }
        return;
      }

      if (data?.user) {
        // Route based on role stored in profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || '';
        const staffRoles = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
          'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent',
          'Promoter', 'Venue Manager'];

        if (staffRoles.includes(role) || redirect.startsWith('/dashboard') || redirect.startsWith('/admin')) {
          router.push('/dashboard');
        } else if (role === 'Artist') {
          router.push('/portal/artist');
        } else if (role === 'Client') {
          router.push('/portal/client');
        } else {
          router.push(redirect !== '/' ? redirect : '/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <Link href="/" className="auth-logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Showtime Services" className="auth-logo" />
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your Showtime account</p>
        </div>

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
              placeholder="you@example.com"
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
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="auth-link">
              Create account
            </Link>
          </p>
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
        .auth-logo-link {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
          opacity: 1;
        }
        .auth-logo {
          height: 28px;
          width: auto;
          filter: brightness(0) invert(1);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 1.75rem;
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
