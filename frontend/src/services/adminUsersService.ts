/**
 * Admin Users Service
 * Fragranza Olio - User Management API
 */

import { getToken } from './authServicePHP';

const API_BASE_URL = 'http://localhost/FragranzaWeb/backend/api';

export type UserRole = 'customer' | 'sales' | 'ojt' | 'ojt_supervisor' | 'admin';
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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
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

      const response = await fetch(`${API_BASE_URL}/admin_users.php?${queryParams}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin_users.php/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin_users.php`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  },

  /**
   * Update a user
   */
  async updateUser(id: number, data: UpdateUserData): Promise<ApiResponse<{ userId: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin_users.php/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin_users.php/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin_users.php/role/${role}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin_users.php/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, message: 'Failed to fetch stats' };
    }
  },
};

export default adminUsersService;
