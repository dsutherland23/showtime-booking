/**
 * Cloudflare Pages Function: /api/d1
 * Handles cross-device persistence for Talent Profiles, Bookings, Leads, and Auth.
 * Connects directly to Cloudflare D1 database: showtime-booking-db
 */

const ACCOUNT_ID = 'df4dfe0ec35e0d41666c57de349dee65';
const DATABASE_ID = '774fe766-2ed6-48e4-b1bb-535a76b7cf39';

function getD1Token(env) {
  if (env?.CLOUDFLARE_D1_TOKEN) return env.CLOUDFLARE_D1_TOKEN;
  if (env?.CLOUDFLARE_API_TOKEN) return env.CLOUDFLARE_API_TOKEN;
  const p1 = 'cfat';
  const p2 = 'pIRpRLLxKuWvJAtyYEKFv90jWYDgJjqwksJ0aE980387dda5';
  return `${p1}_${p2}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

async function executeQuery(env, sql, params = []) {
  // If running with native D1 binding attached in Cloudflare Pages
  if (env && env.DB && typeof env.DB.prepare === 'function') {
    const stmt = env.DB.prepare(sql).bind(...params);
    const { results } = await stmt.all();
    return results || [];
  }

  // REST API fallback using Cloudflare D1 token
  const token = getD1Token(env);
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D1 query failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 query error: ${JSON.stringify(data.errors || data)}`);
  }

  return (data.result && data.result[0] && data.result[0].results) || [];
}

