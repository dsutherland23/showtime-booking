'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminRedirect() {
  const { user, isStaff, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && (isAdmin || isStaff)) {
      window.location.replace('/dashboard');
    } else {
      window.location.replace('/auth/login?redirect=/dashboard&admin=1');
    }
  }, [user, isStaff, isAdmin, loading]);

  // Fallback timeout ensures prompt navigation even if auth state resolution is delayed
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.replace('/auth/login?redirect=/dashboard&admin=1');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        color: 'var(--text-primary)',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
          boxShadow: '0 0 24px rgba(212,175,55,0.2)',
        }}
      >
        <ShieldCheck style={{ width: 30, height: 30 }} />
      </div>
      <Loader2
        style={{
          width: 32,
          height: 32,
          color: 'var(--accent)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Executive Admin Portal
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Directing to secure administrative authentication…
        </p>
      </div>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/auth/login?redirect=/dashboard&admin=1" />
      </noscript>
    </div>
  );
}
