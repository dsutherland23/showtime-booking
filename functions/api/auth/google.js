/**
 * POST /api/auth/google
 * Body: { credential: "<Google ID token (JWT) from Google Identity Services>" }
 *
 * Verifies the token server-side before the site trusts the identity:
 *   - RS256 signature against Google's published JWKS
 *   - issuer is Google
 *   - audience matches our OAuth Client ID (env.GOOGLE_CLIENT_ID)
 *   - token not expired
 *   - email is verified by Google
 *
 * Runs as a Cloudflare Pages Function (deployed alongside the static export).
 */

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const CLOCK_SKEW_SECONDS = 60;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function base64UrlToBytes(input) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeSegment(segment) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

async function fetchJwks(useCache) {
  const res = await fetch(
    JWKS_URL,
    useCache ? { cf: { cacheTtl: 3600, cacheEverything: true } } : { cf: { cacheTtl: 0 } }
  );
  if (!res.ok) throw new Error(`Could not load Google signing keys (${res.status}).`);
  const { keys } = await res.json();
  return keys || [];
}

async function getGoogleKey(kid) {
  // Try the edge-cached key set first; refetch once in case Google rotated keys.
  let jwk = (await fetchJwks(true)).find((k) => k.kid === kid);
  if (!jwk) jwk = (await fetchJwks(false)).find((k) => k.kid === kid);
  if (!jwk) return null;
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

const DEFAULT_GOOGLE_CLIENT_ID = '379204519277-np3fhklrlvsu63jv1dskgifeu67861uh.apps.googleusercontent.com';

export async function onRequestPost({ request, env }) {
  let credential, requestClientId;
  try {
    const body = await request.json();
    credential = body.credential;
    requestClientId = body.clientId;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const clientId = env.GOOGLE_CLIENT_ID || requestClientId || DEFAULT_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return json({ error: 'Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing).' }, 500);
  }
  if (typeof credential !== 'string' || credential.split('.').length !== 3) {
    return json({ error: 'Missing or malformed Google credential.' }, 400);
  }

  const [headerB64, payloadB64, signatureB64] = credential.split('.');

  let header, payload;
  try {
    header = decodeSegment(headerB64);
    payload = decodeSegment(payloadB64);
  } catch {
    return json({ error: 'Malformed Google credential.' }, 400);
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return json({ error: 'Unsupported token algorithm.' }, 401);
  }

  try {
    const key = await getGoogleKey(header.kid);
    if (!key) return json({ error: 'Unknown Google signing key.' }, 401);

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(signatureB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return json({ error: 'Invalid Google token signature.' }, 401);
  } catch (err) {
    return json({ error: err.message || 'Could not verify Google token.' }, 502);
  }

  const now = Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.includes(payload.iss)) return json({ error: 'Token was not issued by Google.' }, 401);
  if (payload.aud !== clientId) return json({ error: 'Token was issued for a different application.' }, 401);
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < now) {
    return json({ error: 'Google sign-in expired. Please try again.' }, 401);
  }
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    return json({ error: 'Your Google email address is not verified.' }, 403);
  }

  return json({
    profile: {
      sub: payload.sub,
      email: String(payload.email || '').toLowerCase(),
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      name: payload.name || '',
      picture: payload.picture || '',
    },
  });
}
