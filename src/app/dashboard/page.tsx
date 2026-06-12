'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, Lead, Booking, Task, Notification, Invoice, Artist } from '@/utils/db';
import { 
  Users, BarChart3, TrendingUp, HelpCircle, Calendar, 
  ArrowRight, ShieldAlert, CheckCircle2, Clock, Plus, Trash, CheckSquare, Square,
  ChevronLeft, ChevronRight, X, Mail, Phone, FileText, Trash2
} from 'lucide-react';

// CRM Stages list matching database constraints
const STAGES = [
  'Lead Received', 
  'Qualified', 
  'Proposal Sent', 
  'Negotiation', 
  'Contract Sent', 
  'Deposit Received', 
  'Confirmed', 
  'Completed'
] as const;

export default function AgentDashboard() {
  const { user, hasPermission } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // Modals / CRM logics states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);

  // Edit lead modal state
  const [editBudget, setEditBudget] = useState<number>(0);
  const [editDetails, setEditDetails] = useState<string>('');
  const [editContactName, setEditContactName] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  // New lead form state
  const [newLeadForm, setNewLeadForm] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    country: 'Jamaica',
    budget: '50000',
    preferred_date: new Date().toISOString().split('T')[0],
    artist_id: '',
    details: ''
  });

  // Task creation state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Dialog Refs & Side Effects for Modal Controls
  const createLeadDialogRef = useRef<HTMLDialogElement>(null);
  const detailsLeadDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = createLeadDialogRef.current;
    if (!dialog) return;
    if (showCreateLead) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [showCreateLead]);

  useEffect(() => {
    const dialog = detailsLeadDialogRef.current;
    if (!dialog) return;
    if (selectedLead) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [selectedLead]);

  const handleDialogLightDismiss = (e: React.MouseEvent<HTMLDialogElement>, closeFn: () => void) => {
    const dialog = e.currentTarget;
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        closeFn();
      }
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const allLeads = await db.getLeads();
      const allBookings = await db.getBookings();
      const allTasks = await db.getTasks();
      const allInvoices = await db.getInvoices();
      const allArtists = await db.getArtists();
      if (user) {
        const userNotifs = await db.getNotifications(user.id);
        setNotifs(userNotifs);
      }
      setLeads(allLeads);
      setBookings(allBookings);
      setTasks(allTasks);
      setInvoices(allInvoices);
      setArtists(allArtists);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Access check
  if (!user || (!hasPermission('manage_bookings') && user.role !== 'Super Admin')) {
    return (
      <div className="container dashboard-unauthorized animate-fade">
        <ShieldAlert className="unauth-icon" />
        <h2>Agent Access Restricted</h2>
        <p>This workspace is reserved for Showtime Booking Agents and Administrators. Please use the floating control panel in the bottom corner to swap identity to Sarah Silverman (Agent) or Damian Marley (Admin) to access CRM controls.</p>
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

  // Calculate metrics
  const totalRevenue = bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const pendingPayments = invoices
    .filter(i => i.status !== 'Paid')
    .reduce((sum, i) => sum + i.balance_due, 0);

  // Kanban workflow triggers
  const handleAdvanceStage = async (leadId: string, currentStatus: Lead['status']) => {
    const currentIndex = STAGES.indexOf(currentStatus as any);
    if (currentIndex !== -1 && currentIndex < STAGES.length - 1) {
      const nextStatus = STAGES[currentIndex + 1] as Lead['status'];
      await db.updateLeadStatus(leadId, nextStatus);
      await loadDashboardData();
    }
  };

  const handleDemoteStage = async (leadId: string, currentStatus: Lead['status']) => {
    const currentIndex = STAGES.indexOf(currentStatus as any);
    if (currentIndex !== -1 && currentIndex > 0) {
      const prevStatus = STAGES[currentIndex - 1] as Lead['status'];
      await db.updateLeadStatus(leadId, prevStatus);
      await loadDashboardData();
    }
  };

  // Task events
  const handleToggleTask = async (id: string) => {
    await db.toggleTask(id);
    await loadDashboardData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await db.createTask(
      newTaskTitle,
      'Created from Agent CRM Dashboard',
      newTaskDue || new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
      user.id
    );
    setNewTaskTitle('');
    setNewTaskDue('');
    await loadDashboardData();
  };

  // Notification clear
  const handleReadNotif = async (id: string) => {
    await db.markNotificationRead(id);
    await loadDashboardData();
  };

  // Lead Modal / logic handlers
  const handleOpenLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setEditBudget(lead.budget);
    setEditDetails(lead.details);
    setEditContactName(lead.contact_name);
    setEditCompany(lead.company_name || '');
    setEditEmail(lead.email);
    setEditPhone(lead.phone || '');
    setEditDate(lead.preferred_date);
  };

  const handleSaveLeadDetails = async () => {
    if (!selectedLead) return;
    await db.updateLead(selectedLead.id, {
      budget: editBudget,
      details: editDetails,
      contact_name: editContactName,
      company_name: editCompany,
      email: editEmail,
      phone: editPhone,
      preferred_date: editDate
    });
    setSelectedLead(null);
    await loadDashboardData();
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await db.deleteLead(leadId);
      setSelectedLead(null);
      await loadDashboardData();
    }
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.contact_name || !newLeadForm.email || !newLeadForm.artist_id) {
      alert("Please fill in all required fields (Name, Email, and Artist).");
      return;
    }
    await db.createLead({
      contact_name: newLeadForm.contact_name,
      company_name: newLeadForm.company_name || undefined,
      email: newLeadForm.email,
      phone: newLeadForm.phone || undefined,
      country: newLeadForm.country,
      budget: parseFloat(newLeadForm.budget) || 50000,
      preferred_date: newLeadForm.preferred_date,
      artist_id: newLeadForm.artist_id,
      details: newLeadForm.details
    });
    // Reset
    setNewLeadForm({
      contact_name: '',
      company_name: '',
      email: '',
      phone: '',
      country: 'Jamaica',
      budget: '50000',
      preferred_date: new Date().toISOString().split('T')[0],
      artist_id: '',
      details: ''
    });
    setShowCreateLead(false);
    await loadDashboardData();
  };

  return (
    <div className="agent-dashboard-viewport container">
      
      {/* Dashboard Top Header */}
      <div className="dashboard-title-row">
        <div>
          <span className="gold-badge">Enterprise Console</span>
          <h2>Agent CRM Dashboard</h2>
          <p>Welcome back, Agent {user.first_name}. Monitor incoming inquiries, route contracts, and verify payment settlements.</p>
        </div>
      </div>

      {/* 1. ANALYTICS & METRICS ROW */}
      <section className="metrics-row">
        <div className="luxury-card metric-widget">
          <div className="metric-header">
            <Users className="metric-widget-icon" />
            <span>Open CRM Leads</span>
          </div>
          <span className="metric-val">{leads.filter(l => l.status !== 'Completed').length}</span>
          <p className="metric-subtext">Active inquiries in pipeline</p>
        </div>

        <div className="luxury-card metric-widget">
          <div className="metric-header">
            <TrendingUp className="metric-widget-icon" />
            <span>Total Booked Value</span>
          </div>
          <span className="metric-val text-gold">${totalRevenue.toLocaleString()}</span>
          <p className="metric-subtext">Cumulative contracted artist fees</p>
        </div>

        <div className="luxury-card metric-widget">
          <div className="metric-header">
            <BarChart3 className="metric-widget-icon" />
            <span>Outstanding Balances</span>
          </div>
          <span className="metric-val">${pendingPayments.toLocaleString()}</span>
          <p className="metric-subtext">Deposits and final settlements due</p>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE SPLIT */}
      <div className="dashboard-layout-grid">
        
        {/* Left Side: Tasks & Notifications */}
        <div className="layout-left-widgets">
          
          {/* Notifications widget */}
          <div className="luxury-card list-widget">
            <h3>Recent Agency Alerts</h3>
            <div className="widget-list-scroll">
              {notifs.length > 0 ? (
                notifs.map(n => (
                  <div key={n.id} className={`list-item-notif ${n.read_status ? 'read' : 'unread'}`}>
                    <div className="notif-body">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      <span className="notif-time">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {!n.read_status && (
                      <button className="btn-read-toggle" onClick={() => handleReadNotif(n.id)}>Dismiss</button>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-widget-msg">No recent notifications</p>
              )}
            </div>
          </div>

          {/* Tasks checklist widget */}
          <div className="luxury-card list-widget">
            <h3>Tasks Checklist</h3>
            <div className="widget-list-scroll">
              {tasks.map(t => (
                <div key={t.id} className={`task-check-row ${t.status === 'Completed' ? 'completed' : ''}`}>
                  <button className="checkbox-btn" onClick={() => handleToggleTask(t.id)}>
                    {t.status === 'Completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                  </button>
                  <div className="task-content">
                    <span className="task-title">{t.title}</span>
                    <span className="task-due">Due: {t.due_date} &bull; Status: {t.status}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Create Task Form inline */}
            <form className="inline-task-form" onSubmit={handleCreateTask}>
              <input
                type="text"
                placeholder="Add new task..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                required
              />
              <input
                type="date"
                value={newTaskDue}
                onChange={e => setNewTaskDue(e.target.value)}
                className="task-date-input"
              />
              <button type="submit" className="btn btn-primary btn-icon-only">
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: CRM Kanban Board Pipeline */}
        <div className="layout-right-board">
          <div className="board-header">
            <div>
              <h3>CRM Booking Pipeline</h3>
              <p>Monitor deal flow progression. Click any card to inspect or edit detailed client offers. Move items to progress stages.</p>
            </div>
            <button className="btn btn-primary btn-sm-padding" onClick={() => setShowCreateLead(true)}>
              <Plus className="w-4 h-4 mr-1.5 inline align-[-2px]" /> Log Inquiry
            </button>
          </div>

          <div className="kanban-scroll-container">
            <div className="kanban-columns-track">
              {STAGES.map(stage => {
                const stageLeads = leads.filter(l => l.status === stage);
                return (
                  <div key={stage} className="kanban-col">
                    <div className="col-header">
                      <span className="col-title">{stage}</span>
                      <span className="col-count">{stageLeads.length}</span>
                    </div>

                    <div className="col-cards-list">
                      {stageLeads.length > 0 ? (
                        stageLeads.map(lead => (
                           <div key={lead.id} className="kanban-card" style={{ cursor: 'pointer' }} onClick={() => handleOpenLeadDetails(lead)}>
                            <div className="card-artist-heading">
                              <strong>{lead.artist_name || 'Generic Inquiry'}</strong>
                              <span className="card-budget">${lead.budget.toLocaleString()}</span>
                            </div>
                            <p className="card-client-desc">{lead.company_name || lead.contact_name}</p>
                            <div className="card-meta">
                              <span><Calendar className="w-3 h-3 inline mr-1 align-[-1px]" /> {lead.preferred_date}</span>
                              <span>{lead.country}</span>
                            </div>
                            
                            {/* Workflow pipeline advance/demote buttons */}
                            <div className="card-pipeline-actions">
                              {stage !== 'Lead Received' ? (
                                <button 
                                  className="pipeline-btn" 
                                  onClick={(e) => { e.stopPropagation(); handleDemoteStage(lead.id, stage); }}
                                  title="Move stage back"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="pipeline-btn-placeholder" />
                              )}
                              <span className="stage-indicator-bubble">Move Stage</span>
                              {stage !== 'Completed' ? (
                                <button 
                                  className="pipeline-btn advance" 
                                  onClick={(e) => { e.stopPropagation(); handleAdvanceStage(lead.id, stage); }}
                                  title="Advance stage"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="pipeline-btn-placeholder" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-col-dropzone">
                          <span>Empty Stage</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .agent-dashboard-viewport {
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xxl);
        }

        .dashboard-title-row {
          margin-bottom: var(--spacing-xl);
          border-bottom: 1px solid rgba(212, 175, 55, 0.08);
          padding-bottom: var(--spacing-md);
        }

        /* Metrics Widgets */
        .metrics-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: var(--spacing-xl);
        }

        @media (min-width: 768px) {
          .metrics-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .metric-widget {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .metric-widget-icon {
          width: 14px;
          height: 14px;
          color: var(--gold-primary);
        }

        .metric-val {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .metric-val.text-gold {
          color: var(--gold-primary);
        }

        .metric-subtext {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Layout Grid split */
        .dashboard-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1200px) {
          .dashboard-layout-grid {
            grid-template-columns: 1fr 2.5fr;
          }
        }

        .layout-left-widgets {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .list-widget {
          display: flex;
          flex-direction: column;
          max-height: 380px;
        }

        .list-widget h3 {
          font-size: 1.1rem;
          color: var(--gold-primary);
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.08);
          padding-bottom: 6px;
        }

        .widget-list-scroll {
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }

        .empty-widget-msg {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2rem 0;
        }

        /* Notifications items */
        .list-item-notif {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 0.8rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          box-shadow: var(--shadow-sm);
        }

        .list-item-notif.unread {
          border-left: 3px solid var(--gold-primary);
          background: rgba(212, 175, 55, 0.03);
        }

        .notif-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .notif-body p {
          color: var(--text-secondary);
          line-height: 1.3;
        }

        .notif-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .btn-read-toggle {
          border: none;
          background: transparent;
          color: var(--gold-primary);
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Tasks checklist styling */
        .task-check-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .task-check-row.completed .task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .checkbox-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .task-content {
          display: flex;
          flex-direction: column;
        }

        .task-title {
          font-size: 0.8rem;
          font-weight: 550;
        }

        .task-due {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .inline-task-form {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }

        .inline-task-form input {
          font-size: 0.8rem;
          padding: 6px 10px;
        }

        .inline-task-form input[type="text"] {
          flex: 1;
          min-width: 120px;
        }

        .task-date-input {
          flex: 0 0 110px;
        }

        .btn-icon-only {
          padding: 0.5rem;
          aspect-ratio: 1;
        }

        /* CRM Kanban Board */
        .layout-right-board {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
          width: 100%;
        }

        .board-header h3 {
          font-size: 1.25rem;
          color: var(--gold-primary);
        }

        .board-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .kanban-scroll-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 12px;
          margin-top: var(--spacing-sm);
        }

        .kanban-columns-track {
          display: flex;
          gap: 1.25rem;
          min-width: 1800px; /* Force minimum width to allow tracking scrolling columns */
        }

        .kanban-col {
          flex: 1;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          max-height: 580px;
          box-shadow: var(--shadow-sm);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .kanban-col:hover {
          border-color: rgba(0, 113, 227, 0.2);
          box-shadow: var(--shadow-md);
        }

        .col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }

        .col-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .col-count {
          font-size: 0.7rem;
          background: rgba(0, 113, 227, 0.08);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .col-cards-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          flex-grow: 1;
          padding-right: 2px;
        }

        .kanban-card {
          padding: 14px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all var(--transition-normal);
        }

        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent);
        }

        .card-artist-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-budget {
          background: rgba(0, 113, 227, 0.08);
          color: var(--accent);
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .card-client-desc {
          color: var(--text-secondary);
          line-height: 1.35;
          font-size: 0.75rem;
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: var(--text-muted);
          border-top: 1px dashed var(--border-color);
          padding-top: 6px;
          margin-top: 2px;
        }

        .card-pipeline-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 8px;
          margin-top: 4px;
        }

        .pipeline-btn {
          border: 1px solid var(--border-color);
          background: #ffffff;
          color: var(--text-secondary);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .pipeline-btn:hover {
          background: rgba(0, 113, 227, 0.08);
          color: var(--accent);
          border-color: var(--accent);
        }

        .pipeline-btn.advance {
          background: #ffffff;
          color: var(--text-secondary);
        }

        .pipeline-btn.advance:hover {
          background: var(--gold-gradient);
          color: #ffffff;
          border-color: var(--accent);
          box-shadow: 0 4px 10px rgba(0, 113, 227, 0.2);
        }

        .pipeline-btn-placeholder {
          width: 22px;
          height: 22px;
        }

        .stage-indicator-bubble {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .empty-col-dropzone {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          height: 80px;
          color: var(--text-muted);
          font-size: 0.7rem;
          background: var(--bg-primary);
        }
      `}</style>

      {/* --- CREATE LEAD DIALOG (INBOUND INQUIRY) --- */}
      <dialog 
        ref={createLeadDialogRef} 
        className="premium-dialog" 
        onClose={() => setShowCreateLead(false)}
        onClick={(e) => handleDialogLightDismiss(e, () => setShowCreateLead(false))}
      >
        <div className="dialog-content">
          <div className="dialog-header">
            <div>
              <span className="dialog-eyebrow">CRM Pipeline Tool</span>
              <h3>Log Inbound Inquiry</h3>
            </div>
            <button className="dialog-close-btn" onClick={() => setShowCreateLead(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateLeadSubmit} className="dialog-form">
            <div className="form-row grid-2">
              <div className="field-group">
                <label htmlFor="contact_name">Contact Name *</label>
                <input
                  type="text"
                  id="contact_name"
                  value={newLeadForm.contact_name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, contact_name: e.target.value })}
                  placeholder="e.g. Joe Bogdanovich"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="company_name">Company Name</label>
                <input
                  type="text"
                  id="company_name"
                  value={newLeadForm.company_name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                  placeholder="e.g. Sumfest Productions"
                />
              </div>
            </div>

            <div className="form-row grid-2">
              <div className="field-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={newLeadForm.email}
                  onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  placeholder="e.g. joe@reggaesumfest.com"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={newLeadForm.phone}
                  onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="e.g. +1-876-555-0301"
                />
              </div>
            </div>

            <div className="form-row grid-3">
              <div className="field-group">
                <label htmlFor="artist_id">Select Artist *</label>
                <select
                  id="artist_id"
                  value={newLeadForm.artist_id}
                  onChange={e => setNewLeadForm({ ...newLeadForm, artist_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Artist --</option>
                  {artists.map(art => (
                    <option key={art.id} value={art.id}>{art.stage_name} ({art.category})</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="budget">Budget (USD) *</label>
                <input
                  type="number"
                  id="budget"
                  value={newLeadForm.budget}
                  onChange={e => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="preferred_date">Preferred Date *</label>
                <input
                  type="date"
                  id="preferred_date"
                  value={newLeadForm.preferred_date}
                  onChange={e => setNewLeadForm({ ...newLeadForm, preferred_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field-group full-width">
              <label htmlFor="details">Booking Description / Offer Details</label>
              <textarea
                id="details"
                value={newLeadForm.details}
                onChange={e => setNewLeadForm({ ...newLeadForm, details: e.target.value })}
                placeholder="Provide event details, venue capacity, performance duration..."
                rows={3}
              />
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn btn-tertiary" onClick={() => setShowCreateLead(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Inquiry
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* --- LEAD DETAILS INSPECTOR & EDITOR --- */}
      <dialog 
        ref={detailsLeadDialogRef} 
        className="premium-dialog" 
        onClose={() => setSelectedLead(null)}
        onClick={(e) => handleDialogLightDismiss(e, () => setSelectedLead(null))}
      >
        {selectedLead && (
          <div className="dialog-content">
            <div className="dialog-header">
              <div>
                <span className="dialog-eyebrow">CRM Lead Inspector</span>
                <h3>{selectedLead.artist_name || 'Generic Inquiry'} Booking</h3>
              </div>
              <button className="dialog-close-btn" onClick={() => setSelectedLead(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="lead-quick-stats">
              <span className="stat-badge">Stage: {selectedLead.status}</span>
              <span className="stat-badge">Source: {selectedLead.source}</span>
              <span className="stat-badge">Created: {new Date(selectedLead.created_at).toLocaleDateString()}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveLeadDetails(); }} className="dialog-form">
              
              <div className="section-title">Client Information</div>
              <div className="form-row grid-2">
                <div className="field-group">
                  <label htmlFor="edit_contact">Contact Name</label>
                  <input
                    type="text"
                    id="edit_contact"
                    value={editContactName}
                    onChange={e => setEditContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="edit_company">Company Name</label>
                  <input
                    type="text"
                    id="edit_company"
                    value={editCompany}
                    onChange={e => setEditCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row grid-2">
                <div className="field-group">
                  <label htmlFor="edit_email">Email Address</label>
                  <input
                    type="email"
                    id="edit_email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="edit_phone">Phone Number</label>
                  <input
                    type="tel"
                    id="edit_phone"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="section-title">Booking & Offer Details</div>
              <div className="form-row grid-2">
                <div className="field-group">
                  <label htmlFor="edit_budget">Budget (USD)</label>
                  <input
                    type="number"
                    id="edit_budget"
                    value={editBudget}
                    onChange={e => setEditBudget(parseFloat(e.target.value) || 0)}
                    min="0"
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="edit_date">Event Date</label>
                  <input
                    type="date"
                    id="edit_date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group full-width">
                <label htmlFor="edit_details">Offer Notes / Pitch Details</label>
                <textarea
                  id="edit_details"
                  value={editDetails}
                  onChange={e => setEditDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="dialog-actions-container">
                <button 
                  type="button" 
                  className="btn-danger-pill"
                  onClick={() => handleDeleteLead(selectedLead.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5 inline align-[-2px]" /> Delete Inquiry
                </button>

                <div className="right-actions">
                  <button type="button" className="btn btn-tertiary" onClick={() => setSelectedLead(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </dialog>

      <style jsx>{`
        /* Premium Dialog Styling */
        .premium-dialog {
          border: none;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(25px) saturate(190%);
          -webkit-backdrop-filter: blur(25px) saturate(190%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: 0;
          max-width: 680px;
          width: 90%;
          margin: auto;
          outline: none;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .premium-dialog::backdrop {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .dialog-content {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding-bottom: var(--spacing-md);
        }

        .dialog-eyebrow {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 4px;
        }

        .dialog-header h3 {
          font-size: 1.35rem;
          color: var(--text-primary);
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .dialog-close-btn {
          background: rgba(0, 0, 0, 0.04);
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .dialog-close-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          color: var(--text-primary);
        }

        .lead-quick-stats {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          padding-bottom: var(--spacing-sm);
        }

        .stat-badge {
          font-size: 0.72rem;
          font-weight: 600;
          background: rgba(0, 113, 227, 0.05);
          color: var(--accent);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 113, 227, 0.08);
        }

        .dialog-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding-bottom: 6px;
          margin-top: var(--spacing-sm);
        }

        .form-row {
          display: grid;
          gap: var(--spacing-md);
        }

        .form-row.grid-2 {
          grid-template-columns: 1fr;
        }

        .form-row.grid-3 {
          grid-template-columns: 1fr;
        }

        @media (min-width: 600px) {
          .form-row.grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          .form-row.grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          padding-top: var(--spacing-md);
          margin-top: var(--spacing-sm);
        }

        .dialog-actions-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          padding-top: var(--spacing-md);
          margin-top: var(--spacing-sm);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .right-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .btn-danger-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body);
          font-size: 0.8125rem;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-xl);
          cursor: pointer;
          background: transparent;
          color: var(--color-error);
          border: 1.5px solid var(--color-error);
          transition: all var(--transition-fast);
        }

        .btn-danger-pill:hover {
          background: rgba(255, 59, 48, 0.08);
        }

        .btn-danger-pill:active {
          transform: scale(0.98);
        }

        /* Responsiveness & Layout Improvements for Board */
        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-md);
          flex-direction: column;
        }

        @media (min-width: 640px) {
          .board-header {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (max-width: 768px) {
          .kanban-scroll-container {
            scroll-snap-type: x mandatory;
          }
          .kanban-columns-track {
            min-width: auto;
            width: max-content;
            gap: 0.75rem;
          }
          .kanban-col {
            width: 290px;
            min-width: 290px;
            max-height: 480px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </div>
  );
}
