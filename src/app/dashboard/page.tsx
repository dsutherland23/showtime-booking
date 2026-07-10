'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  db,
  Lead, Booking, Task, Notification, Invoice, Artist, Venue, Customer,
  User, TicketTier, PromoCode, MarketingCampaign, AdPlacement,
  WebsiteSection, Integration
} from '@/utils/db';
import {
  LayoutDashboard, Calendar, Music, MapPin, Users, Ticket, Receipt,
  DollarSign, Megaphone, Radio, FileText, ShieldCheck, Cable, Settings,
  Search, Bell, ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Eye,
  X, AlertCircle, LogOut, RefreshCw, TrendingUp,
  TrendingDown, Activity, Star, Clock, CheckCircle, XCircle,
  AlertTriangle, MoreHorizontal, Shield,
  CreditCard, Globe, Link2,
  Mail, Phone, Tag, Package,
  Save, Loader2, Menu, Upload
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavSection = 'Core Operations' | 'Financial' | 'Growth' | 'Website' | 'System';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  section: NavSection;
  permission?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard, section: 'Core Operations', permission: 'view_dashboard' },
  { id: 'bookings',     label: 'Bookings',      icon: Calendar,        section: 'Core Operations', permission: 'manage_bookings' },
  { id: 'artists',      label: 'Artists',       icon: Music,           section: 'Core Operations', permission: 'view_artists' },
  { id: 'events',       label: 'Events',        icon: Star,            section: 'Core Operations', permission: 'view_events' },
  { id: 'venues',       label: 'Venues',        icon: MapPin,          section: 'Core Operations', permission: 'manage_venues' },
  { id: 'customers',    label: 'Customers',     icon: Users,           section: 'Core Operations', permission: 'view_customers' },
  { id: 'finance',      label: 'Finance',       icon: DollarSign,      section: 'Financial',       permission: 'view_finance' },
  { id: 'orders',       label: 'Orders',        icon: Receipt,         section: 'Financial',       permission: 'view_orders' },
  { id: 'tickets',      label: 'Tickets',       icon: Ticket,          section: 'Financial',       permission: 'view_tickets' },
  { id: 'marketing',    label: 'Marketing',     icon: Megaphone,       section: 'Growth',          permission: 'manage_marketing' },
  { id: 'advertising',  label: 'Advertising',   icon: Radio,           section: 'Growth',          permission: 'manage_advertising' },
  { id: 'content',      label: 'Content CMS',   icon: FileText,        section: 'Website',         permission: 'manage_content' },
  { id: 'staff',        label: 'Staff & Roles', icon: ShieldCheck,     section: 'System',          adminOnly: true },
  { id: 'integrations', label: 'Integrations',  icon: Cable,           section: 'System',          adminOnly: true },
  { id: 'settings',     label: 'Settings',      icon: Settings,        section: 'System',          adminOnly: true },
];

