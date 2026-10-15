import { createClient } from '@/lib/supabase/client';

// Types corresponding to the PostgreSQL tables
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
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
  is_featured?: boolean;
}

export interface BookingArtistItem {
  artist_id: string;
  artist_name: string;
  artist_image?: string;
  category?: string;
  genre?: string;
  role?: 'Headliner' | 'Supporting Act' | 'Special Guest' | 'DJ / Sound System' | 'Host';
  fee?: number;
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
  artists?: BookingArtistItem[];
  created_at: string;
}

export interface Booking {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_image: string;
  artists?: BookingArtistItem[];
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_id: string;
  event_title: string;
  event_type?: string;
  event_date: string;
  event_venue: string;
  event_country: string;
  attendance?: string;
  special_requests?: string;
  technical_rider_notes?: string;
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
  venue_type?: string;
  stage_specs?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  tier: string;
  notes: string;
  phone?: string;
  country?: string;
  status?: string;
  total_spent?: number;
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

export interface ShowEvent {
  id: string;
  title: string;
  tagline?: string;
  category: 'Festival' | 'Concert' | 'Arena Tour' | 'Club Showcase' | 'Gala';
  venue: string;
  city: string;
  country: string;
  date: string;
  time?: string;
  attendance?: string;
  poster_image: string;
  header_image?: string;
  description: string;
  artist_ids?: string[];
  lineup?: string;
  ticket_link?: string;
  ticket_price_starting?: number;
  status: 'Published' | 'Upcoming' | 'Draft' | 'Past';
  is_featured?: boolean;
  created_at: string;
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

export interface HomepageStatItem {
  id: string;
  end: number;
  suffix: string;
  label: string;
}

export interface HomepageConfig {
  stats: HomepageStatItem[];
  marquee: {
    eyebrow: string;
    items: string[];
  };
}

export interface Integration {
  id: string;
  name: string;
  provider: 'Stripe' | 'PayPal' | 'Twilio' | 'SendGrid' | 'Cloudflare' | 'WhatsApp';
  category?: 'Payments & Escrow' | 'Communications' | 'Infrastructure';
  status: 'Connected' | 'Disconnected';
  api_key: string;
  environment?: 'Sandbox' | 'Live Production';
  webhook_url?: string;
  last_synced?: string;
  latency_ms?: number;
}



// ---------------------------------------------------------
// Seed Data definition
export const SEED_USERS: User[] = [
  {
    id: 'usr-admin-1',
    first_name: 'Showtime',
    last_name: 'Admin',
    email: 'admin@showtimeservices.com',
    phone: '+1 (800) 555-0199',
    status: 'Active',
    role: 'Super Admin',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-agent-1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'agent@showtimeservices.com',
    phone: '+1 (800) 555-0198',
    status: 'Active',
    role: 'Booking Agent',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-mgr-1',
    first_name: 'Damian',
    last_name: 'Clarke',
    email: 'damian@showtimeservices.com',
    phone: '+1 (876) 555-0144',
    status: 'Active',
    role: 'Artist Manager',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr-fin-1',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'finance@showtimeservices.com',
    phone: '+1 (212) 555-0182',
    status: 'Active',
    role: 'Finance Manager',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'usr-mkt-1',
    first_name: 'Jordan',
    last_name: 'Blake',
    email: 'marketing@showtimeservices.com',
    phone: '+44 20 7946 0912',
    status: 'Active',
    role: 'Marketing Manager',
    created_at: '2026-01-12T00:00:00Z',
  },
  {
    id: 'usr-venue-1',
    first_name: 'Chloe',
    last_name: 'Bennett',
    email: 'venues@showtimeservices.com',
    phone: '+1 (305) 555-0167',
    status: 'Active',
    role: 'Venue Manager',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'usr-client-1',
    first_name: 'Marcus',
    last_name: 'Sterling',
    email: 'client@showtimeservices.com',
    phone: '+1 (800) 555-0197',
    status: 'Active',
    role: 'Client',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-artist-1',
    first_name: 'Beres',
    last_name: 'Hammond',
    email: 'beres@showtimeservices.com',
    phone: '+1 (800) 555-0196',
    status: 'Active',
    role: 'Artist',
    created_at: '2026-01-01T00:00:00Z',
  },
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
    hospitality_rider: 'Hospitality: Assorted red wines (Cabernet Sauvignon), hot water kettle, throat lozenges, selection of raw nuts, 100% vegetarian hot catering post-soundcheck, quiet dressing room.',
    is_featured: true
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
    hospitality_rider: 'Hospitality: Freshly squeezed fruit juices, selection of herbal teas, hot ginger infusion, organic snacks, organic vegan buffet for 12 touring crew members.',
    is_featured: true
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
      { type: 'Image', url: '/images/artist_dancehall.jpg' }
    ],
    technical_rider: 'Technical: 3 Vocal Cordless Mics (Shure SM58), Stereo DIs for Keyboards and DJ controller, 4 Monitor wedges (L-Acoustics), standard drum kit mic package.',
    hospitality_rider: 'Hospitality: Fresh ginger root, organic local honey, hot water kettle, assorted herbal teas, sliced seasonal fruit platters, 12 bottles of room-temperature spring water, 6 clean hand towels.',
    is_featured: true
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
    hospitality_rider: 'Hospitality: Assorted beers (Red Stripe), sparkling water, Earl Grey tea bags, fresh milk, 2 clean towels, small plate of sandwiches (vegetarian options included).',
    is_featured: true
  },
  {
    id: 'art-skeng',
    stage_name: 'Skeng',
    legal_name: 'Kevon Douglas',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Trap',
    bio: 'Skeng is a leading voice in contemporary Jamaican dancehall, known for his dark, high-energy tracks and viral anthems like "Gvnman Shift" and "Lollipop".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    socials: { Instagram: { url: 'https://instagram.com/skengdon', followers: 980000 } }
  },
  {
    id: 'art-shaneil-muir',
    stage_name: 'Shaneil Muir',
    legal_name: 'Shaneil Muir',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Reggae / Soul',
    bio: 'Shaneil Muir is a powerhouse vocalist who rose to fame with her inspirational anthem "Yamabella", blending gospel-infused passion with heavy dancehall rhythms.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    socials: { Instagram: { url: 'https://instagram.com/shaneilmuir', followers: 450000 } }
  },
  {
    id: 'art-rajah-wild',
    stage_name: 'Rajah Wild',
    legal_name: 'Rajah Wild',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Rajah Wild is a prominent member of the new wave of dancehall, known for his unique vocal styling, melodic delivery, and viral hits like "Wild Out".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-450',
    stage_name: '450',
    legal_name: '450',
    category: 'Dancehall Artists',
    genre: 'Dancehall / R&B',
    bio: '450 is a Jamaican dancehall artist celebrated for his smooth, introspective lyrics and melodic approach to topics of relationship, struggle, and ambition.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-jada-kingdom',
    stage_name: 'Jada Kingdom',
    legal_name: 'Jada Kingdom',
    category: 'Dancehall Artists',
    genre: 'Dancehall / R&B',
    bio: 'Jada Kingdom, also known as "Twinkle", is a Jamaican singer-songwriter recognized for her distinctive voice, blending dancehall, reggae, and contemporary R&B.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    socials: { Instagram: { url: 'https://instagram.com/jadakingdom', followers: 2300000 } }
  },
  {
    id: 'art-govana',
    stage_name: 'Govana',
    legal_name: 'Govana',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Govana (formerly Deablo) is a seasoned Jamaican dancehall artist and lyricist, widely respected for his storytelling ability and hits like "Bake Bean" and "Gyal Thief".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-stalk-ashley',
    stage_name: 'Stalk Ashley',
    legal_name: 'Stalk Ashley',
    category: 'Dancehall Artists',
    genre: 'Dancehall / R&B',
    bio: 'Stalk Ashley is a contemporary Jamaican singer blending sultry R&B textures with dancehall rhythms, known for hits like "Young" and "Desert".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-iwatta',
    stage_name: 'Iwatta',
    legal_name: 'Iwatta',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Iwatta is a high-energy dancehall selector and artist known for his vibrant style and popular singles in the Caribbean underground.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-intence',
    stage_name: 'Intence',
    legal_name: 'Tashawn George Gabbidon',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Intence (Yeng Boss) is a popular Jamaican dancehall artist known for his eccentric style, unique cadence, and massive street anthems like "Go Hard".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-mr-lexx',
    stage_name: 'Mr Lexx',
    legal_name: 'Lexus Palmer',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Classic',
    bio: 'Mr. Lexx (formerly Lexxus) is a legendary dancehall veteran who ruled the late 90s and 2000s with energetic dancehall classics like "Full Hundred" and "Ring Mi Cell".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-chronic-law',
    stage_name: 'Chronic Law',
    legal_name: 'Akeeme Campbell',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Reggae',
    bio: 'Chronic Law is a prolific Jamaican singjay, widely known as a voice of the streets with hit songs focusing on hardship, loyalty, and survival.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-alkaline',
    stage_name: 'Alkaline',
    legal_name: 'Earlan Bartley',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Alkaline is one of the most influential and chart-topping dancehall artists of the modern era, known for his boundary-pushing lyrics and loyal global fanbase.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-valiant',
    stage_name: 'Valiant',
    legal_name: 'Valiant',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Trap',
    bio: 'Valiant is a leading figure in the Jamaican "Trap Dancehall" movement, soaring to viral fame with hits like "Dunce Cheque" and "North Carolina".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-aidonia',
    stage_name: 'Aidonia',
    legal_name: 'Sheldon Lawrence',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Aidonia is an elite dancehall artist and leader of the J.O.P. camp, celebrated for his exceptional flow, lyrical dexterity, and club anthems.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-agent-sasco',
    stage_name: 'Agent Sasco',
    legal_name: 'Jeffrey Campbell',
    category: 'Reggae Artists',
    genre: 'Reggae / Dancehall',
    bio: 'Agent Sasco (Assassin) is a highly respected Jamaican artist known for his powerful baritone voice, conscious lyrics, and collaborations with Kanye West and Kendrick Lamar.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-taurus-riley',
    stage_name: 'Taurus Riley',
    legal_name: 'Tarrus Riley',
    category: 'Reggae Artists',
    genre: 'Reggae / Lovers Rock',
    bio: 'Tarrus Riley is an acclaimed reggae singer and songwriter, known for his classic hits like "She\'s Royal" and "Good Girl Gone Bad".',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-vgn',
    stage_name: 'VGN',
    legal_name: 'Very Good Network',
    category: 'Dancers',
    genre: 'Dance Performance',
    bio: 'VGN (Very Good Network) is a premier Caribbean dance group known for choreographing high-impact dancehall routines and performing at global stage shows.',
    profile_image: '/images/hero_ambient.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-patrice-roberts',
    stage_name: 'Patrice Roberts',
    legal_name: 'Patrice Roberts',
    category: 'Soca Artists',
    genre: 'Soca / Carnival',
    bio: 'Patrice Roberts is a Trinidadian soca powerhouse, beloved for her infectious carnival anthems, stunning vocals, and high-energy live shows.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-spice',
    stage_name: 'Spice',
    legal_name: 'Grace Hamilton',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Spice is the undisputed "Queen of Dancehall", known for her extravagant performances, colorful wigs, and chart-topping hits like "So Mi Like It".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-sizzla',
    stage_name: 'Sizzla',
    legal_name: 'Miguel Orlando Collins',
    category: 'Reggae Artists',
    genre: 'Roots Reggae / Dancehall',
    bio: 'Sizzla Kalonji is a legendary, highly prolific reggae artist who has released over 70 albums, spearheading the neo-rastafarian movement.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-ruff-kutt-crew',
    stage_name: 'Ruff Kutt Crew',
    legal_name: 'Ruff Kutt Crew Band',
    category: 'Bands',
    genre: 'Reggae Band / Live Backline',
    bio: 'Ruff Kutt Crew is Jamaica\'s premier backing band, having toured worldwide providing live instrumentation for elite dancehall and reggae artists.',
    profile_image: '/images/concert_stage.jpg',
    cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-tommy-lee',
    stage_name: 'Tommy Lee',
    legal_name: 'Leroy Russell',
    category: 'Dancehall Artists',
    genre: 'Gothic Dancehall / Trap',
    bio: 'Tommy Lee Sparta is a unique Jamaican dancehall artist known for his dark, theatrical style and high-energy performances.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-vanessa-bling',
    stage_name: 'Vanessa Bling',
    legal_name: 'Vanessa Bling',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Lovers Rock',
    bio: 'Vanessa Bling (Gaza Slim) is a popular Jamaican singer-songwriter known for her soulful, romantic dancehall collaborations and solo work.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-stylo-g',
    stage_name: 'Stylo G',
    legal_name: 'Jason McDermott',
    category: 'Dancehall Artists',
    genre: 'UK Dancehall / Crossover',
    bio: 'Stylo G is a UK-based Jamaican dancehall artist who bridged the gap between Caribbean music and European club scenes with his hits "My Yout" and "Touch Down".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-bayka',
    stage_name: 'Bayka',
    legal_name: 'Bayka',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Bayka is a rising force in the Jamaican trap dancehall space, recognized for his deep voice, dark beats, and sharp lyrical compositions.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-prettii-prettii',
    stage_name: 'Prettii Prettii',
    legal_name: 'Prettii Prettii',
    category: 'Dancers',
    genre: 'Dancehall Dancer',
    bio: 'Prettii Prettii is a prominent Jamaican dancer and social media personality, known for creating viral dance steps and performing on international stages.',
    profile_image: '/images/hero_ambient.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-tc',
    stage_name: 'TC',
    legal_name: 'TC',
    category: 'Dancers',
    genre: 'Dancehall Dancer',
    bio: 'TC is an iconic female dancer from Jamaica, a key figure in the female dancehall movement, and a member of the popular "Spice Dancer" alumni.',
    profile_image: '/images/hero_ambient.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-barbie-j',
    stage_name: 'Barbie J',
    legal_name: 'Barbie J',
    category: 'Dancers',
    genre: 'Dancehall Dancer / Performer',
    bio: 'Barbie J is a highly talented Jamaican dancer known for her expressive moves, performance skills, and high-profile music video appearances.',
    profile_image: '/images/hero_ambient.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-cham',
    stage_name: 'Cham',
    legal_name: 'Damian Beckett',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Baby Cham is a veteran dancehall artist known for his crossover hits like "Ghetto Story" and collaborations with international producers like Dave Kelly.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-dexta-daps',
    stage_name: 'Dexta Daps',
    legal_name: 'Louis Grandison',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Reggae / Soul',
    bio: 'Dexta Daps is a popular Jamaican singjay, celebrated for his romantic ballads, soulful voice, and intense live performances that captivate female audiences.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-elephant-man',
    stage_name: 'Elephant Man',
    legal_name: 'O\'Neil Bryan',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Energy',
    bio: 'Elephant Man (The Energy God) is a legendary dancehall artist known for his hyper-active stage shows, colorful hair, and creation of dozens of classic dance moves.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-ayetian',
    stage_name: 'Ayetian',
    legal_name: 'Ayetian',
    category: 'Reggae Artists',
    genre: 'Reggae / Afrofusion',
    bio: 'Ayetian is a rising contemporary artist combining traditional reggae rhythms with modern afrofusion elements to create uplifting global sounds.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-mr-killa',
    stage_name: 'Mr Killa',
    legal_name: 'Hollice Mapp',
    category: 'Reggae Artists',
    genre: 'Soca / Carnival',
    bio: 'Mr. Killa is a Grenadian Soca artist known for his high-energy, acrobatic performances and massive carnival hits like "Run Wid It".',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-shane-o',
    stage_name: 'Shane O',
    legal_name: 'Shane Brown',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Shane O is a talented Jamaican singer-songwriter and veteran lyricist, known for hit songs like "Lightning Flash" and "Partner Draw".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-jahmeil',
    stage_name: 'Jahmeil',
    legal_name: 'Jahmiel Foster',
    category: 'Reggae Artists',
    genre: 'Reggae / Dancehall',
    bio: 'Jahmiel is a conscious Jamaican artist known for his soulful, positive anthems detailing struggle, spirituality, and triumph.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-nation-boss',
    stage_name: 'Nation Boss',
    legal_name: 'Nation Boss',
    category: 'Reggae Artists',
    genre: 'Reggae / Soul',
    bio: 'Nation Boss is a breakout Jamaican singer who captured global attention with his acoustic viral sensation "Humans", blending deep reggae message with soul.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-9ine',
    stage_name: '9ine',
    legal_name: '9ine',
    category: 'Dancehall Artists',
    genre: 'Trap Dancehall',
    bio: '9ine is a fresh voice in the Jamaican dancehall landscape, delivering melodic rap-infused flows over contemporary trap beats.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-iq',
    stage_name: 'IQ',
    legal_name: 'IQ',
    category: 'Dancehall Artists',
    genre: 'UK Dancehall / Afroswing',
    bio: 'IQ is a London-based dancehall artist known for blending traditional Jamaican rhythms with UK Afroswing and Drill elements.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-monifa',
    stage_name: 'Monifa',
    legal_name: 'Monifa',
    category: 'Dancers',
    genre: 'Dance / Host',
    bio: 'Monifa is a versatile Caribbean dancer and stage host, known for her charismatic personality, event hosting, and energetic dance routines.',
    profile_image: '/images/hero_ambient.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-chippa-don',
    stage_name: 'Chippa Don',
    legal_name: 'Chippa Don',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Chippa Don is a raw, energetic dancehall artist from the Kingston underground, delivering high-octane street anthems.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-kash-promise-move',
    stage_name: 'Kash Promise Move',
    legal_name: 'Kash Promise Move',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Kash Promise Move is a rising artist in the Jamaican trap dancehall scene, known for his unique lyrical delivery and melodic singles.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-munga',
    stage_name: 'Munga',
    legal_name: 'Munga Honorable',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Munga Honorable is a seasoned Jamaican dancehall star known as the "Gangsta Ras", blending conscious Rastafarian themes with gritty street style.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-demarco',
    stage_name: 'Demarco',
    legal_name: 'Collin Demar Edwards',
    category: 'Dancehall Artists',
    genre: 'Dancehall / Producer',
    bio: 'Demarco is a highly successful Jamaican artist, songwriter, and producer, known for global anthems like "I Love My Life" and "Fallen Soldiers".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-dj-flare-chippy',
    stage_name: 'DJ Flare and Chippy',
    legal_name: 'DJ Flare & Chippy',
    category: 'DJs',
    genre: 'DJs / Selectors',
    bio: 'DJ Flare and Chippy are a dynamic DJ duo known for their high-energy mixes, seamless transitions, and headlining Caribbean sound clashes.',
    profile_image: '/images/artist_dj.jpg',
    cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-banka-poppi',
    stage_name: 'Banka and Poppi',
    legal_name: 'Banka & Poppi',
    category: 'DJs',
    genre: 'DJs / Selectors',
    bio: 'Banka and Poppi are elite selectors and party-starters, bringing authentic dancehall juggling and sound clash energy to clubs worldwide.',
    profile_image: '/images/artist_dj.jpg',
    cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-loyal-squad',
    stage_name: 'Loyal Squad',
    legal_name: 'Loyal Squad sound',
    category: 'DJs',
    genre: 'DJ Sound System',
    bio: 'Loyal Squad is a top-tier UK-based reggae and dancehall sound system, known for their dubplate collection and high-octane event juggling.',
    profile_image: '/images/artist_dj.jpg',
    cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-intll-starr',
    stage_name: 'Intll Starr',
    legal_name: 'International Starr',
    category: 'DJs',
    genre: 'DJ / Producer',
    bio: 'International Starr is a world-renowned DJ and remix artist, specializing in fusing dancehall, reggae, hip-hop, and house music.',
    profile_image: '/images/artist_dj.jpg',
    cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-younger-melody',
    stage_name: 'Younger Melody',
    legal_name: 'Younger Melody',
    category: 'Reggae Artists',
    genre: 'Reggae / Soul',
    bio: 'Younger Melody is a talented reggae singer carrying on the tradition of classical lovers rock and roots message in the modern era.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-singer-j',
    stage_name: 'Singer J',
    legal_name: 'Singer J',
    category: 'Reggae Artists',
    genre: 'Reggae / Gospel',
    bio: 'Singer J is a veteran Jamaican reggae singer known for his powerful vocals and hit conscious songs like "Can\'t Stop Me".',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active'
  },
  {
    id: 'art-beenie-man',
    stage_name: 'Beenie Man',
    legal_name: 'Moses Davis',
    category: 'Dancehall Artists',
    genre: 'Dancehall',
    bio: 'Beenie Man (The King of Dancehall) is a Grammy-winning icon and one of the most prolific and celebrated dancehall artists of all time, ruling stages since the 1980s.',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    socials: { Instagram: { url: 'https://instagram.com/kingbeenieman', followers: 2000000 } },
    is_featured: true
  },
  {
    id: 'art-machel-montano',
    stage_name: 'Machel Montano',
    legal_name: 'Machel Jesus Montano',
    category: 'Soca Artists',
    genre: 'Soca',
    bio: 'Machel Montano is the "King of Soca" and one of the most famous soca singers in the world, renowned for his high-energy performances and record wins at the Road March and Soca Monarch competitions.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    is_featured: true
  },
  {
    id: 'art-burna-boy',
    stage_name: 'Burna Boy',
    legal_name: 'Damini Ebunoluwa Ogulu',
    category: 'Afrobeats Artists',
    genre: 'Afrobeats / Afro-fusion',
    bio: 'Burna Boy is a Grammy-winning Nigerian superstar who has conquered global charts and sold out stadiums worldwide (including Madison Square Garden) with hits like "Last Last".',
    profile_image: '/images/artist_dancehall.jpg',
    cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    is_featured: true
  },
  {
    id: 'art-destra-garcia',
    stage_name: 'Destra Garcia',
    legal_name: 'Destra Garcia',
    category: 'Soca Artists',
    genre: 'Soca',
    bio: 'Destra Garcia is the "Queen of Soca", beloved for her incredible vocals, carnival anthems, and electrifying stage choreography representing Trinidad & Tobago.',
    profile_image: '/images/artist_reggae.jpg',
    cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    booking_status: 'Available',
    availability_status: 'Active',
    is_featured: false
  }
];

