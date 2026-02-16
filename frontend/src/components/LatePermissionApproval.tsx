import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  X,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../services/api';

interface LatePermissionRecord {
  id: number;
  trainee_id: number;
  granted_by: number;
  permission_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  approved_at: string | null;
  denied_reason: string | null;
  used_at: string | null;
  created_at: string;
  trainee_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface LatePermissionApprovalProps {
  supervisorId: number;
  onApproval?: () => void;
}

const LatePermissionApproval = ({ supervisorId, onApproval }: LatePermissionApprovalProps) => {
  const [records, setRecords] = useState<LatePermissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LatePermissionRecord | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiFetch(
        `${API_BASE_URL}/ojt_attendance.php/pending-late-requests?supervisor_id=${supervisorId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.data || []);
      } else {
        setError(data.error || 'Could not load late permission requests');
      }
    } catch (err: any) {
      console.error('Error fetching late permissions:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleApprove = async (record: LatePermissionRecord) => {
    setProcessingId(record.id);
    setError(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/grant-late-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: record.trainee_id,
          granted_by: supervisorId,
          date: record.permission_date,
          approved: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Late clock-in approved');
        fetchPermissions();
        onApproval?.();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to approve');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async () => {
    if (!selectedRecord) return;
    
    setProcessingId(selectedRecord.id);
    setError(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/grant-late-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: selectedRecord.trainee_id,
          granted_by: supervisorId,
          date: selectedRecord.permission_date,
          approved: false,
          denied_reason: denyReason || 'Request denied'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Late clock-in denied');
        fetchPermissions();
        onApproval?.();
        setShowDenyModal(false);
        setSelectedRecord(null);
        setDenyReason('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to deny');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</span>;
      case 'denied':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Denied</span>;
      default:
        return null;
    }
  };

  const pendingRecords = records.filter(r => r.status === 'pending');
  const displayRecords = showAll ? records : pendingRecords;

  return (
    <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="text-gold-400" size={20} />
            Late Clock-in Requests
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {pendingRecords.length} pending request{pendingRecords.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown size={16} className={showAll ? 'rotate-180' : ''} />
            {showAll ? 'Show Pending Only' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400"
          >
            <Check size={18} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gold-400" size={24} />
        </div>
      ) : displayRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock size={40} className="mx-auto mb-2 opacity-50" />
          <p>No {showAll ? '' : 'pending '}late clock-in requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black-800 border border-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                      <User size={20} className="text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {record.trainee_name || `${record.first_name} ${record.last_name}`}
                      </p>
                      <p className="text-sm text-gray-400">{record.email}</p>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                  
                  <div className="ml-13 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={14} />
                      <span>Requesting for: <span className="text-white">{formatDate(record.permission_date)}</span></span>
                    </div>
                    {record.reason && (
                      <div className="flex items-start gap-2 text-sm text-gray-400">
                        <MessageSquare size={14} className="mt-0.5" />
                        <span>Reason: <span className="text-gray-300">{record.reason}</span></span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Requested: {formatDateTime(record.created_at)}
                    </p>
                    {record.status === 'approved' && record.used_at && (
                      <p className="text-xs text-emerald-400">
                        Used for clock-in at {formatDateTime(record.used_at)}
                      </p>
                    )}
                    {record.status === 'denied' && record.denied_reason && (
                      <p className="text-xs text-red-400">
                        Denied: {record.denied_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {record.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(record)}
                      disabled={processingId === record.id}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {processingId === record.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDenyModal(true);
                      }}
                      disabled={processingId === record.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Deny"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Deny Modal */}
      <AnimatePresence>
        {showDenyModal && selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDenyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Deny Late Clock-in Request</h3>
              <p className="text-gray-400 text-sm mb-4">
                Denying request from <span className="text-white">{selectedRecord.trainee_name || `${selectedRecord.first_name} ${selectedRecord.last_name}`}</span> for {formatDate(selectedRecord.permission_date)}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Reason for denial (optional)</label>
                <textarea
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  className="w-full bg-black-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                  rows={3}
                  placeholder="Enter reason..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDenyModal(false);
                    setSelectedRecord(null);
                    setDenyReason('');
                  }}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeny}
                  disabled={processingId === selectedRecord.id}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === selectedRecord.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <X size={18} />
                      Deny Request
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LatePermissionApproval;
