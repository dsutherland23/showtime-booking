/**
 * Cloudflare D1 Client Adapter for Showtime Booking Agency
 * Connects directly to Cloudflare D1 database: showtime-booking-db (UUID: 774fe766-2ed6-48e4-b1bb-535a76b7cf39)
 */

export interface D1QueryResponse<T = any> {
  results: T[];
  success: boolean;
  meta: any;
}

const ACCOUNT_ID = 'df4dfe0ec35e0d41666c57de349dee65';
const DATABASE_ID = '774fe766-2ed6-48e4-b1bb-535a76b7cf39';
// Read from environment variable
const API_TOKEN = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';

export async function executeD1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // If running inside Cloudflare Pages/Worker environment with native binding
  if (typeof (globalThis as any).DB !== 'undefined') {
    const stmt = (globalThis as any).DB.prepare(sql).bind(...params);
    const { results } = await stmt.all();
    return results as T[];
  }

  // REST API fallback for Node/Edge runtime
  if (!API_TOKEN) {
    console.warn('[D1] No Cloudflare API token provided; using local fallback.');
    return [];
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`D1 Query failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (!data.success || !data.result?.[0]?.results) {
    throw new Error(`D1 Query execution error: ${JSON.stringify(data.errors)}`);
  }

  return data.result[0].results as T[];
}

export const d1 = {
  // --- ARTISTS ---
  async getArtists() {
    return executeD1Query('SELECT * FROM artists ORDER BY is_featured DESC, stage_name ASC');
  },

  async getArtistById(id: string) {
    const res = await executeD1Query('SELECT * FROM artists WHERE id = ? LIMIT 1', [id]);
    return res[0] || null;
  },

  // --- LEADS ---
  async getLeads() {
    return executeD1Query('SELECT * FROM leads ORDER BY created_at DESC');
  },

  async createLead(lead: any) {
    const sql = `
      INSERT INTO leads (
        id, client_id, company_name, contact_name, email, phone, country,
        source, status, assigned_to, details, budget, preferred_date, artist_id, artist_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      lead.id || 'lead-' + Math.random().toString(36).substring(2, 9),
      lead.client_id || null,
      lead.company_name || null,
      lead.contact_name,
      lead.email,
      lead.phone || null,
      lead.country || '',
      lead.source || 'Website Booking Form',
      lead.status || 'Lead Received',
      lead.assigned_to || null,
      lead.details || '',
      lead.budget || 0,
      lead.preferred_date || '',
      lead.artist_id || null,
      lead.artist_name || null,
    ];
    await executeD1Query(sql, params);
    return lead;
  },

  // --- BOOKINGS ---
  async getBookings() {
    return executeD1Query('SELECT * FROM bookings ORDER BY created_at DESC');
  },

  async createBooking(b: any) {
    const sql = `
      INSERT INTO bookings (
        id, artist_id, artist_name, artist_image, client_id, client_name,
        event_id, event_title, event_date, event_venue, event_country,
        status, deposit_amount, total_amount, contract_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      b.id || 'bk-' + Math.random().toString(36).substring(2, 9),
      b.artist_id,
      b.artist_name,
      b.artist_image,
      b.client_id,
      b.client_name,
      b.event_id || '',
      b.event_title || '',
      b.event_date || '',
      b.event_venue || '',
      b.event_country || '',
      b.status || 'Inquiry',
      b.deposit_amount || 0,
      b.total_amount || 0,
      b.contract_id || null,
    ];
    await executeD1Query(sql, params);
    return b;
  },

  // --- USERS & AUTH ---
  async getUserByEmail(email: string) {
    const res = await executeD1Query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return res[0] || null;
  },

  async createUser(user: any) {
    const sql = `
      INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      user.id || 'usr-' + Math.random().toString(36).substring(2, 9),
      user.first_name,
      user.last_name,
      user.email,
      user.password_hash || null,
      user.phone || null,
      user.role || 'Client',
      user.status || 'Active',
    ];
    await executeD1Query(sql, params);
    return user;
  },

  async createSession(userId: string, token: string, expiresAt: string) {
    const sql = 'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)';
    await executeD1Query(sql, ['sess-' + Math.random().toString(36).substring(2, 9), userId, token, expiresAt]);
  },

  async getSession(token: string) {
    const sql = `
      SELECT s.*, u.first_name, u.last_name, u.email, u.role, u.status, u.phone
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
      LIMIT 1
    `;
    const res = await executeD1Query(sql, [token]);
    return res[0] || null;
  },

  async deleteSession(token: string) {
    await executeD1Query('DELETE FROM sessions WHERE token = ?', [token]);
  },
};
