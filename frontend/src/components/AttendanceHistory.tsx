import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { getErrorMessage } from '../types/api';

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  work_hours: number | null;
  break_hours: number | null;
  overtime_hours: number | null;
  overtime_approved: boolean;
  location_in: string | null;
  location_out: string | null;
  photo_in: string | null;
  photo_out: string | null;
  face_verified: boolean;
  face_verified_out: boolean;
}

interface AttendanceHistoryProps {
  userId: number;
}

const AttendanceHistory = ({ userId }: AttendanceHistoryProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const response = await fetch(
        `${API_BASE_URL}/ojt_attendance.php/history?trainee_id=${userId}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.data || []);
      } else {
        setRecords([]);
        setError(data.error);
      }
    } catch (err: unknown) {
      console.error('Error fetching history:', err);
      setRecords([]);
      setError('Could not load attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentMonth]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
      day: 'numeric'
    });
  };

  const getMonthLabel = () => {
    return currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  // Calculate summary stats
  const safeRecords = records || [];
  const totalDays = safeRecords.length;
  const totalHours = safeRecords.reduce((sum, r) => sum + (Number(r.work_hours) || 0), 0);
  const totalOvertime = safeRecords.reduce((sum, r) => sum + (Number(r.overtime_hours) || 0), 0);
  const approvedOvertime = safeRecords
    .filter(r => r.overtime_approved)
    .reduce((sum, r) => sum + (Number(r.overtime_hours) || 0), 0);

  return (
    <div className="bg-black-900 border border-blue-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="text-blue-400" size={20} />
          Attendance History
        </h2>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-black-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="text-gray-400" size={18} />
          </button>
          <span className="text-white font-medium min-w-[140px] text-center">
            {getMonthLabel()}
          </span>
          <button
            onClick={() => changeMonth(1)}
            disabled={currentMonth.getMonth() >= new Date().getMonth() && 
                     currentMonth.getFullYear() >= new Date().getFullYear()}
            className="p-2 hover:bg-black-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="text-gray-400" size={18} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-black-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Days Present</p>
          <p className="text-xl font-bold text-blue-400">{totalDays}</p>
        </div>
        <div className="bg-black-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Hours</p>
          <p className="text-xl font-bold text-green-400">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-black-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Overtime</p>
          <p className="text-xl font-bold text-yellow-400">{totalOvertime.toFixed(1)}h</p>
        </div>
        <div className="bg-black-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Approved OT</p>
          <p className="text-xl font-bold text-purple-400">{approvedOvertime.toFixed(1)}h</p>
        </div>
      </div>

      {/* Records Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-red-400">{error}</p>
        </div>
      ) : safeRecords.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-gray-400">No attendance records for this month</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black-800">
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Time In</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Break</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Time Out</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Hours</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">OT</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10">
              {safeRecords.map((record) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-black-800/50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white text-sm">{formatDate(record.attendance_date)}</p>
                      {record.location_in && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate max-w-[200px]">
                          <MapPin size={10} />
                          {record.location_in}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-green-400 font-medium">{formatTime(record.time_in)}</span>
                    {record.face_verified && (
                      <CheckCircle size={12} className="inline ml-1 text-green-500" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-400">
                    {record.break_start ? (
                      <>
                        {formatTime(record.break_start)}
                        <br />
                        {formatTime(record.break_end)}
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-red-400 font-medium">{formatTime(record.time_out)}</span>
                    {record.face_verified_out && (
                      <CheckCircle size={12} className="inline ml-1 text-green-500" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-blue-400 font-medium">
                      {record.work_hours ? `${record.work_hours}h` : '--'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.overtime_hours && record.overtime_hours > 0 ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        record.overtime_approved
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {record.overtime_hours}h
                        {record.overtime_approved ? (
                          <CheckCircle size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                      </span>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1">
                      {record.photo_in && (
                        <button
                          onClick={() => setSelectedPhoto(`${API_BASE_URL}/${record.photo_in}`)}
                          className="p-1 hover:bg-black-700 rounded transition-colors"
                          title="View check-in photo"
                        >
                          <Image size={16} className="text-green-400" />
                        </button>
                      )}
                      {record.photo_out && (
                        <button
                          onClick={() => setSelectedPhoto(`${API_BASE_URL}/${record.photo_out}`)}
                          className="p-1 hover:bg-black-700 rounded transition-colors"
                          title="View check-out photo"
                        >
                          <Image size={16} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AttendanceHistory;
