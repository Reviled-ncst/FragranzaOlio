import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { 
  Package, 
  Warehouse, 
  Clock,
  CheckCircle,
  Calendar,
  BookOpen,
  ClipboardList,
  TrendingUp,
  User,
  Bell,
  ChevronRight,
  Award,
  Target,
  Star,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OJTLayout from '../components/layout/OJTLayout';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  rating?: number;
  feedback?: string;
  created_at: string;
  completed_at?: string;
}

interface DashboardData {
  tasks: Task[];
  totalHours: number;
  targetHours: number;
  todayHours: number;
  weekHours: number;
  daysRemaining: number;
  currentWeek: number;
  startDate: string;
  endDate: string;
  averageRating: number;
  tasksCompletedThisWeek: number;
}

const OJTDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all necessary data in parallel
      const [tasksRes, attendanceRes, assignmentRes] = await Promise.allSettled([
        api.get(`/ojt_tasks.php?assigned_to=${user.id}`),
        api.get(`/ojt_attendance.php/history?trainee_id=${user.id}`),
        api.get(`/ojt_timesheets.php/get-assignment?trainee_id=${user.id}`)
      ]);

      const tasks: Task[] = tasksRes.status === 'fulfilled' 
        ? ((tasksRes.value as any).data || []) 
        : [];
      
      const attendanceData = attendanceRes.status === 'fulfilled' 
        ? ((attendanceRes.value as any).data || []) 
        : [];
      
      const assignmentData = assignmentRes.status === 'fulfilled' 
        ? ((assignmentRes.value as any) || {}) 
        : {};
      const assignment = assignmentData.success ? (assignmentData.data || {}) : {};

      // Calculate hours from attendance
      const totalHours = attendanceData.reduce((sum: number, a: any) => sum + (parseFloat(a.work_hours) || 0), 0);
      
      // Today's hours
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData.find((a: any) => a.attendance_date === today);
      const todayHours = todayAttendance ? (parseFloat(todayAttendance.work_hours) || 0) : 0;

      // This week's hours
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekHours = attendanceData
        .filter((a: any) => new Date(a.attendance_date) >= weekStart)
        .reduce((sum: number, a: any) => sum + (parseFloat(a.work_hours) || 0), 0);

      // Calculate dates and weeks
      const startDate = assignment.start_date || '2025-11-01';
      const endDate = assignment.end_date || '2026-04-30';
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      const currentWeek = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      // Calculate average rating
      const ratedTasks = tasks.filter((t: Task) => t.rating);
      const averageRating = ratedTasks.length > 0 
        ? ratedTasks.reduce((sum: number, t: Task) => sum + (t.rating || 0), 0) / ratedTasks.length 
        : 0;

      // Tasks completed this week
      const tasksCompletedThisWeek = tasks.filter((t: Task) => {
        if (t.status !== 'completed' || !t.completed_at) return false;
        return new Date(t.completed_at) >= weekStart;
      }).length;

      setData({
        tasks,
        totalHours: Math.round(totalHours * 10) / 10,
        targetHours: assignment.total_required_hours || 500,
        todayHours: Math.round(todayHours * 10) / 10,
        weekHours: Math.round(weekHours * 10) / 10,
        daysRemaining,
        currentWeek,
        startDate,
        endDate,
        averageRating: Math.round(averageRating * 10) / 10,
        tasksCompletedThisWeek
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Allow OJT, OJT Supervisor, Sales, and Admin to access
  if (!['ojt', 'ojt_supervisor', 'sales', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate progress percentages
  const completedTasks = data?.tasks.filter(t => t.status === 'completed').length || 0;
  const totalTasks = data?.tasks.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const hoursPercentage = data ? (data.totalHours / data.targetHours) * 100 : 0;

  // Get active tasks (pending or in_progress)
  const activeTasks = data?.tasks
    .filter(t => ['pending', 'in_progress', 'under_review'].includes(t.status))
    .sort((a, b) => new Date(a.due_date || '9999').getTime() - new Date(b.due_date || '9999').getTime())
    .slice(0, 4) || [];

  // Get recent completed tasks for activity feed
  const recentCompletedTasks = data?.tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
    .slice(0, 4) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'under_review': return 'text-amber-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'under_review': return 'Under Review';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPerformanceLabel = () => {
    if (!data) return { label: 'Loading...', color: 'text-gray-400' };
    
    const taskRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const hoursRate = data.targetHours > 0 ? (data.totalHours / data.targetHours) * 100 : 0;
    const avgScore = (taskRate + hoursRate) / 2;
    
    if (avgScore >= 80) return { label: 'Excellent', color: 'text-green-400' };
    if (avgScore >= 60) return { label: 'Above Average', color: 'text-gold-400' };
    if (avgScore >= 40) return { label: 'On Track', color: 'text-amber-400' };
    return { label: 'Needs Improvement', color: 'text-red-400' };
  };

  const performance = getPerformanceLabel();

  return (
    <OJTLayout title="OJT Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
              <Award size={16} />
              <span>OJT Trainee Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-1.5 sm:mb-2">
              Welcome, {user.firstName}! 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Track your training progress and manage your tasks.
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gold-400 hover:bg-black-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
            <button 
              onClick={() => fetchDashboardData()}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="text-gold-500 animate-spin" />
          </div>
        )}

        {/* Main Content */}
        {data && (
          <>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Training Progress Card */}
              <div className="lg:col-span-2 bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="text-gold-500" size={20} />
                    Training Progress
                  </h2>
                  <span className="text-sm text-gray-400">Week {data.currentWeek}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Tasks Progress */}
                  <div className="bg-black-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Tasks Completed</span>
                      <span className="text-white font-medium">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progressPercentage.toFixed(0)}% complete</p>
                  </div>

                  {/* Hours Progress */}
                  <div className="bg-black-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Hours Logged</span>
                      <span className="text-white font-medium">
                        {data.totalHours}/{data.targetHours} hrs
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-gold-600 to-gold-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{hoursPercentage.toFixed(0)}% of target hours</p>
                  </div>
                </div>

                {/* Average Rating */}
                {data.averageRating > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gold-500/10 border border-gold-500/20 rounded-lg mb-4">
                    <Star className="text-gold-400 fill-gold-400" size={18} />
                    <span className="text-gold-400 text-sm">
                      Average Task Rating: <strong>{data.averageRating.toFixed(1)}/5</strong>
                    </span>
                    <div className="flex gap-0.5 ml-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= Math.round(data.averageRating) ? 'text-gold-400 fill-gold-400' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gold-500/10 border border-gold-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gold-400" size={18} />
                    <span className="text-gold-400 text-sm">{data.daysRemaining} days remaining in your OJT program</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-black-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="text-green-400" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">This Week</p>
                        <p className="text-white font-medium">{data.tasksCompletedThisWeek} tasks done</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="text-gold-400" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Today</p>
                        <p className="text-white font-medium">{data.todayHours} hours</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-amber-400" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Performance</p>
                        <p className={`font-medium ${performance.color}`}>{performance.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks and Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Active Tasks */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ClipboardList className="text-gold-500" size={20} />
                    Active Tasks
                  </h2>
                  <Link to="/ojt/tasks" className="text-gold-500 text-sm hover:text-gold-400 flex items-center gap-1">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                      <p>No active tasks!</p>
                      <p className="text-sm">All caught up 🎉</p>
                    </div>
                  ) : (
                    activeTasks.map((task) => (
                      <Link
                        to="/ojt/tasks"
                        key={task.id}
                        className="block p-3 bg-black-800 rounded-lg hover:bg-black-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-1">{task.title}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">Due: {formatDate(task.due_date)}</span>
                              <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Recently Completed */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="text-gold-500" size={20} />
                    Recently Completed
                  </h2>
                </div>
                <div className="space-y-3">
                  {recentCompletedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardList size={40} className="mx-auto mb-2 opacity-50" />
                      <p>No completed tasks yet</p>
                      <p className="text-sm">Start working on your tasks!</p>
                    </div>
                  ) : (
                    recentCompletedTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-black-800 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20">
                          <CheckCircle className="text-green-400" size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Completed {formatDate(task.completed_at || task.created_at)}</span>
                            {task.rating && (
                              <span className="flex items-center gap-0.5 text-gold-400">
                                <Star size={10} className="fill-gold-400" />
                                {task.rating}/5
                              </span>
                            )}
                          </div>
                        </div>
                        {task.feedback && (
                          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                            Reviewed
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions - Always visible */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link 
              to="/sales/products"
              className="flex flex-col items-center gap-2 p-4 bg-black-800 rounded-xl hover:bg-black-700 transition-all group"
            >
              <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                <Package className="text-gold-500" size={24} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white">Products</span>
            </Link>
            <Link 
              to="/sales/inventory"
              className="flex flex-col items-center gap-2 p-4 bg-black-800 rounded-xl hover:bg-black-700 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                <Warehouse className="text-amber-400" size={24} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white">Inventory</span>
            </Link>
            <Link 
              to="/ojt/timesheet"
              className="flex flex-col items-center gap-2 p-4 bg-black-800 rounded-xl hover:bg-black-700 transition-all group"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <Clock className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white">Timesheet</span>
            </Link>
            <Link 
              to="/ojt/progress"
              className="flex flex-col items-center gap-2 p-4 bg-black-800 rounded-xl hover:bg-black-700 transition-all group"
            >
              <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                <TrendingUp className="text-gold-400" size={24} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white">Progress</span>
            </Link>
          </div>
        </div>
      </div>
    </OJTLayout>
  );
};

export default OJTDashboard;
