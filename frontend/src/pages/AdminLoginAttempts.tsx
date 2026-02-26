import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Globe,
  Mail,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface LoginAttempt {
  id: number;
  email: string;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  success: boolean | number;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface LoginAttemptStats {
  bySuccess: { success: number; failed: number };
  byFailureReason: Record<string, number>;
  suspiciousIPs: Array<{ ip_address: string; attempt_count: number; last_attempt: string }>;
  suspiciousEmails: Array<{ email: string; attempt_count: number; last_attempt: string }>;
  dailyActivity: Array<{ date: string; success: number; failed: number }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminLoginAttempts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState<LoginAttemptStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attempts' | 'suspicious'>('overview');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('');
  const [failureReasonFilter, setFailureReasonFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const fetchAttempts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchTerm) params.append('search', searchTerm);
      if (successFilter !== '') params.append('success', successFilter);
      if (failureReasonFilter) params.append('failure_reason', failureReasonFilter);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const res = await apiFetch(`${API_BASE_URL}/admin_logs.php/login-attempts?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setAttempts(data.data.attempts || []);
        setPagination(data.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching login attempts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, successFilter, failureReasonFilter, dateRange]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/admin_logs.php/login-attempts/stats?days=7`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching login stats:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAttempts();
      fetchStats();
    }
  }, [isAuthenticated, user, fetchAttempts, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttempts(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchAttempts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFailureReasonLabel = (reason: string | null) => {
    const labels: Record<string, string> = {
      'invalid_email': 'Invalid Email',
      'invalid_password': 'Wrong Password',
      'account_suspended': 'Account Suspended',
      'account_inactive': 'Account Inactive',
    };
    return reason ? labels[reason] || reason : 'Unknown';
  };

  const getFailureReasonColor = (reason: string | null) => {
    const colors: Record<string, string> = {
      'invalid_email': 'bg-blue-500/20 text-blue-400',
      'invalid_password': 'bg-red-500/20 text-red-400',
      'account_suspended': 'bg-orange-500/20 text-orange-400',
      'account_inactive': 'bg-gray-500/20 text-gray-400',
    };
    return reason ? colors[reason] || 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/20 text-gray-400';
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const totalAttempts = stats ? stats.bySuccess.success + stats.bySuccess.failed : 0;
  const failureRate = totalAttempts > 0 ? ((stats?.bySuccess.failed || 0) / totalAttempts * 100).toFixed(1) : '0';

  return (
    <AdminLayout title="Login Attempts">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="text-gold-400" size={28} />
              Login Attempts Monitor
            </h1>
            <p className="text-gray-400 mt-1">Track and analyze login activity across all users</p>
          </div>
          <button
            onClick={() => { fetchAttempts(pagination.page); fetchStats(); }}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          {(['overview', 'attempts', 'suspicious'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gold-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-black-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading && attempts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black-900 border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Attempts (7d)</p>
                        <p className="text-3xl font-bold text-white mt-1">{totalAttempts}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <TrendingUp className="text-blue-400" size={24} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-black-900 border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Successful Logins</p>
                        <p className="text-3xl font-bold text-green-400 mt-1">{stats.bySuccess.success}</p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <CheckCircle className="text-green-400" size={24} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black-900 border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Failed Attempts</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">{stats.bySuccess.failed}</p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <XCircle className="text-red-400" size={24} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black-900 border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Failure Rate</p>
                        <p className="text-3xl font-bold text-orange-400 mt-1">{failureRate}%</p>
                      </div>
                      <div className="p-3 bg-orange-500/20 rounded-lg">
                        <AlertTriangle className="text-orange-400" size={24} />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Daily Activity Chart (Simple Bar) */}
                <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily Activity (Last 7 Days)</h3>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {stats.dailyActivity.map((day, idx) => {
                      const maxVal = Math.max(...stats.dailyActivity.map(d => d.success + d.failed), 1);
                      const total = day.success + day.failed;
                      const height = (total / maxVal) * 100;
                      const successHeight = total > 0 ? (day.success / total) * height : 0;
                      const failedHeight = height - successHeight;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center" style={{ height: '120px' }}>
                            <div className="flex-1 w-full flex flex-col justify-end">
                              <div 
                                className="w-full bg-red-500/60 rounded-t"
                                style={{ height: `${failedHeight}%` }}
                                title={`Failed: ${day.failed}`}
                              />
                              <div 
                                className="w-full bg-green-500/60"
                                style={{ height: `${successHeight}%` }}
                                title={`Success: ${day.success}`}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <p className="text-xs text-gray-400">{total}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500/60 rounded" />
                      <span className="text-sm text-gray-400">Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500/60 rounded" />
                      <span className="text-sm text-gray-400">Failed</span>
                    </div>
                  </div>
                </div>

                {/* Failure Reasons Breakdown */}
                {Object.keys(stats.byFailureReason).length > 0 && (
                  <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Failure Reasons</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.byFailureReason).map(([reason, count]) => {
                        const percentage = stats.bySuccess.failed > 0 ? (count / stats.bySuccess.failed * 100) : 0;
                        return (
                          <div key={reason} className="flex items-center gap-4">
                            <div className="w-32 text-sm text-gray-400">{getFailureReasonLabel(reason)}</div>
                            <div className="flex-1 h-4 bg-black-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getFailureReasonColor(reason).replace('text-', 'bg-').replace('/20', '/60')}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-white font-medium">{count}</span>
                              <span className="text-gray-500 text-sm ml-1">({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attempts Tab */}
            {activeTab === 'attempts' && (
              <div className="space-y-4">
                {/* Filters */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by email or IP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <select
                    value={successFilter}
                    onChange={(e) => { setSuccessFilter(e.target.value); }}
                    className="px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">All Results</option>
                    <option value="1">Success Only</option>
                    <option value="0">Failed Only</option>
                  </select>
                  <select
                    value={failureReasonFilter}
                    onChange={(e) => { setFailureReasonFilter(e.target.value); }}
                    className="px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">All Reasons</option>
                    <option value="invalid_email">Invalid Email</option>
                    <option value="invalid_password">Wrong Password</option>
                    <option value="account_suspended">Suspended</option>
                    <option value="account_inactive">Inactive</option>
                  </select>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gold-500 text-black font-medium rounded-lg hover:bg-gold-600 transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/* Attempts Table */}
                <div className="bg-black-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">IP Address</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {attempts.map((attempt) => (
                          <tr key={attempt.id} className="hover:bg-black-800/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={14} />
                                <span className="text-sm">{formatDate(attempt.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-500" />
                                <span className="text-white">{attempt.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {attempt.user_id ? (
                                <div>
                                  <p className="text-white">{attempt.first_name} {attempt.last_name}</p>
                                  <p className="text-xs text-gray-500">{attempt.role}</p>
                                </div>
                              ) : (
                                <span className="text-gray-500">Unknown User</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {attempt.success ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                  <CheckCircle size={12} />
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                  <XCircle size={12} />
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {attempt.failure_reason ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFailureReasonColor(attempt.failure_reason)}`}>
                                  {getFailureReasonLabel(attempt.failure_reason)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Globe size={14} />
                                <span className="text-sm font-mono">{attempt.ip_address || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {parseUserAgent(attempt.user_agent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {attempts.length === 0 && (
                    <div className="text-center py-10">
                      <Shield className="mx-auto text-gray-500 mb-3" size={40} />
                      <p className="text-gray-400">No login attempts found</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-gray-400 text-sm">
                      Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-gray-400 px-3">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suspicious Tab */}
            {activeTab === 'suspicious' && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suspicious IPs */}
                <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="text-red-400" size={20} />
                    Suspicious IP Addresses
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">IPs with 3+ failed attempts in the last 7 days</p>
                  
                  {stats.suspiciousIPs.length > 0 ? (
                    <div className="space-y-3">
                      {stats.suspiciousIPs.map((ip, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-black-800 rounded-lg border border-red-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                              <AlertTriangle className="text-red-400" size={18} />
                            </div>
                            <div>
                              <p className="text-white font-mono">{ip.ip_address}</p>
                              <p className="text-xs text-gray-500">Last attempt: {formatDate(ip.last_attempt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-bold">{ip.attempt_count}</p>
                            <p className="text-xs text-gray-500">attempts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                      <p className="text-gray-400">No suspicious IPs detected</p>
                    </div>
                  )}
                </div>

                {/* Suspicious Emails */}
                <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="text-orange-400" size={20} />
                    Targeted Accounts
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Emails with 3+ failed login attempts</p>
                  
                  {stats.suspiciousEmails.length > 0 ? (
                    <div className="space-y-3">
                      {stats.suspiciousEmails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-black-800 rounded-lg border border-orange-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                              <Ban className="text-orange-400" size={18} />
                            </div>
                            <div>
                              <p className="text-white">{email.email}</p>
                              <p className="text-xs text-gray-500">Last attempt: {formatDate(email.last_attempt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">{email.attempt_count}</p>
                            <p className="text-xs text-gray-500">attempts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                      <p className="text-gray-400">No targeted accounts detected</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
