import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search,
  Eye,
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Building,
  Mail,
  Phone,
  Calendar,
  X,
  ChevronDown,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import { supervisorService, Trainee as ApiTrainee } from '../services/supervisorService';

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  university: string;
  course: string;
  hoursCompleted: number;
  requiredHours: number;
  renderHours: number;
  progress: number;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
  startDate: string;
  endDate: string;
  lastActive: string;
  tasksCompleted: number;
  totalTasks: number;
  avatar?: string;
}

const SupervisorTrainees = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchTrainees = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await supervisorService.getTrainees(user.id);
      
      // Transform API data to match component interface
      const transformedData: Trainee[] = data.map((t: ApiTrainee) => {
        const hoursCompleted = t.completed_hours || t.hours_completed || 0;
        const requiredHours = t.total_required_hours || t.required_hours || 500;
        const progress = Math.round((hoursCompleted / requiredHours) * 100);
        
        let status: 'on-track' | 'behind' | 'ahead' | 'completed';
        if (hoursCompleted >= requiredHours) {
          status = 'completed';
        } else if (hoursCompleted > requiredHours * 0.7) {
          status = 'ahead';
        } else if (hoursCompleted >= requiredHours * 0.4) {
          status = 'on-track';
        } else {
          status = 'behind';
        }
        
        return {
          id: t.id,
          firstName: t.first_name || '',
          lastName: t.last_name || '',
          email: t.email,
          phone: t.phone,
          university: t.university || 'Not specified',
          course: t.course || 'Not specified',
          hoursCompleted,
          requiredHours,
          renderHours: 24,
          progress,
          status,
          startDate: t.start_date,
          endDate: t.end_date || '',
          lastActive: t.last_active || 'Unknown',
          tasksCompleted: t.tasks_completed || 0,
          totalTasks: t.total_tasks || 0
        };
      });
      
      setTrainees(transformedData);
    } catch (err: unknown) {
      console.error('Error fetching trainees:', err);
      setError('Failed to load data. Please try again.');
      setTrainees([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ojt_supervisor' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'behind': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ahead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ahead': return <TrendingUp size={14} />;
      case 'behind': return <TrendingDown size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'behind': return 'bg-gradient-to-r from-red-500 to-red-400';
      case 'ahead': return 'bg-gradient-to-r from-blue-500 to-blue-400';
      case 'completed': return 'bg-gradient-to-r from-gold-500 to-gold-400';
      default: return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    }
  };

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = !searchQuery || 
      `${trainee.firstName} ${trainee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainee.university.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || trainee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setShowDetailModal(true);
  };

  return (
    <SupervisorLayout title="My Trainees">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30">
                <Users className="text-gold-400" size={24} />
              </div>
              My Trainees
            </h1>
            <p className="text-gray-400 mt-1">
              Trainees assigned to <span className="text-gold-400 font-medium">{user?.firstName} {user?.lastName}</span>
            </p>
          </div>
          <button
            onClick={fetchTrainees}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-xl text-gray-300 hover:text-gold-400 hover:border-gold-500/50 transition-all"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or university..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="on-track">On Track</option>
                <option value="ahead">Ahead</option>
                <option value="behind">Behind</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gold-400">{trainees.length}</p>
            <p className="text-sm text-gray-400 mt-1">Total Trainees</p>
          </div>
          <div className="bg-black-900 border border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">
              {trainees.filter(t => t.status === 'on-track' || t.status === 'ahead').length}
            </p>
            <p className="text-sm text-gray-400 mt-1">On Track</p>
          </div>
          <div className="bg-black-900 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">
              {trainees.filter(t => t.status === 'behind').length}
            </p>
            <p className="text-sm text-gray-400 mt-1">Need Attention</p>
          </div>
          <div className="bg-black-900 border border-gold-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gold-400">
              {trainees.filter(t => t.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-400 mt-1">Completed</p>
          </div>
        </div>

        {/* Trainees Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading trainees...</p>
            </div>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gold-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No trainees found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTrainees.map((trainee, index) => (
              <motion.div
                key={trainee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-500/40 transition-all hover:shadow-lg"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold text-base">
                          {trainee.firstName[0]}{trainee.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">{trainee.firstName} {trainee.lastName}</h3>
                        <p className="text-xs text-gray-500 truncate">{trainee.email}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium flex-shrink-0 ${getStatusColor(trainee.status)}`}>
                      {getStatusIcon(trainee.status)}
                      <span className="capitalize">{trainee.status.replace('-', ' ')}</span>
                    </span>
                  </div>

                  {/* University & Course */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building size={14} className="text-gold-400 flex-shrink-0" />
                      <span className="text-gray-400 truncate">{trainee.university}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap size={14} className="text-gold-400 flex-shrink-0" />
                      <span className="text-gray-400 truncate">{trainee.course}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>Hours: {trainee.hoursCompleted} / {trainee.requiredHours}</span>
                      <span className="font-medium">{trainee.progress}%</span>
                    </div>
                    <div className="w-full bg-black-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(trainee.progress, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-2 rounded-full ${getProgressBarColor(trainee.status)}`}
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500">Tasks Completed</span>
                    <span className="text-white font-medium">{trainee.tasksCompleted}/{trainee.totalTasks}</span>
                  </div>

                  {/* Last Active */}
                  <div className="text-xs text-gray-500 mb-4">
                    <Clock size={12} className="inline mr-1.5" />
                    Last active: {trainee.lastActive}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewTrainee(trainee)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-gold-500/20 text-gold-400 rounded-xl hover:bg-gold-500/30 transition-colors font-medium"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trainee Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedTrainee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black-900 border border-gold-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                    <span className="text-black font-bold text-xl">
                      {selectedTrainee.firstName[0]}{selectedTrainee.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedTrainee.firstName} {selectedTrainee.lastName}
                    </h2>
                    <p className="text-gray-400">{selectedTrainee.course}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-black-800 rounded-lg transition-colors"
                >
                  <X className="text-gray-400" size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-5">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${getStatusColor(selectedTrainee.status)}`}>
                    {getStatusIcon(selectedTrainee.status)}
                    <span className="capitalize">{selectedTrainee.status.replace('-', ' ')}</span>
                  </span>
                  <span className="text-gray-500 text-sm">Last active: {selectedTrainee.lastActive}</span>
                </div>

                {/* Contact Info */}
                <div className="bg-black-800 rounded-xl p-4 border border-gold-500/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Mail size={16} className="text-gold-400" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-500" />
                      <span className="text-gray-300 text-sm">{selectedTrainee.email}</span>
                    </div>
                    {selectedTrainee.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-500" />
                        <span className="text-gray-300 text-sm">{selectedTrainee.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Info */}
                <div className="bg-black-800 rounded-xl p-4 border border-gold-500/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap size={16} className="text-gold-400" />
                    Academic Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-gray-500" />
                      <span className="text-gray-300 text-sm">{selectedTrainee.university}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-gray-500" />
                      <span className="text-gray-300 text-sm">{selectedTrainee.course}</span>
                    </div>
                  </div>
                </div>

                {/* OJT Period */}
                <div className="bg-black-800 rounded-xl p-4 border border-gold-500/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-gold-400" />
                    OJT Period
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-400" />
                        <span className="text-gray-300">{new Date(selectedTrainee.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">End Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-red-400" />
                        <span className="text-gray-300">{new Date(selectedTrainee.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-black-800 rounded-xl p-4 border border-gold-500/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-gold-400" />
                    Progress Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Hours Completed</span>
                        <span className="text-white font-medium">
                          {selectedTrainee.hoursCompleted} / {selectedTrainee.requiredHours} hrs
                        </span>
                      </div>
                      <div className="w-full bg-black-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(selectedTrainee.progress, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-3 rounded-full ${getProgressBarColor(selectedTrainee.status)}`}
                        />
                      </div>
                      <p className="text-right text-xs text-gray-500 mt-1">{selectedTrainee.progress}% complete</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-4 bg-black-900 rounded-xl border border-gold-500/10">
                        <p className="text-2xl font-bold text-gold-400">{selectedTrainee.tasksCompleted}</p>
                        <p className="text-xs text-gray-500 mt-1">Tasks Completed</p>
                      </div>
                      <div className="text-center p-4 bg-black-900 rounded-xl border border-gray-700/50">
                        <p className="text-2xl font-bold text-gray-400">{selectedTrainee.totalTasks - selectedTrainee.tasksCompleted}</p>
                        <p className="text-xs text-gray-500 mt-1">Tasks Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all font-semibold">
                    <FileText size={18} />
                    View Full Report
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors font-medium">
                    <MessageSquare size={18} />
                    Send Message
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SupervisorLayout>
  );
};

export default SupervisorTrainees;
