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
  RefreshCw
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface TimesheetEntry {
  id: number;
  trainee_id: number;
  trainee_name: string;
  trainee_email: string;
  trainee_university?: string;
  supervisor_name?: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_name?: string;
  notes?: string;
}

const HRTimesheets = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const fetchTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('week_start', weekDates.start);
      
      const res = await apiFetch(`${API_BASE_URL}/ojt_timesheets.php?${params}`);
      const response = await res.json();
      
      if (response.success && response.data) {
        setTimesheets(response.data);
      } else if (Array.isArray(response)) {
        setTimesheets(response);
      } else {
        setTimesheets([]);
      }
    } catch (err) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [weekOffset]);

  const handleApprove = async (timesheetId: number) => {
    setActionLoading(timesheetId);
    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_timesheets.php/${timesheetId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_notes: 'Approved by HR' })
      });
      const response = await res.json();
      
      if (response.success || response.message) {
        await fetchTimesheets();
      } else {
        alert(response.error || 'Failed to approve timesheet');
      }
    } catch (err) {
      console.error('Error approving timesheet:', err);
      alert('Failed to approve timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (timesheetId: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    setActionLoading(timesheetId);
    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_timesheets.php/${timesheetId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_notes: reason })
      });
      const response = await res.json();
      
      if (response.success || response.message) {
        await fetchTimesheets();
      } else {
        alert(response.error || 'Failed to reject timesheet');
      }
    } catch (err) {
      console.error('Error rejecting timesheet:', err);
      alert('Failed to reject timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    totalSubmitted: timesheets.filter(t => t.status !== 'draft').length,
    pending: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    totalHours: timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full flex items-center gap-1"><Clock size={12} /> Draft</span>;
      default:
        return null;
    }
  };

  const filteredTimesheets = timesheets
    .filter(t => {
      const name = t.trainee_name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter(t => {
      if (!statusFilter) return true;
      if (statusFilter === 'pending') return t.status === 'submitted';
      return t.status === statusFilter;
    });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <HRLayout title="Timesheets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Intern Timesheet Management</h1>
            <p className="text-gray-400">Review and approve OJT intern timesheets</p>
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
              onClick={fetchTimesheets}
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
                <p className="text-gray-400 text-sm">Total Submitted</p>
                <p className="text-2xl font-bold text-white">{stats.totalSubmitted}</p>
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
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-400" size={24} />
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
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={24} />
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
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-pink-400">{stats.totalHours.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-pink-400" size={24} />
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
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

        {/* Timesheets Table */}
        {!loading && !error && (
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Intern</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">University</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supervisor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {filteredTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No timesheets found for this week
                    </td>
                  </tr>
                ) : (
                filteredTimesheets.map((entry) => (
                  <tr key={entry.id} className="hover:bg-black-800/50 transition-colors">
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
                    <td className="px-4 py-4 text-pink-400 font-medium">{(entry.total_hours || 0).toFixed(1)}h</td>
                    <td className="px-4 py-4 text-gray-400 text-sm">{entry.supervisor_name || '-'}</td>
                    <td className="px-4 py-4">{getStatusBadge(entry.status)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                          <Eye size={18} />
                        </button>
                        {entry.status === 'submitted' && (
                          <>
                            <button 
                              onClick={() => handleApprove(entry.id)}
                              disabled={actionLoading === entry.id}
                              className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50"
                            >
                              {actionLoading === entry.id ? 'Loading...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleReject(entry.id)}
                              disabled={actionLoading === entry.id}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
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
