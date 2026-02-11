import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  ChevronDown,
  RefreshCw,
  X,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  Loader2,
  Star,
  MessageSquare,
  ClipboardList,
  Filter,
  ArrowRight,
  FileCheck,
  XCircle,
  Image,
  Film,
  FileText,
  Download,
  ExternalLink,
  RotateCcw,
  ZoomIn,
  Copy,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import supervisorService, { Trainee } from '../services/supervisorService';
import { ojtTaskService, Task, CreateTaskData } from '../services/ojtService';

const SupervisorTasks = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending_review' | 'active' | 'completed'>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    priority: 'medium' as Task['priority'],
    dueDate: ''
  });

  const [reviewForm, setReviewForm] = useState({
    action: 'approve' as 'approve' | 'revision' | 'reject',
    feedback: '',
    rating: 0
  });

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Quick feedback templates
  const feedbackTemplates = {
    approve: [
      'Excellent work! Well done.',
      'Good job, task completed as expected.',
      'Great effort, keep it up!',
      'Task completed satisfactorily.',
    ],
    revision: [
      'Please review the requirements and make necessary adjustments.',
      'Some parts need improvement. See feedback for details.',
      'Good progress, but needs minor revisions.',
      'Please address the issues mentioned and resubmit.',
    ],
    reject: [
      'Task does not meet the requirements. Please redo.',
      'Significant issues found. Please start over.',
      'Does not follow the specified guidelines.',
    ],
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [tasksData, traineesData] = await Promise.all([
        ojtTaskService.getTasks({ supervisor_id: user.id }),
        supervisorService.getTrainees(user.id)
      ]);
      
      setTasks(tasksData);
      setTrainees(traineesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
      setTasks([]);
      setTrainees([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedToId: '',
      priority: 'medium',
      dueDate: ''
    });
  };

  const handleCreateTask = () => {
    setModalMode('create');
    setSelectedTask(null);
    resetForm();
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedToId: String(task.assigned_to),
      priority: task.priority,
      dueDate: task.due_date || ''
    });
    setShowTaskModal(true);
  };

  const handleViewTask = (task: Task) => {
    setModalMode('view');
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleReviewTask = (task: Task) => {
    setSelectedTask(task);
    setReviewForm({ action: 'approve', feedback: '', rating: 0 });
    setShowReviewModal(true);
  };

  const handleSubmitTask = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        const data: CreateTaskData = {
          title: taskForm.title,
          description: taskForm.description,
          assigned_to: Number(taskForm.assignedToId),
          assigned_by: user.id,
          priority: taskForm.priority,
          due_date: taskForm.dueDate || undefined
        };
        
        await ojtTaskService.createTask(data);
      } else if (modalMode === 'edit' && selectedTask) {
        await ojtTaskService.updateTask(selectedTask.id, {
          title: taskForm.title,
          description: taskForm.description,
          assigned_to: Number(taskForm.assignedToId),
          priority: taskForm.priority,
          due_date: taskForm.dueDate || undefined
        });
      }
      
      await fetchData();
      setShowTaskModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    
    try {
      await ojtTaskService.deleteTask(selectedTask.id);
      await fetchData();
      setShowDeleteConfirm(false);
      setSelectedTask(null);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    
    try {
      // Map 'revision' to 'reject' for backend (both send task back to trainee)
      const backendAction = reviewForm.action === 'approve' ? 'approve' : 'reject';
      
      await ojtTaskService.reviewTask(
        selectedTask.id,
        backendAction,
        reviewForm.feedback,
        reviewForm.rating > 0 ? reviewForm.rating : undefined
      );
      
      await fetchData();
      setShowReviewModal(false);
      setSelectedTask(null);
      setReviewForm({ action: 'approve', feedback: '', rating: 0 });
    } catch (err: any) {
      console.error('Error reviewing task:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'under_review': return 'Awaiting Review';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Circle size={14} />;
      case 'in_progress': return <Clock size={14} />;
      case 'under_review': return <AlertCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get tasks pending review
  const pendingReviewTasks = tasks.filter(t => t.status === 'under_review');
  
  // Filter tasks based on active tab
  const getTabTasks = () => {
    let filtered = tasks;
    
    switch (activeTab) {
      case 'pending_review':
        filtered = tasks.filter(t => t.status === 'under_review');
        break;
      case 'active':
        filtered = tasks.filter(t => ['pending', 'in_progress'].includes(t.status));
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed');
        break;
      default:
        filtered = tasks;
    }
    
    // Apply search and filters
    return filtered.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const filteredTasks = getTabTasks();

  // Stats
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    underReview: tasks.filter(t => t.status === 'under_review').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const tabs = [
    { id: 'all', label: 'All Tasks', count: taskStats.total, icon: ClipboardList },
    { id: 'pending_review', label: 'Pending Review', count: taskStats.underReview, icon: FileCheck, highlight: taskStats.underReview > 0 },
    { id: 'active', label: 'Active', count: taskStats.pending + taskStats.inProgress, icon: Clock },
    { id: 'completed', label: 'Completed', count: taskStats.completed, icon: CheckCircle },
  ];

  return (
    <SupervisorLayout title="Task Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30">
                <CheckSquare className="text-gold-400" size={24} />
              </div>
              Task Management
            </h1>
            <p className="text-gray-400 mt-1">Assign, track, and review trainee tasks</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-xl text-gray-300 hover:text-gold-400 hover:border-gold-500/50 transition-all"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleCreateTask}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/20"
            >
              <Plus size={18} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Pending Reviews Alert */}
        {pendingReviewTasks.length > 0 && activeTab !== 'pending_review' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 to-gold-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <FileCheck className="text-amber-400" size={20} />
                </div>
                <div>
                  <p className="text-amber-300 font-medium">
                    {pendingReviewTasks.length} task{pendingReviewTasks.length > 1 ? 's' : ''} awaiting your review
                  </p>
                  <p className="text-amber-400/70 text-sm">Trainees have submitted their work</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('pending_review')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
              >
                Review Now
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gold-400/80">Total Tasks</p>
              <ClipboardList size={18} className="text-gold-500/50" />
            </div>
            <p className="text-3xl font-bold text-gold-400 mt-2">{taskStats.total}</p>
          </div>
          <div className="bg-black-900 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Pending</p>
              <Circle size={18} className="text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-gray-300 mt-2">{taskStats.pending}</p>
          </div>
          <div className="bg-black-900 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-400">In Progress</p>
              <Clock size={18} className="text-blue-500/50" />
            </div>
            <p className="text-3xl font-bold text-blue-400 mt-2">{taskStats.inProgress}</p>
          </div>
          <div className={`bg-black-900 border rounded-xl p-4 ${taskStats.underReview > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-500/20'}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-400">Awaiting Review</p>
              <FileCheck size={18} className="text-amber-500/50" />
            </div>
            <p className="text-3xl font-bold text-amber-400 mt-2">{taskStats.underReview}</p>
          </div>
          <div className="bg-black-900 border border-emerald-500/30 rounded-xl p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-400">Completed</p>
              <CheckCircle size={18} className="text-emerald-500/50" />
            </div>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{taskStats.completed}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-400 border border-gold-500/40'
                  : tab.highlight
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-black-800 text-gray-400 border border-gray-700/50 hover:text-white hover:border-gray-600'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-gold-500/30 text-gold-300'
                    : tab.highlight
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tasks or trainees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-9 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors min-w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="under_review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors min-w-[130px]"
                >
                  <option value="">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tasks...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={32} className="text-gold-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {searchQuery || statusFilter || priorityFilter
                ? 'Try adjusting your filters to find what you\'re looking for'
                : 'Create a new task to assign work to your trainees'}
            </p>
            {!searchQuery && !statusFilter && !priorityFilter && (
              <button
                onClick={handleCreateTask}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold rounded-xl transition-all"
              >
                <Plus size={18} />
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-black-900 border rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                  task.status === 'under_review'
                    ? 'border-amber-500/40 hover:border-amber-500/60 shadow-amber-500/5'
                    : 'border-gold-500/20 hover:border-gold-500/40'
                }`}
              >
                <div className="p-4 lg:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold text-base lg:text-lg">{task.title}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description || 'No description provided'}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                          <div className="w-6 h-6 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-xs text-black font-bold">
                            {task.assignee_name?.charAt(0) || '?'}
                          </div>
                          {task.assignee_name}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Calendar size={14} />
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                        {task.rating && (
                          <span className="flex items-center gap-1 text-gold-400">
                            <Star size={14} fill="currentColor" />
                            {task.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {task.status === 'under_review' && (
                        <button
                          onClick={() => handleReviewTask(task)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
                        >
                          <FileCheck size={16} />
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => handleViewTask(task)}
                        className="p-2.5 text-gray-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Submission preview for under_review tasks */}
                  {task.status === 'under_review' && task.submission_text && (
                    <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-amber-400 mb-2 flex items-center gap-2 font-medium">
                        <MessageSquare size={14} />
                        Trainee Submission
                      </p>
                      <p className="text-gray-300 text-sm">{task.submission_text}</p>
                      
                      {/* Show file count indicator */}
                      {task.submissions && task.submissions.filter(s => s.file_path).length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-gold-400 text-xs">
                          <FileText size={12} />
                          {task.submissions.filter(s => s.file_path).length} file(s) attached
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback for completed tasks */}
                  {task.status === 'completed' && task.feedback && (
                    <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-emerald-400 flex items-center gap-2 font-medium">
                          <CheckCircle size={14} />
                          Your Feedback
                        </p>
                        {task.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= task.rating! ? 'text-gold-400 fill-gold-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{task.feedback}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Task Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowTaskModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-black-900 border border-gold-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-gold-500/20 rounded-lg">
                      <CheckSquare className="text-gold-400" size={20} />
                    </div>
                    {modalMode === 'create' ? 'Create New Task' : modalMode === 'edit' ? 'Edit Task' : 'Task Details'}
                  </h2>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {modalMode === 'view' && selectedTask ? (
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Title</label>
                        <p className="text-white text-lg font-medium mt-1">{selectedTask.title}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Description</label>
                        <p className="text-gray-300 mt-1">{selectedTask.description || 'No description'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Assigned To</label>
                          <p className="text-white mt-1">{selectedTask.assignee_name}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Priority</label>
                          <p className="mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(selectedTask.priority)}`}>
                              {selectedTask.priority}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                          <p className="mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getStatusColor(selectedTask.status)}`}>
                              {getStatusLabel(selectedTask.status)}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Due Date</label>
                          <p className="text-white mt-1">{formatDate(selectedTask.due_date)}</p>
                        </div>
                      </div>
                      {selectedTask.submission_text && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Trainee Submission</label>
                          <p className="text-gray-300 mt-2 p-4 bg-black-800 rounded-xl border border-gold-500/10">{selectedTask.submission_text}</p>
                        </div>
                      )}
                      
                      {/* Uploaded Files Display in View Modal */}
                      {selectedTask.submissions && selectedTask.submissions.filter(s => s.file_path).length > 0 && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Attached Files</label>
                          <div className="mt-2 space-y-2">
                            {selectedTask.submissions.filter(sub => sub.file_path).map((submission, idx) => {
                              const isImage = submission.file_type?.startsWith('image/');
                              const isVideo = submission.file_type?.startsWith('video/');
                              const fileUrl = `http://localhost/FragranzaWeb/backend/${submission.file_path}`;
                              
                              return (
                                <div key={idx} className="bg-black-800 border border-gold-500/20 rounded-xl overflow-hidden">
                                  {isImage && (
                                    <img 
                                      src={fileUrl} 
                                      alt={submission.file_name || 'Uploaded file'}
                                      className="w-full max-h-48 object-contain bg-black"
                                    />
                                  )}
                                  {isVideo && (
                                    <video 
                                      src={fileUrl}
                                      controls
                                      className="w-full max-h-48 bg-black"
                                    />
                                  )}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                      {isImage && <Image size={14} className="text-blue-400" />}
                                      {isVideo && <Film size={14} className="text-purple-400" />}
                                      {!isImage && !isVideo && <FileText size={14} className="text-gold-400" />}
                                      <span className="truncate max-w-[200px]">{submission.file_name}</span>
                                    </div>
                                    <a 
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-sm"
                                    >
                                      <ExternalLink size={14} />
                                      View
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {selectedTask.feedback && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Feedback</label>
                          <p className="text-gray-300 mt-2 p-4 bg-black-800 rounded-xl border border-gold-500/10">{selectedTask.feedback}</p>
                        </div>
                      )}
                      {selectedTask.rating && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Rating</label>
                          <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={20}
                                className={star <= selectedTask.rating! ? 'text-gold-400 fill-gold-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2 font-medium">Title *</label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2 font-medium">Description</label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
                          placeholder="Describe the task requirements..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2 font-medium">Assign To *</label>
                        <select
                          value={taskForm.assignedToId}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                        >
                          <option value="">Select a trainee</option>
                          {trainees.map((trainee) => (
                            <option key={trainee.id} value={trainee.id}>{trainee.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2 font-medium">Priority</label>
                          <select
                            value={taskForm.priority}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2 font-medium">Due Date</label>
                          <input
                            type="date"
                            value={taskForm.dueDate}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-6 border-t border-gold-500/20 flex gap-3">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 py-3 bg-black-800 text-gray-300 rounded-xl hover:bg-black-700 transition-colors font-medium"
                  >
                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      onClick={handleSubmitTask}
                      disabled={isSubmitting || !taskForm.title || !taskForm.assignedToId}
                      className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        modalMode === 'create' ? 'Create Task' : 'Save Changes'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Modal - Enhanced */}
        <AnimatePresence>
          {showReviewModal && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={() => setShowReviewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-black-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-amber-500/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <FileCheck className="text-amber-400" size={20} />
                    </div>
                    Review Submission
                  </h2>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  <div className="p-5 space-y-5">
                    {/* Task & Trainee Info */}
                    <div className="bg-black-800 rounded-xl p-4 border border-gold-500/10">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-black font-bold text-lg">
                          {selectedTask.assignee_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-lg">{selectedTask.title}</p>
                          <p className="text-gray-400 text-sm">{selectedTask.assignee_name}</p>
                          {selectedTask.due_date && (
                            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                              <Calendar size={12} />
                              Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>

                    {/* Description if exists */}
                    {selectedTask.description && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Task Description</label>
                        <p className="text-gray-400 text-sm p-3 bg-black-800 rounded-xl border border-gray-700">{selectedTask.description}</p>
                      </div>
                    )}

                    {/* Trainee's Submission Text */}
                    {selectedTask.submission_text && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Trainee's Response</label>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <p className="text-gray-300 whitespace-pre-wrap">{selectedTask.submission_text}</p>
                        </div>
                      </div>
                    )}

                    {/* Uploaded Files Display - Enhanced */}
                    {selectedTask.submissions && selectedTask.submissions.filter(s => s.file_path).length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                          Attached Files ({selectedTask.submissions.filter(s => s.file_path).length})
                        </label>
                        <div className="space-y-3">
                          {selectedTask.submissions.filter(sub => sub.file_path).map((submission, idx) => {
                            const isImage = submission.file_type?.startsWith('image/');
                            const isVideo = submission.file_type?.startsWith('video/');
                            const fileUrl = `http://localhost/FragranzaWeb/backend/${submission.file_path}`;
                            
                            return (
                              <div key={idx} className="bg-black-800 border border-gold-500/20 rounded-xl overflow-hidden">
                                {/* Image Preview with Lightbox */}
                                {isImage && (
                                  <div className="relative group">
                                    <img 
                                      src={fileUrl} 
                                      alt={submission.file_name || 'Uploaded file'}
                                      className="w-full max-h-80 object-contain bg-black cursor-pointer"
                                      onClick={() => setLightboxImage(fileUrl)}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                      <button
                                        onClick={() => setLightboxImage(fileUrl)}
                                        className="p-3 bg-gold-500 text-black rounded-full hover:bg-gold-400 transition-colors"
                                        title="View Full Size"
                                      >
                                        <Maximize2 size={18} />
                                      </button>
                                      <a 
                                        href={fileUrl}
                                        download={submission.file_name}
                                        className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                        title="Download"
                                      >
                                        <Download size={18} />
                                      </a>
                                      <a 
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                        title="Open in New Tab"
                                      >
                                        <ExternalLink size={18} />
                                      </a>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Video Preview with Controls */}
                                {isVideo && (
                                  <div className="relative">
                                    <video 
                                      src={fileUrl}
                                      controls
                                      className="w-full max-h-80 bg-black"
                                    />
                                  </div>
                                )}
                                
                                {/* Non-media file preview */}
                                {!isImage && !isVideo && (
                                  <div className="p-6 flex flex-col items-center justify-center bg-black-950">
                                    <FileText size={48} className="text-gold-400 mb-3" />
                                    <p className="text-gray-300 font-medium">{submission.file_name}</p>
                                  </div>
                                )}
                                
                                {/* File Info Bar */}
                                <div className="flex items-center justify-between p-3 bg-black-900 border-t border-gold-500/10">
                                  <div className="flex items-center gap-2 text-sm text-gray-300">
                                    {isImage && <Image size={16} className="text-blue-400" />}
                                    {isVideo && <Film size={16} className="text-purple-400" />}
                                    {!isImage && !isVideo && <FileText size={16} className="text-gold-400" />}
                                    <span className="truncate max-w-[250px]">{submission.file_name}</span>
                                    <span className="text-gray-500 text-xs">
                                      ({((submission.file_size || 0) / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={fileUrl}
                                      download={submission.file_name}
                                      className="p-2 text-gray-400 hover:text-gold-400 hover:bg-black-800 rounded-lg transition-colors"
                                      title="Download"
                                    >
                                      <Download size={16} />
                                    </a>
                                    <a 
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-gray-400 hover:text-gold-400 hover:bg-black-800 rounded-lg transition-colors"
                                      title="Open in New Tab"
                                    >
                                      <ExternalLink size={16} />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Decision Section */}
                    <div className="pt-2">
                      <label className="block text-sm text-gray-300 mb-3 font-medium">Your Decision</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setReviewForm(prev => ({ ...prev, action: 'approve', feedback: '' }))}
                          className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-medium ${
                            reviewForm.action === 'approve'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-black-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <CheckCircle size={24} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setReviewForm(prev => ({ ...prev, action: 'revision', feedback: '' }))}
                          className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-medium ${
                            reviewForm.action === 'revision'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-black-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <RotateCcw size={24} />
                          <span>Revise</span>
                        </button>
                        <button
                          onClick={() => setReviewForm(prev => ({ ...prev, action: 'reject', feedback: '' }))}
                          className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-medium ${
                            reviewForm.action === 'reject'
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-black-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <XCircle size={24} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Rating (only for approve) */}
                    {reviewForm.action === 'approve' && (
                      <div>
                        <label className="block text-sm text-gray-300 mb-3 font-medium">Rating (optional)</label>
                        <div className="flex gap-2 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: prev.rating === star ? 0 : star }))}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                size={32}
                                className={star <= reviewForm.rating ? 'text-gold-400 fill-gold-400' : 'text-gray-600 hover:text-gray-500'}
                              />
                            </button>
                          ))}
                          {reviewForm.rating > 0 && (
                            <span className="text-gray-400 text-sm ml-2">{reviewForm.rating}/5</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Feedback Templates */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2 font-medium flex items-center gap-2">
                        Quick Feedback
                        <span className="text-xs text-gray-500 font-normal">(click to use)</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {feedbackTemplates[reviewForm.action].map((template, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReviewForm(prev => ({ ...prev, feedback: template }))}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              reviewForm.feedback === template
                                ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                                : 'bg-black-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                            }`}
                          >
                            {template.length > 40 ? template.substring(0, 40) + '...' : template}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2 font-medium">
                        Feedback 
                        {reviewForm.action !== 'approve' && <span className="text-red-400 ml-1">*</span>}
                        {reviewForm.action === 'approve' && <span className="text-gray-500 text-xs ml-2">(optional)</span>}
                      </label>
                      <textarea
                        value={reviewForm.feedback}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
                        placeholder={
                          reviewForm.action === 'approve' 
                            ? 'Great work! Add any additional comments...' 
                            : reviewForm.action === 'revision'
                            ? 'Explain what needs to be revised...'
                            : 'Explain why this submission is being rejected...'
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-amber-500/20 flex gap-3">
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ action: 'approve', feedback: '', rating: 0 });
                    }}
                    className="px-6 py-3 bg-black-800 text-gray-300 rounded-xl hover:bg-black-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || (reviewForm.action !== 'approve' && !reviewForm.feedback.trim())}
                    className={`flex-1 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 ${
                      reviewForm.action === 'approve' 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
                        : reviewForm.action === 'revision'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {reviewForm.action === 'approve' && <CheckCircle size={18} />}
                        {reviewForm.action === 'revision' && <RotateCcw size={18} />}
                        {reviewForm.action === 'reject' && <XCircle size={18} />}
                        {reviewForm.action === 'approve' && 'Approve Task'}
                        {reviewForm.action === 'revision' && 'Request Revision'}
                        {reviewForm.action === 'reject' && 'Reject Task'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox Modal for Full-Size Image */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4"
              onClick={() => setLightboxImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-[90vw] max-h-[90vh]"
              >
                <img 
                  src={lightboxImage} 
                  alt="Full size preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <a
                    href={lightboxImage}
                    download
                    className="p-3 bg-gold-500 text-black rounded-full hover:bg-gold-400 transition-colors"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                  <a
                    href={lightboxImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                    title="Open in New Tab"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-black-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Trash2 className="text-red-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Delete Task</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete "<span className="text-white">{selectedTask.title}</span>"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-black-800 text-gray-300 rounded-xl hover:bg-black-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTask}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorTasks;
