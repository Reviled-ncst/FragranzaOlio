import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Building,
  UserPlus,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: string;
  hourlyRate?: number;
  status: 'active' | 'inactive' | 'on_leave';
  totalHours: number;
  pendingPayout: number;
}

const HREmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Mock data for now - will connect to backend
      const mockEmployees: Employee[] = [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@fragranza.com', phone: '09171234567', department: 'Sales', position: 'Sales Manager', hireDate: '2023-01-15', hourlyRate: 150, status: 'active', totalHours: 168, pendingPayout: 25200 },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@fragranza.com', phone: '09182345678', department: 'Marketing', position: 'Marketing Lead', hireDate: '2023-03-20', hourlyRate: 140, status: 'active', totalHours: 160, pendingPayout: 22400 },
        { id: 3, firstName: 'Mike', lastName: 'Johnson', email: 'mike@fragranza.com', phone: '09193456789', department: 'Operations', position: 'Operations Staff', hireDate: '2023-06-10', hourlyRate: 100, status: 'active', totalHours: 176, pendingPayout: 17600 },
        { id: 4, firstName: 'Sarah', lastName: 'Wilson', email: 'sarah@fragranza.com', phone: '09204567890', department: 'Sales', position: 'Sales Associate', hireDate: '2023-09-01', hourlyRate: 90, status: 'on_leave', totalHours: 80, pendingPayout: 7200 },
        { id: 5, firstName: 'David', lastName: 'Brown', email: 'david@fragranza.com', phone: '09215678901', department: 'IT', position: 'IT Support', hireDate: '2024-01-05', hourlyRate: 120, status: 'active', totalHours: 184, pendingPayout: 22080 },
      ];
      setEmployees(mockEmployees);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || emp.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400';
      case 'on_leave':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setModalMode('add');
    setShowModal(true);
  };

  if (loading) {
    return (
      <HRLayout title="Employees">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-pink-500" size={40} />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout title="Employees">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
              />
            </div>
            
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Add Employee Button */}
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
          >
            <UserPlus size={20} />
            Add Employee
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Employees</p>
            <p className="text-2xl font-bold text-white">{employees.length}</p>
          </div>
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Hours This Month</p>
            <p className="text-2xl font-bold text-white">
              {employees.reduce((sum, e) => sum + e.totalHours, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Pending Payouts</p>
            <p className="text-2xl font-bold text-pink-400">
              ₱{employees.reduce((sum, e) => sum + e.pendingPayout, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Employee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Hours</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Pending Payout</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedEmployees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-black-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <span className="text-pink-400 font-medium text-sm">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-gray-400 text-sm">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{employee.department || '-'}</p>
                      <p className="text-gray-400 text-sm">{employee.position || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-white">{employee.totalHours} hrs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-pink-400 font-medium">₱{employee.pendingPayout.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="p-2 hover:bg-black-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="p-2 hover:bg-black-700 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-black-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-400"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-black-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-400"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Employee Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black-900 border border-pink-500/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white">
                    {modalMode === 'add' ? 'Add Employee' : modalMode === 'edit' ? 'Edit Employee' : 'Employee Details'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-black-700 rounded-lg text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {selectedEmployee && modalMode === 'view' && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <span className="text-pink-400 font-bold text-xl">
                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-white">
                            {selectedEmployee.firstName} {selectedEmployee.lastName}
                          </h4>
                          <p className="text-gray-400">{selectedEmployee.position}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white">{selectedEmployee.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Phone</p>
                          <p className="text-white">{selectedEmployee.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Department</p>
                          <p className="text-white">{selectedEmployee.department || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Hire Date</p>
                          <p className="text-white">{selectedEmployee.hireDate || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Hourly Rate</p>
                          <p className="text-white">₱{selectedEmployee.hourlyRate?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Status</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.status)}`}>
                            {selectedEmployee.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <h5 className="text-white font-medium mb-4">This Month's Summary</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Total Hours</p>
                            <p className="text-2xl font-bold text-white">{selectedEmployee.totalHours}</p>
                          </div>
                          <div className="bg-black-800 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Pending Payout</p>
                            <p className="text-2xl font-bold text-pink-400">₱{selectedEmployee.pendingPayout.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {(modalMode === 'add' || modalMode === 'edit') && (
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">First Name</label>
                          <input
                            type="text"
                            defaultValue={selectedEmployee?.firstName || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                          <input
                            type="text"
                            defaultValue={selectedEmployee?.lastName || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue={selectedEmployee?.email || ''}
                          className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone</label>
                        <input
                          type="tel"
                          defaultValue={selectedEmployee?.phone || ''}
                          className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Department</label>
                          <input
                            type="text"
                            defaultValue={selectedEmployee?.department || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Position</label>
                          <input
                            type="text"
                            defaultValue={selectedEmployee?.position || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Hourly Rate (₱)</label>
                          <input
                            type="number"
                            defaultValue={selectedEmployee?.hourlyRate || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Hire Date</label>
                          <input
                            type="date"
                            defaultValue={selectedEmployee?.hireDate || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                        >
                          {modalMode === 'add' ? 'Add Employee' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HRLayout>
  );
};

export default HREmployees;