const SEED_LEADS: Lead[] = [];
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bk-shenseea-coachella',
    artist_id: 'art-shenseea',
    artist_name: 'Shenseea',
    artist_image: '/images/artist_dancehall.jpg',
    client_id: 'cli-goldenvoice',
    client_name: 'Goldenvoice Concerts LLC',
    event_id: 'evt-coachella-2026',
    event_title: 'Coachella Valley Music & Arts Festival',
    event_date: '2026-04-18',
    event_venue: 'Empire Polo Club (Outdoor Theatre)',
    event_country: 'United States',
    attendance: '125,000+',
    status: 'Confirmed',
    deposit_amount: 42500,
    total_amount: 85000,
    contract_id: 'ctr-shenseea-coachella',
    technical_rider_notes: 'FOH console Avid S6L, 2 Shure Axient Digital wireless handhelds, stereo in-ear mixes, dedicated DJ playback channels.',
    special_requests: 'VIP trailer in Artist Village, 15 All-Access wristbands, dedicated executive Sprinter van with airport escort.',
    created_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'bk-shenseea-barclays',
    artist_id: 'art-shenseea',
    artist_name: 'Shenseea',
    artist_image: '/images/artist_dancehall.jpg',
    client_id: 'cli-live-nation-ny',
    client_name: 'Live Nation Northeast',
    event_id: 'evt-summer-jam-2026',
    event_title: 'Summer Jam Arena Showcase',
    event_date: '2026-06-25',
    event_venue: 'Barclays Center Arena',
    event_country: 'United States',
    attendance: '19,000+',
    status: 'Contract Sent',
    deposit_amount: 32500,
    total_amount: 65000,
    contract_id: 'ctr-shenseea-barclays',
    technical_rider_notes: 'Full arena stage setup with synchronized pyro & cryo jets, 4 stereo IEM mixes, high-resolution video wall sync.',
    special_requests: 'Greenroom setup per hospitality rider: organic honey, fresh ginger, fresh fruit, champagne.',
    created_at: '2026-02-14T15:30:00Z'
  },
  {
    id: 'bk-shenseea-london',
    artist_id: 'art-shenseea',
    artist_name: 'Shenseea',
    artist_image: '/images/artist_dancehall.jpg',
    client_id: 'cli-sjm-concerts',
    client_name: 'SJM Concerts UK',
    event_id: 'evt-london-showcase-2026',
    event_title: 'Showtime UK Headline Tour - Night 1',
    event_date: '2026-08-14',
    event_venue: 'O2 Brixton Academy',
    event_country: 'United Kingdom',
    attendance: '5,000+',
    status: 'Proposal Generated',
    deposit_amount: 27500,
    total_amount: 55000,
    contract_id: 'ctr-shenseea-london',
    technical_rider_notes: 'Standard UK festival/venue backline with Shure wireless microphone package.',
    special_requests: 'Airport meet & greet at Heathrow Terminal 5, 2 executive Mercedes V-Class vans.',
    created_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'bk-beenie-sumfest',
    artist_id: 'art-beenie-man',
    artist_name: 'Beenie Man',
    artist_image: '/images/artist_dancehall.jpg',
    client_id: 'cli-downsound',
    client_name: 'Downsound Entertainment',
    event_id: 'evt-sumfest-2026',
    event_title: 'Reggae Sumfest Montego Bay - Dancehall Night',
    event_date: '2026-07-18',
    event_venue: 'Catherine Hall Entertainment Center',
    event_country: 'Jamaica',
    attendance: '35,000+',
    status: 'Confirmed',
    deposit_amount: 25000,
    total_amount: 50000,
    contract_id: 'ctr-beenie-sumfest',
    technical_rider_notes: 'Live band backline: DW Collectors drum kit, Ampeg SVT-CL bass rig, Yamaha Motif keyboards, 6 stage monitors.',
    special_requests: 'Private VIP air-conditioned dressing room behind main stage, 20 backstage passes.',
    created_at: '2026-01-15T12:00:00Z'
  },
  {
    id: 'bk-beenie-afronation',
    artist_id: 'art-beenie-man',
    artist_name: 'Beenie Man',
    artist_image: '/images/artist_dancehall.jpg',
    client_id: 'cli-smade-ent',
    client_name: 'SMADE Events & Live Nation',
    event_id: 'evt-afronation-2026',
    event_title: 'Afro Nation Portugal 2026',
    event_date: '2026-07-28',
    event_venue: 'Praia da Rocha Beach Arena',
    event_country: 'Portugal',
    attendance: '40,000+',
    status: 'Contract Sent',
    deposit_amount: 37500,
    total_amount: 75000,
    contract_id: 'ctr-beenie-afronation',
    technical_rider_notes: 'Headline festival stage package, 4 Shure Axient microphones, 8 wireless IEMs, multitrack recording feed.',
    special_requests: '5-star beachfront resort suites, private security detail on site.',
    created_at: '2026-02-20T09:00:00Z'
  },
  {
    id: 'bk-beres-cruise',
    artist_id: 'art-beres-hammond',
    artist_name: 'Beres Hammond',
    artist_image: '/images/artist_reggae.jpg',
    client_id: 'cli-harmony-promotions',
    client_name: 'Harmony Tours & Promotions',
    event_id: 'evt-harmony-cruise-2026',
    event_title: 'Love & Harmony Caribbean Concert Cruise',
    event_date: '2026-05-10',
    event_venue: 'Celebrity Beyond Ocean Deck',
    event_country: 'United States',
    attendance: '3,800+',
    status: 'Confirmed',
    deposit_amount: 35000,
    total_amount: 70000,
    contract_id: 'ctr-beres-cruise',
    technical_rider_notes: 'Harmony House full live band setup with horns section, 12 monitor mixes, grand piano DI setup.',
    special_requests: 'Master Suite on top deck, non-smoking VIP wing, private catering chef.',
    created_at: '2026-01-10T14:00:00Z'
  }
];

