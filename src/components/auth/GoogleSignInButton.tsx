'use client';

import React, { useState } from 'react';
import { db } from '@/utils/db';
import { auth, googleProvider, getSafeAuth } from '@/lib/firebase/client';
import { signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export const isGoogleSignInConfigured = true;

export interface VerifiedGoogleProfile {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  name: string;
  picture: string;
}

/** Find the Showtime account for a verified Google email, or create one. */
export async function signInWithVerifiedGoogle(
  profile: VerifiedGoogleProfile,
  roleForNewAccount: 'Client' | 'Artist'
) {
  const users = await db.getUsers();
  let user = users.find(u => u.email.toLowerCase() === profile.email.toLowerCase());

  if (user && user.status !== 'Active') {
    throw new Error(`This account is ${user.status.toLowerCase()}. Please contact Showtime support.`);
  }

  if (!user) {
    const fallbackFirst = profile.given_name || profile.name.split(' ')[0] || profile.email.split('@')[0];
    user = await db.createUser({
      first_name: fallbackFirst,
      last_name: profile.family_name || '',
      email: profile.email,
      avatar_url: profile.picture || undefined,
      role: roleForNewAccount,
      status: 'Active',
    });
  }

  localStorage.setItem('st_active_user_id', user.id);
  localStorage.setItem('st_auth_provider', 'google');
  return user;
}

interface GoogleSignInButtonProps {
  text: 'signin_with' | 'signup_with' | 'continue_with';
  onVerified: (profile: VerifiedGoogleProfile) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function GoogleSignInButton({ text, onVerified, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const activeAuth = auth || getSafeAuth();
      const result = await signInWithPopup(activeAuth, googleProvider);
      const user = result.user;
      if (!user.email) {
        throw new Error('Google did not return an email address.');
      }
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const givenName = nameParts[0] || '';
      const familyName = nameParts.slice(1).join(' ') || '';

      const profile: VerifiedGoogleProfile = {
        sub: user.uid,
        email: user.email.toLowerCase(),
        name: displayName,
        given_name: givenName,
        family_name: familyName,
        picture: user.photoURL || '',
      };

      await onVerified(profile);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-closed-by-user') {
        console.warn('Google sign-in popup was dismissed by user.');
        setLoading(false);
        return;
      }
      console.error('Google Sign-In Error:', err);
      onError(errorObj.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const label = text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        className="auth-social-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        )}
        <span>{loading ? 'Connecting with Google…' : label}</span>
      </button>
    </div>
  );
}
