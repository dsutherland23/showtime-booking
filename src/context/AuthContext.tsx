'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseReady } from '@/lib/supabase/client';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { db, SEED_USERS } from '@/utils/db';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  avatar_url?: string;
  created_at: string;
}

export type AuthUser = User | { id: string; email: string; first_name?: string; last_name?: string; role?: string };

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
  isArtist: boolean;
  refreshProfile: () => Promise<void>;
  usersList?: UserProfile[];
  switchUser?: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permission map — mirrors Supabase RLS policies
const PERMISSION_MAP: Record<string, string[]> = {
  'Super Admin': ['*'],
  'Admin': ['*'],
  'Booking Agent': [
    'view_artists', 'manage_bookings', 'view_clients',
    'send_contracts', 'manage_artists', 'view_leads', 'manage_leads',
    'view_events', 'manage_events', 'view_invoices', 'view_dashboard',
  ],
  'Artist Manager': [
    'manage_artist_profiles', 'manage_availability', 'manage_media',
    'view_bookings', 'view_contracts', 'view_dashboard',
  ],
  'Finance Manager': [
    'view_finance', 'manage_invoices', 'view_analytics',
    'view_orders', 'view_dashboard',
  ],
  'Marketing Manager': [
    'manage_marketing', 'manage_advertising', 'manage_content',
    'view_analytics', 'view_dashboard',
  ],
  'Content Manager': [
    'manage_content', 'view_artists', 'view_events', 'view_dashboard',
  ],
  'Support Agent': [
    'view_customers', 'view_orders', 'view_tickets', 'view_dashboard',
  ],
  'Promoter': [
    'view_events', 'manage_events', 'view_tickets', 'view_analytics', 'view_dashboard',
  ],
  'Venue Manager': [
    'manage_venues', 'view_events', 'view_dashboard',
  ],
  'Artist': [
    'view_own_bookings', 'update_own_profile', 'manage_own_availability',
    'view_own_contracts', 'view_own_invoices',
  ],
  'Client': [
    'create_booking_requests', 'view_own_bookings', 'download_own_documents',
    'view_own_invoices', 'sign_contracts',
  ],
};

