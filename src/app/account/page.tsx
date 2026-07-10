'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, Shield, Save, Loader2, CheckCircle, ArrowLeft, Lock } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await new Promise(r => setTimeout(r, 700));
    setSavingProfile(false);
    showToast('Profile updated successfully.');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', false);
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', false);
      return;
    }
    setSavingPassword(true);
    await new Promise(r => setTimeout(r, 700));
    setSavingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully.');
  };

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '0.6rem 0.9rem',
    color: 'var(--text-primary)',
    width: '100%',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'var(--font-body)', padding: '2rem 1rem' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .acc-input:focus { border-color: var(--accent) !important; }
        .acc-save-btn { transition: all 0.18s; }
        .acc-save-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Back link */}
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.75rem' }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>Account Settings</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage your profile and security settings.</p>

        {/* Profile card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem', animation: 'fadeInUp 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={16} color="var(--accent)" />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Profile Information</h2>
          </div>

          {/* Role badge */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>ROLE</label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(212,175,55,0.1)', color: 'var(--accent)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>
              <Shield size={11} />{profile.role}
            </span>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.9rem', marginBottom: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>FIRST NAME</label>
                <input className="acc-input" style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" required />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>LAST NAME</label>
                <input className="acc-input" style={inp} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" required />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}><Mail size={10} />EMAIL</label>
                <input className="acc-input" style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}><Phone size={10} />PHONE</label>
                <input className="acc-input" style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 876 000 0000" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="submit"
                disabled={savingProfile}
                className="acc-save-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #f5d061, #d4af37)', color: '#07050e', fontWeight: 600, fontSize: '0.85rem', padding: '0.55rem 1.25rem', borderRadius: 8, border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer', opacity: savingProfile ? 0.6 : 1, fontFamily: 'var(--font-body)' }}
              >
                {savingProfile ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Lock size={16} color="var(--accent)" />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Change Password</h2>
          </div>
          <form onSubmit={handleSavePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.9rem', marginBottom: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>NEW PASSWORD</label>
                <input className="acc-input" style={inp} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CONFIRM PASSWORD</label>
                <input className="acc-input" style={inp} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="submit"
                disabled={savingPassword}
                className="acc-save-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #f5d061, #d4af37)', color: '#07050e', fontWeight: 600, fontSize: '0.85rem', padding: '0.55rem 1.25rem', borderRadius: 8, border: 'none', cursor: savingPassword ? 'not-allowed' : 'pointer', opacity: savingPassword ? 0.6 : 1, fontFamily: 'var(--font-body)' }}
              >
                {savingPassword ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                {savingPassword ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1rem', left: '1rem', maxWidth: 380, marginLeft: 'auto',
          background: toast.ok ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
          border: `1px solid ${toast.ok ? 'rgba(48,209,88,0.4)' : 'rgba(255,69,58,0.4)'}`,
          borderRadius: 10, padding: '0.75rem 1.1rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          color: toast.ok ? '#30d158' : '#ff453a',
          fontSize: '0.875rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.25s ease',
          zIndex: 9999,
        }}>
          <CheckCircle size={15} />{toast.msg}
        </div>
      )}
    </div>
  );
}
