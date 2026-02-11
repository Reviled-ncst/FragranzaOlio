import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Clock,
  Activity,
  Settings,
  Search,
  RefreshCw,
  FileText,
  Edit,
  Trash2,
  Eye,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import adminUsersService, { DashboardStats } from '../services/adminUsersService';
import adminLogsService, { AdminLog } from '../services/adminLogsService';

const AdminDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both stats and activity logs
      const [statsResponse, logsResponse] = await Promise.all([
        adminUsersService.getDashboardStats(),
        adminLogsService.getRecentActivity(10)
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        setError(statsResponse.message || 'Failed to load stats');
      }
      
      if (logsResponse.success && logsResponse.data) {
        setActivityLogs(logsResponse.data.logs);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'sales': return Briefcase;
      case 'ojt': return GraduationCap;
      case 'ojt_supervisor': return UserCheck;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'sales': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ojt': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ojt_supervisor': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrators';
      case 'sales': return 'Sales Staff';
      case 'ojt': return 'OJT Trainees';
      case 'ojt_supervisor': return 'OJT Supervisors';
      case 'customer': return 'Customers';
      default: return role;
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <UserPlus className="text-green-400" size={16} />;
      case 'update': return <Edit className="text-blue-400" size={16} />;
      case 'delete': return <Trash2 className="text-red-400" size={16} />;
      case 'login': return <LogIn className="text-purple-400" size={16} />;
      case 'view': return <Eye className="text-yellow-400" size={16} />;
      default: return <FileText className="text-gray-400" size={16} />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'bg-green-500/20 text-green-400';
      case 'update': return 'bg-blue-500/20 text-blue-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      case 'login': return 'bg-purple-500/20 text-purple-400';
      case 'view': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-400">
              System overview and user management
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-300 hover:text-white hover:border-gold-500 transition-all text-sm sm:text-base"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/admin/users"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all text-sm sm:text-base"
            >
              <UserPlus size={16} />
              <span>Manage Users</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        ) : stats ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {/* Total Users */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                    <Users className="text-gold-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Total Users</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>

              {/* Active Users */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <UserCheck className="text-green-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Active Users</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">
                  {stats.statusCounts?.active || 0}
                </p>
              </div>

              {/* Recent Logins */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Logins (7 days)</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">{stats.recentLogins}</p>
              </div>

              {/* New This Month */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-purple-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">New This Month</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">{stats.newUsersThisMonth}</p>
              </div>
            </div>

            {/* Users by Role */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Role Distribution */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white mb-4">
                  Users by Role
                </h2>
                <div className="space-y-3">
                  {Object.entries(stats.roleCounts).map(([role, count]) => {
                    const Icon = getRoleIcon(role);
                    const percentage = stats.totalUsers > 0 
                      ? Math.round((count / stats.totalUsers) * 100) 
                      : 0;
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getRoleColor(role)}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-300">{getRoleLabel(role)}</span>
                            <span className="text-sm font-medium text-white">{count}</span>
                          </div>
                          <div className="h-2 bg-black-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gold-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Status */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white mb-4">
                  Account Status
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(stats.statusCounts).map(([status, count]) => {
                    const statusConfig: Record<string, { color: string; icon: typeof UserCheck }> = {
                      active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: UserCheck },
                      inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: UserX },
                      suspended: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Shield },
                      pending_verification: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
                    };
                    const config = statusConfig[status] || statusConfig.inactive;
                    const Icon = config.icon;
                    return (
                      <div 
                        key={status} 
                        className={`p-4 rounded-lg border ${config.color}`}
                      >
                        <Icon size={24} className="mb-2" />
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs capitalize">{status.replace('_', ' ')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity - Admin Logs */}
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-display font-semibold text-white flex items-center gap-2">
                  <Activity className="text-gold-500" size={20} />
                  Admin Activity Log
                </h2>
                <Link 
                  to="/admin/logs"
                  className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-black-800 rounded-lg border border-gold-500/10 hover:border-gold-500/20 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(log.action_type)}`}>
                        {getActivityIcon(log.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-medium text-gold-400">{log.admin_name}</span>
                          <span className="text-gray-400"> {log.action_type === 'create' ? 'created' : log.action_type === 'update' ? 'updated' : log.action_type === 'delete' ? 'deleted' : log.action_type} </span>
                          {log.target_name && (
                            <span className="text-white">{log.target_name}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{log.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{adminLogsService.formatTimeAgo(log.created_at)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No admin activity yet</p>
                    <p className="text-xs mt-1">Actions like creating users will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Link
                to="/admin/users?action=add&role=ojt"
                className="flex flex-col items-center gap-2 p-4 bg-black-900 border border-blue-500/30 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <GraduationCap className="text-blue-400" size={24} />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white text-center">Add OJT Account</span>
              </Link>
              
              <Link
                to="/admin/users?action=add&role=ojt_supervisor"
                className="flex flex-col items-center gap-2 p-4 bg-black-900 border border-purple-500/30 rounded-xl hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <UserCheck className="text-purple-400" size={24} />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white text-center">Add Supervisor</span>
              </Link>
              
              <Link
                to="/admin/users?action=add&role=sales"
                className="flex flex-col items-center gap-2 p-4 bg-black-900 border border-green-500/30 rounded-xl hover:border-green-500 hover:bg-green-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Briefcase className="text-green-400" size={24} />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white text-center">Add Sales Staff</span>
              </Link>
              
              <Link
                to="/admin/settings"
                className="flex flex-col items-center gap-2 p-4 bg-black-900 border border-gold-500/30 rounded-xl hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                  <Settings className="text-gold-400" size={24} />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white text-center">Settings</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
