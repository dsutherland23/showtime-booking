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

function parseD1ArtistRow(row: any) {
  if (!row) return null;
  const parsed = { ...row };
  const jsonFields = ['socials', 'media', 'showcase_tracks', 'blocked_dates', 'extra_json'];
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {}
    }
  }
  if (!Array.isArray(parsed.media)) parsed.media = [];
  if (!Array.isArray(parsed.showcase_tracks)) parsed.showcase_tracks = [];
  if (!Array.isArray(parsed.blocked_dates)) parsed.blocked_dates = [];
  if (typeof parsed.socials !== 'object' || parsed.socials === null || Array.isArray(parsed.socials)) parsed.socials = {};
  if (parsed.is_featured !== undefined) parsed.is_featured = Boolean(parsed.is_featured);
  if (parsed.estimated_fee !== undefined && parsed.estimated_fee !== null) parsed.estimated_fee = Number(parsed.estimated_fee);
  if (parsed.cover_zoom !== undefined && parsed.cover_zoom !== null) parsed.cover_zoom = Number(parsed.cover_zoom);
  if (parsed.extra_json && typeof parsed.extra_json === 'object') {
    Object.assign(parsed, parsed.extra_json);
  }
  return parsed;
}

export const d1 = {
  // --- ARTISTS ---
  async getArtists() {
    const rows = await executeD1Query('SELECT * FROM artists ORDER BY is_featured DESC, stage_name ASC');
    return rows.map(parseD1ArtistRow);
  },

  async getArtistById(id: string) {
    const res = await executeD1Query('SELECT * FROM artists WHERE id = ? LIMIT 1', [id]);
    return res[0] ? parseD1ArtistRow(res[0]) : null;
  },

  async updateArtistProfile(id: string, updates: Record<string, any>) {
    const existing = await this.getArtistById(id);
    if (!existing) throw new Error('Artist not found in D1');

    const allowedColumns = [
      'stage_name', 'legal_name', 'category', 'genre', 'bio', 'location',
      'estimated_fee', 'price_tier', 'profile_image', 'cover_image',
      'cover_position', 'cover_zoom', 'booking_status', 'availability_status',
      'manager_id', 'socials', 'media', 'technical_rider', 'hospitality_rider',
      'is_featured', 'showcase_tracks', 'featured_youtube_url', 'blocked_dates',
      'extra_json'
    ];

    const setClauses: string[] = [];
    const params: any[] = [];
    const extraFields: Record<string, any> = {};

    for (const [key, rawVal] of Object.entries(updates)) {
      if (key === 'id') continue;
      if (allowedColumns.includes(key)) {
        let val = rawVal;
        if (['socials', 'media', 'showcase_tracks', 'blocked_dates', 'extra_json'].includes(key)) {
          val = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal);
        } else if (key === 'is_featured') {
          val = rawVal ? 1 : 0;
        }
        setClauses.push(`${key} = ?`);
        params.push(val);
      } else {
        extraFields[key] = rawVal;
      }
    }

    if (Object.keys(extraFields).length > 0) {
      const currentExtra = existing.extra_json ? (typeof existing.extra_json === 'string' ? JSON.parse(existing.extra_json) : existing.extra_json) : {};
      const combinedExtra = { ...currentExtra, ...extraFields };
      setClauses.push('extra_json = ?');
      params.push(JSON.stringify(combinedExtra));
    }

    if (setClauses.length > 0) {
      params.push(id);
      const sql = `UPDATE artists SET ${setClauses.join(', ')} WHERE id = ?`;
      await executeD1Query(sql, params);
    }

    return this.getArtistById(id);
  },

  // --- SITE STORE (CROSS-DEVICE SYNC) ---
  async getAllStores() {
    const rows = await executeD1Query('SELECT key, value, updated_at FROM site_store');
    const stores: Record<string, any> = {};
    for (const row of rows) {
      if (!row.key) continue;
      try {
        stores[row.key] = JSON.parse(row.value);
      } catch {
        stores[row.key] = row.value;
      }
    }
    return stores;
  },

  async getStore(key: string) {
    const rows = await executeD1Query('SELECT value FROM site_store WHERE key = ? LIMIT 1', [key]);
    if (!rows[0] || !rows[0].value) return null;
    try {
      return JSON.parse(rows[0].value);
    } catch {
      return rows[0].value;
    }
  },

  async setStore(key: string, value: any) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    await executeD1Query(
      'INSERT INTO site_store (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, strVal]
    );
    return value;
  },

  async setStoreBatch(entries: Record<string, any>) {
    if (!entries || typeof entries !== 'object') return { success: false };
    for (const [k, v] of Object.entries(entries)) {
      if (!k) continue;
      await this.setStore(k, v);
    }
    return { success: true, count: Object.keys(entries).length };
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
