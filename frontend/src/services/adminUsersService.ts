/**
 * Admin Users Service
 * Fragranza Olio - User Management API
 */

import { getToken, getStoredUser } from './authServicePHP';
import { API_BASE_URL, apiFetch } from './api';

export type UserRole = 'customer' | 'sales' | 'ojt' | 'ojt_supervisor' | 'hr' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface AdminUser {
  id: number;
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
  department?: string;
  position?: string;
  employeeId?: string;
  supervisorId?: number;
  supervisorName?: string;
  hireDate?: string;
  notes?: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface CreateUserData {
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
  department?: string;
  position?: string;
  supervisorId?: number;
  hireDate?: string;
  notes?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  password?: string;
  status?: UserStatus;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  roleCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recentLogins: number;
  newUsersThisMonth: number;
  recentActivity: Array<{
    userName: string;
    email: string;
    role: string;
    activityType: string;
    createdAt: string;
  }>;
}

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  email: string;
  role: string;
  activityType: 'login' | 'logout' | 'register' | 'password_change' | 'profile_update' | 'password_reset';
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  activity_type?: string;
  user_id?: number;
  role?: string;
  date_from?: string;
  date_to?: string;
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  pagination: PaginationInfo;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  const user = getStoredUser();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    ...(user?.email ? { 'X-Admin-Email': user.email } : {}),
  };
};

export const adminUsersService = {
  /**
   * Get all users with optional filters
   */
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<{ users: AdminUser[]; pagination: PaginationInfo }>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiFetch(`${API_BASE_URL}/admin_users.php?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, message: 'Failed to fetch users' };
    }
  },

  /**
   * Get a single user by ID
   */
  async getUser(id: number): Promise<ApiResponse<{ user: AdminUser }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, message: 'Failed to fetch user' };
    }
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<ApiResponse<{ userId: number; email: string; employeeId?: string }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      // Handle specific error cases with user-friendly messages
      if (!response.ok || !result.success) {
        if (response.status === 409 || result.message?.includes('already')) {
          return { success: false, message: 'This email is already registered. Please use a different email address.' };
        }
        return { success: false, message: result.message || 'Failed to create user' };
      }
      
      return result;
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user. Please try again.' };
    }
  },

  /**
   * Update a user
   */
  async updateUser(id: number, data: UpdateUserData): Promise<ApiResponse<{ userId: number }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Failed to update user' };
    }
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  },

  /**
   * Get users by role (for dropdowns)
   */
  async getUsersByRole(role: UserRole): Promise<ApiResponse<{ users: Array<{ id: number; firstName: string; lastName: string; email: string; employeeId?: string; fullName: string }> }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/role/${role}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get users by role error:', error);
      return { success: false, message: 'Failed to fetch users' };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, message: 'Failed to fetch stats' };
    }
  },

  /**
   * Get activity logs (login/logout history)
   */
  async getActivityLogs(filters: ActivityLogFilters = {}): Promise<ApiResponse<ActivityLogResponse>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const url = `${API_BASE_URL}/admin_users.php/activity-logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiFetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get activity logs error:', error);
      return { success: false, message: 'Failed to fetch activity logs' };
    }
  },

  /**
   * Update user status (activate, suspend, terminate, complete_training, reactivate)
   */
  async updateUserStatus(userId: number, action: 'activate' | 'suspend' | 'terminate' | 'complete_training' | 'reactivate', reason?: string): Promise<ApiResponse<{ userId: number; previousStatus: string; newStatus: string }>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/${userId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, reason }),
      });

      return await response.json();
    } catch (error) {
      console.error('Update user status error:', error);
      return { success: false, message: 'Failed to update user status' };
    }
  },

  /**
   * Permanently delete a user (cannot be undone)
   */
  async permanentDeleteUser(userId: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/admin_users.php/permanent/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Permanent delete user error:', error);
      return { success: false, message: 'Failed to permanently delete user' };
    }
  },
};

export default adminUsersService;
