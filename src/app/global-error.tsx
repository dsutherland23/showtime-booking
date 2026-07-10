'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: '#07050e', color: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,69,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Something went wrong</h1>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem', maxWidth: '40ch', margin: '0 auto 1.5rem' }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{ background: 'linear-gradient(135deg, #f5d061 0%, #d4af37 100%)', color: '#07050e', border: 'none', borderRadius: '980px', padding: '0.65rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem' }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#f5f5f7', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '980px', padding: '0.65rem 1.5rem', fontSize: '0.9375rem', textDecoration: 'none' }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
