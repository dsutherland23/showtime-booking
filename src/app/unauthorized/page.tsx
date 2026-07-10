'use client';

import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const { profile } = useAuth();

  const getPortalLink = () => {
    if (!profile) return { href: '/auth/login', label: 'Sign In' };
    if (profile.role === 'Artist') return { href: '/portal/artist', label: 'Artist Hub' };
    if (profile.role === 'Client') return { href: '/portal/client', label: 'Client Portal' };
    return { href: '/', label: 'Home' };
  };

  const portalLink = getPortalLink();

  return (
    <div className="unauth-page">
      <div className="unauth-card">
        <div className="unauth-icon-wrap">
          <ShieldX className="unauth-icon" />
        </div>
        <h1 className="unauth-title">Access Restricted</h1>
        <p className="unauth-message">
          You don&apos;t have permission to access this page.
          {profile ? ` Your current role (${profile.role}) does not have the required permissions.` : ' Please sign in to continue.'}
        </p>
        <div className="unauth-actions">
          <Link href={portalLink.href} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            {portalLink.label}
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .unauth-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
        }
        .unauth-card {
          text-align: center;
          max-width: 480px;
        }
        .unauth-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255, 69, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .unauth-icon {
          width: 36px;
          height: 36px;
          color: #ff453a;
        }
        .unauth-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }
        .unauth-message {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 38ch;
          margin: 0 auto 2rem;
        }
        .unauth-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
