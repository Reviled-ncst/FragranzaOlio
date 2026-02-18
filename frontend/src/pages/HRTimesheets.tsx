import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

interface TimesheetEntry {
  id: number;
  name: string;
  role: string;
  weekStart: string;
  weekEnd: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: 'approved' | 'pending' | 'rejected';
}

const HRTimesheets = () => {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Mock timesheet data
  const timesheets: TimesheetEntry[] = [
    { id: 1, name: 'Pedro Garcia', role: 'Sales', weekStart: 'Feb 12', weekEnd: 'Feb 18', regularHours: 40, overtimeHours: 5, totalHours: 45, status: 'approved' },
    { id: 2, name: 'Maria Santos', role: 'Supervisor', weekStart: 'Feb 12', weekEnd: 'Feb 18', regularHours: 40, overtimeHours: 8, totalHours: 48, status: 'approved' },
    { id: 3, name: 'Juan Dela Cruz', role: 'OJT', weekStart: 'Feb 12', weekEnd: 'Feb 18', regularHours: 24, overtimeHours: 0, totalHours: 24, status: 'pending' },
    { id: 4, name: 'Ana Reyes', role: 'OJT', weekStart: 'Feb 12', weekEnd: 'Feb 18', regularHours: 24, overtimeHours: 0, totalHours: 24, status: 'pending' },
    { id: 5, name: 'Carlos Mendoza', role: 'Sales', weekStart: 'Feb 12', weekEnd: 'Feb 18', regularHours: 32, overtimeHours: 0, totalHours: 32, status: 'rejected' },
  ];

  const stats = {
    totalSubmitted: timesheets.length,
    pending: timesheets.filter(t => t.status === 'pending').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    totalHours: timesheets.reduce((sum, t) => sum + t.totalHours, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      default:
        return null;
    }
  };

  const filteredTimesheets = timesheets
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => !statusFilter || t.status === statusFilter);

  return (
    <HRLayout title="Timesheets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Timesheet Management</h1>
            <p className="text-gray-400">Review and approve employee timesheets</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-black-800 border border-pink-500/20 rounded-lg p-1">
              <button
                onClick={() => setSelectedWeek(w => w - 1)}
                className="p-2 hover:bg-pink-500/20 rounded transition-all"
              >
                <ChevronLeft size={18} className="text-gray-400" />
              </button>
              <span className="px-3 text-white text-sm">Feb 12 - Feb 18, 2026</span>
              <button
                onClick={() => setSelectedWeek(w => w + 1)}
                disabled={selectedWeek >= 0}
                className="p-2 hover:bg-pink-500/20 rounded transition-all disabled:opacity-50"
              >
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
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
                <p className="text-2xl font-bold text-pink-400">{stats.totalHours}</p>
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
                placeholder="Search employees..."
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
            </select>
          </div>
        </div>

        {/* Timesheets Table */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Regular</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Overtime</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {filteredTimesheets.map((entry) => (
                  <tr key={entry.id} className="hover:bg-black-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-medium">
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-white font-medium">{entry.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400">{entry.role}</td>
                    <td className="px-4 py-4 text-gray-400">{entry.weekStart} - {entry.weekEnd}</td>
                    <td className="px-4 py-4 text-white">{entry.regularHours}h</td>
                    <td className="px-4 py-4 text-white">{entry.overtimeHours}h</td>
                    <td className="px-4 py-4 text-pink-400 font-medium">{entry.totalHours}h</td>
                    <td className="px-4 py-4">{getStatusBadge(entry.status)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                          <Eye size={18} />
                        </button>
                        {entry.status === 'pending' && (
                          <>
                            <button className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all">
                              Approve
                            </button>
                            <button className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRTimesheets;