const SEED_CONTRACTS: Contract[] = [
  {
    id: 'ctr-shenseea-coachella',
    booking_id: 'bk-shenseea-coachella',
    document_url: 'https://docs.showtimeservices.com/contracts/coachella-2026-executed.pdf',
    status: 'Signed',
    signed_at: '2026-01-25T14:30:00Z',
    signature_data: 'Chinsea Linda Lee (Shenseea)',
    created_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'ctr-shenseea-barclays',
    booking_id: 'bk-shenseea-barclays',
    document_url: 'https://docs.showtimeservices.com/contracts/barclays-summerjam-2026.pdf',
    status: 'Sent',
    created_at: '2026-02-14T15:30:00Z'
  },
  {
    id: 'ctr-shenseea-london',
    booking_id: 'bk-shenseea-london',
    document_url: 'https://docs.showtimeservices.com/contracts/london-brixton-2026-draft.pdf',
    status: 'Draft',
    created_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'ctr-beenie-sumfest',
    booking_id: 'bk-beenie-sumfest',
    document_url: 'https://docs.showtimeservices.com/contracts/reggae-sumfest-2026-beenie.pdf',
    status: 'Signed',
    signed_at: '2026-01-22T16:00:00Z',
    signature_data: 'Moses Davis (Beenie Man)',
    created_at: '2026-01-15T12:00:00Z'
  },
  {
    id: 'ctr-beenie-afronation',
    booking_id: 'bk-beenie-afronation',
    document_url: 'https://docs.showtimeservices.com/contracts/afronation-portugal-2026.pdf',
    status: 'Sent',
    created_at: '2026-02-20T09:00:00Z'
  },
  {
    id: 'ctr-beres-cruise',
    booking_id: 'bk-beres-cruise',
    document_url: 'https://docs.showtimeservices.com/contracts/love-harmony-cruise-2026.pdf',
    status: 'Signed',
    signed_at: '2026-01-12T11:45:00Z',
    signature_data: 'Hugh Beresford Hammond',
    created_at: '2026-01-10T14:00:00Z'
  }
];
const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-shenseea-coachella',
    booking_id: 'bk-shenseea-coachella',
    amount: 75000,
    balance_due: 0,
    status: 'Paid',
    due_date: '2026-03-15',
    created_at: '2026-02-15T10:00:00Z'
  },
  {
    id: 'inv-barclays-jam',
    booking_id: 'bk-barclays-jam',
    amount: 65000,
    balance_due: 32500,
    status: 'Partially Paid',
    due_date: '2026-06-01',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'inv-beenie-sumfest',
    booking_id: 'bk-beenie-sumfest',
    amount: 50000,
    balance_due: 0,
    status: 'Paid',
    due_date: '2026-02-28',
    created_at: '2026-01-20T14:00:00Z'
  },
  {
    id: 'inv-beenie-afronation',
    booking_id: 'bk-beenie-afronation',
    amount: 75000,
    balance_due: 75000,
    status: 'Unpaid',
    due_date: '2026-05-15',
    created_at: '2026-03-10T09:30:00Z'
  },
  {
    id: 'inv-beres-harmony',
    booking_id: 'bk-beres-cruise',
    amount: 80000,
    balance_due: 0,
    status: 'Paid',
    due_date: '2026-02-01',
    created_at: '2026-01-15T11:00:00Z'
  }
];
const SEED_TASKS: Task[] = [
  {
    id: 'tsk-1',
    title: 'Verify Shenseea Coachella Technical Audio Rider with Goldenvoice Sound Director',
    description: 'Confirm 4x Shure Axient Digital wireless handhelds and Avid S6L console profile.',
    due_date: '2026-04-10',
    status: 'In Progress',
    assigned_to: 'Sarah Johnson',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'tsk-2',
    title: 'Countersign Barclays Center Summer Jam Performance Contract',
    description: 'Ensure 50% escrow deposit ($32,500 USD) is received prior to release.',
    due_date: '2026-06-15',
    status: 'Pending',
    assigned_to: 'Showtime Admin',
    created_at: '2026-03-05T14:30:00Z'
  },
  {
    id: 'tsk-3',
    title: 'Escrow Deposit Wire Confirmation for Beenie Man Afro Nation Portugal',
    description: 'Verify $37,500 wire transfer from SMADE Entertainment Ltd.',
    due_date: '2026-07-01',
    status: 'Pending',
    assigned_to: 'Finance Desk',
    created_at: '2026-03-08T09:00:00Z'
  },
  {
    id: 'tsk-4',
    title: 'Review OVO Arena Wembley Load-in & Curfew Schedule',
    description: 'Stage production load-in at 08:00 AM, Soundcheck at 16:00, strict 23:00 curfew.',
    due_date: '2026-08-30',
    status: 'Pending',
    assigned_to: 'Showtime Admin',
    created_at: '2026-03-10T11:00:00Z'
  }
];
const SEED_NOTIFICATIONS: Notification[] = [];

