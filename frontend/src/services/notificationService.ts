/**
 * Notification Service
 * Handles all notification-related API calls
 */

import api from './api';

const API_BASE = '/ojt_notifications.php';

export interface Notification {
  id: number;
  user_id: number;
  type: 'task' | 'timesheet' | 'attendance' | 'document' | 'module' | 'general' | 'system';
  title: string;
  message: string;
  link?: string;
  reference_id?: number;
  reference_type?: string;
  action_type?: string;
  is_read: number;
  read_at?: string;
  created_at: string;
}

export interface NotificationCount {
  total: number;
  task: number;
  timesheet: number;
  attendance: number;
  document: number;
  module: number;
  general: number;
  system: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  description?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

class NotificationService {
  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: number): Promise<NotificationCount> {
    const response = await api.get(`${API_BASE}/unread-count?user_id=${userId}`);
    return response.data?.data || { total: 0, task: 0, timesheet: 0, attendance: 0, document: 0, module: 0, general: 0, system: 0 };
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId: number, limit: number = 10): Promise<Notification[]> {
    const response = await api.get(`${API_BASE}/unread?user_id=${userId}&limit=${limit}`);
    return response.data?.data || [];
  }

  /**
   * Get all notifications
   */
  async getNotifications(userId: number, type?: string, limit: number = 50): Promise<Notification[]> {
    let url = `${API_BASE}?user_id=${userId}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    const response = await api.get(url);
    return response.data?.data || [];
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await api.put(`${API_BASE}/mark-read`, { id: notificationId });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number, type?: string): Promise<void> {
    await api.put(`${API_BASE}/mark-all-read`, { user_id: userId, type });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`${API_BASE}?id=${notificationId}`);
  }

  /**
   * Clear all notifications
   */
  async clearAll(userId: number): Promise<void> {
    await api.delete(`${API_BASE}/clear-all?user_id=${userId}`);
  }

  /**
   * Create a notification (for system use)
   */
  async createNotification(data: {
    user_id: number;
    type: string;
    title: string;
    message?: string;
    link?: string;
    reference_id?: number;
    reference_type?: string;
    action_type?: string;
  }): Promise<number> {
    const response = await api.post(API_BASE, data);
    return response.data?.id || 0;
  }

  /**
   * Get activity log
   */
  async getActivityLog(params: {
    user_id?: number;
    entity_type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ActivityLog[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.append('user_id', params.user_id.toString());
    if (params.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    const response = await api.get(`${API_BASE}/activity?${searchParams.toString()}`);
    return response.data?.data || [];
  }

  /**
   * Get notification icon based on type and action
   */
  getNotificationIcon(type: string, actionType?: string): string {
    if (type === 'task') {
      switch (actionType) {
        case 'new_task': return '📋';
        case 'task_approved': return '✅';
        case 'task_rejected': return '❌';
        case 'task_revised': return '🔄';
        case 'task_submitted': return '📤';
        default: return '📝';
      }
    }
    
    switch (type) {
      case 'timesheet': return '⏰';
      case 'attendance': return '📅';
      case 'document': return '📄';
      case 'module': return '📚';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  }

  /**
   * Get notification color based on action type
   */
  getNotificationColor(actionType?: string): string {
    switch (actionType) {
      case 'task_approved':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'task_rejected':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'task_revised':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      case 'new_task':
      case 'task_submitted':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gold-500/20 border-gold-500/30 text-gold-400';
    }
  }

  /**
   * Format notification time
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
