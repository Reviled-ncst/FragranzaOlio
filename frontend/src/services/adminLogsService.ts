/**
 * Admin Logs Service
 * Handles audit trail and activity log operations
 */

import { API_BASE_URL } from './api';

// Get token from localStorage - check multiple possible keys
const getToken = (): string | null => {
  // Try Supabase token first
  const sbToken = localStorage.getItem('sb-access-token');
  if (sbToken) return sbToken;
  
  // Try auth_token as fallback
  const authToken = localStorage.getItem('auth_token');
  if (authToken) return authToken;
  
  // Try to get from Supabase storage format
  const sbStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-') && key.includes('auth-token'));
  for (const key of sbStorageKeys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.access_token) return data.access_token;
    } catch (e) {
      // Continue to next key
    }
  }
  
  return null;
};

export interface AdminLog {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  admin_first_name?: string;
  admin_last_name?: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'import' | 'other';
  target_type: 'user' | 'product' | 'inventory' | 'order' | 'category' | 'settings' | 'system';
  target_id: number | null;
  target_name: string | null;
  description: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogFilters {
  page?: number;
  limit?: number;
  action_type?: string;
  target_type?: string;
  admin_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface LogStats {
  totalActions: number;
  byActionType: Record<string, number>;
  byTargetType: Record<string, number>;
  mostActiveAdmins: Array<{
    admin_id: number;
    admin_name: string;
    admin_email: string;
    action_count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Get user email from localStorage
const getUserEmail = (): string | null => {
  try {
    const userStr = localStorage.getItem('fragranza_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || null;
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  const email = getUserEmail();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Admin-Email': email || '',
  };
};

export const adminLogsService = {
  /**
   * Get activity logs with optional filters
   */
  async getLogs(filters: LogFilters = {}): Promise<ApiResponse<{ logs: AdminLog[]; pagination: PaginationInfo }>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      // Add admin email for authentication
      const email = getUserEmail();
      if (email) {
        queryParams.append('admin_email', email);
      }

      const response = await fetch(`${API_BASE_URL}/admin_logs.php?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get logs error:', error);
      return { success: false, message: 'Failed to fetch logs' };
    }
  },

  /**
   * Get log statistics
   */
  async getStats(days: number = 30): Promise<ApiResponse<LogStats>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin_logs.php/stats?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get log stats error:', error);
      return { success: false, message: 'Failed to fetch log statistics' };
    }
  },

  /**
   * Get recent activity (shortcut for last 10 logs)
   */
  async getRecentActivity(limit: number = 10): Promise<ApiResponse<{ logs: AdminLog[]; pagination: PaginationInfo }>> {
    return this.getLogs({ limit, page: 1 });
  },

  /**
   * Get action type label and color
   */
  getActionTypeConfig(actionType: string): { label: string; color: string; bgColor: string } {
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      create: { label: 'Created', color: 'text-green-400', bgColor: 'bg-green-500/20' },
      update: { label: 'Updated', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
      delete: { label: 'Deleted', color: 'text-red-400', bgColor: 'bg-red-500/20' },
      login: { label: 'Login', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
      logout: { label: 'Logout', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
      view: { label: 'Viewed', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
      export: { label: 'Exported', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
      import: { label: 'Imported', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
      other: { label: 'Action', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    };

    return configs[actionType] || configs.other;
  },

  /**
   * Get target type label and icon
   */
  getTargetTypeConfig(targetType: string): { label: string; icon: string } {
    const configs: Record<string, { label: string; icon: string }> = {
      user: { label: 'User', icon: '👤' },
      product: { label: 'Product', icon: '📦' },
      inventory: { label: 'Inventory', icon: '🏭' },
      order: { label: 'Order', icon: '🛒' },
      category: { label: 'Category', icon: '📁' },
      settings: { label: 'Settings', icon: '⚙️' },
      system: { label: 'System', icon: '🖥️' },
    };

    return configs[targetType] || configs.system;
  },

  /**
   * Format time ago
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  }
};

export default adminLogsService;
