'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, Lead, Booking, Task, Notification, Invoice, Artist } from '@/utils/db';
import { 
  LayoutDashboard, Calendar, MapPin, Users, Ticket, Receipt, FileEdit,
  Globe, Megaphone, BarChart3, CircleDollarSign, Brain, ShieldCheck, Cable, Settings,
  Search, Menu, X, ChevronLeft, ChevronRight, Plus, Trash, Check, AlertOctagon, Eye,
  Play, Sparkles, Undo, Redo, Copy, ChevronDown, CheckSquare, Square, RefreshCw,
  Mail, Phone, FileText, Trash2, Shield, CreditCard, Clock, Activity, Zap, Info
} from 'lucide-react';

// Navigation tabs matching the user spec
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Core Operations' },
  { id: 'events', label: 'Events', icon: Calendar, category: 'Core Operations' },
  { id: 'venues', label: 'Venues', icon: MapPin, category: 'Core Operations' },
  { id: 'artists', label: 'Artists', icon: Users, category: 'Core Operations' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, category: 'Core Operations' },
  { id: 'orders', label: 'Orders', icon: Receipt, category: 'Core Operations' },
  { id: 'customers', label: 'Customers', icon: Users, category: 'Core Operations' },
  { id: 'content', label: 'Content CMS', icon: FileEdit, category: 'Website Management' },
  { id: 'builder', label: 'Website Builder', icon: Globe, category: 'Website Management' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, category: 'Growth & Promo' },
  { id: 'advertising', label: 'Advertising', icon: Megaphone, category: 'Growth & Promo' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'Administration' },
  { id: 'finance', label: 'Finance', icon: CircleDollarSign, category: 'Administration' },
  { id: 'ai-ops', label: 'AI Operations', icon: Brain, category: 'Administration' },
  { id: 'staff', label: 'Staff & Roles', icon: ShieldCheck, category: 'Settings' },
  { id: 'integrations', label: 'Integrations', icon: Cable, category: 'Settings' },
  { id: 'settings', label: 'System Settings', icon: Settings, category: 'Settings' }
] as const;

type TabId = typeof NAV_ITEMS[number]['id'];

// Default roles visibility matching DB and RBAC
const ROLE_PERMISSIONS: Record<string, TabId[]> = {
  'Super Admin': NAV_ITEMS.map(i => i.id),
  'Owner': NAV_ITEMS.map(i => i.id),
  'Finance Manager': ['dashboard', 'finance', 'analytics', 'orders', 'settings'],
  'Marketing Manager': ['dashboard', 'marketing', 'advertising', 'content', 'builder', 'analytics'],
  'Content Manager': ['dashboard', 'content', 'builder', 'artists', 'venues'],
  'Support Agent': ['dashboard', 'customers', 'orders', 'tickets'],
  'Promoter': ['dashboard', 'events', 'tickets', 'analytics'],
  'Venue Manager': ['dashboard', 'venues', 'events'],
  'Booking Agent': ['dashboard', 'events', 'artists', 'orders', 'customers']
};

