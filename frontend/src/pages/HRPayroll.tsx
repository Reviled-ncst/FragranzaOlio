import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar,
  Download,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

interface PayrollEntry {
  id: number;
  name: string;
  role: string;
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'paid' | 'pending' | 'processing';
}

const HRPayroll = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('feb-2026-p2');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock payroll data - employees only (not OJT interns)
  const payrollData: PayrollEntry[] = [
    { id: 1, name: 'Pedro Garcia', role: 'Sales', employeeId: 'SAL-2026-9444', regularHours: 160, overtimeHours: 20, hourlyRate: 125, grossPay: 22500, deductions: 2250, netPay: 20250, status: 'paid' },
    { id: 2, name: 'Maria Santos', role: 'Supervisor', employeeId: 'SUP-2026-1234', regularHours: 160, overtimeHours: 32, hourlyRate: 175, grossPay: 33600, deductions: 3360, netPay: 30240, status: 'paid' },
    { id: 3, name: 'Carlos Mendoza', role: 'Sales', employeeId: 'SAL-2026-5678', regularHours: 128, overtimeHours: 0, hourlyRate: 125, grossPay: 16000, deductions: 1600, netPay: 14400, status: 'pending' },
    { id: 4, name: 'HR Staff', role: 'HR', employeeId: 'HRD-2026-0001', regularHours: 160, overtimeHours: 8, hourlyRate: 150, grossPay: 25200, deductions: 2520, netPay: 22680, status: 'processing' },
  ];

  const stats = {
    totalPayroll: payrollData.reduce((sum, p) => sum + p.netPay, 0),
    employees: payrollData.length,
    pending: payrollData.filter(p => p.status === 'pending').length,
    paid: payrollData.filter(p => p.status === 'paid').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Paid</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Pending</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1"><Clock size={12} /> Processing</span>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <HRLayout title="Payroll">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
            <p className="text-gray-400">Manage employee compensation and payments</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
            >
              <option value="feb-2026-p2">Feb 16-28, 2026</option>
              <option value="feb-2026-p1">Feb 1-15, 2026</option>
              <option value="jan-2026-p2">Jan 16-31, 2026</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all">
              <DollarSign size={18} />
              Process Payroll
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-all">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-400 mt-0.5" size={20} />
          <div>
            <p className="text-blue-400 font-medium">OJT Interns Not Included</p>
            <p className="text-blue-400/70 text-sm">OJT interns do not receive payouts. Only regular employees are shown in payroll.</p>
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
                <p className="text-gray-400 text-sm">Total Payroll</p>
                <p className="text-2xl font-bold text-pink-400">{formatCurrency(stats.totalPayroll)}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-pink-400" size={24} />
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
                <p className="text-gray-400 text-sm">Employees</p>
                <p className="text-2xl font-bold text-white">{stats.employees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
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
                <p className="text-gray-400 text-sm">Paid</p>
                <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
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
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-400" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gross</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deductions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Net Pay</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-500/10">
                {payrollData
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-black-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-medium">
                            {entry.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{entry.name}</p>
                            <p className="text-gray-500 text-sm">{entry.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-sm">{entry.employeeId}</td>
                      <td className="px-4 py-4 text-gray-400">
                        {entry.regularHours}h + {entry.overtimeHours}h OT
                      </td>
                      <td className="px-4 py-4 text-gray-400">{formatCurrency(entry.hourlyRate)}/hr</td>
                      <td className="px-4 py-4 text-white">{formatCurrency(entry.grossPay)}</td>
                      <td className="px-4 py-4 text-red-400">-{formatCurrency(entry.deductions)}</td>
                      <td className="px-4 py-4 text-pink-400 font-bold">{formatCurrency(entry.netPay)}</td>
                      <td className="px-4 py-4">{getStatusBadge(entry.status)}</td>
                      <td className="px-4 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                          <Eye size={18} />
                        </button>
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

export default HRPayroll;