const SEED_VENUES: Venue[] = [
  {
    id: 'ven-1',
    name: 'Catherine Hall Entertainment Center',
    capacity: '35,000 capacity',
    location: 'Montego Bay, Jamaica',
    venue_type: 'Open-Air Festival Grounds',
    description: 'Premier seaside festival staging and historic home of Reggae Sumfest.',
    parking: '10,000 spaces',
    stage_specs: '60ft x 48ft Stage, L-Acoustics K1/K2 Line Array',
    contact_name: 'Josef Bogdanovich',
    contact_email: 'production@sumfest.com',
    contact_phone: '+1 (876) 952-4500'
  },
  {
    id: 'ven-2',
    name: 'Barclays Center Arena',
    capacity: '19,000 seats',
    location: 'Brooklyn, New York, USA',
    venue_type: 'Indoor Arena',
    description: 'Premier multi-purpose indoor arena in Downtown Brooklyn, host of Summer Jam and major arena tours.',
    parking: 'MTA Transit Hub & 2,500 garage spots',
    stage_specs: 'End-Stage Arena Configuration, JBL VTX V25 Line Array',
    contact_name: 'David Klein',
    contact_email: 'concerts@barclayscenter.com',
    contact_phone: '+1 (917) 618-6100'
  },
  {
    id: 'ven-3',
    name: 'OVO Arena Wembley',
    capacity: '12,500 seats',
    location: 'London, United Kingdom',
    venue_type: 'Indoor Arena',
    description: 'Iconic indoor music arena in Wembley Park hosting international reggae, dancehall, and pop showcases.',
    parking: '3,000 spaces',
    stage_specs: 'Full Arena Rigging Grid, d&b audiotechnik GSL System',
    contact_name: 'Sarah Higgins',
    contact_email: 'events@ovoarena.co.uk',
    contact_phone: '+44 20 8782 5555'
  },
  {
    id: 'ven-4',
    name: 'Empire Polo Club',
    capacity: '125,000 capacity',
    location: 'Indio, California, USA',
    venue_type: 'Outdoor Festival Complex',
    description: 'World-famous 78-acre polo club home to Coachella and Stagecoach Music Festivals.',
    parking: '40,000 spaces & shuttle transit',
    stage_specs: 'Outdoor Theatre & Sahara Mega-Structures, Clair Global Cohesion CO-12',
    contact_name: 'Paul Tollett',
    contact_email: 'talent@goldenvoice.com',
    contact_phone: '+1 (323) 930-5700'
  },
  {
    id: 'ven-5',
    name: 'National Stadium',
    capacity: '35,000 seats',
    location: 'Kingston, Jamaica',
    venue_type: 'National Stadium',
    description: 'Premier national stadium for landmark historical concerts, stadium tours, and Independence spectacles.',
    parking: '5,000 spaces',
    stage_specs: 'Field Staging with Delay Towers, Electro-Voice X-Line',
    contact_name: 'Major Desmon Brown',
    contact_email: 'info@ipld.org.jm',
    contact_phone: '+1 (876) 968-3500'
  }
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cli-goldenvoice',
    name: 'Paul Tollett',
    company: 'Goldenvoice Concerts / AEG Presents',
    email: 'ptollett@goldenvoice.com',
    phone: '+1 (323) 930-5700',
    country: 'United States',
    tier: 'Major Festival Producer',
    status: 'Active VIP',
    total_spent: 450000,
    notes: 'Primary talent buyer for Coachella, Stagecoach, and Day N Vegas. Prompt 50% deposit via wire.'
  },
  {
    id: 'cli-live-nation-ny',
    name: 'Geoff Gordon',
    company: 'Live Nation Northeast',
    email: 'ggordon@livenation.com',
    phone: '+1 (212) 543-8000',
    country: 'United States',
    tier: 'Arena Buyer',
    status: 'Active VIP',
    total_spent: 620000,
    notes: 'Handles Barclays Center, Madison Square Garden, and TD Garden dates. Requires rider compliance sign-off 14 days out.'
  },
  {
    id: 'cli-downsound',
    name: 'Josef Bogdanovich',
    company: 'Downsound Entertainment',
    email: 'josef@downsoundrecords.com',
    phone: '+1 (876) 929-1000',
    country: 'Jamaica',
    tier: 'VIP Promoter',
    status: 'Active VIP',
    total_spent: 380000,
    notes: 'Owner of Reggae Sumfest. Direct escrow payments and guaranteed full technical backline fulfillment.'
  },
  {
    id: 'cli-smade-ent',
    name: 'Adesegun Adeosun Jr. (SMADE)',
    company: 'SMADE Entertainment / Live Nation',
    email: 'smade@smade.co.uk',
    phone: '+44 20 7946 0912',
    country: 'United Kingdom',
    tier: 'Major Festival Producer',
    status: 'Preferred Buyer',
    total_spent: 290000,
    notes: 'Founder of Afro Nation Portugal, Afro Nation Miami, and European tour circuits.'
  },
  {
    id: 'cli-sjm-concerts',
    name: 'Chris York',
    company: 'SJM Concerts',
    email: 'cyork@sjmconcerts.com',
    phone: '+44 161 832 1111',
    country: 'United Kingdom',
    tier: 'Arena Buyer',
    status: 'Preferred Buyer',
    total_spent: 195000,
    notes: 'Promotes O2 Academy Brixton, Manchester AO Arena, and UK national tours.'
  }
];

