'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LayoutDashboard, UserCheck, Star } from 'lucide-react';

const STAFF_ROLES = [
  'Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
  'Finance Manager', 'Marketing Manager', 'Content Manager',
  'Support Agent', 'Promoter', 'Venue Manager',
];

interface PortalLinksProps {
  onClick?: () => void;
}

export const PortalLinks: React.FC<PortalLinksProps> = ({ onClick }) => {
  const { profile, loading } = useAuth();

  if (loading || !profile) return null;

  if (STAFF_ROLES.includes(profile.role)) {
    return (
      <Link href="/dashboard" className="nav-portal-link" onClick={onClick}>
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  if (profile.role === 'Client') {
    return (
      <Link href="/portal/client" className="nav-portal-link" onClick={onClick}>
        <UserCheck className="w-4 h-4" />
        <span>My Portal</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  if (profile.role === 'Artist') {
    return (
      <Link href="/portal/artist" className="nav-portal-link" onClick={onClick}>
        <Star className="w-4 h-4" />
        <span>Artist Hub</span>
        <style jsx>{portalLinkStyle}</style>
      </Link>
    );
  }

  return null;
};

const portalLinkStyle = `
  .nav-portal-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent);
    border: 1.5px solid rgba(212, 175, 55, 0.22);
    padding: 0.48rem 0.95rem;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    background: rgba(212, 175, 55, 0.04);
    letter-spacing: 0.01em;
    text-decoration: none;
  }
  .nav-portal-link:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: var(--accent);
    transform: translateY(-1px);
    opacity: 1;
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

export default PortalLinks;
