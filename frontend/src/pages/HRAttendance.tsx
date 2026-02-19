import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  ArrowLeft,
  Loader2,
  Briefcase,
  Mail,
  GraduationCap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

// Types
interface AttendanceRecord {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInRaw: string | null;
  clockOutRaw: string | null;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'late' | 'absent';
  breakStart: string | null;
  breakEnd: string | null;
  notes: string | null;
  supervisorName: string;
}

interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  totalHours: number;
}

interface UserHistoryRecord {
  id: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number;
  overtimeHours: number;
  status: string;
  breakStart: string | null;
  breakEnd: string | null;
  notes: string | null;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  university: string | null;
  course: string | null;
  supervisorName: string;
}

interface UserHistory {
  user: UserDetail;
  records: UserHistoryRecord[];
  summary: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalHours: number;
    avgHoursPerDay: number;
  };
}

type SortField = 'name' | 'role' | 'status' | 'clockIn' | 'clockOut' | 'totalHours';
type SortDirection = 'asc' | 'desc' | null;

const roleLabels: Record<string, string> = {
  ojt: 'OJT Intern',
  ojt_supervisor: 'Supervisor',
  sales: 'Sales',
  hr: 'HR',
  admin: 'Admin',
  customer: 'Customer'
};

const roleColors: Record<string, string> = {
  ojt: 'text-blue-400',
  ojt_supervisor: 'text-purple-400',
  sales: 'text-emerald-400',
  hr: 'text-pink-400',
  admin: 'text-orange-400'
};

const HRAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, late: 0, absent: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // User detail view
  const [selectedUser, setSelectedUser] = useState<UserHistory | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [historyRange, setHistoryRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/hr.php/attendance?date=${selectedDate}`);
      const result = await response.json();
      if (result.success && result.data) {
        setRecords(result.data.records ?? []);
        setStats(result.data.stats ?? { present: 0, late: 0, absent: 0, totalHours: 0 });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const fetchUserHistory = async (userId: number) => {
    setUserLoading(true);
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/hr.php/attendance/${userId}?start=${historyRange.start}&end=${historyRange.end}`
      );
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedUser(result.data);
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
    } finally {
      setUserLoading(false);
    }
  };

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown size={14} className="text-gray-600" />;
    if (sortDirection === 'asc') return <ChevronUp size={14} className="text-pink-400" />;
    return <ChevronDown size={14} className="text-pink-400" />;
  };

  // Filter + sort + search
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(r => r.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sort
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let valA: string | number;
        let valB: string | number;

        switch (sortField) {
          case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
          case 'role': valA = a.role; valB = b.role; break;
          case 'status': {
            const order: Record<string, number> = { present: 0, late: 1, absent: 2 };
            valA = order[a.status] ?? 3;
            valB = order[b.status] ?? 3;
            break;
          }
          case 'clockIn': valA = a.clockInRaw ?? ''; valB = b.clockInRaw ?? ''; break;
          case 'clockOut': valA = a.clockOutRaw ?? ''; valB = b.clockOutRaw ?? ''; break;
          case 'totalHours': valA = a.totalHours; valB = b.totalHours; break;
          default: return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [records, searchQuery, roleFilter, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-green-500/15 text-green-400 rounded-full border border-green-500/20">
            <CheckCircle size={12} /> Present
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-yellow-500/15 text-yellow-400 rounded-full border border-yellow-500/20">
            <AlertCircle size={12} /> Late
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-red-500/15 text-red-400 rounded-full border border-red-500/20">
            <XCircle size={12} /> Absent
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitialColor = (name: string) => {
    const colors = [
      'bg-pink-500/25 text-pink-400',
      'bg-blue-500/25 text-blue-400',
      'bg-emerald-500/25 text-emerald-400',
      'bg-purple-500/25 text-purple-400',
      'bg-amber-500/25 text-amber-400',
      'bg-cyan-500/25 text-cyan-400',
      'bg-rose-500/25 text-rose-400',
      'bg-indigo-500/25 text-indigo-400',
    ];
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    return colors[idx];
  };

  const uniqueRoles = useMemo(() => {
    const roles = new Set(records.map(r => r.role));
    return Array.from(roles);
  }, [records]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Overtime'];
    const rows = filteredRecords.map(r => [
      r.name, r.email, roleLabels[r.role] ?? r.role, r.status,
      r.clockIn ?? '-', r.clockOut ?? '-',
      r.totalHours.toFixed(2), r.overtimeHours.toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── User Timecard Detail View ────────────────────────────────
  if (selectedUser) {
    const { user, records: histRecords, summary } = selectedUser;

    return (
      <HRLayout title="Attendance">
        <div className="space-y-6">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Attendance
          </motion.button>

          {/* User Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/20 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold ${getInitialColor(user.name)}`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className={`text-sm font-medium ${roleColors[user.role] ?? 'text-gray-400'}`}>
                    {roleLabels[user.role] ?? user.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Mail size={14} /> {user.email}
                  </span>
                  {user.supervisorName && user.supervisorName !== 'N/A' && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Briefcase size={14} /> Supervisor: {user.supervisorName}
                    </span>
                  )}
                  {user.university && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <GraduationCap size={14} /> {user.university}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">Date Range:</span>
            <input
              type="date"
              value={historyRange.start}
              onChange={(e) => {
                setHistoryRange(prev => ({ ...prev, start: e.target.value }));
              }}
              className="px-3 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={historyRange.end}
              onChange={(e) => {
                setHistoryRange(prev => ({ ...prev, end: e.target.value }));
              }}
              className="px-3 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={() => fetchUserHistory(user.id)}
              className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-medium hover:bg-pink-500/30 transition-all"
            >
              Apply
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Days Worked', value: summary.totalDays, icon: Calendar, colorClass: 'bg-pink-500/20 text-pink-400' },
              { label: 'Present', value: summary.presentDays, icon: CheckCircle, colorClass: 'bg-green-500/20 text-green-400' },
              { label: 'Late', value: summary.lateDays, icon: AlertCircle, colorClass: 'bg-yellow-500/20 text-yellow-400' },
              { label: 'Total Hours', value: `${summary.totalHours}h`, icon: Clock, colorClass: 'bg-blue-500/20 text-blue-400' },
              { label: 'Avg Hours/Day', value: `${summary.avgHoursPerDay}h`, icon: TrendingUp, colorClass: 'bg-purple-500/20 text-purple-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-black-900 border border-pink-500/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.colorClass.split(' ')[0]}`}>
                    <stat.icon size={18} className={stat.colorClass.split(' ')[1]} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Timecard Records Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black-900 border border-pink-500/20 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-pink-500/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-pink-400" />
                Timecard History
              </h3>
            </div>
            {userLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-pink-400" />
              </div>
            ) : histRecords.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No attendance records found</p>
                <p className="text-sm mt-1">for the selected date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black-800/60">
                    <tr>
                      {['Date', 'Status', 'Clock In', 'Clock Out', 'Break', 'Hours', 'Overtime', 'Notes'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-500/5">
                    {histRecords.map((record, i) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="text-white font-medium text-sm">
                            {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(record.status)}</td>
                        <td className="px-5 py-4">
                          <span className={record.clockIn ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
                            {record.clockIn ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={record.clockOut ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
                            {record.clockOut ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-gray-400 text-sm">
                            {record.breakStart && record.breakEnd
                              ? `${record.breakStart} - ${record.breakEnd}`
                              : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-semibold text-sm ${record.totalHours > 0 ? 'text-white' : 'text-gray-600'}`}>
                            {record.totalHours > 0 ? `${record.totalHours}h` : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm ${record.overtimeHours > 0 ? 'text-amber-400 font-medium' : 'text-gray-600'}`}>
                            {record.overtimeHours > 0 ? `+${record.overtimeHours}h` : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-gray-400 text-sm truncate max-w-[150px] block">
                            {record.notes ?? '-'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </HRLayout>
    );
  }

  // ─── Main Attendance List View ────────────────────────────────
  return (
    <HRLayout title="Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(selectedDate)} &middot; {filteredRecords.length} employee{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-500/15 text-pink-400 rounded-xl hover:bg-pink-500/25 transition-all text-sm font-medium border border-pink-500/20"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: stats.present, icon: CheckCircle, colorCls: 'green' },
            { label: 'Late', value: stats.late, icon: AlertCircle, colorCls: 'yellow' },
            { label: 'Absent', value: stats.absent, icon: XCircle, colorCls: 'red' },
            { label: 'Total Hours', value: stats.totalHours.toFixed(1), icon: Clock, colorCls: 'pink' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-black-900 border border-pink-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${
                    stat.colorCls === 'green' ? 'text-green-400' :
                    stat.colorCls === 'yellow' ? 'text-yellow-400' :
                    stat.colorCls === 'red' ? 'text-red-400' :
                    'text-pink-400'
                  }`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.colorCls === 'green' ? 'bg-green-500/15' :
                  stat.colorCls === 'yellow' ? 'bg-yellow-500/15' :
                  stat.colorCls === 'red' ? 'bg-red-500/15' :
                  'bg-pink-500/15'
                }`}>
                  <stat.icon className={
                    stat.colorCls === 'green' ? 'text-green-400' :
                    stat.colorCls === 'yellow' ? 'text-yellow-400' :
                    stat.colorCls === 'red' ? 'text-red-400' :
                    'text-pink-400'
                  } size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-black-900 border border-pink-500/20 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-black-800 border border-pink-500/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pink-500/40 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-pink-500/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-pink-500/40 transition-colors min-w-[140px]"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(r => (
                <option key={r} value={r}>{roleLabels[r] ?? r}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-pink-500/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-pink-500/40 transition-colors min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-black-900 border border-pink-500/20 rounded-2xl overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-pink-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Search size={48} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-lg">No records found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black-800/60 border-b border-pink-500/10">
                  <tr>
                    {([
                      { key: 'name' as SortField, label: 'Employee' },
                      { key: 'role' as SortField, label: 'Role' },
                      { key: 'status' as SortField, label: 'Status' },
                      { key: 'clockIn' as SortField, label: 'Clock In' },
                      { key: 'clockOut' as SortField, label: 'Clock Out' },
                      { key: 'totalHours' as SortField, label: 'Hours' },
                    ]).map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          {col.label}
                          {getSortIcon(col.key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-500/5">
                  <AnimatePresence mode="popLayout">
                    {filteredRecords.map((record, i) => (
                      <motion.tr
                        key={`${record.userId}-${record.date}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.015 }}
                        onClick={() => fetchUserHistory(record.userId)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getInitialColor(record.name)} group-hover:scale-105 transition-transform`}>
                              {getInitials(record.name)}
                            </div>
                            <div>
                              <span className="text-white font-medium text-sm block group-hover:text-pink-300 transition-colors">{record.name}</span>
                              <span className="text-xs text-gray-500">{record.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-medium ${roleColors[record.role] ?? 'text-gray-400'}`}>
                            {roleLabels[record.role] ?? record.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm ${record.clockIn ? 'text-white' : 'text-gray-600'}`}>
                            {record.clockIn ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm ${record.clockOut ? 'text-white' : 'text-gray-600'}`}>
                            {record.clockOut ?? '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${record.totalHours > 0 ? 'text-white' : 'text-gray-600'}`}>
                            {record.totalHours > 0 ? `${record.totalHours}h` : '-'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with count */}
          {!loading && filteredRecords.length > 0 && (
            <div className="px-5 py-3 bg-black-800/40 border-t border-pink-500/10 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {filteredRecords.length} of {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
              <span>
                Click any row to view full timecard
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </HRLayout>
  );
};

export default HRAttendance;
