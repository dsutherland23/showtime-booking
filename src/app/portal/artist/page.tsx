'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, Booking, Contract, Artist } from '@/utils/db';
import { 
  Calendar, FileText, Settings, ShieldAlert, Sparkles, 
  Clock, CheckCircle, Info, MapPin, DollarSign, Award, ChevronRight, Users
} from 'lucide-react';

export default function ArtistPortal() {
  const { user } = useAuth();
  
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Portal tabs
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar' | 'documents' | 'riders'>('schedule');

  // Rider editor state
  const [technicalRider, setTechnicalRider] = useState('');
  const [hospitalityRider, setHospitalityRider] = useState('');
  const [riderSaving, setRiderSaving] = useState(false);
  const [riderSavedMessage, setRiderSavedMessage] = useState(false);

  // Calendar dates helper
  const daysInMonth = 30; // June 2026
  const startingDayOfWeek = 1; // June 1, 2026 is Monday
  const monthName = "June 2026";
  
  const calendarCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const loadArtistData = async () => {
    if (!user) return;
    try {
      const allArtists = await db.getArtists();
      
      // Determine which artist is logged in
      // Admin/Manager Robert represents Beres Hammond or Chronixx, Artist Koffee represents Koffee
      let targetArtist = allArtists[0]; // fallback
      if (user.role === 'Artist') {
        targetArtist = allArtists.find(a => a.stage_name.toLowerCase().includes(user.first_name.toLowerCase())) || allArtists.find(a => a.manager_id === user.id) || allArtists[0];
      } else if (user.role === 'Artist Manager') {
        targetArtist = allArtists.find(a => a.manager_id === user.id) || allArtists[0];
      }
      
      setArtistProfile(targetArtist);
      setTechnicalRider(targetArtist.technical_rider || '');
      setHospitalityRider(targetArtist.hospitality_rider || '');

      const allBks = await db.getBookings();
      const artistBks = allBks.filter(b => b.artist_id === targetArtist.id);
      setBookings(artistBks);

      const allCtrs = await db.getContracts();
      const bkIds = artistBks.map(b => b.id);
      setContracts(allCtrs.filter(c => bkIds.includes(c.booking_id)));

      const availDates = await db.getArtistAvailability(targetArtist.id);
      setBlockedDates(availDates);
    } catch (err) {
      console.error('Failed to load artist portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtistData();
  }, [user]);

  if (loading) {
    return (
      <div className="container center-loading" style={{ color: 'var(--gold-primary)', padding: '50px 20px', textAlign: 'center' }}>
        Loading Artist Portal...
      </div>
    );
  }

  // Permission lock
  if (!user || (user.role !== 'Artist' && user.role !== 'Artist Manager')) {
    return (
      <div className="container dashboard-unauthorized animate-fade">
        <ShieldAlert className="unauth-icon" />
        <h2>Artist Portal Access Restricted</h2>
        <p>This panel is reserved for representable Artists and Managers. Please use the floating control panel in the bottom corner to swap identity to Beres Hammond (Artist), Koffee (Artist), or Robert Livingston (Manager) to inspect active calendars, gig riders, and payments.</p>
        <style jsx>{`
          .dashboard-unauthorized {
            text-align: center;
            max-width: 600px;
            padding: var(--spacing-xxl) 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin: 0 auto;
          }
          .unauth-icon {
            width: 64px;
            height: 64px;
            color: var(--color-warning);
          }
        `}</style>
      </div>
    );
  }

  // Toggle calendar dates
  const handleDayClick = async (day: number) => {
    if (!artistProfile) return;
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    const nextDates = await db.toggleArtistDate(artistProfile.id, dateStr);
    setBlockedDates(nextDates);
  };

  // Save riders
  const handleSaveRiders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;
    setRiderSaving(true);
    try {
      await db.updateArtistProfile(artistProfile.id, {
        technical_rider: technicalRider,
        hospitality_rider: hospitalityRider
      });
      setRiderSavedMessage(true);
      setTimeout(() => {
        setRiderSavedMessage(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to update riders:', err);
    } finally {
      setRiderSaving(false);
    }
  };

  const isDateBlocked = (day: number) => {
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    return blockedDates.includes(dateStr);
  };

  return (
    <div className="artist-portal-viewport container">
      
      {/* Portal Header */}
      <div className="portal-header-row">
        <div className="header-info-artist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artistProfile?.profile_image} alt={artistProfile?.stage_name} className="artist-header-avatar" />
          <div>
            <span className="gold-badge">Artist Console &bull; {user.role} view</span>
            <h2>{artistProfile?.stage_name} Hub</h2>
            <p>Manage performance dates availability, update sound riders, and review pending tour logistics contracts.</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="portal-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Performance Schedule ({bookings.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Availability Calendar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Tour Contracts ({contracts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'riders' ? 'active' : ''}`}
          onClick={() => setActiveTab('riders')}
        >
          Rider Management
        </button>
      </div>

      {/* PORTAL PANELS */}
      <div className="portal-panel-wrapper">
        
        {/* PANEL 1: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="tab-slide-panel animate-fade">
            {bookings.length > 0 ? (
              <div className="grid-2">
                {bookings.map(bk => (
                  <div key={bk.id} className="luxury-card gig-detail-card">
                    <div className="gig-header">
                      <div>
                        <span className="gig-status-tag">{bk.status}</span>
                        <h3>{bk.event_title}</h3>
                      </div>
                    </div>

                    <div className="gig-meta-info">
                      <div className="meta-row-item">
                        <Calendar className="meta-icon-tiny" />
                        <div><strong>Performance Date:</strong> <span>{bk.event_date}</span></div>
                      </div>
                      <div className="meta-row-item">
                        <MapPin className="meta-icon-tiny" />
                        <div><strong>Venue / Location:</strong> <span>{bk.event_venue} ({bk.event_country})</span></div>
                      </div>
                      <div className="meta-row-item">
                        <Users className="meta-icon-tiny" style={{ width: '14px', height: '14px', color: 'var(--gold-primary)' }} />
                        <div><strong>Contracting Client:</strong> <span>{bk.client_name}</span></div>
                      </div>
                      <div className="meta-row-item">
                        <DollarSign className="meta-icon-tiny" />
                        <div><strong>Gross Fee Payout:</strong> <span className="fee-text">${bk.total_amount.toLocaleString()} USD</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-panel glassmorphism">
                <Info className="empty-icon" />
                <h3>No Confirmed Performances</h3>
                <p>No confirmed tour stops or festival bookings are logged on this roster account yet.</p>
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="tab-slide-panel animate-fade">
            <div className="luxury-card calendar-workspace-card">
              <div className="calendar-explanation">
                <h3>Live Availability Manager</h3>
                <p>Click individual dates on the calendar to toggle your availability. Confirmed booking requests will auto-block dates. Inbound clients see these states live.</p>
              </div>

              <div className="calendar-grid-wrapper">
                <div className="calendar-header-month">
                  <span>{monthName}</span>
                </div>
                <div className="calendar-weekdays">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                <div className="calendar-days-grid">
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <span key={`empty-${idx}`} className="empty-day-cell"></span>;
                    }
                    const isBlocked = isDateBlocked(day);
                    return (
                      <button 
                        key={`day-${day}`} 
                        className={`day-cell-btn ${isBlocked ? 'blocked' : 'available'}`}
                        onClick={() => handleDayClick(day)}
                        title={isBlocked ? 'Click to make Available' : 'Click to block out date'}
                      >
                        <span className="day-number">{day}</span>
                        <span className="day-status-indicator">{isBlocked ? 'Locked' : 'Open'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot available"></span>
                  <span>Open for Bookings</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot blocked"></span>
                  <span>Blocked / Locked / Gig booked</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="tab-slide-panel animate-fade">
            {contracts.length > 0 ? (
              <div className="luxury-card table-card-wrapper">
                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Agreement Name</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(ctr => {
                        const bk = bookings.find(b => b.id === ctr.booking_id);
                        return (
                          <tr key={ctr.id}>
                            <td>
                              <strong>Tour Agreement: {bk?.event_title}</strong>
                              <p className="table-subtext">Contract ID: {ctr.id}</p>
                            </td>
                            <td>
                              <span className={`table-badge-status ${ctr.status.toLowerCase()}`}>
                                {ctr.status}
                              </span>
                            </td>
                            <td>{new Date(ctr.created_at).toLocaleDateString()}</td>
                            <td className="text-right">
                              <span className="document-link">View document &rarr;</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="empty-panel glassmorphism">
                <FileText className="empty-icon" />
                <h3>No Agreements Found</h3>
                <p>Contract agreements will appear once gig requests are advanced to proposal stages by agent.</p>
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: RIDERS */}
        {activeTab === 'riders' && (
          <div className="tab-slide-panel animate-fade">
            <form className="luxury-card rider-editor-form" onSubmit={handleSaveRiders}>
              <h3>Update Tour & Backline Riders</h3>
              <p className="rider-help-desc">Specify technical audio/visual equipment requirements and greenroom catering. Confirmed clients view these details instantly inside their portal.</p>

              {riderSavedMessage && (
                <div className="success-banner animate-fade">
                  <span>Riders updated successfully inside database!</span>
                </div>
              )}

              <div className="rider-textareas-grid">
                <div className="field-group">
                  <label htmlFor="technical_rider">Technical Rider Requirements (A/V, Backline, Microphones)</label>
                  <textarea
                    id="technical_rider"
                    rows={8}
                    value={technicalRider}
                    onChange={e => setTechnicalRider(e.target.value)}
                    placeholder="Enter stage dimensions, microphone channels layout, and instrument requests..."
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="hospitality_rider">Hospitality Rider Requirements (Catering, Dressing Rooms)</label>
                  <textarea
                    id="hospitality_rider"
                    rows={8}
                    value={hospitalityRider}
                    onChange={e => setHospitalityRider(e.target.value)}
                    placeholder="Specify food allergies, beverages, dressing room specifications, hotel rooms..."
                    required
                  />
                </div>
              </div>

              <div className="rider-actions-footer">
                <button type="submit" className="btn btn-primary" disabled={riderSaving}>
                  <Settings className={`w-4 h-4 ${riderSaving ? 'spin' : ''}`} />
                  {riderSaving ? 'Saving Changes...' : 'Save Rider Specifications'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      <style jsx>{`
        .artist-portal-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .portal-header-row {
          margin-bottom: var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-md);
        }

        .header-info-artist {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .artist-header-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold-primary);
          box-shadow: var(--glow-gold);
        }

        /* Tabs Nav */
        .portal-tabs-nav {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-lg);
          overflow-x: auto;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 10px 16px;
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--gold-primary);
        }

        .tab-btn.active {
          color: var(--gold-primary);
          border-bottom-color: var(--gold-primary);
        }

        /* Gig detail cards */
        .gig-detail-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .gig-status-tag {
          font-size: 0.65rem;
          text-transform: uppercase;
          background: rgba(79, 70, 229, 0.08);
          color: var(--gold-primary);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 6px;
          border: 1px solid rgba(79, 70, 229, 0.15);
        }

        .gig-meta-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
        }

        .meta-row-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.825rem;
          color: var(--text-secondary);
        }

        .meta-icon-tiny {
          width: 14px;
          height: 14px;
          color: var(--gold-primary);
        }

        .fee-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Empty panels */
        .empty-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--spacing-xxl) var(--spacing-md);
          border-radius: var(--radius-lg);
          gap: 8px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          color: var(--gold-primary);
          opacity: 0.5;
        }

        /* Calendar workspace styling */
        .calendar-workspace-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .calendar-explanation h3 {
          font-size: 1.15rem;
          color: var(--gold-primary);
          margin-bottom: 4px;
        }

        .calendar-explanation p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .calendar-grid-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-lg);
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
        }

        .calendar-header-month {
          text-align: center;
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-md);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .day-cell-btn {
          aspect-ratio: 1;
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all var(--transition-fast);
        }

        .day-cell-btn.available {
          background: #d1fae5;
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
        }

        .day-cell-btn.available:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
        }

        .day-cell-btn.blocked {
          background: #fee2e2;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #991b1b;
        }

        .day-cell-btn.blocked:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-2px);
        }

        .day-number {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .day-status-indicator {
          font-size: 0.55rem;
          text-transform: uppercase;
          opacity: 0.7;
          margin-top: 2px;
        }

        .empty-day-cell {
          aspect-ratio: 1;
        }

        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.available {
          background: var(--color-success);
        }

        .legend-dot.blocked {
          background: var(--color-error);
        }

        /* Documents & Tables */
        .table-card-wrapper {
          padding: 0;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .portal-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .portal-table th, .portal-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-color);
        }

        .portal-table th {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          font-weight: 600;
        }

        .table-subtext {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .table-badge-status {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .table-badge-status.sent {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .table-badge-status.signed {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .document-link {
          color: var(--gold-primary);
          font-weight: 600;
          cursor: pointer;
        }

        .document-link:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        .text-right {
          text-align: right;
        }

        /* Riders editor form */
        .rider-editor-form {
          padding: var(--spacing-xl);
        }

        .rider-editor-form h3 {
          font-size: 1.25rem;
          color: var(--gold-primary);
          margin-bottom: 4px;
        }

        .rider-help-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .success-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--color-success);
          color: #065f46;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          margin-bottom: var(--spacing-lg);
          font-weight: 500;
        }

        .rider-textareas-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .rider-textareas-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .rider-actions-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          padding-top: var(--spacing-md);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