export default function AdminPortal() {
  const { user, hasPermission } = useAuth();
  
  // Dashboard & global state
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [emergencyKillActive, setEmergencyKillActive] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  // DB Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // Modals & Builders
  const [showEventBuilder, setShowEventBuilder] = useState(false);
  const [eventBuilderStep, setEventBuilderStep] = useState(1);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Command palette focus index
  const [paletteIndex, setPaletteIndex] = useState(0);

  // Visual seat map state
  const [selectedSeatZone, setSelectedSeatZone] = useState<'VVIP' | 'VIP' | 'GA'>('VIP');
  const [seatMap, setSeatMap] = useState<boolean[]>(Array(64).fill(false)); // true = booked

  // Website preview states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [cmsSections, setCmsSections] = useState({
    heroTitle: "Caribbean Talent Booking Platform",
    announcement: "★ Reggae Sumfest 2026 Headliners Confirmed!",
    footerCopyright: "© 2026 Showtime Services. All Rights Reserved."
  });

  // Marketing templates state
  const [marketingType, setMarketingType] = useState<'email' | 'sms' | 'push'>('email');

  // Integrations active keys
  const [apiKeys, setApiKeys] = useState({
    stripe: 'pk_live_51M...',
    paypal: 'client_id_...',
    twilio: 'AC...',
    sendgrid: 'SG...'
  });

  // AI Operations helper states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Event builder form state
  const [eventBuilderForm, setEventBuilderForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Reggae Artists',
    venue: '',
    artist: '',
    ticketPriceGA: '85',
    ticketPriceVIP: '250',
    capacity: '1500',
    seoTags: 'reggae, festival, live concert',
    publishMode: 'Draft'
  });

  // New Lead form state
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

  // Load portal statistics
  const loadPortalData = async () => {
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
      console.error('Failed to load portal data:', err);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  // Command palette hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter command palette options
  const getCommandOptions = () => {
    const defaultActions = NAV_ITEMS.map(item => ({
      type: 'navigation',
      label: `Go to ${item.label}`,
      action: () => { setActiveTab(item.id); setCommandPaletteOpen(false); }
    }));

    const quickActions = [
      { type: 'action', label: 'Create New Event Wizard', action: () => { setShowEventBuilder(true); setCommandPaletteOpen(false); } },
      { type: 'action', label: 'Log Inbound CRM Inquiry', action: () => { setShowCreateLead(true); setCommandPaletteOpen(false); } },
      { type: 'action', label: 'Emergency System Kill Switch', action: () => { setActiveTab('settings'); setEmergencyKillActive(true); setCommandPaletteOpen(false); } }
    ];

    const artistSearches = artists.map(a => ({
      type: 'artist',
      label: `Inspect Artist: ${a.stage_name}`,
      action: () => { setActiveTab('artists'); setCommandPaletteOpen(false); }
    }));

    const all = [...defaultActions, ...quickActions, ...artistSearches];
    return all.filter(item => item.label.toLowerCase().includes(commandSearch.toLowerCase()));
  };

  // Handle Command Palette arrow keys
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    const options = getCommandOptions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletteIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPaletteIndex(prev => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[paletteIndex]) {
        options[paletteIndex].action();
      }
    }
  };

  // Access checking
  if (!user) {
    return (
      <div className="container py-24 text-center">
        <Shield className="w-16 h-16 mx-auto text-[#d4af37] mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Access Unauthorized</h2>
        <p className="text-white/60 mb-6">Please log in to access the Showtime Administration Portal.</p>
        <Link href="/" className="btn bg-[#d4af37] text-[#07050e] px-8 py-3 rounded-full font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  // Role permissions checking
  const userRole = user.role || 'Booking Agent';
  const allowedTabs = ROLE_PERMISSIONS[userRole] || ['dashboard'];
  const hasTabAccess = (tab: TabId) => allowedTabs.includes(tab);

  // Execute Event Builder Submit
  const handleEventPublish = async () => {
    // Contract a mock booking in DB representing our published event
    const mockLead: Omit<Lead, 'id' | 'created_at' | 'status' | 'source'> = {
      contact_name: `Promoter Office (${eventBuilderForm.publishMode})`,
      company_name: eventBuilderForm.subtitle || 'Showtime Production Group',
      email: 'events@showtime.com',
      country: 'Jamaica',
      budget: parseFloat(eventBuilderForm.ticketPriceVIP) * parseInt(eventBuilderForm.capacity) * 0.1, // mock budget
      preferred_date: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      artist_id: eventBuilderForm.artist || 'art-chronixx',
      details: eventBuilderForm.description || 'Staged showtime production booking event.'
    };
    
    await db.createLead(mockLead);
    await loadPortalData();
    setShowEventBuilder(false);
    setEventBuilderStep(1);
    setActiveTab('dashboard');
  };

  // Metrics
  const calculatedTotalRevenue = bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const calculatedBalanceDue = invoices
    .filter(i => i.status !== 'Paid')
    .reduce((sum, i) => sum + i.balance_due, 0);

  return (
    <div className="admin-portal-wrapper min-h-screen text-white bg-[#07050e] flex flex-col font-sans">
      
      {/* ── EMERGENCY OVERLAY SWITCH ── */}
      {emergencyKillActive && (
        <div className="fixed inset-0 z-[9999] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-fade">
          <AlertOctagon className="w-24 h-24 text-red-500 mb-6 animate-bounce" />
          <h1 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-wider mb-2">SYSTEM SUSPENDED</h1>
          <p className="text-xl md:text-2xl font-bold text-white mb-6">EMERGENCY KILL SWITCH ACTIVE &bull; AUDIT IN PROGRESS</p>
          <p className="max-w-xl text-white/60 mb-8">
            All API routes, user booking portals, and contract releases have been temporarily locked by administration command. To restore operations, please enter the master recovery code.
          </p>
          <div className="flex gap-4">
            <button 
              className="bg-white text-red-950 font-bold px-8 py-3.5 rounded-full hover:scale-105 transition"
              onClick={() => { setEmergencyKillActive(false); }}
            >
              Deactivate Emergency Lock
            </button>
          </div>
        </div>
      )}

      {/* ── CORE SAAS HEADER ── */}
      <header className="border-b border-white/5 bg-[#0c0a17]/90 sticky top-0 z-[100] backdrop-blur-md">
        <div className="h-16 px-6 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              className="text-white/60 hover:text-white lg:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight" style={{ background: 'linear-gradient(135deg, #f5d061 0%, #d4af37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                SHOWTIME
              </span>
              <span className="text-[10px] font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50 tracking-wider">
                v{NAV_ITEMS[0] ? '2026.1' : '1.0'}
              </span>
            </div>
          </div>

          {/* Search bar wrapper focused opens cmd+k */}
          <div 
            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-96 cursor-pointer hover:border-white/20 transition"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/40 flex-1">Search portal...</span>
            <kbd className="text-[10px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">⌘K</kbd>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Alerts Center Bell */}
            <div className="relative">
              <button 
                className="relative text-white/60 hover:text-white p-2 rounded-full hover:bg-white/5"
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
              >
                <Activity className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4af37]" />
              </button>
              
              {notifPanelOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0c0a17] border border-white/10 rounded-2xl p-4 shadow-2xl z-[200]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                    <span className="font-bold text-sm text-[#d4af37]">Agency Alerts</span>
                    <button className="text-white/40 hover:text-white text-xs" onClick={() => setNotifPanelOpen(false)}>Close</button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {notifs.map(n => (
                      <div key={n.id} className="p-2 bg-white/5 rounded-lg border border-white/5 text-xs">
                        <strong className="block text-white/80">{n.title}</strong>
                        <span className="text-white/50">{n.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge with active role visibility */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-semibold text-white">{user.first_name} {user.last_name}</span>
                <span className="block text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">{userRole}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f5d061] to-[#d4af37] flex items-center justify-center text-[#07050e] font-bold text-sm">
                {user.first_name[0]}{user.last_name[0]}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ── CORE SAAS BODY GRID ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Sidebar */}
        <aside className={`border-r border-white/5 bg-[#0c0a17]/50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0 lg:w-16 overflow-hidden' : 'w-64'}`}>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* Group Navigation items by Category */}
            {['Core Operations', 'Website Management', 'Growth & Promo', 'Administration', 'Settings'].map((category, catIdx) => {
              const items = NAV_ITEMS.filter(i => i.category === category);
              return (
                <div key={category} className="flex flex-col gap-1">
                  {!sidebarCollapsed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-3 py-1.5 mt-2">
                      {category}
                    </span>
                  )}
                  {items.map(item => {
                    const IconComp = item.icon;
                    const active = activeTab === item.id;
                    const hasAccess = hasTabAccess(item.id);
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (hasAccess) setActiveTab(item.id);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                          active ? 'bg-[#d4af37] text-[#07050e] font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                        } ${!hasAccess ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                        {!hasAccess && !sidebarCollapsed && (
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded ml-auto">Lock</span>
                        )}
                      </button>
                    );
                  })}
                  {catIdx < 4 && <hr className="border-white/5 my-2" />}
                </div>
              );
            })}

          </div>
        </aside>

        {/* Tab content area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8 animate-fade">
              
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Executive Dashboard</h2>
                  <p className="text-white/50 text-sm">Centralized live metrics, platform volume statistics, and operational triggers.</p>
                </div>
                <div className="flex gap-3">
                  <button className="btn bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2 rounded-full font-medium text-sm transition" onClick={() => setShowCreateLead(true)}>
                    Log Lead Inbound
                  </button>
                  <button className="btn bg-[#d4af37] text-[#07050e] hover:scale-105 px-5 py-2 rounded-full font-bold text-sm transition flex items-center gap-2" onClick={() => setShowEventBuilder(true)}>
                    <Plus className="w-4 h-4" /> Create Event
                  </button>
                </div>
              </div>

              {/* Stat widgets list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-[#0c0a17] border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col gap-1">
                  <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Revenue Today</span>
                  <span className="text-2xl font-bold text-[#d4af37]">${(calculatedTotalRevenue * 0.05).toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1">▲ +12% vs yesterday</span>
                </div>

                <div className="bg-[#0c0a17] border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col gap-1">
                  <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Total Sales Vol.</span>
                  <span className="text-2xl font-bold">${calculatedTotalRevenue.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1">▲ +8.2% vs last month</span>
                </div>

                <div className="bg-[#0c0a17] border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col gap-1">
                  <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Invoices Pending</span>
                  <span className="text-2xl font-bold text-[#a855f7]">${calculatedBalanceDue.toLocaleString()}</span>
                  <span className="text-[10px] text-white/40 mt-1">Deposits due in 14 days</span>
                </div>

                <div className="bg-[#0c0a17] border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col gap-1">
                  <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Audience Reach</span>
                  <span className="text-2xl font-bold">7.2M+</span>
                  <span className="text-[10px] text-[#d4af37] font-semibold mt-1">Across 35 countries</span>
                </div>

              </div>

              {/* Extra specifications widgets row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0c0a17] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-white/30">Platform Health</span>
                    <strong className="block text-sm text-white">99.98% uptime</strong>
                  </div>
                </div>
                
                <div className="bg-[#0c0a17] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#a855f7]/10 text-[#a855f7]">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-white/30">Tickets Sold</span>
                    <strong className="block text-sm text-white">12,504 tickets</strong>
                  </div>
                </div>

                <div className="bg-[#0c0a17] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-white/30">AI Operations</span>
                    <strong className="block text-sm text-white">4 active automation suggestions</strong>
                  </div>
                </div>
              </div>

              {/* Dashboard sections split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* CRM list inside dashboard */}
                <div className="lg:col-span-8 bg-[#0c0a17] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-extrabold text-lg text-[#d4af37]">CRM Inbound Requests</h3>
                    <button className="text-white/40 hover:text-white text-xs" onClick={() => setActiveTab('events')}>View all events</button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                    {leads.map(l => (
                      <div key={l.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition flex justify-between items-center gap-4">
                        <div>
                          <strong className="block text-white text-sm">{l.contact_name} &middot; <span className="text-[#d4af37]">{l.artist_name}</span></strong>
                          <span className="text-xs text-white/50">{l.company_name || 'Individual Promoter'} &bull; {l.country}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-bold text-[#d4af37]">${l.budget.toLocaleString()}</span>
                          <span className="inline-block text-[9px] font-bold uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50 mt-1">{l.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="lg:col-span-4 bg-[#0c0a17] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                  <h3 className="font-extrabold text-lg text-[#d4af37] border-b border-white/5 pb-3">Quick Operations</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-center text-xs hover:bg-white/10 transition flex flex-col items-center gap-2" onClick={() => setShowEventBuilder(true)}>
                      <Calendar className="w-5 h-5 text-[#d4af37]" />
                      Create Event
                    </button>
                    <button className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-center text-xs hover:bg-white/10 transition flex flex-col items-center gap-2" onClick={() => setActiveTab('venues')}>
                      <MapPin className="w-5 h-5 text-[#a855f7]" />
                      Create Venue
                    </button>
                    <button className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-center text-xs hover:bg-white/10 transition flex flex-col items-center gap-2" onClick={() => setActiveTab('artists')}>
                      <Users className="w-5 h-5 text-[#d4af37]" />
                      Add Artist
                    </button>
                    <button className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-center text-xs hover:bg-white/10 transition flex flex-col items-center gap-2" onClick={() => setActiveTab('marketing')}>
                      <Megaphone className="w-5 h-5 text-[#a855f7]" />
                      Campaign builder
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EVENTS */}
          {activeTab === 'events' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Events Management</h2>
                  <p className="text-white/50 text-sm">Schedule events, archive, duplicate, and adjust pricing categories.</p>
                </div>
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2.5 px-6 rounded-full hover:scale-105 transition flex items-center gap-2" onClick={() => setShowEventBuilder(true)}>
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>

              {/* Grid lists of current simulated bookings/events */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map(bk => (
                  <div key={bk.id} className="bg-[#0c0a17] border border-white/10 rounded-2xl overflow-hidden hover:border-[#d4af37]/35 transition shadow-2xl">
                    <div className="relative aspect-[16/10] bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bk.artist_image} alt={bk.artist_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a17] to-transparent" />
                      <span className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                        {bk.status}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      <div>
                        <h4 className="font-extrabold text-lg text-white">{bk.event_title}</h4>
                        <span className="text-xs text-white/50 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> {bk.event_venue}, {bk.event_country}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/60 pt-3 border-t border-white/5">
                        <span>Date: {bk.event_date}</span>
                        <strong className="text-white font-bold">${bk.total_amount.toLocaleString()}</strong>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-xs transition">
                          Duplicate
                        </button>
                        <button className="btn flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs transition">
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VENUES */}
          {activeTab === 'venues' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Venue Manager &amp; Seat Maps</h2>
                  <p className="text-white/50 text-sm">Assign capacity settings, parking, and paint booking seats zones.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Seat map config */}
                <div className="lg:col-span-8 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-bold text-lg">Interactive Seat Map Builder</h3>
                    <div className="flex gap-2">
                      {['VVIP', 'VIP', 'GA'].map(zone => (
                        <button 
                          key={zone} 
                          className={`px-3 py-1 rounded text-xs font-semibold transition ${selectedSeatZone === zone ? 'bg-[#d4af37] text-[#07050e]' : 'bg-white/5 text-white/60 hover:text-white'}`}
                          onClick={() => setSelectedSeatZone(zone as any)}
                        >
                          {zone} Zone
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seat Grid visual SVG map builder */}
                  <div className="p-8 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-6">
                    <span className="text-xs text-white/40 uppercase tracking-widest">Stage Direction Front</span>
                    <div className="w-full max-w-sm aspect-square bg-[#07050e] border border-white/10 rounded-xl p-4 grid grid-cols-8 gap-2.5">
                      {seatMap.map((booked, idx) => {
                        let color = 'bg-white/10 border-white/10 hover:bg-[#d4af37]/30';
                        if (booked) {
                          color = 'bg-red-500/20 border-red-500/35 cursor-not-allowed';
                        } else if (idx < 16) {
                          color = 'bg-[#a855f7]/20 border-[#a855f7]/30 hover:bg-[#a855f7]/40';
                        }
                        return (
                          <div 
                            key={idx}
                            className={`aspect-square rounded border transition duration-150 cursor-pointer ${color}`}
                            onClick={() => {
                              const copy = [...seatMap];
                              copy[idx] = !copy[idx];
                              setSeatMap(copy);
                            }}
                            title={`Seat ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex gap-6 text-xs text-white/50">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#a855f7]/20 border border-[#a855f7]/30 rounded" /> VVIP Front Row</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white/10 border border-white/10 rounded" /> Standard VIP</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500/20 border border-red-500/35 rounded" /> Reserved / Booked</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Venue Profiles list */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-lg border-b border-white/5 pb-2">Active Venues</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { name: 'Catherine Hall Stadium', capacity: '35,000 seats', location: 'Montego Bay' },
                        { name: 'National Arena Staging', capacity: '12,500 seats', location: 'Kingston' },
                        { name: 'O2 Arena London', capacity: '20,000 seats', location: 'United Kingdom' }
                      ].map((venue, idx) => (
                        <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center gap-3">
                          <div>
                            <strong className="block text-sm text-white">{venue.name}</strong>
                            <span className="text-xs text-white/50">{venue.location}</span>
                          </div>
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60">{venue.capacity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ARTISTS */}
          {activeTab === 'artists' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Artist CRM Profiles</h2>
                  <p className="text-white/50 text-sm">Configure technical riders, biographies, and tour schedules.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {artists.map(art => (
                  <div key={art.id} className="bg-[#0c0a17] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art.profile_image} alt={art.stage_name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                      <div>
                        <h4 className="font-extrabold text-xl">{art.stage_name}</h4>
                        <span className="text-xs text-[#d4af37] font-semibold">{art.genre}</span>
                      </div>
                      <span className="ml-auto text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70 uppercase">
                        {art.booking_status}
                      </span>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{art.bio}</p>
                    
                    <div className="border-t border-white/5 pt-3 mt-2 flex flex-col gap-2 text-xs text-white/50">
                      <span><strong>Technical:</strong> {art.technical_rider?.substring(0, 75)}...</span>
                      <span><strong>Hospitality:</strong> {art.hospitality_rider?.substring(0, 75)}...</span>
                    </div>

                    <div className="flex gap-2 mt-4 border-t border-white/5 pt-4">
                      <button 
                        className="btn flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-lg text-xs transition font-semibold"
                        onClick={() => {
                          alert(`Technical Rider: \n${art.technical_rider}\n\nHospitality Rider: \n${art.hospitality_rider}`);
                        }}
                      >
                        Inspect Riders
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Ticketing Operations</h2>
                  <p className="text-white/50 text-sm">Issue promo codes, check QR tickets, and design dynamic tier pricing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Promo Code builder */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg border-b border-white/5 pb-2 text-[#d4af37]">Promo Codes</h3>
                  <div className="flex flex-col gap-3">
                    <div className="field-group">
                      <label>Promo Code Title</label>
                      <input type="text" placeholder="e.g. SUMFEST2026" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                    </div>
                    <div className="field-group">
                      <label>Discount Value (%)</label>
                      <input type="number" placeholder="20" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                    </div>
                    <button className="btn bg-[#d4af37] text-[#07050e] font-bold py-2 rounded-lg text-sm mt-2" onClick={() => alert("Promo code published!")}>
                      Create Promo Code
                    </button>
                  </div>
                </div>

                {/* Ticket pricing categories list */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg border-b border-white/5 pb-2 text-[#a855f7]">Available Tiers</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { name: 'General Admission', price: '$85', desc: 'Standard field gate access' },
                      { name: 'VIP Deck Pass', price: '$250', desc: 'Raised platform, private bar' },
                      { name: 'VVIP Backstage', price: '$850', desc: 'Meet & greet, backline hospitality' },
                      { name: 'Ultra VVIP Table package', price: '$3,500', desc: 'Dressed cabana table for 8' }
                    ].map((tier, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center gap-3">
                        <div>
                          <strong className="block text-sm text-white">{tier.name}</strong>
                          <span className="text-[10px] text-white/50">{tier.desc}</span>
                        </div>
                        <span className="text-sm font-bold text-[#d4af37]">{tier.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR scanning Simulator */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 text-center">
                  <h3 className="font-bold text-lg border-b border-white/5 pb-2 text-[#d4af37]">Scan Simulator</h3>
                  <div className="w-32 h-32 bg-white/10 border border-white/10 rounded-xl mx-auto flex items-center justify-center my-4">
                    <Ticket className="w-16 h-16 text-[#d4af37]" />
                  </div>
                  <p className="text-xs text-white/60 mb-2">Simulate scanning customer tickets at physical venue gates.</p>
                  <button className="btn bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg text-xs font-semibold transition" onClick={() => alert("Scanner Initialized. Camera permissions active.")}>
                    Launch Scanner Cam
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: ORDERS */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Order Management &amp; Fraud</h2>
                  <p className="text-white/50 text-sm">Monitor purchases, review fraud risks, and issue refunds.</p>
                </div>
              </div>

              {/* Order Search & Grid table */}
              <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 w-full max-w-sm mb-4">
                  <Search className="w-4 h-4 text-white/40" />
                  <input type="text" placeholder="Search orders by invoice ID or client..." className="bg-transparent border-none outline-none text-sm text-white flex-1" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 font-semibold text-xs uppercase">
                        <th className="pb-3">Invoice / ID</th>
                        <th className="pb-3">Client</th>
                        <th className="pb-3">Staged Artist</th>
                        <th className="pb-3">Total Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Fraud Risk</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map((inv, idx) => (
                        <tr key={inv.id} className="text-white/80">
                          <td className="py-3.5 font-mono text-xs">{inv.id}</td>
                          <td className="py-3.5">Sarah Silverman (Agent)</td>
                          <td className="py-3.5 text-[#d4af37]">Chronixx</td>
                          <td className="py-3.5 font-bold">${inv.amount.toLocaleString()}</td>
                          <td className="py-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inv.status === 'Paid' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Low (0.02%)
                            </span>
                          </td>
                          <td className="py-3.5 text-right flex justify-end gap-2">
                            <button className="btn bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1 rounded text-xs transition" onClick={() => alert("Ticket receipt resent via Email.")}>
                              Resend Ticket
                            </button>
                            <button className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded text-xs transition" onClick={() => alert("Refund transaction initiated.")}>
                              Refund Order
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Customer CRM Directory</h2>
                  <p className="text-white/50 text-sm">Assign VIP tiers, manage support notes, and track behaviors.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Joe Bogdanovich', company: 'Sumfest Productions', email: 'joe@reggaesumfest.com', tier: 'VIP Organizer', notes: 'Prefers booking reggae headliners. Fast deposit execution.' },
                  { name: 'Paul Tollett', company: 'Goldenvoice Coachella', email: 'paul@coachella.com', tier: 'Ultra VIP Promoter', notes: 'Standard US promoter client. Always requires international travel logistics check.' },
                  { name: 'Michael Eavis', company: 'Glastonbury Festivals', email: 'eavis.client@glastonbury.co.uk', tier: 'Global Partner', notes: 'Requires full compliance check for UK COS certificates.' }
                ].map((customer, idx) => (
                  <div key={idx} className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <strong className="block text-lg text-white">{customer.name}</strong>
                        <span className="text-xs text-white/50">{customer.company} &middot; {customer.email}</span>
                      </div>
                      <span className="text-[10px] bg-[#d4af37]/20 border border-[#d4af37]/35 text-[#d4af37] px-2.5 py-1 rounded-full font-bold uppercase">
                        {customer.tier}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 bg-black/30 p-3 rounded-lg border border-white/5 mt-2">
                      <strong>CRM Behavior Log:</strong> {customer.notes}
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button className="btn bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg text-xs transition" onClick={() => alert(`Opening conversation with ${customer.name}`)}>
                        Contact Client
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CONTENT CMS */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Content CMS Editors</h2>
                  <p className="text-white/50 text-sm">Drag and drop page blocks, edit homepage titles, and schedule announcements.</p>
                </div>
              </div>

              <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                <h3 className="font-bold text-lg text-[#d4af37] border-b border-white/5 pb-2">Homepage Editable Sections</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="field-group flex flex-col gap-2">
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Homepage Hero Title Text</label>
                    <input 
                      type="text" 
                      value={cmsSections.heroTitle}
                      onChange={e => setCmsSections({ ...cmsSections, heroTitle: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white" 
                    />
                  </div>

                  <div className="field-group flex flex-col gap-2">
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Header Announcement Bar</label>
                    <input 
                      type="text" 
                      value={cmsSections.announcement}
                      onChange={e => setCmsSections({ ...cmsSections, announcement: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white" 
                    />
                  </div>

                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xs text-white/40">Draft published 2 hours ago. Version 2026.11</span>
                  <button className="btn bg-[#d4af37] text-[#07050e] font-bold px-6 py-2 rounded-full hover:scale-105 transition" onClick={() => alert("Homepage published successfully!")}>
                    Publish Homepage Banner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: WEBSITE BUILDER */}
          {activeTab === 'builder' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Visual Block Website Builder</h2>
                  <p className="text-white/50 text-sm">Drag component layouts, preview frame modes, and roll back versions.</p>
                </div>
              </div>

              {/* Viewport frames preview controls */}
              <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex gap-2">
                    {['desktop', 'tablet', 'mobile'].map(device => (
                      <button 
                        key={device} 
                        onClick={() => setPreviewDevice(device as any)}
                        className={`px-3 py-1 rounded text-xs font-semibold capitalize transition ${previewDevice === device ? 'bg-[#d4af37] text-[#07050e]' : 'bg-white/5 text-white/60 hover:text-white'}`}
                      >
                        {device} Preview
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1 rounded text-xs font-semibold transition"
                    >
                      Swap Theme: {previewTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                  </div>
                </div>

                {/* Simulated frame viewport */}
                <div className="flex justify-center bg-black/45 p-6 rounded-xl border border-white/5">
                  <div className={`border border-white/15 rounded-xl overflow-hidden transition-all duration-300 ${
                    previewDevice === 'desktop' ? 'w-full max-w-4xl' :
                    previewDevice === 'tablet' ? 'w-[640px]' : 'w-[360px]'
                  }`}>
                    {/* Simulated website frame header bar */}
                    <div className="bg-[#0c0a17] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-white/40">https://showtimeservices.com</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>

                    {/* Simulated website content body */}
                    <div className={`p-8 min-h-[300px] transition ${previewTheme === 'dark' ? 'bg-[#07050e] text-white' : 'bg-slate-50 text-slate-900'}`}>
                      <div className="border border-dashed border-white/20 p-6 rounded-lg text-center flex flex-col gap-3">
                        <span className="text-[10px] uppercase font-bold text-[#d4af37]">{cmsSections.announcement}</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold">{cmsSections.heroTitle}</h1>
                        <p className="text-xs opacity-60">Visual component block preview area.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: MARKETING */}
          {activeTab === 'marketing' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Marketing Campaign Center</h2>
                  <p className="text-white/50 text-sm">Design marketing templates, run segment A/B testing, and send push alerts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Campaign builder */}
                <div className="lg:col-span-8 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="font-bold text-lg">Broadcast Builder</h3>
                    <div className="flex gap-2">
                      {['email', 'sms', 'push'].map(type => (
                        <button 
                          key={type} 
                          className={`px-3 py-1 rounded text-xs font-semibold capitalize transition ${marketingType === type ? 'bg-[#d4af37] text-[#07050e]' : 'bg-white/5 text-white/60 hover:text-white'}`}
                          onClick={() => setMarketingType(type as any)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Campaign Subject Line</label>
                      <input type="text" placeholder="e.g. Special Offer: 20% Off Reggae Sumfest VIP passes" className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white" />
                    </div>

                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50 font-bold uppercase tracking-wider">User Audience Segment</label>
                      <select className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white">
                        <option>All Past Customers (12,504)</option>
                        <option>VIP Ticket Buyers Only (2,100)</option>
                        <option>Jamaica-Based Customers (6,400)</option>
                      </select>
                    </div>

                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50 font-bold uppercase tracking-wider">Broadcast Copy</label>
                      <textarea rows={4} placeholder="Draft your email or push message here..." className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white" />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button className="btn bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-sm font-semibold transition" onClick={() => alert("A/B campaign drafted.")}>
                        Schedule A/B Test
                      </button>
                      <button className="btn bg-[#d4af37] text-[#07050e] font-bold px-8 py-2 rounded-full hover:scale-105 transition" onClick={() => alert("Broadcast campaign sent to selected audience!")}>
                        Send Instant Broadcast
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Campaigns History */}
                <div className="lg:col-span-4 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg border-b border-white/5 pb-2">Active Campaigns</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { name: 'Koffee Sumfest Promotion', type: 'Email', openRate: '34.2%' },
                      { name: 'Shenseea Ticket Release Alert', type: 'SMS', openRate: '98%' },
                      { name: 'Coachella Lineup Push Alert', type: 'Push', openRate: '15.4%' }
                    ].map((camp, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="block text-sm text-white">{camp.name}</strong>
                          <span className="text-xs text-white/50">{camp.type} Broadcast</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-500">{camp.openRate} open</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: ADVERTISING */}
          {activeTab === 'advertising' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Advertising Placements &amp; Analytics</h2>
                  <p className="text-white/50 text-sm">Review banner placements, track impressions, CTR (Click-Through Rates), and ad revenue.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Homepage Hero Placement', impressions: '142,500', clickRate: '2.4% CTR', revenue: '$3,420' },
                  { name: 'Search Results Banner', impressions: '84,300', clickRate: '1.8% CTR', revenue: '$1,510' },
                  { name: 'Email Footer Banner', impressions: '24,000', clickRate: '4.2% CTR', revenue: '$1,008' }
                ].map((placement, idx) => (
                  <div key={idx} className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                    <div className="border-b border-white/5 pb-2">
                      <strong className="block text-lg text-white">{placement.name}</strong>
                      <span className="text-xs text-white/50">Active Placement</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="block text-white/40 text-[10px]">Impressions</span>
                        <strong className="block text-white mt-1">{placement.impressions}</strong>
                      </div>
                      <div>
                        <span className="block text-white/40 text-[10px]">Clicks</span>
                        <strong className="block text-[#d4af37] mt-1">{placement.clickRate}</strong>
                      </div>
                      <div>
                        <span className="block text-white/40 text-[10px]">Ad Revenue</span>
                        <strong className="block text-white mt-1">{placement.revenue}</strong>
                      </div>
                    </div>
                    <button className="btn bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-lg text-xs font-semibold transition mt-2">
                      Edit Banner Media
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Sales &amp; Traffic Analytics</h2>
                  <p className="text-white/50 text-sm">Visualize traffic conversions, tickets sale stats, and revenue growth graphs.</p>
                </div>
              </div>

              {/* Simulated analytics SVG chart */}
              <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Event Ticket Revenue (30 Days)</h3>
                  <span className="text-xs font-bold text-[#d4af37] bg-[#d4af37]/15 border border-[#d4af37]/20 px-3 py-1 rounded-full uppercase">
                    Live Updates Active
                  </span>
                </div>

                {/* SVG Visual Graphic Chart */}
                <div className="w-full h-64 bg-black/40 border border-white/5 rounded-xl p-4 relative flex items-end">
                  <svg className="w-full h-full text-[#d4af37]" viewBox="0 0 400 150">
                    {/* SVG Chart paths */}
                    <path 
                      d="M 0 120 Q 50 100 100 80 T 200 40 T 300 90 T 400 10" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3.5"
                    />
                    <path 
                      d="M 0 120 Q 50 100 100 80 T 200 40 T 300 90 T 400 10 L 400 150 L 0 150 Z" 
                      fill="rgba(212, 175, 55, 0.05)" 
                    />
                  </svg>
                  
                  {/* Chart Label lines */}
                  <div className="absolute inset-0 flex justify-between p-4 pointer-events-none text-[10px] text-white/30">
                    <div className="flex flex-col justify-between">
                      <span>$100k</span>
                      <span>$50k</span>
                      <span>$0k</span>
                    </div>
                    <div className="flex items-end gap-12">
                      <span>Week 1</span>
                      <span>Week 2</span>
                      <span>Week 3</span>
                      <span>Week 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: FINANCE */}
          {activeTab === 'finance' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Finance &amp; Payouts Ledger</h2>
                  <p className="text-white/50 text-sm">Review promoter payout statements, track tax withholdings, and export CSV ledger sheets.</p>
                </div>
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2.5 px-6 rounded-full hover:scale-105 transition flex items-center gap-2" onClick={() => alert("Finance ledger CSV report downloaded.")}>
                  <FileText className="w-4 h-4" /> Export Financials
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Promoter Payout Ledger Card */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                  <div className="border-b border-white/5 pb-2">
                    <strong className="block text-lg text-white">Promoter Payout Status</strong>
                    <span className="text-xs text-white/50">Settlement Ledger</span>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Gross Contract Volume:</span>
                      <strong className="text-white">${calculatedTotalRevenue.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Agency Commission (10%):</span>
                      <strong className="text-[#d4af37]">${(calculatedTotalRevenue * 0.1).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-2">
                      <span>Promoter Share Due:</span>
                      <strong className="text-white">${(calculatedTotalRevenue * 0.9).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Tax withholdings logs */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                  <div className="border-b border-white/5 pb-2">
                    <strong className="block text-lg text-white">Withholdings &amp; Tax logs</strong>
                    <span className="text-xs text-white/50">Compliance Reports</span>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>US Withholdings (30%):</span>
                      <strong className="text-white">${(calculatedTotalRevenue * 0.3).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>UK VAT (20%):</span>
                      <strong className="text-white">${(calculatedTotalRevenue * 0.2).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Bank payout simulator */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl text-center items-center justify-center">
                  <span className="text-xs text-white/40 uppercase tracking-widest">Bank Settlement Gateway</span>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full my-2">
                    <CircleDollarSign className="w-8 h-8" />
                  </div>
                  <button className="btn bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg text-xs hover:scale-105 transition" onClick={() => alert("Payout transaction dispatched to promoter clearing account.")}>
                    Dispatch Promoter Payouts
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 14: AI OPERATIONS */}
          {activeTab === 'ai-ops' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">AI Operations Staging</h2>
                  <p className="text-white/50 text-sm">Generate event descriptions, artist profiles, and pricing tips via AI models.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: AI actions panel */}
                <div className="lg:col-span-7 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-[#d4af37]">AI Text Copilot</h3>
                  <div className="flex flex-col gap-3">
                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50 font-bold uppercase tracking-wider">AI Generation Prompt</label>
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g. Write a bio for Beres Hammond celebrating 40 years of lovers rock reggae"
                        className="bg-white/5 border border-white/10 rounded px-4 py-2 text-sm text-white" 
                      />
                    </div>
                    
                    <button 
                      className="btn bg-[#d4af37] text-[#07050e] font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                      onClick={() => {
                        setAiLoading(true);
                        setTimeout(() => {
                          setAiLoading(false);
                          setAiOutput(`[AI-Copilot Result]:\nHugh Beresford Hammond O.D. (born 28 August 1954, Annotto Bay, Saint Mary, Jamaica) is a Jamaican reggae singer known for his lovers rock. While his career has spanned reggae genres, Hammond has dedicated much of his soulful discography to romantic reggae classics. His signature raspy vocals have fronted hits such as "Tempted to Touch" and "Rockaway" across 40 iconic years on live global stages.`);
                        }, 1500);
                      }}
                    >
                      {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate AI Content
                    </button>
                  </div>
                </div>

                {/* Right: AI output */}
                <div className="lg:col-span-5 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-[#a855f7]">AI Output Terminal</h3>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl min-h-[160px] font-mono text-xs text-white/80 whitespace-pre-wrap">
                    {aiOutput || "Ready for prompt input..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: STAFF & ROLES */}
          {activeTab === 'staff' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Staff Directories &amp; RBAC Roles</h2>
                  <p className="text-white/50 text-sm">Review staff roles and configure access matrices (RBAC).</p>
                </div>
              </div>

              <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="font-bold text-lg text-[#d4af37] border-b border-white/5 pb-2">Active Staff Directory</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 font-semibold text-xs uppercase">
                        <th className="pb-3">Staff Name</th>
                        <th className="pb-3">Email Address</th>
                        <th className="pb-3">Assigned Role</th>
                        <th className="pb-3">Security Clearances</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { name: 'Damian Marley', email: 'damian.admin@showtime.com', role: 'Super Admin', clearance: 'All Permissions' },
                        { name: 'Sarah Silverman', email: 'sarah.agent@showtime.com', role: 'Booking Agent', clearance: 'Events, Artists, Customers' },
                        { name: 'Robert Livingston', email: 'robert.manager@showtime.com', role: 'Content Manager', clearance: 'Content, Builder, Artists' }
                      ].map((staff, idx) => (
                        <tr key={idx} className="text-white/80">
                          <td className="py-3.5 font-bold">{staff.name}</td>
                          <td className="py-3.5 font-mono text-xs">{staff.email}</td>
                          <td className="py-3.5"><span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded font-semibold">{staff.role}</span></td>
                          <td className="py-3.5 text-xs text-white/60">{staff.clearance}</td>
                          <td className="py-3.5 text-right">
                            <button className="btn bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1 rounded text-xs transition" onClick={() => alert("Opening security privileges matrix...")}>
                              Configure Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 16: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">API &amp; Platform Integrations</h2>
                  <p className="text-white/50 text-sm">Maintain third-party API keys, communication pipelines, and pixels.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Payments integrations */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-[#d4af37] border-b border-white/5 pb-2">Payment Gateways</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Stripe Payment Gateway</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold">Connected</span>
                    </div>
                    <div className="field-group flex flex-col gap-1">
                      <label className="text-[10px] text-white/40 uppercase">Stripe Public Key</label>
                      <input 
                        type="text" 
                        value={apiKeys.stripe}
                        onChange={e => setApiKeys({ ...apiKeys, stripe: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* Comms integrations */}
                <div className="bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-[#a855f7] border-b border-white/5 pb-2">Communications Pipelines</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Twilio SMS Business API</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold">Connected</span>
                    </div>
                    <div className="field-group flex flex-col gap-1">
                      <label className="text-[10px] text-white/40 uppercase">Twilio Account SID</label>
                      <input 
                        type="text" 
                        value={apiKeys.twilio}
                        onChange={e => setApiKeys({ ...apiKeys, twilio: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white" 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 17: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 animate-fade">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">System Settings &amp; Emergency Controls</h2>
                  <p className="text-white/50 text-sm">Configure brand domains, currency structures, and trigger kill-switches.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Domain & timezone configs */}
                <div className="lg:col-span-8 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-[#d4af37] border-b border-white/5 pb-2">Global Domain Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50">Primary Domain</label>
                      <input type="text" defaultValue="showtimeservices.com" className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                    </div>
                    <div className="field-group flex flex-col gap-2">
                      <label className="text-xs text-white/50">System Currency</label>
                      <select className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                        <option>USD ($)</option>
                        <option>JMD ($)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency controls */}
                <div className="lg:col-span-4 bg-[#0c0a17] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                  <h3 className="font-bold text-lg text-red-500 border-b border-white/5 pb-2">Emergency Hub</h3>
                  <p className="text-xs text-white/60 mb-2">Activating the system kill switch locks down all customer transactions instantly.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      className="btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-xs hover:scale-105 transition flex items-center justify-center gap-2"
                      onClick={() => {
                        if (confirm("WARNING: Are you sure you want to trigger the master Kill Switch? This will block all access immediately.")) {
                          setEmergencyKillActive(true);
                        }
                      }}
                    >
                      <AlertOctagon className="w-4 h-4" /> Trigger Master Kill Switch
                    </button>
                    
                    <button 
                      className="btn bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg text-xs font-semibold transition"
                      onClick={() => {
                        setMaintenanceMode(!maintenanceMode);
                        alert(`Maintenance Mode: ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
                      }}
                    >
                      Toggle Maintenance Mode
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── COMMAND PALETTE OVERLAY ── */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh]">
          <div className="bg-[#0c0a17] border border-white/15 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col gap-3">
            
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
              <Search className="w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Type a command or query..."
                value={commandSearch}
                onChange={e => { setCommandSearch(e.target.value); setPaletteIndex(0); }}
                onKeyDown={handlePaletteKeyDown}
                className="bg-transparent border-none outline-none text-white text-sm flex-1"
                autoFocus
              />
              <button 
                className="text-white/40 hover:text-white"
                onClick={() => setCommandPaletteOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
              {getCommandOptions().map((opt, idx) => (
                <div 
                  key={idx}
                  onClick={opt.action}
                  className={`px-3 py-2.5 rounded-lg text-sm flex justify-between items-center cursor-pointer transition ${
                    idx === paletteIndex ? 'bg-[#d4af37] text-[#07050e] font-semibold' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest font-mono">
                    {opt.type}
                  </span>
                </div>
              ))}
              {getCommandOptions().length === 0 && (
                <p className="text-center text-xs text-white/40 py-4">No matching commands found.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── EVENT BUILDER WIZARD DIALOG ── */}
      {showEventBuilder && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c0a17] border border-white/15 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Wizard Header */}
            <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest">Step {eventBuilderStep} of 8</span>
                <h3 className="font-extrabold text-xl">Event Builder Wizard</h3>
              </div>
              <button className="text-white/40 hover:text-white" onClick={() => setShowEventBuilder(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="px-6 py-3 bg-[#07050e] border-b border-white/5 flex gap-2 justify-between text-[10px] font-bold text-white/40">
              {['Details', 'Media', 'Venue', 'Artist', 'Tickets', 'Pricing', 'SEO', 'Publish'].map((stepName, idx) => (
                <span key={idx} className={idx + 1 === eventBuilderStep ? 'text-[#d4af37]' : idx + 1 < eventBuilderStep ? 'text-white/80' : ''}>
                  {stepName}
                </span>
              ))}
            </div>

            {/* Wizard step contents */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              
              {/* STEP 1: Basic Details */}
              {eventBuilderStep === 1 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">Basic Details</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">Event Title *</label>
                    <input 
                      type="text" 
                      value={eventBuilderForm.title}
                      onChange={e => setEventBuilderForm({ ...eventBuilderForm, title: e.target.value })}
                      placeholder="e.g. Reggae Sumfest 2026 Night 2" 
                      className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">Event Subtitle</label>
                    <input 
                      type="text" 
                      value={eventBuilderForm.subtitle}
                      onChange={e => setEventBuilderForm({ ...eventBuilderForm, subtitle: e.target.value })}
                      placeholder="e.g. The Greatest Reggae Show on Earth" 
                      className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">Description</label>
                    <textarea 
                      rows={3} 
                      value={eventBuilderForm.description}
                      onChange={e => setEventBuilderForm({ ...eventBuilderForm, description: e.target.value })}
                      placeholder="Specify event summaries..." 
                      className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Media Upload */}
              {eventBuilderStep === 2 && (
                <div className="flex flex-col gap-4 animate-fade text-center items-center justify-center py-6">
                  <h4 className="font-bold text-base text-[#d4af37] w-full text-left">Media Upload</h4>
                  <div className="w-full max-w-md border-2 border-dashed border-white/10 rounded-xl p-8 bg-white/5 flex flex-col items-center gap-3">
                    <FileText className="w-10 h-10 text-[#d4af37]" />
                    <span className="text-sm font-semibold">Drag cover images or gallery files here</span>
                    <span className="text-[10px] text-white/40">Supported formats: JPG, PNG, MP4 (Max 50MB)</span>
                  </div>
                </div>
              )}

              {/* STEP 3: Venue Selection */}
              {eventBuilderStep === 3 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">Venue Selection</h4>
                  <select 
                    value={eventBuilderForm.venue}
                    onChange={e => setEventBuilderForm({ ...eventBuilderForm, venue: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="">-- Select Venue --</option>
                    <option value="Catherine Hall Montego Bay">Catherine Hall (Montego Bay, Jamaica)</option>
                    <option value="National Arena Kingston">National Arena (Kingston, Jamaica)</option>
                    <option value="O2 Arena London">O2 Arena (London, United Kingdom)</option>
                  </select>
                </div>
              )}

              {/* STEP 4: Artist Assignment */}
              {eventBuilderStep === 4 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">Artist Assignment</h4>
                  <select 
                    value={eventBuilderForm.artist}
                    onChange={e => setEventBuilderForm({ ...eventBuilderForm, artist: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="">-- Choose Artist --</option>
                    {artists.map(art => (
                      <option key={art.id} value={art.id}>{art.stage_name} ({art.genre})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* STEP 5: Ticket Configuration */}
              {eventBuilderStep === 5 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">Ticket Configuration</h4>
                  <div className="flex flex-col gap-2 text-xs text-white/60">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> General Admission Pass (GA)</label>
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> VIP Raised Platform Pass</label>
                    <label className="flex items-center gap-2"><input type="checkbox" /> VVIP Backstage Table packages</label>
                  </div>
                </div>
              )}

              {/* STEP 6: Pricing Rules */}
              {eventBuilderStep === 6 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">Pricing &amp; Capacity Rules</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-white/50">GA Ticket Price (USD) *</label>
                      <input 
                        type="number" 
                        value={eventBuilderForm.ticketPriceGA}
                        onChange={e => setEventBuilderForm({ ...eventBuilderForm, ticketPriceGA: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-white/50">VIP Ticket Price (USD) *</label>
                      <input 
                        type="number" 
                        value={eventBuilderForm.ticketPriceVIP}
                        onChange={e => setEventBuilderForm({ ...eventBuilderForm, ticketPriceVIP: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">Target Capacity Limit *</label>
                    <input 
                      type="number" 
                      value={eventBuilderForm.capacity}
                      onChange={e => setEventBuilderForm({ ...eventBuilderForm, capacity: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                    />
                  </div>
                </div>
              )}

              {/* STEP 7: SEO Settings */}
              {eventBuilderStep === 7 && (
                <div className="flex flex-col gap-4 animate-fade">
                  <h4 className="font-bold text-base text-[#d4af37]">SEO &amp; Tag Settings</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">SEO Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={eventBuilderForm.seoTags}
                      onChange={e => setEventBuilderForm({ ...eventBuilderForm, seoTags: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: Publishing */}
              {eventBuilderStep === 8 && (
                <div className="flex flex-col gap-4 animate-fade text-center items-center justify-center py-6">
                  <h4 className="font-bold text-base text-[#d4af37] w-full text-left">Publishing Controls</h4>
                  <p className="text-sm mb-4 max-w-md">Verify all steps are complete before pushing the event live to the ticketing platform.</p>
                  <div className="flex gap-4">
                    <button 
                      className={`px-5 py-2.5 rounded-full font-bold border transition ${eventBuilderForm.publishMode === 'Draft' ? 'bg-[#d4af37] border-[#d4af37] text-[#07050e]' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}
                      onClick={() => setEventBuilderForm({ ...eventBuilderForm, publishMode: 'Draft' })}
                    >
                      Save as Draft
                    </button>
                    <button 
                      className={`px-5 py-2.5 rounded-full font-bold border transition ${eventBuilderForm.publishMode === 'Live' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}
                      onClick={() => setEventBuilderForm({ ...eventBuilderForm, publishMode: 'Live' })}
                    >
                      Publish Live
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard actions */}
            <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex justify-between">
              <button 
                className="btn bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => setEventBuilderStep(prev => prev - 1)}
                disabled={eventBuilderStep === 1}
              >
                Previous Step
              </button>
              {eventBuilderStep < 8 ? (
                <button 
                  className="btn bg-[#d4af37] text-[#07050e] px-6 py-2 rounded-full text-xs font-bold transition"
                  onClick={() => setEventBuilderStep(prev => prev + 1)}
                >
                  Next Step
                </button>
              ) : (
                <button 
                  className="btn bg-emerald-500 text-white px-8 py-2 rounded-full text-xs font-extrabold transition"
                  onClick={handleEventPublish}
                >
                  Finalize &amp; Save
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- CREATE CRM LEAD MODAL --- */}
      {showCreateLead && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0a17] border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="font-bold text-lg text-[#d4af37]">Log Inbound CRM Inquiries</h3>
              <button className="text-white/40 hover:text-white" onClick={() => setShowCreateLead(false)}><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
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
              setShowCreateLead(false);
              await loadPortalData();
            }} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label>Contact Name *</label>
                <input type="text" required onChange={e => setNewLeadForm({ ...newLeadForm, contact_name: e.target.value })} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label>Email Address *</label>
                <input type="email" required onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label>Select Artist *</label>
                <select required onChange={e => setNewLeadForm({ ...newLeadForm, artist_id: e.target.value })} className="bg-white/5 border border-white/10 rounded p-2 text-white">
                  <option value="">-- Select --</option>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label>Preferred Date</label>
                <input type="date" onChange={e => setNewLeadForm({ ...newLeadForm, preferred_date: e.target.value })} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label>Budget (USD)</label>
                <input type="number" defaultValue="50000" onChange={e => setNewLeadForm({ ...newLeadForm, budget: e.target.value })} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                <button type="button" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full font-bold" onClick={() => setShowCreateLead(false)}>Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#d4af37] text-[#07050e] rounded-full font-bold">Log Inquiry</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
