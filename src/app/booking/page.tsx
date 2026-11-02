'use client';

import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, Artist, BookingArtistItem } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, MapPin, DollarSign, User, Mail, Sparkles, CheckCircle2,
  ChevronRight, ChevronLeft, Plus, X, Search, Check, Users, AlertCircle,
  Phone, Building2, Edit3, ArrowRight, ShieldCheck, RefreshCw, FileText
} from 'lucide-react';

export interface SelectedLineupArtist {
  artist: Artist;
  role: 'Headliner' | 'Supporting Act' | 'Special Guest' | 'DJ / Sound System' | 'Host';
}

interface FormState {
  // Step 1: Event Details
  event_title: string;
  event_type: string;
  event_date: string;
  attendance: string;

  // Step 2: Location
  venue_name: string;
  city: string;
  country: string;

  // Step 3: Artist & Budget
  budget: string;

  // Step 4: Contact Details
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  details: string;
}

const BUDGET_PRESETS = [
  { label: '$10,000', value: '10000' },
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000+', value: '250000' },
];

const INITIAL_FORM: FormState = {
  event_title: '',
  event_type: 'Festival',
  event_date: '',
  attendance: '1000',
  venue_name: '',
  city: '',
  country: 'Jamaica',
  budget: '50000',
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  details: ''
};

const BookTalentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, isClient } = useAuth();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<SelectedLineupArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Step navigation
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Fields & Validation State
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [stepError, setStepError] = useState('');
  const [lineupError, setLineupError] = useState('');

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Minimum allowed date is today in YYYY-MM-DD
  const minDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Restore draft from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('st_booking_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setForm(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // sessionStorage unavailable or parse error
    }
  }, []);

  // Sync draft changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('st_booking_draft', JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  // Load artists & prefill parameters
  useEffect(() => {
    let isMounted = true;
    const loadArtists = async () => {
      const all = await db.getArtists();
      if (!isMounted) return;
      setArtists(all);

      // Check query parameters
      const queryArtistId = searchParams.get('artistId') || searchParams.get('artist');
      const queryBudget = searchParams.get('budget');
      const queryEventTitle = searchParams.get('eventTitle') || searchParams.get('event');
      const queryEventType = searchParams.get('eventType');
      const queryVenue = searchParams.get('venue');
      const queryCity = searchParams.get('city');
      const queryDate = searchParams.get('date');
      const queryAttendance = searchParams.get('attendance');

      if (queryBudget) {
        setForm(f => ({ ...f, budget: queryBudget }));
      }
      if (queryEventTitle) {
        setForm(f => ({ ...f, event_title: queryEventTitle }));
      }
      if (queryEventType) {
        setForm(f => ({ ...f, event_type: queryEventType }));
      }
      if (queryVenue) {
        setForm(f => ({ ...f, venue_name: queryVenue }));
      }
      if (queryCity) {
        setForm(f => ({ ...f, city: queryCity }));
      }
      if (queryDate) {
        setForm(f => ({ ...f, event_date: queryDate }));
      }
      if (queryAttendance) {
        setForm(f => ({ ...f, attendance: queryAttendance }));
      }

      // Strictly start empty unless an artist was specifically passed via URL parameter
      if (queryArtistId) {
        const found = all.find(a => a.id === queryArtistId || a.stage_name.toLowerCase() === queryArtistId.toLowerCase());
        if (found) {
          setSelectedArtists([{ artist: found, role: 'Headliner' }]);
        } else {
          setSelectedArtists([]);
        }
      } else {
        setSelectedArtists([]);
      }
    };
    loadArtists();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Pre-fill form if user is a logged-in client
  useEffect(() => {
    if (user && profile && isClient) {
      setForm(f => ({
        ...f,
        contact_name: f.contact_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: f.email || profile.email || '',
        phone: f.phone || profile.phone || '',
        company_name: f.company_name || ''
      }));
    }
  }, [user, profile, isClient]);

  // Accessibility: Focus management when step changes
  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [step]);

  // Validation function per field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'event_title':
        if (!value.trim()) return 'Event title is required.';
        if (value.trim().length < 3) return 'Event title must be at least 3 characters.';
        return '';
      case 'event_date':
        if (!value) return 'Event date is required.';
        if (value < minDate) return 'Event date must be scheduled for today or in the future.';
        return '';
      case 'venue_name':
        if (!value.trim()) return 'Venue or stage name is required.';
        return '';
      case 'city':
        if (!value.trim()) return 'City is required.';
        return '';
      case 'country':
        if (!value.trim()) return 'Country / target market is required.';
        return '';
      case 'budget': {
        const num = parseFloat(value);
        if (isNaN(num) || num < 5000) return 'Minimum budget offer is $5,000 USD.';
        return '';
      }
      case 'contact_name':
        if (!value.trim()) return 'Contact name is required.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please provide a valid email address.';
        }
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required.';
        if (value.replace(/[^\d+]/g, '').length < 7) {
          return 'Please enter a valid telephone number with country/area code.';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setSubmitError(null);

    // Clear error dynamically if valid
    if (errors[name]) {
      const err = validateField(name, value);
      if (!err) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    if (err) {
      setErrors(prev => ({ ...prev, [name]: err }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleArtist = (art: Artist) => {
    setStepError('');
    setLineupError('');
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

  // Validate entire step before proceeding
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    if (currentStep === 1) {
      const titleErr = validateField('event_title', form.event_title);
      if (titleErr) newErrors.event_title = titleErr;
      newTouched.event_title = true;

      const dateErr = validateField('event_date', form.event_date);
      if (dateErr) newErrors.event_date = dateErr;
      newTouched.event_date = true;
    } else if (currentStep === 2) {
      const venueErr = validateField('venue_name', form.venue_name);
      if (venueErr) newErrors.venue_name = venueErr;
      newTouched.venue_name = true;

      const cityErr = validateField('city', form.city);
      if (cityErr) newErrors.city = cityErr;
      newTouched.city = true;

      const countryErr = validateField('country', form.country);
      if (countryErr) newErrors.country = countryErr;
      newTouched.country = true;
    } else if (currentStep === 3) {
      if (selectedArtists.length === 0) {
        setLineupError('Please select at least one headline or supporting act for your lineup.');
        setStepError('Please select at least one artist for your lineup before continuing.');
        const tray = document.getElementById('lineup-tray');
        if (tray) tray.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      setLineupError('');

      const budgetErr = validateField('budget', form.budget);
      if (budgetErr) newErrors.budget = budgetErr;
      newTouched.budget = true;
    } else if (currentStep === 4) {
      const contactErr = validateField('contact_name', form.contact_name);
      if (contactErr) newErrors.contact_name = contactErr;
      newTouched.contact_name = true;

      const emailErr = validateField('email', form.email);
      if (emailErr) newErrors.email = emailErr;
      newTouched.email = true;

      const phoneErr = validateField('phone', form.phone);
      if (phoneErr) newErrors.phone = phoneErr;
      newTouched.phone = true;
    }

    setTouched(prev => ({ ...prev, ...newTouched }));

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      setStepError('Please complete all required fields marked in red before proceeding.');
      // Auto-focus and scroll to first invalid input
      const firstInvalidKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstInvalidKey);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    setStepError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    setStepError('');
    setLineupError('');
    setSubmitError(null);
    setStep(s => Math.max(1, s - 1));
  };

  const goToStep = (targetStep: number) => {
    // Only allow jumping back, or jumping forward if all preceding steps validate
    if (targetStep < step) {
      setStepError('');
      setLineupError('');
      setSubmitError(null);
      setStep(targetStep);
      return;
    }

    if (targetStep > step) {
      for (let s = 1; s < targetStep; s++) {
        if (!validateStep(s)) {
          setStep(s);
          return;
        }
      }
      setStep(targetStep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Sequentially validate steps 1 through 4; navigate to first failing step
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
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

      const created = await db.createLead({
        client_id: user?.id || undefined,
        company_name: form.company_name.trim() || undefined,
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        country: form.country,
        details: `Event: ${form.event_title} (${form.event_type}) at ${form.venue_name}, ${form.city}. Lineup: [${lineupDisplay}]. Attendance: ${form.attendance}. Notes: ${form.details}`,
        budget: parseFloat(form.budget) || 50000,
        preferred_date: form.event_date || minDate,
        artist_id: selectedArtists[0]?.artist.id || undefined,
        artist_name: selectedArtists.map(a => a.artist.stage_name).join(', '),
        artists: artistItems
      });

      // Clear draft on successful submission
      try {
        sessionStorage.removeItem('st_booking_draft');
      } catch {
        // ignore
      }

      setSubmittedLeadId(created.id || `BK-${Date.now().toString(36).toUpperCase()}`);
      setIsSubmitted(true);

      if (typeof window !== 'undefined') {
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#aa7c11', '#d4af37', '#f3e5ab', '#ffffff']
          });
        } catch {
          // ignore confetti load failure
        }
      }

      // Auto redirect after 5 seconds to give time to read
      setTimeout(() => {
        router.push(user ? '/portal/client' : '/');
      }, 5000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while submitting your inquiry. Please try again.';
      setSubmitError(message);
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

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setSelectedArtists([]);
    setIsSubmitted(false);
    setStep(1);
    setErrors({});
    setTouched({});
    setStepError('');
    setLineupError('');
    setSubmitError(null);
    try {
      sessionStorage.removeItem('st_booking_draft');
    } catch {}
  };

  return (
    <main className="book-talent-container container">
      {/* Visual Success Screen */}
      {isSubmitted ? (
        <section className="success-overlay glassmorphism animate-fade" aria-live="polite">
          <CheckCircle2 className="success-icon" aria-hidden="true" />
          <h2>Booking Inquiry Submitted</h2>
          <p className="success-tagline">
            Your booking inquiry has been confirmed with reference ID{' '}
            <strong className="reference-code">{submittedLeadId}</strong>. Showtime executive booking agents will review your lineup offer and respond within 24 hours.
          </p>

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
              <strong>Total Budget Offer:</strong> ${parseFloat(form.budget || '0').toLocaleString()} USD
            </div>
            <div className="lineup-summary-block">
              <strong>Lineup ({selectedArtists.length} {selectedArtists.length === 1 ? 'Act' : 'Acts'}):</strong>
              <div className="lineup-tags-list">
                {selectedArtists.map(item => (
                  <span key={item.artist.id} className="lineup-tag-badge">
                    {item.artist.stage_name} <span className="lineup-tag-role">• {item.role}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="success-actions-row">
            <Link href={user ? '/portal/client' : '/'} className="btn btn-primary btn-glow">
              {user ? 'Open Client Portal' : 'Return to Home'} <ArrowRight size={16} />
            </Link>
            <button type="button" onClick={resetForm} className="btn btn-tertiary">
              <RefreshCw size={15} /> Book Another Showcase
            </button>
          </div>

          <p className="redirect-note">
            Redirecting automatically in a few seconds...
          </p>
          <div className="loading-spinner" aria-hidden="true"></div>
        </section>
      ) : (
        <div className="booking-wizard-wrapper">
          {/* Section Header */}
          <header className="directory-header">
            <span className="gold-badge">Showtime Booking 2026 Portal</span>
            <h1 className="booking-main-title">Book Showtime Talent</h1>
            <p>
              Submit an official booking inquiry to initiate artist availability verification, riders review, and contract evaluation.
            </p>
          </header>

          {/* Stepper Navigation Indicator */}
          <nav aria-label="Booking Progress" className="wizard-nav">
            <ol className="wizard-steps-indicator" role="list">
              {[
                { num: 1, label: 'Event Details' },
                { num: 2, label: 'Location' },
                { num: 3, label: 'Talent & Budget' },
                { num: 4, label: 'Contact & Review' },
              ].map(({ num, label }, index, arr) => {
                const isActive = step === num;
                const isCompleted = step > num;
                return (
                  <React.Fragment key={num}>
                    <li
                      className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => goToStep(num)}
                        className="step-node-button"
                        aria-label={`Step ${num}: ${label}${isCompleted ? ' (Completed - click to edit)' : isActive ? ' (Current Step)' : ''}`}
                        disabled={num > step}
                      >
                        <span className="node-num" aria-hidden="true">{isCompleted ? '✓' : num}</span>
                        <span className="node-label">{label}</span>
                      </button>
                    </li>
                    {index < arr.length - 1 && <li className={`step-line ${isCompleted ? 'completed' : ''}`} aria-hidden="true" />}
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>

          {/* Global Step / Network Alert */}
          {(stepError || submitError) && (
            <div
              className="error-banner animate-fade"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle size={18} className="error-banner-icon" aria-hidden="true" />
              <span>{submitError || stepError}</span>
            </div>
          )}

          {/* Booking Form Card */}
          <form
            ref={formRef}
            className="luxury-card booking-wizard-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* STEP 1: EVENT DETAILS */}
            {step === 1 && (
              <fieldset className="step-slide-content animate-fade">
                <legend className="sr-only">Step 1: Event Specifications</legend>
                <h3 ref={stepHeadingRef} tabIndex={-1} className="step-title">
                  Step 1: Event Specifications
                </h3>

                <div className="form-group-grid">
                  {/* Event Title */}
                  <div className="field-group full-width-field">
                    <label htmlFor="event_title">
                      Event Title <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="event_title"
                      type="text"
                      name="event_title"
                      placeholder="e.g. Montego Bay Reggae Sunfest 2026"
                      value={form.event_title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.event_title}
                      aria-describedby={errors.event_title ? 'event_title-error' : undefined}
                      className={errors.event_title && touched.event_title ? 'has-error' : ''}
                    />
                    {errors.event_title && touched.event_title && (
                      <span id="event_title-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.event_title}
                      </span>
                    )}
                  </div>

                  {/* Event Type */}
                  <div className="field-group">
                    <label htmlFor="event_type">
                      Event Type <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="event_type"
                      name="event_type"
                      value={form.event_type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                    >
                      <option value="Festival">Music Festival</option>
                      <option value="Corporate Event">Corporate Gala</option>
                      <option value="Club Show">Nightclub Performance</option>
                      <option value="Arena Tour">Arena / Stadium Tour</option>
                      <option value="Wedding">Private Wedding</option>
                      <option value="Private Party">VIP Private Event</option>
                    </select>
                  </div>

                  {/* Event Date */}
                  <div className="field-group">
                    <label htmlFor="event_date">
                      Event Date <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <Calendar className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="event_date"
                        type="date"
                        name="event_date"
                        min={minDate}
                        value={form.event_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.event_date}
                        aria-describedby={errors.event_date ? 'event_date-error' : undefined}
                        className={errors.event_date && touched.event_date ? 'has-error' : ''}
                      />
                    </div>
                    {errors.event_date && touched.event_date && (
                      <span id="event_date-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.event_date}
                      </span>
                    )}
                  </div>

                  {/* Expected Attendance */}
                  <div className="field-group">
                    <label htmlFor="attendance">
                      Expected Attendance <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="attendance"
                      name="attendance"
                      value={form.attendance}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                    >
                      <option value="500">Intimate / VIP (&lt; 500 attendees)</option>
                      <option value="1500">Medium Scale (500 - 2,000 attendees)</option>
                      <option value="5000">Large Scale (2,000 - 10,000 attendees)</option>
                      <option value="25000">Major Stadium / Festival (10,000+ attendees)</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <fieldset className="step-slide-content animate-fade">
                <legend className="sr-only">Step 2: Venue and Geography</legend>
                <h3 ref={stepHeadingRef} tabIndex={-1} className="step-title">
                  Step 2: Venue & Geography
                </h3>

                <div className="form-group-grid">
                  <div className="field-group full-width-field">
                    <label htmlFor="venue_name">
                      Venue Name / Stage <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <Building2 className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="venue_name"
                        type="text"
                        name="venue_name"
                        placeholder="e.g. Catherine Hall Entertainment Complex / National Stadium"
                        value={form.venue_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.venue_name}
                        aria-describedby={errors.venue_name ? 'venue_name-error' : undefined}
                        className={errors.venue_name && touched.venue_name ? 'has-error' : ''}
                      />
                    </div>
                    {errors.venue_name && touched.venue_name && (
                      <span id="venue_name-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.venue_name}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="city">
                      City <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <MapPin className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="city"
                        type="text"
                        name="city"
                        placeholder="e.g. Kingston or Montego Bay"
                        value={form.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.city}
                        aria-describedby={errors.city ? 'city-error' : undefined}
                        className={errors.city && touched.city ? 'has-error' : ''}
                      />
                    </div>
                    {errors.city && touched.city && (
                      <span id="city-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.city}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="country">
                      Target Market / Country <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                    >
                      <option value="Jamaica">Jamaica</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Caribbean">Other Caribbean Island</option>
                      <option value="Europe">Europe</option>
                      <option value="Middle East">Middle East</option>
                      <option value="International">Other International Territory</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* STEP 3: TALENT & BUDGET */}
            {step === 3 && (
              <fieldset className="step-slide-content animate-fade">
                <legend className="sr-only">Step 3: Lineup and Budget Selection</legend>
                <div className="step-header-flex">
                  <div>
                    <h3 ref={stepHeadingRef} tabIndex={-1} className="step-title" style={{ margin: 0 }}>
                      Step 3: Assemble Event Lineup & Budget Offer
                    </h3>
                    <p className="step-subtitle">
                      Curate single or multiple headline and supporting acts for your lineup.
                    </p>
                  </div>
                  <span className="selected-counter-badge">
                    {selectedArtists.length} {selectedArtists.length === 1 ? 'Artist Selected' : 'Artists in Lineup'}
                  </span>
                </div>

                {/* CURRENT LINEUP TRAY */}
                <div
                  id="lineup-tray"
                  className={`lineup-tray-container ${lineupError ? 'has-lineup-error' : ''}`}
                  role="region"
                  aria-label="Current Lineup"
                >
                  <div className="lineup-tray-header">
                    <span className="tray-label">Selected Event Lineup</span>
                    {selectedArtists.length > 0 && (
                      <span className="tray-hint">Configure performance role for each act</span>
                    )}
                  </div>

                  {selectedArtists.length === 0 ? (
                    <div className="lineup-empty-state">
                      <Users size={24} className="empty-icon" aria-hidden="true" />
                      <div>
                        <div className="empty-title">No artists in your lineup yet</div>
                        <div className="empty-desc">Select acts from the Showtime roster below to build your inquiry.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="lineup-chips-list">
                      {selectedArtists.map(item => (
                        <div key={item.artist.id} className="lineup-artist-row">
                          <div className="artist-preview-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.artist.profile_image || '/images/artist_reggae.jpg'}
                              alt=""
                              aria-hidden="true"
                              className="lineup-artist-avatar"
                            />
                            <div>
                              <div className="lineup-name">{item.artist.stage_name}</div>
                              <div className="lineup-genre">{item.artist.genre || item.artist.category}</div>
                            </div>
                          </div>

                          <div className="lineup-actions-block">
                            <div className="role-select-wrapper">
                              <label htmlFor={`role-${item.artist.id}`} className="sr-only">
                                Performance role for {item.artist.stage_name}
                              </label>
                              <select
                                id={`role-${item.artist.id}`}
                                value={item.role}
                                onChange={(e) => updateArtistRole(item.artist.id, e.target.value as SelectedLineupArtist['role'])}
                                className="lineup-role-select"
                                aria-label={`Performance role for ${item.artist.stage_name}`}
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
                              aria-label={`Remove ${item.artist.stage_name} from lineup`}
                              title={`Remove ${item.artist.stage_name}`}
                            >
                              <X size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {lineupError && (
                  <div className="field-error-msg" role="alert" style={{ marginTop: '0.65rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={15} aria-hidden="true" />
                    <span>{lineupError}</span>
                  </div>
                )}

                {/* ROSTER CATALOG SELECTOR */}
                <div className="catalog-browser-block">
                  <div className="catalog-controls-row">
                    <div className="catalog-search-wrapper">
                      <Search size={14} className="catalog-search-icon" aria-hidden="true" />
                      <input
                        type="search"
                        placeholder="Search roster by stage name, genre, category..."
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        className="catalog-search-input"
                        aria-label="Search Showtime artist roster"
                      />
                      {artistSearch && (
                        <button
                          type="button"
                          onClick={() => setArtistSearch('')}
                          className="catalog-search-clear"
                          aria-label="Clear search query"
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div className="category-pills-row" role="group" aria-label="Filter by genre or category">
                      {uniqueCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`cat-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                          aria-pressed={categoryFilter === cat}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="catalog-grid-cards" role="list" aria-label="Available Talent Roster">
                    {filteredCatalogArtists.map(a => {
                      const isSelected = selectedArtists.some(item => item.artist.id === a.id);
                      return (
                        <div
                          key={a.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? 'Remove' : 'Add'} ${a.stage_name} (${a.genre || a.category}) ${isSelected ? 'from' : 'to'} lineup`}
                          onClick={() => toggleArtist(a)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              toggleArtist(a);
                            }
                          }}
                          className={`roster-pick-card ${isSelected ? 'selected' : ''}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.profile_image || '/images/artist_reggae.jpg'}
                            alt=""
                            aria-hidden="true"
                            className="roster-card-img"
                          />
                          <div className="roster-card-info">
                            <div className="roster-card-name">{a.stage_name}</div>
                            <div className="roster-card-genre">{a.genre || a.category}</div>
                          </div>
                          <div className={`roster-card-status ${isSelected ? 'in-lineup' : ''}`} aria-hidden="true">
                            {isSelected ? (
                              <span className="status-flex">
                                <Check size={13} /> In Lineup
                              </span>
                            ) : (
                              <span className="status-flex">
                                <Plus size={13} /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredCatalogArtists.length === 0 && (
                    <div className="no-catalog-match">
                      No artists found matching &quot;{artistSearch}&quot;.
                    </div>
                  )}
                </div>

                {/* BUDGET OFFER */}
                <div className="budget-section-divider">
                  <div className="field-group">
                    <label htmlFor="budget">
                      Total Booking Budget Offer (USD) <span className="req-star" aria-hidden="true">*</span>
                    </label>

                    {/* Quick Budget Presets */}
                    <div className="budget-presets-row" role="group" aria-label="Quick budget offer presets">
                      {BUDGET_PRESETS.map(preset => {
                        const isPresetActive = form.budget === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                              setForm(f => ({ ...f, budget: preset.value }));
                              setErrors(prev => {
                                const next = { ...prev };
                                delete next.budget;
                                return next;
                              });
                            }}
                            className={`budget-preset-pill ${isPresetActive ? 'active' : ''}`}
                            aria-pressed={isPresetActive}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="input-with-icon-wrapper">
                      <DollarSign className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="budget"
                        type="number"
                        name="budget"
                        min="5000"
                        step="1000"
                        placeholder="Offer Amount in USD"
                        value={form.budget}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.budget}
                        aria-describedby={errors.budget ? 'budget-error' : 'budget-tip'}
                        className={errors.budget && touched.budget ? 'has-error' : ''}
                      />
                    </div>
                    {errors.budget && touched.budget && (
                      <span id="budget-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.budget}
                      </span>
                    )}
                    <span id="budget-tip" className="field-helper-tip">
                      Budget offer should reflect total artist guarantees for your selected lineup (excluding production, backline riders, and local hospitality).
                    </span>
                  </div>
                </div>
              </fieldset>
            )}

            {/* STEP 4: CONTACT INFO & INQUIRY REVIEW */}
            {step === 4 && (
              <fieldset className="step-slide-content animate-fade">
                <legend className="sr-only">Step 4: Contact Details & Inquiry Review</legend>
                <h3 ref={stepHeadingRef} tabIndex={-1} className="step-title">
                  Step 4: Client Verification & Inquiry Review
                </h3>

                {/* 2026 Inquiry Summary / Pre-flight Review */}
                <div className="inquiry-review-card glassmorphism">
                  <div className="review-card-header">
                    <span className="review-card-badge">
                      <ShieldCheck size={14} aria-hidden="true" /> Inquiry Summary
                    </span>
                    <span className="review-status-pill">Ready for Evaluation</span>
                  </div>

                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Event:</span>
                      <strong className="review-value">
                        {form.event_title || 'Showcase'} ({form.event_type})
                      </strong>
                      <button type="button" onClick={() => goToStep(1)} className="review-edit-btn" aria-label="Edit event details">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>

                    <div className="review-item">
                      <span className="review-label">Date & Attendance:</span>
                      <strong className="review-value">
                        {form.event_date || 'TBD'} • {form.attendance} attendees
                      </strong>
                      <button type="button" onClick={() => goToStep(1)} className="review-edit-btn" aria-label="Edit date and attendance">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>

                    <div className="review-item">
                      <span className="review-label">Location:</span>
                      <strong className="review-value">
                        {form.venue_name ? `${form.venue_name}, ` : ''}{form.city}, {form.country}
                      </strong>
                      <button type="button" onClick={() => goToStep(2)} className="review-edit-btn" aria-label="Edit location">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>

                    <div className="review-item">
                      <span className="review-label">Budget Offer:</span>
                      <strong className="review-value gold-text">
                        ${parseFloat(form.budget || '0').toLocaleString()} USD
                      </strong>
                      <button type="button" onClick={() => goToStep(3)} className="review-edit-btn" aria-label="Edit budget offer">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                  </div>

                  <div className="review-lineup-row">
                    <span className="review-label">Lineup Acts ({selectedArtists.length}):</span>
                    <div className="review-acts-list">
                      {selectedArtists.map(item => (
                        <span key={item.artist.id} className="review-act-chip">
                          {item.artist.stage_name} <span className="act-role-sub">({item.role})</span>
                        </span>
                      ))}
                    </div>
                    <button type="button" onClick={() => goToStep(3)} className="review-edit-btn inline-edit" aria-label="Edit lineup">
                      <Edit3 size={12} /> Edit Lineup
                    </button>
                  </div>
                </div>

                <div className="form-group-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="field-group">
                    <label htmlFor="company_name">Company / Organization</label>
                    <div className="input-with-icon-wrapper">
                      <Building2 className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="company_name"
                        type="text"
                        name="company_name"
                        placeholder="e.g. Island Wave Entertainment"
                        value={form.company_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="contact_name">
                      Primary Contact Name <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <User className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="contact_name"
                        type="text"
                        name="contact_name"
                        placeholder="Your Full Legal Name"
                        value={form.contact_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.contact_name}
                        aria-describedby={errors.contact_name ? 'contact_name-error' : undefined}
                        className={errors.contact_name && touched.contact_name ? 'has-error' : ''}
                      />
                    </div>
                    {errors.contact_name && touched.contact_name && (
                      <span id="contact_name-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.contact_name}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="email">
                      Email Address <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <Mail className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="executive@company.com"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className={errors.email && touched.email ? 'has-error' : ''}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <span id="email-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="phone">
                      Phone Number <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <Phone className="inner-field-icon" aria-hidden="true" />
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="+1 (876) 555-0199"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className={errors.phone && touched.phone ? 'has-error' : ''}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <span id="phone-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className="field-group full-width-field">
                    <label htmlFor="details">Additional Notes / Rider Specifications</label>
                    <textarea
                      id="details"
                      name="details"
                      rows={3}
                      placeholder="Specify requirements regarding travel accommodations, private jet routing, backline equipment, staging, or sound engineering..."
                      value={form.details}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Wizard Navigation Actions Footer */}
            <div className="wizard-actions-footer">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn btn-tertiary"
                  onClick={handlePrev}
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous Step
                </button>
              ) : (
                <div></div>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  Next Step <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary btn-glow"
                  disabled={loading}
                  aria-busy={loading}
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  {loading ? 'Submitting Booking Inquiry...' : 'Submit Booking Inquiry'}
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
          max-width: 920px !important;
        }

        .directory-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .booking-main-title {
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0.5rem 0;
          background: linear-gradient(135deg, #ffffff 0%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .directory-header p {
          max-width: 620px;
          margin: 0.5rem auto 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* Stepper navigation */
        .wizard-nav {
          margin-bottom: var(--spacing-xl);
        }

        .wizard-steps-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.5rem;
          list-style: none;
          margin: 0;
        }

        .step-node {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .step-node-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          outline: none;
        }

        .step-node-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .node-num {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
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
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.35);
        }

        .step-node.completed .node-num {
          background: var(--gold-primary);
          border-color: var(--gold-primary);
          color: #07050e;
          font-weight: 700;
        }

        .step-node-button:focus-visible .node-num {
          outline: 2px solid var(--gold-primary);
          outline-offset: 3px;
        }

        .node-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s;
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
          height: 2px;
          background: var(--border-color);
          margin: 0 12px;
          transition: background-color 0.3s;
        }

        .step-line.completed {
          background: var(--gold-primary);
        }

        /* Error Banner */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          font-size: 0.88rem;
          margin-bottom: 1.5rem;
        }

        .error-banner-icon {
          flex-shrink: 0;
          color: #ef4444;
        }

        /* Form styling */
        .booking-wizard-form {
          border: 1px solid rgba(212, 175, 55, 0.2);
          padding: var(--spacing-xl);
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .step-slide-content {
          border: none;
          padding: 0;
          margin: 0;
        }

        .step-title {
          font-size: 1.35rem;
          font-weight: 600;
          color: var(--gold-primary);
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid rgba(212, 175, 55, 0.12);
          padding-bottom: 10px;
          outline: none;
        }

        .step-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .step-subtitle {
          margin: 0.25rem 0 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .selected-counter-badge {
          font-size: 0.82rem;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(212, 175, 55, 0.18);
          color: var(--gold-primary);
          border: 1px solid rgba(212, 175, 55, 0.35);
          font-weight: 600;
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
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .req-star {
          color: var(--gold-primary);
          font-weight: bold;
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

        .input-with-icon-wrapper input,
        .input-with-icon-wrapper select {
          padding-left: 2.35rem;
        }

        /* Required field feedback & user-invalid styling */
        input:user-invalid,
        select:user-invalid,
        textarea:user-invalid,
        input.has-error,
        select.has-error,
        textarea.has-error {
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.04);
        }

        input:required:user-valid,
        select:required:user-valid {
          border-color: rgba(48, 209, 88, 0.5);
        }

        .field-error-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #fca5a5;
          font-size: 0.76rem;
          margin-top: 2px;
          font-weight: 500;
        }

        .field-helper-tip {
          font-size: 0.74rem;
          color: var(--text-muted);
          line-height: 1.35;
          margin-top: 3px;
        }

        /* Budget Presets */
        .budget-presets-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .budget-preset-pill {
          padding: 4px 10px;
          font-size: 0.78rem;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .budget-preset-pill:hover {
          border-color: var(--gold-primary);
          color: var(--text-primary);
        }

        .budget-preset-pill.active {
          background: var(--gold-primary);
          color: #07050e;
          font-weight: 600;
          border-color: var(--gold-primary);
        }

        .budget-section-divider {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(212, 175, 55, 0.15);
        }

        /* Inquiry Review & Summary Card in Step 4 */
        .inquiry-review-card {
          background: rgba(212, 175, 55, 0.04);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .review-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gold-primary);
        }

        .review-status-pill {
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 12px;
          background: rgba(48, 209, 88, 0.15);
          color: var(--color-success);
          font-weight: 600;
        }

        .review-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
        }

        @media (min-width: 640px) {
          .review-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .review-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: relative;
        }

        .review-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .review-value {
          font-size: 0.88rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .gold-text {
          color: var(--gold-primary);
          font-size: 1rem;
        }

        .review-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--gold-primary);
          font-size: 0.72rem;
          cursor: pointer;
          padding: 0;
          margin-top: 2px;
          opacity: 0.85;
          transition: opacity 0.15s;
        }

        .review-edit-btn:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .review-lineup-row {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .review-acts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .review-act-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          border-radius: 6px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.25);
          color: var(--gold-primary);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .act-role-sub {
          opacity: 0.75;
          font-size: 0.72rem;
        }

        .inline-edit {
          align-self: flex-start;
          margin-top: 4px;
        }

        /* Lineup Tray in Step 3 */
        .lineup-tray-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 1.25rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .lineup-tray-container.has-lineup-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.25);
        }

        .lineup-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .tray-label {
          font-size: 0.82rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .tray-hint {
          font-size: 0.75rem;
          color: var(--gold-primary);
        }

        .lineup-empty-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 1.25rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .empty-icon {
          opacity: 0.5;
          color: var(--gold-primary);
        }

        .empty-title {
          font-weight: 600;
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        .empty-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
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
          padding: 0.55rem 0.85rem;
          gap: 10px;
          flex-wrap: wrap;
        }

        .artist-preview-block {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 170px;
        }

        .lineup-artist-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--gold-primary);
        }

        .lineup-name {
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        .lineup-genre {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .lineup-actions-block {
          display: flex;
          align-items: center;
          gap: 8px;
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
          padding: 6px;
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

        /* Catalog Roster */
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
          padding: 7px 26px 7px 30px;
          font-size: 0.84rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
        }

        .catalog-search-input:focus {
          border-color: var(--gold-primary);
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
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
          grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
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
          user-select: none;
          outline: none;
        }

        .roster-pick-card:hover,
        .roster-pick-card:focus-visible {
          border-color: rgba(212, 175, 55, 0.45);
          background: rgba(212, 175, 55, 0.05);
        }

        .roster-pick-card:focus-visible {
          outline: 2px solid var(--gold-primary);
          outline-offset: 1px;
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
          font-size: 0.85rem;
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
          color: #07050e;
          font-weight: 700;
        }

        .status-flex {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .no-catalog-match {
          padding: 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Wizard Footer */
        .wizard-actions-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-xl);
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          padding-top: 1.5rem;
        }

        .btn-glow {
          box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);
        }

        /* Success Overlay */
        .success-overlay {
          text-align: center;
          padding: var(--spacing-xxl) var(--spacing-lg);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
          border: 1px solid var(--gold-primary);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
          background: var(--bg-card);
        }

        .success-icon {
          width: 64px;
          height: 64px;
          color: var(--color-success);
          filter: drop-shadow(0 0 12px rgba(48, 209, 88, 0.35));
        }

        .success-overlay h2 {
          font-size: 1.85rem;
          color: var(--gold-primary);
          margin: 0;
        }

        .success-tagline {
          font-size: 0.98rem;
          color: var(--text-secondary);
          max-width: 580px;
          line-height: 1.5;
        }

        .reference-code {
          color: var(--gold-primary);
          letter-spacing: 0.05em;
        }

        .success-summary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem 2rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 0.9rem;
          min-width: 320px;
          max-width: 600px;
          width: 100%;
          margin: 0.5rem 0;
          box-shadow: var(--shadow-sm);
        }

        .lineup-summary-block {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lineup-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.35rem;
        }

        .lineup-tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(212, 175, 55, 0.15);
          color: var(--gold-primary);
          font-size: 0.8rem;
        }

        .lineup-tag-role {
          opacity: 0.7;
          font-size: 0.7rem;
        }

        .success-actions-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .redirect-note {
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 400px;
          margin: 0;
        }

        .loading-spinner {
          width: 22px;
          height: 22px;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-top-color: var(--gold-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
};

export default function BookTalent() {
  return (
    <Suspense
      fallback={
        <div
          className="container"
          style={{
            color: 'var(--text-primary)',
            padding: '80px 20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '2px solid rgba(212,175,55,0.2)',
              borderTopColor: 'var(--gold-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px'
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Initializing Showtime Reservation Portal...
          </p>
        </div>
      }
    >
      <BookTalentContent />
    </Suspense>
  );
}
