import { createClient } from '@supabase/supabase-js';

// Types corresponding to the PostgreSQL tables
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  role: string;
  created_at: string;
}

export interface Artist {
  id: string;
  stage_name: string;
  legal_name: string;
  category: string;
  genre: string;
  bio: string;
  profile_image: string;
  cover_image: string;
  booking_status: 'Available' | 'Booked' | 'On Tour' | 'On Hold';
  availability_status: 'Active' | 'Inactive';
  manager_id?: string;
  socials?: Record<string, { url: string; followers: number }>;
  media?: { type: 'Image' | 'Video' | 'Audio'; url: string }[];
  technical_rider?: string;
  hospitality_rider?: string;
}

export interface Lead {
  id: string;
  client_id?: string;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  country: string;
  source: string;
  status: 'Lead Received' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Contract Sent' | 'Deposit Received' | 'Confirmed' | 'Completed';
  assigned_to?: string;
  details: string;
  budget: number;
  preferred_date: string;
  artist_id?: string;
  artist_name?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_image: string;
  client_id: string;
  client_name: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_venue: string;
  event_country: string;
  status: 'Inquiry' | 'Proposal Generated' | 'Contract Sent' | 'Deposit Paid' | 'Confirmed' | 'Completed' | 'Cancelled';
  deposit_amount: number;
  total_amount: number;
  contract_id?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  document_url?: string;
  status: 'Draft' | 'Sent' | 'Signed' | 'Void';
  signed_at?: string;
  signature_data?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  booking_id: string;
  amount: number;
  balance_due: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  due_date: string;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'Stripe' | 'Wise' | 'Bank Transfer' | 'Credit Card';
  transaction_reference?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  capacity: string;
  location: string;
  description?: string;
  parking?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  tier: string;
  notes: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  desc: string;
  capacity: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  expiry: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'Email' | 'SMS' | 'Push';
  subject: string;
  segment: string;
  content: string;
  openRate: string;
  created_at: string;
}

export interface AdPlacement {
  id: string;
  name: string;
  impressions: number;
  clickRate: string;
  revenue: number;
  active: boolean;
  image_url?: string;
}

export interface WebsiteSection {
  id: string;
  type: 'hero' | 'announcement' | 'features' | 'cta' | 'footer';
  title: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  image_url?: string;
  active: boolean;
}

export interface Integration {
  id: string;
  name: string;
  provider: 'Stripe' | 'PayPal' | 'Twilio' | 'SendGrid';
  status: 'Connected' | 'Disconnected';
  api_key: string;
}



// ---------------------------------------------------------
// Seed Data definition
// ---------------------------------------------------------
const SEED_USERS: User[] = [
  { id: 'usr-admin-1', first_name: 'Damian', last_name: 'Marley', email: 'damian.admin@showtime.com', phone: '+1-876-555-0100', status: 'Active', role: 'Super Admin', created_at: new Date().toISOString() },
  { id: 'usr-agent-1', first_name: 'Sarah', last_name: 'Silverman', email: 'sarah.agent@showtime.com', phone: '+1-212-555-0155', status: 'Active', role: 'Booking Agent', created_at: new Date().toISOString() },
  { id: 'usr-manager-1', first_name: 'Robert', last_name: 'Livingston', email: 'robert.manager@showtime.com', phone: '+1-876-555-0199', status: 'Active', role: 'Artist Manager', created_at: new Date().toISOString() },
  { id: 'usr-beres', first_name: 'Beres', last_name: 'Hammond', email: 'beres.artist@showtime.com', phone: '+1-876-555-0211', status: 'Active', role: 'Artist', created_at: new Date().toISOString() },
  { id: 'usr-koffee', first_name: 'Koffee', last_name: 'Simpson', email: 'koffee.artist@showtime.com', phone: '+1-876-555-0222', status: 'Active', role: 'Artist', created_at: new Date().toISOString() },
  { id: 'usr-client-1', first_name: 'Michael', last_name: 'Eavis', email: 'eavis.client@glastonbury.co.uk', phone: '+44-20-7946-0192', status: 'Active', role: 'Client', created_at: new Date().toISOString() }
];

