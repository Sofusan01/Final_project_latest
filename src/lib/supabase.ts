import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// User roles (only admin and user)
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role checking functions
export const isAdmin = (role: string | null): boolean => {
  return role === USER_ROLES.ADMIN;
};

export const isUser = (role: string | null): boolean => {
  return role === USER_ROLES.USER || role === USER_ROLES.ADMIN;
};