export const SEED_EVENTS: ShowEvent[] = [
  {
    id: 'evt-sumfest-2026',
    title: 'Reggae Sumfest Montego Bay',
    tagline: 'The Greatest Reggae Show On Earth',
    category: 'Festival',
    venue: 'Catherine Hall Entertainment Center',
    city: 'Montego Bay',
    country: 'Jamaica',
    date: '2026-07-18',
    time: '19:00',
    attendance: '35,000+',
    poster_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800',
    header_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1600',
    description: 'Headline festival performance featuring the pinnacle of Caribbean reggae and dancehall icons across two monumental festival nights.',
    lineup: 'Buju Banton, Beenie Man, Shaneil Muir',
    ticket_link: 'https://reggaesumfest.com/tickets',
    ticket_price_starting: 75,
    status: 'Published',
    is_featured: true,
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'evt-coachella-2026',
    title: 'Coachella Valley Music & Arts Festival',
    tagline: 'Desert Odyssey 2026',
    category: 'Festival',
    venue: 'Empire Polo Club',
    city: 'Indio, CA',
    country: 'United States',
    date: '2026-04-18',
    time: '18:00',
    attendance: '125,000+',
    poster_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800',
    header_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1600',
    description: 'Major showcase across premier outdoor stages featuring global talent curation and crossover sound systems.',
    lineup: 'Shenseea, Chromatic Live, Special Guests',
    ticket_link: 'https://www.coachella.com',
    ticket_price_starting: 499,
    status: 'Published',
    is_featured: true,
    created_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'evt-wembley-2026',
    title: 'Showtime Arena Showcases',
    tagline: 'London Heritage Live',
    category: 'Arena Tour',
    venue: 'OVO Arena Wembley',
    city: 'London',
    country: 'United Kingdom',
    date: '2026-09-12',
    time: '19:30',
    attendance: '12,500+',
    poster_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    header_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1600',
    description: 'Exclusive London arena headline production contracted and managed end-to-end by Showtime Entertainment Services.',
    lineup: 'Buju Banton, Govana, DJ Young Chow',
    ticket_link: 'https://www.ticketmaster.co.uk',
    ticket_price_starting: 95,
    status: 'Published',
    is_featured: true,
    created_at: '2026-02-01T10:00:00Z'
  }
];

const SEED_TICKET_TIERS: TicketTier[] = [
  { id: 'tier-ga', name: 'General Admission', price: 85, desc: 'Standard field gate access', capacity: 5000 },
  { id: 'tier-vip', name: 'VIP Deck Pass', price: 250, desc: 'Raised platform, private bar', capacity: 1000 },
  { id: 'tier-vvip', name: 'VVIP Backstage', price: 850, desc: 'Meet & greet, backline hospitality', capacity: 250 },
  { id: 'tier-ultra', name: 'Ultra VVIP Table package', price: 3500, desc: 'Dressed cabana table for 8', capacity: 50 }
];

const SEED_PROMO_CODES: PromoCode[] = [
  { id: 'promo-earlybird', code: 'EARLYBIRD2026', discount: 15, active: true, expiry: '2026-06-30' },
  { id: 'promo-sumfest', code: 'SUMFESTVIP', discount: 20, active: true, expiry: '2026-07-15' },
  { id: 'promo-global', code: 'GLOBALROSTER', discount: 10, active: true, expiry: '2026-12-31' },
  { id: 'promo-spring', code: 'SPRINGPASS', discount: 25, active: false, expiry: '2026-03-31' }
];

const SEED_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-sumfest-launch',
    name: 'Reggae Sumfest 2026 Lineup Announcement',
    type: 'Email',
    subject: '★ The Greatest Reggae Show On Earth: Full Headline Roster Revealed',
    segment: 'VIP Promoters & Buyers',
    openRate: '48.2%',
    content: 'Announcing exclusive festival performance bookings for Beenie Man, Shenseea, and Beres Hammond across two historic nights in Montego Bay.',
    created_at: '2026-02-15T14:00:00Z'
  },
  {
    id: 'camp-coachella-tour',
    name: 'Coachella 2026 Desert Weekend Alert',
    type: 'SMS',
    subject: 'Shenseea Live at the Empire Polo Club',
    segment: 'US West Coast Talent Buyers',
    openRate: '91.4%',
    content: 'Confirming dates and private showcase slots during Coachella weekend 1 & 2.',
    created_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'camp-london-wembley',
    name: 'London Wembley Arena Showtime Crossover',
    type: 'Push',
    subject: 'Headline Arena Dates Announced',
    segment: 'UK & European Tour Producers',
    openRate: '34.7%',
    content: 'Official announcement for OVO Arena Wembley and O2 Brixton tour circuit.',
    created_at: '2026-03-08T09:00:00Z'
  },
  {
    id: 'camp-carnival-circuit',
    name: 'Caribbean Carnival Season 2026 VIP Booking',
    type: 'Email',
    subject: 'Secure Soca & Dancehall Kings for Carnival',
    segment: 'Carnival Band Leaders',
    openRate: '42.9%',
    content: 'Limited tour dates available for Machel Montano, Destra Garcia, and Mr Killa.',
    created_at: '2026-01-10T16:00:00Z'
  }
];

const SEED_AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'ad-sumfest-billboard',
    name: 'Sumfest 2026 Mainstage Billboard',
    impressions: 145000,
    clickRate: '4.8%',
    revenue: 8500,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ad-coachella-hero',
    name: 'Desert Odyssey 2026 Hero Spotlight',
    impressions: 210000,
    clickRate: '6.2%',
    revenue: 14200,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ad-wembley-arena',
    name: 'London Wembley Arena Header Banner',
    impressions: 88000,
    clickRate: '3.9%',
    revenue: 5200,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ad-roster-sidebar',
    name: 'Exclusive Roster Talent Sidebar',
    impressions: 64000,
    clickRate: '5.1%',
    revenue: 3800,
    active: true,
    image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800'
  }
];

