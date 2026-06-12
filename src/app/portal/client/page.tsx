'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, Booking, Contract, Invoice, Message } from '@/utils/db';
import { 
  FileText, CreditCard, MessageSquare, ShieldAlert, CheckCircle2, 
  Send, Sparkles, AlertCircle, HelpCircle, MapPin, DollarSign, Calendar
} from 'lucide-react';

export default function ClientPortal() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Interactive UI State
  const [activeTab, setActiveTab] = useState<'bookings' | 'contracts' | 'billing' | 'chat'>('bookings');
  
  // Contract signing drawer
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [signatureName, setSignatureName] = useState('');
  
  // Checkout payment modal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Chat window state
  const [chatMessage, setChatMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const loadClientData = async () => {
    if (!user) return;
    try {
      const allBks = await db.getBookings();
      // Filter bookings for this client
      // For simulator simplicity, let's show all or filter by name matching
      const clientBks = allBks.filter(b => b.client_id.includes('cli') || b.client_name.toLowerCase().includes(user.last_name.toLowerCase()));
      setBookings(clientBks);

      const allCtrs = await db.getContracts();
      const bkIds = clientBks.map(b => b.id);
      setContracts(allCtrs.filter(c => bkIds.includes(c.booking_id)));

      const allInvs = await db.getInvoices();
      setInvoices(allInvs.filter(i => bkIds.includes(i.booking_id)));

      // Load messages with Sarah Silverman (usr-agent-1)
      const chatMsgs = await db.getMessages(user.id, 'usr-agent-1');
      setMessages(chatMsgs);
    } catch (err) {
      console.error('Failed to load client data:', err);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [user]);

  // Scroll chat bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Unauthorized page
  if (!user || user.role !== 'Client') {
    return (
      <div className="container dashboard-unauthorized animate-fade">
        <ShieldAlert className="unauth-icon" />
        <h2>Client Hub Restricted</h2>
        <p>This portal is reserved for Showtime Clients. Please use the floating control panel in the bottom corner to swap identity to Michael Eavis (Client) to view client bookings, contract agreements, invoices, and messaging portals.</p>
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

  // Handle contract execution
  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract || !signatureName.trim()) return;
    await db.signContract(activeContract.id, signatureName);
    
    // Confetti on sign
    if (typeof window !== 'undefined') {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#d4af37', '#ffffff']
      });
    }

    setActiveContract(null);
    setSignatureName('');
    await loadClientData();
  };

  // Handle invoice payment
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setProcessing(true);
    
    // Simulate Stripe Gateway delay
    setTimeout(async () => {
      await db.processPayment(activeInvoice.id, activeInvoice.balance_due, 'Credit Card');
      setProcessing(false);
      setPaymentSuccess(true);
      
      // Confetti on pay
      if (typeof window !== 'undefined') {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#ffffff']
        });
      }

      setTimeout(() => {
        setPaymentSuccess(false);
        setActiveInvoice(null);
        setCcNumber('');
        setCcExpiry('');
        setCcCvv('');
        loadClientData();
      }, 2000);
    }, 1500);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    await db.sendMessage(user.id, 'usr-agent-1', chatMessage);
    setChatMessage('');
    
    // Refresh messages
    const chatMsgs = await db.getMessages(user.id, 'usr-agent-1');
    setMessages(chatMsgs);

    // Mock agent automated instant reply on first message for high interactive feel
    setTimeout(async () => {
      await db.sendMessage('usr-agent-1', user.id, 'Hi Michael! I have received your message. I am currently verifying technical riders with the artist representative and will get back to you shortly.');
      const updatedMsgs = await db.getMessages(user.id, 'usr-agent-1');
      setMessages(updatedMsgs);
    }, 2000);
  };

  return (
    <div className="client-portal-viewport container">
      
      {/* Portal Header */}
      <div className="portal-header-row">
        <div>
          <span className="gold-badge">Client Portal</span>
          <h2>Welcome back, {user.first_name}</h2>
          <p>Review agreements, sign pending performance contracts, clear deposits, and consult with Sarah (Assigned Agent).</p>
        </div>
      </div>

      {/* Tabs Sub Navigation */}
      <div className="portal-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings ({bookings.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts ({contracts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing & Invoices ({invoices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat with Agent
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="portal-panel-wrapper">
        
        {/* 1. BOOKINGS PANEL */}
        {activeTab === 'bookings' && (
          <div className="tab-slide-panel animate-fade">
            {bookings.length > 0 ? (
              <div className="grid-2">
                {bookings.map(bk => (
                  <div key={bk.id} className="luxury-card booking-detail-card">
                    <div className="bk-artist-row">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bk.artist_image} alt={bk.artist_name} className="bk-artist-thumb" />
                      <div>
                        <h3>{bk.artist_name}</h3>
                        <span className="bk-status-bubble">{bk.status}</span>
                      </div>
                    </div>
                    
                    <div className="bk-details-list">
                      <div className="bk-detail-item">
                        <Calendar className="item-icon-tiny" />
                        <div>
                          <strong>Date:</strong> <span>{bk.event_date}</span>
                        </div>
                      </div>
                      <div className="bk-detail-item">
                        <MapPin className="item-icon-tiny" />
                        <div>
                          <strong>Venue:</strong> <span>{bk.event_venue} ({bk.event_country})</span>
                        </div>
                      </div>
                      <div className="bk-detail-item">
                        <DollarSign className="item-icon-tiny" />
                        <div>
                          <strong>Guaranteed Fee:</strong> <span>${bk.total_amount.toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-panel glassmorphism">
                <AlertCircle className="empty-icon" />
                <h3>No Confirmed Bookings</h3>
                <p>You don&apos;t have any active booking agreements yet. Request talent to initiate bookings.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. CONTRACTS PANEL */}
        {activeTab === 'contracts' && (
          <div className="tab-slide-panel animate-fade">
            {contracts.length > 0 ? (
              <div className="contracts-table-card luxury-card">
                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Agreement Name</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Signed Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(ctr => {
                        const bk = bookings.find(b => b.id === ctr.booking_id);
                        return (
                          <tr key={ctr.id}>
                            <td>
                              <strong>Performance Agreement: {bk?.artist_name}</strong>
                              <p className="table-subtext">Booking ID: {ctr.booking_id}</p>
                            </td>
                            <td>
                              <span className={`table-badge-status ${ctr.status.toLowerCase()}`}>
                                {ctr.status}
                              </span>
                            </td>
                            <td>{new Date(ctr.created_at).toLocaleDateString()}</td>
                            <td>{ctr.signed_at ? new Date(ctr.signed_at).toLocaleDateString() : '--'}</td>
                            <td className="text-right">
                              {ctr.status === 'Sent' || ctr.status === 'Draft' ? (
                                <button 
                                  className="btn btn-primary btn-sm-padding" 
                                  onClick={() => setActiveContract(ctr)}
                                >
                                  Review & Sign
                                </button>
                              ) : (
                                <span className="text-emerald-500 font-medium">Agreement Executed ✓</span>
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
                <h3>No Pending Contracts</h3>
                <p>Contracts are issued by agents once event details and riders are finalized.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. BILLING PANEL */}
        {activeTab === 'billing' && (
          <div className="tab-slide-panel animate-fade">
            {invoices.length > 0 ? (
              <div className="contracts-table-card luxury-card">
                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Invoice Target</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Total Amount</th>
                        <th>Balance Due</th>
                        <th className="text-right">Checkout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => {
                        const bk = bookings.find(b => b.id === inv.booking_id);
                        return (
                          <tr key={inv.id}>
                            <td>
                              <strong>Performance Deposit: {bk?.artist_name}</strong>
                              <p className="table-subtext">Invoice ID: {inv.id}</p>
                            </td>
                            <td>{inv.due_date}</td>
                            <td>
                              <span className={`table-badge-status ${inv.status.toLowerCase()}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td>${inv.amount.toLocaleString()}</td>
                            <td>${inv.balance_due.toLocaleString()}</td>
                            <td className="text-right">
                              {inv.status !== 'Paid' ? (
                                <button 
                                  className="btn btn-primary btn-sm-padding"
                                  onClick={() => setActiveInvoice(inv)}
                                >
                                  Pay Deposit
                                </button>
                              ) : (
                                <span className="text-emerald-500 font-medium">Invoice Settled ✓</span>
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
                <CreditCard className="empty-icon" />
                <h3>No Invoices Available</h3>
                <p>Billing summaries will appear here once booking quotes or deposit values are structured.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. CHAT PANEL */}
        {activeTab === 'chat' && (
          <div className="tab-slide-panel animate-fade">
            <div className="luxury-card chat-box-widget">
              <div className="chat-box-header">
                <div className="agent-profile-avatar">S</div>
                <div>
                  <h4>Sarah Silverman</h4>
                  <p>Assigned Booking Agent &bull; sarah.agent@showtime.com</p>
                </div>
              </div>

              <div className="chat-messages-scroller">
                {messages.map(m => (
                  <div key={m.id} className={`msg-bubble-row ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                    <div className="msg-bubble">
                      <p>{m.message}</p>
                      <span className="msg-time">
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type message to your representing agent..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-icon-only">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* A. DIGITAL CONTRACT SIGNING DRAWER/MODAL */}
      {activeContract && (
        <div className="portal-modal-backdrop">
          <div className="portal-modal-card glassmorphism animate-fade">
            <div className="modal-header">
              <h3>Sign Performance Contract</h3>
              <button className="btn-close-modal" onClick={() => setActiveContract(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleSignContract}>
              <div className="contract-preview-box">
                <h4>STANDARD PERFORMANCE AGREEMENT</h4>
                <p>This document certifies that the Artist agrees to perform on the specified target date at the designated venue for the guaranteed fee. Hospitality and technical requirements must be aligned with the attached riders. Deposit must be cleared to validate this agreement.</p>
                <div className="preview-signatures-row">
                  <div>
                    <span className="sign-line-label">Artist representative:</span>
                    <span className="signature-font">Sarah Silverman</span>
                  </div>
                  <div>
                    <span className="sign-line-label">Client representative:</span>
                    <span className="signature-font placeholder-sig">Pending Sign</span>
                  </div>
                </div>
              </div>

              <div className="field-group sign-input-group">
                <label htmlFor="signature_name">Type Full Name to Sign Legally *</label>
                <input
                  id="signature_name"
                  type="text"
                  placeholder="e.g. Michael Eavis"
                  value={signatureName}
                  onChange={e => setSignatureName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-tertiary" onClick={() => setActiveContract(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Sparkles className="w-4 h-4" /> Execute Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. CHECKOUT CREDIT CARD PAYMENT MODAL */}
      {activeInvoice && (
        <div className="portal-modal-backdrop">
          <div className="portal-modal-card glassmorphism payment-modal animate-fade">
            <div className="modal-header">
              <h3>Secure Checkout Portal</h3>
              <button className="btn-close-modal" onClick={() => setActiveInvoice(null)}>&times;</button>
            </div>

            {paymentSuccess ? (
              <div className="payment-success-card animate-fade">
                <CheckCircle2 className="success-icon-large" />
                <h3>Payment Processed Successfully</h3>
                <p>Simulated Stripe Transaction completed. Your booking status will be updated dynamically.</p>
              </div>
            ) : (
              <form onSubmit={handlePayInvoice}>
                <div className="payment-invoice-summary">
                  <span>Balance Due:</span>
                  <span className="due-amount">${activeInvoice.balance_due.toLocaleString()} USD</span>
                </div>

                <div className="form-group-grid checkout-fields-grid">
                  <div className="field-group full-width-field">
                    <label htmlFor="card_number">Credit Card Number *</label>
                    <input
                      id="card_number"
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={ccNumber}
                      onChange={e => setCcNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="card_expiry">Expiry Date *</label>
                    <input
                      id="card_expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={ccExpiry}
                      onChange={e => setCcExpiry(e.target.value.substring(0, 5))}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="card_cvv">CVV *</label>
                    <input
                      id="card_cvv"
                      type="password"
                      placeholder="123"
                      value={ccCvv}
                      onChange={e => setCcCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer-actions">
                  <button type="button" className="btn btn-tertiary" onClick={() => setActiveInvoice(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>
                    <CreditCard className="w-4 h-4" /> 
                    {processing ? 'Processing Payment...' : `Authorize Payment of $${activeInvoice.balance_due.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .client-portal-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .portal-header-row {
          margin-bottom: var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-md);
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

        /* Bookings Panels list */
        .booking-detail-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .bk-artist-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bk-artist-thumb {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--gold-primary);
        }

        .bk-status-bubble {
          font-size: 0.65rem;
          text-transform: uppercase;
          background: rgba(79, 70, 229, 0.08);
          color: var(--gold-primary);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
          margin-top: 4px;
          display: inline-block;
          border: 1px solid rgba(79, 70, 229, 0.15);
        }

        .bk-details-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
        }

        .bk-detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.825rem;
          color: var(--text-secondary);
        }

        .item-icon-tiny {
          width: 14px;
          height: 14px;
          color: var(--gold-primary);
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

        /* Table summaries styling */
        .contracts-table-card {
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

        .table-badge-status.sent, .table-badge-status.unpaid {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .table-badge-status.signed, .table-badge-status.paid {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .text-right {
          text-align: right;
        }

        /* Chat Widget */
        .chat-box-widget {
          display: flex;
          flex-direction: column;
          height: 480px;
          padding: 0;
        }

        .chat-box-header {
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .agent-profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gold-gradient);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .chat-box-header h4 {
          font-size: 0.875rem;
          font-family: var(--font-body);
        }

        .chat-box-header p {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }

        .chat-messages-scroller {
          flex-grow: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .msg-bubble-row {
          display: flex;
          width: 100%;
        }

        .msg-bubble-row.sent {
          justify-content: flex-end;
        }

        .msg-bubble-row.received {
          justify-content: flex-start;
        }

        .msg-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sent .msg-bubble {
          background: var(--gold-gradient);
          color: #ffffff;
          border-bottom-right-radius: 0;
        }

        .received .msg-bubble {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-bottom-left-radius: 0;
          border: 1px solid var(--border-color);
        }

        .msg-time {
          font-size: 0.65rem;
          align-self: flex-end;
          opacity: 0.6;
        }

        .chat-input-bar {
          display: flex;
          gap: 8px;
          padding: 12px 18px;
          border-top: 1px solid var(--border-color);
        }

        .chat-input-bar input {
          font-size: 0.8rem;
          padding: 8px 12px;
        }

        .btn-icon-only {
          padding: 0.5rem;
          aspect-ratio: 1;
        }

        /* Modal portals overlays */
        .portal-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(10, 6, 20, 0.45);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .portal-modal-card {
          width: 100%;
          max-width: 580px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(91, 33, 182, 0.15);
          padding: 24px;
          box-shadow: var(--shadow-xl);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .modal-header h3 {
          font-size: 1.2rem;
          color: var(--gold-primary);
        }

        .btn-close-modal {
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
        }

        .btn-close-modal:hover {
          color: var(--gold-primary);
        }

        .contract-preview-box {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 18px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: var(--spacing-lg);
          max-height: 200px;
          overflow-y: auto;
        }

        .contract-preview-box h4 {
          font-size: 0.8rem;
          text-align: center;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .preview-signatures-row {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }

        .sign-line-label {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .signature-font {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 1.1rem;
          color: var(--gold-primary);
        }

        .placeholder-sig {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .sign-input-group {
          margin-bottom: var(--spacing-lg);
        }

        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: var(--spacing-md);
        }

        /* Payment modal overrides */
        .payment-modal {
          max-width: 440px;
        }

        .payment-invoice-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--gold-light);
          border: 1px solid rgba(79, 70, 229, 0.15);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 0.85rem;
          margin-bottom: var(--spacing-lg);
        }

        .due-amount {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--gold-primary);
        }

        .checkout-fields-grid {
          margin-bottom: var(--spacing-lg);
          gap: 10px;
        }

        .payment-success-card {
          text-align: center;
          padding: var(--spacing-lg) 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .success-icon-large {
          width: 52px;
          height: 52px;
          color: var(--color-success);
        }
      `}</style>
    </div>
  );
}
