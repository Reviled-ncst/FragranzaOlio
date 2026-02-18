import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HRLayout from '../components/layout/HRLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface DashboardStats {
  totalEmployees: number;
  totalInterns: number;
  activeToday: number;
  pendingPayouts: number;
  totalHoursThisMonth: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: number;
  type: 'clock_in' | 'clock_out' | 'leave_request' | 'payout';
  user: string;
  message: string;
  time: string;
}

const HRDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalInterns: 0,
    activeToday: 0,
    pendingPayouts: 0,
    totalHoursThisMonth: 0,
    pendingApprovals: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // For now, use mock data - will connect to backend later
      setStats({
        totalEmployees: 24,
        totalInterns: 12,
        activeToday: 28,
        pendingPayouts: 5,
        totalHoursThisMonth: 4320,
        pendingApprovals: 8
      });

      setRecentActivity([
        { id: 1, type: 'clock_in', user: 'John Doe', message: 'Clocked in', time: '8:00 AM' },
        { id: 2, type: 'clock_in', user: 'Jane Smith', message: 'Clocked in', time: '8:15 AM' },
        { id: 3, type: 'leave_request', user: 'Mike Johnson', message: 'Requested leave', time: '9:30 AM' },
        { id: 4, type: 'clock_out', user: 'Sarah Wilson', message: 'Clocked out', time: '5:00 PM' },
        { id: 5, type: 'payout', user: 'HR System', message: 'Payroll processed', time: 'Yesterday' },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Employees', 
      value: stats.totalEmployees, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      link: '/hr/employees'
    },
    { 
      label: 'OJT Interns', 
      value: stats.totalInterns, 
      icon: GraduationCap, 
      color: 'from-purple-500 to-purple-600',
      link: '/hr/interns'
    },
    { 
      label: 'Active Today', 
      value: stats.activeToday, 
      icon: CheckCircle, 
      color: 'from-green-500 to-green-600',
      link: '/hr/attendance'
    },
    { 
      label: 'Pending Payouts', 
      value: stats.pendingPayouts, 
      icon: DollarSign, 
      color: 'from-pink-500 to-pink-600',
      link: '/hr/payroll'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
        return <CheckCircle className="text-green-400" size={18} />;
      case 'clock_out':
        return <Clock className="text-blue-400" size={18} />;
      case 'leave_request':
        return <AlertCircle className="text-yellow-400" size={18} />;
      case 'payout':
        return <DollarSign className="text-pink-400" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  if (loading) {
    return (
      <HRLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-pink-500" size={40} />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={stat.link}
                className="block bg-black-900 border border-pink-500/20 rounded-xl p-6 hover:border-pink-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-pink-400 transition-colors" size={20} />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/hr/employees"
                className="flex items-center gap-3 p-3 bg-black-800 rounded-lg hover:bg-black-700 transition-colors"
              >
                <Users className="text-blue-400" size={20} />
                <span className="text-white">Manage Employees</span>
              </Link>
              <Link
                to="/hr/interns"
                className="flex items-center gap-3 p-3 bg-black-800 rounded-lg hover:bg-black-700 transition-colors"
              >
                <GraduationCap className="text-purple-400" size={20} />
                <span className="text-white">Manage Interns</span>
              </Link>
              <Link
                to="/hr/timesheets"
                className="flex items-center gap-3 p-3 bg-black-800 rounded-lg hover:bg-black-700 transition-colors"
              >
                <Clock className="text-green-400" size={20} />
                <span className="text-white">Review Timesheets</span>
              </Link>
              <Link
                to="/hr/payroll"
                className="flex items-center gap-3 p-3 bg-black-800 rounded-lg hover:bg-black-700 transition-colors"
              >
                <DollarSign className="text-pink-400" size={20} />
                <span className="text-white">Process Payroll</span>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 bg-black-800 rounded-lg"
                >
                  <div className="p-2 bg-black-700 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{activity.user}</span> - {activity.message}
                    </p>
                    <p className="text-gray-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hours Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Hours This Month</h3>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {stats.totalHoursThisMonth.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm">Total hours worked across all staff</p>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Employees</span>
                <span className="text-white">{Math.round(stats.totalHoursThisMonth * 0.7).toLocaleString()} hrs</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Interns</span>
                <span className="text-white">{Math.round(stats.totalHoursThisMonth * 0.3).toLocaleString()} hrs</span>
              </div>
            </div>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
              <AlertCircle className="text-yellow-400" size={20} />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.pendingApprovals}</p>
            <p className="text-gray-400 text-sm">Items requiring your attention</p>
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Timesheet corrections</span>
                <span className="text-yellow-400">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Leave requests</span>
                <span className="text-yellow-400">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Overtime approvals</span>
                <span className="text-yellow-400">3</span>
              </div>
            </div>
            <Link
              to="/hr/timesheets"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Review All
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
