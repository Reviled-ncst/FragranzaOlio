import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Users
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface AttendanceSummary {
  trainee_id: number;
  trainee_name: string;
  trainee_email: string;
  trainee_university?: string;
  supervisor_name?: string;
  week_start: string;
  week_end: string;
  days_worked: number;
  total_hours: number;
  overtime_hours: number;
  late_days: number;
}

interface AttendanceRecord {
  id: number;
  trainee_id: number;
  trainee_name: string;
  trainee_email: string;
  trainee_university?: string;
  attendance_date: string;
  time_in: string;
  time_out: string;
  total_hours: number;
  overtime_hours: number;
  is_late: boolean;
  status: string;
}

const HRTimesheets = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'recent'>('summary');
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate week dates based on offset
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (offset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
      displayStart: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      displayEnd: endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };

  const weekDates = getWeekDates(weekOffset);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch attendance summary from HR endpoint
      const params = new URLSearchParams();
      params.append('week_start', weekDates.start);
      params.append('week_end', weekDates.end);
      
      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/hr-summary?${params}`);
      const response = await res.json();
      
      console.log('HR Attendance API response:', response);
      
      if (response.success && response.data) {
        setSummaries(response.data.summaries || []);
        setRecentRecords(response.data.recent || []);
      } else {
        setSummaries([]);
        setRecentRecords([]);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data');
      setSummaries([]);
      setRecentRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [weekOffset]);

  const stats = {
    totalInterns: summaries.length,
    totalHours: summaries.reduce((sum, s) => sum + parseFloat(String(s.total_hours || 0)), 0),
    totalOvertime: summaries.reduce((sum, s) => sum + parseFloat(String(s.overtime_hours || 0)), 0),
    lateDays: summaries.reduce((sum, s) => sum + (s.late_days || 0), 0)
  };

  const filteredSummaries = summaries.filter(s => {
    const name = s.trainee_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredRecent = recentRecords.filter(r => {
    const name = r.trainee_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  return (
    <HRLayout title="Timesheets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Intern Attendance & Timesheets</h1>
            <p className="text-gray-400">View OJT intern attendance records and hours</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-black-800 border border-pink-500/20 rounded-lg p-1">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-2 hover:bg-pink-500/20 rounded transition-all"
              >
                <ChevronLeft size={18} className="text-gray-400" />
              </button>
              <span className="px-3 text-white text-sm">{weekDates.displayStart} - {weekDates.displayEnd}</span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                disabled={weekOffset >= 0}
                className="p-2 hover:bg-pink-500/20 rounded transition-all disabled:opacity-50"
              >
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
            <button 
              onClick={fetchAttendanceData}
              className="p-2 bg-black-800 border border-pink-500/20 rounded-lg hover:bg-pink-500/20 transition-all"
            >
              <RefreshCw size={18} className="text-gray-400" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-all">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Interns</p>
                <p className="text-2xl font-bold text-white">{stats.totalInterns}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-pink-400" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-pink-400">{stats.totalHours.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-pink-400" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overtime Hours</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalOvertime.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-400" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Late Days</p>
                <p className="text-2xl font-bold text-red-400">{stats.lateDays}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-400" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search interns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  viewMode === 'summary'
                    ? 'bg-pink-500 text-white'
                    : 'bg-black-800 border border-pink-500/20 text-gray-400 hover:text-white'
                }`}
              >
                <Users size={18} className="inline mr-2" />
                Summary
              </button>
              <button
                onClick={() => setViewMode('recent')}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  viewMode === 'recent'
                    ? 'bg-pink-500 text-white'
                    : 'bg-black-800 border border-pink-500/20 text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={18} className="inline mr-2" />
                Recent
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-pink-400" size={32} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Summary View */}
        {!loading && !error && viewMode === 'summary' && (
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Intern</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">University</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Overtime</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No attendance records found for this week
                    </td>
                  </tr>
                ) : (
                filteredSummaries.map((entry) => (
                  <tr key={entry.trainee_id} className="hover:bg-black-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-medium">
                          {(entry.trainee_name || 'N/A').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <span className="text-white font-medium block">{entry.trainee_name || 'Unknown'}</span>
                          <span className="text-gray-500 text-xs">{entry.trainee_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">{entry.trainee_university || '-'}</td>
                    <td className="px-4 py-4 text-gray-400">{formatDate(entry.week_start)} - {formatDate(entry.week_end)}</td>
                    <td className="px-4 py-4 text-white">{entry.days_worked}</td>
                    <td className="px-4 py-4 text-pink-400 font-medium">{parseFloat(String(entry.total_hours || 0)).toFixed(1)}h</td>
                    <td className="px-4 py-4 text-yellow-400">{parseFloat(String(entry.overtime_hours || 0)).toFixed(1)}h</td>
                    <td className="px-4 py-4 text-gray-400 text-sm">{entry.supervisor_name || '-'}</td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Recent Records View */}
        {!loading && !error && viewMode === 'recent' && (
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Intern</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {filteredRecent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No recent attendance records
                    </td>
                  </tr>
                ) : (
                filteredRecent.map((record) => (
                  <tr key={record.id} className="hover:bg-black-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-medium">
                          {(record.trainee_name || 'N/A').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-white font-medium">{record.trainee_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400">{formatDate(record.attendance_date)}</td>
                    <td className="px-4 py-4 text-green-400">{formatTime(record.time_in)}</td>
                    <td className="px-4 py-4 text-red-400">{formatTime(record.time_out)}</td>
                    <td className="px-4 py-4 text-pink-400 font-medium">{parseFloat(String(record.total_hours || 0)).toFixed(1)}h</td>
                    <td className="px-4 py-4">
                      {record.is_late ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">Late</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">On Time</span>
                      )}
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </HRLayout>
  );
};

export default HRTimesheets;
