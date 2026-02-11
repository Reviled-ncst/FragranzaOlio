/**
 * Authentication Service (Supabase)
 * Fragranza Olio - User Authentication with Supabase (ERP)
 */

import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../lib/supabase';

export type { UserRole } from '../lib/supabase';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  companyName?: string;
  companyPosition?: string;
  department?: string;
  subscribeNewsletter?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  companyName?: string;
  companyPosition?: string;
  department?: string;
  employeeId?: string;
  isActive: boolean;
  isVerified: boolean;
  subscribeNewsletter: boolean;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    token?: string;
  };
}

// Convert Supabase profile to User interface
const profileToUser = (profile: Profile, email: string, emailVerified: boolean): User => ({
  id: profile.id,
  firstName: profile.first_name,
  lastName: profile.last_name,
  email: email,
  role: profile.role,
  birthDate: profile.birth_date,
  gender: profile.gender,
  phone: profile.phone,
  address: profile.address,
  city: profile.city,
  province: profile.province,
  zipCode: profile.zip_code,
  companyName: profile.company_name,
  companyPosition: profile.company_position,
  department: profile.department,
  employeeId: profile.employee_id,
  isActive: profile.is_active,
  isVerified: profile.is_verified,
  subscribeNewsletter: profile.subscribe_newsletter,
  emailVerified: emailVerified,
  avatarUrl: profile.avatar_url,
  createdAt: profile.created_at,
});

// Storage keys
const USER_KEY = 'fragranza_user';

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Alias for AuthContext compatibility
export const getToken = (): string | null => {
  return localStorage.getItem('sb-access-token');
};

export const removeToken = (): void => {
  localStorage.removeItem('sb-access-token');
  removeStoredUser();
};

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('📝 Starting registration for:', data.email);
    console.log('📋 Registration data:', { ...data, password: '***' });
    
    try {
      // Create auth user with timeout
      console.log('🔐 Step 1: Creating auth user...');
      
      const signUpPromise = supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            // Personal info
            first_name: data.firstName,
            last_name: data.lastName,
            birth_date: data.birthDate || null,
            gender: data.gender || null,
            // Contact info
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            province: data.province || null,
            zip_code: data.zipCode || null,
            // Role & company info
            role: data.role,
            company_name: data.companyName || null,
            company_position: data.companyPosition || null,
            department: data.department || null,
            // Preferences
            subscribe_newsletter: data.subscribeNewsletter || false,
          },
        },
      });
      
      // Add 15 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Registration timed out. You may be rate limited - please wait a few minutes and try again.')), 15000)
      );
      
      const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]);
      console.log('🔐 Step 1 complete. Auth result:', { user: !!authData?.user, error: authError?.message });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        return {
          success: false,
          message: authError.message,
        };
      }

      if (!authData.user) {
        console.error('❌ No user returned from signup');
        return {
          success: false,
          message: 'Registration failed. Please try again.',
        };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Profile is created automatically by database trigger (handle_new_user)
      // No need to insert from frontend
      console.log('👤 Profile created automatically by database trigger');

      console.log('🎉 Registration complete!');
      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          user: {
            id: authData.user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            birthDate: data.birthDate,
            gender: data.gender,
            phone: data.phone,
            address: data.address,
            city: data.city,
            province: data.province,
            zipCode: data.zipCode,
            companyName: data.companyName,
            companyPosition: data.companyPosition,
            department: data.department,
            isActive: true,
            isVerified: false,
            subscribeNewsletter: data.subscribeNewsletter || false,
            emailVerified: false,
            createdAt: new Date().toISOString(),
          },
        },
      };
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.warn('⚠️ Request aborted');
        return {
          success: false,
          message: 'Request was cancelled. Please try again.',
        };
      }
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred during registration. Please try again.',
      };
    }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    console.log('🔐 Attempting login for:', data.email);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('❌ Login error:', authError.message, authError.status);
        
        // Provide user-friendly error messages
        let message = authError.message;
        if (authError.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please check your credentials and try again.';
        } else if (authError.message.includes('Email not confirmed')) {
          message = 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
        } else if (authError.status === 400) {
          message = 'Login failed. Please check your email and password.';
        }
        
        return {
          success: false,
          message,
        };
      }

      if (!authData.user) {
        console.error('❌ No user returned from login');
        return {
          success: false,
          message: 'Login failed. Please try again.',
        };
      }

      console.log('✅ Auth successful, fetching profile...');

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch profile:', profileError.message);
      }

      console.log('👤 Profile data:', profile ? 'Found' : 'Not found, using auth metadata');

      const user: User = profile
        ? profileToUser(profile, authData.user.email || data.email, !!authData.user.email_confirmed_at)
        : {
            id: authData.user.id,
            firstName: authData.user.user_metadata?.first_name || '',
            lastName: authData.user.user_metadata?.last_name || '',
            email: authData.user.email || data.email,
            role: (authData.user.user_metadata?.role as UserRole) || 'customer',
            isActive: true,
            isVerified: false,
            subscribeNewsletter: false,
            emailVerified: !!authData.user.email_confirmed_at,
            createdAt: authData.user.created_at,
          };

      setStoredUser(user);
      console.log('🎉 Login complete for:', user.email);

      return {
        success: true,
        message: 'Login successful!',
        data: {
          user,
          token: authData.session?.access_token,
        },
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login. Please try again.',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      removeStoredUser();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      removeStoredUser();
      return {
        success: false,
        message: 'An error occurred during logout.',
      };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        return {
          success: false,
          message: 'Not authenticated',
        };
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const user: User = profile
        ? profileToUser(profile, authUser.email || '', !!authUser.email_confirmed_at)
        : {
            id: authUser.id,
            firstName: authUser.user_metadata?.first_name || '',
            lastName: authUser.user_metadata?.last_name || '',
            email: authUser.email || '',
            role: (authUser.user_metadata?.role as UserRole) || 'customer',
            isActive: true,
            isVerified: false,
            subscribeNewsletter: false,
            emailVerified: !!authUser.email_confirmed_at,
            createdAt: authUser.created_at,
          };

      setStoredUser(user);

      return {
        success: true,
        message: 'User retrieved successfully',
        data: { user },
      };
    } catch (error: any) {
      // Ignore abort errors (caused by React StrictMode)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return {
          success: false,
          message: 'Request was cancelled',
        };
      }
      console.error('Get user error:', error);
      return {
        success: false,
        message: 'Failed to retrieve user information',
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<RegisterData>): Promise<AuthResponse> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          birth_date: data.birthDate,
          gender: data.gender as 'male' | 'female' | 'other' | undefined,
          phone: data.phone,
          address: data.address,
          city: data.city,
          province: data.province,
          zip_code: data.zipCode,
          subscribe_newsletter: data.subscribeNewsletter,
        })
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Refresh user data
      return this.getCurrentUser();
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
      };
    }
  },

  /**
   * Check if email exists
   */
  async checkEmail(email: string): Promise<{ exists: boolean }> {
    // Supabase handles this during registration
    return { exists: false };
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email',
      };
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

export default authService;
