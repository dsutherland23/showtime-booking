'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, Booking, Contract, Artist } from '@/utils/db';
import { 
  Calendar, FileText, Settings, ShieldAlert, Sparkles, 
  Clock, CheckCircle, Info, MapPin, DollarSign, Award, ChevronRight, 
  ChevronLeft, Users, Download, Printer, Edit3, Eye, Check, X, 
  ShieldCheck, AlertCircle, Plane, Coffee, Volume2, Mic, Music, 
  RefreshCw, Lock, Unlock, ExternalLink, ArrowRight
} from 'lucide-react';

// Rider Preset Templates for instant loading
const RIDER_PRESETS = {
  festival_headliner: {
    technical: `TECHNICAL SPECIFICATIONS (FESTIVAL / STADIUM HEADLINER):
• STAGE DIMENSIONS: Minimum 50ft (W) x 40ft (D) x 5ft (H) with clear 24ft trim height.
• FRONT OF HOUSE CONSOLE: Avid S6L 32D or DiGiCo SD12 (Quantum processing). Dedicated guest engineer profile enabled.
• MICROPHONES: 4 x Shure Axient Digital AD4Q Wireless Handhelds (Beta 58A / KSM9 capsules) with spectrum management.
• IN-EAR MONITORS: 8 x Shure PSM1000 stereo wireless IEM channels + 4 spare bodypacks with ambient mics.
• MONITOR WEDGES: 4 x L-Acoustics 115XT or d&b audiotechnik M2 high-power wedges on stage front.
• BACKLINE RIG:
  - 1 x DW Collector's Series Drum Kit (22" kick, 10"/12"/14"/16" toms, matching snare, Zildjian K-Custom cymbals)
  - 1 x Ampeg SVT-CL Classic Bass Head + 8x10 SVT Cabinet
  - 2 x Yamaha Montage 8 & Motif XF7 keyboards with heavy-duty double-X stands
  - 1 x Pioneer DJ Setup: 2 x CDJ-3000 + 1 x DJM-A9 mixer on dedicated shock-mounted DJ riser
• PRODUCTION FX: 4 x Cryo CO2 jets, 2 x High-output Radiance Hazers (water-based fluid only).`,

    hospitality: `HOSPITALITY & GREENROOM SPECIFICATIONS:
• DRESSING ROOM REQUIREMENTS:
  - 1 x Private air-conditioned Executive Artist Dressing Room (lockable, key provided to Tour Manager).
  - Temperature maintained at strictly 68°F (20°C).
  - Private ensuite bathroom with hot running water, private shower, and clean luxury amenities.
  - 2 x Full-length mirrors, professional lighted makeup vanity, steam iron & ironing board.
  - 8 x Clean, pre-washed black bath towels + 6 stage hand towels.
  - High-speed private Wi-Fi network (credentials posted on wall).
• CATERING & MEAL SCHEDULE:
  - Hot dinner served 90 minutes prior to performance: Organic roasted chicken/salmon, steamed jasmine rice, steamed vegetables.
  - Vegetarian/Gluten-Free option available for 4 band members.
• BEVERAGES & PROVISIONS:
  - 2 x 750ml Bottles of Moët & Chandon Nectar Impérial Rosé or Dom Pérignon (Chilled).
  - 1 x Bottle of Premium Reposado Tequila (Clase Azul or Don Julio 1942).
  - 24 x 500ml Bottles of Alkaline Still Water (Essentia or Fiji) at room temperature.
  - 12 x 500ml Bottles of Chilled Coconut Water (Harmless Harvest).
  - Fresh organic ginger root, fresh cut lemons, 1 jar of raw local Jamaican honey, electric hot water kettle, assorted Twinings herbal teas.
  - 1 x Large organic sliced seasonal fruit platter (papaya, pineapple, berries, watermelon).
• GUEST CREDENTIALS: 15 All-Access VIP laminates, 10 Afterparty access wristbands.`,

    travel: `TRAVEL & GROUND TRANSPORTATION:
• AIR TRAVEL: 2 x First Class / Business Class tickets for Artist and Manager + 6 Economy Premium tickets for band/crew.
• HOTEL ACCOMMODATIONS: 1 x Presidential / Master Suite + 4 Deluxe King rooms in a certified 5-star hotel (Marriott Luxury Collection, Four Seasons, or Ritz-Carlton). Late 4:00 PM checkout guaranteed.
• GROUND VEHICLES: 1 x Dedicated Black Mercedes-Benz Sprinter Executive (tinted windows, Wi-Fi, bottled water) + 1 x Cadillac Escalade SUV with vetted security driver from airport arrival through hotel departure.`
  },

  club_showcase: {
    technical: `TECHNICAL SPECIFICATIONS (CLUB & INDOOR SHOWCASE):
• STAGE: Minimum 24ft (W) x 16ft (D) elevated stage.
• AUDIO: Front of house stereo line-array capable of 115dB continuous with punchy low-end sub-bass.
• MICS: 2 x Shure ULX-D or Axient Digital wireless handheld microphones with fresh lithium batteries.
• DJ BOOTH: 2 x Pioneer CDJ-3000 + 1 x Pioneer DJM-900NXS2 mixer connected to stereo booth monitors (minimum 12" drivers).
• MONITORS: 2 x High-powered floor wedges angled toward center stage + 2 wireless IEM packs.`,

    hospitality: `HOSPITALITY SPECIFICATIONS:
• DRESSING ROOM: Clean, private, secure dressing room with lock and seating for 8 guests.
• BEVERAGES: 1 x Bottle of Premium Champagne, 1 x Bottle of Reposado Tequila, 12 bottles of room-temperature Fiji water, 6 cans of Red Bull.
• REFRESHMENTS: Fresh fruit tray, assortment of potato chips, nuts, clean hand towels.
• PASSES: 8 VIP All-Access wristbands.`,

    travel: `TRAVEL SPECIFICATIONS:
• HOTEL: 1 x Junior Suite + 2 King rooms in 4-star hotel located within 15 minutes of venue.
• TRANSPORTATION: Dedicated private SUV airport transfer and venue escort.`
  }
};

