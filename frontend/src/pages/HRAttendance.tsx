import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

const HRAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock attendance data
  const attendanceRecords = [
    { id: 1, name: 'Pedro Garcia', role: 'Sales', status: 'present', clockIn: '08:00 AM', clockOut: '05:30 PM', hours: 9.5 },
    { id: 2, name: 'Maria Santos', role: 'Supervisor', status: 'present', clockIn: '07:45 AM', clockOut: '06:00 PM', hours: 10.25 },
    { id: 3, name: 'Juan Dela Cruz', role: 'OJT', status: 'late', clockIn: '09:15 AM', clockOut: '05:00 PM', hours: 7.75 },
    { id: 4, name: 'Ana Reyes', role: 'OJT', status: 'present', clockIn: '08:00 AM', clockOut: '05:00 PM', hours: 9 },
    { id: 5, name: 'Carlos Mendoza', role: 'Sales', status: 'absent', clockIn: '-', clockOut: '-', hours: 0 },
  ];

  const stats = {
    present: attendanceRecords.filter(r => r.status === 'present').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    totalHours: attendanceRecords.reduce((sum, r) => sum + r.hours, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Present</span>;
      case 'late':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Late</span>;
      case 'absent':
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full flex items-center gap-1"><XCircle size={12} /> Absent</span>;
      default:
        return null;
    }
  };

  return (
    <HRLayout title="Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance Management</h1>
            <p className="text-gray-400">Track and manage employee attendance</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
            />
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
                <p className="text-gray-400 text-sm">Present</p>
                <p className="text-2xl font-bold text-green-400">{stats.present}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={24} />
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
                <p className="text-gray-400 text-sm">Late</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.late}</p>
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
                <p className="text-gray-400 text-sm">Absent</p>
                <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-400" size={24} />
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

        {/* Search */}
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
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-gray-400 hover:text-white transition-all">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clock In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clock Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {attendanceRecords
                  .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-black-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-medium">
                            {record.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-white font-medium">{record.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{record.role}</td>
                      <td className="px-4 py-4">{getStatusBadge(record.status)}</td>
                      <td className="px-4 py-4 text-gray-400">{record.clockIn}</td>
                      <td className="px-4 py-4 text-gray-400">{record.clockOut}</td>
                      <td className="px-4 py-4 text-white font-medium">{record.hours > 0 ? `${record.hours}h` : '-'}</td>
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

export default HRAttendance;
