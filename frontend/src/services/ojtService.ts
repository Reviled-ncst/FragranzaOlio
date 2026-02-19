/**
 * OJT Service
 * Handles all OJT-related API calls (tasks, timesheets, attendance)
 */

import api, { uploadFile } from './api';

// API Response type (axios interceptor unwraps the response)
interface ApiDataResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

// ============ TASKS ============

const TASKS_API = '/ojt_tasks.php';

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_by: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'under_review' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'revision' | 'submitted';
  due_date?: string;
  completed_at?: string;
  submission_text?: string;
  submission_notes?: string;
  submission_file?: string;
  feedback?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  assignee_name: string;
  assignee_email: string;
  assignee_avatar?: string;
  assigner_name: string;
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id: number;
  task_id: number;
  trainee_id: number;
  submission_type: 'file' | 'text' | 'link';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  submission_text?: string;
  submission_link?: string;
  submitted_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to: number | string;
  assigned_by: number | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assigned_to?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  due_date?: string;
  feedback?: string;
  rating?: number;
}

class OjtTaskService {
  /**
   * Get all tasks with filters
   */
  async getTasks(options?: {
    supervisor_id?: number | string;
    trainee_id?: number | string;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (options?.supervisor_id) params.append('supervisor_id', String(options.supervisor_id));
    if (options?.trainee_id) params.append('trainee_id', String(options.trainee_id));
    if (options?.status) params.append('status', options.status);
    if (options?.priority) params.append('priority', options.priority);
    if (options?.search) params.append('search', options.search);
    
    const response = await api.get(`${TASKS_API}?${params.toString()}`);
    return (response as ApiDataResponse<Task[]>).data;
  }

  /**
   * Get single task
   */
  async getTask(taskId: number): Promise<Task> {
    const response = await api.get(`${TASKS_API}/${taskId}`);
    return (response as ApiDataResponse<Task>).data;
  }

  /**
   * Create new task
   */
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post(TASKS_API, data);
    return (response as ApiDataResponse<Task>).data;
  }

  /**
   * Update task
   */
  async updateTask(taskId: number, data: UpdateTaskData): Promise<Task> {
    const response = await api.put(`${TASKS_API}/${taskId}`, data);
    return (response as ApiDataResponse<Task>).data;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: number): Promise<void> {
    await api.delete(`${TASKS_API}/${taskId}`);
  }

