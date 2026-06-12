'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import Link from 'next/link';
import { Search, SlidersHorizontal, Music, MapPin, DollarSign, Filter } from 'lucide-react';

// Pricing tiers for artists
const ARTIST_PRICING: Record<string, { fee: number; tier: string }> = {
  'art-beres-hammond': { fee: 90000, tier: '$$$' },
  'art-chronixx': { fee: 120000, tier: '$$$$' },
  'art-koffee': { fee: 75000, tier: '$$$' },
  'art-shenseea': { fee: 85000, tier: '$$$' },
  'art-rodigan': { fee: 20000, tier: '$' }
};

const TalentDirectoryContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [budgetTier, setBudgetTier] = useState('All');

  // Sync category filter from URL params (e.g. from Home page)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      if (cat.toLowerCase().includes('reggae')) setSelectedCategory('Reggae Artists');
      else if (cat.toLowerCase().includes('dancehall')) setSelectedCategory('Dancehall Artists');
      else if (cat.toLowerCase().includes('dj')) setSelectedCategory('DJs');
    }
  }, [searchParams]);

  // Load artists
  useEffect(() => {
    const loadArtists = async () => {
      const all = await db.getArtists();
      setArtists(all);
      setFilteredArtists(all);
    };
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
        const pricing = ARTIST_PRICING[a.id];
        if (!pricing) return true;
        const fee = pricing.fee;
        if (budgetTier === 'tier-1') return fee < 30000;
        if (budgetTier === 'tier-2') return fee >= 30000 && fee <= 80000;
        if (budgetTier === 'tier-3') return fee > 80000;
        return true;
      });
    }

    setFilteredArtists(result);
  }, [searchQuery, selectedCategory, budgetTier, artists]);

  return (
    <div className="talent-directory-container container">
      {/* Page Header */}
      <div className="directory-header">
        <span className="gold-badge">Showtime Roster</span>
        <h2>Talent Directory</h2>
        <p>Browse our curated roster of leading Reggae, Dancehall, and live performers available for global bookings.</p>
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
            const pricing = ARTIST_PRICING[artist.id];
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
          gap: 1rem;
          width: 100%;
        }

        @media (min-width: 768px) {
          .select-filters-group {
            width: auto;
          }
        }

        .filter-item {
          position: relative;
          width: 50%;
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 14px;
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