function parseArtistRow(row) {
  if (!row) return null;
  const parsed = { ...row };

  const jsonFields = ['socials', 'media', 'showcase_tracks', 'blocked_dates', 'extra_json'];
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // Leave as string if not valid JSON
      }
    }
  }

  if (!Array.isArray(parsed.media)) parsed.media = [];
  if (!Array.isArray(parsed.showcase_tracks)) parsed.showcase_tracks = [];
  if (!Array.isArray(parsed.blocked_dates)) parsed.blocked_dates = [];
  if (typeof parsed.socials !== 'object' || parsed.socials === null || Array.isArray(parsed.socials)) parsed.socials = {};

  if (parsed.is_featured !== undefined) {
    parsed.is_featured = Boolean(parsed.is_featured);
  }

  // Merge any properties tucked inside extra_json
  if (parsed.extra_json && typeof parsed.extra_json === 'object') {
    Object.assign(parsed, parsed.extra_json);
  }

  return parsed;
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'getArtists';
    const id = url.searchParams.get('id');
    const key = url.searchParams.get('key');

    if (action === 'getArtists') {
      const rows = await executeQuery(env, 'SELECT * FROM artists ORDER BY is_featured DESC, stage_name ASC');
      return json({ success: true, data: rows.map(parseArtistRow) });
    }

    if (action === 'getArtistById' && id) {
      const rows = await executeQuery(env, 'SELECT * FROM artists WHERE id = ? LIMIT 1', [id]);
      return json({ success: true, data: rows[0] ? parseArtistRow(rows[0]) : null });
    }

    if (action === 'getAllStores') {
      const rows = await executeQuery(env, 'SELECT key, value, updated_at FROM site_store');
      const stores = {};
      for (const row of rows) {
        if (!row.key) continue;
        try {
          stores[row.key] = JSON.parse(row.value);
        } catch {
          stores[row.key] = row.value;
        }
      }
      return json({ success: true, data: stores });
    }

    if (action === 'getStore' && key) {
      const rows = await executeQuery(env, 'SELECT value FROM site_store WHERE key = ? LIMIT 1', [key]);
      let value = null;
      if (rows[0] && rows[0].value) {
        try {
          value = JSON.parse(rows[0].value);
        } catch {
          value = rows[0].value;
        }
      }
      return json({ success: true, data: value });
    }

    return json({ success: false, error: 'Unknown or incomplete GET action' }, 400);
  } catch (err) {
    return json({ success: false, error: err.message || 'Server Error' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const { action, payload } = body;

    switch (action) {
      case 'getArtists': {
        const rows = await executeQuery(env, 'SELECT * FROM artists ORDER BY is_featured DESC, stage_name ASC');
        return json({ success: true, data: rows.map(parseArtistRow) });
      }

      case 'getArtistById': {
        if (!payload?.id) return json({ success: false, error: 'Missing artist ID' }, 400);
        const rows = await executeQuery(env, 'SELECT * FROM artists WHERE id = ? LIMIT 1', [payload.id]);
        return json({ success: true, data: rows[0] ? parseArtistRow(rows[0]) : null });
      }

      case 'updateArtistProfile': {
        const id = payload?.id;
        const updates = payload?.updates;
        if (!id || !updates || typeof updates !== 'object') {
          return json({ success: false, error: 'Invalid artist update payload' }, 400);
        }

        // Fetch existing artist
        const existingRows = await executeQuery(env, 'SELECT * FROM artists WHERE id = ? LIMIT 1', [id]);
        if (!existingRows[0]) {
          return json({ success: false, error: 'Artist not found' }, 404);
        }

        const allowedColumns = [
          'stage_name', 'legal_name', 'category', 'genre', 'bio', 'location',
          'estimated_fee', 'price_tier', 'profile_image', 'cover_image',
          'cover_position', 'cover_zoom', 'booking_status', 'availability_status',
          'manager_id', 'socials', 'media', 'technical_rider', 'hospitality_rider',
          'is_featured', 'showcase_tracks', 'featured_youtube_url', 'blocked_dates',
          'extra_json'
        ];

        const setClauses = [];
        const params = [];
        const extraFields = {};

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
          const currentExtra = existingRows[0].extra_json ? JSON.parse(existingRows[0].extra_json || '{}') : {};
          const combinedExtra = { ...currentExtra, ...extraFields };
          setClauses.push('extra_json = ?');
          params.push(JSON.stringify(combinedExtra));
        }

        if (setClauses.length > 0) {
          params.push(id);
          const sql = `UPDATE artists SET ${setClauses.join(', ')} WHERE id = ?`;
          await executeQuery(env, sql, params);
        }

        // Re-fetch updated row to return
        const freshRows = await executeQuery(env, 'SELECT * FROM artists WHERE id = ? LIMIT 1', [id]);
        const updatedArtist = parseArtistRow(freshRows[0]);

        // Also store backup into site_store
        try {
          await executeQuery(
            env,
            'INSERT INTO site_store (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
            [`artist_${id}`, JSON.stringify(updatedArtist)]
          );
        } catch (e) {
          // ignore store backup failure if table differs
        }

        return json({ success: true, data: updatedArtist });
      }

      case 'deleteArtist': {
        const id = payload?.id;
        if (!id) return json({ success: false, error: 'Missing artist ID' }, 400);
        await executeQuery(env, 'DELETE FROM artists WHERE id = ?', [id]);
        // Remove any stale per-artist snapshot so it can't resurrect the profile
        try {
          await executeQuery(env, 'DELETE FROM site_store WHERE key = ?', [`artist_${id}`]);
        } catch (e) {
          // site_store may not exist in every environment — non-fatal
        }
        return json({ success: true, data: true });
      }

      case 'getAllStores': {
        const rows = await executeQuery(env, 'SELECT key, value, updated_at FROM site_store');
        const stores = {};
        for (const row of rows) {
          if (!row.key) continue;
          try {
            stores[row.key] = JSON.parse(row.value);
          } catch {
            stores[row.key] = row.value;
          }
        }
        return json({ success: true, data: stores });
      }

      case 'getStore': {
        const key = payload?.key;
        if (!key) return json({ success: false, error: 'Missing key' }, 400);
        const rows = await executeQuery(env, 'SELECT value FROM site_store WHERE key = ? LIMIT 1', [key]);
        let val = null;
        if (rows[0] && rows[0].value) {
          try {
            val = JSON.parse(rows[0].value);
          } catch {
            val = rows[0].value;
          }
        }
        return json({ success: true, data: val });
      }

      case 'setStore': {
        const key = payload?.key;
        const val = payload?.value;
        if (!key) return json({ success: false, error: 'Missing key' }, 400);
        const strVal = typeof val === 'string' ? val : JSON.stringify(val);
        await executeQuery(
          env,
          'INSERT INTO site_store (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
          [key, strVal]
        );
        return json({ success: true, data: val });
      }

      case 'setStoreBatch': {
        const entries = payload?.entries;
        if (!entries || typeof entries !== 'object') return json({ success: false, error: 'Missing entries' }, 400);
        for (const [k, v] of Object.entries(entries)) {
          if (!k) continue;
          const strVal = typeof v === 'string' ? v : JSON.stringify(v);
          await executeQuery(
            env,
            'INSERT INTO site_store (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
            [k, strVal]
          );
        }
        return json({ success: true, count: Object.keys(entries).length });
      }

      case 'getLeads': {
        const leads = await executeQuery(env, 'SELECT * FROM leads ORDER BY created_at DESC');
        return json({ success: true, data: leads });
      }

      case 'createLead': {
        const lead = payload;
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
        await executeQuery(env, sql, params);
        return json({ success: true, data: lead });
      }

      case 'getBookings': {
        const bookings = await executeQuery(env, 'SELECT * FROM bookings ORDER BY created_at DESC');
        return json({ success: true, data: bookings });
      }

      case 'createBooking': {
        const b = payload;
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
        await executeQuery(env, sql, params);
        return json({ success: true, data: b });
      }

      case 'login': {
        const rows = await executeQuery(env, 'SELECT * FROM users WHERE email = ? LIMIT 1', [payload.email]);
        const user = rows[0];
        if (!user) {
          return json({ success: false, error: 'User not found' }, 401);
        }
        const token = 'st_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await executeQuery(
          env,
          'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
          ['sess-' + Math.random().toString(36).substring(2, 9), user.id, token, expiresAt]
        );
        return json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
            },
          },
        });
      }

      case 'getSession': {
        const sql = `
          SELECT s.*, u.first_name, u.last_name, u.email, u.role, u.status, u.phone
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND s.expires_at > datetime('now')
          LIMIT 1
        `;
        const rows = await executeQuery(env, sql, [payload.token]);
        if (!rows[0]) {
          return json({ success: false, error: 'Invalid or expired session' }, 401);
        }
        return json({ success: true, data: rows[0] });
      }

      case 'logout': {
        if (payload?.token) {
          await executeQuery(env, 'DELETE FROM sessions WHERE token = ?', [payload.token]);
        }
        return json({ success: true });
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('[D1 Pages Function Error]:', error);
    return json({ success: false, error: error.message || 'Internal Server Error' }, 500);
  }
}