const STAFF_ROLES = ['Super Admin', 'Admin', 'Booking Agent', 'Artist Manager',
  'Finance Manager', 'Marketing Manager', 'Content Manager', 'Support Agent',
  'Promoter', 'Venue Manager'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Switch mock user identity (simulation mode / local fallback)
  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const dbUsers = await db.getUsers();
      const uList = dbUsers && dbUsers.length > 0 ? dbUsers : SEED_USERS;
      const targetUser = uList.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase())
        || SEED_USERS.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase())
        || SEED_USERS[0];

      if (targetUser) {
        setUser({
          id: targetUser.id,
          email: targetUser.email,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          role: targetUser.role
        });
        setProfile({
          id: targetUser.id,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          email: targetUser.email,
          phone: targetUser.phone,
          role: targetUser.role,
          status: targetUser.status as 'Active' | 'Inactive' | 'Suspended',
          created_at: targetUser.created_at
        });
        localStorage.setItem('st_active_user_id', targetUser.id);
        if (typeof document !== 'undefined') {
          document.cookie = `st_active_user_id=${encodeURIComponent(targetUser.id)}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lazily load the Supabase client only when credentials are real, else use mock simulation
  useEffect(() => {
    if (!isSupabaseReady) {
      // Local Simulation Mode
      const initMockAuth = async () => {
        try {
          const dbUsers = await db.getUsers();
          const uList = dbUsers && dbUsers.length > 0 ? dbUsers : SEED_USERS;
          const mappedProfiles: UserProfile[] = uList.map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status as 'Active' | 'Inactive' | 'Suspended',
            created_at: u.created_at
          }));
          setUsersList(mappedProfiles);

          // Restore session from cache if valid user exists
          const cachedUserId = localStorage.getItem('st_active_user_id');
          let activeUser = cachedUserId ? uList.find(u => u.id === cachedUserId || u.email.toLowerCase() === cachedUserId.toLowerCase()) : null;
          if (!activeUser && (cachedUserId === 'admin' || cachedUserId === 'usr-admin-1')) {
            activeUser = uList.find(u => u.role === 'Super Admin' || u.role === 'Admin') || SEED_USERS[0];
          }

          if (activeUser) {
            setUser({
              id: activeUser.id,
              email: activeUser.email,
              first_name: activeUser.first_name,
              last_name: activeUser.last_name,
              role: activeUser.role
            });
            setProfile({
              id: activeUser.id,
              first_name: activeUser.first_name,
              last_name: activeUser.last_name,
              email: activeUser.email,
              phone: activeUser.phone,
              role: activeUser.role,
              status: activeUser.status as 'Active' | 'Inactive' | 'Suspended',
              created_at: activeUser.created_at
            });
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.error('Failed to initialize local auth:', err);
        } finally {
          setLoading(false);
        }
      };
      initMockAuth();
      return;
    }

    // Dynamically import so placeholder env never triggers network calls
    import('@/lib/supabase/client').then(({ createClient }) => {
      try {
        const client = createClient();
        setSupabaseClient(client);
      } catch {
        setLoading(false);
      }
    });
  }, []);

  const loadProfile = useCallback(async (userId: string, client: SupabaseClient, authUser?: any) => {
    try {
      // 1. Try profiles table
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
        return;
      }

      // 2. Try users table (matching supabase/schema.sql)
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        setProfile({
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || (userData.email?.toLowerCase().includes('admin') ? 'Super Admin' : 'Client'),
          status: userData.status || 'Active',
          created_at: userData.created_at || new Date().toISOString()
        });
        return;
      }

      // 3. Fallback: Extract from user metadata, seed accounts, or admin emails
      const userObj = authUser || (await client.auth.getUser()).data?.user;
      const email = userObj?.email?.toLowerCase().trim() || '';
      const meta = userObj?.user_metadata || {};
      const appMeta = userObj?.app_metadata || {};

      let resolvedRole = meta.role || appMeta.role || userObj?.role || '';
      if (!resolvedRole) {
        const seed = SEED_USERS.find(u => u.email.toLowerCase() === email);
        if (seed) {
          resolvedRole = seed.role;
        } else if (email === 'admin@showtimeservices.com' || email.includes('admin@')) {
          resolvedRole = 'Super Admin';
        } else {
          resolvedRole = 'Client';
        }
      }

      const fallbackProfile: UserProfile = {
        id: userId,
        first_name: meta.first_name || userObj?.first_name || email.split('@')[0] || 'Showtime',
        last_name: meta.last_name || userObj?.last_name || 'Admin',
        email: email,
        phone: meta.phone || userObj?.phone || undefined,
        role: resolvedRole,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      setProfile(fallbackProfile);

      // Attempt to self-heal and persist profile so future reads succeed
      try {
        await client.from('profiles').upsert(fallbackProfile);
      } catch {
        // ignore if table doesn't exist
      }
    } catch (err) {
      console.warn('Error resolving user profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseReady) {
      const cachedUserId = localStorage.getItem('st_active_user_id');
      if (cachedUserId) {
        try {
          const uList = await db.getUsers();
          const target = uList.find(u => u.id === cachedUserId);
          if (target) {
            setProfile({
              id: target.id,
              first_name: target.first_name,
              last_name: target.last_name,
              email: target.email,
              phone: target.phone,
              role: target.role,
              status: target.status as 'Active' | 'Inactive' | 'Suspended',
              created_at: target.created_at
            });
          }
        } catch {}
      }
      return;
    }
    if (user?.id && supabaseClient) {
      await loadProfile(user.id, supabaseClient, user);
    }
  }, [user, supabaseClient, loadProfile]);

  useEffect(() => {
    if (!supabaseClient) return;

    // Get initial session
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id, supabaseClient, session.user);
        setLoading(false);
      } else {
        // Fallback: check localStorage for local/D1 active user (e.g. simulated admin or D1 auth)
        const cachedUserId = localStorage.getItem('st_active_user_id');
        if (cachedUserId) {
          try {
            const dbUsers = await db.getUsers();
            const uList = dbUsers && dbUsers.length > 0 ? dbUsers : SEED_USERS;
            const targetUser = uList.find(u => u.id === cachedUserId || u.email.toLowerCase() === cachedUserId.toLowerCase())
              || (cachedUserId === 'admin' || cachedUserId === 'usr-admin-1' ? SEED_USERS[0] : null);

            if (targetUser) {
              setUser({
                id: targetUser.id,
                email: targetUser.email,
                first_name: targetUser.first_name,
                last_name: targetUser.last_name,
                role: targetUser.role
              });
              setProfile({
                id: targetUser.id,
                first_name: targetUser.first_name,
                last_name: targetUser.last_name,
                email: targetUser.email,
                phone: targetUser.phone,
                role: targetUser.role,
                status: targetUser.status as 'Active' | 'Inactive' | 'Suspended',
                created_at: targetUser.created_at
              });
            }
          } catch {
            // ignore
          }
        }
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id, supabaseClient, session.user);
      } else {
        const cachedUserId = localStorage.getItem('st_active_user_id');
        if (!cachedUserId) {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabaseClient, loadProfile]);

  const signOut = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('st_active_user_id');
    if (typeof document !== 'undefined') {
      document.cookie = 'st_active_user_id=; path=/; max-age=0; SameSite=Lax';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    const role = profile.role;
    const perms = PERMISSION_MAP[role] || [];
    return perms.includes('*') || perms.includes(permission);
  };

  const resolvedRole = profile?.role
    || (user as any)?.role
    || (user as any)?.user_metadata?.role
    || ((user as any)?.email === 'admin@showtimeservices.com' ? 'Super Admin' : '');

  const isAdmin = ['Super Admin', 'Admin'].includes(resolvedRole);
  const isStaff = STAFF_ROLES.includes(resolvedRole);
  const isClient = resolvedRole === 'Client';
  const isArtist = resolvedRole === 'Artist';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signOut,
        hasPermission,
        isAdmin,
        isStaff,
        isClient,
        isArtist,
        refreshProfile,
        usersList,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
