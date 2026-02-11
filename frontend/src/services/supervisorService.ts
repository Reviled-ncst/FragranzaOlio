/**
 * Supervisor Service
 * Handles all supervisor-related API calls
 */

import api from './api';

const API_BASE = '/supervisor.php';

export interface DashboardStats {
  totalTrainees: number;
  pendingTimesheets: number;
  pendingTasks: number;
  totalHoursThisWeek: number;
}

export interface TraineeOverview {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  department: string;
  start_date: string;
  total_required_hours: number;
  completed_hours: number;
  progress: number;
  tasks_completed?: number;
  total_tasks?: number;
  tasks_pending_review?: number;
  task_completion_rate?: number;
}

export interface PendingApproval {
  id: number;
  trainee_id: number;
  trainee_name: string;
  submitted_at: string;
  type: 'timesheet' | 'task';
  // Timesheet specific fields
  week_start?: string;
  week_end?: string;
  total_hours?: number;
  // Task specific fields
  title?: string;
  description?: string;
  priority?: string;
  submission_notes?: string;
  submission_files?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  trainees: TraineeOverview[];
  pendingApprovals: PendingApproval[];
}

export interface Trainee {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  department?: string;
  university?: string;
  course?: string;
  start_date: string;
  end_date?: string;
  assignment_status?: string;
  required_hours?: number;
  total_required_hours?: number;
  hours_completed?: number;
  completed_hours?: number;
  tasks_completed: number;
  total_tasks: number;
  days_present?: number;
  total_days?: number;
  progress?: number;
  attendance?: number;
  last_active?: string;
}

export interface TraineeDetail extends Trainee {
  created_at: string;
  notes?: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
  recent_tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string;
    created_at: string;
  }>;
  attendance_stats: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
  };
  weekly_hours: Array<{
    week_start: string;
    total_hours: number;
    status: string;
  }>;
}

export interface PerformanceData {
  id: number;
  name: string;
  email: string;
  department: string;
  total_hours: number;
  total_required_hours: number;
  tasks_completed: number;
  total_tasks: number;
  avg_rating?: number;
  days_present: number;
  total_days: number;
  progress: number;
  task_completion: number;
  attendance_rate: number;
}

export interface WeeklyHoursData {
  name: string;
  week_start: string;
  total_hours: number;
}

export interface TaskStats {
  id: number;
  name: string;
  total_tasks: number;
  completed_tasks: number;
  avg_rating?: number;
  completion_rate: number;
}

class SupervisorService {
  /**
   * Get dashboard data for supervisor
   */
  async getDashboard(supervisorId: string | number): Promise<DashboardData> {
    const response = await api.get(`${API_BASE}/dashboard?supervisor_id=${supervisorId}`);
    // API returns {success: true, data: {...}}, and axios interceptor extracts response.data
    // So response is {success: true, data: {...}} and we need response.data
    return (response as any).data;
  }

  /**
   * Get all trainees for supervisor
   */
  async getTrainees(
    supervisorId: string | number,
    options?: {
      status?: string;
      search?: string;
      department?: string;
    }
  ): Promise<Trainee[]> {
    const params = new URLSearchParams({ supervisor_id: String(supervisorId) });
    
    if (options?.status) params.append('status', options.status);
    if (options?.search) params.append('search', options.search);
    if (options?.department) params.append('department', options.department);
    
    const response = await api.get(`${API_BASE}/trainees?${params.toString()}`);
    return (response as any).data || [];
  }

  /**
   * Get single trainee details
   */
  async getTrainee(supervisorId: string | number, traineeId: number): Promise<TraineeDetail> {
    const response = await api.get(
      `${API_BASE}/trainees/${traineeId}?supervisor_id=${supervisorId}`
    );
    return (response as any).data;
  }

  /**
   * Get performance statistics
   */
  async getStats(supervisorId: string | number): Promise<{
    weeklyHours: WeeklyHoursData[];
    taskStats: TaskStats[];
  }> {
    const response = await api.get(`${API_BASE}/stats?supervisor_id=${supervisorId}`);
    return (response as any).data;
  }

  /**
   * Get performance data for all trainees
   */
  async getPerformance(
    supervisorId: string | number,
    period?: string
  ): Promise<{ trainees: any[]; weekly_data: any[] }> {
    let url = `${API_BASE}/performance?supervisor_id=${supervisorId}`;
    if (period) {
      url += `&period=${period}`;
    }
    const response = await api.get(url);
    return (response as any).data || { trainees: [], weekly_data: [] };
  }
}

export const supervisorService = new SupervisorService();
export default supervisorService;