const NAV_SECTIONS: { id: NavSection; label: string }[] = [
  { id: 'Core Operations', label: 'Core Operations' },
  { id: 'Financial',       label: 'Financial' },
  { id: 'Growth',          label: 'Growth' },
  { id: 'Website',         label: 'Website' },
  { id: 'System',          label: 'System' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function statusColor(status: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    Active:               { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Available:            { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Confirmed:            { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Completed:            { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Paid:                 { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Connected:            { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Inquiry:              { bg: 'rgba(100,210,255,0.12)', color: '#64d2ff' },
    'Proposal Generated': { bg: 'rgba(100,210,255,0.12)', color: '#64d2ff' },
    'Lead Received':      { bg: 'rgba(100,210,255,0.12)', color: '#64d2ff' },
    Qualified:            { bg: 'rgba(100,210,255,0.12)', color: '#64d2ff' },
    'In Progress':        { bg: 'rgba(100,210,255,0.12)', color: '#64d2ff' },
    'Contract Sent':      { bg: 'rgba(212,175,55,0.12)',  color: '#d4af37' },
    'Deposit Paid':       { bg: 'rgba(212,175,55,0.12)',  color: '#d4af37' },
    'Proposal Sent':      { bg: 'rgba(212,175,55,0.12)',  color: '#d4af37' },
    Negotiation:          { bg: 'rgba(212,175,55,0.12)',  color: '#d4af37' },
    'Deposit Received':   { bg: 'rgba(48,209,88,0.12)',   color: '#30d158' },
    Unpaid:               { bg: 'rgba(255,159,10,0.12)',  color: '#ff9f0a' },
    'Partially Paid':     { bg: 'rgba(255,159,10,0.12)',  color: '#ff9f0a' },
    Pending:              { bg: 'rgba(255,159,10,0.12)',  color: '#ff9f0a' },
    Overdue:              { bg: 'rgba(255,69,58,0.12)',   color: '#ff453a' },
    Cancelled:            { bg: 'rgba(255,69,58,0.12)',   color: '#ff453a' },
    'On Hold':            { bg: 'rgba(255,69,58,0.12)',   color: '#ff453a' },
    Suspended:            { bg: 'rgba(255,69,58,0.12)',   color: '#ff453a' },
    Disconnected:         { bg: 'rgba(255,69,58,0.12)',   color: '#ff453a' },
    Inactive:             { bg: 'rgba(113,113,122,0.12)', color: '#71717a' },
    'On Tour':            { bg: 'rgba(191,90,242,0.12)',  color: '#bf5af2' },
    Booked:               { bg: 'rgba(191,90,242,0.12)',  color: '#bf5af2' },
  };
  return map[status] ?? { bg: 'rgba(113,113,122,0.12)', color: '#71717a' };
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { bg, color } = statusColor(status);
  return (
    <span style={{
      background: bg, color,
      fontSize: '0.72rem', fontWeight: 600,
      padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function StatCard({
  label, value, sub, icon: Icon, trend, trendUp,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: string; trendUp?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.4rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        transition: 'all 0.22s ease', cursor: 'default',
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(212,175,55,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color="var(--accent)" />
        </span>
      </div>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
          {trend && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: '0.72rem', fontWeight: 600,
              color: trendUp ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{trend}
            </span>
          )}
          {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function ABtn({
  onClick, children, variant = 'primary', size = 'md', disabled = false,
}: {
  onClick?: () => void; children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md'; disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const s: Record<string, React.CSSProperties> = {
    primary: {
      background: hov ? 'linear-gradient(135deg,#ffde7a,#e5bd44)' : 'var(--accent-gradient)',
      color: '#07050e', fontWeight: 600,
      boxShadow: hov ? '0 6px 20px rgba(212,175,55,0.4)' : '0 4px 14px rgba(212,175,55,0.25)',
    },
    secondary: {
      background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
      color: hov ? 'var(--accent)' : 'var(--text-primary)',
      border: `1px solid ${hov ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`,
    },
    ghost: {
      background: hov ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: hov ? 'var(--text-primary)' : 'var(--text-secondary)',
    },
    danger: {
      background: hov ? 'rgba(255,69,58,0.2)' : 'rgba(255,69,58,0.1)',
      color: '#ff453a',
      border: `1px solid ${hov ? 'rgba(255,69,58,0.5)' : 'rgba(255,69,58,0.2)'}`,
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: size === 'sm' ? '0.35rem 0.8rem' : '0.5rem 1rem',
        fontSize: size === 'sm' ? '0.78rem' : '0.85rem',
        borderRadius: 8, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        fontFamily: 'var(--font-body)',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: '-0.01em',
        ...s[variant],
      }}
    >
      {children}
    </button>
  );
}

function Empty({ icon: Icon, msg }: { icon: React.ElementType; msg: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', gap: '0.75rem' }}>
      <Icon size={36} style={{ opacity: 0.3, color: 'var(--text-muted)' }} />
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280, margin: 0 }}>{msg}</p>
    </div>
  );
}

function Tbl({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>{children}</table>
    </div>
  );
}

function TH({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
        {cols.map(c => (
          <th key={c} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TR({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: hov ? 'rgba(255,255,255,0.025)' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </tr>
  );
}

function TD({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: muted ? 'var(--text-muted)' : 'var(--text-primary)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
      {children}
    </td>
  );
}

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '0.55rem 0.85rem',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s',
};

function FInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...iStyle, borderColor: f ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
    />
  );
}

function FTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [f, setF] = useState(false);
  return (
    <textarea
      rows={rows} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...iStyle, resize: 'vertical', borderColor: f ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
    />
  );
}

function FSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...iStyle, borderColor: f ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function FImageUpload({ value, onChange, label, aspect = 'square' }: {
  value: string; onChange: (v: string) => void; label: string; aspect?: 'square' | 'wide';
}) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isBase64 = value?.startsWith('data:image/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
        <button 
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, fontWeight: 500 }}
        >
          {showUrlInput ? 'Switch to File Upload' : 'Link via Image URL'}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {showUrlInput ? (
        <FInput value={isBase64 ? '' : value} onChange={onChange} placeholder="https://..." />
      ) : (
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {value ? (
            <div style={{ 
              position: 'relative', 
              width: aspect === 'square' ? 52 : 92, 
              height: 52, 
              borderRadius: aspect === 'square' ? '50%' : 8, 
              overflow: 'hidden', 
              border: '2px solid rgba(212,175,55,0.3)', 
              background: 'rgba(255,255,255,0.04)',
              flexShrink: 0 
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                type="button" 
                onClick={handleClear}
                style={{ 
                  position: 'absolute', 
                  top: 2, 
                  right: 2, 
                  background: 'rgba(0,0,0,0.7)', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 16, 
                  height: 16, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  color: 'white',
                  padding: 0
                }}
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                height: 44,
                flexGrow: 1,
                border: '1px dashed rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <Upload size={13} /> Select Image File
            </button>
          )}
          {value && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isBase64 ? 'Local file selected' : 'URL linked'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

function FGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '0.9rem' }}>
      {children}
    </div>
  );
}

function FActions({ onCancel, saving, label = 'Save' }: { onCancel: () => void; saving?: boolean; label?: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
      <ABtn variant="ghost" onClick={onCancel}>Cancel</ABtn>
      <ABtn variant="primary" disabled={saving}>
        {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
        {saving ? 'Saving…' : label}
      </ABtn>
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 540 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: width, maxHeight: 'min(90vh, 100dvh - 2rem)', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', animation: 'scaleIn 0.2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '1.4rem' }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDlg({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.18s ease' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={20} color="#ff9f0a" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{title}</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <ABtn variant="ghost" onClick={onCancel} size="sm">Cancel</ABtn>
          <ABtn variant="danger" onClick={onConfirm} size="sm">Delete</ABtn>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1rem', left: '1rem', zIndex: 9999,
      maxWidth: 380, marginLeft: 'auto',
      background: type === 'success' ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
      border: `1px solid ${type === 'success' ? 'rgba(48,209,88,0.4)' : 'rgba(255,69,58,0.4)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1.1rem',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      color: type === 'success' ? '#30d158' : '#ff453a',
      fontSize: '0.875rem', fontWeight: 500,
      boxShadow: 'var(--shadow-lg)',
      animation: 'fadeInUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
      {message}
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', padding: '2rem' }}>
      <Shield size={48} color="var(--text-muted)" style={{ opacity: 0.35 }} />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Access Restricted</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320, margin: 0 }}>
        You don't have permission to view this section. Contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

// ─── Dashboard Overview ───────────────────────────────────────────────────────

function DashboardOverview({
  bookings, leads, invoices, artists, tasks, onNavigate,
}: {
  bookings: Booking[]; leads: Lead[]; invoices: Invoice[];
  artists: Artist[]; tasks: Task[]; onNavigate: (id: string) => void;
}) {
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((s, i) => s + i.balance_due, 0);
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const recentBookings = [...bookings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const urgentLeads = leads.filter(l => l.status === 'Lead Received' || l.status === 'Qualified').slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dash-stat-grid">
        <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} icon={DollarSign} trend="+12.4%" trendUp sub="vs last quarter" />
        <StatCard label="Confirmed Bookings" value={String(confirmedBookings)} icon={Calendar} trend="+3" trendUp sub="this month" />
        <StatCard label="Active Artists" value={String(artists.filter(a => a.availability_status === 'Active').length)} icon={Music} sub={`${artists.length} on roster`} />
        <StatCard label="Pending Revenue" value={fmtCurrency(pendingRevenue)} icon={CreditCard} sub="awaiting collection" />
        <StatCard label="Open Tasks" value={String(pendingTasks)} icon={CheckCircle} sub={`${tasks.length} total`} />
        <StatCard label="New Leads" value={String(urgentLeads.length)} icon={Activity} sub="require follow-up" />
      </div>

      <div className="dash-two-col">
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.2rem' }}>
          <SectionHead title="Recent Bookings" action={<ABtn variant="ghost" size="sm" onClick={() => onNavigate('bookings')}><Eye size={12} />View all</ABtn>} />
          {recentBookings.length === 0 ? <Empty icon={Calendar} msg="No bookings yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderRadius: 8, background: 'rgba(255,255,255,0.025)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.event_title}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{b.artist_name} · {fmtDate(b.event_date)}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.2rem' }}>
          <SectionHead title="Leads Needing Attention" action={<ABtn variant="ghost" size="sm" onClick={() => onNavigate('bookings')}><Eye size={12} />View all</ABtn>} />
          {urgentLeads.length === 0 ? <Empty icon={Activity} msg="No pending leads" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {urgentLeads.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderRadius: 8, background: 'rgba(255,255,255,0.025)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.contact_name}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{l.company_name || l.country} · {fmtCurrency(l.budget)}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.2rem' }}>
        <SectionHead title="Open Tasks" />
        {pendingTasks === 0 ? <Empty icon={CheckCircle} msg="All tasks complete!" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.8rem', borderRadius: 8, background: 'rgba(255,255,255,0.025)' }}>
                <Clock size={13} color="var(--text-muted)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>{t.title}</span>
                  {t.due_date && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Due {fmtDate(t.due_date)}</span>}
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bookings Section ─────────────────────────────────────────────────────────

function BookingsSection({
  bookings, leads, artists, onRefresh, showToast,
}: {
  bookings: Booking[]; leads: Lead[]; artists: Artist[];
  onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [tab, setTab] = useState<'leads' | 'pipeline'>('leads');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const STATUSES: Lead['status'][] = ['Lead Received', 'Qualified', 'Proposal Sent', 'Negotiation', 'Contract Sent', 'Deposit Received', 'Confirmed', 'Completed'];
  const blankForm = { contact_name: '', company_name: '', email: '', phone: '', country: 'Jamaica', budget: '50000', preferred_date: new Date().toISOString().split('T')[0], artist_id: '', details: '', status: 'Lead Received' as Lead['status'] };
  const [form, setForm] = useState(blankForm);

  const openCreate = () => { setEditLead(null); setForm({ ...blankForm, artist_id: artists[0]?.id || '' }); setShowModal(true); };
  const openEdit = (l: Lead) => {
    setEditLead(l);
    setForm({ contact_name: l.contact_name, company_name: l.company_name || '', email: l.email, phone: l.phone || '', country: l.country, budget: String(l.budget), preferred_date: l.preferred_date, artist_id: l.artist_id || '', details: l.details, status: l.status });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, budget: parseFloat(form.budget) || 0, source: 'Admin Portal' };
      if (editLead) await db.updateLead(editLead.id, data);
      else await db.createLead(data);
      setShowModal(false); onRefresh();
      showToast(editLead ? 'Lead updated.' : 'Lead created.', 'success');
    } catch { showToast('Failed to save lead.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteLead(id); onRefresh(); showToast('Lead removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filteredLeads = leads.filter(l =>
    l.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBookings = bookings.filter(b =>
    b.event_title.toLowerCase().includes(search.toLowerCase()) ||
    b.artist_name.toLowerCase().includes(search.toLowerCase()) ||
    b.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['leads', 'pipeline'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', background: tab === t ? 'rgba(212,175,55,0.15)' : 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t === 'leads' ? `Leads (${leads.length})` : `Pipeline (${bookings.length})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...iStyle, paddingLeft: 30, width: 200, fontSize: '0.82rem', height: 34 }} />
          </div>
          {tab === 'leads' && <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />New Lead</ABtn>}
        </div>
      </div>

      {tab === 'leads' ? (
        <Tbl>
          <TH cols={['Contact', 'Company', 'Status', 'Budget', 'Date', 'Artist', '']} />
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr><td colSpan={7}><Empty icon={Activity} msg="No leads found" /></td></tr>
            ) : filteredLeads.map(l => (
              <TR key={l.id}>
                <TD><div style={{ fontWeight: 500 }}>{l.contact_name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.email}</div></TD>
                <TD muted>{l.company_name || '—'}</TD>
                <TD><StatusBadge status={l.status} /></TD>
                <TD>{fmtCurrency(l.budget)}</TD>
                <TD muted>{fmtDate(l.preferred_date)}</TD>
                <TD muted>{l.artist_name || '—'}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <ABtn variant="ghost" size="sm" onClick={() => openEdit(l)}><Edit2 size={12} /></ABtn>
                    <ABtn variant="danger" size="sm" onClick={() => setConfirm(l.id)}><Trash2 size={12} /></ABtn>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Tbl>
      ) : (
        <Tbl>
          <TH cols={['Event', 'Artist', 'Client', 'Date', 'Venue', 'Amount', 'Status', '']} />
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={8}><Empty icon={Calendar} msg="No bookings found" /></td></tr>
            ) : filteredBookings.map(b => (
              <TR key={b.id}>
                <TD><div style={{ fontWeight: 500 }}>{b.event_title}</div></TD>
                <TD muted>{b.artist_name}</TD>
                <TD muted>{b.client_name}</TD>
                <TD muted>{fmtDate(b.event_date)}</TD>
                <TD muted>{b.event_venue}</TD>
                <TD>{fmtCurrency(b.total_amount)}</TD>
                <TD><StatusBadge status={b.status} /></TD>
                <TD><ABtn variant="ghost" size="sm"><MoreHorizontal size={13} /></ABtn></TD>
              </TR>
            ))}
          </tbody>
        </Tbl>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editLead ? 'Edit Lead' : 'New Lead'} width={580}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Contact Name"><FInput value={form.contact_name} onChange={v => setForm(f => ({ ...f, contact_name: v }))} placeholder="Full name" /></Field>
            <Field label="Company"><FInput value={form.company_name} onChange={v => setForm(f => ({ ...f, company_name: v }))} /></Field>
            <Field label="Email"><FInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" /></Field>
            <Field label="Phone"><FInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} /></Field>
            <Field label="Country"><FInput value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} /></Field>
            <Field label="Budget (USD)"><FInput value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} type="number" /></Field>
            <Field label="Preferred Date"><FInput value={form.preferred_date} onChange={v => setForm(f => ({ ...f, preferred_date: v }))} type="date" /></Field>
            <Field label="Status">
              <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Lead['status'] }))} options={STATUSES.map(s => ({ value: s, label: s }))} />
            </Field>
            <Field label="Artist">
              <FSelect value={form.artist_id} onChange={v => setForm(f => ({ ...f, artist_id: v }))} options={[{ value: '', label: 'Not assigned' }, ...artists.map(a => ({ value: a.id, label: a.stage_name }))]} />
            </Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Details / Notes"><FTextarea value={form.details} onChange={v => setForm(f => ({ ...f, details: v }))} rows={3} placeholder="Booking inquiry details…" /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Lead" message="This will permanently delete the lead." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Artists Section ──────────────────────────────────────────────────────────

function ArtistsSection({ artists, onRefresh, showToast }: {
  artists: Artist[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Artist | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const blank = { stage_name: '', legal_name: '', category: 'Reggae Artists', genre: '', bio: '', profile_image: '', cover_image: '', booking_status: 'Available' as Artist['booking_status'], availability_status: 'Active' as Artist['availability_status'], technical_rider: '', hospitality_rider: '', is_featured: false };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (a: Artist) => {
    setEditItem(a);
    setForm({ stage_name: a.stage_name, legal_name: a.legal_name, category: a.category, genre: a.genre, bio: a.bio, profile_image: a.profile_image, cover_image: a.cover_image, booking_status: a.booking_status, availability_status: a.availability_status, technical_rider: a.technical_rider || '', hospitality_rider: a.hospitality_rider || '', is_featured: a.is_featured || false });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateArtistProfile(editItem.id, form);
      else await db.createArtist(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Artist updated.' : 'Artist added.', 'success');
    } catch { showToast('Failed to save artist.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteArtist(id); onRefresh(); showToast('Artist removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filtered = artists.filter(a =>
    a.stage_name.toLowerCase().includes(search.toLowerCase()) ||
    a.genre.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artists…" style={{ ...iStyle, paddingLeft: 30, width: 220, fontSize: '0.82rem', height: 34 }} />
        </div>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />Add Artist</ABtn>
      </div>
      <Tbl>
        <TH cols={['Artist', 'Category', 'Genre', 'Booking Status', 'Availability', 'Featured', '']} />
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7}><Empty icon={Music} msg="No artists found" /></td></tr>
          ) : filtered.map(a => (
            <TR key={a.id}>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {a.stage_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.stage_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.legal_name}</div>
                  </div>
                </div>
              </TD>
              <TD muted>{a.category}</TD>
              <TD muted>{a.genre}</TD>
              <TD><StatusBadge status={a.booking_status} /></TD>
              <TD><StatusBadge status={a.availability_status} /></TD>
              <TD>
                {a.is_featured ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(212,175,55,0.15)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 600 }}>
                    ★ Spotlight
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No</span>
                )}
              </TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(a)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(a.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Artist' : 'Add Artist'} width={600}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Stage Name"><FInput value={form.stage_name} onChange={v => setForm(f => ({ ...f, stage_name: v }))} /></Field>
            <Field label="Legal Name"><FInput value={form.legal_name} onChange={v => setForm(f => ({ ...f, legal_name: v }))} /></Field>
            <Field label="Category">
              <FSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={['Reggae Artists', 'Dancehall Artists', 'DJs', 'Soca Artists', 'Afrobeats Artists', 'R&B Artists'].map(c => ({ value: c, label: c }))} />
            </Field>
            <Field label="Genre"><FInput value={form.genre} onChange={v => setForm(f => ({ ...f, genre: v }))} /></Field>
            <Field label="Booking Status">
              <FSelect value={form.booking_status} onChange={v => setForm(f => ({ ...f, booking_status: v as Artist['booking_status'] }))} options={['Available', 'Booked', 'On Tour', 'On Hold'].map(s => ({ value: s, label: s }))} />
            </Field>
            <Field label="Availability">
              <FSelect value={form.availability_status} onChange={v => setForm(f => ({ ...f, availability_status: v as Artist['availability_status'] }))} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
            </Field>
            <Field label="Featured Headliner">
              <FSelect value={form.is_featured ? 'Yes' : 'No'} onChange={v => setForm(f => ({ ...f, is_featured: v === 'Yes' }))} options={[{ value: 'Yes', label: 'Yes (Spotlight on Homepage)' }, { value: 'No', label: 'No' }]} />
            </Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Field label="Bio"><FTextarea value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} rows={3} /></Field>

            {/* Image fields with device upload + preview support */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <FImageUpload 
                label="Profile Image" 
                value={form.profile_image} 
                onChange={v => setForm(f => ({ ...f, profile_image: v }))} 
                aspect="square" 
              />
              <FImageUpload 
                label="Cover Image" 
                value={form.cover_image} 
                onChange={v => setForm(f => ({ ...f, cover_image: v }))} 
                aspect="wide" 
              />
            </div>

            <Field label="Technical Rider"><FTextarea value={form.technical_rider} onChange={v => setForm(f => ({ ...f, technical_rider: v }))} rows={2} /></Field>
            <Field label="Hospitality Rider"><FTextarea value={form.hospitality_rider} onChange={v => setForm(f => ({ ...f, hospitality_rider: v }))} rows={2} /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Artist" message="This will permanently delete the artist profile." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Events Section ───────────────────────────────────────────────────────────

function EventsSection({ bookings, artists, venues, onRefresh, showToast }: {
  bookings: Booking[]; artists: Artist[]; venues: Venue[];
  onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const BSTATUSES: Booking['status'][] = ['Inquiry', 'Proposal Generated', 'Contract Sent', 'Deposit Paid', 'Confirmed', 'Completed', 'Cancelled'];
  const blank = { artist_id: artists[0]?.id || '', event_title: '', event_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], event_venue: '', event_country: 'Jamaica', status: 'Inquiry' as Booking['status'], total_amount: '50000', deposit_amount: '25000', client_name: '' };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm({ ...blank, artist_id: artists[0]?.id || '' }); setShowModal(true); };
  const openEdit = (b: Booking) => {
    setEditItem(b);
    setForm({ artist_id: b.artist_id, event_title: b.event_title, event_date: b.event_date, event_venue: b.event_venue, event_country: b.event_country, status: b.status, total_amount: String(b.total_amount), deposit_amount: String(b.deposit_amount), client_name: b.client_name });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const sel = artists.find(a => a.id === form.artist_id);
      const data = {
        artist_id: form.artist_id, artist_name: sel?.stage_name || 'Unknown', artist_image: sel?.profile_image || '',
        client_id: 'cli-001', client_name: form.client_name,
        event_id: 'evt-' + Math.random().toString(36).substr(2, 9),
        event_title: form.event_title, event_date: form.event_date,
        event_venue: form.event_venue, event_country: form.event_country,
        status: form.status, total_amount: parseFloat(form.total_amount) || 0,
        deposit_amount: parseFloat(form.deposit_amount) || 0,
      };
      if (editItem) await db.updateBooking(editItem.id, data);
      else await db.createBooking(data);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Event updated.' : 'Event created.', 'success');
    } catch { showToast('Failed to save event.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteBooking(id); onRefresh(); showToast('Event removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filtered = bookings.filter(b =>
    b.event_title.toLowerCase().includes(search.toLowerCase()) ||
    b.artist_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" style={{ ...iStyle, paddingLeft: 30, width: 220, fontSize: '0.82rem', height: 34 }} />
        </div>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />New Event</ABtn>
      </div>
      <Tbl>
        <TH cols={['Event Title', 'Artist', 'Client', 'Date', 'Venue', 'Amount', 'Status', '']} />
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={8}><Empty icon={Star} msg="No events found" /></td></tr>
          ) : filtered.map(b => (
            <TR key={b.id}>
              <TD><div style={{ fontWeight: 500 }}>{b.event_title}</div></TD>
              <TD muted>{b.artist_name}</TD>
              <TD muted>{b.client_name}</TD>
              <TD muted>{fmtDate(b.event_date)}</TD>
              <TD muted>{b.event_venue || '—'}</TD>
              <TD>{fmtCurrency(b.total_amount)}</TD>
              <TD><StatusBadge status={b.status} /></TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(b)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(b.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Event' : 'New Event'} width={580}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Event Title"><FInput value={form.event_title} onChange={v => setForm(f => ({ ...f, event_title: v }))} /></Field>
            <Field label="Client Name"><FInput value={form.client_name} onChange={v => setForm(f => ({ ...f, client_name: v }))} /></Field>
            <Field label="Artist">
              <FSelect value={form.artist_id} onChange={v => setForm(f => ({ ...f, artist_id: v }))} options={artists.map(a => ({ value: a.id, label: a.stage_name }))} />
            </Field>
            <Field label="Event Date"><FInput value={form.event_date} onChange={v => setForm(f => ({ ...f, event_date: v }))} type="date" /></Field>
            <Field label="Venue">
              <FSelect value={form.event_venue} onChange={v => setForm(f => ({ ...f, event_venue: v }))} options={[{ value: '', label: 'Select venue…' }, ...venues.map(v => ({ value: v.name, label: v.name }))]} />
            </Field>
            <Field label="Country"><FInput value={form.event_country} onChange={v => setForm(f => ({ ...f, event_country: v }))} /></Field>
            <Field label="Total Amount (USD)"><FInput value={form.total_amount} onChange={v => setForm(f => ({ ...f, total_amount: v }))} type="number" /></Field>
            <Field label="Deposit Amount (USD)"><FInput value={form.deposit_amount} onChange={v => setForm(f => ({ ...f, deposit_amount: v }))} type="number" /></Field>
            <Field label="Status">
              <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Booking['status'] }))} options={BSTATUSES.map(s => ({ value: s, label: s }))} />
            </Field>
          </FGrid>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Delete Event" message="This will permanently delete the event booking." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Venues Section ───────────────────────────────────────────────────────────

function VenuesSection({ venues, onRefresh, showToast }: {
  venues: Venue[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Venue | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const blank = { name: '', capacity: '', location: '', description: '', parking: '' };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (v: Venue) => {
    setEditItem(v);
    setForm({ name: v.name, capacity: v.capacity, location: v.location, description: v.description || '', parking: v.parking || '' });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateVenue(editItem.id, form);
      else await db.createVenue(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Venue updated.' : 'Venue added.', 'success');
    } catch { showToast('Failed to save venue.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteVenue(id); onRefresh(); showToast('Venue removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filtered = venues.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues…" style={{ ...iStyle, paddingLeft: 30, width: 220, fontSize: '0.82rem', height: 34 }} />
        </div>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />Add Venue</ABtn>
      </div>
      <Tbl>
        <TH cols={['Venue', 'Location', 'Capacity', 'Parking', '']} />
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={5}><Empty icon={MapPin} msg="No venues found" /></td></tr>
          ) : filtered.map(v => (
            <TR key={v.id}>
              <TD><div style={{ fontWeight: 500 }}>{v.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.description?.slice(0, 50)}</div></TD>
              <TD muted>{v.location}</TD>
              <TD muted>{v.capacity}</TD>
              <TD muted>{v.parking || '—'}</TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(v)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(v.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Venue' : 'Add Venue'} width={500}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Venue Name"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></Field>
            <Field label="Location"><FInput value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} /></Field>
            <Field label="Capacity"><FInput value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} placeholder="e.g. 5,000" /></Field>
            <Field label="Parking"><FInput value={form.parking} onChange={v => setForm(f => ({ ...f, parking: v }))} /></Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Description"><FTextarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={2} /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Venue" message="This will permanently delete the venue record." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Customers Section ────────────────────────────────────────────────────────

function CustomersSection({ customers, onRefresh, showToast }: {
  customers: Customer[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const blank = { name: '', company: '', email: '', tier: 'Standard Client', notes: '' };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (c: Customer) => {
    setEditItem(c);
    setForm({ name: c.name, company: c.company, email: c.email, tier: c.tier, notes: c.notes });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateCustomer(editItem.id, form);
      else await db.createCustomer(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Customer updated.' : 'Customer added.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteCustomer(id); onRefresh(); showToast('Customer removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" style={{ ...iStyle, paddingLeft: 30, width: 220, fontSize: '0.82rem', height: 34 }} />
        </div>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />Add Customer</ABtn>
      </div>
      <Tbl>
        <TH cols={['Customer', 'Company', 'Email', 'Tier', 'Notes', '']} />
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={6}><Empty icon={Users} msg="No customers found" /></td></tr>
          ) : filtered.map(c => (
            <TR key={c.id}>
              <TD><div style={{ fontWeight: 500 }}>{c.name}</div></TD>
              <TD muted>{c.company || '—'}</TD>
              <TD muted>{c.email}</TD>
              <TD><StatusBadge status={c.tier} /></TD>
              <TD muted>{c.notes?.slice(0, 40) || '—'}</TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(c.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Customer' : 'Add Customer'} width={500}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Name"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></Field>
            <Field label="Company"><FInput value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} /></Field>
            <Field label="Email"><FInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" /></Field>
            <Field label="Tier">
              <FSelect value={form.tier} onChange={v => setForm(f => ({ ...f, tier: v }))} options={['Standard Client', 'VIP Client', 'Corporate', 'Premium Partner', 'Festival Organizer'].map(t => ({ value: t, label: t }))} />
            </Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Notes"><FTextarea value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} rows={2} /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Customer" message="This will permanently delete the customer record." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Finance Section ──────────────────────────────────────────────────────────

function FinanceSection({ invoices, bookings }: { invoices: Invoice[]; bookings: Booking[] }) {
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((s, i) => s + i.balance_due, 0);
  const overdue = invoices.filter(i => i.status === 'Overdue').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="dash-stat-grid">
        <StatCard label="Total Collected" value={fmtCurrency(totalRevenue)} icon={DollarSign} trend="+8.2%" trendUp />
        <StatCard label="Outstanding" value={fmtCurrency(outstanding)} icon={CreditCard} sub="pending collection" />
        <StatCard label="Overdue Invoices" value={String(overdue)} icon={AlertCircle} sub="require action" />
        <StatCard label="Total Invoices" value={String(invoices.length)} icon={Receipt} />
      </div>
      <Tbl>
        <TH cols={['Invoice ID', 'Booking', 'Amount', 'Balance Due', 'Status', 'Due Date']} />
        <tbody>
          {invoices.length === 0 ? (
            <tr><td colSpan={6}><Empty icon={Receipt} msg="No invoices found" /></td></tr>
          ) : invoices.slice(0, 25).map(inv => {
            const bk = bookings.find(b => b.id === inv.booking_id);
            return (
              <TR key={inv.id}>
                <TD><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{inv.id.slice(0, 12)}</span></TD>
                <TD muted>{bk?.event_title || inv.booking_id}</TD>
                <TD>{fmtCurrency(inv.amount)}</TD>
                <TD>{fmtCurrency(inv.balance_due)}</TD>
                <TD><StatusBadge status={inv.status} /></TD>
                <TD muted>{fmtDate(inv.due_date)}</TD>
              </TR>
            );
          })}
        </tbody>
      </Tbl>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection({ invoices, bookings, onRefresh, showToast }: {
  invoices: Invoice[]; bookings: Booking[];
  onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const ISTATUSES: Invoice['status'][] = ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];
  const blank = { booking_id: bookings[0]?.id || '', amount: '50000', status: 'Unpaid' as Invoice['status'], due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm({ ...blank, booking_id: bookings[0]?.id || '' }); setShowModal(true); };
  const openEdit = (i: Invoice) => {
    setEditItem(i);
    setForm({ booking_id: i.booking_id, amount: String(i.amount), status: i.status, due_date: i.due_date });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { booking_id: form.booking_id, amount: parseFloat(form.amount) || 0, balance_due: form.status === 'Paid' ? 0 : (parseFloat(form.amount) || 0), status: form.status, due_date: form.due_date };
      if (editItem) await db.updateInvoice(editItem.id, data);
      else await db.createInvoice(data);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Order updated.' : 'Order created.', 'success');
    } catch { showToast('Failed to save order.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteInvoice(id); onRefresh(); showToast('Order removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />New Order</ABtn>
      </div>
      <Tbl>
        <TH cols={['ID', 'Booking', 'Amount', 'Balance', 'Status', 'Due', '']} />
        <tbody>
          {invoices.length === 0 ? (
            <tr><td colSpan={7}><Empty icon={Package} msg="No orders found" /></td></tr>
          ) : invoices.map(inv => {
            const bk = bookings.find(b => b.id === inv.booking_id);
            return (
              <TR key={inv.id}>
                <TD><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{inv.id.slice(0, 12)}</span></TD>
                <TD muted>{bk?.event_title || inv.booking_id}</TD>
                <TD>{fmtCurrency(inv.amount)}</TD>
                <TD>{fmtCurrency(inv.balance_due)}</TD>
                <TD><StatusBadge status={inv.status} /></TD>
                <TD muted>{fmtDate(inv.due_date)}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <ABtn variant="ghost" size="sm" onClick={() => openEdit(inv)}><Edit2 size={12} /></ABtn>
                    <ABtn variant="danger" size="sm" onClick={() => setConfirm(inv.id)}><Trash2 size={12} /></ABtn>
                  </div>
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Order' : 'New Order'} width={480}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Booking">
              <FSelect value={form.booking_id} onChange={v => setForm(f => ({ ...f, booking_id: v }))} options={bookings.map(b => ({ value: b.id, label: b.event_title }))} />
            </Field>
            <Field label="Amount (USD)"><FInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" /></Field>
            <Field label="Status">
              <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Invoice['status'] }))} options={ISTATUSES.map(s => ({ value: s, label: s }))} />
            </Field>
            <Field label="Due Date"><FInput value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} type="date" /></Field>
          </FGrid>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Order" message="This will permanently delete the order/invoice." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Tickets Section ──────────────────────────────────────────────────────────

function TicketsSection({ tiers, promoCodes, onRefresh, showToast }: {
  tiers: TicketTier[]; promoCodes: PromoCode[];
  onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [tab, setTab] = useState<'tiers' | 'promos'>('tiers');
  const [showModal, setShowModal] = useState(false);
  const [editTier, setEditTier] = useState<TicketTier | null>(null);
  const [editPromo, setEditPromo] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; type: 'tier' | 'promo' } | null>(null);

  const [tierForm, setTierForm] = useState({ name: '', price: '85', desc: '', capacity: '1000' });
  const [promoForm, setPromoForm] = useState({ code: '', discount: '15', active: true, expiry: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });

  const openCreateTier = () => { setEditTier(null); setTierForm({ name: '', price: '85', desc: '', capacity: '1000' }); setShowModal(true); };
  const openEditTier = (t: TicketTier) => { setEditTier(t); setTierForm({ name: t.name, price: String(t.price), desc: t.desc, capacity: String(t.capacity || 1000) }); setShowModal(true); };
  const openCreatePromo = () => { setEditPromo(null); setPromoForm({ code: '', discount: '15', active: true, expiry: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }); setShowModal(true); };
  const openEditPromo = (p: PromoCode) => { setEditPromo(p); setPromoForm({ code: p.code, discount: String(p.discount), active: p.active, expiry: p.expiry }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (tab === 'tiers') {
        const data = { name: tierForm.name, price: parseFloat(tierForm.price) || 0, desc: tierForm.desc, capacity: parseInt(tierForm.capacity) || 1000 };
        if (editTier) await db.updateTicketTier(editTier.id, data);
        else await db.createTicketTier(data);
        showToast(editTier ? 'Tier updated.' : 'Tier created.', 'success');
      } else {
        const data = { code: promoForm.code, discount: parseFloat(promoForm.discount) || 0, active: promoForm.active, expiry: promoForm.expiry };
        if (editPromo) await db.updatePromoCode(editPromo.id, data);
        else await db.createPromoCode(data);
        showToast(editPromo ? 'Promo updated.' : 'Promo created.', 'success');
      }
      setShowModal(false); onRefresh();
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'tier') await db.deleteTicketTier(confirm.id);
      else await db.deletePromoCode(confirm.id);
      onRefresh(); showToast('Deleted successfully.', 'success');
    } catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['tiers', 'promos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', background: tab === t ? 'rgba(212,175,55,0.15)' : 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t === 'tiers' ? `Tiers (${tiers.length})` : `Promo Codes (${promoCodes.length})`}
            </button>
          ))}
        </div>
        <ABtn variant="primary" size="sm" onClick={tab === 'tiers' ? openCreateTier : openCreatePromo}>
          <Plus size={13} />{tab === 'tiers' ? 'Add Tier' : 'Add Promo'}
        </ABtn>
      </div>

      {tab === 'tiers' ? (
        <Tbl>
          <TH cols={['Tier Name', 'Price', 'Capacity', 'Description', '']} />
          <tbody>
            {tiers.length === 0 ? (
              <tr><td colSpan={5}><Empty icon={Ticket} msg="No ticket tiers" /></td></tr>
            ) : tiers.map(t => (
              <TR key={t.id}>
                <TD><div style={{ fontWeight: 500 }}>{t.name}</div></TD>
                <TD>{fmtCurrency(t.price)}</TD>
                <TD muted>{t.capacity?.toLocaleString()}</TD>
                <TD muted>{t.desc?.slice(0, 60)}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <ABtn variant="ghost" size="sm" onClick={() => openEditTier(t)}><Edit2 size={12} /></ABtn>
                    <ABtn variant="danger" size="sm" onClick={() => setConfirm({ id: t.id, type: 'tier' })}><Trash2 size={12} /></ABtn>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Tbl>
      ) : (
        <Tbl>
          <TH cols={['Code', 'Discount', 'Active', 'Expiry', '']} />
          <tbody>
            {promoCodes.length === 0 ? (
              <tr><td colSpan={5}><Empty icon={Tag} msg="No promo codes" /></td></tr>
            ) : promoCodes.map(p => (
              <TR key={p.id}>
                <TD><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>{p.code}</span></TD>
                <TD>{p.discount}% off</TD>
                <TD><StatusBadge status={p.active ? 'Active' : 'Inactive'} /></TD>
                <TD muted>{fmtDate(p.expiry)}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <ABtn variant="ghost" size="sm" onClick={() => openEditPromo(p)}><Edit2 size={12} /></ABtn>
                    <ABtn variant="danger" size="sm" onClick={() => setConfirm({ id: p.id, type: 'promo' })}><Trash2 size={12} /></ABtn>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Tbl>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={tab === 'tiers' ? (editTier ? 'Edit Tier' : 'Add Tier') : (editPromo ? 'Edit Promo' : 'Add Promo')} width={440}>
        <form onSubmit={handleSave}>
          {tab === 'tiers' ? (
            <FGrid>
              <Field label="Tier Name"><FInput value={tierForm.name} onChange={v => setTierForm(f => ({ ...f, name: v }))} /></Field>
              <Field label="Price (USD)"><FInput value={tierForm.price} onChange={v => setTierForm(f => ({ ...f, price: v }))} type="number" /></Field>
              <Field label="Capacity"><FInput value={tierForm.capacity} onChange={v => setTierForm(f => ({ ...f, capacity: v }))} type="number" /></Field>
              <div style={{ gridColumn: '1/-1' }}><Field label="Description"><FTextarea value={tierForm.desc} onChange={v => setTierForm(f => ({ ...f, desc: v }))} rows={2} /></Field></div>
            </FGrid>
          ) : (
            <FGrid>
              <Field label="Code"><FInput value={promoForm.code} onChange={v => setPromoForm(f => ({ ...f, code: v.toUpperCase() }))} placeholder="EARLYBIRD25" /></Field>
              <Field label="Discount %"><FInput value={promoForm.discount} onChange={v => setPromoForm(f => ({ ...f, discount: v }))} type="number" /></Field>
              <Field label="Expiry Date"><FInput value={promoForm.expiry} onChange={v => setPromoForm(f => ({ ...f, expiry: v }))} type="date" /></Field>
              <Field label="Status">
                <FSelect value={promoForm.active ? 'active' : 'inactive'} onChange={v => setPromoForm(f => ({ ...f, active: v === 'active' }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              </Field>
            </FGrid>
          )}
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Delete Item" message="This will permanently delete this record." onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Marketing Section ────────────────────────────────────────────────────────

function MarketingSection({ campaigns, onRefresh, showToast }: {
  campaigns: MarketingCampaign[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MarketingCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const blank = { name: '', type: 'Email' as MarketingCampaign['type'], subject: '', segment: 'All Customers', content: '' };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (c: MarketingCampaign) => {
    setEditItem(c);
    setForm({ name: c.name, type: c.type, subject: c.subject, segment: c.segment, content: c.content });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateCampaign(editItem.id, form);
      else await db.createCampaign(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Campaign updated.' : 'Campaign created.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteCampaign(id); onRefresh(); showToast('Campaign removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />New Campaign</ABtn>
      </div>
      <Tbl>
        <TH cols={['Campaign', 'Type', 'Segment', 'Open Rate', 'Created', '']} />
        <tbody>
          {campaigns.length === 0 ? (
            <tr><td colSpan={6}><Empty icon={Megaphone} msg="No campaigns yet" /></td></tr>
          ) : campaigns.map(c => (
            <TR key={c.id}>
              <TD><div style={{ fontWeight: 500 }}>{c.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.subject}</div></TD>
              <TD><StatusBadge status={c.type} /></TD>
              <TD muted>{c.segment}</TD>
              <TD muted>{c.openRate}</TD>
              <TD muted>{fmtDate(c.created_at)}</TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(c.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Campaign' : 'New Campaign'} width={540}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Campaign Name"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></Field>
            <Field label="Type">
              <FSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v as MarketingCampaign['type'] }))} options={['Email', 'SMS', 'Push'].map(t => ({ value: t, label: t }))} />
            </Field>
            <Field label="Subject / Title"><FInput value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} /></Field>
            <Field label="Audience Segment"><FInput value={form.segment} onChange={v => setForm(f => ({ ...f, segment: v }))} /></Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Message Content"><FTextarea value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} rows={4} /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} label="Save Campaign" />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Delete Campaign" message="This will permanently remove the campaign." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Advertising Section ──────────────────────────────────────────────────────

function AdvertisingSection({ ads, onRefresh, showToast }: {
  ads: AdPlacement[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AdPlacement | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const blank = { name: '', active: true, image_url: '' };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (a: AdPlacement) => {
    setEditItem(a);
    setForm({ name: a.name, active: a.active, image_url: a.image_url || '' });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateAdPlacement(editItem.id, form);
      else await db.createAdPlacement(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Ad updated.' : 'Ad created.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteAdPlacement(id); onRefresh(); showToast('Ad removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />New Placement</ABtn>
      </div>
      <Tbl>
        <TH cols={['Ad Name', 'Impressions', 'CTR', 'Revenue', 'Status', '']} />
        <tbody>
          {ads.length === 0 ? (
            <tr><td colSpan={6}><Empty icon={Radio} msg="No ad placements" /></td></tr>
          ) : ads.map(a => (
            <TR key={a.id}>
              <TD><div style={{ fontWeight: 500 }}>{a.name}</div></TD>
              <TD muted>{a.impressions.toLocaleString()}</TD>
              <TD muted>{a.clickRate}</TD>
              <TD>{fmtCurrency(a.revenue)}</TD>
              <TD><StatusBadge status={a.active ? 'Active' : 'Inactive'} /></TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(a)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(a.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Ad' : 'New Ad Placement'} width={440}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Field label="Ad Name"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></Field>
            <Field label="Image URL"><FInput value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} placeholder="https://…" /></Field>
            <Field label="Status">
              <FSelect value={form.active ? 'active' : 'inactive'} onChange={v => setForm(f => ({ ...f, active: v === 'active' }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Delete Ad Placement" message="This will permanently remove the ad placement." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Content CMS Section ──────────────────────────────────────────────────────

function ContentSection({ sections, onRefresh, showToast }: {
  sections: WebsiteSection[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<WebsiteSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const TYPES: WebsiteSection['type'][] = ['hero', 'announcement', 'features', 'cta', 'footer'];
  const blank = { type: 'hero' as WebsiteSection['type'], title: '', subtitle: '', content: '', buttonText: '', image_url: '', active: true };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (s: WebsiteSection) => {
    setEditItem(s);
    setForm({ type: s.type, title: s.title, subtitle: s.subtitle || '', content: s.content || '', buttonText: s.buttonText || '', image_url: s.image_url || '', active: s.active });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateWebsiteSection(editItem.id, form);
      else await db.createWebsiteSection(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'Section updated.' : 'Section created.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteWebsiteSection(id); onRefresh(); showToast('Section removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />Add Section</ABtn>
      </div>
      <Tbl>
        <TH cols={['Section ID', 'Type', 'Title', 'Active', '']} />
        <tbody>
          {sections.length === 0 ? (
            <tr><td colSpan={5}><Empty icon={FileText} msg="No website sections" /></td></tr>
          ) : sections.map(s => (
            <TR key={s.id}>
              <TD><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.id}</span></TD>
              <TD><StatusBadge status={s.type} /></TD>
              <TD><div style={{ fontWeight: 500 }}>{s.title}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.subtitle?.slice(0, 50)}</div></TD>
              <TD><StatusBadge status={s.active ? 'Active' : 'Inactive'} /></TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(s.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Section' : 'Add Section'} width={560}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="Section Type">
              <FSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v as WebsiteSection['type'] }))} options={TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
            </Field>
            <Field label="Status">
              <FSelect value={form.active ? 'active' : 'inactive'} onChange={v => setForm(f => ({ ...f, active: v === 'active' }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </Field>
            <Field label="Title"><FInput value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} /></Field>
            <Field label="Subtitle"><FInput value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} /></Field>
            <Field label="Button Text"><FInput value={form.buttonText} onChange={v => setForm(f => ({ ...f, buttonText: v }))} /></Field>
            <Field label="Image URL"><FInput value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} placeholder="https://…" /></Field>
          </FGrid>
          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Content"><FTextarea value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} rows={3} /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Delete Section" message="This will permanently remove the website section." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Staff Section ────────────────────────────────────────────────────────────

function StaffSection({ users, onRefresh, showToast }: {
  users: User[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const ROLES = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager', 'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent', 'Promoter', 'Venue Manager', 'Artist', 'Client'];
  const blank = { first_name: '', last_name: '', email: '', role: 'Booking Agent', status: 'Active' as User['status'] };
  const [form, setForm] = useState(blank);

  const openCreate = () => { setEditItem(null); setForm(blank); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditItem(u);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role, status: u.status });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateUser(editItem.id, form);
      else await db.createUser(form);
      setShowModal(false); onRefresh();
      showToast(editItem ? 'User updated.' : 'User created.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await db.deleteUser(id); onRefresh(); showToast('User removed.', 'success'); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setConfirm(null); }
  };

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…" style={{ ...iStyle, paddingLeft: 30, width: 220, fontSize: '0.82rem', height: 34 }} />
        </div>
        <ABtn variant="primary" size="sm" onClick={openCreate}><Plus size={13} />Add Staff</ABtn>
      </div>
      <Tbl>
        <TH cols={['Name', 'Email', 'Role', 'Status', 'Created', '']} />
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={6}><Empty icon={ShieldCheck} msg="No staff found" /></td></tr>
          ) : filtered.map(u => (
            <TR key={u.id}>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {initials(u.first_name, u.last_name)}
                  </div>
                  <span style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</span>
                </div>
              </TD>
              <TD muted>{u.email}</TD>
              <TD><StatusBadge status={u.role} /></TD>
              <TD><StatusBadge status={u.status} /></TD>
              <TD muted>{fmtDate(u.created_at)}</TD>
              <TD>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <ABtn variant="ghost" size="sm" onClick={() => openEdit(u)}><Edit2 size={12} /></ABtn>
                  <ABtn variant="danger" size="sm" onClick={() => setConfirm(u.id)}><Trash2 size={12} /></ABtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Tbl>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Staff Member' : 'Add Staff Member'} width={500}>
        <form onSubmit={handleSave}>
          <FGrid>
            <Field label="First Name"><FInput value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} /></Field>
            <Field label="Last Name"><FInput value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} /></Field>
            <Field label="Email"><FInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" /></Field>
            <Field label="Role">
              <FSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={ROLES.map(r => ({ value: r, label: r }))} />
            </Field>
            <Field label="Status">
              <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as User['status'] }))} options={['Active', 'Inactive', 'Suspended'].map(s => ({ value: s, label: s }))} />
            </Field>
          </FGrid>
          <FActions onCancel={() => setShowModal(false)} saving={saving} />
        </form>
      </Modal>
      <ConfirmDlg open={!!confirm} title="Remove Staff Member" message="This will permanently delete this user account." onConfirm={() => confirm && handleDelete(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── Integrations Section ─────────────────────────────────────────────────────

function IntegrationsSection({ integrations, onRefresh, showToast }: {
  integrations: Integration[]; onRefresh: () => void; showToast: (m: string, t: 'success' | 'error') => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Integration | null>(null);
  const [saving, setSaving] = useState(false);

  const PROVIDER_ICONS: Record<string, React.ElementType> = { Stripe: CreditCard, PayPal: Globe, Twilio: Phone, SendGrid: Mail };
  const blank = { name: '', provider: 'Stripe' as Integration['provider'], status: 'Connected' as Integration['status'], api_key: '' };
  const [form, setForm] = useState(blank);

  const openEdit = (i: Integration) => {
    setEditItem(i);
    setForm({ name: i.name, provider: i.provider, status: i.status, api_key: i.api_key });
    setShowModal(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await db.updateIntegration(editItem.id, form);
      else await db.createIntegration(form);
      setShowModal(false); onRefresh();
      showToast('Integration updated.', 'success');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
        {integrations.map(int => {
          const Icon = PROVIDER_ICONS[int.provider] || Link2;
          const ok = int.status === 'Connected';
          return (
            <div key={int.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ok ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 'var(--radius-lg)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ok ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={ok ? '#30d158' : 'var(--text-muted)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{int.provider}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{int.name}</div>
                  </div>
                </div>
                <StatusBadge status={int.status} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.65rem', borderRadius: 6, letterSpacing: '0.05em' }}>
                {int.api_key ? `${int.api_key.slice(0, 8)}••••••••` : 'No key set'}
              </div>
              <ABtn variant="secondary" size="sm" onClick={() => openEdit(int)}><Edit2 size={12} />Configure</ABtn>
            </div>
          );
        })}
        {integrations.length === 0 && <Empty icon={Cable} msg="No integrations configured" />}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Configure Integration" width={440}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Field label="Display Name"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></Field>
            <Field label="Provider">
              <FSelect value={form.provider} onChange={v => setForm(f => ({ ...f, provider: v as Integration['provider'] }))} options={['Stripe', 'PayPal', 'Twilio', 'SendGrid'].map(p => ({ value: p, label: p }))} />
            </Field>
            <Field label="Status">
              <FSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Integration['status'] }))} options={[{ value: 'Connected', label: 'Connected' }, { value: 'Disconnected', label: 'Disconnected' }]} />
            </Field>
            <Field label="API Key"><FInput value={form.api_key} onChange={v => setForm(f => ({ ...f, api_key: v }))} placeholder="sk_live_…" /></Field>
          </div>
          <FActions onCancel={() => setShowModal(false)} saving={saving} label="Save Configuration" />
        </form>
      </Modal>
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ showToast }: { showToast: (m: string, t: 'success' | 'error') => void }) {
  const [domain, setDomain] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('st_settings_domain') || 'showtimeservices.com' : 'showtimeservices.com');
  const [currency, setCurrency] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('st_settings_currency') || 'USD ($)' : 'USD ($)');
  const [timezone, setTimezone] = useState('America/Jamaica');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (typeof window !== 'undefined') {
      localStorage.setItem('st_settings_domain', domain);
      localStorage.setItem('st_settings_currency', currency);
    }
    setSaving(false);
    showToast('Settings saved.', 'success');
  };

  const handleReset = () => {
    if (typeof window === 'undefined') return;
    if (!confirm('Are you sure you want to reset all data? This will revert the entire system to its default seed data.')) return;
    
    const keys = [
      'st_users', 'st_artists_v2', 'st_artists', 'st_leads', 'st_bookings', 'st_contracts',
      'st_invoices', 'st_tasks', 'st_notifs', 'st_venues', 'st_customers', 'st_ticket_tiers',
      'st_promo_codes', 'st_campaigns', 'st_ad_placements', 'st_website_sections', 'st_integrations',
      'st_settings_domain', 'st_settings_currency', 'st_active_user_id'
    ];
    
    keys.forEach(k => localStorage.removeItem(k));
    showToast('System data has been reset to defaults.', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 600 }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.4rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>System Configuration</h4>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Field label="Primary Domain"><FInput value={domain} onChange={setDomain} /></Field>
            <Field label="Default Currency">
              <FSelect value={currency} onChange={setCurrency} options={['USD ($)', 'EUR (€)', 'GBP (£)', 'JMD (J$)', 'CAD (C$)', 'AUD (A$)'].map(c => ({ value: c, label: c }))} />
            </Field>
            <Field label="Timezone">
              <FSelect value={timezone} onChange={setTimezone} options={['America/Jamaica', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'].map(t => ({ value: t, label: t }))} />
            </Field>
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <ABtn variant="primary" disabled={saving}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              {saving ? 'Saving…' : 'Save Settings'}
            </ABtn>
          </div>
        </form>
      </div>
      <div style={{ background: 'rgba(255,69,58,0.04)', border: '1px solid rgba(255,69,58,0.15)', borderRadius: 'var(--radius-lg)', padding: '1.4rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ff453a' }}>Danger Zone</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>These actions are permanent and cannot be undone.</p>
        <ABtn variant="danger" size="sm" onClick={handleReset}><AlertCircle size={13} />Reset All Data</ABtn>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPortal() {
  const { user, profile, loading, signOut, hasPermission, isAdmin, isStaff } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [leads, setLeads]                     = useState<Lead[]>([]);
  const [bookings, setBookings]               = useState<Booking[]>([]);
  const [tasks, setTasks]                     = useState<Task[]>([]);
  const [notifs, setNotifs]                   = useState<Notification[]>([]);
  const [invoices, setInvoices]               = useState<Invoice[]>([]);
  const [artists, setArtists]                 = useState<Artist[]>([]);
  const [venues, setVenues]                   = useState<Venue[]>([]);
  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [users, setUsers]                     = useState<User[]>([]);
  const [ticketTiers, setTicketTiers]         = useState<TicketTier[]>([]);
  const [promoCodes, setPromoCodes]           = useState<PromoCode[]>([]);
  const [campaigns, setCampaigns]             = useState<MarketingCampaign[]>([]);
  const [adPlacements, setAdPlacements]       = useState<AdPlacement[]>([]);
  const [websiteSections, setWebsiteSections] = useState<WebsiteSection[]>([]);
  const [integrations, setIntegrations]       = useState<Integration[]>([]);
  const [dataLoading, setDataLoading]         = useState(true);

  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), []);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        aLeads, aBookings, aTasks, aInvoices, aArtists,
        aVenues, aCustomers, aUsers, aTiers, aPromos,
        aCamps, aAds, aSecs, aInts,
      ] = await Promise.all([
        db.getLeads(), db.getBookings(), db.getTasks(), db.getInvoices(), db.getArtists(),
        db.getVenues(), db.getCustomers(), db.getUsers(), db.getTicketTiers(), db.getPromoCodes(),
        db.getCampaigns(), db.getAdPlacements(), db.getWebsiteSections(), db.getIntegrations(),
      ]);
      setLeads(aLeads); setBookings(aBookings); setTasks(aTasks); setInvoices(aInvoices);
      setArtists(aArtists); setVenues(aVenues); setCustomers(aCustomers); setUsers(aUsers);
      setTicketTiers(aTiers); setPromoCodes(aPromos); setCampaigns(aCamps);
      setAdPlacements(aAds); setWebsiteSections(aSecs); setIntegrations(aInts);
      if (user?.id) {
        const n = await db.getNotifications(user.id);
        setNotifs(n);
      }
    } catch { showToast('Failed to load data. Please refresh.', 'error'); }
    finally { setDataLoading(false); }
  }, [user, showToast]);

  useEffect(() => { if (!loading && !user) router.push('/auth/signin'); }, [loading, user, router]);
  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleSignOut = async () => { await signOut(); router.push('/auth/signin'); };

  const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Dashboard', bookings: 'Bookings', artists: 'Artists', events: 'Events',
    venues: 'Venues', customers: 'Customers', finance: 'Finance', orders: 'Orders',
    tickets: 'Tickets & Promos', marketing: 'Marketing', advertising: 'Advertising',
    content: 'Content CMS', staff: 'Staff & Roles', integrations: 'Integrations', settings: 'Settings',
  };

  const unreadNotifs = notifs.filter(n => !n.read_status).length;

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return hasPermission(item.permission) || isAdmin;
    return true;
  });

  const grouped = NAV_SECTIONS
    .map(s => ({ ...s, items: visibleNavItems.filter(i => i.section === s.id) }))
    .filter(s => s.items.length > 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader2 size={28} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading portal…</span>
      </div>
    </div>
  );

  if (!user || !profile) return null;

  if (!isStaff && !isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AccessDenied />
    </div>
  );

  const renderContent = () => {
    if (dataLoading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Loader2 size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
    switch (activeTab) {
      case 'dashboard':    return <DashboardOverview bookings={bookings} leads={leads} invoices={invoices} artists={artists} tasks={tasks} onNavigate={setActiveTab} />;
      case 'bookings':     return <BookingsSection bookings={bookings} leads={leads} artists={artists} onRefresh={loadData} showToast={showToast} />;
      case 'artists':      return !hasPermission('view_artists') && !isAdmin    ? <AccessDenied /> : <ArtistsSection artists={artists} onRefresh={loadData} showToast={showToast} />;
      case 'events':       return !hasPermission('view_events') && !isAdmin     ? <AccessDenied /> : <EventsSection bookings={bookings} artists={artists} venues={venues} onRefresh={loadData} showToast={showToast} />;
      case 'venues':       return !hasPermission('manage_venues') && !isAdmin   ? <AccessDenied /> : <VenuesSection venues={venues} onRefresh={loadData} showToast={showToast} />;
      case 'customers':    return !hasPermission('view_customers') && !isAdmin  ? <AccessDenied /> : <CustomersSection customers={customers} onRefresh={loadData} showToast={showToast} />;
      case 'finance':      return !hasPermission('view_finance') && !isAdmin    ? <AccessDenied /> : <FinanceSection invoices={invoices} bookings={bookings} />;
      case 'orders':       return !hasPermission('view_orders') && !isAdmin     ? <AccessDenied /> : <OrdersSection invoices={invoices} bookings={bookings} onRefresh={loadData} showToast={showToast} />;
      case 'tickets':      return !hasPermission('view_tickets') && !isAdmin    ? <AccessDenied /> : <TicketsSection tiers={ticketTiers} promoCodes={promoCodes} onRefresh={loadData} showToast={showToast} />;
      case 'marketing':    return !hasPermission('manage_marketing') && !isAdmin    ? <AccessDenied /> : <MarketingSection campaigns={campaigns} onRefresh={loadData} showToast={showToast} />;
      case 'advertising':  return !hasPermission('manage_advertising') && !isAdmin  ? <AccessDenied /> : <AdvertisingSection ads={adPlacements} onRefresh={loadData} showToast={showToast} />;
      case 'content':      return !hasPermission('manage_content') && !isAdmin  ? <AccessDenied /> : <ContentSection sections={websiteSections} onRefresh={loadData} showToast={showToast} />;
      case 'staff':        return !isAdmin ? <AccessDenied /> : <StaffSection users={users} onRefresh={loadData} showToast={showToast} />;
      case 'integrations': return !isAdmin ? <AccessDenied /> : <IntegrationsSection integrations={integrations} onRefresh={loadData} showToast={showToast} />;
      case 'settings':     return !isAdmin ? <AccessDenied /> : <SettingsSection showToast={showToast} />;
      default:             return <DashboardOverview bookings={bookings} leads={leads} invoices={invoices} artists={artists} tasks={tasks} onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }

        /* ── Dashboard responsive shell ── */
        .dash-shell { display: flex; min-height: 100vh; background: var(--bg-primary); font-family: var(--font-body); }
        .dash-sidebar {
          width: var(--sidebar-w, 220px);
          min-height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex; flex-direction: column;
          transition: width 0.28s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94);
          overflow: hidden; flex-shrink: 0;
          position: sticky; top: 0; height: 100vh; z-index: 100;
        }
        .dash-sidebar-backdrop { display: none; }
        .dash-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 100vh; }
        .dash-content { flex: 1; padding: 1.5rem; overflow-y: auto; }
        .dash-content-inner { max-width: 1200px; margin: 0 auto; animation: fadeInUp 0.25s ease; }
        .dash-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px,1fr)); gap: 1rem; }
        .dash-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .dash-notif-panel { position: absolute; right: 0; top: 110%; width: 300px; }
        .dash-header-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); letter-spacing: -0.02em; margin: 0; }

        @media (max-width: 767px) {
          .dash-shell { flex-direction: column; }

          /* Sidebar becomes a slide-in overlay drawer */
          .dash-sidebar {
            position: fixed;
            left: 0; top: 0; bottom: 0;
            height: 100vh;
            z-index: 500;
            transform: translateX(-100%);
            width: 240px !important;
            box-shadow: 8px 0 40px rgba(0,0,0,0.5);
          }
          .dash-sidebar.sidebar-open {
            transform: translateX(0);
            animation: slideInLeft 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
          }
          /* Dark backdrop behind drawer */
          .dash-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 499;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(2px);
          }
          .dash-main { min-height: 100vh; }
          .dash-content { padding: 1rem 0.875rem; }
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .dash-two-col { grid-template-columns: 1fr; }
          .dash-notif-panel { right: -60px; width: min(300px, 90vw); }
          .dash-header-title { font-size: 0.9rem; }
        }

        @media (max-width: 400px) {
          .dash-stat-grid { grid-template-columns: 1fr; }
          .dash-content { padding: 0.75rem 0.75rem; }
        }
      `}</style>

      <div className="dash-shell">

        {/* ── Sidebar ── */}
        <aside
          className={`dash-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
          style={{
            '--sidebar-w': sidebarOpen ? '220px' : '58px',
          } as React.CSSProperties}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: sidebarOpen ? '1rem 1rem 0.75rem' : '1rem 0.65rem 0.75rem', borderBottom: '1px solid var(--border-color)', gap: '0.5rem', flexShrink: 0 }}>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Showtime</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Admin Portal</div>
              </div>
            )}
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, marginLeft: sidebarOpen ? 'auto' : 0 }}>
              {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem', scrollbarWidth: 'thin' }}>
            {grouped.map((section, si) => (
              <div key={section.id} style={{ marginBottom: si < grouped.length - 1 ? '0.25rem' : 0 }}>
                {sidebarOpen && (
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.5rem 0.25rem' }}>
                    {section.label}
                  </div>
                )}
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={!sidebarOpen ? item.label : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: sidebarOpen ? '0.55rem' : 0,
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                        padding: sidebarOpen ? '0.5rem 0.65rem' : '0.55rem',
                        borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: '0.82rem', fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                        overflow: 'hidden', marginBottom: 1,
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    </button>
                  );
                })}
                {si < grouped.length - 1 && sidebarOpen && (
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '0.4rem 0.5rem' }} />
                )}
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div style={{ borderTop: '1px solid var(--border-color)', padding: sidebarOpen ? '0.75rem' : '0.65rem 0.5rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? '0.6rem' : 0, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                {initials(profile.first_name, profile.last_name)}
              </div>
              {sidebarOpen && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{profile.role}</div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleSignOut}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.42rem 0.65rem', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', marginTop: '0.5rem', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget.style.color = '#ff453a'); (e.currentTarget.style.background = 'rgba(255,69,58,0.08)'); }}
                onMouseLeave={e => { (e.currentTarget.style.color = 'var(--text-muted)'); (e.currentTarget.style.background = 'transparent'); }}
              >
                <LogOut size={13} />Sign Out
              </button>
            )}
          </div>
        </aside>

        {/* Mobile backdrop — closes sidebar when tapped outside */}
        {sidebarOpen && (
          <div
            className="dash-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Main ── */}
        <div className="dash-main">

          {/* Header */}
          <header style={{
            height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1rem', borderBottom: '1px solid var(--border-color)',
            background: 'rgba(12,10,23,0.85)', backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 50, gap: '0.75rem', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <Menu size={16} />
              </button>
              <h1 className="dash-header-title">
                {PAGE_TITLES[activeTab] || 'Dashboard'}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={loadData}
                title="Refresh"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <RefreshCw size={15} />
              </button>

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', position: 'relative', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Bell size={16} />
                  {unreadNotifs > 0 && <span style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)', border: '1.5px solid var(--bg-secondary)' }} />}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 200, animation: 'scaleIn 0.18s ease', overflow: 'hidden' }} className="dash-notif-panel">
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>Notifications</span>
                      {unreadNotifs > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unreadNotifs} unread</span>}
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifs.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>No notifications</div>
                      ) : notifs.slice(0, 8).map(n => (
                        <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: !n.read_status ? 'rgba(212,175,55,0.04)' : 'transparent' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setNotifOpen(false)} style={{ width: '100%', padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', border: '1.5px solid rgba(212,175,55,0.3)' }}>
                {initials(profile.first_name, profile.last_name)}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="dash-content">
            <div className="dash-content-inner">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}
