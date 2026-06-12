'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, ChevronDown, User, Star, Briefcase, FileText, Zap } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, usersList, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin':    return <Shield className="w-4 h-4" />;
      case 'Booking Agent':  return <Briefcase className="w-4 h-4" />;
      case 'Artist Manager': return <Star className="w-4 h-4" />;
      case 'Artist':         return <User className="w-4 h-4" />;
      case 'Client':         return <FileText className="w-4 h-4" />;
      default:               return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin':    return '#f59e0b';
      case 'Booking Agent':  return '#a855f7';
      case 'Artist Manager': return '#3b82f6';
      case 'Artist':         return '#10b981';
      case 'Client':         return '#ec4899';
      default:               return '#94a3b8';
    }
  };

  return (
    <div className="role-switcher-container">
      <button
        className="role-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch User Role"
        aria-expanded={isOpen}
      >
        <span className="trigger-icon-dot" style={{ background: getRoleColor(user.role) }} />
        <span className="trigger-icon" style={{ color: getRoleColor(user.role) }}>
          {getRoleIcon(user.role)}
        </span>
        <span className="trigger-label">
          <span className="trigger-name">{user.first_name}</span>
          <span className="trigger-role">{user.role}</span>
        </span>
        <ChevronDown className={`trigger-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="role-switcher-dropdown">
          <div className="dropdown-header">
            <Zap className="dropdown-header-icon" />
            <div>
              <h4>Simulation Panel</h4>
              <p>Switch identity to test different roles &amp; portals</p>
            </div>
          </div>
          <div className="dropdown-list">
            {usersList.map((u) => (
              <button
                key={u.id}
                className={`dropdown-item ${u.id === user.id ? 'active' : ''}`}
                onClick={async () => {
                  await switchUser(u.id);
                  setIsOpen(false);
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              >
                <span className="item-icon" style={{ color: getRoleColor(u.role), background: `${getRoleColor(u.role)}20` }}>
                  {getRoleIcon(u.role)}
                </span>
                <div className="item-text-col">
                  <span className="item-name">{u.first_name} {u.last_name}</span>
                  <span className="item-role">{u.role}</span>
                </div>
                {u.id === user.id && <span className="item-active-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .role-switcher-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: var(--font-body);
        }

        .role-switcher-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px 10px 12px;
          border-radius: 999px;
          cursor: pointer;
          color: #ffffff;
          transition: all var(--transition-normal);
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(13, 6, 20, 0.9);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07);
          white-space: nowrap;
        }

        .role-switcher-trigger:hover {
          background: rgba(13, 6, 20, 0.97);
          border-color: rgba(168, 85, 247, 0.45);
          box-shadow: 0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(168,85,247,0.18);
        }

        .trigger-icon-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulse-dot 2.4s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.8); }
        }

        .trigger-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .trigger-label {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          gap: 1px;
        }

        .trigger-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ffffff;
        }

        .trigger-role {
          font-size: 0.63rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .trigger-chevron {
          width: 14px;
          height: 14px;
          color: rgba(255,255,255,0.35);
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        .trigger-chevron.open { transform: rotate(180deg); }

        .role-switcher-dropdown {
          position: absolute;
          bottom: calc(100% + 12px);
          right: 0;
          width: 308px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.09);
          overflow: hidden;
          animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(10, 5, 20, 0.96);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          box-shadow: 0 28px 72px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
        }

        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .dropdown-header {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .dropdown-header-icon {
          width: 16px;
          height: 16px;
          color: #a855f7;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .dropdown-header h4 {
          font-family: var(--font-body);
          font-size: 0.84rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 3px;
        }

        .dropdown-header p {
          font-size: 0.69rem;
          color: rgba(255,255,255,0.35);
          line-height: 1.4;
          max-width: none;
        }

        .dropdown-list {
          max-height: 320px;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255,255,255,0.7);
          text-align: left;
          cursor: pointer;
          border-radius: 12px;
          transition: all var(--transition-fast);
          position: relative;
        }

        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
          color: #ffffff;
        }

        .dropdown-item.active {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.2);
          color: #ffffff;
        }

        .item-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-text-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #ffffff;
          display: block;
        }

        .item-role {
          font-size: 0.66rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
          display: block;
        }

        .item-active-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.7);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
