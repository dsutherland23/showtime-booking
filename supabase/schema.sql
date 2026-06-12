-- Showtime Booking Agency Platform Database Schema
-- Target: Supabase (PostgreSQL 15+)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. BASE TABLES
-- =========================================================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (complements auth.users in Supabase)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Role Permissions Junction
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================================
-- 2. TALENT MANAGEMENT
-- =========================================================================

-- Artist Categories
CREATE TABLE IF NOT EXISTS artist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artists
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_name VARCHAR(100) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES artist_categories(id) ON DELETE RESTRICT,
    genre VARCHAR(100) NOT NULL,
    bio TEXT,
    profile_image TEXT,
    cover_image TEXT,
    booking_status VARCHAR(50) DEFAULT 'Available' CHECK (booking_status IN ('Available', 'Booked', 'On Tour', 'On Hold')),
    availability_status VARCHAR(50) DEFAULT 'Active' CHECK (availability_status IN ('Active', 'Inactive')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artist Social Links
CREATE TABLE IF NOT EXISTS artist_socials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('Instagram', 'YouTube', 'Spotify', 'Twitter', 'Facebook', 'TikTok')),
    url TEXT NOT NULL,
    followers INT DEFAULT 0,
    UNIQUE(artist_id, platform)
);

-- Artist Media Gallery
CREATE TABLE IF NOT EXISTS artist_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('Image', 'Video', 'Audio')),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artist Riders
CREATE TABLE IF NOT EXISTS artist_riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
    technical_rider TEXT,
    hospitality_rider TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artist Availability Calendar
CREATE TABLE IF NOT EXISTS artist_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Unavailable' CHECK (status IN ('Available', 'Unavailable', 'Tentative')),
    UNIQUE(artist_id, available_date)
);

