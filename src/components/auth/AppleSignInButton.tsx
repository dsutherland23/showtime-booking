'use client';

import React, { useState } from 'react';
import { db } from '@/utils/db';
import { auth, appleProvider } from '@/lib/firebase/client';
import { signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export interface VerifiedAppleProfile {
  sub: string;
  email: string;
  name: string;
}

/** Find the Showtime account for a verified Apple email, or create one. */
export async function signInWithVerifiedApple(
  profile: VerifiedAppleProfile,
  roleForNewAccount: 'Client' | 'Artist'
) {
  const users = await db.getUsers();
  let user = users.find(u => u.email.toLowerCase() === profile.email.toLowerCase());

  if (user && user.status !== 'Active') {
    throw new Error(`This account is ${user.status.toLowerCase()}. Please contact Showtime support.`);
  }

  if (!user) {
    const nameParts = profile.name ? profile.name.split(' ') : ['Apple', 'User'];
    user = await db.createUser({
      first_name: nameParts[0] || 'Apple',
      last_name: nameParts.slice(1).join(' ') || 'User',
      email: profile.email,
      role: roleForNewAccount,
      status: 'Active',
    });
  }

  localStorage.setItem('st_active_user_id', user.id);
  localStorage.setItem('st_auth_provider', 'apple');
  return user;
}

interface AppleSignInButtonProps {
  text: 'signin_with' | 'signup_with' | 'continue_with';
  onVerified: (profile: VerifiedAppleProfile) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function AppleSignInButton({ text, onVerified, onError }: AppleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      if (!user.email) {
        throw new Error('Apple did not provide an email address.');
      }

      const profile: VerifiedAppleProfile = {
        sub: user.uid,
        email: user.email.toLowerCase(),
        name: user.displayName || 'Apple User',
      };

      await onVerified(profile);
    } catch (err: unknown) {
      console.error('Apple Sign-In Error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      if (
        errorObj.code === 'auth/operation-not-allowed' || 
        errorObj.code === 'auth/configuration-not-found' ||
        errorObj.code === 'auth/admin-restricted-operation'
      ) {
        onError('Apple Sign-In requires Apple Developer Services ID setup in Firebase Console. Please sign in with Google or Email.');
        return;
      }
      onError(errorObj.message || 'Apple sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const label = text === 'signup_with' ? 'Sign up with Apple' : 'Continue with Apple';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        className="auth-social-btn"
        onClick={handleAppleSignIn}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.98.6-2.62 1.35-.57.65-.97 1.7-.85 2.73 1 .08 1.92-.48 2.54-1.23z" />
          </svg>
        )}
        <span>{loading ? 'Connecting with Apple…' : label}</span>
      </button>
    </div>
  );
}
