'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist, ArtistTrack, Booking, extractYouTubeId } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Music, Award, Calendar, MapPin, FileText, Play, Pause, ChevronLeft, ChevronRight,
  Volume2, Camera, Video, Edit2, Trash2, X, Upload, Plus, ExternalLink, Globe, Sparkles, Check
} from 'lucide-react';

// Default curated YouTube showcase tracks when an artist hasn't customized their tracklist yet
const DEFAULT_SHOWCASE_BY_CATEGORY: Record<string, ArtistTrack[]> = {
  'Reggae Artists': [
    { id: 'def-1', title: 'Live Headline Festival Performance Reel', subtitle: 'Official Reggae Showcase • Full Band Set', youtube_url: 'https://www.youtube.com/watch?v=5E4ZBSInqUU', duration: '4:12' },
    { id: 'def-2', title: 'Acoustic & Lovers Rock Sessions (Live)', subtitle: 'Intimate Stage Arrangement', youtube_url: 'https://www.youtube.com/watch?v=69RdQFDuYPI', duration: '3:48' },
  ],
  'Dancehall Artists': [
    { id: 'def-1', title: 'Mainstage Arena & Festival Headline Set', subtitle: 'High-Energy Live Performance Reel', youtube_url: 'https://www.youtube.com/watch?v=bM7SZ5SBzyY', duration: '3:35' },
    { id: 'def-2', title: 'Official Club & Sound System Showcase', subtitle: 'International Tour Highlights', youtube_url: 'https://www.youtube.com/watch?v=3AtDnEC4zak', duration: '3:50' },
  ],
  default: [
    { id: 'def-1', title: 'Official Live Performance & Tour Reel', subtitle: 'Showtime Global Agency Showcase', youtube_url: 'https://www.youtube.com/watch?v=5E4ZBSInqUU', duration: '4:05' },
  ]
};

const SOCIAL_PLATFORMS = ['Instagram', 'Spotify', 'YouTube', 'TikTok', 'Apple Music', 'SoundCloud'] as const;

