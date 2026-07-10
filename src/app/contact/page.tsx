'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Simple mock success
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-viewport container luxury-bg">
      <div className="section-header">
        <span className="gold-badge">Communications</span>
        <h2>Contact Our Agents</h2>
        <p>Get in touch with our global offices in Jamaica and the United Kingdom regarding logistics, billing, or representations.</p>
      </div>

      <div className="grid-2 contact-layout-grid">
        
        {/* Contact Info card */}
        <div className="luxury-card contact-info-card">
          <h3>Agency Terminals</h3>
          <p className="card-desc">For booking inquiries, please utilize our formal Booking intake portal or contact our agency team directly.</p>

          <div className="contact-details-list">
            <div className="contact-info-item">
              <MapPin className="contact-icon-tiny" />
              <div>
                <strong>Offices</strong>
                <p>Kingston, Jamaica &bull; London, United Kingdom</p>
              </div>
            </div>

            <div className="contact-info-item">
              <Mail className="contact-icon-tiny" />
              <div>
                <strong>Email Address</strong>
                <p>info@showtimeservices.com</p>
              </div>
            </div>

            <div className="contact-info-item">
              <Phone className="contact-icon-tiny" />
              <div>
                <strong>Hotline Phones</strong>
                <p style={{ lineHeight: '1.4' }}>
                  +1876 227 1666 (Jamaica)<br />
                  +44 7706 572197 (United Kingdom)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form card */}
        <div className="luxury-card contact-form-card">
          {submitted ? (
            <div className="contact-success animate-fade">
              <CheckCircle2 className="success-icon-contact" />
              <h3>Message Sent Successfully</h3>
              <p>Our communications coordinator will route your message to the appropriate department.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>Send Office Message</h3>
              <div className="form-fields-stack">
                <div className="field-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Paul Tollett"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Visa & Compliance">Visa & Compliance</option>
                    <option value="Press & Media Relations">Press & Media Relations</option>
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Enter your message here..."
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  <Send className="w-4 h-4" /> Send Office Message
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      <style jsx>{`
        .contact-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .contact-layout-grid {
          margin-top: var(--spacing-xl);
        }

        .card-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .contact-details-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border-top: 1px solid rgba(212, 175, 55, 0.05);
          padding-top: var(--spacing-lg);
        }

        .contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .contact-icon-tiny {
          width: 20px;
          height: 20px;
          color: var(--gold-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .contact-info-item strong {
          display: block;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .contact-info-item p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* Form stack */
        .form-fields-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: var(--spacing-md);
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .contact-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--spacing-xl) 0;
          gap: 12px;
        }

        .success-icon-contact {
          width: 48px;
          height: 48px;
          color: var(--color-success);
        }
      `}</style>
    </div>
  );
}
