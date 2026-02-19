import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Calendar,
  FileText,
  Send,
  X,
  Upload,
  Image,
  Film,
  File,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import OJTLayout from '../components/layout/OJTLayout';
import api, { uploadFile } from '../services/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'under_review' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'revision' | 'submitted';
  due_date: string;
  assigned_by_name?: string;
  feedback?: string;
  rating?: number;
  created_at: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'other';
}

const OJTTasks = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File type detection helper
  const getFileType = (file: File): 'image' | 'video' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'other';
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      const fileType = getFileType(file);
      const preview = fileType !== 'other' ? URL.createObjectURL(file) : '';
      
      newFiles.push({
        file,
        preview,
        type: fileType
      });
    });
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Clear all files when modal closes
  const handleCloseModal = () => {
    uploadedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setUploadedFiles([]);
    setSubmissionText('');
    setSelectedTask(null);
  };

  const fetchTasks = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/ojt_tasks.php?assigned_to=${user.id}`) as ApiResponse<Task[]>;
      setTasks(response.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  const handleStartTask = async (taskId: number) => {
    try {
      await api.put(`/ojt_tasks.php/${taskId}`, { status: 'in_progress' });
      await fetchTasks();
    } catch (err) {
      console.error('Error starting task:', err);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      // Use FormData for file upload support
      const formData = new FormData();
      formData.append('trainee_id', String(user.id));
      formData.append('submission_text', submissionText);
      formData.append('submission_type', uploadedFiles.length > 0 ? 'file' : 'text');
      
      // Append files if any - use consistent naming: file, file1, file2, etc.
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((uploadedFile, index) => {
          formData.append(`file${index > 0 ? index : ''}`, uploadedFile.file);
        });
      }
      
      // Use direct upload to bypass Vercel proxy (which doesn't handle FormData)
      const response = await uploadFile(`/ojt_tasks.php/${selectedTask.id}/submit`, formData);
      const data = response as { success?: boolean; error?: string };
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit task');
      }
      
      handleCloseModal();
      await fetchTasks();
    } catch (err: unknown) {
      console.error('Error submitting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      case 'under_review':
      case 'submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'revision': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled':
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved': return <CheckCircle size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'under_review':
      case 'submitted': return <FileText size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      case 'revision': return <AlertCircle size={16} />;
      case 'cancelled':
      case 'rejected': return <XCircle size={16} />;
      default: return <XCircle size={16} />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    // Handle 'completed' filter to also include 'approved' status
    if (filter === 'completed') return task.status === 'completed' || task.status === 'approved';
    return task.status === filter;
  });

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !['completed', 'cancelled', 'approved', 'rejected'].includes(filteredTasks.find(t => t.due_date === dueDate)?.status || '');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ojt' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OJTLayout title="My Tasks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
              <CheckSquare size={16} />
              <span>Task Management</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white">
              My Tasks
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              View and complete your assigned training tasks
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-3">
            <div className="bg-black-800 border border-gold-500/20 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-400">Pending</p>
              <p className="text-xl font-bold text-amber-400">
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <div className="bg-black-800 border border-gold-500/20 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-gold-400">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-black-800 border border-gold-500/20 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-xl font-bold text-green-400">
                {tasks.filter(t => t.status === 'completed' || t.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'in_progress', 'under_review', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-gold-500 text-black'
                  : 'bg-black-800 text-gray-400 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gold-500" size={32} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No tasks found</p>
          </div>
        ) : (
          /* Tasks List */
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 hover:border-gold-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-1">{task.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{task.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                        {isOverdue(task.due_date) && (
                          <span className="text-red-400 ml-1">(Overdue)</span>
                        )}
                      </span>
                      {task.assigned_by_name && (
                        <span>Assigned by: {task.assigned_by_name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="px-4 py-2 bg-gold-600 text-black rounded-lg text-sm hover:bg-gold-500 transition-colors font-medium"
                      >
                        Start Task
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Send size={14} />
                        Submit
                      </button>
                    )}
                    {task.status === 'revision' && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                      >
                        View Revision Notes
                      </button>
                    )}
                    {(task.status === 'completed' || task.status === 'approved') && task.feedback && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 bg-black-800 text-gray-300 rounded-lg text-sm hover:bg-black-700 transition-colors"
                      >
                        View Feedback
                      </button>
                    )}
                    {(task.status === 'cancelled' || task.status === 'rejected') && task.feedback && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
                      >
                        View Rejection
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Submit Modal */}
        <AnimatePresence>
          {selectedTask && selectedTask.status === 'in_progress' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black-900 border border-gold-500/30 rounded-xl p-6 max-w-2xl w-full my-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Submit Task</h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-1 hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X className="text-gray-400" size={20} />
                  </button>
                </div>
                
                <p className="text-gray-400 mb-4">{selectedTask.title}</p>
                
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Describe what you accomplished..."
                  rows={4}
                  className="w-full bg-black-800 border border-gold-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 resize-none mb-4"
                />

                {/* File Upload Dropzone */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Attachments (optional)</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-gray-700 hover:border-gold-500/50 bg-black-800'
                    }`}
                  >
                    <Upload className="mx-auto text-gray-500 mb-2" size={32} />
                    <p className="text-gray-400 text-sm">
                      Drag & drop files here, or <span className="text-gold-400">click to browse</span>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Supports images, videos, GIFs, PDFs, and documents (max 50MB each)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* File Previews */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <p className="text-sm text-gray-400">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {uploadedFiles.map((uploadedFile, index) => (
                        <div
                          key={index}
                          className="relative bg-black-800 border border-gray-700 rounded-lg overflow-hidden group"
                        >
                          {/* Image Preview */}
                          {uploadedFile.type === 'image' && (
                            <div className="aspect-video">
                              <img
                                src={uploadedFile.preview}
                                alt={uploadedFile.file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Video Preview - Native HTML5 Player */}
                          {uploadedFile.type === 'video' && (
                            <div className="aspect-video bg-black">
                              <video
                                src={uploadedFile.preview}
                                controls
                                className="w-full h-full object-contain"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}

                          {/* Other File Types */}
                          {uploadedFile.type === 'other' && (
                            <div className="aspect-video flex flex-col items-center justify-center p-4">
                              <File className="text-gray-500 mb-2" size={32} />
                              <p className="text-gray-400 text-xs text-center truncate w-full">
                                {uploadedFile.file.name}
                              </p>
                            </div>
                          )}

                          {/* File Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-300 truncate flex-1 mr-2">
                                {uploadedFile.type === 'image' && <Image size={12} />}
                                {uploadedFile.type === 'video' && <Film size={12} />}
                                {uploadedFile.type === 'other' && <File size={12} />}
                                <span className="truncate">{uploadedFile.file.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {(uploadedFile.file.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-black-800 text-gray-300 rounded-lg hover:bg-black-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTask}
                    disabled={isSubmitting || !submissionText.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    Submit for Review
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        <AnimatePresence>
          {selectedTask && ['completed', 'approved', 'revision', 'rejected', 'cancelled'].includes(selectedTask.status) && (selectedTask.feedback || selectedTask.status === 'revision') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTask(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-black-900 border rounded-xl p-6 max-w-lg w-full ${
                  selectedTask.status === 'revision' 
                    ? 'border-orange-500/30' 
                    : selectedTask.status === 'rejected' || selectedTask.status === 'cancelled'
                    ? 'border-red-500/30'
                    : 'border-green-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${
                    selectedTask.status === 'revision' 
                      ? 'text-orange-400' 
                      : selectedTask.status === 'rejected' || selectedTask.status === 'cancelled'
                      ? 'text-red-400'
                      : 'text-white'
                  }`}>
                    {selectedTask.status === 'revision' 
                      ? '⚠️ Revision Required' 
                      : selectedTask.status === 'rejected' || selectedTask.status === 'cancelled'
                      ? '❌ Task Rejected'
                      : '✅ Task Approved'}
                  </h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1 hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X className="text-gray-400" size={20} />
                  </button>
                </div>
                
                <p className="text-white font-medium mb-2">{selectedTask.title}</p>
                
                {selectedTask.status === 'revision' && (
                  <p className="text-orange-300 text-sm mb-4">Your supervisor has requested changes. Please review the feedback below and resubmit.</p>
                )}
                
                {(selectedTask.status === 'rejected' || selectedTask.status === 'cancelled') && (
                  <p className="text-red-300 text-sm mb-4">This task has been rejected by your supervisor.</p>
                )}
                
                {selectedTask.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-gray-400">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= selectedTask.rating! ? 'text-gold-400' : 'text-gray-600'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedTask.feedback ? (
                  <div className={`rounded-lg p-4 ${
                    selectedTask.status === 'revision' 
                      ? 'bg-orange-500/10 border border-orange-500/20' 
                      : selectedTask.status === 'rejected' || selectedTask.status === 'cancelled'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-black-800'
                  }`}>
                    <p className="text-xs text-gray-500 uppercase mb-2">Supervisor Feedback</p>
                    <p className="text-gray-300">{selectedTask.feedback}</p>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <p className="text-gray-400 italic">No specific feedback provided. Please contact your supervisor for more details.</p>
                  </div>
                )}
                
                {selectedTask.status === 'revision' && (
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      // Find the task and trigger the submit modal
                      const task = tasks.find(t => t.id === selectedTask.id);
                      if (task) {
                        // Set task to in_progress to show submit modal
                        handleStartTask(task.id);
                      }
                    }}
                    className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors font-medium"
                  >
                    Start Revision
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedTask(null)}
                  className="w-full mt-4 px-4 py-2 bg-black-800 text-gray-300 rounded-lg hover:bg-black-700 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OJTLayout>
  );
};

export default OJTTasks;



