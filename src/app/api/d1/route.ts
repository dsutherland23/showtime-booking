import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'getArtists': {
        const artists = await d1.getArtists();
        return NextResponse.json({ success: true, data: artists });
      }
      case 'getArtistById': {
        const artist = await d1.getArtistById(payload.id);
        return NextResponse.json({ success: true, data: artist });
      }
      case 'getLeads': {
        const leads = await d1.getLeads();
        return NextResponse.json({ success: true, data: leads });
      }
      case 'createLead': {
        const lead = await d1.createLead(payload);
        return NextResponse.json({ success: true, data: lead });
      }
      case 'getBookings': {
        const bookings = await d1.getBookings();
        return NextResponse.json({ success: true, data: bookings });
      }
      case 'createBooking': {
        const booking = await d1.createBooking(payload);
        return NextResponse.json({ success: true, data: booking });
      }
      case 'login': {
        const user = await d1.getUserByEmail(payload.email);
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
        }
        // Generate session token
        const token = 'st_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await d1.createSession(user.id, token, expiresAt);
        return NextResponse.json({
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
      case 'register': {
        const existing = await d1.getUserByEmail(payload.email);
        if (existing) {
          return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
        }
        // Public registration strictly permits Client or Artist roles only
        const safeRole = payload.role === 'Artist' ? 'Artist' : 'Client';
        const newUser = await d1.createUser({ ...payload, role: safeRole });
        const token = 'st_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await d1.createSession(newUser.id, token, expiresAt);
        return NextResponse.json({
          success: true,
          data: {
            token,
            user: {
              id: newUser.id,
              first_name: newUser.first_name,
              last_name: newUser.last_name,
              email: newUser.email,
              role: newUser.role,
            },
          },
        });
      }
      case 'getSession': {
        const session = await d1.getSession(payload.token);
        if (!session) {
          return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 });
        }
        return NextResponse.json({ success: true, data: session });
      }
      case 'logout': {
        if (payload?.token) {
          await d1.deleteSession(payload.token);
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[D1 API Route Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