const SEED_ARTISTS: Artist[] = [
  {
    id: 'art-beres-hammond',
    stage_name: 'Beres Hammond',
    legal_name: 'Hugh Beresford Hammond',
    category: 'Reggae Artists',
    genre: 'Lovers Rock / Reggae',
    bio: 'Beres Hammond is a legendary Jamaican reggae singer known for his soulful lovers rock signature. With a career spanning over four decades, Hammond is widely regarded as the definitive voice of reggae romance, releasing timeless classics such as "Rockaway", "I Feel Good", and "Groovy Little Thing".',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    manager_id: 'usr-manager-1',
    socials: {
      Instagram: { url: 'https://instagram.com/bereshammond', followers: 450000 },
      Spotify: { url: 'https://spotify.com/artist/bereshammond', followers: 2300000 }
    },
    media: [
      { type: 'Image', url: '/images/artist_reggae.jpg' }
    ],
    technical_rider: 'Technical: 1 Premium Vocal Mic (Neumann KMS 105), Grand Piano tuned to A440, full rhythm section backline setup, 6 in-ear monitor transmitters (Sennheiser G4).',
    hospitality_rider: 'Hospitality: Assorted red wines (Cabernet Sauvignon), hot water kettle, throat lozenges, selection of raw nuts, 100% vegetarian hot catering post-soundcheck, quiet dressing room.'
  },
  {
    id: 'art-chronixx',
    stage_name: 'Chronixx',
    legal_name: 'Jamar Rolando McNaughton',
    category: 'Reggae Artists',
    genre: 'Roots Reggae / Revival',
    bio: 'Chronixx is an iconic spearhead of the modern Reggae Revival movement. Blending roots reggae message with contemporary production, his critically acclaimed projects like "Chronology" have earned him global nominations and massive audiences at Coachella, Glastonbury, and beyond.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    manager_id: 'usr-manager-1',
    socials: {
      Instagram: { url: 'https://instagram.com/chronixxmusic', followers: 1000000 },
      Spotify: { url: 'https://spotify.com/artist/chronixx', followers: 4200000 }
    },
    media: [
      { type: 'Image', url: '/images/artist_reggae.jpg' }
    ],
    technical_rider: 'Technical: 3 Cordless Vocal Mics (Shure UR4D), 2 Guitar Amps (Fender Twin Reverb), 1 Bass Amp (Ampeg SVT-CL), professional monitor engineer.',
    hospitality_rider: 'Hospitality: Freshly squeezed fruit juices, selection of herbal teas, hot ginger infusion, organic snacks, organic vegan buffet for 12 touring crew members.'
  },
  {
    id: 'art-koffee',
    stage_name: 'Koffee',
    legal_name: 'Mikayla Simpson',
    category: 'Reggae Artists',
    genre: 'Reggae / Dancehall',
    bio: 'Koffee is the historic youngest and only female artist to win the Grammy Award for Best Reggae Album for her breakout EP "Rapture". Combining lightning-fast singjay flows with positive messages, she represents the vibrant new wave of Caribbean global exports.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    manager_id: 'usr-koffee',
    socials: {
      Instagram: { url: 'https://instagram.com/originalkoffee', followers: 1200000 },
      Spotify: { url: 'https://spotify.com/artist/originalkoffee', followers: 3500000 }
    },
    media: [
      { type: 'Image', url: '/images/artist_dancehall.jpg' },
      { type: 'Video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ],
    technical_rider: 'Technical: 3 Vocal Cordless Mics (Shure SM58), Stereo DIs for Keyboards and DJ controller, 4 Monitor wedges (L-Acoustics), standard drum kit mic package.',
    hospitality_rider: 'Hospitality: Fresh ginger root, organic local honey, hot water kettle, assorted herbal teas, sliced seasonal fruit platters, 12 bottles of room-temperature spring water, 6 clean hand towels.'
  },
  {
    id: 'art-shenseea',
    stage_name: 'Shenseea',
    legal_name: 'Chinsea Linda Lee',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Pop',
    bio: 'Shenseea is a powerhouse Jamaican dancehall artist and international pop crossover sensation. Rising to prominence with hits like "Loodi", she has collaborated with Kanye West, Megan Thee Stallion, and Calvin Harris, leading dancehall into global pop spaces.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    manager_id: 'usr-manager-1',
    socials: {
      Instagram: { url: 'https://instagram.com/shenseea', followers: 6200000 },
      TikTok: { url: 'https://tiktok.com/@shenseea', followers: 4500000 }
    },
    media: [
      { type: 'Image', url: '/images/artist_dancehall.jpg' }
    ],
    technical_rider: 'Technical: 2 Shure Axient Digital vocal microphones, playback DI stereo channels, 4 IEM channels, premium sidefills, high-grade haze/smoke machine integration.',
    hospitality_rider: 'Hospitality: Premium Champagne (Veuve Clicquot), Hennessy, clean lemons, hot water kettle, private bathroom in dressing room, 2 full-length mirrors, professional makeup vanity lighting.'
  },
  {
    id: 'art-rodigan',
    stage_name: 'David Rodigan',
    legal_name: 'David Michael Rodigan',
    category: 'DJs',
    genre: 'Reggae DJ / Selector',
    bio: 'David Rodigan MBE is a legendary British radio DJ and sound clash champion. Known for his encyclopedic knowledge of Jamaican music and electric stage presence, "Ram Jam" Rodigan is the ultimate ambassador of sound system culture worldwide.',
    profile_image: '/images/artist_dj.jpg',
    cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    manager_id: 'usr-admin-1',
    socials: {
      Instagram: { url: 'https://instagram.com/davidrodigan', followers: 280000 },
      Spotify: { url: 'https://spotify.com/artist/davidrodigan', followers: 150000 }
    },
    media: [
      { type: 'Image', url: '/images/artist_dj.jpg' }
    ],
    technical_rider: 'Technical: 2 Pioneer CDJ-3000, 1 Pioneer DJM-A9 mixer, 1 wired Shure SM58 microphone, 2 booth monitor wedges adjustable at the booth.',
    hospitality_rider: 'Hospitality: Assorted beers (Red Stripe), sparkling water, Earl Grey tea bags, fresh milk, 2 clean towels, small plate of sandwiches (vegetarian options included).'
  }
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead-reggae-sumfest',
    client_id: 'cli-sumfest',
    company_name: 'Sumfest Productions',
    contact_name: 'Joe Bogdanovich',
    email: 'joe@reggaesumfest.com',
    phone: '+1-876-555-0301',
    country: 'Jamaica',
    source: 'Website Booking Form',
    status: 'Lead Received',
    assigned_to: 'usr-agent-1',
    details: 'Requesting Koffee to perform as headliner for Reggae Sumfest Night 2 in Montego Bay. High-priority inquiry.',
    budget: 75000,
    preferred_date: '2026-07-18',
    artist_id: 'art-koffee',
    artist_name: 'Koffee',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lead-coachella',
    client_id: 'cli-goldenvoice',
    company_name: 'Goldenvoice Events',
    contact_name: 'Paul Tollett',
    email: 'paul@coachella.com',
    phone: '+1-310-555-0922',
    country: 'United States',
    source: 'Direct Agent Outbound',
    status: 'Negotiation',
    assigned_to: 'usr-agent-1',
    details: 'Coachella Outdoor Stage performance request for Chronixx. In negotiation regarding slots and backline requirements.',
    budget: 120000,
    preferred_date: '2026-04-18',
    artist_id: 'art-chronixx',
    artist_name: 'Chronixx',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bk-coachella-chronixx',
    artist_id: 'art-chronixx',
    artist_name: 'Chronixx',
    artist_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600',
    client_id: 'cli-goldenvoice',
    client_name: 'Goldenvoice Events (Paul Tollett)',
    event_id: 'evt-coachella-2026',
    event_title: 'Coachella Valley Music Festival 2026',
    event_date: '2026-04-18',
    event_venue: 'Empire Polo Club',
    event_country: 'United States',
    status: 'Contract Sent',
    deposit_amount: 60000,
    total_amount: 120000,
    contract_id: 'ctr-coachella-chronixx',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_CONTRACTS: Contract[] = [
  {
    id: 'ctr-coachella-chronixx',
    booking_id: 'bk-coachella-chronixx',
    status: 'Sent',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-coachella-deposit',
    booking_id: 'bk-coachella-chronixx',
    amount: 60000,
    balance_due: 60000,
    status: 'Unpaid',
    due_date: '2026-06-30',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_TASKS: Task[] = [
  { id: 'tsk-1', title: 'Verify Chronixx passport renewal status', description: 'Check with manager Robert regarding international travel documents.', assigned_to: 'usr-agent-1', due_date: '2026-06-15', status: 'Pending', created_at: new Date().toISOString() },
  { id: 'tsk-2', title: 'Send invoice reminders for Sumfest', description: 'Remind Sumfest productions about deposit requirements.', assigned_to: 'usr-agent-1', due_date: '2026-06-08', status: 'In Progress', created_at: new Date().toISOString() },
  { id: 'tsk-3', title: 'Upload rider updates for Shenseea', description: 'Upload updated rider with Veuve Clicquot champagne specification.', assigned_to: 'usr-manager-1', due_date: '2026-06-12', status: 'Completed', created_at: new Date().toISOString() }
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', user_id: 'usr-agent-1', title: 'New Booking Inquiry', message: 'Joe Bogdanovich submitted an inquiry for Koffee at Reggae Sumfest.', read_status: false, created_at: new Date().toISOString() },
  { id: 'notif-2', user_id: 'usr-agent-1', title: 'Negotiation Updates', message: 'Coachella contract drafts were generated and sent for Chronixx.', read_status: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
];

const SEED_VENUES: Venue[] = [
  { id: 'ven-1', name: 'Catherine Hall Stadium', capacity: '35,000 seats', location: 'Montego Bay', description: 'Historic home of Reggae Sumfest, seaside breeze and premium festival staging.', parking: '10,000 cars' },
  { id: 'ven-2', name: 'National Arena Staging', capacity: '12,500 seats', location: 'Kingston', description: 'Indoor stadium, perfect for high energy dancehall clashes and sound clashes.', parking: '3,000 cars' },
  { id: 'ven-3', name: 'O2 Arena London', capacity: '20,000 seats', location: 'United Kingdom', description: 'World famous indoor arena, perfect for massive crossover staging.', parking: '5,000 cars' }
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Joe Bogdanovich', company: 'Sumfest Productions', email: 'joe@reggaesumfest.com', tier: 'VIP Organizer', notes: 'Prefers booking reggae headliners. Fast deposit execution.' },
  { id: 'cust-2', name: 'Paul Tollett', company: 'Goldenvoice Coachella', email: 'paul@coachella.com', tier: 'Ultra VIP Promoter', notes: 'Standard US promoter client. Always requires international travel logistics check.' },
  { id: 'cust-3', name: 'Michael Eavis', company: 'Glastonbury Festivals', email: 'eavis.client@glastonbury.co.uk', tier: 'Global Partner', notes: 'Requires full compliance check for UK COS certificates.' }
];

const SEED_TICKET_TIERS: TicketTier[] = [
  { id: 'tier-ga', name: 'General Admission', price: 85, desc: 'Standard field gate access', capacity: 5000 },
  { id: 'tier-vip', name: 'VIP Deck Pass', price: 250, desc: 'Raised platform, private bar', capacity: 1000 },
  { id: 'tier-vvip', name: 'VVIP Backstage', price: 850, desc: 'Meet & greet, backline hospitality', capacity: 250 },
  { id: 'tier-ultra', name: 'Ultra VVIP Table package', price: 3500, desc: 'Dressed cabana table for 8', capacity: 50 }
];

const SEED_PROMO_CODES: PromoCode[] = [
  { id: 'promo-sumfest', code: 'SUMFEST2026', discount: 20, active: true, expiry: '2026-07-01' },
  { id: 'promo-early', code: 'EARLYBIRD10', discount: 10, active: true, expiry: '2026-06-30' },
  { id: 'promo-vip', code: 'VIPSHOWTIME', discount: 15, active: false, expiry: '2026-08-15' }
];

const SEED_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'camp-1', name: 'Koffee Sumfest Promotion', type: 'Email', subject: 'Koffee Live at Sumfest 2026!', segment: 'All Past Customers (12,504)', content: 'Get ready for Koffee live at Catherine Hall...', openRate: '34.2%', created_at: new Date().toISOString() },
  { id: 'camp-2', name: 'Shenseea Ticket Release Alert', type: 'SMS', subject: '', segment: 'VIP Ticket Buyers Only (2,100)', content: 'Shenseea Tickets are Live! Buy now: https://showtimeservices.com/tickets', openRate: '98%', created_at: new Date().toISOString() },
  { id: 'camp-3', name: 'Coachella Lineup Push Alert', type: 'Push', subject: 'Coachella Lineup Announced', segment: 'All Past Customers (12,504)', content: 'Check out the Coachella lineup including Chronixx!', openRate: '15.4%', created_at: new Date().toISOString() }
];

const SEED_AD_PLACEMENTS: AdPlacement[] = [
  { id: 'ad-1', name: 'Homepage Hero Placement', impressions: 142500, clickRate: '2.4% CTR', revenue: 3420, active: true, image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' },
  { id: 'ad-2', name: 'Search Results Banner', impressions: 84300, clickRate: '1.8% CTR', revenue: 1510, active: true, image_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=400' },
  { id: 'ad-3', name: 'Email Footer Banner', impressions: 24000, clickRate: '4.2% CTR', revenue: 1008, active: true, image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400' }
];

const SEED_WEBSITE_SECTIONS: WebsiteSection[] = [
  { id: 'sec-hero', type: 'hero', title: 'Caribbean Talent Booking Platform', subtitle: 'Book the absolute best Reggae, Dancehall, and Afrobeat acts globally.', content: 'Visual component block preview area.', buttonText: 'Book Artist Now', active: true, image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600' },
  { id: 'sec-ann', type: 'announcement', title: '★ Reggae Sumfest 2026 Headliners Confirmed!', content: 'Get your early bird tickets before they sell out.', active: true },
  { id: 'sec-cta', type: 'cta', title: 'Plan Your Next Tour With Showtime', subtitle: 'From permits to event production, we handle everything you need.', buttonText: 'Get Started', active: true, image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600' }
];

const SEED_INTEGRATIONS: Integration[] = [
  { id: 'int-stripe', name: 'Stripe Payment Gateway', provider: 'Stripe', status: 'Connected', api_key: 'pk_live_51M...' },
  { id: 'int-twilio', name: 'Twilio SMS Business API', provider: 'Twilio', status: 'Connected', api_key: 'AC...' },
  { id: 'int-paypal', name: 'PayPal Commerce Platform', provider: 'PayPal', status: 'Connected', api_key: 'client_id_...' },
  { id: 'int-sendgrid', name: 'SendGrid Email API Service', provider: 'SendGrid', status: 'Connected', api_key: 'SG...' }
];



// Initialize local DB state helper
const getStoreValue = <T>(key: string, seed: T[]): T[] => {
  if (typeof window === 'undefined') return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
};

const setStoreValue = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// ---------------------------------------------------------
// Supabase Client Initialization (if credentials exist)
// ---------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ---------------------------------------------------------
// DATABASE CRUD API LAYER
// ---------------------------------------------------------
export const db = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) return data as User[];
    }
    return getStoreValue('st_users', SEED_USERS);
  },

  async createUser(usr: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const users = await this.getUsers();
    const newUsr: User = {
      ...usr,
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    users.push(newUsr);
    setStoreValue('st_users', users);
    return newUsr;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      setStoreValue('st_users', users);
      return users[idx];
    }
    throw new Error('User not found');
  },

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    setStoreValue('st_users', filtered);
    return true;
  },

  // --- ARTISTS ---
  async getArtists(): Promise<Artist[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('artists').select('*');
      if (!error && data) return data as Artist[];
    }
    return getStoreValue('st_artists_v2', SEED_ARTISTS);
  },

  async getArtistById(id: string): Promise<Artist | null> {
    const artists = await this.getArtists();
    return artists.find(a => a.id === id) || null;
  },

  async updateArtistProfile(id: string, updates: Partial<Artist>): Promise<Artist> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('artists').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Artist;
    }
    const artists = await this.getArtists();
    const idx = artists.findIndex(a => a.id === id);
    if (idx !== -1) {
      artists[idx] = { ...artists[idx], ...updates };
      setStoreValue('st_artists_v2', artists);
      return artists[idx];
    }
    throw new Error('Artist not found');
  },

  // --- CRM LEADS ---
  async getLeads(): Promise<Lead[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Lead[];
    }
    return getStoreValue('st_leads', SEED_LEADS);
  },

  async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'status' | 'source'>): Promise<Lead> {
    const artists = await this.getArtists();
    const artist = artists.find(a => a.id === leadData.artist_id);
    
    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Math.random().toString(36).substr(2, 9),
      source: 'Website Booking Form',
      status: 'Lead Received',
      artist_name: artist ? artist.stage_name : undefined,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').insert(newLead).select().single();
      if (!error && data) return data as Lead;
    }

    const leads = await this.getLeads();
    leads.unshift(newLead);
    setStoreValue('st_leads', leads);

    // Auto create system notification for agent
    await this.createNotification('usr-agent-1', 'New Inquiry Received', `New inquiry from ${leadData.contact_name} for ${artist?.stage_name || 'Talent'}.`);

    return newLead;
  },

  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (!error && data) return data as Lead;
    }
    const leads = await this.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], status };
      setStoreValue('st_leads', leads);

      // Trigger automatic workflows based on pipeline progress
      if (status === 'Proposal Sent') {
        // Trigger proposal generated booking
        await this.promoteLeadToBooking(leads[idx], 'Proposal Generated');
      } else if (status === 'Contract Sent') {
        // Trigger contract dispatch
        const bookings = await this.getBookings();
        const bk = bookings.find(b => b.artist_id === leads[idx].artist_id && b.client_id === leads[idx].client_id);
        if (bk) {
          await this.updateBookingStatus(bk.id, 'Contract Sent');
        }
      }

      return leads[idx];
    }
    throw new Error('Lead not found');
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Lead;
    }
    const leads = await this.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...updates };
      setStoreValue('st_leads', leads);
      return leads[idx];
    }
    throw new Error('Lead not found');
  },

  async deleteLead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) return true;
    }
    const leads = await this.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    setStoreValue('st_leads', filtered);
    return true;
  },

  async promoteLeadToBooking(lead: Lead, initialStatus: Booking['status']): Promise<Booking> {
    const bookings = await this.getBookings();
    
    // Check if booking already exists
    const existing = bookings.find(b => b.artist_id === lead.artist_id && b.client_id === lead.client_id);
    if (existing) return existing;

    const artists = await this.getArtists();
    const artist = artists.find(a => a.id === lead.artist_id);

    const newBooking: Booking = {
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      artist_id: lead.artist_id || '',
      artist_name: lead.artist_name || '',
      artist_image: artist ? artist.profile_image : '',
      client_id: lead.client_id || 'cli-generic',
      client_name: lead.company_name ? `${lead.company_name} (${lead.contact_name})` : lead.contact_name,
      event_id: 'evt-' + Math.random().toString(36).substr(2, 9),
      event_title: `Performance by ${lead.artist_name}`,
      event_date: lead.preferred_date,
      event_venue: 'To Be Decided',
      event_country: lead.country,
      status: initialStatus,
      deposit_amount: Math.round(lead.budget * 0.5),
      total_amount: lead.budget,
      created_at: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    setStoreValue('st_bookings', bookings);

    // Auto generate draft contract and draft invoice
    const newContract: Contract = {
      id: 'ctr-' + Math.random().toString(36).substr(2, 9),
      booking_id: newBooking.id,
      status: 'Draft',
      created_at: new Date().toISOString()
    };
    const contracts = getStoreValue('st_contracts', SEED_CONTRACTS);
    contracts.unshift(newContract);
    setStoreValue('st_contracts', contracts);

    const newInvoice: Invoice = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      booking_id: newBooking.id,
      amount: newBooking.deposit_amount,
      balance_due: newBooking.deposit_amount,
      status: 'Unpaid',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    const invoices = getStoreValue('st_invoices', SEED_INVOICES);
    invoices.unshift(newInvoice);
    setStoreValue('st_invoices', invoices);

    // Link back contract id
    newBooking.contract_id = newContract.id;
    setStoreValue('st_bookings', bookings);

    return newBooking;
  },

  // --- BOOKINGS ---
  async getBookings(): Promise<Booking[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookings').select('*');
      if (!error && data) return data as Booking[];
    }
    return getStoreValue('st_bookings', SEED_BOOKINGS);
  },

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const bookings = await this.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = status;
      setStoreValue('st_bookings', bookings);

      // Sync status changes to contracts & invoices
      if (status === 'Contract Sent') {
        const contracts = await this.getContracts();
        const ctr = contracts.find(c => c.booking_id === id);
        if (ctr) {
          ctr.status = 'Sent';
          setStoreValue('st_contracts', contracts);
        }
      } else if (status === 'Deposit Paid') {
        const invoices = await this.getInvoices();
        const inv = invoices.find(i => i.booking_id === id && i.status !== 'Paid');
        if (inv) {
          inv.status = 'Paid';
          inv.balance_due = 0;
          setStoreValue('st_invoices', invoices);
        }
        
        // Elevate booking to confirmed
        bookings[idx].status = 'Confirmed';
        setStoreValue('st_bookings', bookings);

        // Block calendar for artist
        await this.blockArtistDate(bookings[idx].artist_id, bookings[idx].event_date);
        
        // Notify artist and manager
        await this.createNotification('usr-manager-1', 'Gig Confirmed!', `Booking for ${bookings[idx].artist_name} on ${bookings[idx].event_date} is now confirmed.`);
      }

      return bookings[idx];
    }
    throw new Error('Booking not found');
  },

  // --- CONTRACTS ---
  async getContracts(): Promise<Contract[]> {
    return getStoreValue('st_contracts', SEED_CONTRACTS);
  },

  async signContract(id: string, signature: string): Promise<Contract> {
    const contracts = await this.getContracts();
    const idx = contracts.findIndex(c => c.id === id);
    if (idx !== -1) {
      contracts[idx].status = 'Signed';
      contracts[idx].signed_at = new Date().toISOString();
      contracts[idx].signature_data = signature;
      setStoreValue('st_contracts', contracts);

      // Auto update booking status to Deposit Paid trigger
      const bookings = await this.getBookings();
      const bk = bookings.find(b => b.id === contracts[idx].booking_id);
      if (bk) {
        // If client signed contract, client will proceed to pay deposit next. For simulator we can set to Deposit Paid once signed & paid.
        await this.updateBookingStatus(bk.id, 'Deposit Paid');
      }

      return contracts[idx];
    }
    throw new Error('Contract not found');
  },

  // --- INVOICES ---
  async getInvoices(): Promise<Invoice[]> {
    return getStoreValue('st_invoices', SEED_INVOICES);
  },

  // --- PAYMENTS ---
  async getPayments(): Promise<Payment[]> {
    return getStoreValue('st_payments', []);
  },

  async processPayment(invoiceId: string, amount: number, method: Payment['payment_method'], reference?: string): Promise<Payment> {
    const payments = await this.getPayments();
    const newPayment: Payment = {
      id: 'pmt-' + Math.random().toString(36).substr(2, 9),
      invoice_id: invoiceId,
      amount,
      payment_method: method,
      transaction_reference: reference || 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      created_at: new Date().toISOString()
    };

    payments.unshift(newPayment);
    setStoreValue('st_payments', payments);

    const invoices = await this.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.balance_due = Math.max(0, inv.balance_due - amount);
      if (inv.balance_due === 0) {
        inv.status = 'Paid';
      } else {
        inv.status = 'Partially Paid';
      }
      setStoreValue('st_invoices', invoices);

      // Sync booking status
      const bookings = await this.getBookings();
      const bk = bookings.find(b => b.id === inv.booking_id);
      if (bk && inv.status === 'Paid') {
        await this.updateBookingStatus(bk.id, 'Deposit Paid');
      }
    }

    return newPayment;
  },

  // --- ARTIST AVAILABILITY ---
  async getArtistAvailability(artistId: string): Promise<string[]> {
    // Returns list of blocked/unavailable dates as strings (YYYY-MM-DD)
    const raw = localStorage.getItem(`st_avail_${artistId}`);
    if (!raw) {
      // Seed some dates
      const seedDates = [
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ];
      localStorage.setItem(`st_avail_${artistId}`, JSON.stringify(seedDates));
      return seedDates;
    }
    return JSON.parse(raw) as string[];
  },

  async toggleArtistDate(artistId: string, dateStr: string): Promise<string[]> {
    const blockedDates = await this.getArtistAvailability(artistId);
    const idx = blockedDates.indexOf(dateStr);
    if (idx !== -1) {
      blockedDates.splice(idx, 1); // remove -> make available
    } else {
      blockedDates.push(dateStr); // add -> block date
    }
    localStorage.setItem(`st_avail_${artistId}`, JSON.stringify(blockedDates));
    return blockedDates;
  },

  async blockArtistDate(artistId: string, dateStr: string): Promise<string[]> {
    const blockedDates = await this.getArtistAvailability(artistId);
    if (!blockedDates.includes(dateStr)) {
      blockedDates.push(dateStr);
      localStorage.setItem(`st_avail_${artistId}`, JSON.stringify(blockedDates));
    }
    return blockedDates;
  },

  // --- TASKS ---
  async getTasks(): Promise<Task[]> {
    return getStoreValue('st_tasks', SEED_TASKS);
  },

  async createTask(title: string, description: string, due_date: string, assigned_to: string): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      id: 'tsk-' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      due_date,
      assigned_to,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    setStoreValue('st_tasks', tasks);
    return newTask;
  },

  async toggleTask(id: string): Promise<Task> {
    const tasks = await this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      const nextStatus: Task['status'] = 
        tasks[idx].status === 'Pending' ? 'In Progress' :
        tasks[idx].status === 'In Progress' ? 'Completed' : 'Pending';
      
      tasks[idx].status = nextStatus;
      setStoreValue('st_tasks', tasks);
      return tasks[idx];
    }
    throw new Error('Task not found');
  },

  // --- MESSAGES ---
  async getMessages(userId: string, contactId: string): Promise<Message[]> {
    const allMessages = getStoreValue<Message>('st_messages', [
      { id: 'm1', sender_id: 'usr-agent-1', receiver_id: 'usr-client-1', message: 'Hello Paul, I have sent over the contract for Chronixx Coachella performance. Please review and sign.', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm2', sender_id: 'usr-client-1', receiver_id: 'usr-agent-1', message: 'Thanks Sarah, reviewing it now with the legal team. We will sign by tomorrow.', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    ]);
    return allMessages.filter(m => 
      (m.sender_id === userId && m.receiver_id === contactId) ||
      (m.sender_id === contactId && m.receiver_id === userId)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async sendMessage(senderId: string, receiverId: string, message: string): Promise<Message> {
    const allMessages = getStoreValue<Message>('st_messages', []);
    const newMsg: Message = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      created_at: new Date().toISOString()
    };
    allMessages.push(newMsg);
    setStoreValue('st_messages', allMessages);
    return newMsg;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    const allNotifs = getStoreValue('st_notifs', SEED_NOTIFICATIONS);
    return allNotifs.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createNotification(userId: string, title: string, message: string): Promise<Notification> {
    const allNotifs = getStoreValue('st_notifs', SEED_NOTIFICATIONS);
    const newNotif: Notification = {
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      message,
      read_status: false,
      created_at: new Date().toISOString()
    };
    allNotifs.unshift(newNotif);
    setStoreValue('st_notifs', allNotifs);
    return newNotif;
  },

  async markNotificationRead(id: string): Promise<void> {
    const allNotifs = getStoreValue('st_notifs', SEED_NOTIFICATIONS);
    const notif = allNotifs.find(n => n.id === id);
    if (notif) {
      notif.read_status = true;
      setStoreValue('st_notifs', allNotifs);
    }
  },

  // --- ADDITIONAL CRUD HELPER METHODS ---
  async deleteBooking(id: string): Promise<boolean> {
    const bookings = await this.getBookings();
    const filtered = bookings.filter(b => b.id !== id);
    setStoreValue('st_bookings', filtered);
    return true;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const bookings = await this.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...updates };
      setStoreValue('st_bookings', bookings);
      return bookings[idx];
    }
    throw new Error('Booking not found');
  },

  async createBooking(bk: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
    const bookings = await this.getBookings();
    const newBk: Booking = {
      ...bk,
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    bookings.unshift(newBk);
    setStoreValue('st_bookings', bookings);
    return newBk;
  },

  async deleteArtist(id: string): Promise<boolean> {
    const artists = await this.getArtists();
    const filtered = artists.filter(a => a.id !== id);
    setStoreValue('st_artists_v2', filtered);
    return true;
  },

  async createArtist(art: Omit<Artist, 'id'>): Promise<Artist> {
    const artists = await this.getArtists();
    const newArt: Artist = {
      ...art,
      id: 'art-' + Math.random().toString(36).substr(2, 9)
    };
    artists.push(newArt);
    setStoreValue('st_artists_v2', artists);
    return newArt;
  },

  // --- VENUES ---
  async getVenues(): Promise<Venue[]> {
    return getStoreValue('st_venues', SEED_VENUES);
  },

  async createVenue(venue: Omit<Venue, 'id'>): Promise<Venue> {
    const venues = await this.getVenues();
    const newVen: Venue = {
      ...venue,
      id: 'ven-' + Math.random().toString(36).substr(2, 9)
    };
    venues.push(newVen);
    setStoreValue('st_venues', venues);
    return newVen;
  },

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    const venues = await this.getVenues();
    const idx = venues.findIndex(v => v.id === id);
    if (idx !== -1) {
      venues[idx] = { ...venues[idx], ...updates };
      setStoreValue('st_venues', venues);
      return venues[idx];
    }
    throw new Error('Venue not found');
  },

  async deleteVenue(id: string): Promise<boolean> {
    const venues = await this.getVenues();
    const filtered = venues.filter(v => v.id !== id);
    setStoreValue('st_venues', filtered);
    return true;
  },

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    return getStoreValue('st_customers', SEED_CUSTOMERS);
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const customers = await this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: 'cust-' + Math.random().toString(36).substr(2, 9)
    };
    customers.push(newCust);
    setStoreValue('st_customers', customers);
    return newCust;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const customers = await this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      customers[idx] = { ...customers[idx], ...updates };
      setStoreValue('st_customers', customers);
      return customers[idx];
    }
    throw new Error('Customer not found');
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const customers = await this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    setStoreValue('st_customers', filtered);
    return true;
  },

  // --- TICKET TIERS ---
  async getTicketTiers(): Promise<TicketTier[]> {
    return getStoreValue('st_ticket_tiers', SEED_TICKET_TIERS);
  },

  async createTicketTier(tier: Omit<TicketTier, 'id'>): Promise<TicketTier> {
    const tiers = await this.getTicketTiers();
    const newTier: TicketTier = {
      ...tier,
      id: 'tier-' + Math.random().toString(36).substr(2, 9)
    };
    tiers.push(newTier);
    setStoreValue('st_ticket_tiers', tiers);
    return newTier;
  },

  async updateTicketTier(id: string, updates: Partial<TicketTier>): Promise<TicketTier> {
    const tiers = await this.getTicketTiers();
    const idx = tiers.findIndex(t => t.id === id);
    if (idx !== -1) {
      tiers[idx] = { ...tiers[idx], ...updates };
      setStoreValue('st_ticket_tiers', tiers);
      return tiers[idx];
    }
    throw new Error('Ticket tier not found');
  },

  async deleteTicketTier(id: string): Promise<boolean> {
    const tiers = await this.getTicketTiers();
    const filtered = tiers.filter(t => t.id !== id);
    setStoreValue('st_ticket_tiers', filtered);
    return true;
  },

  // --- PROMO CODES ---
  async getPromoCodes(): Promise<PromoCode[]> {
    return getStoreValue('st_promo_codes', SEED_PROMO_CODES);
  },

  async createPromoCode(promo: Omit<PromoCode, 'id'>): Promise<PromoCode> {
    const promos = await this.getPromoCodes();
    const newPromo: PromoCode = {
      ...promo,
      id: 'promo-' + Math.random().toString(36).substr(2, 9)
    };
    promos.push(newPromo);
    setStoreValue('st_promo_codes', promos);
    return newPromo;
  },

  async updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
    const promos = await this.getPromoCodes();
    const idx = promos.findIndex(p => p.id === id);
    if (idx !== -1) {
      promos[idx] = { ...promos[idx], ...updates };
      setStoreValue('st_promo_codes', promos);
      return promos[idx];
    }
    throw new Error('Promo code not found');
  },

  async deletePromoCode(id: string): Promise<boolean> {
    const promos = await this.getPromoCodes();
    const filtered = promos.filter(p => p.id !== id);
    setStoreValue('st_promo_codes', filtered);
    return true;
  },

  // --- INVOICES EXTRA CRUD ---
  async createInvoice(inv: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const newInv: Invoice = {
      ...inv,
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    invoices.unshift(newInv);
    setStoreValue('st_invoices', invoices);
    return newInv;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const idx = invoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      invoices[idx] = { ...invoices[idx], ...updates };
      setStoreValue('st_invoices', invoices);
      return invoices[idx];
    }
    throw new Error('Invoice not found');
  },

  async deleteInvoice(id: string): Promise<boolean> {
    const invoices = await this.getInvoices();
    const filtered = invoices.filter(i => i.id !== id);
    setStoreValue('st_invoices', filtered);
    return true;
  },

  // --- CAMPAIGNS ---
  async getCampaigns(): Promise<MarketingCampaign[]> {
    return getStoreValue('st_campaigns', SEED_CAMPAIGNS);
  },

  async createCampaign(camp: Omit<MarketingCampaign, 'id' | 'created_at' | 'openRate'>): Promise<MarketingCampaign> {
    const camps = await this.getCampaigns();
    const newCamp: MarketingCampaign = {
      ...camp,
      id: 'camp-' + Math.random().toString(36).substr(2, 9),
      openRate: '0%',
      created_at: new Date().toISOString()
    };
    camps.unshift(newCamp);
    setStoreValue('st_campaigns', camps);
    return newCamp;
  },

  async updateCampaign(id: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const camps = await this.getCampaigns();
    const idx = camps.findIndex(c => c.id === id);
    if (idx !== -1) {
      camps[idx] = { ...camps[idx], ...updates };
      setStoreValue('st_campaigns', camps);
      return camps[idx];
    }
    throw new Error('Campaign not found');
  },

  async deleteCampaign(id: string): Promise<boolean> {
    const camps = await this.getCampaigns();
    const filtered = camps.filter(c => c.id !== id);
    setStoreValue('st_campaigns', filtered);
    return true;
  },

  // --- AD PLACEMENTS ---
  async getAdPlacements(): Promise<AdPlacement[]> {
    return getStoreValue('st_ad_placements', SEED_AD_PLACEMENTS);
  },

  async createAdPlacement(ad: Omit<AdPlacement, 'id' | 'impressions' | 'clickRate' | 'revenue'>): Promise<AdPlacement> {
    const ads = await this.getAdPlacements();
    const newAd: AdPlacement = {
      ...ad,
      id: 'ad-' + Math.random().toString(36).substr(2, 9),
      impressions: 0,
      clickRate: '0.0% CTR',
      revenue: 0
    };
    ads.push(newAd);
    setStoreValue('st_ad_placements', ads);
    return newAd;
  },

  async updateAdPlacement(id: string, updates: Partial<AdPlacement>): Promise<AdPlacement> {
    const ads = await this.getAdPlacements();
    const idx = ads.findIndex(a => a.id === id);
    if (idx !== -1) {
      ads[idx] = { ...ads[idx], ...updates };
      setStoreValue('st_ad_placements', ads);
      return ads[idx];
    }
    throw new Error('Ad placement not found');
  },

  async deleteAdPlacement(id: string): Promise<boolean> {
    const ads = await this.getAdPlacements();
    const filtered = ads.filter(a => a.id !== id);
    setStoreValue('st_ad_placements', filtered);
    return true;
  },

  // --- WEBSITE SECTIONS ---
  async getWebsiteSections(): Promise<WebsiteSection[]> {
    return getStoreValue('st_website_sections', SEED_WEBSITE_SECTIONS);
  },

  async createWebsiteSection(sec: Omit<WebsiteSection, 'id'>): Promise<WebsiteSection> {
    const secs = await this.getWebsiteSections();
    const newSec: WebsiteSection = {
      ...sec,
      id: 'sec-' + Math.random().toString(36).substr(2, 9)
    };
    secs.push(newSec);
    setStoreValue('st_website_sections', secs);
    return newSec;
  },

  async updateWebsiteSection(id: string, updates: Partial<WebsiteSection>): Promise<WebsiteSection> {
    const secs = await this.getWebsiteSections();
    const idx = secs.findIndex(s => s.id === id);
    if (idx !== -1) {
      secs[idx] = { ...secs[idx], ...updates };
      setStoreValue('st_website_sections', secs);
      return secs[idx];
    }
    throw new Error('Website section not found');
  },

  async deleteWebsiteSection(id: string): Promise<boolean> {
    const secs = await this.getWebsiteSections();
    const filtered = secs.filter(s => s.id !== id);
    setStoreValue('st_website_sections', filtered);
    return true;
  },

  // --- INTEGRATIONS ---
  async getIntegrations(): Promise<Integration[]> {
    return getStoreValue('st_integrations', SEED_INTEGRATIONS);
  },

  async createIntegration(int: Omit<Integration, 'id'>): Promise<Integration> {
    const ints = await this.getIntegrations();
    const newInt: Integration = {
      ...int,
      id: 'int-' + Math.random().toString(36).substr(2, 9)
    };
    ints.push(newInt);
    setStoreValue('st_integrations', ints);
    return newInt;
  },

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const ints = await this.getIntegrations();
    const idx = ints.findIndex(i => i.id === id);
    if (idx !== -1) {
      ints[idx] = { ...ints[idx], ...updates };
      setStoreValue('st_integrations', ints);
      return ints[idx];
    }
    throw new Error('Integration not found');
  },

  async deleteIntegration(id: string): Promise<boolean> {
    const ints = await this.getIntegrations();
    const filtered = ints.filter(i => i.id !== id);
    setStoreValue('st_integrations', filtered);
    return true;
  }
};