  /**
   * Submit task (trainee submitting work)
   * Uses direct upload to bypass Vercel proxy size limits for file uploads
   */
  async submitTask(
    taskId: number,
    traineeId: number | string,
    data: {
      submission_text?: string;
      submission_link?: string;
      file?: File;
    }
  ): Promise<void> {
    const formData = new FormData();
    formData.append('trainee_id', String(traineeId));
    
    if (data.submission_text) {
      formData.append('submission_text', data.submission_text);
      formData.append('submission_type', 'text');
    }
    
    if (data.submission_link) {
      formData.append('submission_link', data.submission_link);
      formData.append('submission_type', 'link');
    }
    
    if (data.file) {
      formData.append('file', data.file);
      formData.append('submission_type', 'file');
      // Use direct upload for files to bypass Vercel 4.5MB limit
      await uploadFile(`${TASKS_API}/${taskId}/submit`, formData);
      return;
    }
    
    // For text/link submissions, use regular API
    await api.post(`${TASKS_API}/${taskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  /**
   * Review task (supervisor approving/rejecting)
   */
  async reviewTask(
    taskId: number,
    action: 'approve' | 'reject',
    feedback?: string,
    rating?: number
  ): Promise<void> {
    await api.post(`${TASKS_API}/${taskId}/review`, {
      action,
      feedback,
      rating
    });
  }

  /**
   * Get trainee's tasks
   */
  async getMyTasks(traineeId: number | string): Promise<Task[]> {
    const response = await api.get(`${TASKS_API}/my-tasks?trainee_id=${traineeId}`);
    return (response as ApiDataResponse<Task[]>).data;
  }
}

export const ojtTaskService = new OjtTaskService();

// ============ TIMESHEETS ============

const TIMESHEETS_API = '/ojt_timesheets.php';

export interface TimesheetEntry {
  id: number;
  timesheet_id: number;
  entry_date: string;
  time_in?: string;
  time_out?: string;
  break_hours: number;
  hours_worked: number;
  tasks_completed?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: number;
  trainee_id: number;
  supervisor_id: number | string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  trainee_name: string;
  trainee_email: string;
  trainee_avatar?: string;
  supervisor_name: string;
  reviewer_name?: string;
  entries: TimesheetEntry[];
}

export interface CreateTimesheetData {
  trainee_id: number;
  supervisor_id: number;
  week_start: string;
  week_end: string;
  notes?: string;
  entries?: Array<{
    entry_date: string;
    time_in?: string;
    time_out?: string;
    break_hours?: number;
    hours_worked?: number;
    tasks_completed?: string;
    notes?: string;
  }>;
}

export interface UpdateTimesheetData {
  notes?: string;
  entries?: Array<{
    entry_date: string;
    time_in?: string;
    time_out?: string;
    break_hours?: number;
    hours_worked?: number;
    tasks_completed?: string;
    notes?: string;
  }>;
}

class OjtTimesheetService {
  /**
   * Get all timesheets with filters
   */
  async getTimesheets(options?: {
    supervisor_id?: number | string;
    trainee_id?: number | string;
    status?: string;
    week_start?: string;
  }): Promise<Timesheet[]> {
    const params = new URLSearchParams();
    
    if (options?.supervisor_id) params.append('supervisor_id', String(options.supervisor_id));
    if (options?.trainee_id) params.append('trainee_id', String(options.trainee_id));
    if (options?.status) params.append('status', options.status);
    if (options?.week_start) params.append('week_start', options.week_start);
    
    const response = await api.get(`${TIMESHEETS_API}?${params.toString()}`);
    return (response as ApiDataResponse<Timesheet[]>).data;
  }

  /**
   * Get single timesheet
   */
  async getTimesheet(timesheetId: number): Promise<Timesheet> {
    const response = await api.get(`${TIMESHEETS_API}/${timesheetId}`);
    return (response as ApiDataResponse<Timesheet>).data;
  }

  /**
   * Get pending timesheets for supervisor
   */
  async getPendingTimesheets(supervisorId: number | string): Promise<Timesheet[]> {
    const response = await api.get(
      `${TIMESHEETS_API}/pending?supervisor_id=${supervisorId}`
    );
    return (response as ApiDataResponse<Timesheet[]>).data;
  }

  /**
   * Get trainee's timesheets
   */
  async getMyTimesheets(traineeId: number | string): Promise<Timesheet[]> {
    const response = await api.get(
      `${TIMESHEETS_API}/my-timesheets?trainee_id=${traineeId}`
    );
    return (response as ApiDataResponse<Timesheet[]>).data;
  }

  /**
   * Get or create current week timesheet
   */
  async getCurrentWeekTimesheet(traineeId: number | string): Promise<Timesheet> {
    const response = await api.get(
      `${TIMESHEETS_API}/current-week?trainee_id=${traineeId}`
    );
    return (response as ApiDataResponse<Timesheet>).data;
  }

  /**
   * Create new timesheet
   */
  async createTimesheet(data: CreateTimesheetData): Promise<Timesheet> {
    const response = await api.post(TIMESHEETS_API, data);
    return (response as ApiDataResponse<Timesheet>).data;
  }

  /**
   * Update timesheet
   */
  async updateTimesheet(timesheetId: number, data: UpdateTimesheetData): Promise<Timesheet> {
    const response = await api.put(`${TIMESHEETS_API}/${timesheetId}`, data);
    return (response as ApiDataResponse<Timesheet>).data;
  }

  /**
   * Delete timesheet
   */
  async deleteTimesheet(timesheetId: number): Promise<void> {
    await api.delete(`${TIMESHEETS_API}/${timesheetId}`);
  }

  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(timesheetId: number): Promise<void> {
    await api.post(`${TIMESHEETS_API}/${timesheetId}/submit`, {});
  }

  /**
   * Approve timesheet
   */
  async approveTimesheet(timesheetId: number, reviewerId: number | string): Promise<void> {
    await api.post(`${TIMESHEETS_API}/${timesheetId}/approve`, {
      reviewer_id: reviewerId
    });
  }

  /**
   * Reject timesheet
   */
  async rejectTimesheet(
    timesheetId: number,
    reviewerId: number | string,
    reason: string
  ): Promise<void> {
    await api.post(`${TIMESHEETS_API}/${timesheetId}/reject`, {
      reviewer_id: reviewerId,
      reason
    });
  }

  /**
   * Update timesheet entries
   */
  async updateEntries(
    timesheetId: number,
    entries: Array<{
      entry_date: string;
      time_in?: string;
      time_out?: string;
      break_hours?: number;
      hours_worked?: number;
      tasks_completed?: string;
      notes?: string;
    }>
  ): Promise<void> {
    await api.post(`${TIMESHEETS_API}/${timesheetId}/entries`, { entries });
  }
}

export const ojtTimesheetService = new OjtTimesheetService();

// Export combined service
export const ojtService = {
  tasks: ojtTaskService,
  timesheets: ojtTimesheetService
};

export default ojtService;

