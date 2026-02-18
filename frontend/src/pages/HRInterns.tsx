import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap,
  Search, 
  Filter,
  Edit,
  Eye,
  X,
  Loader2,
  UserPlus,
  Clock,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

interface Intern {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  university: string;
  course: string;
  supervisorName?: string;
  startDate: string;
  endDate?: string;
  requiredHours: number;
  completedHours: number;
  status: 'active' | 'completed' | 'withdrawn';
}

const HRInterns = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      // Mock data - will connect to backend later
      const mockInterns: Intern[] = [
        { id: 1, firstName: 'Anna', lastName: 'Garcia', email: 'anna@student.pup.edu.ph', phone: '09171234567', university: 'Polytechnic University of the Philippines', course: 'BS Information Technology', supervisorName: 'John Doe', startDate: '2024-01-15', endDate: '2024-06-15', requiredHours: 500, completedHours: 320, status: 'active' },
        { id: 2, firstName: 'Mark', lastName: 'Santos', email: 'mark@student.ust.edu.ph', phone: '09182345678', university: 'University of Santo Tomas', course: 'BS Computer Science', supervisorName: 'Jane Smith', startDate: '2024-02-01', endDate: '2024-07-01', requiredHours: 486, completedHours: 240, status: 'active' },
        { id: 3, firstName: 'Lisa', lastName: 'Cruz', email: 'lisa@student.dlsu.edu.ph', university: 'De La Salle University', course: 'BS Business Administration', supervisorName: 'Mike Johnson', startDate: '2024-01-08', endDate: '2024-05-08', requiredHours: 400, completedHours: 400, status: 'completed' },
        { id: 4, firstName: 'James', lastName: 'Reyes', email: 'james@student.feu.edu.ph', phone: '09204567890', university: 'Far Eastern University', course: 'BS Accountancy', supervisorName: 'John Doe', startDate: '2024-03-01', endDate: '2024-08-01', requiredHours: 600, completedHours: 150, status: 'active' },
        { id: 5, firstName: 'Maria', lastName: 'Lim', email: 'maria@student.up.edu.ph', university: 'University of the Philippines', course: 'BS Marketing', startDate: '2024-02-15', requiredHours: 500, completedHours: 80, status: 'withdrawn' },
      ];
      setInterns(mockInterns);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interns:', error);
      setLoading(false);
    }
  };

  const filteredInterns = interns.filter(intern => {
    const matchesSearch = 
      intern.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || intern.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const paginatedInterns = filteredInterns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'withdrawn':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getProgressPercentage = (completed: number, required: number) => {
    return Math.min(100, Math.round((completed / required) * 100));
  };

  const handleViewIntern = (intern: Intern) => {
    setSelectedIntern(intern);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditIntern = (intern: Intern) => {
    setSelectedIntern(intern);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAddIntern = () => {
    setSelectedIntern(null);
    setModalMode('add');
    setShowModal(true);
  };

  if (loading) {
    return (
      <HRLayout title="OJT Interns">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-pink-500" size={40} />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout title="OJT Interns">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="text-purple-400 mt-0.5" size={20} />
            <div>
              <p className="text-purple-300 font-medium">OJT Intern Management</p>
              <p className="text-purple-300/70 text-sm">
                OJT interns do not receive payouts. Track their hours and progress towards completion.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search interns..."
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
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Add Intern Button */}
          <button
            onClick={handleAddIntern}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <UserPlus size={20} />
            Add Intern
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Interns</p>
            <p className="text-2xl font-bold text-white">{interns.length}</p>
          </div>
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {interns.filter(i => i.status === 'active').length}
            </p>
          </div>
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-blue-400">
              {interns.filter(i => i.status === 'completed').length}
            </p>
          </div>
          <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Hours Rendered</p>
            <p className="text-2xl font-bold text-purple-400">
              {interns.reduce((sum, i) => sum + i.completedHours, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Interns Table */}
        <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800 border-b border-pink-500/20">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Intern</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">University</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Progress</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Supervisor</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedInterns.map((intern) => (
                  <motion.tr
                    key={intern.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-black-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-medium text-sm">
                            {intern.firstName[0]}{intern.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{intern.firstName} {intern.lastName}</p>
                          <p className="text-gray-400 text-sm">{intern.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{intern.university}</p>
                      <p className="text-gray-400 text-xs">{intern.course}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intern.status)}`}>
                        {intern.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{intern.completedHours}/{intern.requiredHours} hrs</span>
                          <span className="text-white">{getProgressPercentage(intern.completedHours, intern.requiredHours)}%</span>
                        </div>
                        <div className="h-2 bg-black-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${getProgressPercentage(intern.completedHours, intern.requiredHours)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{intern.supervisorName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewIntern(intern)}
                          className="p-2 hover:bg-black-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditIntern(intern)}
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInterns.length)} of {filteredInterns.length}
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

        {/* Intern Modal */}
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
                    {modalMode === 'add' ? 'Add Intern' : modalMode === 'edit' ? 'Edit Intern' : 'Intern Details'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-black-700 rounded-lg text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {selectedIntern && modalMode === 'view' && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <GraduationCap className="text-purple-400" size={28} />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-white">
                            {selectedIntern.firstName} {selectedIntern.lastName}
                          </h4>
                          <p className="text-gray-400">{selectedIntern.course}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Building className="text-gray-400" size={18} />
                          <span className="text-white">{selectedIntern.university}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="text-gray-400" size={18} />
                          <span className="text-white">
                            {selectedIntern.startDate} to {selectedIntern.endDate || 'TBD'}
                          </span>
                        </div>
                        {selectedIntern.supervisorName && (
                          <div className="flex items-center gap-3">
                            <Eye className="text-gray-400" size={18} />
                            <span className="text-white">Supervisor: {selectedIntern.supervisorName}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <h5 className="text-white font-medium mb-4 flex items-center gap-2">
                          <Award className="text-purple-400" size={18} />
                          OJT Progress
                        </h5>
                        <div className="bg-black-800 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400">Hours Completed</span>
                            <span className="text-white font-medium">
                              {selectedIntern.completedHours} / {selectedIntern.requiredHours}
                            </span>
                          </div>
                          <div className="h-3 bg-black-700 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${getProgressPercentage(selectedIntern.completedHours, selectedIntern.requiredHours)}%` }}
                            />
                          </div>
                          <p className="text-center text-lg font-bold text-purple-400">
                            {getProgressPercentage(selectedIntern.completedHours, selectedIntern.requiredHours)}% Complete
                          </p>
                          <p className="text-center text-gray-400 text-sm mt-1">
                            {selectedIntern.requiredHours - selectedIntern.completedHours} hours remaining
                          </p>
                        </div>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-4">
                        <p className="text-purple-300 text-sm text-center">
                          OJT interns do not receive monetary compensation
                        </p>
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
                            defaultValue={selectedIntern?.firstName || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                          <input
                            type="text"
                            defaultValue={selectedIntern?.lastName || ''}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue={selectedIntern?.email || ''}
                          className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">University</label>
                        <input
                          type="text"
                          defaultValue={selectedIntern?.university || ''}
                          className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Course</label>
                        <input
                          type="text"
                          defaultValue={selectedIntern?.course || ''}
                          className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Required Hours</label>
                          <input
                            type="number"
                            defaultValue={selectedIntern?.requiredHours || 500}
                            className="w-full px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:border-pink-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                          <input
                            type="date"
                            defaultValue={selectedIntern?.startDate || ''}
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
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                          {modalMode === 'add' ? 'Add Intern' : 'Save Changes'}
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

export default HRInterns;
