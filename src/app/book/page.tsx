'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist, BookingArtistItem } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, DollarSign, User, Mail, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Plus, X, Search, Music, Check, Users } from 'lucide-react';

export interface SelectedLineupArtist {
  artist: Artist;
  role: 'Headliner' | 'Supporting Act' | 'Special Guest' | 'DJ / Sound System' | 'Host';
}

const BookTalentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, isClient } = useAuth();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<SelectedLineupArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stepError, setStepError] = useState('');
  
  // Step navigation
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [form, setForm] = useState({
    // Step 1: Event Details
    event_title: '',
    event_type: 'Festival',
    event_date: '',
    attendance: '1000',
    
    // Step 2: Location
    venue_name: '',
    city: '',
    country: 'Jamaica',

    // Step 3: Artist & Budget
    budget: '50000',

    // Step 4: Contact Details
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    details: ''
  });

  // Sync parameters & load artists
  useEffect(() => {
    const loadArtists = async () => {
      const all = await db.getArtists();
      setArtists(all);

      const queryArtistId = searchParams.get('artistId');
      if (queryArtistId) {
        const found = all.find(a => a.id === queryArtistId);
        if (found) {
          setSelectedArtists([{ artist: found, role: 'Headliner' }]);
        }
      } else if (all.length > 0) {
        setSelectedArtists([{ artist: all[0], role: 'Headliner' }]);
      }
    };
    loadArtists();
  }, [searchParams]);

  // Pre-fill form if user is a logged-in client
  useEffect(() => {
    if (user && profile && isClient) {
      setForm(f => ({
        ...f,
        contact_name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone || ''
      }));
    }
  }, [user, profile, isClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const toggleArtist = (art: Artist) => {
    setStepError('');
    setSelectedArtists(prev => {
      const exists = prev.find(item => item.artist.id === art.id);
      if (exists) {
        return prev.filter(item => item.artist.id !== art.id);
      } else {
        const defaultRole = prev.length === 0 ? 'Headliner' : 'Supporting Act';
        return [...prev, { artist: art, role: defaultRole }];
      }
    });
  };

  const updateArtistRole = (artId: string, role: SelectedLineupArtist['role']) => {
    setSelectedArtists(prev => prev.map(item => item.artist.id === artId ? { ...item, role } : item));
  };

  const removeArtist = (artId: string) => {
    setSelectedArtists(prev => prev.filter(item => item.artist.id !== artId));
  };

  const handleNext = () => {
    if (step === 3 && selectedArtists.length === 0) {
      setStepError('Please select at least one artist for your lineup before proceeding.');
      return;
    }
    setStepError('');
    setStep(s => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    setStepError('');
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedArtists.length === 0) {
      setStepError('Please select at least one artist for your lineup.');
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const artistItems: BookingArtistItem[] = selectedArtists.map(item => ({
        artist_id: item.artist.id,
        artist_name: item.artist.stage_name,
        artist_image: item.artist.profile_image,
        category: item.artist.category,
        genre: item.artist.genre,
        role: item.role
      }));

      const lineupDisplay = selectedArtists.map(item => `${item.artist.stage_name} (${item.role})`).join(', ');

      await db.createLead({
        company_name: form.company_name || undefined,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || undefined,
        country: form.country,
        details: `Event: ${form.event_title} (${form.event_type}) at ${form.venue_name}, ${form.city}. Lineup: [${lineupDisplay}]. Attendance: ${form.attendance}. Notes: ${form.details}`,
        budget: parseFloat(form.budget) || 50000,
        preferred_date: form.event_date || new Date().toISOString().split('T')[0],
        artist_id: selectedArtists[0]?.artist.id || undefined,
        artist_name: selectedArtists.map(a => a.artist.stage_name).join(', '),
        artists: artistItems
      });

      setIsSubmitted(true);

      if (typeof window !== 'undefined') {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#aa7c11', '#d4af37', '#f3e5ab', '#ffffff']
        });
      }

      setTimeout(() => {
        router.push(user ? '/portal/client' : '/');
      }, 4000);

    } catch {
      // Submission failed — user sees loading state reset
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogArtists = useMemo(() => {
    return artists.filter(a => {
      const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
      const matchSearch = a.stage_name.toLowerCase().includes(artistSearch.toLowerCase()) ||
        a.genre.toLowerCase().includes(artistSearch.toLowerCase()) ||
        (a.category || '').toLowerCase().includes(artistSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [artists, categoryFilter, artistSearch]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(artists.map(a => a.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [artists]);

  return (
    <div className="book-talent-container container">
      {/* Visual Success Overlay */}
      {isSubmitted ? (
        <div className="success-overlay glassmorphism animate-fade">
          <CheckCircle2 className="success-icon" />
          <h2>Booking Inquiry Submitted</h2>
          <p className="success-tagline">Your multi-talent booking request has been received. Our executive booking agents will review your lineup offer and contact you within 24 hours.</p>
          <div className="success-summary">
            <div>
              <strong>Event:</strong> {form.event_title || 'Showcase'} ({form.event_type})
            </div>
            <div>
              <strong>Target Date:</strong> {form.event_date}
            </div>
            <div>
              <strong>Location:</strong> {form.venue_name ? `${form.venue_name}, ` : ''}{form.city}, {form.country}
            </div>
            <div>
              <strong>Total Budget Offer:</strong> ${parseFloat(form.budget).toLocaleString()} USD
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <strong>Lineup ({selectedArtists.length} Acts):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                {selectedArtists.map(item => (
                  <span key={item.artist.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,175,55,0.15)', color: 'var(--gold-primary)', fontSize: '0.8rem' }}>
                    {item.artist.stage_name} <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>• {item.role}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="redirect-note">Redirecting you to the Client Hub where you can track live proposals, sign contracts, and access artist riders...</p>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="booking-wizard-wrapper">
          {/* Section Header */}
          <div className="directory-header">
            <span className="gold-badge">Reservation Portal</span>
            <h2>Book Showtime Talent</h2>
            <p>Submit a formal booking inquiry to begin the contract evaluation and availability verification workflows.</p>
          </div>

          {/* Stepper Steps Indicators */}
          <div className="wizard-steps-indicator">
            <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="node-num">{step > 1 ? '✓' : '1'}</span>
              <span className="node-label">Event Details</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="node-num">{step > 2 ? '✓' : '2'}</span>
              <span className="node-label">Location</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <span className="node-num">{step > 3 ? '✓' : '3'}</span>
              <span className="node-label">Talent & Rate</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-node ${step >= 4 ? 'active' : ''}`}>
              <span className="node-num">4</span>
              <span className="node-label">Contact</span>
            </div>
          </div>

          {/* Booking Form Layout */}
          <form className="luxury-card booking-wizard-form" onSubmit={handleSubmit}>
            
            {/* STEP 1: EVENT DETAILS */}
            {step === 1 && (
              <div className="step-slide-content animate-fade">
                <h3>Event Specifications</h3>
                <div className="form-group-grid">
                  <div className="field-group">
                    <label htmlFor="event_title">Event Title *</label>
                    <input
                      id="event_title"
                      type="text"
                      name="event_title"
                      placeholder="e.g. Annual Music Festival or Gala"
                      value={form.event_title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="event_type">Event Type *</label>
                    <select id="event_type" name="event_type" value={form.event_type} onChange={handleChange}>
                      <option value="Festival">Music Festival</option>
                      <option value="Corporate Event">Corporate Gala</option>
                      <option value="Club Show">Nightclub Performance</option>
                      <option value="Wedding">Private Wedding</option>
                      <option value="Private Party">Private Party / VIP Event</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="event_date">Event Date *</label>
                    <div className="input-with-icon-wrapper">
                      <Calendar className="inner-field-icon" />
                      <input
                        id="event_date"
                        type="date"
                        name="event_date"
                        value={form.event_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="attendance">Expected Attendance *</label>
                    <select id="attendance" name="attendance" value={form.attendance} onChange={handleChange}>
                      <option value="500">Under 500 attendees</option>
                      <option value="1500">500 - 2,000 attendees</option>
                      <option value="5000">2,000 - 10,000 attendees</option>
                      <option value="25000">10,000+ attendees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <div className="step-slide-content animate-fade">
                <h3>Venue & Geography</h3>
                <div className="form-group-grid">
                  <div className="field-group">
                    <label htmlFor="venue_name">Venue Name / Stage *</label>
                    <input
                      id="venue_name"
                      type="text"
                      name="venue_name"
                      placeholder="e.g. Main Auditorium / Concert Hall"
                      value={form.venue_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      placeholder="e.g. Montego Bay"
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="country">Target Market / Country *</label>
                    <select id="country" name="country" value={form.country} onChange={handleChange}>
                      <option value="Jamaica">Jamaica</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Caribbean">Other Caribbean Island</option>
                      <option value="Europe">Europe</option>
                      <option value="Middle East">Middle East</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TALENT SELECTOR */}
            {step === 3 && (
              <div className="step-slide-content animate-fade">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Assemble Event Lineup & Budget Offer</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Select one or multiple headline and supporting acts for your showcase.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: 20, background: selectedArtists.length > 0 ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.06)', color: selectedArtists.length > 0 ? 'var(--gold-primary)' : 'var(--text-muted)', border: '1px solid rgba(212,175,55,0.25)', fontWeight: 600 }}>
                    {selectedArtists.length} {selectedArtists.length === 1 ? 'Artist Selected' : 'Artists in Lineup'}
                  </span>
                </div>

                {stepError && (
                  <div style={{ padding: '0.65rem 1rem', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚠</span> {stepError}
                  </div>
                )}

                {/* CURRENT LINEUP TRAY */}
                <div className="lineup-tray-container">
                  <div className="lineup-tray-header">
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Selected Event Lineup
                    </span>
                    {selectedArtists.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>
                        Assign role for each act (Headliner, Supporting, DJ)
                      </span>
                    )}
                  </div>

                  {selectedArtists.length === 0 ? (
                    <div className="lineup-empty-state">
                      <Users size={22} style={{ opacity: 0.4, color: 'var(--gold-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No artists in your lineup yet</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose artists from the catalog below to add them to your booking inquiry</div>
                      </div>
                    </div>
                  ) : (
                    <div className="lineup-chips-list">
                      {selectedArtists.map(item => (
                        <div key={item.artist.id} className="lineup-artist-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.artist.profile_image || '/images/artist_reggae.jpg'}
                              alt={item.artist.stage_name}
                              className="lineup-artist-avatar"
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                {item.artist.stage_name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {item.artist.genre || item.artist.category}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="role-select-wrapper">
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role:</label>
                              <select
                                value={item.role}
                                onChange={(e) => updateArtistRole(item.artist.id, e.target.value as SelectedLineupArtist['role'])}
                                className="lineup-role-select"
                              >
                                <option value="Headliner">Headliner</option>
                                <option value="Supporting Act">Supporting Act</option>
                                <option value="Special Guest">Special Guest</option>
                                <option value="DJ / Sound System">DJ / Sound System</option>
                                <option value="Host">Host / MC</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeArtist(item.artist.id)}
                              className="lineup-remove-btn"
                              title="Remove artist"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ROSTER CATALOG SELECTOR */}
                <div className="catalog-browser-block">
                  <div className="catalog-controls-row">
                    <div className="catalog-search-wrapper">
                      <Search size={14} className="catalog-search-icon" />
                      <input
                        type="text"
                        placeholder="Search roster by artist name, genre..."
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        className="catalog-search-input"
                      />
                      {artistSearch && (
                        <button type="button" onClick={() => setArtistSearch('')} className="catalog-search-clear">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="category-pills-row">
                      {uniqueCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`cat-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="catalog-grid-cards">
                    {filteredCatalogArtists.map(a => {
                      const isSelected = selectedArtists.some(item => item.artist.id === a.id);
                      return (
                        <div
                          key={a.id}
                          className={`roster-pick-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleArtist(a)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.profile_image || '/images/artist_reggae.jpg'}
                            alt={a.stage_name}
                            className="roster-card-img"
                          />
                          <div className="roster-card-info">
                            <div className="roster-card-name">{a.stage_name}</div>
                            <div className="roster-card-genre">{a.genre || a.category}</div>
                          </div>
                          <div className={`roster-card-status ${isSelected ? 'in-lineup' : ''}`}>
                            {isSelected ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} /> In Lineup
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Plus size={12} /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BUDGET OFFER */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                  <div className="field-group">
                    <label htmlFor="budget">Total Booking Budget Offer (USD) *</label>
                    <div className="input-with-icon-wrapper">
                      <DollarSign className="inner-field-icon" />
                      <input
                        id="budget"
                        type="number"
                        name="budget"
                        min="5000"
                        step="1000"
                        placeholder="Offer Amount"
                        value={form.budget}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <span className="field-helper-tip">
                      Budget offer should reflect total artist guarantees for your entire selected lineup (excluding production, backline riders, and hospitality).
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CONTACT INFO */}
            {step === 4 && (
              <div className="step-slide-content animate-fade">
                <h3>Client Verification & Details</h3>
                <div className="form-group-grid">
                  <div className="field-group">
                    <label htmlFor="company_name">Company / Organization</label>
                    <input
                      id="company_name"
                      type="text"
                      name="company_name"
                      placeholder="e.g. Acme Entertainment Group"
                      value={form.company_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="contact_name">Primary Contact Name *</label>
                    <input
                      id="contact_name"
                      type="text"
                      name="contact_name"
                      placeholder="Your Full Name"
                      value={form.contact_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="email">Email Address *</label>
                    <div className="input-with-icon-wrapper">
                      <Mail className="inner-field-icon" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="contact@company.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="+1 (876) 227-1666"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="field-group full-width-field">
                    <label htmlFor="details">Additional Notes / Technical Inquiries</label>
                    <textarea
                      id="details"
                      name="details"
                      rows={4}
                      placeholder="Detail any specifics regarding production, flights, routing or compliance requirements..."
                      value={form.details}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Actions */}
            <div className="wizard-actions-footer">
              {step > 1 ? (
                <button type="button" className="btn btn-tertiary" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4" /> Previous Step
                </button>
              ) : (
                <div></div> // empty spacer
              )}

              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary btn-glow" disabled={loading}>
                  <Sparkles className="w-4 h-4" /> 
                  {loading ? 'Submitting Booking...' : 'Submit Booking Inquiry'}
                </button>
              )}
            </div>

          </form>
        </div>
      )}

      <style jsx>{`
        .book-talent-container {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
          max-width: 900px !important;
        }

        .directory-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .directory-header p {
          max-width: 600px;
          margin: 0.5rem auto 0;
          color: var(--text-secondary);
        }

        /* Stepper indicators */
        .wizard-steps-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-xl);
          padding: 0 1rem;
        }

        .step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .node-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted);
          transition: all var(--transition-normal);
        }

        .step-node.active .node-num {
          background: rgba(212, 175, 55, 0.15);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
          box-shadow: var(--glow-gold);
        }

        .step-node.completed .node-num {
          background: var(--gold-primary);
          border-color: var(--gold-primary);
          color: var(--bg-primary);
        }

        .node-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 640px) {
          .node-label {
            display: none;
          }
        }

        .step-node.active .node-label {
          color: var(--gold-primary);
        }

        .step-node.completed .node-label {
          color: var(--text-primary);
        }

        .step-line {
          flex-grow: 1;
          height: 1px;
          background: var(--border-color);
          margin-bottom: 24px; /* aligned with center of circles */
        }

        @media (max-width: 640px) {
          .step-line {
            margin-bottom: 0;
          }
        }

        /* Form styling */
        .booking-wizard-form {
          border-color: rgba(212, 175, 55, 0.2);
          padding: var(--spacing-xl);
        }

        .step-slide-content h3 {
          font-size: 1.25rem;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid rgba(212, 175, 55, 0.05);
          padding-bottom: 8px;
        }

        .form-group-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 640px) {
          .form-group-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .full-width-field {
          grid-column: 1 / -1;
        }

        .field-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .input-with-icon-wrapper {
          position: relative;
        }

        .inner-field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: var(--gold-primary);
          pointer-events: none;
        }

        .input-with-icon-wrapper input, .input-with-icon-wrapper select {
          padding-left: 2.25rem;
        }

        .field-helper-tip {
          font-size: 0.725rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .wizard-actions-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-xl);
          border-top: 1px solid rgba(212, 175, 55, 0.08);
          padding-top: 1.5rem;
        }

        .btn-glow {
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
        }

        /* Success Overlay styling */
        .success-overlay {
          text-align: center;
          padding: var(--spacing-xxl) var(--spacing-lg);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          border-color: var(--gold-primary);
          box-shadow: var(--shadow-lg);
        }

        .success-icon {
          width: 64px;
          height: 64px;
          color: var(--color-success);
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.3));
        }

        .success-overlay h2 {
          font-size: 1.75rem;
          color: var(--gold-primary);
        }

        .success-tagline {
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .success-summary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem 2rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.9rem;
          min-width: 320px;
          margin: 1rem 0;
          box-shadow: var(--shadow-sm);
        }

        .redirect-note {
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 400px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-top-color: var(--gold-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-top: 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Multi-Artist Lineup Styles */
        .lineup-tray-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 1.25rem;
        }

        .lineup-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .lineup-empty-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .lineup-chips-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lineup-artist-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          gap: 10px;
          flex-wrap: wrap;
        }

        .lineup-artist-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--gold-primary);
        }

        .role-select-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lineup-role-select {
          padding: 4px 8px;
          font-size: 0.78rem;
          background: var(--bg-tertiary);
          color: var(--gold-primary);
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 6px;
          outline: none;
          cursor: pointer;
        }

        .lineup-remove-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .lineup-remove-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #fff;
        }

        .catalog-browser-block {
          margin-top: 1.25rem;
        }

        .catalog-controls-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 0.9rem;
        }

        .catalog-search-wrapper {
          position: relative;
          flex-grow: 1;
          min-width: 220px;
        }

        .catalog-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .catalog-search-input {
          width: 100%;
          padding: 6px 26px 6px 30px;
          font-size: 0.82rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
        }

        .catalog-search-input:focus {
          border-color: var(--gold-primary);
        }

        .catalog-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .category-pills-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .cat-pill-btn {
          padding: 4px 10px;
          font-size: 0.74rem;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .cat-pill-btn:hover {
          border-color: rgba(212, 175, 55, 0.4);
          color: var(--text-primary);
        }

        .cat-pill-btn.active {
          background: rgba(212, 175, 55, 0.18);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
          font-weight: 600;
        }

        .catalog-grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 10px;
          max-height: 290px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .roster-pick-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          cursor: pointer;
          transition: all 0.15s;
        }

        .roster-pick-card:hover {
          border-color: rgba(212, 175, 55, 0.4);
          background: rgba(212, 175, 55, 0.05);
        }

        .roster-pick-card.selected {
          border-color: var(--gold-primary);
          background: rgba(212, 175, 55, 0.12);
        }

        .roster-card-img {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .roster-card-info {
          flex-grow: 1;
          min-width: 0;
        }

        .roster-card-name {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .roster-card-genre {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .roster-card-status {
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .roster-card-status.in-lineup {
          background: var(--gold-primary);
          color: #000;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default function BookTalent() {
  return (
    <Suspense fallback={<div className="container" style={{ color: '#white', padding: '50px 20px', textAlign: 'center' }}>Loading Form...</div>}>
      <BookTalentContent />
    </Suspense>
  );
}