function ArtistPortalContent() {
  const { user, profile, loading: authLoading, isAdmin, isStaff, isArtist } = useAuth();
  const searchParams = useSearchParams();
  const requestedArtistId = searchParams.get('artistId');

  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Portal tabs
  const [activeTab, setActiveTab] = useState<'contracts' | 'riders' | 'schedule' | 'calendar'>('contracts');

  // Contract review / e-signature modal state
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractBooking, setContractBooking] = useState<Booking | null>(null);
  const [contractFilter, setContractFilter] = useState<'all' | 'pending' | 'signed' | 'draft'>('all');
  const [signatureName, setSignatureName] = useState('');
  const [authorizedChecked, setAuthorizedChecked] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signatureSuccess, setSignatureSuccess] = useState(false);

  // Rider editor state
  const [riderSubTab, setRiderSubTab] = useState<'tech' | 'hosp' | 'travel' | 'preview'>('tech');
  const [technicalRider, setTechnicalRider] = useState('');
  const [hospitalityRider, setHospitalityRider] = useState('');
  const [travelRider, setTravelRider] = useState('');
  const [riderSaving, setRiderSaving] = useState(false);
  const [riderSavedMessage, setRiderSavedMessage] = useState(false);

  // Calendar helpers — interactive month navigation
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const displayDate = new Date();
  displayDate.setMonth(displayDate.getMonth() + calMonthOffset);

  const calYear = displayDate.getFullYear();
  const calMonth = displayDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startingDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const monthName = displayDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  // Load Artist Data
  const loadArtistData = useCallback(async (forcedArtistId?: string) => {
    try {
      const artistsList = await db.getArtists();
      setAllArtists(artistsList);

      let targetArtist: Artist | null = null;

      // 1. Only Admin and Staff may inspect other artists via artistId parameter
      const artId = (isAdmin || isStaff) ? (forcedArtistId || requestedArtistId) : null;
      if (artId) {
        targetArtist = artistsList.find(a => a.id === artId) || null;
      }

      // 2. For Artists and Artist Managers, strictly match by their own account
      if (!targetArtist && user) {
        if (user.role === 'Artist') {
          targetArtist = artistsList.find(a => 
            a.id === user.id ||
            a.manager_id === user.id ||
            (profile?.first_name && a.stage_name.toLowerCase().trim() === `${profile.first_name} ${profile.last_name || ''}`.toLowerCase().trim()) ||
            (profile?.first_name && a.stage_name.toLowerCase().trim() === profile.first_name.toLowerCase().trim())
          ) || null;
        } else if (user.role === 'Artist Manager') {
          targetArtist = artistsList.find(a => a.manager_id === user.id) || null;
        }
      }

      // 3. Fallback ONLY for Admin/Staff reviewing the portal
      if (!targetArtist && (isAdmin || isStaff)) {
        targetArtist = artistsList.find(a => a.id === 'art-shenseea') ||
                       artistsList.find(a => a.id === 'art-beenie-man') ||
                       artistsList[0] || null;
      }

      if (targetArtist) {
        setArtistProfile(targetArtist);
        setTechnicalRider(targetArtist.technical_rider || RIDER_PRESETS.festival_headliner.technical);
        setHospitalityRider(targetArtist.hospitality_rider || RIDER_PRESETS.festival_headliner.hospitality);
        setTravelRider(RIDER_PRESETS.festival_headliner.travel);
        setSignatureName(targetArtist.legal_name || targetArtist.stage_name);

        const allBks = await db.getBookings();
        const artistBks = allBks.filter(b => b.artist_id === targetArtist!.id);
        setBookings(artistBks);

        const allCtrs = await db.getContracts();
        const bkIds = artistBks.map(b => b.id);
        // Include contracts directly matching this artist's bookings
        const matchingCtrs = allCtrs.filter(c => bkIds.includes(c.booking_id));
        setContracts(matchingCtrs);

        const availDates = await db.getArtistAvailability(targetArtist.id);
        setBlockedDates(availDates);
      }
    } catch (err) {
      console.error('Error loading artist portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile, requestedArtistId, isAdmin, isStaff]);

  useEffect(() => {
    loadArtistData();
  }, [loadArtistData]);

  // Handle Switch Artist in console (strictly restricted to Admin, Staff, or Artist Manager)
  const handleSwitchArtist = (newArtistId: string) => {
    if (!isAdmin && !isStaff && user?.role !== 'Artist Manager') {
      return;
    }
    setLoading(true);
    loadArtistData(newArtistId);
  };

  // Calendar Day Toggle
  const handleDayClick = async (day: number) => {
    if (!artistProfile) return;
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const nextDates = await db.toggleArtistDate(artistProfile.id, dateStr);
    setBlockedDates(nextDates);
  };

  const isDateBlocked = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return blockedDates.includes(dateStr);
  };

  const getDayBooking = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(b => b.event_date === dateStr);
  };

  // Save riders to database
  const handleSaveRiders = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!artistProfile) return;
    setRiderSaving(true);
    try {
      await db.updateArtistProfile(artistProfile.id, {
        technical_rider: technicalRider,
        hospitality_rider: hospitalityRider
      });
      setRiderSavedMessage(true);
      setTimeout(() => setRiderSavedMessage(false), 3500);
    } catch (err) {
      console.error('Failed to update riders:', err);
    } finally {
      setRiderSaving(false);
    }
  };

  // Load Preset
  const handleLoadPreset = (key: 'festival_headliner' | 'club_showcase') => {
    const p = RIDER_PRESETS[key];
    setTechnicalRider(p.technical);
    setHospitalityRider(p.hospitality);
    setTravelRider(p.travel);
  };

  // Open Contract Modal
  const openContractModal = (ctr: Contract) => {
    setSelectedContract(ctr);
    const bk = bookings.find(b => b.id === ctr.booking_id) || null;
    setContractBooking(bk);
    setSignatureSuccess(false);
    setAuthorizedChecked(false);
  };

  // Execute Digital E-Signature
  const handleExecuteContract = async () => {
    if (!selectedContract || !signatureName.trim() || !authorizedChecked) return;
    setSigning(true);
    try {
      const updated = await db.signContract(selectedContract.id, signatureName.trim());
      setSelectedContract(updated);
      setSignatureSuccess(true);

      // Refresh local states
      const allCtrs = await db.getContracts();
      const bkIds = bookings.map(b => b.id);
      setContracts(allCtrs.filter(c => bkIds.includes(c.booking_id)));

      const allBks = await db.getBookings();
      setBookings(allBks.filter(b => b.artist_id === artistProfile?.id));
    } catch (err) {
      console.error('Failed to sign contract:', err);
    } finally {
      setSigning(false);
    }
  };

  // Check auth permission
  const canAccess = user && (isArtist || isAdmin || isStaff || user.role === 'Artist Manager');

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Connecting to Showtime Artist Hub…</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="luxury-card" style={{ maxWidth: 480, margin: '0 auto', padding: '2.5rem' }}>
          <ShieldAlert style={{ width: 52, height: 52, color: 'var(--gold-primary)', marginBottom: '1.25rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Artist &amp; Management Access</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            This portal is restricted to contracted Showtime artists, talent managers, and executive booking agents.
          </p>
          <a href="/auth/login" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.65rem 1.4rem' }}>
            Sign In with Artist Credentials
          </a>
        </div>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="luxury-card" style={{ maxWidth: 460, margin: '0 auto', padding: '2.5rem' }}>
          <Users style={{ width: 48, height: 48, color: 'var(--gold-primary)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Artist Profile Pending Linking</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Your account is verified as an Artist, but has not yet been linked to an active roster profile. Please contact your assigned Showtime booking agent or administration to complete verification.
          </p>
          {(isAdmin || isStaff) && allArtists.length > 0 ? (
            <select
              onChange={e => handleSwitchArtist(e.target.value)}
              className="select-custom"
              style={{ width: '100%', padding: '0.65rem 1rem', background: '#000', color: '#fff', border: '1px solid var(--gold-primary)', borderRadius: 6 }}
            >
              <option value="">Select a Roster Artist to Preview…</option>
              {allArtists.map(a => (
                <option key={a.id} value={a.id}>{a.stage_name} ({a.category})</option>
              ))}
            </select>
          ) : (
            <a href="/contact" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '0.65rem 1.4rem' }}>
              Contact Booking Desk
            </a>
          )}
        </div>
      </div>
    );
  }

  // Filtered contracts
  const pendingCount = contracts.filter(c => c.status === 'Sent').length;
  const filteredContracts = contracts.filter(c => {
    if (contractFilter === 'pending') return c.status === 'Sent';
    if (contractFilter === 'signed') return c.status === 'Signed';
    if (contractFilter === 'draft') return c.status === 'Draft';
    return true;
  });

  // Calculate tour financials
  const totalTourRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalDepositsPaid = bookings.reduce((sum, b) => sum + (b.deposit_amount || 0), 0);

  return (
    <div className="artist-portal-viewport container luxury-bg">
      
      {/* 2026 Executive Header with Multi-Artist Switcher */}
      <div className="portal-header-row">
        <div className="header-info-artist">
          <div className="avatar-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artistProfile.profile_image} alt={artistProfile.stage_name} className="artist-header-avatar" />
            <span className="live-status-dot" title="Active on Roster" />
          </div>

          <div className="artist-meta-block">
            <div className="badge-cluster">
              <span className="gold-badge">Artist Executive Console</span>
              <span className="category-pill">{artistProfile.category}</span>
              {artistProfile.is_featured && <span className="featured-pill"><Sparkles size={11} /> Headliner</span>}
            </div>
            <h2>{artistProfile.stage_name} Tour Hub</h2>
            <p className="artist-subtitle">
              Legal: {artistProfile.legal_name || artistProfile.stage_name} &bull; Manage live performance routing, execute tour agreements, and enforce technical riders.
            </p>
          </div>
        </div>

        {/* Workspace Quick Switcher strictly for Admins, Staff & Multi-Artist Managers */}
        {(isAdmin || isStaff || (user?.role === 'Artist Manager' && allArtists.filter(a => a.manager_id === user.id).length > 1)) && (
          <div className="header-actions">
            <div className="artist-selector-box">
              <span className="selector-label">Roster Workspace</span>
              <select
                value={artistProfile.id}
                onChange={e => handleSwitchArtist(e.target.value)}
                className="artist-dropdown-select"
              >
                {(isAdmin || isStaff ? allArtists : allArtists.filter(a => a.manager_id === user?.id)).map(a => (
                  <option key={a.id} value={a.id}>{a.stage_name} ({a.category})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary Tab Navigation */}
      <div className="portal-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <FileText size={16} />
          <span>Tour Contracts &amp; Agreements</span>
          {pendingCount > 0 ? (
            <span className="alert-count-pill">{pendingCount} Action</span>
          ) : (
            <span className="count-pill">{contracts.length}</span>
          )}
        </button>

        <button 
          className={`tab-btn ${activeTab === 'riders' ? 'active' : ''}`}
          onClick={() => setActiveTab('riders')}
        >
          <Settings size={16} />
          <span>Rider Management (Audio &amp; Hospitality)</span>
          <span className="verified-pill"><Check size={11} /> Synced</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Music size={16} />
          <span>Tour Schedule &amp; Routing</span>
          <span className="count-pill">{bookings.length} Gigs</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          <span>Availability Calendar</span>
          <span className="count-pill">{blockedDates.length} Blackouts</span>
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="portal-panel-wrapper">
        
        {/* ========================================================================= */}
        {/* TAB 1: TOUR CONTRACTS & DIGITAL E-SIGNATURE                              */}
        {/* ========================================================================= */}
        {activeTab === 'contracts' && (
          <div className="tab-slide-panel animate-fade">
            
            {/* Metric Summary Cards */}
            <div className="metrics-summary-grid">
              <div className="metric-card">
                <span className="metric-label">Guaranteed Tour Value</span>
                <span className="metric-val">${totalTourRevenue.toLocaleString()} <small>USD</small></span>
                <span className="metric-sub">Gross contracted fees across all stops</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Deposits Received</span>
                <span className="metric-val gold-text">${totalDepositsPaid.toLocaleString()} <small>USD</small></span>
                <span className="metric-sub">Secured via escrow / bank wires</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Executed Agreements</span>
                <span className="metric-val green-text">{contracts.filter(c => c.status === 'Signed').length} of {contracts.length}</span>
                <span className="metric-sub">Legally bound &amp; rider compliant</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Action Required</span>
                <span className="metric-val amber-text">{pendingCount}</span>
                <span className="metric-sub">Awaiting artist digital e-signature</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="table-controls-bar">
              <div className="filter-pill-cluster">
                <button 
                  onClick={() => setContractFilter('all')} 
                  className={`pill-btn ${contractFilter === 'all' ? 'active' : ''}`}
                >
                  All Agreements ({contracts.length})
                </button>
                <button 
                  onClick={() => setContractFilter('pending')} 
                  className={`pill-btn ${contractFilter === 'pending' ? 'active' : ''}`}
                >
                  Needs Signature ({pendingCount})
                </button>
                <button 
                  onClick={() => setContractFilter('signed')} 
                  className={`pill-btn ${contractFilter === 'signed' ? 'active' : ''}`}
                >
                  Signed &amp; Executed ({contracts.filter(c => c.status === 'Signed').length})
                </button>
                <button 
                  onClick={() => setContractFilter('draft')} 
                  className={`pill-btn ${contractFilter === 'draft' ? 'active' : ''}`}
                >
                  Drafts Under Review
                </button>
              </div>
            </div>

            {/* Contracts Table */}
            {filteredContracts.length > 0 ? (
              <div className="luxury-card table-card-wrapper">
                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Agreement &amp; Tour Event</th>
                        <th>Promoter / Contracting Client</th>
                        <th>Guaranteed Fee</th>
                        <th>Deposit (50%)</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map(ctr => {
                        const bk = bookings.find(b => b.id === ctr.booking_id);
                        const isPending = ctr.status === 'Sent';

                        return (
                          <tr key={ctr.id} className={isPending ? 'pending-highlight-row' : ''}>
                            <td>
                              <div className="agreement-title-cell">
                                <strong>{bk?.event_title || `Tour Contract #${ctr.id.slice(-6)}`}</strong>
                                <span className="agreement-id-sub">Contract ID: {ctr.id} &bull; Date: {bk?.event_date || 'TBD'}</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="client-name-text">{bk?.client_name || 'Promoter Consortium'}</span>
                                <span className="venue-sub-text">{bk?.event_venue || 'Arena TBD'}, {bk?.event_country || 'USA'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="fee-text">${(bk?.total_amount || 0).toLocaleString()} USD</span>
                            </td>
                            <td>
                              <span className="deposit-text">${(bk?.deposit_amount || 0).toLocaleString()} USD</span>
                            </td>
                            <td>
                              {ctr.status === 'Signed' && (
                                <span className="badge-status signed">
                                  <Check size={11} /> Executed &bull; {ctr.signed_at ? new Date(ctr.signed_at).toLocaleDateString() : 'Active'}
                                </span>
                              )}
                              {ctr.status === 'Sent' && (
                                <span className="badge-status pending">
                                  <AlertCircle size={11} /> Action Required
                                </span>
                              )}
                              {ctr.status === 'Draft' && (
                                <span className="badge-status draft">
                                  <Clock size={11} /> Legal Review
                                </span>
                              )}
                            </td>
                            <td className="text-right">
                              {isPending ? (
                                <button
                                  onClick={() => openContractModal(ctr)}
                                  className="btn-action-primary"
                                >
                                  <Edit3 size={13} /> Review &amp; E-Sign
                                </button>
                              ) : (
                                <button
                                  onClick={() => openContractModal(ctr)}
                                  className="btn-action-secondary"
                                >
                                  <Eye size={13} /> View Agreement
                                </button>
                              )}
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
                <h3>No Agreements Match Criteria</h3>
                <p>No tour contracts match the selected status filter for {artistProfile.stage_name}.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RIDER MANAGEMENT (AUDIO, LIGHTING, HOSPITALITY & TRAVEL)           */}
        {/* ========================================================================= */}
        {activeTab === 'riders' && (
          <div className="tab-slide-panel animate-fade">
            
            {/* Sub-Tabs for Rider Categories */}
            <div className="rider-subtabs-bar">
              <div className="subtabs-cluster">
                <button 
                  onClick={() => setRiderSubTab('tech')}
                  className={`subtab-pill ${riderSubTab === 'tech' ? 'active' : ''}`}
                >
                  <Volume2 size={14} /> 1. Technical Audio &amp; Backline
                </button>
                <button 
                  onClick={() => setRiderSubTab('hosp')}
                  className={`subtab-pill ${riderSubTab === 'hosp' ? 'active' : ''}`}
                >
                  <Coffee size={14} /> 2. Hospitality &amp; Greenroom
                </button>
                <button 
                  onClick={() => setRiderSubTab('travel')}
                  className={`subtab-pill ${riderSubTab === 'travel' ? 'active' : ''}`}
                >
                  <Plane size={14} /> 3. Travel &amp; Ground Logistics
                </button>
                <button 
                  onClick={() => setRiderSubTab('preview')}
                  className={`subtab-pill ${riderSubTab === 'preview' ? 'active' : ''}`}
                >
                  <FileText size={14} /> 4. Branded Promoter View
                </button>
              </div>

              {/* Template Presets Loader */}
              <div className="preset-loader-box">
                <span className="preset-label">Load Industry Preset:</span>
                <button 
                  type="button" 
                  onClick={() => handleLoadPreset('festival_headliner')} 
                  className="btn-preset"
                >
                  Stadium Headliner
                </button>
                <button 
                  type="button" 
                  onClick={() => handleLoadPreset('club_showcase')} 
                  className="btn-preset"
                >
                  Club / Showcase
                </button>
              </div>
            </div>

            {riderSavedMessage && (
              <div className="success-banner animate-fade">
                <CheckCircle size={18} />
                <span>Rider specifications successfully updated and synced with talent buyer database!</span>
              </div>
            )}

            {/* Sub-panel 1: Technical Rider */}
            {riderSubTab === 'tech' && (
              <div className="luxury-card rider-card-editor animate-fade">
                <div className="rider-editor-header">
                  <div>
                    <h3>Technical Audio, Stage &amp; Backline Rider</h3>
                    <p>Specify Front of House audio consoles, wireless microphone frequencies, IEM channels, and backline instrumentation.</p>
                  </div>
                  <button onClick={() => handleSaveRiders()} className="btn btn-primary" disabled={riderSaving}>
                    <Settings className={`w-4 h-4 ${riderSaving ? 'spin' : ''}`} />
                    {riderSaving ? 'Syncing...' : 'Save Technical Specifications'}
                  </button>
                </div>

                <div className="field-group">
                  <textarea
                    rows={16}
                    value={technicalRider}
                    onChange={e => setTechnicalRider(e.target.value)}
                    className="code-textarea"
                    placeholder="Enter stage dimensions, microphone channels layout, and instrument requests..."
                  />
                </div>
              </div>
            )}

            {/* Sub-panel 2: Hospitality Rider */}
            {riderSubTab === 'hosp' && (
              <div className="luxury-card rider-card-editor animate-fade">
                <div className="rider-editor-header">
                  <div>
                    <h3>Hospitality, Greenroom &amp; Catering Rider</h3>
                    <p>Specify dressing room climate, private ensuite amenities, hot meal schedule, organic beverages, and guest passes.</p>
                  </div>
                  <button onClick={() => handleSaveRiders()} className="btn btn-primary" disabled={riderSaving}>
                    <Settings className={`w-4 h-4 ${riderSaving ? 'spin' : ''}`} />
                    {riderSaving ? 'Syncing...' : 'Save Hospitality Specifications'}
                  </button>
                </div>

                <div className="field-group">
                  <textarea
                    rows={16}
                    value={hospitalityRider}
                    onChange={e => setHospitalityRider(e.target.value)}
                    className="code-textarea"
                    placeholder="Specify food allergies, beverages, dressing room specifications, hotel rooms..."
                  />
                </div>
              </div>
            )}

            {/* Sub-panel 3: Travel Rider */}
            {riderSubTab === 'travel' && (
              <div className="luxury-card rider-card-editor animate-fade">
                <div className="rider-editor-header">
                  <div>
                    <h3>Travel, Hotel &amp; Ground Transportation Logistics</h3>
                    <p>Enforce business/first class flights, 5-star hotel suite standards, and dedicated executive Sprinter security transport.</p>
                  </div>
                  <button onClick={() => handleSaveRiders()} className="btn btn-primary" disabled={riderSaving}>
                    <Settings className={`w-4 h-4 ${riderSaving ? 'spin' : ''}`} />
                    {riderSaving ? 'Syncing...' : 'Save Travel Specifications'}
                  </button>
                </div>

                <div className="field-group">
                  <textarea
                    rows={16}
                    value={travelRider}
                    onChange={e => setTravelRider(e.target.value)}
                    className="code-textarea"
                    placeholder="Specify flight allowances, hotel suite requirements, ground transport..."
                  />
                </div>
              </div>
            )}

            {/* Sub-panel 4: Branded Promoter View / PDF Export */}
            {riderSubTab === 'preview' && (
              <div className="luxury-card promoter-view-card animate-fade">
                <div className="promoter-view-toolbar">
                  <div>
                    <span className="gold-badge">Promoter Packet Preview</span>
                    <h3>Official Showtime Talent Rider &bull; {artistProfile.stage_name}</h3>
                    <p>This is the compiled document transmitted to festival directors, stadium engineers, and talent buyers upon contract execution.</p>
                  </div>
                  <button onClick={() => window.print()} className="btn btn-secondary">
                    <Printer size={15} /> Print / Export PDF
                  </button>
                </div>

                <div className="official-rider-packet printable-area">
                  <div className="packet-header">
                    <div>
                      <h2>SHOWTIME ENTERTAINMENT TALENT AGENCY</h2>
                      <p className="packet-sub">EXECUTIVE TECHNICAL &amp; HOSPITALITY RIDER AGREEMENT</p>
                    </div>
                    <div className="packet-badge-box">
                      <span className="badge-artist">{artistProfile.stage_name}</span>
                      <span className="badge-rev">2026 OFFICIAL TOUR REVISION</span>
                    </div>
                  </div>

                  <div className="packet-section">
                    <h4>SECTION 1: TECHNICAL, SOUND &amp; BACKLINE REQUIREMENTS</h4>
                    <pre className="packet-pre">{technicalRider}</pre>
                  </div>

                  <div className="packet-section">
                    <h4>SECTION 2: HOSPITALITY, GREENROOM &amp; CATERING SPECIFICATIONS</h4>
                    <pre className="packet-pre">{hospitalityRider}</pre>
                  </div>

                  <div className="packet-section">
                    <h4>SECTION 3: TRAVEL &amp; ACCOMMODATIONS LOGISTICS</h4>
                    <pre className="packet-pre">{travelRider}</pre>
                  </div>

                  <div className="packet-footer">
                    <p>All provisions above are integral parts of the Showtime Entertainment Master Performance Agreement. Any modifications require written approval from Artist Management prior to load-in.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PERFORMANCE SCHEDULE & TOUR ROUTING                                */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <div className="tab-slide-panel animate-fade">
            {bookings.length > 0 ? (
              <div className="grid-2">
                {bookings.map(bk => (
                  <div key={bk.id} className="luxury-card gig-detail-card">
                    <div className="gig-header">
                      <div>
                        <span className={`gig-status-tag ${bk.status.toLowerCase().replace(/\s+/g, '-')}`}>{bk.status}</span>
                        <h3>{bk.event_title}</h3>
                      </div>
                      <span className="gig-date-badge">{bk.event_date}</span>
                    </div>

                    <div className="gig-meta-info">
                      <div className="meta-row-item">
                        <MapPin className="meta-icon-tiny" />
                        <div><strong>Venue / City:</strong> <span>{bk.event_venue} ({bk.event_country})</span></div>
                      </div>
                      <div className="meta-row-item">
                        <Users className="meta-icon-tiny" />
                        <div><strong>Contracting Buyer:</strong> <span>{bk.client_name}</span></div>
                      </div>
                      {bk.attendance && (
                        <div className="meta-row-item">
                          <Award className="meta-icon-tiny" />
                          <div><strong>Projected Capacity:</strong> <span>{bk.attendance}</span></div>
                        </div>
                      )}
                      <div className="meta-row-item">
                        <DollarSign className="meta-icon-tiny" />
                        <div><strong>Gross Fee:</strong> <span className="fee-text">${bk.total_amount.toLocaleString()} USD</span></div>
                      </div>
                    </div>

                    {bk.technical_rider_notes && (
                      <div className="gig-rider-snippet">
                        <span className="snippet-label">Production Specs:</span>
                        <p>{bk.technical_rider_notes}</p>
                      </div>
                    )}

                    <div className="gig-footer-actions">
                      <button 
                        onClick={() => {
                          const ctr = contracts.find(c => c.booking_id === bk.id);
                          if (ctr) openContractModal(ctr);
                          else setActiveTab('contracts');
                        }}
                        className="btn-link-action"
                      >
                        <FileText size={13} /> View Tour Agreement
                      </button>
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

        {/* ========================================================================= */}
        {/* TAB 4: AVAILABILITY CALENDAR & BLACKOUT MANAGER                          */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="tab-slide-panel animate-fade">
            <div className="luxury-card calendar-workspace-card">
              <div className="calendar-explanation-row">
                <div>
                  <h3>Live Roster Availability &amp; Blackout Manager</h3>
                  <p>Click any date on the calendar to toggle availability. Confirmed gig dates are locked automatically.</p>
                </div>

                <div className="month-stepper">
                  <button onClick={() => setCalMonthOffset(o => o - 1)} className="btn-month-nav" title="Previous Month">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="current-month-label">{monthName}</span>
                  <button onClick={() => setCalMonthOffset(o => o + 1)} className="btn-month-nav" title="Next Month">
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => setCalMonthOffset(0)} className="btn-today">Today</button>
                </div>
              </div>

              <div className="calendar-grid-wrapper">
                <div className="calendar-weekdays">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                <div className="calendar-days-grid">
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <span key={`empty-${idx}`} className="empty-day-cell"></span>;
                    }
                    const isBlocked = isDateBlocked(day);
                    const gig = getDayBooking(day);

                    return (
                      <button 
                        key={`day-${day}`} 
                        className={`day-cell-btn ${gig ? 'gig-booked' : isBlocked ? 'blocked' : 'available'}`}
                        onClick={() => handleDayClick(day)}
                        title={gig ? `Confirmed: ${gig.event_title}` : isBlocked ? 'Click to make Available' : 'Click to block out date'}
                      >
                        <span className="day-number">{day}</span>
                        {gig ? (
                          <span className="day-status-indicator gig-pill">Tour Gig</span>
                        ) : (
                          <span className="day-status-indicator">{isBlocked ? 'Blocked' : 'Open'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot available"></span>
                  <span>Open for Promoters</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot blocked"></span>
                  <span>Artist Blackout / Rest</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot gig-booked-dot"></span>
                  <span>Confirmed Tour Gig</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* EXECUTIVE CONTRACT MODAL & E-SIGNATURE FLOW                               */}
      {/* ========================================================================= */}
      {selectedContract && (
        <div className="modal-backdrop-overlay animate-fade">
          <div className="modal-contract-dialog">
            
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-cluster">
                <FileText size={20} className="gold-text" />
                <div>
                  <h3>Master Performance Engagement Agreement</h3>
                  <span className="modal-contract-id">Document ID: {selectedContract.id} &bull; Effective: {new Date(selectedContract.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedContract(null)} className="btn-close-modal" title="Close Agreement">
                <X size={18} />
              </button>
            </div>

            {/* Agreement Terms Scroll Body */}
            <div className="modal-body agreement-document-scroll printable-area">
              
              <div className="formal-legal-header">
                <h4>SHOWTIME ENTERTAINMENT LLC</h4>
                <p>EXCLUSIVE TALENT PERFORMANCE &amp; STAGE PRODUCTION CONTRACT</p>
              </div>

              <div className="legal-section">
                <strong>1. PARTIES &amp; ENGAGEMENT</strong>
                <p>
                  This Performance Agreement is entered into by and between <strong>Showtime Entertainment LLC</strong> (&ldquo;Agency&rdquo;), representing <strong>{artistProfile.stage_name}</strong> (&ldquo;Artist&rdquo;), and <strong>{contractBooking?.client_name || 'Promoter'}</strong> (&ldquo;Talent Buyer/Promoter&rdquo;).
                </p>
                <div className="contract-specs-box">
                  <div><strong>Event Title:</strong> {contractBooking?.event_title || 'Showtime Stage Production'}</div>
                  <div><strong>Performance Date:</strong> {contractBooking?.event_date || '2026 Scheduled Date'}</div>
                  <div><strong>Venue / Location:</strong> {contractBooking?.event_venue || 'Arena'}, {contractBooking?.event_country || 'USA'}</div>
                  <div><strong>Minimum Set Length:</strong> 75 Minutes Headline Performance</div>
                </div>
              </div>

              <div className="legal-section">
                <strong>2. COMPENSATION &amp; DEPOSIT SCHEDULE</strong>
                <p>Promoter agrees to pay Artist a guaranteed total gross engagement fee of <strong>${(contractBooking?.total_amount || 0).toLocaleString()} USD</strong>.</p>
                <ul>
                  <li><strong>Non-Refundable Deposit (50%):</strong> ${(contractBooking?.deposit_amount || 0).toLocaleString()} USD payable upon execution.</li>
                  <li><strong>Remaining Balance (50%):</strong> ${((contractBooking?.total_amount || 0) - (contractBooking?.deposit_amount || 0)).toLocaleString()} USD payable in guaranteed funds prior to stage call.</li>
                </ul>
              </div>

              <div className="legal-section">
                <strong>3. RIDER COMPLIANCE GUARANTEE</strong>
                <p>
                  Promoter expressly warrants that the Artist Technical Rider (Backline, Front-of-House Console, Wireless Microphones, IEMs) and Hospitality Rider (Dressing Room, Catering, Beverages) will be provided at Promoter&apos;s sole expense without substitution unless authorized in writing.
                </p>
              </div>

              <div className="legal-section">
                <strong>4. EXCLUSIVITY &amp; BLACKOUT RADIUS</strong>
                <p>
                  Artist agrees not to advertise or perform another public ticketed engagement within a sixty (60) mile radius of the venue within thirty (30) days prior to the engagement date.
                </p>
              </div>

              <div className="legal-section">
                <strong>5. FORCE MAJEURE &amp; INCLEMENT WEATHER</strong>
                <p>
                  Neither party shall be liable for failure to appear due to Acts of God, severe weather, governmental regulations, or mechanical airline failures beyond reasonable control.
                </p>
              </div>

              {/* Status & Signature Block */}
              <div className="legal-signature-box">
                {selectedContract.status === 'Signed' ? (
                  <div className="signed-stamp-box">
                    <ShieldCheck size={36} className="green-text" />
                    <div>
                      <h4 className="green-text">Contract Digitally Executed &amp; Legally Binding</h4>
                      <p>Signed by: <strong>{selectedContract.signature_data || artistProfile.legal_name}</strong></p>
                      <p className="stamp-sub">
                        Timestamp: {selectedContract.signed_at ? new Date(selectedContract.signed_at).toLocaleString() : 'Executed'} &bull; Digital Verification: SHA-256 Validated
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pending-signature-action-box">
                    <h4>Digital E-Signature Execution</h4>
                    <p>Enter your full legal name below to bind the artist and talent buyer to the agreement terms.</p>

                    <div className="field-group" style={{ marginTop: '0.8rem' }}>
                      <label>Full Legal Signature Name *</label>
                      <input
                        type="text"
                        value={signatureName}
                        onChange={e => setSignatureName(e.target.value)}
                        placeholder="e.g. Chinsea Linda Lee"
                        className="input-signature"
                      />
                    </div>

                    <label className="checkbox-auth-label">
                      <input 
                        type="checkbox" 
                        checked={authorizedChecked}
                        onChange={e => setAuthorizedChecked(e.target.checked)} 
                      />
                      <span>I confirm that I am legally authorized to execute this tour agreement on behalf of {artistProfile.stage_name}.</span>
                    </label>

                    <div className="modal-actions-bar">
                      <button 
                        onClick={handleExecuteContract} 
                        className="btn btn-primary btn-sign" 
                        disabled={signing || !authorizedChecked || !signatureName.trim()}
                      >
                        <ShieldCheck size={16} />
                        {signing ? 'Executing Signature...' : 'Legally Sign & Execute Agreement'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer">
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={14} /> Print Agreement PDF
              </button>
              <button onClick={() => setSelectedContract(null)} className="btn btn-ghost">
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styled JSX */}
      <style jsx>{`
        .artist-portal-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .portal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
        }

        .header-info-artist {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar-wrapper {
          position: relative;
        }

        .artist-header-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold-primary);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.35);
        }

        .live-status-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #30d158;
          border: 2px solid #000;
        }

        .badge-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .category-pill {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
        }

        .featured-pill {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(212, 175, 55, 0.2);
          color: var(--gold-primary);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .artist-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .artist-selector-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .selector-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .artist-dropdown-select {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: #fff;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          cursor: pointer;
          outline: none;
        }

        .artist-dropdown-select:focus {
          border-color: var(--gold-primary);
        }

        /* Tabs Nav */
        .portal-tabs-nav {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-xl);
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 10px 18px;
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn:hover {
          color: #fff;
        }

        .tab-btn.active {
          color: var(--gold-primary);
          border-bottom-color: var(--gold-primary);
        }

        .count-pill {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          font-size: 0.72rem;
          padding: 1px 7px;
          border-radius: 10px;
        }

        .alert-count-pill {
          background: rgba(255, 159, 10, 0.2);
          color: #ff9f0a;
          font-size: 0.72rem;
          padding: 1px 7px;
          border-radius: 10px;
          font-weight: 700;
          border: 1px solid rgba(255, 159, 10, 0.4);
        }

        .verified-pill {
          background: rgba(48, 209, 88, 0.15);
          color: #30d158;
          font-size: 0.7rem;
          padding: 1px 6px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        /* Metrics Summary Grid */
        .metrics-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1rem;
          margin-bottom: var(--spacing-xl);
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-val {
          font-size: 1.55rem;
          font-weight: 700;
          color: #fff;
        }

        .metric-val small {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .gold-text { color: var(--gold-primary); }
        .green-text { color: #30d158; }
        .amber-text { color: #ff9f0a; }

        .metric-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Table & Controls */
        .table-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-pill-cluster {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pill-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 5px 12px;
          border-radius: 16px;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pill-btn:hover {
          color: #fff;
          border-color: rgba(212, 175, 55, 0.3);
        }

        .pill-btn.active {
          background: rgba(212, 175, 55, 0.18);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
          font-weight: 600;
        }

        .table-card-wrapper {
          padding: 0;
          overflow: hidden;
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
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
          font-weight: 600;
        }

        .pending-highlight-row {
          background: rgba(255, 159, 10, 0.03);
        }

        .agreement-title-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .agreement-id-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .client-name-text {
          font-weight: 500;
          color: #fff;
          display: block;
        }

        .venue-sub-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .fee-text {
          font-weight: 700;
          color: #fff;
        }

        .deposit-text {
          color: var(--gold-primary);
          font-weight: 600;
        }

        .badge-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          white-space: nowrap;
        }

        .badge-status.signed {
          background: rgba(48, 209, 88, 0.12);
          color: #30d158;
          border: 1px solid rgba(48, 209, 88, 0.3);
        }

        .badge-status.pending {
          background: rgba(255, 159, 10, 0.15);
          color: #ff9f0a;
          border: 1px solid rgba(255, 159, 10, 0.4);
          animation: pulse 2s infinite;
        }

        .badge-status.draft {
          background: rgba(161, 161, 170, 0.12);
          color: #a1a1aa;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 159, 10, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255, 159, 10, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 159, 10, 0); }
        }

        .btn-action-primary {
          background: var(--gold-primary);
          color: #07050e;
          border: none;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
        }

        .btn-action-primary:hover {
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
        }

        .btn-action-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-action-secondary:hover {
          border-color: var(--gold-primary);
          color: var(--gold-primary);
        }

        .text-right {
          text-align: right;
        }

        /* Rider Subtabs & Toolbar */
        .rider-subtabs-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .subtabs-cluster {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .subtab-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
        }

        .subtab-pill.active {
          background: rgba(212, 175, 55, 0.15);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
          font-weight: 700;
        }

        .preset-loader-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .preset-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .btn-preset {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .btn-preset:hover {
          border-color: var(--gold-primary);
          color: var(--gold-primary);
        }

        .rider-card-editor {
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .rider-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .code-textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-md);
          padding: 1rem;
          font-family: monospace;
          font-size: 0.85rem;
          color: #e5e5e5;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .code-textarea:focus {
          border-color: var(--gold-primary);
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
        }

        /* Promoter View Packet */
        .promoter-view-card {
          padding: var(--spacing-xl);
        }

        .promoter-view-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .official-rider-packet {
          background: #090712;
          border: 1.5px solid rgba(212, 175, 55, 0.3);
          border-radius: var(--radius-md);
          padding: 2.5rem;
        }

        .packet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--gold-primary);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .packet-header h2 {
          font-size: 1.25rem;
          letter-spacing: 0.08em;
          margin: 0;
          color: var(--gold-primary);
        }

        .packet-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-top: 4px;
        }

        .packet-badge-box {
          text-align: right;
        }

        .badge-artist {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }

        .badge-rev {
          font-size: 0.68rem;
          color: var(--gold-primary);
          letter-spacing: 0.05em;
        }

        .packet-section {
          margin-bottom: 2rem;
        }

        .packet-section h4 {
          font-size: 0.95rem;
          color: var(--gold-primary);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
          margin-bottom: 10px;
        }

        .packet-pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 0.8rem;
          color: #d1d5db;
          line-height: 1.6;
          white-space: pre-wrap;
          margin: 0;
        }

        .packet-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Gigs schedule cards */
        .gig-detail-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .gig-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .gig-status-tag {
          font-size: 0.65rem;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.08);
          color: var(--gold-primary);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 6px;
        }

        .gig-status-tag.confirmed {
          background: rgba(48, 209, 88, 0.15);
          color: #30d158;
        }

        .gig-status-tag.contract-sent {
          background: rgba(255, 159, 10, 0.15);
          color: #ff9f0a;
        }

        .gig-date-badge {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--gold-primary);
          background: rgba(212, 175, 55, 0.1);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(212, 175, 55, 0.25);
          white-space: nowrap;
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
          flex-shrink: 0;
        }

        .gig-rider-snippet {
          background: rgba(255, 255, 255, 0.02);
          border-left: 2px solid var(--gold-primary);
          padding: 8px 12px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .snippet-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--gold-primary);
          display: block;
          margin-bottom: 2px;
        }

        .gig-rider-snippet p {
          margin: 0;
        }

        .gig-footer-actions {
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-link-action {
          background: none;
          border: none;
          color: var(--gold-primary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-link-action:hover {
          text-decoration: underline;
        }

        /* Calendar Workspace */
        .calendar-workspace-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .calendar-explanation-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .month-stepper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: var(--radius-md);
        }

        .btn-month-nav {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .current-month-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--gold-primary);
          min-width: 140px;
          text-align: center;
        }

        .btn-today {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #fff;
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .calendar-grid-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 650px;
          margin: 0 auto;
          width: 100%;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .day-cell-btn {
          aspect-ratio: 1;
          border: none;
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
          background: rgba(48, 209, 88, 0.08);
          border: 1px solid rgba(48, 209, 88, 0.25);
          color: #30d158;
        }

        .day-cell-btn.available:hover {
          background: rgba(48, 209, 88, 0.18);
          transform: translateY(-2px);
        }

        .day-cell-btn.blocked {
          background: rgba(255, 69, 58, 0.1);
          border: 1px solid rgba(255, 69, 58, 0.3);
          color: #ff453a;
        }

        .day-cell-btn.blocked:hover {
          background: rgba(255, 69, 58, 0.2);
          transform: translateY(-2px);
        }

        .day-cell-btn.gig-booked {
          background: rgba(212, 175, 55, 0.2);
          border: 1.5px solid var(--gold-primary);
          color: #fff;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
        }

        .day-number {
          font-size: 1rem;
          font-weight: 700;
        }

        .day-status-indicator {
          font-size: 0.6rem;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .day-status-indicator.gig-pill {
          color: var(--gold-primary);
          font-weight: 800;
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
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .legend-dot.available { background: #30d158; }
        .legend-dot.blocked { background: #ff453a; }
        .legend-dot.gig-booked-dot { background: var(--gold-primary); }

        /* Modal Contract Styles */
        .modal-backdrop-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .modal-contract-dialog {
          background: #0b0816;
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title-cluster {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title-cluster h3 {
          margin: 0;
          font-size: 1.15rem;
          color: #fff;
        }

        .modal-contract-id {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .btn-close-modal {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
        }

        .btn-close-modal:hover { color: #fff; }

        .modal-body {
          padding: 2rem 2.25rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-size: 0.88rem;
          line-height: 1.6;
          color: #d1d5db;
        }

        .formal-legal-header {
          text-align: center;
          border-bottom: 2px solid rgba(212, 175, 55, 0.4);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }

        .formal-legal-header h4 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--gold-primary);
          letter-spacing: 0.08em;
        }

        .formal-legal-header p {
          margin: 4px 0 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        .legal-section strong {
          color: #fff;
          display: block;
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .contract-specs-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 0.82rem;
        }

        .legal-signature-box {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.025);
          border: 1.5px solid rgba(212, 175, 55, 0.3);
          border-radius: var(--radius-md);
        }

        .signed-stamp-box {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .signed-stamp-box h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
        }

        .signed-stamp-box p {
          margin: 0;
          font-size: 0.85rem;
          color: #fff;
        }

        .stamp-sub {
          font-size: 0.75rem !important;
          color: var(--text-muted) !important;
          margin-top: 4px !important;
        }

        .pending-signature-action-box h4 {
          margin: 0 0 4px 0;
          color: var(--gold-primary);
          font-size: 1.05rem;
        }

        .input-signature {
          width: 100%;
          background: rgba(0, 0, 0, 0.6);
          border: 1.5px solid var(--gold-primary);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: #fff;
          font-size: 1rem;
          font-family: serif;
          font-style: italic;
          outline: none;
        }

        .checkbox-auth-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .modal-actions-bar {
          margin-top: 1.25rem;
          display: flex;
          justify-content: flex-end;
        }

        .btn-sign {
          padding: 10px 20px;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.75rem;
          border-top: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.4);
        }

        .success-banner {
          background: rgba(48, 209, 88, 0.12);
          border: 1px solid #30d158;
          color: #30d158;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.25rem;
        }

        .empty-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          border-radius: var(--radius-lg);
          gap: 10px;
          color: var(--text-muted);
        }

        .empty-icon {
          width: 44px;
          height: 44px;
          color: var(--gold-primary);
          opacity: 0.6;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .contract-specs-box {
            grid-template-columns: 1fr;
          }
          .portal-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default function ArtistPortal() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading Artist Hub…</p>
        </div>
      </div>
    }>
      <ArtistPortalContent />
    </Suspense>
  );
}
