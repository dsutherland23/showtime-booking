'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--text-primary)',
        background: 'var(--bg-primary)',
      }}
    >
      <Loader2
        style={{
          width: 36,
          height: 36,
          color: 'var(--accent)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        Redirecting to Showtime Admin Dashboard…
      </p>
    </div>
  );
}
