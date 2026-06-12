'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, User } from '@/utils/db';

interface AuthContextType {
  user: User | null;
  usersList: User[];
  loading: boolean;
  switchUser: (userId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize and load users list
  useEffect(() => {
    const initAuth = async () => {
      try {
        const uList = await db.getUsers();
        setUsersList(uList);
        
        // Retrieve last active user or default to Agent
        const cachedUserId = localStorage.getItem('st_active_user_id');
        const defaultUser = uList.find(u => u.id === cachedUserId) || uList.find(u => u.role === 'Booking Agent') || uList[0];
        
        setUser(defaultUser || null);
      } catch (err) {
        console.error('Failed to load auth users:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Switch current active user
  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const uList = await db.getUsers();
      const targetUser = uList.find(u => u.id === userId);
      if (targetUser) {
        setUser(targetUser);
        localStorage.setItem('st_active_user_id', userId);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check permissions based on role
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super Admin has full access
    if (user.role === 'Super Admin') return true;

    // Define permission maps for roles
    const permissionMap: Record<string, string[]> = {
      'Booking Agent': ['view_artists', 'manage_bookings', 'view_clients', 'send_contracts', 'manage_artists'],
      'Artist Manager': ['manage_artist_profiles', 'manage_availability', 'manage_media'],
      'Artist': ['view_bookings', 'update_profile', 'manage_availability'],
      'Client': ['create_booking_requests', 'view_bookings', 'download_documents']
    };

    const userPerms = permissionMap[user.role] || [];
    return userPerms.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, usersList, loading, switchUser, hasPermission }}>
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
