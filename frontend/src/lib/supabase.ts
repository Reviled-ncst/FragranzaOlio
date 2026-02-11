import { createClient, SupabaseClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
// Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Extend Window interface for global singleton
declare global {
  interface Window {
    __supabase?: SupabaseClient;
  }
}

// IIFE to create singleton - runs ONCE and checks window first
export const supabase = (() => {
  // Return existing client if available (HMR persistence)
  if (typeof window !== 'undefined' && window.__supabase) {
    console.log('♻️ Reusing existing Supabase client');
    return window.__supabase;
  }

  console.log('🆕 Creating new Supabase client');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'fragranza-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  // Store on window for HMR persistence
  if (typeof window !== 'undefined') {
    window.__supabase = client;
  }

  return client;
})();

// User roles for ERP system
export type UserRole = 'customer' | 'admin' | 'sales' | 'inventory' | 'finance' | 'supplier';

export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'customer', label: 'Customer', description: 'Browse and purchase products' },
  { value: 'supplier', label: 'Supplier', description: 'Supply raw materials and products' },
  { value: 'sales', label: 'Sales Representative', description: 'Manage sales and customer relationships' },
  { value: 'inventory', label: 'Inventory Manager', description: 'Manage warehouse and stock' },
  { value: 'finance', label: 'Finance', description: 'Handle accounting and payments' },
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
];

// Database types for TypeScript
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  company_name?: string;
  company_position?: string;
  department?: string;
  employee_id?: string;
  is_active: boolean;
  is_verified: boolean;
  subscribe_newsletter: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
  };
}
