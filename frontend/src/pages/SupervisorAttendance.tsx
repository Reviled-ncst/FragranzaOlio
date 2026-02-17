import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search,
  Eye,
  Clock,
  MapPin,
  Camera,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import AttendanceLocationMap, { AttendanceLocationData } from '../components/AttendanceLocationMap';
import { apiFetch, API_BASE_URL } from '../services/api';

interface AttendanceRecord {
  id: number;
  trainee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  status: 'present' | 'late' | 'absent' | 'on_leave';
  late_minutes: number;
  work_hours: string;
  photo_in: string | null;
  photo_out: string | null;
  location_in: string | null;
  location_out: string | null;
  latitude_in: number | null;
  longitude_in: number | null;
  latitude_out: number | null;
  longitude_out: number | null;
  face_verified: boolean;
}

const SupervisorAttendance = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [locationData, setLocationData] = useState<AttendanceLocationData | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/by-date?supervisor_id=${user.id}&date=${selectedDate}`);
      const data = await res.json();
      
      if (data.success) {
        setAttendance(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch attendance');
      }
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleViewLocation = (record: AttendanceRecord) => {
    setLocationData({
      date: record.attendance_date,
      time_in: record.time_in || undefined,
      time_out: record.time_out || undefined,
      latitude_in: record.latitude_in || undefined,
      longitude_in: record.longitude_in || undefined,
      location_in: record.location_in || undefined,
      latitude_out: record.latitude_out || undefined,
      longitude_out: record.longitude_out || undefined,
      location_out: record.location_out || undefined,
      photo_in: record.photo_in || undefined,
      photo_out: record.photo_out || undefined,
      face_verified: record.face_verified,
      trainee_name: `${record.first_name} ${record.last_name}`
    });
    setShowLocationMap(true);
  };

  const changeDate = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status: string, lateMinutes: number) => {
    if (status === 'late') {
      return (
        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
          Late ({lateMinutes}m)
        </span>
      );
    } else if (status === 'present') {
      return (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
          On Time
        </span>
      );
    } else if (status === 'absent') {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
          Absent
        </span>
      );
    }
    return null;
  };

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = searchQuery === '' || 
      `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ojt_supervisor' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trainee Attendance</h1>
            <p className="text-gray-400 mt-1">View attendance records with location and selfie verification</p>
          </div>
          <button
            onClick={fetchAttendance}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Date Navigation */}
        <div className="bg-black-800 rounded-xl border border-gold-500/10 p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gold-500/10 rounded-lg text-gray-400 hover:text-gold-400 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <Calendar className="text-gold-400" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-black-900 border border-gold-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
            
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gold-500/10 rounded-lg text-gray-400 hover:text-gold-400 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="ml-4 px-3 py-1 text-sm bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          <p className="text-center text-gray-400 mt-2">{formatDate(selectedDate)}</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by trainee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black-800 border border-gold-500/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/30"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-black-800 border border-gold-500/10 rounded-xl text-white focus:outline-none focus:border-gold-500/30"
          >
            <option value="">All Status</option>
            <option value="present">On Time</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-black-800 rounded-xl border border-gold-500/10 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-400 mb-4"></div>
              <p className="text-gray-400">Loading attendance...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <Calendar className="w-12 h-12 mb-4 text-gold-500/50" />
              <p className="text-lg font-medium">No attendance records</p>
              <p className="text-sm mt-1">No trainees have clocked in for {formatDate(selectedDate)}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-black-900">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4">Trainee</th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <LogIn size={14} /> Clock In
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <LogOut size={14} /> Clock Out
                    </div>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Work Hours</th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Camera size={14} /><MapPin size={14} /> Verification
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {filteredAttendance.map((record) => (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gold-500/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                          <User className="text-gold-400" size={18} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{record.first_name} {record.last_name}</p>
                          <p className="text-gray-500 text-sm">{record.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400">{formatTime(record.time_in)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={record.time_out ? 'text-red-400' : 'text-gray-500'}>
                        {formatTime(record.time_out)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status, record.late_minutes)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{parseFloat(record.work_hours).toFixed(2)}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewLocation(record)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 rounded-lg transition-colors text-sm"
                        title="View selfie & location"
                      >
                        <Camera size={14} />
                        <MapPin size={14} />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        {!isLoading && attendance.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black-800 rounded-xl border border-gold-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-white">{attendance.length}</p>
              <p className="text-gray-400 text-sm">Total Records</p>
            </div>
            <div className="bg-black-800 rounded-xl border border-green-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {attendance.filter(a => a.status === 'present').length}
              </p>
              <p className="text-gray-400 text-sm">On Time</p>
            </div>
            <div className="bg-black-800 rounded-xl border border-amber-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {attendance.filter(a => a.status === 'late').length}
              </p>
              <p className="text-gray-400 text-sm">Late</p>
            </div>
            <div className="bg-black-800 rounded-xl border border-blue-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {attendance.filter(a => a.photo_in || a.location_in).length}
              </p>
              <p className="text-gray-400 text-sm">With Verification</p>
            </div>
          </div>
        )}
      </div>

      {/* Location Map Modal */}
      <AttendanceLocationMap
        isOpen={showLocationMap}
        onClose={() => setShowLocationMap(false)}
        data={locationData}
      />
    </SupervisorLayout>
  );
};

export default SupervisorAttendance;
