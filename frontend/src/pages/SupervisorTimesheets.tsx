import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronDown,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
  FileCheck,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import { ojtTimesheetService, Timesheet } from '../services/ojtService';
import OvertimeApproval from '../components/OvertimeApproval';
import LatePermissionApproval from '../components/LatePermissionApproval';
import AttendanceLocationMap, { AttendanceLocationData } from '../components/AttendanceLocationMap';
import { API_BASE_URL, apiFetch } from '../services/api';

const SupervisorTimesheets = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState<AttendanceLocationData | null>(null);

  // Fetch attendance location for a specific date
  const fetchAttendanceLocation = async (traineeId: number, date: string, traineeName: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/date?trainee_id=${traineeId}&date=${date}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedLocationData({
          date: data.data.date,
          time_in: data.data.time_in,
          time_out: data.data.time_out,
          latitude_in: data.data.latitude_in,
          longitude_in: data.data.longitude_in,
          location_in: data.data.location_in,
          latitude_out: data.data.latitude_out,
          longitude_out: data.data.longitude_out,
          location_out: data.data.location_out,
          trainee_name: traineeName
        });
        setShowLocationMap(true);
      }
    } catch (err) {
      console.error('Error fetching attendance location:', err);
    }
  };

  const fetchTimesheets = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ojtTimesheetService.getTimesheets({ supervisor_id: user.id });
      setTimesheets(data);
    } catch (err: any) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to load data. Please try again.');
      setTimesheets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const handleApprove = async (timesheet: Timesheet) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      await ojtTimesheetService.approveTimesheet(timesheet.id, user.id);
      await fetchTimesheets();
      setShowDetailModal(false);
    } catch (err: any) {
      console.error('Error approving timesheet:', err);
      alert('Failed to approve timesheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !selectedTimesheet || !rejectReason) return;
    
    setIsSubmitting(true);
    
    try {
      await ojtTimesheetService.rejectTimesheet(selectedTimesheet.id, user.id, rejectReason);
      await fetchTimesheets();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
    } catch (err: any) {
      console.error('Error rejecting timesheet:', err);
      alert('Failed to reject timesheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Filter timesheets
  const filteredTimesheets = timesheets.filter(ts => {
    const matchesSearch = ts.trainee_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || ts.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: timesheets.length,
    pending: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    rejected: timesheets.filter(t => t.status === 'rejected').length
  };

  return (
    <SupervisorLayout title="Timesheet Approvals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30">
                <Clock className="text-gold-400" size={24} />
              </div>
              Timesheet Approvals
            </h1>
            <p className="text-gray-400 mt-1">Review and approve trainee timesheets</p>
          </div>
          <button
            onClick={fetchTimesheets}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-xl text-gray-300 hover:text-gold-400 hover:border-gold-500/50 transition-all"
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 rounded-xl p-4">
            <p className="text-sm text-gold-400/80">Total</p>
            <p className="text-3xl font-bold text-gold-400 mt-1">{stats.total}</p>
          </div>
          <div className={`bg-black-900 border rounded-xl p-4 ${stats.pending > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-500/20'}`}>
            <p className="text-sm text-amber-400">Pending</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-black-900 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-sm text-emerald-400">Approved</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-black-900 border border-red-500/30 rounded-xl p-4">
            <p className="text-sm text-red-400">Rejected</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* Overtime Approval Section */}
        <OvertimeApproval supervisorId={Number(user?.id || 0)} />

        {/* Late Clock-in Permission Requests */}
        <LatePermissionApproval supervisorId={Number(user?.id || 0)} />

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by trainee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors min-w-[160px]"
              >
                <option value="">All Status</option>
                <option value="submitted">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Timesheets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading timesheets...</p>
            </div>
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gold-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No timesheets found</h3>
            <p className="text-gray-400 text-sm">
              {searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : 'No timesheets have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTimesheets.map((timesheet, index) => (
              <motion.div
                key={timesheet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-black-900 border rounded-xl p-4 transition-all hover:shadow-lg ${
                  timesheet.status === 'submitted'
                    ? 'border-amber-500/40 hover:border-amber-500/60'
                    : 'border-gold-500/20 hover:border-gold-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold text-sm">
                        {timesheet.trainee_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{timesheet.trainee_name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getStatusColor(timesheet.status)}`}>
                          {getStatusLabel(timesheet.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {formatDate(timesheet.week_start)} - {formatDate(timesheet.week_end)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {timesheet.total_hours} hours
                        </span>
                      </div>
                      {timesheet.submitted_at && timesheet.status === 'submitted' && (
                        <p className="text-xs text-amber-400/80 mt-1.5">
                          Submitted {formatTimeAgo(timesheet.submitted_at)}
                        </p>
                      )}
                      {timesheet.rejection_reason && (
                        <p className="text-xs text-red-400 mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          Reason: {timesheet.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedTimesheet(timesheet);
                        setShowDetailModal(true);
                      }}
                      className="p-2.5 text-gray-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {timesheet.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleApprove(timesheet)}
                          disabled={isSubmitting}
                          className="p-2.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setShowRejectModal(true);
                          }}
                          className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedTimesheet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-black-900 border border-gold-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gold-500/20 sticky top-0 bg-black-900 z-10">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileCheck className="text-gold-400" size={20} />
                      Timesheet Details
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatDate(selectedTimesheet.week_start)} - {formatDate(selectedTimesheet.week_end)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Trainee</label>
                      <p className="text-white mt-1">{selectedTimesheet.trainee_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Total Hours</label>
                      <p className="text-gold-400 mt-1 font-semibold">{selectedTimesheet.total_hours} hours</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                      <p className="mt-1.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getStatusColor(selectedTimesheet.status)}`}>
                          {getStatusLabel(selectedTimesheet.status)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Submitted</label>
                      <p className="text-white mt-1 text-sm">{formatDateTime(selectedTimesheet.submitted_at)}</p>
                    </div>
                  </div>

                  {selectedTimesheet.notes && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Notes</label>
                      <p className="text-gray-300 mt-2 p-4 bg-black-800 rounded-xl border border-gold-500/10">{selectedTimesheet.notes}</p>
                    </div>
                  )}

                  {selectedTimesheet.rejection_reason && (
                    <div>
                      <label className="text-xs text-red-400 uppercase tracking-wider">Rejection Reason</label>
                      <p className="text-red-300 mt-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        {selectedTimesheet.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Daily Entries */}
                  {selectedTimesheet.entries && selectedTimesheet.entries.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Daily Breakdown</label>
                      <div className="overflow-x-auto rounded-xl border border-gold-500/20">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-black-800 border-b border-gold-500/20">
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">Day</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">Time In</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">Time Out</th>
                              <th className="text-center py-3 px-4 text-gray-400 font-medium">Hours</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">Tasks</th>
                              <th className="text-center py-3 px-4 text-gray-400 font-medium">Location</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gold-500/10">
                            {selectedTimesheet.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-gold-500/5 transition-colors">
                                <td className="py-3 px-4 text-white">
                                  {getDayName(entry.entry_date)} {formatDate(entry.entry_date)}
                                </td>
                                <td className="py-3 px-4 text-gray-300">{entry.time_in || '-'}</td>
                                <td className="py-3 px-4 text-gray-300">{entry.time_out || '-'}</td>
                                <td className="py-3 px-4 text-center text-gold-400 font-medium">{entry.hours_worked}</td>
                                <td className="py-3 px-4 text-gray-400 hidden sm:table-cell truncate max-w-[200px]">
                                  {entry.tasks_completed || '-'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => fetchAttendanceLocation(selectedTimesheet.trainee_id, entry.entry_date, selectedTimesheet.trainee_name)}
                                    className="p-1.5 text-gold-400 hover:bg-gold-500/20 rounded-lg transition-colors"
                                    title="View attendance location"
                                  >
                                    <MapPin size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gold-500/5 border-t border-gold-500/30">
                              <td colSpan={3} className="py-3 px-4 text-gray-400 font-medium">Total</td>
                              <td className="py-3 px-4 text-center text-gold-400 font-bold">{selectedTimesheet.total_hours}</td>
                              <td className="hidden sm:table-cell"></td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {selectedTimesheet.status === 'submitted' && (
                  <div className="p-6 border-t border-gold-500/20 flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedTimesheet)}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Approve Timesheet
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && selectedTimesheet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-black-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <XCircle className="text-red-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Reject Timesheet</h3>
                  <p className="text-gray-400 text-sm mb-5">
                    Please provide a reason for rejection. This will be visible to {selectedTimesheet.trainee_name}.
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Enter rejection reason..."
                    className="w-full px-4 py-3 bg-black-800 border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none mb-5"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason('');
                      }}
                      className="flex-1 py-3 bg-black-800 text-gray-300 rounded-xl hover:bg-black-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectReason.trim()}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        'Reject'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attendance Location Map Modal */}
        <AttendanceLocationMap
          isOpen={showLocationMap}
          onClose={() => setShowLocationMap(false)}
          data={selectedLocationData}
        />
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorTimesheets;
