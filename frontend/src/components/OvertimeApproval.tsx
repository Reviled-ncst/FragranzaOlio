import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  X,
  User,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  ChevronDown
} from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../services/api';

interface OvertimeRecord {
  id: number;
  trainee_id: number;
  attendance_date: string;
  time_in: string;
  time_out: string;
  work_hours: number;
  overtime_hours: number;
  overtime_approved: boolean;
  trainee_name?: string;
  trainee_email?: string;
  location_in?: string;
  photo_in?: string;
  photo_out?: string;
}

interface OvertimeApprovalProps {
  supervisorId: number;
  onApproval?: () => void;
}

const OvertimeApproval = ({ supervisorId, onApproval }: OvertimeApprovalProps) => {
  const [pendingRecords, setPendingRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const [allRecords, setAllRecords] = useState<OvertimeRecord[]>([]);

  const fetchPendingOvertime = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get attendance records with pending overtime for trainees assigned to this supervisor
      const response = await apiFetch(
        `${API_BASE_URL}/ojt_attendance.php/pending-overtime?supervisor_id=${supervisorId}`
      );
      const data = await response.json();
      
      if (data.success) {
        // Filter records based on show approved toggle
        setAllRecords(data.data || []);
        if (showApproved) {
          setPendingRecords(data.data || []);
        } else {
          setPendingRecords((data.data || []).filter((r: OvertimeRecord) => !r.overtime_approved));
        }
      } else {
        setError(data.error || 'Could not load overtime records');
      }
    } catch (err: any) {
      console.error('Error fetching overtime:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [supervisorId, showApproved]);

  useEffect(() => {
    fetchPendingOvertime();
  }, [fetchPendingOvertime]);

  useEffect(() => {
    if (showApproved) {
      setPendingRecords(allRecords);
    } else {
      setPendingRecords(allRecords.filter(r => !r.overtime_approved));
    }
  }, [showApproved, allRecords]);

  const handleApprove = async (recordId: number) => {
    setProcessingId(recordId);
    setError(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/approve-overtime`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_id: recordId,
          approved_by: supervisorId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Overtime approved successfully');
        fetchPendingOvertime();
        onApproval?.();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to approve overtime');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate totals
  const totalPending = pendingRecords.filter(r => !r.overtime_approved).length;
  const totalOvertimeHours = pendingRecords
    .filter(r => !r.overtime_approved)
    .reduce((sum, r) => sum + r.overtime_hours, 0);

  return (
    <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="text-gold-400" size={20} />
            Overtime Approval
          </h2>
          {totalPending > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {totalPending} pending · {totalOvertimeHours.toFixed(1)} total hours
            </p>
          )}
        </div>
        
        {/* Toggle */}
        <button
          onClick={() => setShowApproved(!showApproved)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showApproved 
              ? 'bg-gold-600/20 text-gold-400' 
              : 'bg-black-800 text-gray-400 hover:bg-black-700'
          }`}
        >
          <ChevronDown size={14} />
          {showApproved ? 'All Records' : 'Pending Only'}
        </button>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"
          >
            <Check size={16} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gold-500" size={32} />
        </div>
      ) : pendingRecords.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-gray-400">
            {showApproved ? 'No overtime records found' : 'No pending overtime approvals'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-black-800 rounded-lg p-4 border ${
                record.overtime_approved 
                  ? 'border-green-500/20' 
                  : 'border-gold-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Trainee Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gold-600/20 flex items-center justify-center">
                      <User size={14} className="text-gold-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {record.trainee_name || `Trainee #${record.trainee_id}`}
                      </p>
                      {record.trainee_email && (
                        <p className="text-xs text-gray-500">{record.trainee_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Date</p>
                      <p className="text-gray-300">{formatDate(record.attendance_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Time In</p>
                      <p className="text-green-400">{formatTime(record.time_in)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Time Out</p>
                      <p className="text-red-400">{formatTime(record.time_out)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Work</p>
                      <p className="text-blue-400">{record.work_hours}h</p>
                    </div>
                  </div>

                  {/* Location */}
                  {record.location_in && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span className="truncate">{record.location_in}</span>
                    </div>
                  )}
                </div>

                {/* Overtime & Actions */}
                <div className="text-right flex flex-col items-end gap-2">
                  <div className={`px-3 py-1.5 rounded-lg ${
                    record.overtime_approved
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    <span className="text-xs">Overtime</span>
                    <p className="text-lg font-bold">{record.overtime_hours}h</p>
                  </div>

                  {!record.overtime_approved && (
                    <button
                      onClick={() => handleApprove(record.id)}
                      disabled={processingId === record.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {processingId === record.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Approve
                    </button>
                  )}

                  {record.overtime_approved && (
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                      <Check size={12} />
                      Approved
                    </span>
                  )}

                  {/* View Photos */}
                  {(record.photo_in || record.photo_out) && (
                    <button
                      onClick={() => setSelectedPhoto(`${API_BASE_URL}/${record.photo_in || record.photo_out}`)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      <Eye size={12} />
                      View Photo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedPhoto}
              alt="Attendance photo"
              className="w-full rounded-xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="mt-4 w-full py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default OvertimeApproval;



