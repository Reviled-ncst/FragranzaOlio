import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  FileText,
  Award,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import { supervisorService, TraineeOverview } from '../services/supervisorService';

interface TraineeReport {
  id: number;
  name: string;
  email: string;
  hoursCompleted: number;
  requiredHours: number;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  avgWeeklyHours: number;
  daysAbsent: number;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
}

interface WeeklyData {
  week: string;
  hours: number;
  tasks: number;
}

const SupervisorReports = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<TraineeReport[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dateRange, setDateRange] = useState('month');
  const [selectedTrainee, setSelectedTrainee] = useState<string>('all');

  const fetchReports = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await supervisorService.getPerformance(user.id, dateRange);
      
      if (data.trainees) {
        const transformedReports: TraineeReport[] = data.trainees.map((t: TraineeOverview) => {
          const hoursCompleted = t.completed_hours || 0;
          const requiredHours = t.total_required_hours || 500;
          return {
            id: t.id,
            name: t.name,
            email: t.email,
            hoursCompleted,
            requiredHours,
            progress: Math.round((hoursCompleted / requiredHours) * 100),
            tasksCompleted: t.tasks_completed || 0,
            totalTasks: t.total_tasks || 0,
            avgWeeklyHours: 0, // Not available in TraineeOverview
            daysAbsent: 0, // Not available in TraineeOverview
            status: hoursCompleted >= requiredHours ? 'completed' as const : 
                    hoursCompleted > (requiredHours * 0.7) ? 'ahead' as const :
                    hoursCompleted >= (requiredHours * 0.4) ? 'on-track' as const : 'behind' as const
          };
        });
        setReports(transformedReports);
      }
      
      if (data.weekly_data) {
        // Transform WeeklyHoursData to WeeklyData
        const transformedWeekly: WeeklyData[] = data.weekly_data.map(w => ({
          week: w.week_start,
          hours: w.total_hours,
          tasks: 0 // Not available in WeeklyHoursData
        }));
        setWeeklyData(transformedWeekly);
      }
    } catch (err: unknown) {
      console.error('Error fetching reports:', err);
      setError('Failed to load data. Please try again.');
      setReports([]);
      setWeeklyData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Hours Completed', 'Required Hours', 'Progress %', 'Tasks Completed', 'Total Tasks', 'Avg Weekly Hours', 'Days Absent', 'Status'];
    const csvData = reports.map(r => [
      r.name, r.email, r.hoursCompleted, r.requiredHours, r.progress, r.tasksCompleted, r.totalTasks, r.avgWeeklyHours, r.daysAbsent, r.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainee-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  if (user.role !== 'ojt_supervisor' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-emerald-400';
      case 'behind': return 'text-red-400';
      case 'ahead': return 'text-blue-400';
      case 'completed': return 'text-gold-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'behind': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ahead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'behind': return <TrendingDown size={14} className="text-red-400" />;
      case 'ahead': return <TrendingUp size={14} className="text-blue-400" />;
      case 'completed': return <Award size={14} className="text-gold-400" />;
      default: return <CheckCircle size={14} className="text-emerald-400" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'behind': return 'bg-gradient-to-r from-red-500 to-red-400';
      case 'ahead': return 'bg-gradient-to-r from-blue-500 to-blue-400';
      case 'completed': return 'bg-gradient-to-r from-gold-500 to-gold-400';
      default: return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    }
  };

  const totalHours = reports.reduce((sum, r) => sum + r.hoursCompleted, 0);
  const totalTasks = reports.reduce((sum, r) => sum + r.tasksCompleted, 0);
  const avgProgress = reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.progress, 0) / reports.length) : 0;
  const maxWeeklyHours = Math.max(...weeklyData.map(w => w.hours), 1);

  return (
    <SupervisorLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30">
                <BarChart3 className="text-gold-400" size={24} />
              </div>
              Reports & Analytics
            </h1>
            <p className="text-gray-400 mt-1">View performance reports and analytics for your trainees</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-xl text-gray-300 hover:text-gold-400 hover:border-gold-500/50 transition-all"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg shadow-gold-500/20"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 appearance-none transition-colors"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="all">All Time</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            
            <div className="relative flex-1">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <select
                value={selectedTrainee}
                onChange={(e) => setSelectedTrainee(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 appearance-none transition-colors"
              >
                <option value="all">All Trainees</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading reports...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <Users className="text-gold-400" size={22} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gold-400 mb-1">{reports.length}</p>
                <p className="text-sm text-gray-400">Total Trainees</p>
              </div>

              <div className="bg-black-900 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="text-blue-400" size={22} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-400 mb-1">{totalHours}</p>
                <p className="text-sm text-gray-400">Total Hours</p>
              </div>

              <div className="bg-black-900 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-emerald-400" size={22} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-emerald-400 mb-1">{totalTasks}</p>
                <p className="text-sm text-gray-400">Tasks Done</p>
              </div>

              <div className="bg-black-900 border border-amber-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-amber-400" size={22} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-400 mb-1">{avgProgress}%</p>
                <p className="text-sm text-gray-400">Avg Progress</p>
              </div>
            </div>

            {/* Weekly Hours Chart */}
            {weeklyData.length > 0 && (
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-gold-400" />
                    Weekly Hours Overview
                  </h2>
                </div>
                <div className="flex items-end justify-between gap-4 h-48">
                  {weeklyData.map((week, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex flex-col items-center">
                        <span className="text-sm text-gold-400 font-medium mb-1">{week.hours}h</span>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(week.hours / maxWeeklyHours) * 150}px` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-lg hover:from-gold-500 hover:to-gold-300 transition-colors cursor-pointer"
                          style={{ minHeight: '20px' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{week.week}</span>
                      <span className="text-xs text-gray-500">{week.tasks} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Reports */}
            <div className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gold-500/20">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText size={18} className="text-gold-400" />
                  Individual Performance
                </h2>
              </div>
              
              {/* Mobile Card View */}
              <div className="block lg:hidden divide-y divide-gold-500/10">
                {reports.map((report) => (
                  <div key={report.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold text-sm">
                          {report.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{report.name}</p>
                        <p className="text-xs text-gray-500 truncate">{report.email}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium flex-shrink-0 ${getStatusBadgeColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status.replace('-', ' ')}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black-800 rounded-xl p-3 border border-gold-500/10">
                        <p className="text-gold-400 font-semibold">{report.hoursCompleted}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Hours</p>
                      </div>
                      <div className="bg-black-800 rounded-xl p-3 border border-gold-500/10">
                        <p className="text-white font-semibold">{report.progress}%</p>
                        <p className="text-gray-500 text-xs mt-0.5">Progress</p>
                      </div>
                      <div className="bg-black-800 rounded-xl p-3 border border-gold-500/10">
                        <p className="text-white font-semibold">{report.tasksCompleted}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Tasks</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black-800 border-b border-gold-500/20">
                      <th className="text-left px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Trainee</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Tasks</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Avg/Week</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Absences</th>
                      <th className="text-center px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-500/10">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gold-500/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                              <span className="text-black font-bold text-sm">
                                {report.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{report.name}</p>
                              <p className="text-xs text-gray-500">{report.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-gold-400 font-semibold">{report.hoursCompleted}</span>
                          <span className="text-gray-500 text-sm">/{report.requiredHours}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-white font-semibold">{report.progress}%</span>
                            <div className="w-20 bg-black-700 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(report.progress, 100)}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-2 rounded-full ${getProgressBarColor(report.status)}`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-white font-semibold">{report.tasksCompleted}</span>
                          <span className="text-gray-500 text-sm">/{report.totalTasks}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`font-semibold ${report.avgWeeklyHours >= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {report.avgWeeklyHours}h
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`font-semibold ${report.daysAbsent === 0 ? 'text-emerald-400' : report.daysAbsent > 3 ? 'text-red-400' : 'text-amber-400'}`}>
                            {report.daysAbsent}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {getStatusIcon(report.status)}
                            <span className={`text-sm font-medium capitalize ${getStatusColor(report.status)}`}>
                              {report.status.replace('-', ' ')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award size={18} className="text-gold-400" />
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {reports
                    .sort((a, b) => b.progress - a.progress)
                    .slice(0, 3)
                    .map((report, index) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-black-800 rounded-xl border border-gold-500/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            index === 0 ? 'bg-gold-500/30 text-gold-400 ring-2 ring-gold-500/50' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{report.name}</p>
                            <p className="text-xs text-gray-500">{report.tasksCompleted} tasks</p>
                          </div>
                        </div>
                        <span className="text-gold-400 font-bold flex-shrink-0">{report.progress}%</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Need Attention */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  Need Attention
                </h3>
                {reports.filter(r => r.status === 'behind').length > 0 ? (
                  <div className="space-y-3">
                    {reports
                      .filter(r => r.status === 'behind')
                      .map((report) => (
                        <div key={report.id} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{report.name}</p>
                              <p className="text-xs text-red-400 mt-0.5">
                                Behind schedule • {report.daysAbsent} absences
                              </p>
                            </div>
                            <span className="text-red-400 font-bold flex-shrink-0">{report.progress}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Avg {report.avgWeeklyHours}h/week
                          </p>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-emerald-500/50" />
                    </div>
                    <p className="text-gray-400">All trainees are on track!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorReports;