const SEED_WEBSITE_SECTIONS: WebsiteSection[] = [
  { id: 'sec-hero', type: 'hero', title: 'World-Class Caribbean Talent Booking & Production', subtitle: 'Direct agency access to the premier Reggae, Dancehall, Soca & Afrobeats icons worldwide.', content: 'Global concert tours, stadium spectacles, and festival headline curation.', buttonText: 'Explore Talent Roster', active: true, image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200' },
  { id: 'sec-ann', type: 'announcement', title: '★ 2026 Summer Tour Routes Now Open for Booking', content: 'Lock in headline performance dates with direct escrow contracts and guaranteed rider execution.', active: true },
  { id: 'sec-features', type: 'features', title: 'Agency Guarantees & Turnkey Delivery', subtitle: 'Built for world tours, major festivals, and arena buyers.', content: 'Direct Artist Representation • Secure Escrow & Settlement • Comprehensive Technical Riders • Global Visa & Logistics Coordination', active: true },
  { id: 'sec-cta', type: 'cta', title: 'Plan Your 2026 Headline Production With Showtime', subtitle: 'Direct agent response within 24 hours. Full rider compliance and escrow protection.', buttonText: 'Initiate Booking Inquiry', active: true, image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200' },
  { id: 'sec-footer', type: 'footer', title: 'Showtime Entertainment Services Global', subtitle: 'Kingston • Miami • London • New York', content: 'Premier talent representation, tour routing, and festival backline infrastructure.', active: true }
];

export const SEED_HOMEPAGE_CONFIG: HomepageConfig = {
  stats: [
    { id: 'stat-1', end: 200, suffix: '+', label: 'Artists Represented' },
    { id: 'stat-2', end: 35, suffix: '+', label: 'Countries Toured' },
    { id: 'stat-3', end: 1000, suffix: '+', label: 'Events Produced' },
    { id: 'stat-4', end: 98, suffix: '%', label: 'Client Satisfaction' },
  ],
  marquee: {
    eyebrow: 'Trusted by global festivals & promoters',
    items: [
      'Carifesta', 'Rocksteady', 'Siren Festival', 'Reggae Sumfest', 'Glastonbury',
      'Coachella', 'One Love', 'Caribbean Carnival', 'Notting Hill', 'Rototom Sunsplash',
      'Rebel Salute', 'Jazz & Blues Festival'
    ]
  }
};

const SEED_INTEGRATIONS: Integration[] = [
  {
    id: 'int-stripe',
    name: 'Stripe Global Payments & Escrow',
    provider: 'Stripe',
    category: 'Payments & Escrow',
    status: 'Connected',
    api_key: '••••••••••••••••••••',
    environment: 'Live Production',
    webhook_url: 'https://showtimeservices.com/api/webhooks/stripe',
    last_synced: '2026-10-10T12:00:00Z',
    latency_ms: 32
  },
  {
    id: 'int-paypal',
    name: 'PayPal Merchant Services ($75/mo Retainer)',
    provider: 'PayPal',
    category: 'Payments & Escrow',
    status: 'Connected',
    api_key: '••••••••••••••••••••',
    environment: 'Live Production',
    webhook_url: 'https://showtimeservices.com/api/webhooks/paypal',
    last_synced: '2026-10-10T12:30:00Z',
    latency_ms: 45
  },
  {
    id: 'int-twilio',
    name: 'Twilio SMS Tour Alerts & Alerts',
    provider: 'Twilio',
    category: 'Communications',
    status: 'Connected',
    api_key: '••••••••••••••••••••',
    environment: 'Live Production',
    webhook_url: 'https://showtimeservices.com/api/webhooks/twilio',
    last_synced: '2026-10-10T11:15:00Z',
    latency_ms: 28
  },
  {
    id: 'int-sendgrid',
    name: 'SendGrid Contract & Invoice Mailer',
    provider: 'SendGrid',
    category: 'Communications',
    status: 'Connected',
    api_key: '••••••••••••••••••••',
    environment: 'Live Production',
    webhook_url: 'https://showtimeservices.com/api/webhooks/sendgrid',
    last_synced: '2026-10-10T13:00:00Z',
    latency_ms: 22
  },
  {
    id: 'int-cloudflare',
    name: 'Cloudflare Edge CDN & D1 Storage',
    provider: 'Cloudflare',
    category: 'Infrastructure',
    status: 'Connected',
    api_key: '••••••••••••••••••••',
    environment: 'Live Production',
    webhook_url: 'https://showtimeservices.com/api/webhooks/cloudflare',
    last_synced: '2026-10-10T13:30:00Z',
    latency_ms: 14
  },
  {
    id: 'int-whatsapp',
    name: 'WhatsApp Business API (VIP Desk)',
    provider: 'WhatsApp',
    category: 'Communications',
    status: 'Disconnected',
    api_key: '',
    environment: 'Sandbox',
    webhook_url: 'https://showtimeservices.com/api/webhooks/whatsapp',
    last_synced: '2026-10-08T09:00:00Z',
    latency_ms: 0
  }
];



// ---------------------------------------------------------
// Billing documents: Quote → Invoice → Receipt (+ Credit Note)
// ---------------------------------------------------------
export type BillingDocType = 'Quote' | 'Invoice' | 'Receipt' | 'Credit Note';
export type BillingDocStatus =
  | 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired'
  | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void' | 'Issued' | 'Cancelled';

export interface BillingLineItem {
  id: string;
  description: string;
  qty: number;
  unit_price: number;
}

export interface BillingPayment {
  id: string;
  amount: number;
  method: string;
  date: string;
  reference?: string;
  receipt_id?: string;
  notes?: string;
}

export interface BillingDoc {
  id: string;
  type: BillingDocType;
  number: string;
  status: BillingDocStatus;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_phone?: string;
  client_address?: string;
  booking_id?: string;
  event_title?: string;
  artist_name?: string;
  venue_name?: string;
  line_items: BillingLineItem[];
  discount_pct: number;
  tax_pct: number;
  deposit_pct_required?: number;
  currency: string;
  issue_date: string;
  due_date: string;          // due date (invoice) or valid-until (quote)
  valid_until?: string;
  notes?: string;
  terms?: string;
  payment_terms?: string;
  bank_details?: string;
  payments: BillingPayment[];
  source_id?: string;        // document this one was created from
  source_number?: string;
  converted_to_id?: string;  // quote → invoice link
  converted_to_number?: string;
  sent_at?: string;
  created_at: string;
}

export interface BillingTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  discountAmount: number;
  taxAmount: number;
  totalPaid: number;
  balanceDue: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function docTotals(doc: Pick<BillingDoc, 'line_items' | 'discount_pct' | 'tax_pct' | 'payments' | 'type'>): BillingTotals {
  const subtotal = r2(doc.line_items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0));
  const discount = r2(subtotal * ((Number(doc.discount_pct) || 0) / 100));
  const taxable = subtotal - discount;
  const tax = r2(taxable * ((Number(doc.tax_pct) || 0) / 100));
  const total = r2(taxable + tax);
  const paid = r2((doc.payments || []).reduce((s, p) => s + p.amount, 0));
  const balance = doc.type === 'Invoice' ? r2(Math.max(total - paid, 0)) : 0;
  return {
    subtotal,
    discount,
    tax,
    total,
    paid,
    balance,
    discountAmount: discount,
    taxAmount: tax,
    totalPaid: paid,
    balanceDue: balance
  };
}

/** Display status — flags invoices past due as Overdue and stale quotes as Expired. */
export function effectiveDocStatus(doc: BillingDoc): BillingDocStatus {
  const today = new Date().toISOString().slice(0, 10);
  const checkDueDate = doc.due_date || doc.valid_until;
  if (doc.type === 'Invoice' && ['Sent', 'Partially Paid', 'Unpaid'].includes(doc.status) && checkDueDate && checkDueDate < today) return 'Overdue';
  if (doc.type === 'Quote' && doc.status === 'Sent' && (doc.valid_until || doc.due_date) && (doc.valid_until || doc.due_date)! < today) return 'Expired';
  return doc.status;
}

const DOC_PREFIX: Record<BillingDocType, string> = { Quote: 'QUO', Invoice: 'INV', Receipt: 'RCT', 'Credit Note': 'CN' };
const uid = (p: string) => p + '-' + Math.random().toString(36).slice(2, 10);

export const DEFAULT_INVOICE_TERMS =
  'Payment due by the date shown. A 50% non-refundable deposit secures the booking; the balance is due before performance. Late payments may incur a 1.5% monthly fee. Cancellations are subject to the signed artist contract.';

const SEED_BILLING_DOCS: BillingDoc[] = [
  {
    id: 'doc-q1', type: 'Quote', number: 'QUO-2026-0001', status: 'Sent',
    client_name: 'Marcus Sterling', client_email: 'client@showtimeservices.com', client_company: 'Sterling Live Events',
    event_title: 'Sumfest Headliner Night', artist_name: 'Beres Hammond',
    line_items: [
      { id: 'l1', description: 'Headline performance — Beres Hammond (90 min)', qty: 1, unit_price: 65000 },
      { id: 'l2', description: 'Backline & technical rider fulfilment', qty: 1, unit_price: 6500 },
      { id: 'l3', description: 'Travel, accommodation & ground transport', qty: 1, unit_price: 8500 },
    ],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-10-01', due_date: '2026-11-30',
    notes: 'Quote valid for 60 days. Subject to artist availability.', terms: DEFAULT_INVOICE_TERMS,
    payments: [], created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'doc-i1', type: 'Invoice', number: 'INV-2026-0001', status: 'Partially Paid',
    client_name: 'Barclays Summer Jam', client_email: 'finance@barclaysjam.example', client_company: 'Barclays Summer Jam Ltd',
    event_title: 'Summer Jam London', artist_name: 'Shenseea',
    line_items: [
      { id: 'l1', description: 'Headline performance — Shenseea', qty: 1, unit_price: 110000 },
      { id: 'l2', description: 'Production & staging support', qty: 1, unit_price: 20000 },
    ],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-08-20', due_date: '2026-09-20',
    notes: 'Deposit received. Balance due before show day.', terms: DEFAULT_INVOICE_TERMS,
    payments: [{ id: 'pay-1', amount: 65000, method: 'Bank Transfer', date: '2026-08-25', reference: 'WIRE-88231', receipt_id: 'doc-r1' }],
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'doc-i2', type: 'Invoice', number: 'INV-2026-0002', status: 'Sent',
    client_name: 'Afro Nation Portugal', client_email: 'accounts@afronation.example', client_company: 'Afro Nation',
    event_title: 'Afro Nation 2026', artist_name: 'Beenie Man',
    line_items: [{ id: 'l1', description: 'Festival performance — Beenie Man (75 min)', qty: 1, unit_price: 75000 }],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-10-05', due_date: '2026-11-05',
    terms: DEFAULT_INVOICE_TERMS, payments: [], created_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 'doc-i3', type: 'Invoice', number: 'INV-2026-0003', status: 'Paid',
    client_name: 'Coachella Weekend Showcase', client_email: 'ap@showcase.example',
    event_title: 'Coachella Showcase', artist_name: 'Shenseea',
    line_items: [{ id: 'l1', description: 'Showcase set — Shenseea', qty: 1, unit_price: 75000 }],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-07-01', due_date: '2026-07-31',
    terms: DEFAULT_INVOICE_TERMS,
    payments: [{ id: 'pay-2', amount: 75000, method: 'Wire', date: '2026-07-15', reference: 'WIRE-77120', receipt_id: 'doc-r2' }],
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'doc-r1', type: 'Receipt', number: 'RCT-2026-0001', status: 'Issued',
    client_name: 'Barclays Summer Jam', client_email: 'finance@barclaysjam.example',
    event_title: 'Summer Jam London', artist_name: 'Shenseea',
    line_items: [{ id: 'l1', description: 'Payment received for INV-2026-0001 (deposit)', qty: 1, unit_price: 65000 }],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-08-25', due_date: '2026-08-25',
    payments: [{ id: 'pay-1', amount: 65000, method: 'Bank Transfer', date: '2026-08-25', reference: 'WIRE-88231' }],
    source_id: 'doc-i1', source_number: 'INV-2026-0001', created_at: '2026-08-25T10:00:00Z',
  },
  {
    id: 'doc-r2', type: 'Receipt', number: 'RCT-2026-0002', status: 'Issued',
    client_name: 'Coachella Weekend Showcase', client_email: 'ap@showcase.example',
    event_title: 'Coachella Showcase', artist_name: 'Shenseea',
    line_items: [{ id: 'l1', description: 'Payment received for INV-2026-0003 (paid in full)', qty: 1, unit_price: 75000 }],
    discount_pct: 0, tax_pct: 0, currency: 'USD', issue_date: '2026-07-15', due_date: '2026-07-15',
    payments: [{ id: 'pay-2', amount: 75000, method: 'Wire', date: '2026-07-15', reference: 'WIRE-77120' }],
    source_id: 'doc-i3', source_number: 'INV-2026-0003', created_at: '2026-07-15T10:00:00Z',
  },
];

// Initialize local DB state helper
const getStoreValue = <T>(key: string, seed: T[]): T[] => {
  if (typeof window === 'undefined') return seed;

  // Migrate from old 'st_artists' to 'st_artists_v2' if needed
  if (key === 'st_artists_v2' && !localStorage.getItem('st_artists_v2')) {
    const oldRaw = localStorage.getItem('st_artists');
    if (oldRaw) {
      localStorage.setItem('st_artists_v2', oldRaw);
    }
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as T[];
    // Merge new seed items if they don't exist by ID in localStorage
    if (key === 'st_users') {
      const parsedUsers = (Array.isArray(parsed) ? parsed : []) as unknown as User[];
      const seedUsers = seed as unknown as User[];
      let updated = false;
      seedUsers.forEach(seedU => {
        const pa = parsedUsers.find(p => p.id === seedU.id || p.email.toLowerCase() === seedU.email.toLowerCase());
        if (!pa) {
          parsedUsers.push(seedU);
          updated = true;
        }
      });
      if (updated || parsedUsers.length === 0) {
        const finalUsers = parsedUsers.length > 0 ? parsedUsers : seedUsers;
        localStorage.setItem(key, JSON.stringify(finalUsers));
        return finalUsers as unknown as T[];
      }
    }

    if (key === 'st_integrations') {
      const parsedInts = (Array.isArray(parsed) ? parsed : []) as unknown as Integration[];
      const seedInts = seed as unknown as Integration[];
      let updated = false;
      seedInts.forEach(sInt => {
        const existing = parsedInts.find(p => p.id === sInt.id);
        if (!existing) {
          parsedInts.push(sInt);
          updated = true;
        } else if (!existing.category || !existing.environment) {
          Object.assign(existing, { category: sInt.category, environment: sInt.environment, webhook_url: sInt.webhook_url, latency_ms: sInt.latency_ms });
          updated = true;
        }
      });
      if (updated || parsedInts.length === 0) {
        const finalInts = parsedInts.length > 0 ? parsedInts : seedInts;
        localStorage.setItem(key, JSON.stringify(finalInts));
        return finalInts as unknown as T[];
      }
    }

    if (key === 'st_artists_v2') {
      const parsedArtists = parsed as unknown as Artist[];
      const seedArtists = seed as unknown as Artist[];
      let updated = false;
      seedArtists.forEach(seedArt => {
        const pa = parsedArtists.find(p => p.id === seedArt.id);
        if (!pa) {
          parsedArtists.push(seedArt);
          updated = true;
        } else if (pa.is_featured === undefined && seedArt.is_featured !== undefined) {
          pa.is_featured = seedArt.is_featured;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(key, JSON.stringify(parsedArtists));
        return parsedArtists as unknown as T[];
      }
    }

    if ((key === 'st_bookings' || key === 'st_contracts' || key === 'st_venues' || key === 'st_customers' || key === 'st_tasks' || key === 'st_invoices' || key === 'st_promo_codes' || key === 'st_campaigns' || key === 'st_ad_placements' || key === 'st_sections' || key === 'st_integrations' || key === 'st_billing_docs') && Array.isArray(parsed)) {
      if (parsed.length === 0 && seed.length > 0) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
    }
    return parsed;
  } catch {
    return seed;
  }
};

const setStoreValue = <T>(key: string, data: T[] | T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const getObjectStoreValue = <T>(key: string, seed: T): T => {
  if (typeof window === 'undefined') return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed ? (parsed as T) : seed;
  } catch {
    return seed;
  }
};

// ---------------------------------------------------------
// Supabase Client Initialization (uses shared singleton)
// ---------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only treat as configured if values are real (not placeholder defaults)
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey
  && !supabaseUrl.includes('your-project-ref')
  && !supabaseAnonKey.includes('your-anon-key'));

export const supabase = isSupabaseConfigured ? createClient() : null;

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
    const allArtists = await this.getArtists();
    let computedArtistName = leadData.artist_name;
    let computedArtists = leadData.artists;

    if (computedArtists && computedArtists.length > 0) {
      if (!computedArtistName) {
        computedArtistName = computedArtists.map(a => a.artist_name).join(', ');
      }
    } else if (leadData.artist_id) {
      const art = allArtists.find(a => a.id === leadData.artist_id);
      if (art) {
        computedArtistName = art.stage_name;
        computedArtists = [{
          artist_id: art.id,
          artist_name: art.stage_name,
          artist_image: art.profile_image,
          category: art.category,
          genre: art.genre,
          role: 'Headliner'
        }];
      }
    }
    
    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Math.random().toString(36).substr(2, 9),
      source: 'Website Booking Form',
      status: 'Lead Received',
      artist_name: computedArtistName,
      artists: computedArtists,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').insert(newLead).select().single();
      if (!error && data) return data as Lead;
    }

    const leads = await this.getLeads();
    leads.unshift(newLead);
    setStoreValue('st_leads', leads);

    // Auto create system notification for admin & agents
    const talentDisplay = computedArtistName || 'Talent';
    await this.createNotification(
      'usr-admin-1',
      '⚡ New Booking Inquiry Received',
      `New inquiry from ${leadData.contact_name} (${leadData.country}) for ${talentDisplay}. Offer: $${(leadData.budget || 0).toLocaleString()} USD.`
    );
    await this.createNotification(
      'usr-agent-1',
      'New Inquiry Received',
      `New inquiry from ${leadData.contact_name} for ${talentDisplay}.`
    );
    await this.createNotification(
      'all',
      '⚡ New Booking Inquiry',
      `Inquiry from ${leadData.contact_name} for ${talentDisplay}.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('st_new_booking_event', { detail: newLead }));
    }

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

    const primaryArtistImage = (lead.artists && lead.artists[0]?.artist_image) || (artist ? artist.profile_image : '');
    const lineupArtists = lead.artists || (artist ? [{
      artist_id: artist.id,
      artist_name: artist.stage_name,
      artist_image: artist.profile_image,
      category: artist.category,
      genre: artist.genre,
      role: 'Headliner' as const
    }] : []);

    const newBooking: Booking = {
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      artist_id: lead.artist_id || (lead.artists && lead.artists[0]?.artist_id) || '',
      artist_name: lead.artist_name || (lead.artists && lead.artists.map(a => a.artist_name).join(', ')) || '',
      artist_image: primaryArtistImage,
      artists: lineupArtists,
      client_id: lead.client_id || 'cli-generic',
      client_name: lead.company_name ? `${lead.company_name} (${lead.contact_name})` : lead.contact_name,
      client_email: lead.email,
      client_phone: lead.phone,
      event_id: 'evt-' + Math.random().toString(36).substr(2, 9),
      event_title: `Performance by ${lead.artist_name || 'Talent'}`,
      event_date: lead.preferred_date,
      event_venue: 'To Be Decided',
      event_country: lead.country,
      special_requests: lead.details,
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
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(`st_avail_${artistId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
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
    const allMessages = getStoreValue<Message>('st_messages', []);
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
    return allNotifs.filter(n =>
      n.user_id === userId ||
      n.user_id === 'all' ||
      (userId === 'usr-admin-1' && (n.user_id === 'admin' || n.user_id === 'usr-agent-1'))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    await this.createNotification(
      'usr-admin-1',
      '⚡ New Booking Created',
      `Booking logged: ${newBk.event_title} (${newBk.artist_name || 'Lineup'}) on ${newBk.event_date}. Total: $${(newBk.total_amount || 0).toLocaleString()} USD.`
    );
    await this.createNotification(
      'all',
      '⚡ New Booking Created',
      `Booking logged: ${newBk.event_title} (${newBk.artist_name || 'Lineup'}).`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('st_new_booking_event', { detail: newBk }));
    }

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

  // --- HOMEPAGE STATS & MARQUEE CONFIGURATION ---
  async getHomepageConfig(): Promise<HomepageConfig> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('website_sections').select('*').eq('id', 'homepage_config').single();
        if (!error && data?.content) {
          const parsed = JSON.parse(data.content);
          if (parsed && Array.isArray(parsed.stats) && parsed.marquee) {
            return parsed as HomepageConfig;
          }
        }
      } catch {
        // fallback to store
      }
    }
    return getObjectStoreValue<HomepageConfig>('st_homepage_config', SEED_HOMEPAGE_CONFIG);
  },

  async updateHomepageConfig(updates: Partial<HomepageConfig>): Promise<HomepageConfig> {
    const current = await this.getHomepageConfig();
    const updated: HomepageConfig = {
      stats: updates.stats !== undefined ? updates.stats : current.stats,
      marquee: {
        eyebrow: updates.marquee?.eyebrow !== undefined ? updates.marquee.eyebrow : current.marquee.eyebrow,
        items: updates.marquee?.items !== undefined ? updates.marquee.items : current.marquee.items,
      }
    };
    setStoreValue('st_homepage_config', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('website_sections').upsert({
          id: 'homepage_config',
          type: 'features',
          title: 'Homepage Stats & Marquee Configuration',
          content: JSON.stringify(updated),
          active: true,
        });
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('st_homepage_config_updated', { detail: updated }));
    }
    return updated;
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
  },

  // --- SHOW EVENTS ---
  async getEvents(): Promise<ShowEvent[]> {
    return getStoreValue('st_events', SEED_EVENTS);
  },

  async createEvent(evt: Omit<ShowEvent, 'id' | 'created_at'>): Promise<ShowEvent> {
    const events = await this.getEvents();
    const newEvt: ShowEvent = {
      ...evt,
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    events.unshift(newEvt);
    setStoreValue('st_events', events);
    return newEvt;
  },

  async updateEvent(id: string, updates: Partial<ShowEvent>): Promise<ShowEvent> {
    const events = await this.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...updates };
      setStoreValue('st_events', events);
      return events[idx];
    }
    throw new Error('Event not found');
  },

  async deleteEvent(id: string): Promise<boolean> {
    const events = await this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    setStoreValue('st_events', filtered);
    return true;
  },

  // --- BILLING DOCUMENTS (Quotes, Invoices, Receipts, Credit Notes) ---
  async getBillingDocs(): Promise<BillingDoc[]> {
    return getStoreValue('st_billing_docs', SEED_BILLING_DOCS);
  },

  _nextDocNumber(docs: BillingDoc[], type: BillingDocType): string {
    const year = new Date().getFullYear();
    const prefix = `${DOC_PREFIX[type]}-${year}-`;
    const max = docs
      .filter(d => d.number.startsWith(prefix))
      .reduce((m, d) => Math.max(m, parseInt(d.number.slice(prefix.length), 10) || 0), 0);
    return prefix + String(max + 1).padStart(4, '0');
  },

  async createBillingDoc(data: Omit<BillingDoc, 'id' | 'number' | 'created_at' | 'payments'> & { number?: string; payments?: BillingPayment[] }): Promise<BillingDoc> {
    const docs = await this.getBillingDocs();
    const doc: BillingDoc = {
      ...data,
      payments: data.payments || [],
      id: uid('doc'),
      number: data.number?.trim() || this._nextDocNumber(docs, data.type),
      created_at: new Date().toISOString(),
    };
    docs.unshift(doc);
    setStoreValue('st_billing_docs', docs);
    return doc;
  },

  async updateBillingDoc(id: string, updates: Partial<BillingDoc>): Promise<BillingDoc> {
    const docs = await this.getBillingDocs();
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    docs[idx] = { ...docs[idx], ...updates };
    setStoreValue('st_billing_docs', docs);
    return docs[idx];
  },

  async deleteBillingDoc(id: string): Promise<boolean> {
    const docs = await this.getBillingDocs();
    setStoreValue('st_billing_docs', docs.filter(d => d.id !== id));
    return true;
  },

  /** Quote → Invoice. depositPct < 100 raises a deposit invoice instead of the full amount. */
  async convertQuoteToInvoice(quoteId: string, depositPct = 100, dueInDays = 14): Promise<BillingDoc> {
    const docs = await this.getBillingDocs();
    const quote = docs.find(d => d.id === quoteId);
    if (!quote || quote.type !== 'Quote') throw new Error('Quote not found');
    const today = new Date();
    const due = new Date(today.getTime() + dueInDays * 86400000);
    const full = depositPct >= 100;
    const t = docTotals(quote);
    const invoice = await this.createBillingDoc({
      type: 'Invoice',
      status: 'Draft',
      client_name: quote.client_name, client_email: quote.client_email,
      client_company: quote.client_company, client_address: quote.client_address,
      booking_id: quote.booking_id, event_title: quote.event_title, artist_name: quote.artist_name,
      line_items: full
        ? quote.line_items.map(l => ({ ...l, id: uid('li') }))
        : [{ id: uid('li'), description: `${depositPct}% booking deposit for ${quote.event_title || 'event'} (per ${quote.number})`, qty: 1, unit_price: r2(t.total * depositPct / 100) }],
      discount_pct: full ? quote.discount_pct : 0,
      tax_pct: full ? quote.tax_pct : 0,
      currency: quote.currency,
      issue_date: today.toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      notes: quote.notes, terms: quote.terms || DEFAULT_INVOICE_TERMS,
      source_id: quote.id, source_number: quote.number,
    });
    await this.updateBillingDoc(quote.id, { status: 'Accepted', converted_to_id: invoice.id, converted_to_number: invoice.number });
    return invoice;
  },

  /** Records a payment against an invoice and auto-issues a receipt. */
  async recordInvoicePayment(invoiceId: string, p: { amount: number; method: string; date: string; reference?: string; notes?: string }): Promise<{ invoice: BillingDoc; receipt: BillingDoc }> {
    const docs = await this.getBillingDocs();
    const inv = docs.find(d => d.id === invoiceId);
    if (!inv || inv.type !== 'Invoice') throw new Error('Invoice not found');
    const before = docTotals(inv);
    const amount = r2(Math.min(Math.max(p.amount, 0), before.balance));
    if (amount <= 0) throw new Error('Nothing to pay');
    const payment: BillingPayment = { id: uid('pay'), amount, method: p.method, date: p.date, reference: p.reference, notes: p.notes };
    const payments = [...inv.payments, payment];
    const after = docTotals({ ...inv, payments });
    const fully = after.balance <= 0.005;
    const receipt = await this.createBillingDoc({
      type: 'Receipt', status: 'Issued',
      client_name: inv.client_name, client_email: inv.client_email, client_company: inv.client_company,
      booking_id: inv.booking_id, event_title: inv.event_title, artist_name: inv.artist_name,
      line_items: [{ id: uid('li'), description: `Payment received for ${inv.number}${fully ? ' (paid in full)' : ' (partial payment)'}`, qty: 1, unit_price: amount }],
      discount_pct: 0, tax_pct: 0, currency: inv.currency,
      issue_date: p.date, due_date: p.date,
      payments: [payment], source_id: inv.id, source_number: inv.number,
    });
    payment.receipt_id = receipt.id;
    const invoice = await this.updateBillingDoc(inv.id, { payments, status: fully ? 'Paid' : 'Partially Paid' });
    return { invoice, receipt };
  },

  /** Issues a credit note for the full invoice value and voids the invoice. */
  async createCreditNote(invoiceId: string, reason?: string): Promise<BillingDoc> {
    const docs = await this.getBillingDocs();
    const inv = docs.find(d => d.id === invoiceId);
    if (!inv || inv.type !== 'Invoice') throw new Error('Invoice not found');
    const cn = await this.createBillingDoc({
      type: 'Credit Note', status: 'Issued',
      client_name: inv.client_name, client_email: inv.client_email, client_company: inv.client_company,
      booking_id: inv.booking_id, event_title: inv.event_title, artist_name: inv.artist_name,
      line_items: inv.line_items.map(l => ({ ...l, id: uid('li') })),
      discount_pct: inv.discount_pct, tax_pct: inv.tax_pct, currency: inv.currency,
      issue_date: new Date().toISOString().slice(0, 10), due_date: new Date().toISOString().slice(0, 10),
      notes: reason || `Credit issued against ${inv.number}.`,
      source_id: inv.id, source_number: inv.number,
    });
    await this.updateBillingDoc(inv.id, { status: 'Void' });
    return cn;
  },

  async duplicateBillingDoc(id: string): Promise<BillingDoc> {
    const docs = await this.getBillingDocs();
    const d = docs.find(x => x.id === id);
    if (!d) throw new Error('Document not found');
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + (d.type === 'Quote' ? 30 : 14) * 86400000).toISOString().slice(0, 10);
    return this.createBillingDoc({
      ...d, status: 'Draft', payments: [], issue_date: today, due_date: due,
      line_items: d.line_items.map(l => ({ ...l, id: uid('li') })),
      source_id: undefined, source_number: undefined, converted_to_id: undefined, converted_to_number: undefined, sent_at: undefined,
    });
  },

  // --- SYSTEM BACKUP & RESTORE ---
  exportSystemBackup(): string {
    if (typeof window === 'undefined') return '{}';
    const backupKeys = [
      'st_users', 'st_artists_v2', 'st_leads', 'st_bookings', 'st_contracts',
      'st_invoices', 'st_tasks', 'st_notifs', 'st_venues', 'st_customers',
      'st_ticket_tiers', 'st_promo_codes', 'st_campaigns', 'st_ad_placements',
      'st_website_sections', 'st_integrations', 'st_events', 'st_settings_domain',
      'st_settings_currency', 'st_settings_policy'
    ];
    const data: Record<string, unknown> = {
      _meta: {
        system: 'Showtime Entertainment Services',
        version: '2026.4',
        timestamp: new Date().toISOString(),
      }
    };
    backupKeys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) {
        try {
          data[k] = JSON.parse(v);
        } catch {
          data[k] = v;
        }
      }
    });
    return JSON.stringify(data, null, 2);
  },

  importSystemBackup(jsonString: string): { success: boolean; recordsRestored: number; error?: string } {
    if (typeof window === 'undefined') return { success: false, recordsRestored: 0, error: 'No browser window' };
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, recordsRestored: 0, error: 'Invalid JSON backup payload' };
      }
      let count = 0;
      Object.keys(data).forEach(k => {
        if (k.startsWith('st_')) {
          const val = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
          localStorage.setItem(k, val);
          count++;
        }
      });
      return { success: true, recordsRestored: count };
    } catch (err: unknown) {
      return { success: false, recordsRestored: 0, error: (err as Error).message || 'Failed to parse JSON' };
    }
  }
};
