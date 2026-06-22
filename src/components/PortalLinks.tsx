'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LayoutDashboard, UserCheck, Star } from 'lucide-react';

const portalLinkStyle = `
  .nav-portal-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--gold-primary);
    border: 1.5px solid rgba(0, 113, 227, 0.22);
    padding: 0.48rem 0.95rem;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    background: rgba(0, 113, 227, 0.04);
    letter-spacing: 0.01em;
    text-decoration: none;
  }
  .nav-portal-link:hover {
    background: var(--gold-light);
    border-color: var(--gold-primary);
    color: var(--gold-dark);
    transform: translateY(-1px);
  }
  @media (max-width: 480px) {
    .nav-portal-link span {
      display: none;
    }
    .nav-portal-link {
      padding: 0.48rem;
      aspect-ratio: 1;
      justify-content: center;
    }
  }
`;

interface PortalLinksProps {
  onClick?: () => void;
}

export const PortalLinks: React.FC<PortalLinksProps> = ({ onClick }) => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'Super Admin' || user.role === 'Booking Agent') {
    return (
      <Link href="/dashboard" className="nav-portal-link" onClick={onClick}>
        <LayoutDashboard className="w-4 h-4" />
        <span>Agent CRM</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  if (user.role === 'Client') {
    return (
      <Link href="/portal/client" className="nav-portal-link" onClick={onClick}>
        <UserCheck className="w-4 h-4" />
        <span>Client Hub</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  if (user.role === 'Artist' || user.role === 'Artist Manager') {
    return (
      <Link href="/portal/artist" className="nav-portal-link" onClick={onClick}>
        <Star className="w-4 h-4" />
        <span>Artist Portal</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  return null;
};

export default PortalLinks;
