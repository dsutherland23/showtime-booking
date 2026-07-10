import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ fontSize: '5rem', fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--accent)', margin: '0 0 0.5rem', lineHeight: 1 }}>
          404
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '38ch', margin: '0 auto 2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/talent" className="btn btn-secondary">
            Browse Talent
          </Link>
        </div>
      </div>
    </div>
  );
}
