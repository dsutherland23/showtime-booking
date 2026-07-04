'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Search, SlidersHorizontal, Music, MapPin, DollarSign, Filter, X, Upload } from 'lucide-react';

// Pricing tiers for artists
const ARTIST_PRICING: Record<string, { fee: number; tier: string }> = {
  'art-beres-hammond': { fee: 90000, tier: '$$$' },
  'art-chronixx': { fee: 120000, tier: '$$$$' },
  'art-koffee': { fee: 75000, tier: '$$$' },
  'art-shenseea': { fee: 85000, tier: '$$$' },
  'art-rodigan': { fee: 20000, tier: '$' }
};

// Deterministic fallback pricing for seed / dynamically added artists
const getArtistPricing = (id: string, category: string): { fee: number; tier: string } => {
  if (ARTIST_PRICING[id]) return ARTIST_PRICING[id];
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const factor = Math.abs(hash % 10);
  
  let fee = 15000;
  let tier = '$$';
  
  if (category === 'Reggae Artists' || category === 'Dancehall Artists') {
    fee = 35000 + factor * 10000;
    tier = fee > 80000 ? '$$$$' : fee > 50000 ? '$$$' : '$$';
  } else if (category === 'DJs') {
    fee = 10000 + factor * 3000;
    tier = fee > 30000 ? '$$$' : fee > 18000 ? '$$' : '$';
  } else if (category === 'Bands') {
    fee = 20000 + factor * 5000;
    tier = fee > 50000 ? '$$$' : '$$';
  } else if (category === 'Dancers') {
    fee = 3000 + factor * 1000;
    tier = fee > 8000 ? '$$' : '$';
  } else if (category === 'Hosts') {
    fee = 5000 + factor * 1500;
    tier = fee > 12000 ? '$$' : '$';
  } else {
    fee = 10000 + factor * 2000;
    tier = '$$';
  }
  
  return { fee, tier };
};

const TalentDirectoryContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [budgetTier, setBudgetTier] = useState('All');

  // Form state for creating new artist
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [stageName, setStageName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [category, setCategory] = useState('Dancehall Artists');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageBase64, setProfileImageBase64] = useState('');
  const [techRider, setTechRider] = useState('');
  const [hospRider, setHospRider] = useState('');
  const [formError, setFormError] = useState('');

  const canManage = hasPermission('manage_artists');

  // Sync category filter from URL params (e.g. from Home page)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const lower = cat.toLowerCase();
      if (lower.includes('reggae')) setSelectedCategory('Reggae Artists');
      else if (lower.includes('dancehall')) setSelectedCategory('Dancehall Artists');
      else if (lower.includes('dj')) setSelectedCategory('DJs');
      else if (lower.includes('band')) setSelectedCategory('Bands');
      else if (lower.includes('dancer')) setSelectedCategory('Dancers');
      else if (lower.includes('host')) setSelectedCategory('Hosts');
    }
  }, [searchParams]);

  // Load artists
  const loadArtists = async () => {
    const all = await db.getArtists();
    setArtists(all);
    setFilteredArtists(all);
  };

  useEffect(() => {
    loadArtists();
  }, []);

  // Filter application
  useEffect(() => {
    let result = artists;

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        a =>
          a.stage_name.toLowerCase().includes(query) ||
          a.genre.toLowerCase().includes(query) ||
          a.bio.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(a => a.category === selectedCategory);
    }

    // Budget Filter
    if (budgetTier !== 'All') {
      result = result.filter(a => {
        const pricing = getArtistPricing(a.id, a.category);
        const fee = pricing.fee;
        if (budgetTier === 'tier-1') return fee < 30000;
        if (budgetTier === 'tier-2') return fee >= 30000 && fee <= 80000;
        if (budgetTier === 'tier-3') return fee > 80000;
        return true;
      });
    }

    setFilteredArtists(result);
  }, [searchQuery, selectedCategory, budgetTier, artists]);

  // Fallback for dialog click dismiss (click on backdrop closes)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
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

    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  // Handle local image file read
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form to create talent
  const handleAddTalentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!stageName.trim()) {
      setFormError('Stage Name is required');
      return;
    }

    // Choose default cover and profile pictures based on category if not uploaded
    let finalProfileImage = profileImageBase64;
    let finalCoverImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200';

    if (!finalProfileImage) {
      if (category === 'Reggae Artists') {
        finalProfileImage = '/images/artist_reggae.jpg';
        finalCoverImage = 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200';
      } else if (category === 'DJs') {
        finalProfileImage = '/images/artist_dj.jpg';
        finalCoverImage = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200';
      } else if (category === 'Bands') {
        finalProfileImage = '/images/concert_stage.jpg';
      } else if (category === 'Dancers') {
        finalProfileImage = '/images/hero_ambient.jpg';
        finalCoverImage = 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200';
      } else {
        finalProfileImage = '/images/artist_dancehall.jpg';
        finalCoverImage = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200';
      }
    }

    try {
      await db.createArtist({
        stage_name: stageName,
        legal_name: legalName || stageName,
        category,
        genre: genre || category.replace(' Artists', ''),
        bio: bio || `${stageName} is an elite professional performer available for global booking.`,
        profile_image: finalProfileImage,
        cover_image: finalCoverImage,
        booking_status: 'Available',
        availability_status: 'Active',
        technical_rider: techRider,
        hospitality_rider: hospRider
      });

      // Reset form fields
      setStageName('');
      setLegalName('');
      setGenre('');
      setBio('');
      setProfileImageBase64('');
      setTechRider('');
      setHospRider('');
      
      // Close modal and refresh list
      if (dialogRef.current) {
        dialogRef.current.close();
      }
      await loadArtists();
    } catch (err) {
      console.error(err);
      setFormError('Failed to create artist profile. Please try again.');
    }
  };

  return (
    <div className="talent-directory-container container">
      {/* Page Header */}
      <div className="directory-header">
        <span className="gold-badge">Showtime Roster</span>
        <h2>Talent Directory</h2>
        <p>Browse our curated roster of leading Reggae, Dancehall, and live performers available for global bookings.</p>
        
        {canManage && (
          <button 
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => dialogRef.current?.showModal()}
            id="open-add-dialog-btn"
          >
            + Add New Talent
          </button>
        )}
      </div>

      {/* Interactive Filtering Panel */}
      <div className="filter-controls-bar glassmorphism">
        <div className="search-field-wrapper">
          <Search className="search-icon-input" />
          <input
            type="text"
            placeholder="Search artists by name, genre, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search talent directory"
          />
        </div>

        <div className="select-filters-group">
          <div className="filter-item">
            <Filter className="filter-icon-select" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
            >
              <option value="All">All Categories</option>
              <option value="Reggae Artists">Reggae Artists</option>
              <option value="Dancehall Artists">Dancehall Artists</option>
              <option value="DJs">DJs & Sound Systems</option>
              <option value="Bands">Bands</option>
              <option value="Dancers">Dancers</option>
              <option value="Hosts">Hosts</option>
            </select>
          </div>

          <div className="filter-item">
            <DollarSign className="filter-icon-select" />
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              aria-label="Filter by Budget Range"
            >
              <option value="All">All Budgets</option>
              <option value="tier-1">Under $30K</option>
              <option value="tier-2">$30K - $80K</option>
              <option value="tier-3">$80K+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredArtists.length > 0 ? (
        <div className="grid-3 directory-grid">
          {filteredArtists.map((artist) => {
            const pricing = getArtistPricing(artist.id, artist.category);
            return (
              <div key={artist.id} className="luxury-card artist-card animate-fade">
                <div className="artist-image-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.profile_image} alt={artist.stage_name} className="artist-image" />
                  <div className="card-top-overlay">
                    <span className="badge-category">{artist.category}</span>
                    {pricing && <span className="badge-tier">{pricing.tier}</span>}
                  </div>
                </div>
                
                <div className="artist-body">
                  <h3>{artist.stage_name}</h3>
                  <span className="genre-subtitle">{artist.genre}</span>
                  <p className="bio-short">{artist.bio.substring(0, 140)}...</p>
                  
                  <div className="artist-meta">
                    <span className="meta-item">
                      <MapPin className="icon-tiny" /> Jamaica
                    </span>
                    {pricing && (
                      <span className="meta-item fee-text">
                        Est: ${pricing.fee.toLocaleString()} USD
                      </span>
                    )}
                  </div>

                  <div className="artist-actions">
                    <Link href={`/talent/${artist.id}`} className="btn btn-secondary btn-full">
                      View Profile & Riders
                    </Link>
                    <Link 
                      href={`/book?artistId=${artist.id}`} 
                      className="btn btn-primary btn-full"
                    >
                      Book Artist
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-results glassmorphism">
          <SlidersHorizontal className="no-results-icon" />
          <h3>No Artists Match Your Criteria</h3>
          <p>Try clearing your search query or selecting a different category/budget filter.</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setBudgetTier('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Modern Dialog Modal for Adding Talent */}
      <dialog 
        ref={dialogRef} 
        id="add-talent-dialog" 
        className="admin-modal" 
        closedby="any"
        aria-labelledby="dialogTitle"
      >
        <div className="modal-header">
          <h3 id="dialogTitle">Add New Talent Roster</h3>
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={() => dialogRef.current?.close()}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddTalentSubmit} className="form-grid">
          {formError && <p className="form-row-full error-text">{formError}</p>}
          
          <div className="form-group">
            <label htmlFor="stageNameInput">Stage Name *</label>
            <input 
              id="stageNameInput" 
              type="text" 
              value={stageName} 
              onChange={(e) => setStageName(e.target.value)} 
              placeholder="e.g. Beenie Man" 
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="legalNameInput">Legal Name</label>
            <input 
              id="legalNameInput" 
              type="text" 
              value={legalName} 
              onChange={(e) => setLegalName(e.target.value)} 
              placeholder="e.g. Moses Davis"
            />
          </div>

          <div className="form-group">
            <label htmlFor="categorySelect">Category</label>
            <select 
              id="categorySelect" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Reggae Artists">Reggae Artists</option>
              <option value="Dancehall Artists">Dancehall Artists</option>
              <option value="DJs">DJs & Sound Systems</option>
              <option value="Bands">Bands</option>
              <option value="Dancers">Dancers</option>
              <option value="Hosts">Hosts</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="genreInput">Genre / Style</label>
            <input 
              id="genreInput" 
              type="text" 
              value={genre} 
              onChange={(e) => setGenre(e.target.value)} 
              placeholder="e.g. Roots Reggae, Trap Dancehall"
            />
          </div>

          <div className="form-group form-row-full">
            <label htmlFor="bioInput">Biography Description</label>
            <textarea 
              id="bioInput" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Enter career details, achievements, background story..."
              rows={3}
            />
          </div>

          <div className="form-group form-row-full">
            <label htmlFor="imageFileInput">Profile Picture Upload</label>
            <div className="file-upload-wrapper">
              <Upload className="w-5 h-5 text-amber-500" />
              <input 
                id="imageFileInput" 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>
            {profileImageBase64 && (
              <div className="preview-img-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImageBase64} alt="Preview" className="preview-img" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="techRiderInput">Technical Rider Summary</label>
            <textarea 
              id="techRiderInput" 
              value={techRider} 
              onChange={(e) => setTechRider(e.target.value)} 
              placeholder="Sound requirements, backline details..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hospRiderInput">Hospitality Rider Summary</label>
            <textarea 
              id="hospRiderInput" 
              value={hospRider} 
              onChange={(e) => setHospRider(e.target.value)} 
              placeholder="Hotel requirements, dressing room details..."
              rows={2}
            />
          </div>

          <div className="modal-actions form-row-full">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Talent
            </button>
          </div>
        </form>
      </dialog>

      <style jsx>{`
        .talent-directory-container {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .directory-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .directory-header p {
          margin: 0.5rem auto 0;
          color: var(--text-secondary);
          max-width: 600px;
        }

        /* Filter Controls */
        .filter-controls-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-xl);
        }

        @media (min-width: 768px) {
          .filter-controls-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-field-wrapper {
          position: relative;
          flex-grow: 1;
        }

        .search-icon-input {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--gold-primary);
        }

        .search-field-wrapper input {
          padding-left: 2.75rem;
          background-color: var(--bg-secondary);
        }

        .select-filters-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        @media (min-width: 480px) {
          .select-filters-group {
            flex-direction: row;
            width: auto;
          }
        }

        @media (min-width: 768px) {
          .select-filters-group {
            width: auto;
          }
        }

        .filter-item {
          position: relative;
          width: 100%;
        }

        @media (min-width: 480px) {
          .filter-item {
            width: 50%;
          }
        }

        @media (min-width: 768px) {
          .filter-item {
            width: 180px;
          }
        }

        .filter-icon-select {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: var(--gold-primary);
          pointer-events: none;
        }

        .filter-item select {
          padding-left: 2.25rem;
          background-color: var(--bg-secondary);
          cursor: pointer;
        }

        /* Artist Card Layouts */
        .directory-grid {
          margin-top: var(--spacing-lg);
        }

        .artist-card {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .artist-image-container {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          width: 100%;
        }

        .artist-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }

        .artist-card:hover .artist-image {
          transform: scale(1.04);
        }

        .card-top-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge-category {
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--gold-primary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(212, 175, 55, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-tier {
          background: var(--gold-gradient);
          color: var(--bg-primary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .artist-body {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 8px;
        }

        .genre-subtitle {
          font-size: 0.8rem;
          color: var(--gold-primary);
          font-weight: 550;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .bio-short {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .artist-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          border-top: 1px solid rgba(212, 175, 55, 0.08);
          padding-top: 12px;
          margin-top: auto;
          color: var(--text-muted);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .fee-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .icon-tiny {
          width: 14px;
          height: 14px;
          color: var(--gold-primary);
        }

        .artist-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 14px;
        }

        @media (min-width: 1200px) {
          .artist-actions {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
          }
        }

        .btn-full {
          width: 100%;
          padding: 0.65rem 0.5rem;
          font-size: 0.8rem;
        }

        /* No Results Box */
        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--spacing-xl);
          border-radius: var(--radius-lg);
          gap: 12px;
          max-width: 500px;
          margin: 3rem auto;
        }

        .no-results-icon {
          width: 48px;
          height: 48px;
          color: var(--gold-primary);
          opacity: 0.6;
        }

        .no-results p {
          font-size: 0.9rem;
          margin-bottom: var(--spacing-sm);
        }

        /* Dialog Modal Styling */
        dialog.admin-modal {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(12, 10, 23, 0.96);
          backdrop-filter: blur(25px);
          border-radius: var(--radius-lg);
          padding: 2.25rem;
          color: var(--text-primary);
          max-width: 600px;
          width: 90%;
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
          margin-bottom: 1.5rem;
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
          gap: 1.25rem;
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
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          color: #ffffff;
          font-size: 0.9rem;
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
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
};

export default function TalentDirectory() {
  return (
    <Suspense fallback={<div className="container" style={{ color: '#fff', padding: '50px 20px', textAlign: 'center' }}>Loading Directory...</div>}>
      <TalentDirectoryContent />
    </Suspense>
  );
}

