'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, Lead, Booking, Task, Notification, Invoice, Artist, Venue, Customer, User, TicketTier, PromoCode, MarketingCampaign, AdPlacement, WebsiteSection, Integration } from '@/utils/db';
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

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
}

function ImageUploader({ label, value, onChange }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (png, jpg, jpeg, webp, gif).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/50 text-xs font-semibold">{label}</label>
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition relative min-h-[120px] overflow-hidden ${
          dragActive ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/10 hover:border-white/20 bg-white/5'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {value ? (
          <div className="absolute inset-0 w-full h-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Drag or click to replace</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className="text-xs text-white/80 font-medium">Click to upload or drag & drop</p>
              <p className="text-[10px] text-white/40 mt-0.5">PNG, JPG, JPEG, WEBP or GIF</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const [websiteSections, setWebsiteSections] = useState<WebsiteSection[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  // Modals & Builders
  const [showEventBuilder, setShowEventBuilder] = useState(false);
  const [eventBuilderStep, setEventBuilderStep] = useState(1);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Dynamic CRUD Panel State (Premium Drawer)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'event' | 'venue' | 'artist' | 'customer' | 'staff' | 'ticket' | 'promo' | 'order' | 'campaign' | 'ad' | 'section' | 'integration' | null>(null);
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form states for CRUD
  const [eventForm, setEventForm] = useState({
    artist_id: '',
    event_title: '',
    event_date: '',
    event_venue: '',
    event_country: '',
    status: 'Inquiry' as Booking['status'],
    total_amount: '50000',
    deposit_amount: '25000',
    client_name: '',
    artist_image: ''
  });

  const [venueForm, setVenueForm] = useState({
    name: '',
    capacity: '',
    location: '',
    description: '',
    parking: ''
  });

  const [artistForm, setArtistForm] = useState({
    stage_name: '',
    legal_name: '',
    category: 'Reggae Artists',
    genre: '',
    bio: '',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available' as Artist['booking_status'],
    availability_status: 'Active' as Artist['availability_status'],
    technical_rider: '',
    hospitality_rider: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    company: '',
    email: '',
    tier: 'Standard Client',
    notes: ''
  });

  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'Booking Agent',
    status: 'Active' as User['status']
  });

  const [ticketForm, setTicketForm] = useState({
    name: '',
    price: '85',
    desc: '',
    capacity: '1000'
  });

  const [promoForm, setPromoForm] = useState({
    code: '',
    discount: '20',
    active: true,
    expiry: ''
  });

  const [orderForm, setOrderForm] = useState({
    booking_id: '',
    amount: '50000',
    status: 'Unpaid' as Invoice['status'],
    due_date: ''
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'Email' as MarketingCampaign['type'],
    subject: '',
    segment: 'All Past Customers (12,504)',
    content: ''
  });

  const [adForm, setAdForm] = useState({
    name: '',
    active: true,
    image_url: ''
  });

  const [sectionForm, setSectionForm] = useState({
    type: 'hero' as WebsiteSection['type'],
    title: '',
    subtitle: '',
    content: '',
    buttonText: '',
    image_url: '',
    active: true
  });

  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    provider: 'Stripe' as Integration['provider'],
    status: 'Connected' as Integration['status'],
    api_key: ''
  });

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
      const allVenues = await db.getVenues();
      const allCustomers = await db.getCustomers();
      const allUsers = await db.getUsers();

      const allTiers = await db.getTicketTiers();
      const allPromos = await db.getPromoCodes();
      const allCamps = await db.getCampaigns();
      const allAds = await db.getAdPlacements();
      const allSecs = await db.getWebsiteSections();
      const allInts = await db.getIntegrations();

      if (user) {
        const userNotifs = await db.getNotifications(user.id);
        setNotifs(userNotifs);
      }
      setLeads(allLeads);
      setBookings(allBookings);
      setTasks(allTasks);
      setInvoices(allInvoices);
      setArtists(allArtists);
      setVenues(allVenues);
      setCustomers(allCustomers);
      setUsers(allUsers);

      setTicketTiers(allTiers);
      setPromoCodes(allPromos);
      setCampaigns(allCamps);
      setAdPlacements(allAds);
      setWebsiteSections(allSecs);
      setIntegrations(allInts);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  // Open sliding panel and prepare state
  const openCrudPanel = (type: typeof panelType, mode: 'create' | 'edit', itemId: string | null = null) => {
    setPanelType(type);
    setPanelMode(mode);
    setSelectedItemId(itemId);
    setPanelOpen(true);
    
    if (mode === 'edit' && itemId) {
      if (type === 'event') {
        const item = bookings.find(b => b.id === itemId);
        if (item) {
          setEventForm({
            artist_id: item.artist_id,
            event_title: item.event_title,
            event_date: item.event_date,
            event_venue: item.event_venue,
            event_country: item.event_country,
            status: item.status,
            total_amount: String(item.total_amount),
            deposit_amount: String(item.deposit_amount),
            client_name: item.client_name,
            artist_image: item.artist_image || ''
          });
        }
      } else if (type === 'venue') {
        const item = venues.find(v => v.id === itemId);
        if (item) {
          setVenueForm({
            name: item.name,
            capacity: item.capacity,
            location: item.location,
            description: item.description || '',
            parking: item.parking || ''
          });
        }
      } else if (type === 'artist') {
        const item = artists.find(a => a.id === itemId);
        if (item) {
          setArtistForm({
            stage_name: item.stage_name,
            legal_name: item.legal_name,
            category: item.category,
            genre: item.genre,
            bio: item.bio,
            profile_image: item.profile_image,
            cover_image: item.cover_image,
            booking_status: item.booking_status,
            availability_status: item.availability_status,
            technical_rider: item.technical_rider || '',
            hospitality_rider: item.hospitality_rider || ''
          });
        }
      } else if (type === 'customer') {
        const item = customers.find(c => c.id === itemId);
        if (item) {
          setCustomerForm({
            name: item.name,
            company: item.company,
            email: item.email,
            notes: item.notes,
            tier: item.tier
          });
        }
      } else if (type === 'staff') {
        const item = users.find(u => u.id === itemId);
        if (item) {
          setStaffForm({
            first_name: item.first_name,
            last_name: item.last_name,
            email: item.email,
            role: item.role,
            status: item.status
          });
        }
      } else if (type === 'ticket') {
        const item = ticketTiers.find(t => t.id === itemId);
        if (item) {
          setTicketForm({
            name: item.name,
            price: String(item.price),
            desc: item.desc,
            capacity: String(item.capacity || 1000)
          });
        }
      } else if (type === 'promo') {
        const item = promoCodes.find(p => p.id === itemId);
        if (item) {
          setPromoForm({
            code: item.code,
            discount: String(item.discount),
            active: item.active,
            expiry: item.expiry || ''
          });
        }
      } else if (type === 'order') {
        const item = invoices.find(i => i.id === itemId);
        if (item) {
          setOrderForm({
            booking_id: item.booking_id,
            amount: String(item.amount),
            status: item.status,
            due_date: item.due_date
          });
        }
      } else if (type === 'campaign') {
        const item = campaigns.find(c => c.id === itemId);
        if (item) {
          setCampaignForm({
            name: item.name,
            type: item.type,
            subject: item.subject || '',
            segment: item.segment,
            content: item.content
          });
        }
      } else if (type === 'ad') {
        const item = adPlacements.find(a => a.id === itemId);
        if (item) {
          setAdForm({
            name: item.name,
            active: item.active,
            image_url: item.image_url || ''
          });
        }
      } else if (type === 'section') {
        const item = websiteSections.find(s => s.id === itemId);
        if (item) {
          setSectionForm({
            type: item.type,
            title: item.title,
            subtitle: item.subtitle || '',
            content: item.content || '',
            buttonText: item.buttonText || '',
            image_url: item.image_url || '',
            active: item.active
          });
        }
      } else if (type === 'integration') {
        const item = integrations.find(i => i.id === itemId);
        if (item) {
          setIntegrationForm({
            name: item.name,
            provider: item.provider,
            status: item.status,
            api_key: item.api_key
          });
        }
      }
    } else {
      if (type === 'event') {
        setEventForm({
          artist_id: artists[0]?.id || '',
          event_title: '',
          event_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          event_venue: '',
          event_country: 'Jamaica',
          status: 'Inquiry',
          total_amount: '50000',
          deposit_amount: '25000',
          client_name: '',
          artist_image: ''
        });
      } else if (type === 'venue') {
        setVenueForm({ name: '', capacity: '', location: '', description: '', parking: '' });
      } else if (type === 'artist') {
        setArtistForm({
          stage_name: '',
          legal_name: '',
          category: 'Reggae Artists',
          genre: '',
          bio: '',
          profile_image: '/images/artist_reggae.jpg',
          cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
          booking_status: 'Available',
          availability_status: 'Active',
          technical_rider: '',
          hospitality_rider: ''
        });
      } else if (type === 'customer') {
        setCustomerForm({ name: '', company: '', email: '', notes: '', tier: 'Standard Client' });
      } else if (type === 'staff') {
        setStaffForm({ first_name: '', last_name: '', email: '', role: 'Booking Agent', status: 'Active' });
      } else if (type === 'ticket') {
        setTicketForm({ name: '', price: '85', desc: '', capacity: '1000' });
      } else if (type === 'promo') {
        setPromoForm({ code: '', discount: '20', active: true, expiry: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] });
      } else if (type === 'order') {
        setOrderForm({ booking_id: bookings[0]?.id || '', amount: '50000', status: 'Unpaid', due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0] });
      } else if (type === 'campaign') {
        setCampaignForm({ name: '', type: 'Email', subject: '', segment: 'All Past Customers (12,504)', content: '' });
      } else if (type === 'ad') {
        setAdForm({ name: '', active: true, image_url: '' });
      } else if (type === 'section') {
        setSectionForm({ type: 'hero', title: '', subtitle: '', content: '', buttonText: '', image_url: '', active: true });
      } else if (type === 'integration') {
        setIntegrationForm({ name: '', provider: 'Stripe', status: 'Connected', api_key: '' });
      }
    }
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (panelType === 'event') {
        const selectedArtist = artists.find(a => a.id === eventForm.artist_id);
        const bookingData = {
          artist_id: eventForm.artist_id,
          artist_name: selectedArtist ? selectedArtist.stage_name : 'Unknown Artist',
          artist_image: selectedArtist ? selectedArtist.profile_image : '/images/artist_reggae.jpg',
          client_id: 'cli-user',
          client_name: eventForm.client_name,
          event_id: 'evt-' + Math.random().toString(36).substr(2, 9),
          event_title: eventForm.event_title,
          event_date: eventForm.event_date,
          event_venue: eventForm.event_venue,
          event_country: eventForm.event_country,
          status: eventForm.status,
          total_amount: parseFloat(eventForm.total_amount) || 0,
          deposit_amount: parseFloat(eventForm.deposit_amount) || 0
        };
        if (panelMode === 'create') {
          await db.createBooking(bookingData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateBooking(selectedItemId, bookingData);
        }
      } else if (panelType === 'venue') {
        if (panelMode === 'create') {
          await db.createVenue(venueForm);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateVenue(selectedItemId, venueForm);
        }
      } else if (panelType === 'artist') {
        if (panelMode === 'create') {
          await db.createArtist(artistForm);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateArtistProfile(selectedItemId, artistForm);
        }
      } else if (panelType === 'customer') {
        if (panelMode === 'create') {
          await db.createCustomer(customerForm);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateCustomer(selectedItemId, customerForm);
        }
      } else if (panelType === 'staff') {
        if (panelMode === 'create') {
          await db.createUser(staffForm);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateUser(selectedItemId, staffForm);
        }
      } else if (panelType === 'ticket') {
        const ticketData = {
          name: ticketForm.name,
          price: parseFloat(ticketForm.price) || 0,
          desc: ticketForm.desc,
          capacity: parseInt(ticketForm.capacity) || 1000
        };
        if (panelMode === 'create') {
          await db.createTicketTier(ticketData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateTicketTier(selectedItemId, ticketData);
        }
      } else if (panelType === 'promo') {
        const promoData = {
          code: promoForm.code,
          discount: parseFloat(promoForm.discount) || 0,
          active: promoForm.active,
          expiry: promoForm.expiry
        };
        if (panelMode === 'create') {
          await db.createPromoCode(promoData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updatePromoCode(selectedItemId, promoData);
        }
      } else if (panelType === 'order') {
        const orderData = {
          booking_id: orderForm.booking_id,
          amount: parseFloat(orderForm.amount) || 0,
          balance_due: orderForm.status === 'Paid' ? 0 : (parseFloat(orderForm.amount) || 0),
          status: orderForm.status,
          due_date: orderForm.due_date
        };
        if (panelMode === 'create') {
          await db.createInvoice(orderData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateInvoice(selectedItemId, orderData);
        }
      } else if (panelType === 'campaign') {
        const campaignData = {
          name: campaignForm.name,
          type: campaignForm.type,
          subject: campaignForm.subject,
          segment: campaignForm.segment,
          content: campaignForm.content
        };
        if (panelMode === 'create') {
          await db.createCampaign(campaignData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateCampaign(selectedItemId, campaignData);
        }
      } else if (panelType === 'ad') {
        const adData = {
          name: adForm.name,
          active: adForm.active,
          image_url: adForm.image_url
        };
        if (panelMode === 'create') {
          await db.createAdPlacement(adData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateAdPlacement(selectedItemId, adData);
        }
      } else if (panelType === 'section') {
        const sectionData = {
          type: sectionForm.type,
          title: sectionForm.title,
          subtitle: sectionForm.subtitle,
          content: sectionForm.content,
          buttonText: sectionForm.buttonText,
          image_url: sectionForm.image_url,
          active: sectionForm.active
        };
        if (panelMode === 'create') {
          await db.createWebsiteSection(sectionData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateWebsiteSection(selectedItemId, sectionData);
        }
      } else if (panelType === 'integration') {
        const integrationData = {
          name: integrationForm.name,
          provider: integrationForm.provider,
          status: integrationForm.status,
          api_key: integrationForm.api_key
        };
        if (panelMode === 'create') {
          await db.createIntegration(integrationData);
        } else if (panelMode === 'edit' && selectedItemId) {
          await db.updateIntegration(selectedItemId, integrationData);
        }
      }
      setPanelOpen(false);
      await loadPortalData();
    } catch (err) {
      console.error(err);
      alert('Failed to save record.');
    }
  };

  const handleDelete = async (type: typeof panelType, id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      if (type === 'event') {
        await db.deleteBooking(id);
      } else if (type === 'venue') {
        await db.deleteVenue(id);
      } else if (type === 'artist') {
        await db.deleteArtist(id);
      } else if (type === 'customer') {
        await db.deleteCustomer(id);
      } else if (type === 'staff') {
        await db.deleteUser(id);
      } else if (type === 'ticket') {
        await db.deleteTicketTier(id);
      } else if (type === 'promo') {
        await db.deletePromoCode(id);
      } else if (type === 'order') {
        await db.deleteInvoice(id);
      } else if (type === 'campaign') {
        await db.deleteCampaign(id);
      } else if (type === 'ad') {
        await db.deleteAdPlacement(id);
      } else if (type === 'section') {
        await db.deleteWebsiteSection(id);
      } else if (type === 'integration') {
        await db.deleteIntegration(id);
      }
      await loadPortalData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete record.');
    }
  };

  // Auto-collapse sidebar on mobile screen loads & window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize(); // run initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        
        {/* Mobile Sidebar backdrop */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] lg:hidden animate-fade"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Collapsible Sidebar */}
        <aside className={`border-r border-white/5 bg-[#0c0a17]/95 lg:bg-[#0c0a17]/50 flex flex-col transition-all duration-300 fixed lg:static inset-y-0 left-0 z-[150] h-full lg:h-auto ${
          sidebarCollapsed 
            ? '-translate-x-full lg:translate-x-0 lg:w-16 overflow-hidden' 
            : 'translate-x-0 lg:w-64'
        }`}>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* Group Navigation items by Category */}
            {['Core Operations', 'Website Management', 'Growth & Promo', 'Administration', 'Settings'].map((category, catIdx) => {
              const items = NAV_ITEMS.filter(i => i.category === category);
              const isCollapsed = sidebarCollapsed;
              return (
                <div key={category} className="flex flex-col gap-1">
                  {!isCollapsed && (
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
                          if (hasAccess) {
                            setActiveTab(item.id);
                            // Auto-close on mobile when item clicked
                            if (window.innerWidth < 1024) {
                              setSidebarCollapsed(true);
                            }
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                          active ? 'bg-[#d4af37] text-[#07050e] font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                        } ${!hasAccess ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                        {!hasAccess && !isCollapsed && (
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
                <div className="flex gap-2">
                  <button className="btn bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full font-semibold text-xs transition flex items-center gap-1.5" onClick={() => openCrudPanel('event', 'create')}>
                    <Plus className="w-3.5 h-3.5" /> Quick Add
                  </button>
                  <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2 px-5 rounded-full hover:scale-105 transition flex items-center gap-1.5 text-xs" onClick={() => setShowEventBuilder(true)}>
                    <Sparkles className="w-3.5 h-3.5" /> 8-Step Wizard
                  </button>
                </div>
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
                        <span className="text-[10px] text-white/40 block mt-1">Client: {bk.client_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/60 pt-3 border-t border-white/5">
                        <span>Date: {bk.event_date}</span>
                        <strong className="text-white font-bold">${bk.total_amount.toLocaleString()}</strong>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button 
                          className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 font-semibold"
                          onClick={() => openCrudPanel('event', 'edit', bk.id)}
                        >
                          <FileEdit className="w-3 h-3 text-[#d4af37]" /> Edit
                        </button>
                        <button 
                          className="btn flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 font-semibold"
                          onClick={() => handleDelete('event', bk.id)}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
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
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2 px-5 rounded-full hover:scale-105 transition flex items-center gap-1 text-xs" onClick={() => openCrudPanel('venue', 'create')}>
                  <Plus className="w-3.5 h-3.5" /> Add Venue
                </button>
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
                      {venues.map((venue) => (
                        <div key={venue.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <strong className="block text-sm text-white">{venue.name}</strong>
                              <span className="text-xs text-white/50">{venue.location}</span>
                            </div>
                            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60">{venue.capacity}</span>
                          </div>
                          {venue.description && <p className="text-xs text-white/40 line-clamp-2">{venue.description}</p>}
                          <div className="flex justify-between items-center text-[10px] text-white/50 border-t border-white/5 pt-2 mt-1">
                            <span>Parking: {venue.parking || 'N/A'}</span>
                            <div className="flex gap-2">
                              <button className="text-[#d4af37] hover:underline flex items-center gap-0.5" onClick={() => openCrudPanel('venue', 'edit', venue.id)}>
                                <FileEdit className="w-3 h-3" /> Edit
                              </button>
                              <button className="text-red-400 hover:underline flex items-center gap-0.5" onClick={() => handleDelete('venue', venue.id)}>
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
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
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2 px-5 rounded-full hover:scale-105 transition flex items-center gap-1 text-xs" onClick={() => openCrudPanel('artist', 'create')}>
                  <Plus className="w-3.5 h-3.5" /> Add Artist
                </button>
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
                      <span className="ml-auto text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70 uppercase font-mono">
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
                        className="btn bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg text-xs transition font-semibold"
                        onClick={() => {
                          alert(`Technical Rider: \n${art.technical_rider}\n\nHospitality Rider: \n${art.hospitality_rider}`);
                        }}
                      >
                        Inspect Riders
                      </button>
                      <button 
                        className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 font-semibold"
                        onClick={() => openCrudPanel('artist', 'edit', art.id)}
                      >
                        <FileEdit className="w-3 h-3 text-[#d4af37]" /> Edit Profile
                      </button>
                      <button 
                        className="btn flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 font-semibold"
                        onClick={() => handleDelete('artist', art.id)}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
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
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2 px-5 rounded-full hover:scale-105 transition flex items-center gap-1 text-xs" onClick={() => openCrudPanel('customer', 'create')}>
                  <Plus className="w-3.5 h-3.5" /> Add Customer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customers.map((customer) => (
                  <div key={customer.id} className="bg-[#0c0a17] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
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
                    <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                      <div className="flex gap-3">
                        <button className="text-xs text-[#d4af37] hover:underline flex items-center gap-0.5" onClick={() => openCrudPanel('customer', 'edit', customer.id)}>
                          <FileEdit className="w-3 h-3" /> Edit
                        </button>
                        <button className="text-xs text-red-400 hover:underline flex items-center gap-0.5" onClick={() => handleDelete('customer', customer.id)}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
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
                <button className="btn bg-[#d4af37] text-[#07050e] font-semibold py-2 px-5 rounded-full hover:scale-105 transition flex items-center gap-1 text-xs" onClick={() => openCrudPanel('staff', 'create')}>
                  <Plus className="w-3.5 h-3.5" /> Add Staff Member
                </button>
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
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((staff) => (
                        <tr key={staff.id} className="text-white/80">
                          <td className="py-3.5 font-bold">{staff.first_name} {staff.last_name}</td>
                          <td className="py-3.5 font-mono text-xs">{staff.email}</td>
                          <td className="py-3.5">
                            <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded font-semibold">{staff.role}</span>
                          </td>
                          <td className="py-3.5 text-xs text-white/60">
                            Status: <span className={staff.status === 'Active' ? 'text-emerald-400' : staff.status === 'Suspended' ? 'text-red-500' : 'text-white/40'}>{staff.status}</span>
                          </td>
                          <td className="py-3.5 text-right flex justify-end gap-2">
                            <button className="btn bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded text-xs transition" onClick={() => openCrudPanel('staff', 'edit', staff.id)}>
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                            <button className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-xs transition" onClick={() => handleDelete('staff', staff.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
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
      {/* ── DYNAMIC CRUD SLIDE-OVER DRAWER ── */}
      {panelOpen && panelType && (
        <div className="fixed inset-0 z-[4500] bg-black/60 backdrop-blur-sm flex justify-end">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={() => setPanelOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#0c0a17] border-l border-white/10 h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-6 shadow-2xl animate-slide-in">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-xl capitalize text-[#d4af37]">{panelMode} {panelType}</h3>
                <p className="text-xs text-white/50">Ensure all details are accurate before saving.</p>
              </div>
              <button 
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5"
                onClick={() => setPanelOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between gap-8">
              <div className="flex flex-col gap-4 overflow-y-auto text-xs">
                
                {/* ── EVENT FORM FIELDS ── */}
                {panelType === 'event' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Event Title *</label>
                      <input 
                        type="text" 
                        required 
                        value={eventForm.event_title} 
                        onChange={e => setEventForm({ ...eventForm, event_title: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Client / Promoter Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={eventForm.client_name} 
                        onChange={e => setEventForm({ ...eventForm, client_name: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Select Assigned Artist *</label>
                      <select 
                        required 
                        value={eventForm.artist_id}
                        onChange={e => setEventForm({ ...eventForm, artist_id: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="">-- Choose Artist --</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Event Date *</label>
                        <input 
                          type="date" 
                          required 
                          value={eventForm.event_date} 
                          onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Country *</label>
                        <input 
                          type="text" 
                          required 
                          value={eventForm.event_country} 
                          onChange={e => setEventForm({ ...eventForm, event_country: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Venue Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={eventForm.event_venue} 
                        onChange={e => setEventForm({ ...eventForm, event_venue: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Total Amount (USD) *</label>
                        <input 
                          type="number" 
                          required 
                          value={eventForm.total_amount} 
                          onChange={e => setEventForm({ ...eventForm, total_amount: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Deposit Amount (USD) *</label>
                        <input 
                          type="number" 
                          required 
                          value={eventForm.deposit_amount} 
                          onChange={e => setEventForm({ ...eventForm, deposit_amount: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Status *</label>
                      <select 
                        required 
                        value={eventForm.status} 
                        onChange={e => setEventForm({ ...eventForm, status: e.target.value as any })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="Inquiry">Inquiry</option>
                        <option value="Proposal Generated">Proposal Generated</option>
                        <option value="Contract Sent">Contract Sent</option>
                        <option value="Deposit Paid">Deposit Paid</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <ImageUploader 
                      label="Event Banner Image" 
                      value={eventForm.artist_image} 
                      onChange={base64 => setEventForm({ ...eventForm, artist_image: base64 })} 
                    />
                  </>
                )}

                {/* ── VENUE FORM FIELDS ── */}
                {panelType === 'venue' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Venue Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={venueForm.name} 
                        onChange={e => setVenueForm({ ...venueForm, name: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Capacity *</label>
                      <input 
                        type="text" 
                        required 
                        value={venueForm.capacity} 
                        onChange={e => setVenueForm({ ...venueForm, capacity: e.target.value })}
                        placeholder="e.g. 15,000 seats"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Location / City *</label>
                      <input 
                        type="text" 
                        required 
                        value={venueForm.location} 
                        onChange={e => setVenueForm({ ...venueForm, location: e.target.value })}
                        placeholder="e.g. Kingston, Jamaica"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Parking Details</label>
                      <input 
                        type="text" 
                        value={venueForm.parking} 
                        onChange={e => setVenueForm({ ...venueForm, parking: e.target.value })}
                        placeholder="e.g. 2,000 cars"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Description</label>
                      <textarea 
                        rows={3} 
                        value={venueForm.description} 
                        onChange={e => setVenueForm({ ...venueForm, description: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                  </>
                )}

                {/* ── ARTIST FORM FIELDS ── */}
                {panelType === 'artist' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Stage Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={artistForm.stage_name} 
                        onChange={e => setArtistForm({ ...artistForm, stage_name: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Legal Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={artistForm.legal_name} 
                        onChange={e => setArtistForm({ ...artistForm, legal_name: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Category *</label>
                        <select 
                          required 
                          value={artistForm.category}
                          onChange={e => setArtistForm({ ...artistForm, category: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Reggae Artists">Reggae</option>
                          <option value="Dancehall Artists">Dancehall</option>
                          <option value="DJs">DJs &amp; Selectors</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Genre *</label>
                        <input 
                          type="text" 
                          required 
                          value={artistForm.genre} 
                          onChange={e => setArtistForm({ ...artistForm, genre: e.target.value })}
                          placeholder="e.g. Roots Reggae"
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Bio *</label>
                      <textarea 
                        rows={3} 
                        required 
                        value={artistForm.bio} 
                        onChange={e => setArtistForm({ ...artistForm, bio: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Booking Status *</label>
                        <select 
                          required 
                          value={artistForm.booking_status}
                          onChange={e => setArtistForm({ ...artistForm, booking_status: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Available">Available</option>
                          <option value="Booked">Booked</option>
                          <option value="On Tour">On Tour</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Availability *</label>
                        <select 
                          required 
                          value={artistForm.availability_status}
                          onChange={e => setArtistForm({ ...artistForm, availability_status: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Technical Rider Details</label>
                      <textarea 
                        rows={2} 
                        value={artistForm.technical_rider} 
                        onChange={e => setArtistForm({ ...artistForm, technical_rider: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Hospitality Rider Details</label>
                      <textarea 
                        rows={2} 
                        value={artistForm.hospitality_rider} 
                        onChange={e => setArtistForm({ ...artistForm, hospitality_rider: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ImageUploader 
                        label="Profile Image" 
                        value={artistForm.profile_image} 
                        onChange={base64 => setArtistForm({ ...artistForm, profile_image: base64 })} 
                      />
                      <ImageUploader 
                        label="Cover Image" 
                        value={artistForm.cover_image} 
                        onChange={base64 => setArtistForm({ ...artistForm, cover_image: base64 })} 
                      />
                    </div>
                  </>
                )}

                {/* ── CUSTOMER FORM FIELDS ── */}
                {panelType === 'customer' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Customer Contact Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={customerForm.name} 
                        onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Company Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={customerForm.company} 
                        onChange={e => setCustomerForm({ ...customerForm, company: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={customerForm.email} 
                        onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-mono" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">VIP Group / Tier *</label>
                      <input 
                        type="text" 
                        required 
                        value={customerForm.tier} 
                        onChange={e => setCustomerForm({ ...customerForm, tier: e.target.value })}
                        placeholder="e.g. VIP Organizer"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">CRM / Booking Log Notes</label>
                      <textarea 
                        rows={4} 
                        value={customerForm.notes} 
                        onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                  </>
                )}

                {/* ── STAFF FORM FIELDS ── */}
                {panelType === 'staff' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">First Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={staffForm.first_name} 
                          onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Last Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={staffForm.last_name} 
                          onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={staffForm.email} 
                        onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-mono" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Assigned Role *</label>
                        <select 
                          required 
                          value={staffForm.role}
                          onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Owner">Owner</option>
                          <option value="Finance Manager">Finance Manager</option>
                          <option value="Marketing Manager">Marketing Manager</option>
                          <option value="Content Manager">Content Manager</option>
                          <option value="Support Agent">Support Agent</option>
                          <option value="Promoter">Promoter</option>
                          <option value="Venue Manager">Venue Manager</option>
                          <option value="Booking Agent">Booking Agent</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Status *</label>
                        <select 
                          required 
                          value={staffForm.status}
                          onChange={e => setStaffForm({ ...staffForm, status: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ── TICKET FORM FIELDS ── */}
                {panelType === 'ticket' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Tier Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={ticketForm.name} 
                        onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })}
                        placeholder="e.g. General Admission"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Price (USD) *</label>
                        <input 
                          type="number" 
                          required 
                          value={ticketForm.price} 
                          onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Capacity *</label>
                        <input 
                          type="number" 
                          required 
                          value={ticketForm.capacity} 
                          onChange={e => setTicketForm({ ...ticketForm, capacity: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Description *</label>
                      <textarea 
                        rows={3} 
                        required 
                        value={ticketForm.desc} 
                        onChange={e => setTicketForm({ ...ticketForm, desc: e.target.value })}
                        placeholder="Standard gate access..."
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                  </>
                )}

                {/* ── PROMO CODE FORM FIELDS ── */}
                {panelType === 'promo' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Promo Code Title *</label>
                      <input 
                        type="text" 
                        required 
                        value={promoForm.code} 
                        onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. SUMFEST2026"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-mono uppercase" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Discount Value (%) *</label>
                        <input 
                          type="number" 
                          required 
                          value={promoForm.discount} 
                          onChange={e => setPromoForm({ ...promoForm, discount: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Expiry Date *</label>
                        <input 
                          type="date" 
                          required 
                          value={promoForm.expiry} 
                          onChange={e => setPromoForm({ ...promoForm, expiry: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Active Status</label>
                      <select 
                        value={promoForm.active ? 'true' : 'false'} 
                        onChange={e => setPromoForm({ ...promoForm, active: e.target.value === 'true' })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── ORDER/INVOICE FORM FIELDS ── */}
                {panelType === 'order' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Select Event/Booking Link *</label>
                      <select 
                        required 
                        value={orderForm.booking_id} 
                        onChange={e => setOrderForm({ ...orderForm, booking_id: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="">-- Choose Booking --</option>
                        {bookings.map(b => <option key={b.id} value={b.id}>{b.event_title} ({b.client_name})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Total Amount (USD) *</label>
                        <input 
                          type="number" 
                          required 
                          value={orderForm.amount} 
                          onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Due Date *</label>
                        <input 
                          type="date" 
                          required 
                          value={orderForm.due_date} 
                          onChange={e => setOrderForm({ ...orderForm, due_date: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Invoice Status *</label>
                      <select 
                        value={orderForm.status} 
                        onChange={e => setOrderForm({ ...orderForm, status: e.target.value as any })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── CAMPAIGN FORM FIELDS ── */}
                {panelType === 'campaign' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Campaign Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={campaignForm.name} 
                        onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        placeholder="e.g. Koffee Sumfest Promotion"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Broadcast Channel *</label>
                        <select 
                          value={campaignForm.type} 
                          onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Email">Email</option>
                          <option value="SMS">SMS</option>
                          <option value="Push">Push Announcement</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Audience Segment *</label>
                        <input 
                          type="text" 
                          required 
                          value={campaignForm.segment} 
                          onChange={e => setCampaignForm({ ...campaignForm, segment: e.target.value })}
                          placeholder="e.g. VIP Ticket Buyers Only"
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    </div>
                    {campaignForm.type === 'Email' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Email Subject Line *</label>
                        <input 
                          type="text" 
                          required={campaignForm.type === 'Email'}
                          value={campaignForm.subject} 
                          onChange={e => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                          placeholder="Announcing new acts!"
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Broadcast Message Body *</label>
                      <textarea 
                        rows={5} 
                        required 
                        value={campaignForm.content} 
                        onChange={e => setCampaignForm({ ...campaignForm, content: e.target.value })}
                        placeholder="Draft the message content..."
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                  </>
                )}

                {/* ── AD PLACEMENT FORM FIELDS ── */}
                {panelType === 'ad' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Placement Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={adForm.name} 
                        onChange={e => setAdForm({ ...adForm, name: e.target.value })}
                        placeholder="e.g. Homepage Hero Placement"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Active Status</label>
                      <select 
                        value={adForm.active ? 'true' : 'false'} 
                        onChange={e => setAdForm({ ...adForm, active: e.target.value === 'true' })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                      >
                        <option value="true">Active Placement</option>
                        <option value="false">Paused / Inactive</option>
                      </select>
                    </div>
                    <ImageUploader 
                      label="Placement Banner Media" 
                      value={adForm.image_url} 
                      onChange={base64 => setAdForm({ ...adForm, image_url: base64 })} 
                    />
                  </>
                )}

                {/* ── WEBSITE SECTION FORM FIELDS ── */}
                {panelType === 'section' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Section Type *</label>
                        <select 
                          value={sectionForm.type} 
                          onChange={e => setSectionForm({ ...sectionForm, type: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="hero">Hero Header</option>
                          <option value="announcement">Announcement Bar</option>
                          <option value="features">Features Spotlight</option>
                          <option value="cta">Call to Action</option>
                          <option value="footer">Footer Info</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Active Status</label>
                        <select 
                          value={sectionForm.active ? 'true' : 'false'} 
                          onChange={e => setSectionForm({ ...sectionForm, active: e.target.value === 'true' })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="true">Visible</option>
                          <option value="false">Hidden / Draft</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Section Title *</label>
                      <input 
                        type="text" 
                        required 
                        value={sectionForm.title} 
                        onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                        placeholder="Enter section title..."
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Subtitle</label>
                      <input 
                        type="text" 
                        value={sectionForm.subtitle} 
                        onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                        placeholder="Enter subtitle..."
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Content Body / Description</label>
                      <textarea 
                        rows={3} 
                        value={sectionForm.content} 
                        onChange={e => setSectionForm({ ...sectionForm, content: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    {['hero', 'cta'].includes(sectionForm.type) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Action Button Text</label>
                        <input 
                          type="text" 
                          value={sectionForm.buttonText} 
                          onChange={e => setSectionForm({ ...sectionForm, buttonText: e.target.value })}
                          placeholder="e.g. Learn More"
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                        />
                      </div>
                    )}
                    {['hero', 'cta', 'features'].includes(sectionForm.type) && (
                      <ImageUploader 
                        label="Section Background / Card Graphic" 
                        value={sectionForm.image_url} 
                        onChange={base64 => setSectionForm({ ...sectionForm, image_url: base64 })} 
                      />
                    )}
                  </>
                )}

                {/* ── INTEGRATION FORM FIELDS ── */}
                {panelType === 'integration' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">Integration Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={integrationForm.name} 
                        onChange={e => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                        placeholder="e.g. Stripe Payment Gateway"
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Provider *</label>
                        <select 
                          value={integrationForm.provider} 
                          onChange={e => setIntegrationForm({ ...integrationForm, provider: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Stripe">Stripe</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Twilio">Twilio</option>
                          <option value="SendGrid">SendGrid</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/50 font-semibold">Connection Status</label>
                        <select 
                          value={integrationForm.status} 
                          onChange={e => setIntegrationForm({ ...integrationForm, status: e.target.value as any })}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-semibold"
                        >
                          <option value="Connected">Connected</option>
                          <option value="Disconnected">Disconnected</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-white/50 font-semibold">API Private Key / SID *</label>
                      <input 
                        type="text" 
                        required 
                        value={integrationForm.api_key} 
                        onChange={e => setIntegrationForm({ ...integrationForm, api_key: e.target.value })}
                        placeholder="e.g. sk_live_..."
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-mono" 
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 border-t border-white/10 pt-4">
                <button 
                  type="button" 
                  onClick={() => setPanelOpen(false)}
                  className="btn flex-1 bg-[#16122c] border border-white/10 py-3 rounded-full text-xs font-semibold transition text-center hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn flex-1 bg-[#d4af37] text-[#07050e] hover:scale-105 py-3 rounded-full text-xs font-extrabold transition text-center"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