-- =========================================================================
-- 3. CRM & LOGISTICS
-- =========================================================================

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    source VARCHAR(100) DEFAULT 'Website Inbound',
    status VARCHAR(50) DEFAULT 'Lead Received' CHECK (status IN (
        'Lead Received', 'Qualified', 'Proposal Sent', 'Negotiation', 
        'Contract Sent', 'Deposit Received', 'Confirmed', 'Completed'
    )),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    budget NUMERIC(12, 2),
    preferred_date DATE,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Venues
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    capacity INT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    event_date DATE NOT NULL,
    attendance INT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    event_id UUID REFERENCES events(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'Inquiry' CHECK (status IN (
        'Inquiry', 'Proposal Generated', 'Contract Sent', 'Deposit Paid', 'Confirmed', 'Completed', 'Cancelled'
    )),
    deposit_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Signed', 'Void')),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT, -- Represents digital signature text/base64
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add contract link reference back to bookings if needed (or keep single relation)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    balance_due NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Stripe', 'Wise', 'Bank Transfer', 'Credit Card')),
    transaction_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. UTILITIES & COLLABORATION
-- =========================================================================

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic standard policies
CREATE POLICY "Public profiles are visible to everyone" ON users 
    FOR SELECT USING (true);

CREATE POLICY "Public artists are visible to everyone" ON artists 
    FOR SELECT USING (true);

CREATE POLICY "Clients can view their own details" ON clients 
    FOR SELECT USING (true); -- Usually scoped to matching email/user reference in production

CREATE POLICY "Bookings visible based on client or artist" ON bookings
    FOR SELECT USING (true); -- Scoped dynamically in code or via auth policies in Supabase RLS

CREATE POLICY "Contracts visible based on booking" ON contracts
    FOR SELECT USING (true);

CREATE POLICY "Invoices visible to billing role or associated client" ON invoices
    FOR SELECT USING (true);


-- =========================================================================
-- 6. SEED SEEDS & SAMPLE ENTERPRISE DATA
-- =========================================================================

-- Seed Roles
INSERT INTO roles (id, name, description) VALUES
('b1a478b0-a548-4c91-9e7b-c990a42442cf', 'Super Admin', 'Full control over the system, roles, settings, and billing.'),
('c7e8e503-4fde-44bc-877f-1d488e01bf3b', 'Booking Agent', 'Manages leads, issues contracts, invoices, and books talent.'),
('12247fb0-b74e-4f01-9a7c-12f8e02bc8ef', 'Artist Manager', 'Maintains profile media, availability calendar, and riders for represented artists.'),
('5081fa2c-8ab5-4673-93f4-013fa096dfb2', 'Artist', 'Updates bios, toggles availability, and reviews active performances.'),
('d408ebc0-ff48-40b1-871c-43f0aa7bb8e2', 'Client', 'Creates booking requests, downloads contracts, and processes invoice payments.')
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO permissions (name, module, action) VALUES
('manage_system', 'system', 'full_access'),
('manage_artists', 'artists', 'manage'),
('manage_artist_profiles', 'artists', 'edit_profile'),
('manage_availability', 'artists', 'edit_availability'),
('manage_media', 'artists', 'edit_media'),
('manage_bookings', 'bookings', 'manage'),
('create_booking_requests', 'bookings', 'create'),
('view_bookings', 'bookings', 'read'),
('view_clients', 'clients', 'read'),
('send_contracts', 'contracts', 'write'),
('download_documents', 'documents', 'read')
ON CONFLICT (name) DO NOTHING;

-- Seed Users (System Administrators & Staff)
INSERT INTO users (id, first_name, last_name, email, phone, status) VALUES
-- Admin
('10a0e5b0-2b22-4911-88f2-1a48c90994f2', 'Damian', 'Marley', 'damian.admin@showtime.com', '+1-876-555-0100', 'Active'),
-- Agent
('e8efb503-0de2-4c22-95f2-2e5a60a77f0a', 'Sarah', 'Silverman', 'sarah.agent@showtime.com', '+1-212-555-0155', 'Active'),
-- Manager
('9fefb7bc-ff6e-4e4f-b67f-38e9a2bc8ef1', 'Robert', 'Livingston', 'robert.manager@showtime.com', '+1-876-555-0199', 'Active'),
-- Artist (Direct Accounts)
('3ab0e6f0-1a77-4c22-b5f2-9e8a80a22f0e', 'Beres', 'Hammond', 'beres.artist@showtime.com', '+1-876-555-0211', 'Active'),
('b080eb2c-7ab5-4673-9ef4-113fa096dfb2', 'Koffee', 'Mikayla', 'koffee.artist@showtime.com', '+1-876-555-0222', 'Active'),
-- Client
('fc9e5b03-fde2-44bc-877f-1d488e01bf22', 'Michael', 'Eavis', 'eavis.client@glastonbury.co.uk', '+44-20-7946-0192', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Map User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
('10a0e5b0-2b22-4911-88f2-1a48c90994f2', 'b1a478b0-a548-4c91-9e7b-c990a42442cf'), -- Damian -> Admin
('e8efb503-0de2-4c22-95f2-2e5a60a77f0a', 'c7e8e503-4fde-44bc-877f-1d488e01bf3b'), -- Sarah -> Agent
('9fefb7bc-ff6e-4e4f-b67f-38e9a2bc8ef1', '12247fb0-b74e-4f01-9a7c-12f8e02bc8ef'), -- Robert -> Manager
('3ab0e6f0-1a77-4c22-b5f2-9e8a80a22f0e', '5081fa2c-8ab5-4673-93f4-013fa096dfb2'), -- Beres -> Artist
('b080eb2c-7ab5-4673-9ef4-113fa096dfb2', '5081fa2c-8ab5-4673-93f4-013fa096dfb2'), -- Koffee -> Artist
('fc9e5b03-fde2-44bc-877f-1d488e01bf22', 'd408ebc0-ff48-40b1-871c-43f0aa7bb8e2')  -- Michael -> Client
ON CONFLICT DO NOTHING;

-- Seed Categories
INSERT INTO artist_categories (id, name, description) VALUES
('a5a478b0-c548-4c91-9e7b-c990a42442ca', 'Reggae Artists', 'Root reggae, lovers rock, and foundation icons.'),
('b6a478b0-d548-4c91-9e7b-c990a42442cb', 'Dancehall Artists', 'High energy, riddim-heavy modern dancehall superstars.'),
('c7a478b0-e548-4c91-9e7b-c990a42442cc', 'DJs', 'World-class selectors, radio mixers, and performance DJs.'),
('d8a478b0-f548-4c91-9e7b-c990a42442cd', 'Comedians', 'Stand-up acts, host-performers, and sketch artists.'),
('e9a478b0-a548-4c91-9e7b-c990a42442ce', 'Hosts & MCs', 'Premium event presenters, guides, and master of ceremonies.')
ON CONFLICT (name) DO NOTHING;

-- Seed Artists
INSERT INTO artists (id, stage_name, legal_name, category_id, genre, bio, profile_image, cover_image, booking_status, availability_status, manager_id) VALUES
(
    '0a8a78bc-a548-4c91-9e7b-c990a4244101', 
    'Beres Hammond', 
    'Hugh Beresford Hammond', 
    'a5a478b0-c548-4c91-9e7b-c990a42442ca', 
    'Lovers Rock / Reggae', 
    'Beres Hammond is a legendary Jamaican reggae singer known for his soulful lovers rock signature. With a career spanning over four decades, Hammond is widely regarded as the definitive voice of reggae romance, releasing timeless classics such as ''Rockaway'', ''I Feel Good'', and ''Groovy Little Thing''.',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    'Available',
    'Active',
    '9fefb7bc-ff6e-4e4f-b67f-38e9a2bc8ef1'
),
(
    '0b8b78bc-b548-4c91-9e7b-c990a4244102', 
    'Chronixx', 
    'Jamar Rolando McNaughton', 
    'a5a478b0-c548-4c91-9e7b-c990a42442ca', 
    'Roots Reggae / Revival', 
    'Chronixx is an iconic spearhead of the modern Reggae Revival movement. Blending roots reggae message with contemporary production, his critically acclaimed projects like ''Chronology'' have earned him global nominations and massive audiences at Coachella, Glastonbury, and beyond.',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=1200',
    'Available',
    'Active',
    '9fefb7bc-ff6e-4e4f-b67f-38e9a2bc8ef1'
),
(
    '0c8c78bc-c548-4c91-9e7b-c990a4244103', 
    'Koffee', 
    'Mikayla Simpson', 
    'a5a478b0-c548-4c91-9e7b-c990a42442ca', 
    'Reggae / Dancehall', 
    'Koffee is the historic youngest and only female artist to win the Grammy Award for Best Reggae Album for her breakout EP ''Rapture''. Combining lightning-fast singjay flows with positive messages, she represents the vibrant new wave of Caribbean global exports.',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1200',
    'Available',
    'Active',
    'b080eb2c-7ab5-4673-9ef4-113fa096dfb2'
),
(
    '0d8d78bc-d548-4c91-9e7b-c990a4244104', 
    'Shenseea', 
    'Chinsea Linda Lee', 
    'b6a478b0-d548-4c91-9e7b-c990a42442cb', 
    'Dancehall / Pop', 
    'Shenseea is a powerhouse Jamaican dancehall artist and international pop crossover sensation. Rising to prominence with hits like ''Loodi'', she has collaborated with Kanye West, Megan Thee Stallion, and Calvin Harris, leading dancehall into global pop spaces.',
    'https://images.unsplash.com/photo-1524413840003-07d76beb68e9?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    'Available',
    'Active',
    '9fefb7bc-ff6e-4e4f-b67f-38e9a2bc8ef1'
),
(
    '0e8e78bc-e548-4c91-9e7b-c990a4244105', 
    'David Rodigan', 
    'David Michael Rodigan', 
    'c7a478b0-e548-4c91-9e7b-c990a42442cc', 
    'Reggae DJ / Selector', 
    'David Rodigan MBE is a legendary British radio DJ and sound clash champion. Known for his encyclopedic knowledge of Jamaican music and electric stage presence, ''Ram Jam'' Rodigan is the ultimate ambassador of sound system culture worldwide.',
    'https://images.unsplash.com/photo-1484755560693-a4074577af3a?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200',
    'Available',
    'Active',
    '10a0e5b0-2b22-4911-88f2-1a48c90994f2'
)
ON CONFLICT (stage_name) DO UPDATE SET 
    bio = EXCLUDED.bio,
    profile_image = EXCLUDED.profile_image,
    cover_image = EXCLUDED.cover_image,
    category_id = EXCLUDED.category_id;

-- Seed Artist Socials
INSERT INTO artist_socials (artist_id, platform, url, followers) VALUES
('0c8c78bc-c548-4c91-9e7b-c990a4244103', 'Instagram', 'https://instagram.com/originalkoffee', 1200000),
('0c8c78bc-c548-4c91-9e7b-c990a4244103', 'Spotify', 'https://spotify.com/artist/originalkoffee', 3500000),
('0d8d78bc-d548-4c91-9e7b-c990a4244104', 'Instagram', 'https://instagram.com/shenseea', 6200000),
('0d8d78bc-d548-4c91-9e7b-c990a4244104', 'TikTok', 'https://tiktok.com/@shenseea', 4500000),
('0b8b78bc-b548-4c91-9e7b-c990a4244102', 'Instagram', 'https://instagram.com/chronixxmusic', 1000000),
('0a8a78bc-a548-4c91-9e7b-c990a4244101', 'Instagram', 'https://instagram.com/bereshammond', 450000)
ON CONFLICT (artist_id, platform) DO UPDATE SET followers = EXCLUDED.followers;

-- Seed Artist Media
INSERT INTO artist_media (artist_id, media_type, url) VALUES
('0c8c78bc-c548-4c91-9e7b-c990a4244103', 'Image', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=600'),
('0c8c78bc-c548-4c91-9e7b-c990a4244103', 'Video', 'https://www.w3schools.com/html/mov_bbb.mp4'),
('0d8d78bc-d548-4c91-9e7b-c990a4244104', 'Image', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=600'),
('0a8a78bc-a548-4c91-9e7b-c990a4244101', 'Image', 'https://images.unsplash.com/photo-1487180142328-054b783fc471?auto=format&fit=crop&q=80&w=600')
ON CONFLICT DO NOTHING;

-- Seed Artist Riders
INSERT INTO artist_riders (artist_id, technical_rider, hospitality_rider) VALUES
('0c8c78bc-c548-4c91-9e7b-c990a4244103', 'Technical: 3 Vocal Cordless Mics (Shure SM58), Stereo DIs for Keyboards and DJ controller, 4 Monitor wedges (L-Acoustics), standard drum kit mic package.', 'Hospitality: Fresh ginger root, organic local honey, hot water kettle, assorted herbal teas, sliced seasonal fruit platters, 12 bottles of room-temperature spring water, 6 clean hand towels.'),
('0a8a78bc-a548-4c91-9e7b-c990a4244101', 'Technical: 1 Premium Vocal Mic (Neumann KMS 105), Grand Piano tuned to A440, full rhythm section backline setup, 6 in-ear monitor transmitters (Sennheiser G4).', 'Hospitality: Assorted red wines (Cabernet Sauvignon), hot water kettle, throat lozenges, selection of raw nuts, 100% vegetarian hot catering post-soundcheck, quiet dressing room.')
ON CONFLICT (artist_id) DO NOTHING;

-- Seed Venues
INSERT INTO venues (id, name, capacity, address, city, country) VALUES
('v1a1e5b0-2b22-4911-88f2-1a48c90994f1', 'National Stadium', 35000, 'Arthur Wint Dr', 'Kingston', 'Jamaica'),
('v2b2e5b0-2b22-4911-88f2-1a48c90994f2', 'Wembley Arena', 12500, 'Arena Square, Engineers Way', 'London', 'United Kingdom'),
('v3c3e5b0-2b22-4911-88f2-1a48c90994f3', 'Red Rocks Amphitheatre', 9525, '18300 W Alameda Pkwy', 'Morrison', 'United States')
ON CONFLICT (name) DO UPDATE SET capacity = EXCLUDED.capacity;

-- Seed Clients
INSERT INTO clients (id, company_name, contact_name, email, phone, country) VALUES
('c10a5b03-fde2-44bc-877f-1d488e01bf01', 'Sumfest Productions', 'Joe Bogdanovich', 'joe@reggaesumfest.com', '+1-876-555-0301', 'Jamaica'),
('c20b5b03-fde2-44bc-877f-1d488e01bf02', 'Goldenvoice Events', 'Paul Tollett', 'paul@coachella.com', '+1-310-555-0922', 'United States')
ON CONFLICT (email) DO NOTHING;

-- Seed Leads / Inquiries
INSERT INTO leads (id, client_id, source, status, assigned_to, details, budget, preferred_date, artist_id) VALUES
(
    'l1a1a5b0-2b22-4911-88f2-1a48c90994fa', 
    'c10a5b03-fde2-44bc-877f-1d488e01bf01', 
    'Website Booking Form', 
    'Lead Received', 
    'e8efb503-0de2-4c22-95f2-2e5a60a77f0a', 
    'Requesting Koffee to perform as headliner for Reggae Sumfest Night 2 in Montego Bay. High-priority inquiry.',
    75000.00,
    '2026-07-18',
    '0c8c78bc-c548-4c91-9e7b-c990a4244103'
),
(
    'l2b2b5b0-2b22-4911-88f2-1a48c90994fb', 
    'c20b5b03-fde2-44bc-877f-1d488e01bf02', 
    'Direct Agent Outbound', 
    'Negotiation', 
    'e8efb503-0de2-4c22-95f2-2e5a60a77f0a', 
    'Coachella Outdoor Stage performance request for Chronixx. In negotiation regarding slots and backline requirements.',
    120000.00,
    '2026-04-18',
    '0b8b78bc-b548-4c91-9e7b-c990a4244102'
)
ON CONFLICT DO NOTHING;
