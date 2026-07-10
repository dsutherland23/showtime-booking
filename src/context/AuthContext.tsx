'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseReady } from '@/lib/supabase/client';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/utils/db';

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

interface AuthContextType {
  user: any | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Switch mock user identity (simulation mode)
  const switchUser = async (userId: string) => {
    if (isSupabaseReady) return;
    setLoading(true);
    try {
      const uList = await db.getUsers();
      const targetUser = uList.find(u => u.id === userId);
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
        localStorage.setItem('st_active_user_id', userId);
      }
    } catch (err) {
      console.error('Failed to switch mock user:', err);
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
          const uList = await db.getUsers();
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

          // Get last active user or default to Booking Agent (usr-agent-1)
          const cachedUserId = localStorage.getItem('st_active_user_id');
          const defaultUser = uList.find(u => u.id === cachedUserId) || uList.find(u => u.role === 'Booking Agent') || uList[0];
          
          if (defaultUser) {
            setUser({
              id: defaultUser.id,
              email: defaultUser.email,
              first_name: defaultUser.first_name,
              last_name: defaultUser.last_name,
              role: defaultUser.role
            });
            setProfile({
              id: defaultUser.id,
              first_name: defaultUser.first_name,
              last_name: defaultUser.last_name,
              email: defaultUser.email,
              phone: defaultUser.phone,
              role: defaultUser.role,
              status: defaultUser.status as 'Active' | 'Inactive' | 'Suspended',
              created_at: defaultUser.created_at
            });
          }
        } catch (err) {
          console.error('Failed to load mock auth users:', err);
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

  const loadProfile = useCallback(async (userId: string, client: SupabaseClient) => {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Profile not found — will be created on first login
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
      await loadProfile(user.id, supabaseClient);
    }
  }, [user, supabaseClient, loadProfile]);

  useEffect(() => {
    if (!supabaseClient) return;

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, supabaseClient).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id, supabaseClient);
      } else {
        setProfile(null);
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
    if (!isSupabaseReady) {
      localStorage.removeItem('st_active_user_id');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    const role = profile.role;
    const perms = PERMISSION_MAP[role] || [];
    return perms.includes('*') || perms.includes(permission);
  };

  const isAdmin = !!profile && ['Super Admin', 'Admin'].includes(profile.role);
  const isStaff = !!profile && STAFF_ROLES.includes(profile.role);
  const isClient = !!profile && profile.role === 'Client';
  const isArtist = !!profile && profile.role === 'Artist';

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