function formatCompactCount(n: number): string {
  if (!n || isNaN(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

export default function ArtistProfilePage() {
  return (
    <Suspense fallback={null}>
      <ArtistProfile />
    </Suspense>
  );
}

function ArtistProfile() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') || '';
  const { hasPermission, isAdmin, isStaff } = useAuth();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [artistBookings, setArtistBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Media & YouTube Showcase player state
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [showEmbedPlayer, setShowEmbedPlayer] = useState<boolean>(false);

  // Interactive Calendar month offset (0 = current month, +1 = next month, etc.)
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const displayDate = new Date();
  displayDate.setDate(1);
  displayDate.setMonth(displayDate.getMonth() + calMonthOffset);
  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth(); // 0-indexed
  const monthName = displayDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Dialog Refs
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);

  // Active tab inside Edit Profile Modal
  const [editModalTab, setEditModalTab] = useState<'overview' | 'showcase' | 'socials' | 'calendar' | 'riders'>('overview');

  // Edit form state
  const [stageName, setStageName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [category, setCategory] = useState('');
  const [genre, setGenre] = useState('');
  const [location, setLocation] = useState('Jamaica');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'Available' | 'Booked' | 'On Tour' | 'On Hold'>('Available');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Active' | 'Inactive'>('Active');
  const [techRider, setTechRider] = useState('');
  const [hospRider, setHospRider] = useState('');

  // Editable Showcase Tracks (YouTube links)
  const [showcaseTracks, setShowcaseTracks] = useState<ArtistTrack[]>([]);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackSubtitle, setNewTrackSubtitle] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('');

  // Editable Social Footprint
  const [socialsEdit, setSocialsEdit] = useState<Record<string, { url: string; followers: number }>>({});
  const [newSocialPlatform, setNewSocialPlatform] = useState('TikTok');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialFollowers, setNewSocialFollowers] = useState('');

  // Quick date input for calendar blocking
  const [customBlockDate, setCustomBlockDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saveSuccessToast, setSaveSuccessToast] = useState('');

  const canManage = isAdmin || isStaff || hasPermission('manage_artists') || hasPermission('update_profile') || hasPermission('manage_artist_profiles');

  const populateFormFromArtist = (data: Artist) => {
    setStageName(data.stage_name);
    setLegalName(data.legal_name || data.stage_name);
    setCategory(data.category);
    setGenre(data.genre);
    setLocation(data.location || 'Jamaica');
    setBio(data.bio);
    setProfileImage(data.profile_image);
    setCoverImage(data.cover_image);
    setBookingStatus(data.booking_status);
    setAvailabilityStatus(data.availability_status);
    setTechRider(data.technical_rider || '');
    setHospRider(data.hospitality_rider || '');

    const defaultTracks = DEFAULT_SHOWCASE_BY_CATEGORY[data.category] || DEFAULT_SHOWCASE_BY_CATEGORY.default;
    setShowcaseTracks(
      data.showcase_tracks && data.showcase_tracks.length > 0
        ? data.showcase_tracks
        : defaultTracks
    );
    setSocialsEdit(data.socials ? { ...data.socials } : {
      Instagram: { url: '', followers: 0 },
      Spotify: { url: '', followers: 0 },
      YouTube: { url: '', followers: 0 },
    });
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    
    const loadArtistData = async () => {
      try {
        const [data, allBookings] = await Promise.all([
          db.getArtistById(id),
          db.getBookings()
        ]);
        if (data) {
          setArtist(data);
          const dates = await db.getArtistAvailability(data.id);
          setBlockedDates(dates);
          setArtistBookings(
            allBookings.filter(b =>
              b.artist_id === data.id ||
              (b.artists && b.artists.some(item => item.artist_id === data.id))
            )
          );
          populateFormFromArtist(data);
        }
      } catch (err) {
        console.error('Failed to load artist:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadArtistData();
  }, [id]);

  // Dialog Backdrop Click Light Dismiss Fallback
  useEffect(() => {
    const editDialog = editDialogRef.current;
    const deleteDialog = deleteDialogRef.current;

    const handleBackdropClick = (dialog: HTMLDialogElement) => (event: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          dialog.close();
        }
      }
    };

    const editListener = editDialog ? handleBackdropClick(editDialog) : null;
    const deleteListener = deleteDialog ? handleBackdropClick(deleteDialog) : null;

    if (editDialog && editListener) editDialog.addEventListener('click', editListener);
    if (deleteDialog && deleteListener) deleteDialog.addEventListener('click', deleteListener);

    return () => {
      if (editDialog && editListener) editDialog.removeEventListener('click', editListener);
      if (deleteDialog && deleteListener) deleteDialog.removeEventListener('click', deleteListener);
    };
  }, [artist]);

  const openEditModalOnTab = (tab: 'overview' | 'showcase' | 'socials' | 'calendar' | 'riders') => {
    if (artist) populateFormFromArtist(artist);
    setEditModalTab(tab);
    setFormError('');
    editDialogRef.current?.showModal();
  };

  // File Upload Handlers
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a YouTube Track inside modal
  const handleAddShowcaseTrack = () => {
    if (!newTrackUrl.trim()) {
      setFormError('Please paste a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...).');
      return;
    }
    const ytId = extractYouTubeId(newTrackUrl);
    if (!ytId) {
      setFormError('Could not recognize a valid YouTube video ID from that link. Please check the URL.');
      return;
    }
    setFormError('');
    const track: ArtistTrack = {
      id: 'trk-' + Math.random().toString(36).slice(2, 8),
      title: newTrackTitle.trim() || `${stageName || 'Artist'} — Official Performance Showcase`,
      subtitle: newTrackSubtitle.trim() || 'Official YouTube Audio / Video Showcase',
      youtube_url: newTrackUrl.trim(),
      duration: newTrackDuration.trim() || '3:30',
    };
    setShowcaseTracks(prev => [...prev, track]);
    setNewTrackTitle('');
    setNewTrackSubtitle('');
    setNewTrackUrl('');
    setNewTrackDuration('');
  };

  const handleRemoveShowcaseTrack = (trackId: string) => {
    setShowcaseTracks(prev => prev.filter(t => t.id !== trackId));
  };

  // Add a Social Platform inside modal
  const handleAddSocialPlatform = () => {
    const plat = newSocialPlatform.trim();
    if (!plat) return;
    setSocialsEdit(prev => ({
      ...prev,
      [plat]: {
        url: newSocialUrl.trim(),
        followers: Number(newSocialFollowers.replace(/,/g, '')) || 0,
      }
    }));
    setNewSocialUrl('');
    setNewSocialFollowers('');
  };

  const handleRemoveSocialPlatform = (plat: string) => {
    setSocialsEdit(prev => {
      const copy = { ...prev };
      delete copy[plat];
      return copy;
    });
  };

  // Toggle Calendar Date (Available <-> Blocked/Locked)
  const handleToggleCalendarDate = async (dateStr: string) => {
    if (!artist || !canManage) return;
    try {
      const updatedDates = await db.toggleArtistDate(artist.id, dateStr);
      setBlockedDates([...updatedDates]);
      setSaveSuccessToast(
        updatedDates.includes(dateStr)
          ? `Locked ${dateStr} on ${artist.stage_name}'s calendar`
          : `Marked ${dateStr} as Available`
      );
      setTimeout(() => setSaveSuccessToast(''), 2600);
    } catch (err) {
      console.error('Failed to toggle date:', err);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!stageName.trim()) {
      setFormError('Stage Name is required');
      return;
    }

    // Filter out empty 0-follower social entries if no URL and 0 followers
    const cleanedSocials: Record<string, { url: string; followers: number }> = {};
    Object.entries(socialsEdit).forEach(([plat, val]) => {
      if (val && (val.followers > 0 || (val.url && val.url.trim().length > 0))) {
        cleanedSocials[plat] = {
          url: val.url?.trim() || '',
          followers: Number(val.followers) || 0,
        };
      }
    });

    try {
      const updated = await db.updateArtistProfile(id, {
        stage_name: stageName,
        legal_name: legalName,
        category,
        genre: genre,
        location: location.trim() || 'Jamaica',
        bio: bio,
        profile_image: profileImage,
        cover_image: coverImage,
        booking_status: bookingStatus,
        availability_status: availabilityStatus,
        technical_rider: techRider,
        hospitality_rider: hospRider,
        showcase_tracks: showcaseTracks,
        featured_youtube_url: showcaseTracks[0]?.youtube_url || '',
        socials: cleanedSocials,
        blocked_dates: blockedDates,
      });

      setArtist(updated);
      editDialogRef.current?.close();
      setSaveSuccessToast('Talent profile updated and published live!');
      setTimeout(() => setSaveSuccessToast(''), 3200);
    } catch (err) {
      console.error(err);
      setFormError('Failed to save profile changes.');
    }
  };

  const handleDeleteProfileSubmit = async () => {
    try {
      await db.deleteArtist(id);
      deleteDialogRef.current?.close();
      router.push('/talent');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container container">
        <p>Loading artist profile...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--gold-primary);
            font-size: 1.2rem;
          }
        `}</style>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="error-container container">
        <h2>Artist Profile Not Found</h2>
        <p>The talent profile you requested does not exist or has been archived.</p>
        <Link href="/talent" className="btn btn-primary">Back to Directory</Link>
        <style jsx>{`
          .error-container {
            text-align: center;
            padding: var(--spacing-xl) 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // Active showcase tracks for this artist
  const activeTracks: ArtistTrack[] =
    artist.showcase_tracks && artist.showcase_tracks.length > 0
      ? artist.showcase_tracks
      : (DEFAULT_SHOWCASE_BY_CATEGORY[artist.category] || DEFAULT_SHOWCASE_BY_CATEGORY.default);
  const currentTrack = activeTracks[activeTrackIndex] || activeTracks[0];
  const currentVideoId = extractYouTubeId(currentTrack?.youtube_url);

  // Total Social Reach calculation
  const socialEntries = artist.socials ? Object.entries(artist.socials).filter(([, d]) => d && (d.followers > 0 || d.url)) : [];
  const totalSocialReach = socialEntries.reduce((sum, [, d]) => sum + (Number(d.followers) || 0), 0);

  // Calendar rendering math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const formatDayStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const isDateBlocked = (day: number) => blockedDates.includes(formatDayStr(day));

  const getConfirmedBookingForDay = (day: number) => {
    const dStr = formatDayStr(day);
    return artistBookings.find(b => b.event_date === dStr && b.status !== 'Cancelled');
  };

  return (
    <div className="artist-profile-viewport luxury-bg">
      {saveSuccessToast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            color: '#fff',
            padding: '0.75rem 1.15rem',
            borderRadius: 10,
            boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <Check className="w-4 h-4 text-amber-400" />
          <span>{saveSuccessToast}</span>
        </div>
      )}

      {/* 1. HERO COVER BANNER */}
      <section className="profile-hero-banner" style={{ backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.75) 100%), url(${artist.cover_image})` }}>
        <div className="container hero-inner-alignment">
          <Link href="/talent" className="back-link">
            <ChevronLeft className="w-4 h-4" /> Back to Directory
          </Link>
          
          <div className="hero-artist-info">
            <span className="artist-category-tag">{artist.category}</span>
            <h1 className="artist-stage-name">{artist.stage_name}</h1>
            <div className="artist-meta-row">
              <span className="meta-item"><MapPin className="meta-icon" /> {artist.location || 'Jamaica'}</span>
              <span className="meta-item"><Music className="meta-icon" /> {artist.genre}</span>
              <span className="meta-item status-badge">
                <span className="dot"></span> {artist.booking_status}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROFILE GRID BODY */}
      <section className="profile-grid-section container">
        <div className="profile-layout-split">
          
          {/* Main Content Column */}
          <div className="profile-main-col">
            {/* Biography */}
            <div className="luxury-card card-padding">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: 10 }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Biography</h2>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEditModalOnTab('overview')}
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold-primary)', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Bio
                  </button>
                )}
              </div>
              <p className="profile-bio-text">{artist.bio}</p>
            </div>

            {/* Featured Audio & Video Showcase (YouTube Music / Video EPK) */}
            <div className="luxury-card card-padding media-showcase-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: 10 }}>
                <div>
                  <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Featured Audio &amp; Video Showcase</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Official performance reels, live festival sets &amp; YouTube music streams
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEditModalOnTab('showcase')}
                    style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'var(--gold-primary)', borderRadius: 6, padding: '5px 11px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Video className="w-3.5 h-3.5" /> Manage YouTube Links
                  </button>
                )}
              </div>

              {/* Active YouTube Embed or Interactive Showcase Bar */}
              {currentTrack && (
                <div style={{ marginBottom: '1.25rem' }}>
                  {showEmbedPlayer && currentVideoId ? (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', background: '#000', boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }}>
                      <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&rel=0&modestbranding=1`}
                          title={currentTrack.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{currentTrack.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{currentTrack.subtitle || artist.stage_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <a
                            href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                          >
                            Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setShowEmbedPlayer(false)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            Minimize
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="audio-player-container glassmorphism" style={{ cursor: 'pointer' }} onClick={() => setShowEmbedPlayer(true)}>
                      <button 
                        type="button"
                        className="audio-play-btn" 
                        onClick={(e) => { e.stopPropagation(); setShowEmbedPlayer(true); }}
                        aria-label="Play YouTube Showcase"
                      >
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                      <div className="player-track-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="track-title">{currentTrack.title}</span>
                          <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 12, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontWeight: 600 }}>
                            ▶ YouTube Stream
                          </span>
                        </div>
                        <span className="track-artist">{currentTrack.subtitle || `${artist.stage_name} • Official Showcase`}</span>
                        <div className="player-progress-bar">
                          <div className="progress-track-bg">
                            <div className="progress-fill" style={{ width: '38%' }}></div>
                          </div>
                          <span className="time-duration">{currentTrack.duration || 'LIVE'}</span>
                        </div>
                      </div>
                      <div className="player-volume" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {currentVideoId && (
                          <a
                            href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open directly on YouTube"
                            style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Volume2 className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tracklist / YouTube Showcase Selector */}
              {activeTracks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: artist.media && artist.media.length > 0 ? '1.25rem' : 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>
                    Featured Tracks &amp; Live Reels ({activeTracks.length})
                  </div>
                  {activeTracks.map((trk, idx) => {
                    const vid = extractYouTubeId(trk.youtube_url);
                    const isSelected = idx === activeTrackIndex;
                    return (
                      <div
                        key={trk.id || idx}
                        onClick={() => {
                          setActiveTrackIndex(idx);
                          setShowEmbedPlayer(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.85rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${isSelected ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          {vid ? (
                            <div style={{ position: 'relative', width: 64, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`}
                                alt={trk.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play className="w-3.5 h-3.5 text-amber-400" />
                              </div>
                            </div>
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Music className="w-4 h-4 text-amber-400" />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {trk.title}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {trk.subtitle || artist.stage_name}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                          {trk.duration && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {trk.duration}
                            </span>
                          )}
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isSelected && showEmbedPlayer ? '#30d158' : 'var(--gold-primary)', padding: '3px 8px', borderRadius: 6, background: isSelected && showEmbedPlayer ? 'rgba(48,209,88,0.12)' : 'rgba(212,175,55,0.12)' }}>
                            {isSelected && showEmbedPlayer ? 'Playing' : 'Play'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {artist.media && artist.media.length > 0 && (
                <div className="media-gallery-grid">
                  {artist.media.map((med, idx) => {
                    const mediaYtId = med.type !== 'Image' ? extractYouTubeId(med.url) : null;
                    return (
                      <div key={idx} className="media-gallery-item">
                        {med.type === 'Image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={med.url} alt={`${artist.stage_name} gallery`} className="gallery-img" />
                        ) : mediaYtId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${mediaYtId}?rel=0`}
                            title={med.title || `${artist.stage_name} video`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ width: '100%', height: '100%', border: 'none' }}
                          />
                        ) : (
                          <a href={med.url} target="_blank" rel="noopener noreferrer" className="video-thumbnail-placeholder" style={{ textDecoration: 'none' }}>
                            <Play className="w-8 h-8 text-amber-500" />
                            <span>Watch Video Clip</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Performance Riders */}
            <div className="luxury-card card-padding">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: 10 }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Performance Requirements &amp; Riders</h2>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEditModalOnTab('riders')}
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold-primary)', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Riders
                  </button>
                )}
              </div>
              <div className="riders-grid-split">
                <div className="rider-col">
                  <div className="rider-header-row">
                    <FileText className="rider-icon" />
                    <h4>Technical Rider Summary</h4>
                  </div>
                  <p className="rider-body-text">{artist.technical_rider || 'Standard backline requirements apply. Contact representing agent for full rider specifications.'}</p>
                </div>
                <div className="rider-col">
                  <div className="rider-header-row">
                    <FileText className="rider-icon" />
                    <h4>Hospitality Rider Summary</h4>
                  </div>
                  <p className="rider-body-text">{artist.hospitality_rider || 'Standard hospitality catering, greenroom, and lodging specifications apply.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Action / Stats Column */}
          <div className="profile-sidebar-col">
            
            {/* Admin Management controls */}
            {canManage && (
              <div className="luxury-card admin-controls-card animate-fade">
                <h3>Management Controls</h3>
                <p>Edit bio, YouTube music showcase, social footprint, availability calendar, or riders.</p>
                <div className="admin-btn-group">
                  <button 
                    className="btn btn-secondary btn-admin"
                    onClick={() => openEditModalOnTab('overview')}
                  >
                    <Edit2 className="w-4 h-4 mr-2 text-amber-500" /> Edit Full Profile
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.5rem', justifyContent: 'center' }}
                      onClick={() => openEditModalOnTab('showcase')}
                    >
                      <Video className="w-3.5 h-3.5 mr-1 text-amber-500" /> YouTube Music
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.45rem 0.5rem', justifyContent: 'center' }}
                      onClick={() => openEditModalOnTab('socials')}
                    >
                      <Globe className="w-3.5 h-3.5 mr-1 text-amber-500" /> Socials
                    </button>
                  </div>
                  <button 
                    className="btn btn-danger btn-admin"
                    onClick={() => deleteDialogRef.current?.showModal()}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
                  </button>
                </div>
              </div>
            )}

            {/* Booking Action Box */}
            <div className="luxury-card sidebar-action-card">
              <h3>Secure Booking Slot</h3>
              <p>Inquire regarding availability, routing options, and estimated production costs for this artist.</p>
              <Link href={`/book?artistId=${artist.id}`} className="btn btn-primary btn-full-sidebar">
                Book {artist.stage_name}
              </Link>
            </div>

            {/* Social Footprint */}
            <div className="luxury-card stats-sidebar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Social Footprint</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {totalSocialReach > 0 && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold-primary)', fontWeight: 700 }}>
                      {formatCompactCount(totalSocialReach)}+ Reach
                    </span>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openEditModalOnTab('socials')}
                      title="Edit Social Footprint"
                      style={{ background: 'transparent', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold-primary)', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {socialEntries.length > 0 ? (
                <div className="socials-list">
                  {socialEntries.map(([plat, data]) => {
                    const hasUrl = Boolean(data.url && data.url.trim());
                    const formattedUrl = hasUrl
                      ? (/^https?:\/\//i.test(data.url.trim()) ? data.url.trim() : `https://${data.url.trim()}`)
                      : '';
                    return (
                      <div key={plat} className="social-stat-row" style={{ alignItems: 'center' }}>
                        <div className="social-platform-label">
                          {plat === 'Instagram' && <Camera className="w-4 h-4 text-amber-500" />}
                          {plat === 'Spotify' && <Music className="w-4 h-4 text-amber-500" />}
                          {plat === 'TikTok' && <Award className="w-4 h-4 text-amber-500" />}
                          {plat === 'YouTube' && <Video className="w-4 h-4 text-amber-500" />}
                          {!['Instagram', 'Spotify', 'TikTok', 'YouTube'].includes(plat) && <Globe className="w-4 h-4 text-amber-500" />}
                          {hasUrl ? (
                            <a
                              href={formattedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                            >
                              <span>{plat}</span>
                              <ExternalLink className="w-3 h-3 text-amber-500" style={{ opacity: 0.8 }} />
                            </a>
                          ) : (
                            <span>{plat}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="followers-count" title={`${(data.followers || 0).toLocaleString()} followers / listeners`}>
                            {data.followers ? data.followers.toLocaleString() : 'Verified'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted text-sm">Social media footprint verified. Details available on request.</p>
              )}
            </div>

            {/* Live Availability Calendar */}
            <div className="luxury-card calendar-sidebar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Availability Calendar</h3>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEditModalOnTab('calendar')}
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold-primary)', borderRadius: 5, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Calendar className="w-3 h-3" /> Manage Dates
                  </button>
                )}
              </div>
              <p className="calendar-desc">
                {canManage
                  ? 'Admin Mode: Click any date below to toggle Available / Locked status immediately.'
                  : 'Shaded dates represent confirmed bookings or locked tour routing days.'}
              </p>
              
              <div className="calendar-container">
                <div className="calendar-header-month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev - 1)}
                    aria-label="Previous Month"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{monthName}</span>
                    {calMonthOffset !== 0 && (
                      <button
                        type="button"
                        onClick={() => setCalMonthOffset(0)}
                        style={{ background: 'rgba(212,175,55,0.15)', border: 'none', color: 'var(--gold-primary)', borderRadius: 4, padding: '1px 5px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Today
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev + 1)}
                    aria-label="Next Month"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="calendar-weekdays">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="calendar-days-grid">
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <span key={`empty-${idx}`} className="empty-day-cell"></span>;
                    }
                    const dStr = formatDayStr(day);
                    const confirmedBk = getConfirmedBookingForDay(day);
                    const isBlocked = isDateBlocked(day) || Boolean(confirmedBk);
                    return (
                      <span 
                        key={`day-${day}`} 
                        onClick={() => {
                          if (canManage) handleToggleCalendarDate(dStr);
                        }}
                        className={`day-cell ${isBlocked ? 'blocked' : 'available'}`}
                        style={{ cursor: canManage ? 'pointer' : 'default' }}
                        title={
                          confirmedBk
                            ? `Confirmed Gig: ${confirmedBk.event_title} (${confirmedBk.event_country})`
                            : isBlocked
                            ? (canManage ? 'Blocked / Hold — Click to make Available' : 'Booked / Tour Hold')
                            : (canManage ? 'Available — Click to Lock / Block Date' : 'Available for Booking')
                        }
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot available"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot blocked"></span>
                  <span>Booked / Locked</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <style jsx>{`
        .profile-hero-banner {
          height: 380px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding-bottom: 2rem;
        }

        .hero-inner-alignment {
          display: flex;
          flex-direction: column;
          gap: 4rem;
          width: 100%;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          font-weight: 500;
          width: fit-content;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .hero-artist-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .artist-category-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--gold-light);
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .artist-stage-name {
          font-size: clamp(2.5rem, 2rem + 3vw, 4rem);
          font-weight: 700;
          color: #ffffff;
        }

        .artist-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-icon {
          width: 16px;
          height: 16px;
          color: var(--gold-light);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.8rem;
          color: #ffffff;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
          box-shadow: 0 0 6px var(--color-success);
        }

        /* Profile Layout */
        .profile-grid-section {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .profile-layout-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-lg);
        }

        @media (min-width: 1024px) {
          .profile-layout-split {
            grid-template-columns: 1.8fr 1fr;
            gap: 2rem;
          }
        }

        .profile-main-col {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .card-padding {
          padding: var(--spacing-xl);
        }

        .profile-main-col h2 {
          font-size: 1.4rem;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          padding-bottom: 10px;
        }

        .profile-bio-text {
          font-size: 1rem;
          line-height: 1.65;
          color: var(--text-secondary);
        }

        /* Audio Player */
        .audio-player-container {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
          border: 1px solid rgba(212, 175, 55, 0.15);
        }

        .audio-play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gold-gradient);
          border: none;
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform var(--transition-fast);
          box-shadow: 0 4px 10px rgba(212, 175, 55, 0.2);
        }

        .audio-play-btn:hover {
          transform: scale(1.05);
        }

        .player-track-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .track-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .track-artist {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .player-progress-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 4px;
        }

        .progress-track-bg {
          flex-grow: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: var(--gold-primary);
          border-radius: 2px;
        }

        .time-duration {
          font-size: 0.7rem;
          color: var(--text-muted);
          min-width: 60px;
          text-align: right;
        }

        .media-gallery-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .media-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .media-gallery-item {
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 16 / 10;
          border: 1px solid var(--border-color);
        }

        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .gallery-img:hover {
          transform: scale(1.03);
        }

        .video-thumbnail-placeholder {
          background: var(--bg-tertiary);
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .video-thumbnail-placeholder:hover {
          background: var(--bg-card-hover);
        }

        /* Riders Summary */
        .riders-grid-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .riders-grid-split {
            grid-template-columns: 1fr 1fr;
          }
        }

        .rider-col {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .rider-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--spacing-sm);
        }

        .rider-icon {
          width: 16px;
          height: 16px;
          color: var(--gold-primary);
        }

        .rider-col h4 {
          font-size: 0.9rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--text-primary);
        }

        .rider-body-text {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Sidebar content */
        .profile-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .sidebar-action-card {
          text-align: center;
          border-color: rgba(212, 175, 55, 0.35);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
        }

        .sidebar-action-card h3 {
          color: var(--gold-primary);
          margin-bottom: 8px;
        }

        .sidebar-action-card p {
          font-size: 0.85rem;
          margin-bottom: var(--spacing-lg);
        }

        .btn-full-sidebar {
          width: 100%;
        }

        .stats-sidebar-card h3, .calendar-sidebar-card h3 {
          font-size: 1.15rem;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .socials-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .social-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 8px;
        }

        .social-platform-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .followers-count {
          font-weight: 600;
          color: var(--gold-primary);
        }

        /* Calendar Sidebar styling */
        .calendar-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .calendar-container {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .calendar-header-month {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gold-primary);
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .day-cell.available {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .day-cell.blocked {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-decoration: line-through;
        }

        .empty-day-cell {
          aspect-ratio: 1;
        }

        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 12px;
          font-size: 0.7rem;
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

        /* Admin Controls */
        .admin-controls-card {
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.1);
        }

        .admin-controls-card h3 {
          color: #a855f7;
          margin-bottom: 8px;
        }

        .admin-controls-card p {
          font-size: 0.825rem;
          margin-bottom: var(--spacing-md);
        }

        .admin-btn-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-admin {
          width: 100%;
          justify-content: center;
          display: flex;
          align-items: center;
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ff453a;
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: #ff453a;
        }

        /* Dialog Modal Styling */
        dialog.admin-modal {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(12, 10, 23, 0.96);
          backdrop-filter: blur(25px);
          border-radius: var(--radius-lg);
          padding: 2rem;
          color: var(--text-primary);
          max-width: 720px;
          width: 94%;
          margin: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05);
          overflow-y: auto;
          max-height: 90vh;
        }

        dialog.admin-modal::backdrop {
          background-color: rgba(7, 5, 14, 0.75);
          backdrop-filter: blur(8px);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          padding-bottom: 0.75rem;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          color: var(--gold-primary);
        }

        .btn-close-modal {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }

        .btn-close-modal:hover {
          color: var(--color-error);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.15rem;
        }

        @media (min-width: 480px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .form-row-full {
            grid-column: span 2;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-group label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 0.7rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          color: #ffffff;
          font-size: 0.88rem;
          width: 100%;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--gold-primary);
          outline: none;
          background: rgba(255, 255, 255, 0.07);
        }

        .file-upload-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          position: relative;
          cursor: pointer;
        }

        .file-upload-wrapper input[type="file"] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .preview-img-container {
          margin-top: 0.5rem;
          border-radius: var(--radius-sm);
          overflow: hidden;
          width: 100px;
          height: 75px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .error-text {
          color: var(--color-error);
          font-size: 0.85rem;
          font-weight: 550;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .delete-modal-body {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }
      `}</style>

      {/* Edit Profile Modal Dialog — 5-Tab 2026 Agency EPK Editor */}
      <dialog 
        ref={editDialogRef} 
        id="edit-talent-dialog" 
        className="admin-modal" 
        closedby="any"
        aria-labelledby="editDialogTitle"
      >
        <div className="modal-header">
          <div>
            <h3 id="editDialogTitle" style={{ margin: 0 }}>Edit Talent EPK &amp; Profile — {artist.stage_name}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              2026 Agency Press Kit: Manage bio, YouTube showcase links, social footprint, availability &amp; riders
            </p>
          </div>
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={() => editDialogRef.current?.close()}
            aria-label="Close edit profile dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Tab Navigation Bar */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { id: 'overview', label: '1. Overview & Bio' },
            { id: 'showcase', label: '2. YouTube & Audio Showcase' },
            { id: 'socials', label: '3. Social Footprint' },
            { id: 'calendar', label: '4. Availability Calendar' },
            { id: 'riders', label: '5. Riders' },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditModalTab(t.id)}
              style={{
                background: editModalTab === t.id ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${editModalTab === t.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.09)'}`,
                color: editModalTab === t.id ? 'var(--gold-primary)' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.76rem',
                fontWeight: editModalTab === t.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleEditProfileSubmit}>
          {formError && <p className="error-text" style={{ marginBottom: '0.85rem' }}>{formError}</p>}

          {/* TAB 1: OVERVIEW & BIO */}
          {editModalTab === 'overview' && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="editStageNameInput">Stage Name *</label>
                <input 
                  id="editStageNameInput" 
                  type="text" 
                  value={stageName} 
                  onChange={(e) => setStageName(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editLegalNameInput">Legal Name</label>
                <input 
                  id="editLegalNameInput" 
                  type="text" 
                  value={legalName} 
                  onChange={(e) => setLegalName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="editCategorySelect">Category</label>
                <select 
                  id="editCategorySelect" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Reggae Artists">Reggae Artists</option>
                  <option value="Dancehall Artists">Dancehall Artists</option>
                  <option value="DJs">DJs &amp; Sound Systems</option>
                  <option value="Soca Artists">Soca Artists</option>
                  <option value="Afrobeats Artists">Afrobeats Artists</option>
                  <option value="R&B Artists">R&amp;B Artists</option>
                  <option value="Bands">Bands</option>
                  <option value="Hosts">Hosts</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editGenreInput">Genre / Style</label>
                <input 
                  id="editGenreInput" 
                  type="text" 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="editLocationInput">Home Territory / Base</label>
                <input 
                  id="editLocationInput" 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Kingston, Jamaica"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editBookingStatus">Booking Status</label>
                <select 
                  id="editBookingStatus" 
                  value={bookingStatus} 
                  onChange={(e) => setBookingStatus(e.target.value as any)}
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="On Tour">On Tour</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="form-group form-row-full">
                <label htmlFor="editBioInput">Biography Description</label>
                <textarea 
                  id="editBioInput" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProfileImageFileInput">Profile Image Upload / URL</label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="Image URL or upload below"
                  style={{ marginBottom: 6 }}
                />
                <div className="file-upload-wrapper">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Upload from device</span>
                  <input 
                    id="editProfileImageFileInput" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfileImageChange}
                  />
                </div>
                {profileImage && (
                  <div className="preview-img-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profileImage} alt="Profile Preview" className="preview-img" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="editCoverImageFileInput">Cover Banner Image Upload / URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Cover URL or upload below"
                  style={{ marginBottom: 6 }}
                />
                <div className="file-upload-wrapper">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Upload from device</span>
                  <input 
                    id="editCoverImageFileInput" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCoverImageChange}
                  />
                </div>
                {coverImage && (
                  <div className="preview-img-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="Cover Preview" className="preview-img" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE & AUDIO SHOWCASE */}
          {editModalTab === 'showcase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--gold-primary)' }}>YouTube Music &amp; Live Video Showcase:</strong> Paste any YouTube link (e.g. <code>https://www.youtube.com/watch?v=...</code>, <code>https://youtu.be/...</code>, or <code>https://music.youtube.com/watch?v=...</code>). The profile automatically generates thumbnail previews and embeds an interactive player.
              </div>

              {/* Existing Tracks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {showcaseTracks.map((trk, idx) => {
                  const vid = extractYouTubeId(trk.youtube_url);
                  return (
                    <div
                      key={trk.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr auto',
                        gap: '0.75rem',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {vid ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`}
                          alt={trk.title}
                          style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 5 }}
                        />
                      ) : (
                        <div style={{ width: 64, height: 40, borderRadius: 5, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Video className="w-4 h-4 text-amber-400" />
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={trk.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShowcaseTracks(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          placeholder="Track / Performance Title"
                          style={{ padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          value={trk.youtube_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShowcaseTracks(prev => prev.map((item, i) => i === idx ? { ...item, youtube_url: val } : item));
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          style={{ padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--gold-primary)', fontSize: '0.8rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveShowcaseTrack(trk.id)}
                        title="Remove Track"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff453a', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add New YouTube Track Box */}
              <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(212,175,55,0.35)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  + Add New YouTube Music / Performance Link
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Track / Set Title</label>
                    <input
                      type="text"
                      value={newTrackTitle}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      placeholder="e.g. Rockaway (Live at Reggae Sumfest)"
                    />
                  </div>
                  <div className="form-group">
                    <label>YouTube Link (Watch / Share / Shorts URL) *</label>
                    <input
                      type="url"
                      value={newTrackUrl}
                      onChange={(e) => setNewTrackUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle / Event Context</label>
                    <input
                      type="text"
                      value={newTrackSubtitle}
                      onChange={(e) => setNewTrackSubtitle(e.target.value)}
                      placeholder="e.g. Official Music Video • 2026"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={newTrackDuration}
                        onChange={(e) => setNewTrackDuration(e.target.value)}
                        placeholder="e.g. 3:45"
                      />
                      <button
                        type="button"
                        onClick={handleAddShowcaseTrack}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap', padding: '0 1rem', fontSize: '0.8rem' }}
                      >
                        + Add Track
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL FOOTPRINT */}
          {editModalTab === 'socials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--gold-primary)' }}>Verified Social &amp; Streaming Footprint:</strong> Enter the artist&apos;s official profile URL and follower / monthly listener count for each platform. Buyers can click each platform on the public profile to verify reach.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {Object.entries(socialsEdit).map(([plat, data]) => (
                  <div
                    key={plat}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr 150px auto',
                      gap: '0.65rem',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold-primary)' }}>{plat}</div>
                    <input
                      type="text"
                      value={data?.url || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        setSocialsEdit(prev => ({ ...prev, [plat]: { ...prev[plat], url } }));
                      }}
                      placeholder={`https://${plat.toLowerCase().replace(/\s+/g, '')}.com/...`}
                      style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.82rem' }}
                    />
                    <input
                      type="number"
                      min={0}
                      value={data?.followers ?? 0}
                      onChange={(e) => {
                        const followers = Number(e.target.value) || 0;
                        setSocialsEdit(prev => ({ ...prev, [plat]: { ...prev[plat], followers } }));
                      }}
                      placeholder="Followers"
                      style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialPlatform(plat)}
                      title={`Remove ${plat}`}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff453a', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Additional Platform */}
              <div style={{ padding: '0.9rem', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(212,175,55,0.35)', display: 'grid', gridTemplateColumns: '140px 1fr 140px auto', gap: '0.6rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label>Platform</label>
                  <select value={newSocialPlatform} onChange={(e) => setNewSocialPlatform(e.target.value)}>
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="X / Twitter">X / Twitter</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Profile Link URL</label>
                  <input
                    type="text"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Followers / Listeners</label>
                  <input
                    type="number"
                    min={0}
                    value={newSocialFollowers}
                    onChange={(e) => setNewSocialFollowers(e.target.value)}
                    placeholder="e.g. 500000"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSocialPlatform}
                  className="btn btn-primary"
                  style={{ height: 40, padding: '0 0.9rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  + Add / Update
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AVAILABILITY CALENDAR */}
          {editModalTab === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--gold-primary)' }}>Interactive Routing &amp; Blackout Calendar:</strong> Click any date on the calendar below (or pick a date) to lock/block it as unavailable or click again to re-open it. Changes sync immediately with the Artist Hub and public profile.
              </div>

              {/* Quick Date Picker Add */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={customBlockDate}
                  onChange={(e) => setCustomBlockDate(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customBlockDate) {
                      handleToggleCalendarDate(customBlockDate);
                      setCustomBlockDate('');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}
                >
                  Toggle Selected Date
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total Blocked / Hold Dates: <strong style={{ color: 'var(--gold-primary)' }}>{blockedDates.length}</strong>
                </span>
              </div>

              {/* Blocked Dates Pills */}
              {blockedDates.length > 0 && (
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', padding: '0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {blockedDates.map(d => (
                    <span
                      key={d}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 16, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: '0.76rem', fontWeight: 600 }}
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => handleToggleCalendarDate(d)}
                        title="Unblock date"
                        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TECHNICAL & HOSPITALITY RIDERS */}
          {editModalTab === 'riders' && (
            <div className="form-grid">
              <div className="form-group form-row-full">
                <label htmlFor="editTechRiderInput">Technical Rider Summary (FOH, Monitors, Backline &amp; Stage Specs)</label>
                <textarea 
                  id="editTechRiderInput" 
                  value={techRider} 
                  onChange={(e) => setTechRider(e.target.value)} 
                  rows={5}
                  placeholder="Specify console preferences, wireless microphones, IEM channels, and backline requirements..."
                />
              </div>

              <div className="form-group form-row-full">
                <label htmlFor="editHospRiderInput">Hospitality Rider Summary (Dressing Room, Catering, Travel &amp; Security)</label>
                <textarea 
                  id="editHospRiderInput" 
                  value={hospRider} 
                  onChange={(e) => setHospRider(e.target.value)} 
                  rows={5}
                  placeholder="Specify greenroom catering, hotel star rating, ground transport, and guest credentials..."
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => editDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save &amp; Publish Profile
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete Confirmation Modal Dialog */}
      <dialog 
        ref={deleteDialogRef} 
        id="delete-talent-dialog" 
        className="admin-modal delete-modal" 
        closedby="any"
        aria-labelledby="deleteDialogTitle"
      >
        <div className="modal-header">
          <h3 id="deleteDialogTitle" style={{ color: '#ef4444' }}>Delete Talent Profile</h3>
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={() => deleteDialogRef.current?.close()}
            aria-label="Close delete confirmation dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="delete-modal-body">
          <p>Are you sure you want to permanently delete the profile of <strong>{artist.stage_name}</strong> from Showtime Booking roster?</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>This action cannot be undone and will remove all associated metadata, profile riders, and custom image uploads.</p>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => deleteDialogRef.current?.close()}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleDeleteProfileSubmit}
            style={{ padding: '0.5rem 1.25rem' }}
          >
            Delete Permanently
          </button>
        </div>
      </dialog>
    </div>
  );
}
