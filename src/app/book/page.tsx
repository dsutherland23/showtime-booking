'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, Artist } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, DollarSign, User, Mail, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const BookTalentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, usersList, switchUser } = useAuth();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  
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

  // Sync parameters
  useEffect(() => {
    const loadArtists = async () => {
      const all = await db.getArtists();
      setArtists(all);

      const queryArtistId = searchParams.get('artistId');
      if (queryArtistId) {
        setSelectedArtistId(queryArtistId);
      } else if (all.length > 0) {
        setSelectedArtistId(all[0].id);
      }
    };
    loadArtists();
  }, [searchParams]);

  // Sync client profile details if user role is client
  useEffect(() => {
    if (user && user.role === 'Client') {
      setForm(f => ({
        ...f,
        contact_name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleNext = () => {
    setStep(s => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create client lead
      await db.createLead({
        company_name: form.company_name || undefined,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || undefined,
        country: form.country,
        assigned_to: 'usr-agent-1', // Route to staff agent Sarah
        details: `Event: ${form.event_title} (${form.event_type}) at ${form.venue_name}, ${form.city}. Attendance: ${form.attendance}. Notes: ${form.details}`,
        budget: parseFloat(form.budget) || 50000,
        preferred_date: form.event_date || new Date().toISOString().split('T')[0],
        artist_id: selectedArtistId || undefined
      });

      // 2. Confetti trigger and success UI
      setIsSubmitted(true);
      
      // Auto assign/switch identity to Michael Eavis (the client user) to view dashboard
      const clientUser = usersList.find(u => u.role === 'Client');
      if (clientUser) {
        await switchUser(clientUser.id);
      }

      // Confetti load
      if (typeof window !== 'undefined') {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#aa7c11', '#d4af37', '#f3e5ab', '#ffffff']
        });
      }

      // Redirect to Client Hub after short delay
      setTimeout(() => {
        router.push('/portal/client');
      }, 4000);

    } catch (err) {
      console.error('Failed to submit booking inquiry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-talent-container container">
      {/* Visual Success Overlay */}
      {isSubmitted ? (
        <div className="success-overlay glassmorphism animate-fade">
          <CheckCircle2 className="success-icon" />
          <h2>Booking Inquiry Submitted</h2>
          <p className="success-tagline">Your request has been routed to our Lead Agent Sarah Silverman.</p>
          <div className="success-summary">
            <p><strong>Artist Selected:</strong> {artists.find(a => a.id === selectedArtistId)?.stage_name}</p>
            <p><strong>Target Date:</strong> {form.event_date}</p>
            <p><strong>Budget Offer:</strong> ${parseFloat(form.budget).toLocaleString()} USD</p>
          </div>
          <p className="redirect-note">Redirecting you to the Client Hub where you can view proposal status, sign agreements, and chat with your agent...</p>
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
                      placeholder="e.g. Glastonbury festival 2026"
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
                      placeholder="e.g. Empire Polo Field / Pyramid Stage"
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
                <h3>Select Roster Talent & Budget Offer</h3>
                <div className="form-group-grid">
                  <div className="field-group">
                    <label htmlFor="artist_select">Select Preferred Artist *</label>
                    <div className="input-with-icon-wrapper">
                      <User className="inner-field-icon" />
                      <select 
                        id="artist_select"
                        value={selectedArtistId} 
                        onChange={(e) => setSelectedArtistId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Available Artist --</option>
                        {artists.map(a => (
                          <option key={a.id} value={a.id}>{a.stage_name} ({a.genre})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="field-group">
                    <label htmlFor="budget">Booking Budget Offer (USD) *</label>
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
                    <span className="field-helper-tip">Budget should cover artist guarantee (excluding production, rider expenses, and work permits).</span>
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
                      placeholder="e.g. Glastonbury Festivals Ltd"
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
                      placeholder="+1-876-555-1234"
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
