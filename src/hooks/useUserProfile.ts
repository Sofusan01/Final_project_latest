// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  userRole: string | null;
  firstName: string | null;
  lastName: string | null;
}

export function useUserProfile(): UserProfile {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // Fetch profile (role and names) from profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', userId)
        .single();

      setUserRole(data?.role || 'user');
      setFirstName(data?.first_name || null);
      setLastName(data?.last_name || null);
    } catch {
      setUserRole('user');
      setFirstName(null);
      setLastName(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Unblock UI immediately; fetch profile in background
        setLoading(false);
        fetchProfile(session.user.id);
        return;
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
          setFirstName(null);
          setLastName(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return {
    user,
    loading,
    logout,
    userRole,
    firstName,
    lastName
  };
}
