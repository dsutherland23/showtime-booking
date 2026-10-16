'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist, ArtistTrack, Booking, extractYouTubeId, getArtistEstimatedPricing, computePriceTierFromFee } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Music, Award, Calendar, MapPin, FileText, Play, Pause, ChevronLeft, ChevronRight,
  Volume2, Camera, Video, Edit2, Trash2, X, Upload, Plus, ExternalLink, Globe, Sparkles, Check, DollarSign
} from 'lucide-react';

// Default curated YouTube showcase tracks when an artist hasn't customized their tracklist yet
const DEFAULT_SHOWCASE_BY_CATEGORY: Record<string, ArtistTrack[]> = {
  'Reggae Artists': [
    { id: 'def-1', title: 'Live Headline Festival Performance Reel', subtitle: 'Official Reggae Showcase • Full Band Set', youtube_url: 'https://www.youtube.com/watch?v=5E4ZBSInqUU', duration: '4:12' },
    { id: 'def-2', title: 'Acoustic & Lovers Rock Sessions (Live)', subtitle: 'Intimate Stage Arrangement', youtube_url: 'https://www.youtube.com/watch?v=69RdQFDuYPI', duration: '3:48' },
  ],
  'Dancehall Artists': [
    { id: 'def-1', title: 'Mainstage Arena & Festival Headline Set', subtitle: 'High-Energy Live Performance Reel', youtube_url: 'https://www.youtube.com/watch?v=69RdQFDuYPI', duration: '3:35' },
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

function parseCoverPosition(pos?: string): { x: number; y: number } {
  if (!pos) return { x: 50, y: 35 };
  const matches = pos.match(/(\d+(?:\.\d+)?)%/g);
  if (matches && matches.length >= 2) {
    const x = Math.min(100, Math.max(0, parseFloat(matches[0])));
    const y = Math.min(100, Math.max(0, parseFloat(matches[1])));
    return { x, y };
  }
  if (pos.includes('top')) return { x: 50, y: 15 };
  if (pos.includes('bottom')) return { x: 50, y: 85 };
  return { x: 50, y: 35 };
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

  // Interactive Header Banner Drag-and-Drop & Alignment state
  const [bannerEditMode, setBannerEditMode] = useState<boolean>(false);
  const [bannerPosX, setBannerPosX] = useState<number>(50);
  const [bannerPosY, setBannerPosY] = useState<number>(35);
  const [bannerZoom, setBannerZoom] = useState<number>(100);
  const [bannerDraftImage, setBannerDraftImage] = useState<string>('');
  const [isDraggingFileOverBanner, setIsDraggingFileOverBanner] = useState<boolean>(false);
  const [isDraggingBannerPan, setIsDraggingBannerPan] = useState<boolean>(false);
  const bannerDragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const heroBannerInputRef = useRef<HTMLInputElement | null>(null);

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
  const [estimatedFee, setEstimatedFee] = useState<string>('90000');
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

  // Editable Showcase Gallery Photos (the image(s) below the YouTube tracks)
  const [mediaGallery, setMediaGallery] = useState<{ type: 'Audio' | 'Video' | 'Image'; url: string; title?: string }[]>([]);
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');

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
    setEstimatedFee(String(getArtistEstimatedPricing(data).fee));
    setBio(data.bio);
    setProfileImage(data.profile_image);
    setCoverImage(data.cover_image);
    setBannerDraftImage(data.cover_image);
    const parsedPos = parseCoverPosition(data.cover_position);
    setBannerPosX(parsedPos.x);
    setBannerPosY(parsedPos.y);
    setBannerZoom(data.cover_zoom || 100);
    setBookingStatus(data.booking_status);
    setAvailabilityStatus(data.availability_status);
    setTechRider(data.technical_rider || '');
    setHospRider(data.hospitality_rider || '');

    const defaultTracks = DEFAULT_SHOWCASE_BY_CATEGORY[data.category] || DEFAULT_SHOWCASE_BY_CATEGORY.default;
    const safeTracks = Array.isArray(data.showcase_tracks) && data.showcase_tracks.length > 0
      ? data.showcase_tracks
      : defaultTracks;
    setShowcaseTracks(safeTracks);

    const safeMedia = Array.isArray(data.media) ? data.media : [];
    setMediaGallery(safeMedia.map(m => ({ ...m })));

    setSocialsEdit(data.socials && typeof data.socials === 'object' && !Array.isArray(data.socials) ? { ...data.socials } : {
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
        const dataUrl = reader.result as string;
        setCoverImage(dataUrl);
        setBannerDraftImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct Hero Banner File Drop / Upload & Interactive Alignment Handlers
  const handleBannerFileSelected = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setBannerDraftImage(dataUrl);
      setCoverImage(dataUrl);
      setBannerEditMode(true);
      setSaveSuccessToast('Banner loaded! Drag the image or use the sliders to align, then click Save Banner.');
      setTimeout(() => setSaveSuccessToast(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!canManage) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFileOverBanner(true);
    }
  };

  const handleBannerDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (!canManage) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOverBanner(false);
  };

  const handleBannerDrop = (e: React.DragEvent<HTMLElement>) => {
    if (!canManage) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOverBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleBannerFileSelected(file);
    }
  };

  const handleBannerPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!canManage || !bannerEditMode) return;
    // Ignore clicks on buttons, inputs, links inside the hero banner
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, label, .banner-editor-dock')) return;
    e.preventDefault();
    setIsDraggingBannerPan(true);
    bannerDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: bannerPosX,
      startY: bannerPosY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleBannerPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingBannerPan || !bannerDragStartRef.current) return;
    const dx = e.clientX - bannerDragStartRef.current.clientX;
    const dy = e.clientY - bannerDragStartRef.current.clientY;
    // Dragging mouse down pulls image down (decreases Y%), dragging up pushes image up (increases Y%)
    const nextX = Math.round(Math.min(100, Math.max(0, bannerDragStartRef.current.startX - dx * 0.15)));
    const nextY = Math.round(Math.min(100, Math.max(0, bannerDragStartRef.current.startY - dy * 0.22)));
    setBannerPosX(nextX);
    setBannerPosY(nextY);
  };

  const handleBannerPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingBannerPan) return;
    setIsDraggingBannerPan(false);
    bannerDragStartRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleSaveBannerDirectly = async () => {
    if (!artist || !canManage) return;
    try {
      const newPos = `${bannerPosX}% ${bannerPosY}%`;
      const finalCover = bannerDraftImage || artist.cover_image;
      const updated = await db.updateArtistProfile(artist.id, {
        cover_image: finalCover,
        cover_position: newPos,
        cover_zoom: bannerZoom,
      });
      setArtist(updated);
      setCoverImage(finalCover);
      setBannerEditMode(false);
      setSaveSuccessToast('Header banner image & alignment saved!');
      setTimeout(() => setSaveSuccessToast(''), 3200);
    } catch (err) {
      console.error('Failed to save banner:', err);
    }
  };

  // Direct Inline Showcase Gallery Photo Replacement / Upload / Delete Handlers
  const handleReplaceGalleryPhotoInline = async (index: number, file: File) => {
    if (!artist || !canManage || !file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const safeCurrentMedia = Array.isArray(artist.media) ? artist.media : [];
      const nextMedia = [...safeCurrentMedia];
      nextMedia[index] = { type: 'Image', url: dataUrl, title: `${artist.stage_name} Showcase Photo` };
      const updated = await db.updateArtistProfile(artist.id, { media: nextMedia });
      setArtist(updated);
      setMediaGallery(nextMedia);
      setSaveSuccessToast('Showcase gallery image updated!');
      setTimeout(() => setSaveSuccessToast(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleAddGalleryPhotoInline = async (file: File) => {
    if (!artist || !canManage || !file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const safeCurrentMedia = Array.isArray(artist.media) ? artist.media : [];
      const nextMedia = [...safeCurrentMedia, { type: 'Image' as const, url: dataUrl, title: `${artist.stage_name} Showcase Photo` }];
      const updated = await db.updateArtistProfile(artist.id, { media: nextMedia });
      setArtist(updated);
      setMediaGallery(nextMedia);
      setSaveSuccessToast('New photo added to showcase gallery!');
      setTimeout(() => setSaveSuccessToast(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteGalleryPhotoInline = async (index: number) => {
    if (!artist || !canManage) return;
    const safeCurrentMedia = Array.isArray(artist.media) ? artist.media : [];
    const nextMedia = safeCurrentMedia.filter((_, i) => i !== index);
    const updated = await db.updateArtistProfile(artist.id, { media: nextMedia });
    setArtist(updated);
    setMediaGallery(nextMedia);
    setSaveSuccessToast('Gallery photo removed.');
    setTimeout(() => setSaveSuccessToast(''), 3000);
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
      youtube_url: `https://www.youtube.com/watch?v=${ytId}`,
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

    // Auto-append any unsaved YouTube URL typed into the "Add New YouTube Link" input box
    let finalShowcaseTracks = [...showcaseTracks];
    if (newTrackUrl.trim()) {
      const pendingYtId = extractYouTubeId(newTrackUrl.trim());
      if (pendingYtId) {
        finalShowcaseTracks.push({
          id: 'trk-' + Math.random().toString(36).slice(2, 8),
          title: newTrackTitle.trim() || `${stageName || 'Artist'} — Official Performance Showcase`,
          subtitle: newTrackSubtitle.trim() || 'Official YouTube Audio / Video Showcase',
          youtube_url: `https://www.youtube.com/watch?v=${pendingYtId}`,
          duration: newTrackDuration.trim() || '3:30',
        });
        setNewTrackTitle('');
        setNewTrackSubtitle('');
        setNewTrackUrl('');
        setNewTrackDuration('');
      }
    }

    // Auto-append any unsaved gallery photo URL typed in Tab 2
    let finalMediaGallery = [...mediaGallery];
    if (newGalleryImageUrl.trim()) {
      finalMediaGallery.push({
        type: 'Image',
        url: newGalleryImageUrl.trim(),
        title: `${stageName} Showcase Photo`,
      });
      setNewGalleryImageUrl('');
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

    const parsedFee = Math.max(0, Number(String(estimatedFee).replace(/[^0-9.]/g, '')) || 0);

    try {
      const updated = await db.updateArtistProfile(id, {
        stage_name: stageName,
        legal_name: legalName,
        category,
        genre: genre,
        location: location.trim() || 'Jamaica',
        estimated_fee: parsedFee,
        price_tier: computePriceTierFromFee(parsedFee),
        bio: bio,
        profile_image: profileImage,
        cover_image: coverImage,
        cover_position: `${bannerPosX}% ${bannerPosY}%`,
        cover_zoom: bannerZoom,
        booking_status: bookingStatus,
        availability_status: availabilityStatus,
        technical_rider: techRider,
        hospitality_rider: hospRider,
        showcase_tracks: finalShowcaseTracks,
        featured_youtube_url: finalShowcaseTracks[0]?.youtube_url || '',
        media: finalMediaGallery,
        socials: cleanedSocials,
        blocked_dates: blockedDates,
      });

      setArtist(updated);
      setShowcaseTracks(finalShowcaseTracks);
      setMediaGallery(finalMediaGallery);
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
    Array.isArray(artist.showcase_tracks) && artist.showcase_tracks.length > 0
      ? artist.showcase_tracks
      : (DEFAULT_SHOWCASE_BY_CATEGORY[artist.category] || DEFAULT_SHOWCASE_BY_CATEGORY.default);
  const currentTrack = activeTracks[activeTrackIndex] || activeTracks[0];
  const currentVideoId = extractYouTubeId(currentTrack?.youtube_url);

  // Total Social Reach calculation
  const socialEntries = artist.socials && typeof artist.socials === 'object' && !Array.isArray(artist.socials)
    ? Object.entries(artist.socials).filter(([, d]) => d && (d.followers > 0 || d.url))
    : [];
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

  const activeBannerUrl = bannerEditMode ? (bannerDraftImage || artist.cover_image) : artist.cover_image;
  const activeBannerPos = bannerEditMode ? `${bannerPosX}% ${bannerPosY}%` : (artist.cover_position || '50% 35%');
  const activeBannerZoom = bannerEditMode ? bannerZoom : (artist.cover_zoom || 100);

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

      {/* 1. HERO COVER BANNER (with Admin Drag-and-Drop & Interactive Alignment) */}
      <section
        className="profile-hero-banner"
        onDragOver={handleBannerDragOver}
        onDragLeave={handleBannerDragLeave}
        onDrop={handleBannerDrop}
        onPointerDown={handleBannerPointerDown}
        onPointerMove={handleBannerPointerMove}
        onPointerUp={handleBannerPointerUp}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.78) 100%), url("${activeBannerUrl}")`,
          backgroundPosition: activeBannerPos,
          backgroundSize: activeBannerZoom > 100 ? `${activeBannerZoom}%` : 'cover',
          backgroundRepeat: 'no-repeat',
          cursor: bannerEditMode ? (isDraggingBannerPan ? 'grabbing' : 'grab') : 'default',
          userSelect: bannerEditMode ? 'none' : 'auto',
          outline: isDraggingFileOverBanner ? '3px dashed var(--gold-primary)' : 'none',
          outlineOffset: '-6px',
        }}
      >
        {/* Hidden File Input for Direct Hero Banner Upload */}
        {canManage && (
          <input
            ref={heroBannerInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBannerFileSelected(file);
            }}
          />
        )}

        {/* Drag-and-drop file overlay cue */}
        {canManage && isDraggingFileOverBanner && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(6px)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              color: 'var(--gold-primary)',
              fontWeight: 700,
              fontSize: '1.1rem',
              pointerEvents: 'none',
            }}
          >
            <Upload className="w-8 h-8 text-amber-400" />
            <span>Drop Image Here to Set &amp; Align Talent Header Banner</span>
          </div>
        )}

        <div className="container hero-inner-alignment">
          <div className="hero-top-bar">
            <Link href="/talent" className="back-link">
              <ChevronLeft className="w-4 h-4" /> Back to Directory
            </Link>

            {/* Admin Header Banner Alignment & Upload Dock */}
            {canManage && (
              <div className="banner-editor-dock">
                <div className="banner-dock-buttons">
                  <button
                    type="button"
                    onClick={() => heroBannerInputRef.current?.click()}
                    className="banner-dock-btn"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!bannerEditMode) {
                        setBannerDraftImage(artist.cover_image);
                        const parsed = parseCoverPosition(artist.cover_position);
                        setBannerPosX(parsed.x);
                        setBannerPosY(parsed.y);
                        setBannerZoom(artist.cover_zoom || 100);
                      }
                      setBannerEditMode(!bannerEditMode);
                    }}
                    className={`banner-dock-btn ${bannerEditMode ? 'active' : ''}`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{bannerEditMode ? 'Close Align' : 'Align / Reposition'}</span>
                  </button>
                </div>

                {/* Interactive Alignment & Framing Panel */}
                {bannerEditMode && (
                  <div className="banner-alignment-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Drag Banner or Adjust Sliders
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                        {bannerPosX}% X • {bannerPosY}% Y • {bannerZoom}%
                      </span>
                    </div>

                    {/* Quick Vertical Presets */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { label: 'Top', y: 15 },
                        { label: 'Mid-High', y: 35 },
                        { label: 'Center', y: 50 },
                        { label: 'Bottom', y: 80 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setBannerPosY(preset.y)}
                          style={{
                            flex: 1,
                            padding: '4px 2px',
                            fontSize: '0.66rem',
                            fontWeight: 600,
                            borderRadius: 5,
                            cursor: 'pointer',
                            background: Math.abs(bannerPosY - preset.y) <= 5 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${Math.abs(bannerPosY - preset.y) <= 5 ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)'}`,
                            color: Math.abs(bannerPosY - preset.y) <= 5 ? 'var(--gold-primary)' : '#cbd5e1',
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Vertical Alignment Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.73rem' }}>
                      <span style={{ width: 70, color: '#cbd5e1' }}>Vertical:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bannerPosY}
                        onChange={(e) => setBannerPosY(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#d4af37', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Horizontal Alignment Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.73rem' }}>
                      <span style={{ width: 70, color: '#cbd5e1' }}>Horizontal:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bannerPosX}
                        onChange={(e) => setBannerPosX(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#d4af37', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Zoom Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.73rem' }}>
                      <span style={{ width: 70, color: '#cbd5e1' }}>Zoom:</span>
                      <input
                        type="range"
                        min={100}
                        max={160}
                        value={bannerZoom}
                        onChange={(e) => setBannerZoom(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#d4af37', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Optional Direct Image URL input */}
                    <input
                      type="text"
                      value={bannerDraftImage}
                      onChange={(e) => setBannerDraftImage(e.target.value)}
                      placeholder="Or paste banner image URL..."
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.74rem',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 6,
                        color: '#fff',
                        width: '100%',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerEditMode(false);
                          setBannerDraftImage(artist.cover_image);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.6rem',
                          borderRadius: 6,
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          color: '#e2e8f0',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBannerDirectly}
                        style={{
                          flex: 1.5,
                          padding: '0.45rem 0.75rem',
                          borderRadius: 6,
                          background: 'var(--gold-gradient)',
                          border: 'none',
                          color: '#0f172a',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                        }}
                      >
                        <Check className="w-3.5 h-3.5" /> Save Banner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="hero-artist-info">
            <span className="artist-category-tag">{artist.category}</span>
            <h1 className="artist-stage-name">{artist.stage_name}</h1>
            <div className="artist-meta-row">
              <span className="meta-item"><MapPin className="meta-icon" /> {artist.location || 'Jamaica'}</span>
              <span className="meta-item"><Music className="meta-icon" /> {artist.genre}</span>
              <span
                className="meta-item"
                style={{ color: 'var(--gold-primary)', fontWeight: 700, cursor: canManage ? 'pointer' : 'default' }}
                onClick={() => { if (canManage) openEditModalOnTab('overview'); }}
                title={canManage ? 'Click to edit Estimated Booking Fee' : undefined}
              >
                <DollarSign className="meta-icon" />
                Est: ${getArtistEstimatedPricing(artist).fee.toLocaleString()} USD
                {canManage && <Edit2 className="w-3.5 h-3.5 ml-1" />}
              </span>
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
                    <Video className="w-3.5 h-3.5" /> Manage YouTube &amp; Photos
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
                          key={currentVideoId}
                          src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`}
                          title={currentTrack.title}
                          referrerPolicy="strict-origin-when-cross-origin"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                      <div className="embed-footer-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>{currentTrack.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{currentTrack.subtitle || artist.stage_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                            ▶ Click to Play Video
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: (Array.isArray(artist.media) && artist.media.length > 0) || canManage ? '1.25rem' : 0 }}>
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
                        className="tracklist-row-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${isSelected ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                          {vid ? (
                            <div className="track-thumb-box" style={{ position: 'relative', width: 64, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)', background: '#0f172a' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`}
                                alt={trk.title}
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (!img.dataset.fallback) {
                                    img.dataset.fallback = '1';
                                    img.src = `https://img.youtube.com/vi/${vid}/0.jpg`;
                                  } else {
                                    img.src = artist.profile_image || '/images/artist_reggae.jpg';
                                  }
                                }}
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
              
              {/* Showcase Photo & Media Gallery (with Direct Inline Admin Replace / Upload / Delete) */}
              {((Array.isArray(artist.media) && artist.media.length > 0) || canManage) && (
                <div>
                  {canManage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                        Showcase Press Photos &amp; Media ({Array.isArray(artist.media) ? artist.media.length : 0})
                      </span>
                      <label
                        style={{
                          background: 'rgba(212,175,55,0.12)',
                          border: '1px solid rgba(212,175,55,0.35)',
                          color: 'var(--gold-primary)',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" /> + Add Showcase Photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAddGalleryPhotoInline(f);
                          }}
                        />
                      </label>
                    </div>
                  )}
                  <div className="media-gallery-grid">
                    {(Array.isArray(artist.media) ? artist.media : []).map((med, idx) => {
                      const mediaYtId = med.type !== 'Image' ? extractYouTubeId(med.url) : null;
                      return (
                        <div
                          key={idx}
                          className="media-gallery-item"
                          style={{ position: 'relative' }}
                          onDragOver={(e) => {
                            if (!canManage) return;
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            if (!canManage) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const f = e.dataTransfer.files?.[0];
                            if (f && f.type.startsWith('image/')) {
                              handleReplaceGalleryPhotoInline(idx, f);
                            }
                          }}
                        >
                          {med.type === 'Image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={med.url} alt={`${artist.stage_name} gallery`} className="gallery-img" />
                          ) : mediaYtId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${mediaYtId}?rel=0`}
                              title={med.title || `${artist.stage_name} video`}
                              referrerPolicy="strict-origin-when-cross-origin"
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

                          {/* Admin Overlay Controls Directly on the Showcase Image */}
                          {canManage && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                display: 'flex',
                                gap: 6,
                                zIndex: 10,
                              }}
                            >
                              <label
                                title="Replace or drag-and-drop a new image here"
                                style={{
                                  background: 'rgba(15, 23, 42, 0.88)',
                                  backdropFilter: 'blur(8px)',
                                  border: '1px solid rgba(212, 175, 55, 0.5)',
                                  color: 'var(--gold-primary)',
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                                }}
                              >
                                <Camera className="w-3.5 h-3.5" /> Change Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleReplaceGalleryPhotoInline(idx, f);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryPhotoInline(idx)}
                                title="Remove this showcase photo"
                                style={{
                                  background: 'rgba(15, 23, 42, 0.88)',
                                  backdropFilter: 'blur(8px)',
                                  border: '1px solid rgba(239, 68, 68, 0.45)',
                                  color: '#ff453a',
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
        .artist-profile-viewport {
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
          position: relative;
        }

        .profile-hero-banner {
          min-height: 380px;
          height: auto;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding-top: 1.5rem;
          padding-bottom: 2rem;
          box-sizing: border-box;
          max-width: 100%;
          overflow-x: clip;
        }

        .hero-inner-alignment {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
          width: 100%;
        }

        .hero-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
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
          flex-shrink: 0;
        }

        .back-link:hover {
          color: #ffffff;
        }

        /* Banner Editor Dock & Alignment Controls */
        .banner-editor-dock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.65rem;
          max-width: 100%;
          z-index: 25;
        }

        .banner-dock-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .banner-dock-btn {
          background: rgba(15, 23, 42, 0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.45);
          color: #fff;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          transition: all var(--transition-fast);
        }

        .banner-dock-btn:hover {
          border-color: rgba(212, 175, 55, 0.8);
        }

        .banner-dock-btn.active {
          background: var(--gold-gradient);
          color: #0f172a;
          border-color: rgba(212, 175, 55, 0.6);
          font-weight: 700;
        }

        .banner-alignment-panel {
          background: rgba(12, 16, 31, 0.95);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(212, 175, 55, 0.45);
          border-radius: 12px;
          padding: 0.9rem 1.05rem;
          width: 100%;
          max-width: 340px;
          box-sizing: border-box;
          box-shadow: 0 18px 42px rgba(0,0,0,0.65);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          color: #fff;
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
          font-size: clamp(1.85rem, 1.4rem + 2.5vw, 3.8rem);
          font-weight: 700;
          color: #ffffff;
          word-break: break-word;
          line-height: 1.12;
        }

        .artist-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
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
          flex-shrink: 0;
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
          flex-shrink: 0;
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
          flex-shrink: 0;
        }

        .audio-play-btn:hover {
          transform: scale(1.05);
        }

        .player-track-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
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
          min-width: 45px;
          text-align: right;
          flex-shrink: 0;
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
          flex-shrink: 0;
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

        .modal-nav-tab {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.76rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .modal-track-row {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          padding: 0.75rem 0.85rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .modal-track-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .modal-track-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .modal-gallery-row {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 0.65rem 0.8rem;
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .modal-gallery-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .modal-social-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .modal-social-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-social-inputs {
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 0.5rem;
        }

        .modal-add-social {
          padding: 0.9rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px dashed rgba(212,175,55,0.35);
          display: grid;
          grid-template-columns: 130px 1fr 130px auto;
          gap: 0.6rem;
          align-items: end;
        }

        .calendar-quick-add {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex-wrap: wrap;
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

        /* ── Comprehensive Small Mobile Screen Responsiveness (320px–640px) ── */
        @media (max-width: 640px) {
          .profile-hero-banner {
            min-height: 340px;
            padding-top: 1rem;
            padding-bottom: 1.5rem;
          }

          .hero-inner-alignment {
            gap: 1.25rem;
          }

          .hero-top-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.65rem;
          }

          .banner-editor-dock {
            width: 100%;
            align-items: stretch;
          }

          .banner-dock-buttons {
            width: 100%;
            justify-content: stretch;
          }

          .banner-dock-btn {
            flex: 1 1 calc(50% - 0.25rem);
            justify-content: center;
            padding: 0.45rem 0.5rem;
            font-size: 0.72rem;
            text-align: center;
          }

          .banner-alignment-panel {
            width: 100%;
            max-width: 100%;
            padding: 0.75rem 0.85rem;
          }

          .artist-stage-name {
            font-size: clamp(1.6rem, 7vw, 2.4rem);
          }

          .artist-meta-row {
            gap: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }

          .card-padding {
            padding: 1.15rem 0.9rem !important;
          }

          .profile-main-col h2 {
            font-size: 1.2rem;
          }

          .audio-player-container {
            padding: 0.85rem 0.75rem !important;
            gap: 0.75rem !important;
          }

          .audio-play-btn {
            width: 38px !important;
            height: 38px !important;
          }

          .track-thumb-box {
            width: 52px !important;
            height: 34px !important;
          }

          .rider-col {
            padding: 1.15rem 1rem !important;
          }

          .calendar-container {
            padding: 12px 8px !important;
          }

          .calendar-days-grid {
            gap: 2px !important;
          }

          .day-cell {
            font-size: 0.7rem !important;
            min-height: 28px;
          }

          .calendar-legend {
            gap: 0.85rem !important;
            font-size: 0.68rem !important;
          }

          dialog.admin-modal {
            padding: 1.15rem 0.85rem !important;
            width: 96% !important;
            max-height: 92vh !important;
            border-radius: var(--radius-md);
          }

          .modal-header h3 {
            font-size: 1.05rem;
          }

          .modal-nav-tab {
            flex: 1 1 calc(50% - 0.35rem);
            text-align: center;
            padding: 7px 4px;
            font-size: 0.72rem;
            white-space: normal;
          }

          .modal-track-inputs {
            grid-template-columns: 1fr;
          }

          .modal-social-inputs {
            grid-template-columns: 1fr;
          }

          .modal-add-social {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .modal-add-social button {
            width: 100%;
          }

          .calendar-quick-add {
            flex-direction: column;
            align-items: stretch;
          }

          .calendar-quick-add input[type="date"],
          .calendar-quick-add button {
            width: 100%;
          }

          .modal-actions {
            flex-direction: column-reverse;
            gap: 0.5rem;
          }

          .modal-actions .btn {
            width: 100%;
            text-align: center;
            justify-content: center;
            padding: 0.75rem 1rem;
          }
        }

        /* ── Extra-Compact Phones (iPhone SE, 320px–380px) ── */
        @media (max-width: 380px) {
          .card-padding {
            padding: 1rem 0.75rem !important;
          }

          .artist-stage-name {
            font-size: clamp(1.45rem, 6.5vw, 1.9rem);
          }

          .track-thumb-box {
            width: 44px !important;
            height: 30px !important;
          }

          .calendar-legend {
            gap: 0.65rem !important;
            font-size: 0.65rem !important;
          }

          .day-cell {
            font-size: 0.65rem !important;
          }
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
            { id: 'showcase', label: '2. YouTube Showcase' },
            { id: 'socials', label: '3. Socials' },
            { id: 'calendar', label: '4. Calendar' },
            { id: 'riders', label: '5. Riders' },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditModalTab(t.id)}
              className="modal-nav-tab"
              style={{
                background: editModalTab === t.id ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${editModalTab === t.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.09)'}`,
                color: editModalTab === t.id ? 'var(--gold-primary)' : 'var(--text-secondary)',
                fontWeight: editModalTab === t.id ? 700 : 500,
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
                <label htmlFor="editEstimatedFeeInput">Estimated Booking Fee (USD) — Displayed on Talent Card as &ldquo;Est: $XX,XXX USD&rdquo;</label>
                <input
                  id="editEstimatedFeeInput"
                  type="number"
                  min={0}
                  step={500}
                  value={estimatedFee}
                  onChange={(e) => setEstimatedFee(e.target.value)}
                  placeholder="e.g. 90000"
                />
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
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setBannerDraftImage(e.target.value);
                  }}
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
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        height: 80,
                        borderRadius: 6,
                        border: '1px solid rgba(212,175,55,0.35)',
                        backgroundImage: `url("${coverImage}")`,
                        backgroundPosition: `${bannerPosX}% ${bannerPosY}%`,
                        backgroundSize: bannerZoom > 100 ? `${bannerZoom}%` : 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>Vertical Align ({bannerPosY}%):</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bannerPosY}
                        onChange={(e) => setBannerPosY(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#d4af37', padding: 0 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE & AUDIO SHOWCASE + SHOWCASE GALLERY PHOTOS */}
          {editModalTab === 'showcase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
                      className="modal-track-row"
                    >
                      <div className="modal-track-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          {vid ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`}
                              alt={trk.title}
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.fallback) {
                                  img.dataset.fallback = '1';
                                  img.src = `https://img.youtube.com/vi/${vid}/0.jpg`;
                                } else {
                                  img.src = artist.profile_image || '/images/artist_reggae.jpg';
                                }
                              }}
                              style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 36, borderRadius: 5, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Video className="w-4 h-4 text-amber-400" />
                            </div>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-primary)', whiteSpace: 'nowrap' }}>
                            Track #{idx + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveShowcaseTrack(trk.id)}
                          title="Remove Track"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff453a', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="modal-track-inputs">
                        <input
                          type="text"
                          value={trk.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShowcaseTracks(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          placeholder="Track / Performance Title"
                          style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.8rem', width: '100%' }}
                        />
                        <input
                          type="text"
                          value={trk.youtube_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShowcaseTracks(prev => prev.map((item, i) => i === idx ? { ...item, youtube_url: val } : item));
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--gold-primary)', fontSize: '0.8rem', width: '100%' }}
                        />
                      </div>
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

              {/* Showcase Gallery Photos Editor (Images Below YouTube Tracks) */}
              <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Showcase Gallery Photos (Displayed Below YouTube Tracks)
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Replace, upload, or remove the press/performance photos shown at the bottom of the Showcase card.
                    </div>
                  </div>
                  <label
                    style={{
                      background: 'rgba(212,175,55,0.16)',
                      border: '1px solid rgba(212,175,55,0.4)',
                      color: 'var(--gold-primary)',
                      padding: '5px 11px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" /> + Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setMediaGallery(prev => [...prev, { type: 'Image', url: reader.result as string, title: `${stageName} Showcase Photo` }]);
                          };
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>

                {mediaGallery.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.75rem' }}>
                    {mediaGallery.map((med, idx) => (
                      <div
                        key={idx}
                        className="modal-gallery-row"
                      >
                        <div className="modal-gallery-top">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={med.url}
                            alt={`Gallery ${idx + 1}`}
                            style={{ width: 64, height: 42, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Photo #{idx + 1}</span>
                          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
                            <label
                              title="Replace photo from computer"
                              style={{
                                background: 'rgba(212,175,55,0.12)',
                                border: '1px solid rgba(212,175,55,0.35)',
                                color: 'var(--gold-primary)',
                                padding: '5px 9px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Camera className="w-3.5 h-3.5" /> Change
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const dataUrl = reader.result as string;
                                      setMediaGallery(prev => prev.map((item, i) => i === idx ? { ...item, type: 'Image', url: dataUrl } : item));
                                    };
                                    reader.readAsDataURL(f);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setMediaGallery(prev => prev.filter((_, i) => i !== idx))}
                              title="Remove photo"
                              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff453a', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={med.url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMediaGallery(prev => prev.map((item, i) => i === idx ? { ...item, url: val } : item));
                          }}
                          placeholder="Image URL or upload file..."
                          style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.78rem' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    No gallery photos currently attached. Upload a photo or paste an image URL below.
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newGalleryImageUrl}
                    onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                    placeholder="Or paste an image URL (https://...) to add to gallery"
                    style={{ flex: '1 1 180px', minWidth: 0, padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGalleryImageUrl.trim()) return;
                      setMediaGallery(prev => [...prev, { type: 'Image', url: newGalleryImageUrl.trim(), title: `${stageName} Showcase Photo` }]);
                      setNewGalleryImageUrl('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    + Add Image URL
                  </button>
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
                    className="modal-social-row"
                  >
                    <div className="modal-social-top">
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold-primary)' }}>{plat}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialPlatform(plat)}
                        title={`Remove ${plat}`}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff453a', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="modal-social-inputs">
                      <input
                        type="text"
                        value={data?.url || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setSocialsEdit(prev => ({ ...prev, [plat]: { ...prev[plat], url } }));
                        }}
                        placeholder={`https://${plat.toLowerCase().replace(/\s+/g, '')}.com/...`}
                        style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.82rem', width: '100%' }}
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
                        style={{ padding: '0.5rem 0.65rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600, width: '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Additional Platform */}
              <div className="modal-add-social">
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
                  style={{ height: 42, padding: '0 0.9rem', fontSize: '0.78rem', whiteSpace: 'nowrap', justifyContent: 'center' }}
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
              <div className="calendar-quick-add">
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
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
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
