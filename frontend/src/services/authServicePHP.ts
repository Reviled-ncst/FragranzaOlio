/**
 * Authentication Service (PHP Backend)
 * Fragranza Olio - User Authentication with XAMPP/MySQL
 */

import { API_BASE_URL, apiFetch } from './api';

export type UserRole = 'customer' | 'sales' | 'ojt' | 'ojt_supervisor' | 'admin';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  subscribeNewsletter?: boolean;
  role?: UserRole;
  // OJT Intern specific fields
  supervisorId?: string | number;
  university?: string;
  course?: string;
  department?: string;
  requiredHours?: number;
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
  role: UserRole; // Added role
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
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

// Storage keys
const USER_KEY = 'fragranza_user';
const SESSION_KEY = 'fragranza_session';

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

export const removeToken = (): void => {
  removeStoredUser();
};

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('📝 Starting registration for:', data.email);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sessions
        body: JSON.stringify({
          action: 'register',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          role: data.role || 'customer',
          birthDate: data.birthDate || null,
          gender: data.gender || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          province: data.province || null,
          zipCode: data.zipCode || null,
          subscribeNewsletter: data.subscribeNewsletter || false,
          // OJT Intern specific fields
          supervisorId: data.supervisorId || null,
          university: data.university || null,
          course: data.course || null,
          department: data.department || null,
          requiredHours: data.requiredHours || 500,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Registration failed:', result.message);
        return {
          success: false,
          message: result.message || 'Registration failed',
        };
      }

      console.log('✅ Registration successful:', result.data?.user?.email);

      // Store user and session
      if (result.data?.user) {
        setStoredUser(result.data.user);
        if (result.data.token) {
          localStorage.setItem(SESSION_KEY, result.data.token);
        }
      }

      return {
        success: true,
        message: 'Registration successful!',
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.message || 'Network error during registration',
      };
    }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    console.log('🔐 Logging in:', data.email);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sessions
        body: JSON.stringify({
          action: 'login',
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Login failed:', result.message);
        return {
          success: false,
          message: result.message || 'Login failed',
        };
      }

      console.log('✅ Login successful:', result.data?.user?.email);

      // Store user and session
      if (result.data?.user) {
        setStoredUser(result.data.user);
        if (result.data.token) {
          localStorage.setItem(SESSION_KEY, result.data.token);
        }
      }

      return {
        success: true,
        message: 'Login successful!',
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.message || 'Network error during login',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    console.log('🚪 Logging out...');
    
    try {
      const token = localStorage.getItem(SESSION_KEY);
      
      await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'logout',
        }),
      });

      // Clear local storage regardless of server response
      removeStoredUser();

      console.log('✅ Logout complete');

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Still clear local storage
      removeStoredUser();
      
      return {
        success: true,
        message: 'Logged out',
      };
    }
  },

  /**
   * Get current user from session
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem(SESSION_KEY);
      
      // If no token stored, don't make the request
      if (!token) {
        return {
          success: false,
          message: 'No session token',
        };
      }
      
      const response = await apiFetch(`${API_BASE_URL}/auth.php?action=current-user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // No active session
        removeStoredUser();
        return {
          success: false,
          message: result.message || 'No active session',
        };
      }

      // Update stored user
      if (result.data?.user) {
        setStoredUser(result.data.user);
      }

      return {
        success: true,
        message: 'User retrieved',
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Get current user error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get current user',
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<AuthResponse> {
    console.log('📝 Updating profile for user:', userId);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-profile',
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          birth_date: data.birthDate,
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          city: data.city,
          province: data.province,
          zip_code: data.zipCode,
          subscribe_newsletter: data.subscribeNewsletter,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Update profile failed:', result.message);
        return {
          success: false,
          message: result.message || 'Update failed',
        };
      }

      console.log('✅ Profile updated successfully');

      // Update stored user
      if (result.data?.user) {
        setStoredUser(result.data.user);
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      return {
        success: false,
        message: error.message || 'Network error during update',
      };
    }
  },

  /**
   * Verify session is still valid
   */
  async verifySession(): Promise<boolean> {
    const response = await this.getCurrentUser();
    return response.success;
  },

  /**
   * Get list of available supervisors for OJT intern registration
   */
  async getSupervisors(): Promise<Array<{ id: number; name: string; email: string }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php?action=get-supervisors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Failed to get supervisors:', result.message);
        return [];
      }

      return result.data || [];
    } catch (error: any) {
      console.error('❌ Get supervisors error:', error);
      return [];
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php?action=verify-email&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || 'Verification failed',
        };
      }

      return {
        success: true,
        message: result.message || 'Email verified successfully!',
      };
    } catch (error: any) {
      console.error('❌ Verify email error:', error);
      return {
        success: false,
        message: error.message || 'Network error during verification',
      };
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend-verification',
          email: email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || 'Failed to resend verification email',
        };
      }

      return {
        success: true,
        message: result.message || 'Verification email sent!',
      };
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  },

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'forgot-password',
          email: email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || 'Failed to send reset email',
        };
      }

      return {
        success: true,
        message: result.message || 'Password reset email sent!',
      };
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  },
};

export default authService;
