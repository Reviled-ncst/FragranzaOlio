import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  GraduationCap,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ClipboardList,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import supervisorService, { 
  DashboardData, 
  TraineeOverview, 
  PendingApproval 
} from '../services/supervisorService';
import { ojtTimesheetService } from '../services/ojtService';

// Full-screen loading component with gold theme
const LoadingScreen = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black-950 via-black-900 to-gold-950"
  >
    <div className="text-center">
      {/* Animated Logo/Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-gold-500/30 border-t-gold-500"
        />
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GraduationCap size={40} className="text-gold-400" />
          </motion.div>
        </div>
        {/* Sparkles */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles size={20} className="text-gold-400" />
        </motion.div>
      </motion.div>

      {/* Loading text */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold bg-gradient-to-r from-gold-400 to-amber-400 bg-clip-text text-transparent mb-3"
      >
        Supervisor Dashboard
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 mb-6"
      >
        Loading your team data...
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "200px" }}
        transition={{ delay: 0.3 }}
        className="mx-auto h-1 bg-gold-500/20 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
        />
      </motion.div>

      {/* Loading steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 space-y-2 text-sm text-gray-500"
      >
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <Users size={14} />
          <span>Fetching trainee data</span>
        </motion.div>
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          className="flex items-center justify-center gap-2"
        >
          <Clock size={14} />
          <span>Loading timesheets</span>
        </motion.div>
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <TrendingUp size={14} />
          <span>Calculating statistics</span>
        </motion.div>
      </motion.div>
    </div>
  </motion.div>
);

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainees, setTrainees] = useState<TraineeOverview[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState({
    totalTrainees: 0,
    avgProgress: 0,
    pendingApprovals: 0,
    hoursThisWeek: 0
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    // Only show loading spinner on first load
    if (!hasLoaded) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Try to fetch real data from API
      const data: DashboardData = await supervisorService.getDashboard(user.id);
      
      if (data?.stats) {
        setStats({
          totalTrainees: data.stats.totalTrainees ?? 0,
          avgProgress: data.trainees?.length > 0 
            ? Math.round(data.trainees.reduce((acc, t) => acc + t.progress, 0) / data.trainees.length)
            : 0,
          pendingApprovals: (data.stats.pendingTimesheets ?? 0) + (data.stats.pendingTasks ?? 0),
          hoursThisWeek: data.stats.totalHoursThisWeek ?? 0
        });
      }
      
      setTrainees(data?.trainees ?? []);
      setPendingApprovals(data?.pendingApprovals ?? []);
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load data. Please try again.');
      setTrainees([]);
      setPendingApprovals([]);
      setStats({ totalTrainees: 0, avgProgress: 0, pendingApprovals: 0, hoursThisWeek: 0 });
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [user?.id, hasLoaded]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApproveTimesheet = async (timesheetId: number) => {
    if (!user?.id) return;
    
    try {
      await ojtTimesheetService.approveTimesheet(timesheetId, user.id);
      fetchDashboardData();
    } catch (err) {
      console.error('Error approving timesheet:', err);
      alert('Failed to approve timesheet');
    }
  };

  const handleRejectTimesheet = async (timesheetId: number) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason || !user?.id) return;
    
    try {
      await ojtTimesheetService.rejectTimesheet(timesheetId, user.id, reason);
      fetchDashboardData();
    } catch (err) {
      console.error('Error rejecting timesheet:', err);
      alert('Failed to reject timesheet');
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (progress >= 50) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (progress >= 25) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getStatusLabel = (progress: number) => {
    if (progress >= 75) return 'Excellent';
    if (progress >= 50) return 'On Track';
    if (progress >= 25) return 'Progressing';
    return 'Needs Attention';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 75) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-blue-400';
    if (progress >= 25) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Full-screen loading animation for initial load */}
      <AnimatePresence>
        {isLoading && !hasLoaded && <LoadingScreen />}
      </AnimatePresence>

      <SupervisorLayout title="Dashboard">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30">
                  <GraduationCap className="text-gold-400" size={24} />
                </div>
                Welcome Back
              </h1>
              <p className="text-gray-400 mt-1">{user?.firstName || 'Supervisor'}, here's your team overview</p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-xl text-gray-300 hover:text-gold-400 hover:border-gold-500/50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-gold-500/20 rounded-xl flex items-center justify-center">
                      <Users className="text-gold-400" size={22} />
                    </div>
                    <span className="text-xs text-gold-400/70 px-2 py-1 bg-gold-500/10 rounded-lg">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-gold-400 mb-1">{stats.totalTrainees}</p>
                  <p className="text-sm text-gray-400">Total Trainees</p>
                </div>

                <div className="bg-black-900 border border-emerald-500/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-emerald-400" size={22} />
                    </div>
                    <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg">+5%</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400 mb-1">{stats.avgProgress}%</p>
                  <p className="text-sm text-gray-400">Avg. Progress</p>
                </div>

                <div className={`bg-black-900 border rounded-xl p-4 sm:p-5 ${stats.pendingApprovals > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-500/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <FileCheck className="text-amber-400" size={22} />
                    </div>
                    {stats.pendingApprovals > 0 && (
                      <span className="text-xs text-amber-400 px-2 py-1 bg-amber-500/20 rounded-lg animate-pulse">Pending</span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-amber-400 mb-1">{stats.pendingApprovals}</p>
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                </div>

                <div className="bg-black-900 border border-blue-500/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="text-blue-400" size={22} />
                    </div>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-black-800 rounded-lg">This Week</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-400 mb-1">{stats.hoursThisWeek}</p>
                  <p className="text-sm text-gray-400">Hours Logged</p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trainees Overview */}
                <div className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <div className="p-1.5 bg-gold-500/20 rounded-lg">
                        <GraduationCap size={16} className="text-gold-400" />
                      </div>
                      My Trainees
                    </h2>
                    <Link
                      to="/supervisor/trainees"
                      className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                    >
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="divide-y divide-gold-500/10">
                    {trainees.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users size={28} className="text-gold-500/50" />
                        </div>
                        <p className="text-gray-400">No trainees assigned yet</p>
                      </div>
                    ) : (
                      trainees.slice(0, 3).map((trainee) => (
                        <div key={trainee.id} className="p-4 hover:bg-gold-500/5 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-black font-bold text-sm">
                                  {trainee.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">{trainee.name}</p>
                                <p className="text-xs text-gray-500 truncate">{trainee.department}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getStatusColor(trainee.progress)}`}>
                              {getStatusLabel(trainee.progress)}
                            </span>
                          </div>
                          {/* Task completion stats */}
                          {(trainee.total_tasks !== undefined && trainee.total_tasks > 0) && (
                            <div className="flex items-center gap-3 mt-2 mb-2 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle size={12} />
                                <span>{trainee.tasks_completed || 0}/{trainee.total_tasks} tasks</span>
                              </div>
                              {trainee.tasks_pending_review && trainee.tasks_pending_review > 0 && (
                                <div className="flex items-center gap-1.5 text-amber-400">
                                  <Clock size={12} />
                                  <span>{trainee.tasks_pending_review} pending</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                              <span>{trainee.completed_hours} / {trainee.total_required_hours} hours</span>
                              <span className="font-medium">{trainee.progress}%</span>
                            </div>
                            <div className="w-full bg-black-700 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(trainee.progress, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-2 rounded-full ${getProgressBarColor(trainee.progress)}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className={`bg-black-900 border rounded-xl overflow-hidden ${pendingApprovals.length > 0 ? 'border-amber-500/30' : 'border-gold-500/20'}`}>
                  <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${pendingApprovals.length > 0 ? 'bg-amber-500/20' : 'bg-gold-500/20'}`}>
                        <Clock size={16} className={pendingApprovals.length > 0 ? 'text-amber-400' : 'text-gold-400'} />
                      </div>
                      Pending Approvals
                      {pendingApprovals.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                          {pendingApprovals.length}
                        </span>
                      )}
                    </h2>
                    <Link
                      to="/supervisor/tasks"
                      className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                    >
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="divide-y divide-gold-500/10">
                    {pendingApprovals.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircle size={28} className="text-emerald-500/50" />
                        </div>
                        <p className="text-gray-400">All caught up! No pending approvals</p>
                      </div>
                    ) : (
                      pendingApprovals.slice(0, 3).map((approval) => (
                        <div key={`${approval.type}-${approval.id}`} className="p-4 hover:bg-gold-500/5 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                approval.type === 'task' 
                                  ? 'bg-blue-500/10 border border-blue-500/20' 
                                  : 'bg-amber-500/10 border border-amber-500/20'
                              }`}>
                                {approval.type === 'task' ? (
                                  <ClipboardList size={18} className="text-blue-400" />
                                ) : (
                                  <Clock size={18} className="text-amber-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">
                                  {approval.type === 'task' ? approval.title : 'Weekly Timesheet'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {approval.trainee_name} • {formatTimeAgo(approval.submitted_at)}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  {approval.type === 'task' ? (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      approval.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                      approval.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {approval.priority} priority
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-xs text-amber-400">
                                        {approval.week_start && approval.week_end 
                                          ? `${formatDate(approval.week_start)} - ${formatDate(approval.week_end)}`
                                          : ''}
                                      </span>
                                      <span className="text-xs text-gold-400 font-medium">{approval.total_hours} hrs</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {approval.type === 'task' ? (
                              <Link 
                                to="/supervisor/tasks"
                                className="flex-1 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-medium flex items-center justify-center gap-1.5"
                              >
                                <ClipboardList size={14} />
                                Review Task
                              </Link>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleApproveTimesheet(approval.id)}
                                  className="flex-1 py-2 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors font-medium flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle size={14} />
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectTimesheet(approval.id)}
                                  className="flex-1 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-gold-400" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    to="/supervisor/trainees"
                    className="flex flex-col items-center gap-3 p-4 bg-black-800 border border-gold-500/30 rounded-xl hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                      <Users className="text-gold-400" size={22} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white text-center font-medium">Manage Trainees</span>
                  </Link>

                  <Link
                    to="/supervisor/timesheets"
                    className="flex flex-col items-center gap-3 p-4 bg-black-800 border border-amber-500/30 rounded-xl hover:border-amber-500 hover:bg-amber-500/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                      <Clock className="text-amber-400" size={22} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white text-center font-medium">Review Timesheets</span>
                  </Link>

                  <Link
                    to="/supervisor/tasks"
                    className="flex flex-col items-center gap-3 p-4 bg-black-800 border border-emerald-500/30 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <ClipboardList className="text-emerald-400" size={22} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white text-center font-medium">Assign Tasks</span>
                  </Link>

                  <Link
                    to="/supervisor/reports"
                    className="flex flex-col items-center gap-3 p-4 bg-black-800 border border-blue-500/30 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <Calendar className="text-blue-400" size={22} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white text-center font-medium">View Reports</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </SupervisorLayout>
    </>
  );
};

export default SupervisorDashboard;
