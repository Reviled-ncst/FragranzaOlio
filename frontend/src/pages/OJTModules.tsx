import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Play,
  CheckCircle,
  Clock,
  Lock,
  ChevronRight,
  Award,
  Video,
  FileText,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import OJTLayout from '../components/layout/OJTLayout';
import { API_BASE_URL, apiFetch } from '../services/api';

interface Module {
  id: number;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'practical';
  status: 'completed' | 'in_progress' | 'not_started' | 'available' | 'locked';
  progress: number;
  score: number | null;
  category: string;
  is_required: boolean;
}

interface ModuleSummary {
  total_modules: number;
  completed_modules: number;
  overall_progress: number;
  average_score: number | null;
}

const OJTModules = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [summary, setSummary] = useState<ModuleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await apiFetch(`${API_BASE_URL}/ojt_modules.php?trainee_id=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          // Transform API data to match our interface
          interface ApiModule {
            id: number;
            title: string;
            description?: string;
            duration_hours: string;
            content_type?: string;
            progress_status?: string;
            progress_percent?: number;
            score?: number | null;
            category: string;
            is_required: string | boolean;
          }
          const transformedModules: Module[] = (data.modules as ApiModule[]).map((m, index: number) => {
            // Determine status based on progress and previous module completion
            let status: Module['status'] = (m.progress_status || 'not_started') as Module['status'];
            
            // Convert 'not_started' to 'available' or 'locked' based on sequence
            if (status === 'not_started') {
              // First module is always available, others depend on previous completion
              const previousCompleted = index === 0 || 
                (data.modules as ApiModule[]).slice(0, index).every((prev) => prev.progress_status === 'completed' || !prev.is_required);
              status = previousCompleted ? 'available' : 'locked';
            }
            
            return {
              id: m.id,
              title: m.title,
              description: m.description || 'No description available',
              duration: `${m.duration_hours} ${parseFloat(m.duration_hours) === 1 ? 'hour' : 'hours'}`,
              type: (m.content_type || 'reading') as Module['type'],
              status: status,
              progress: m.progress_percent || 0,
              score: m.score ?? null,
              category: m.category,
              is_required: m.is_required === '1' || m.is_required === true
            };
          });
          
          setModules(transformedModules);
          setSummary(data.summary);
        } else {
          setError(data.error || 'Failed to load modules');
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [user?.id]);

  const handleStartModule = async (moduleId: number) => {
    if (!user?.id) return;
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/ojt_modules.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_progress',
          trainee_id: user.id,
          module_id: moduleId,
          status: 'in_progress',
          progress_percent: 10
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update local state
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, status: 'in_progress' as const, progress: 10 } : m
        ));
      }
    } catch (err) {
      console.error('Error starting module:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'reading': return <FileText size={16} />;
      case 'quiz': return <Award size={16} />;
      case 'practical': return <CheckCircle size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      case 'available': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'locked': 
      case 'not_started': 
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'available': return <Play size={16} />;
      case 'locked': 
      case 'not_started':
      default: return <Lock size={16} />;
    }
  };

  const completedModules = summary?.completed_modules || modules.filter(m => m.status === 'completed').length;
  const totalModules = summary?.total_modules || modules.length;
  const overallProgress = summary?.overall_progress || (totalModules > 0 ? (completedModules / totalModules) * 100 : 0);

  if (authLoading || isLoading) {
    return (
      <OJTLayout title="Learning Modules">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
        </div>
      </OJTLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ojt' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OJTLayout title="Learning Modules">
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-300 font-medium">Error loading modules</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
            <BookOpen size={16} />
            <span>Learning Center</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Learning Modules
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete training modules to enhance your skills
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Progress</h2>
              <p className="text-gray-400 text-sm">{completedModules} of {totalModules} modules completed</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-gold-400">{overallProgress.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Overall</p>
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-black-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-gold-500 to-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-black-900 border rounded-xl p-4 transition-all ${
                module.status === 'locked' 
                  ? 'border-gray-700 opacity-60' 
                  : 'border-gold-500/20 hover:border-gold-500/40 cursor-pointer'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Module Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  module.status === 'completed' ? 'bg-green-500/20' :
                  module.status === 'in_progress' ? 'bg-gold-500/20' :
                  module.status === 'available' ? 'bg-amber-500/20' : 'bg-gray-500/20'
                }`}>
                  {module.status === 'completed' ? (
                    <CheckCircle className="text-green-400" size={24} />
                  ) : module.status === 'locked' ? (
                    <Lock className="text-gray-500" size={24} />
                  ) : (
                    <span className={`${
                      module.status === 'in_progress' ? 'text-gold-400' : 'text-amber-400'
                    }`}>
                      {getTypeIcon(module.type)}
                    </span>
                  )}
                </div>

                {/* Module Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{module.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getStatusColor(module.status)}`}>
                      {getStatusIcon(module.status)}
                      {module.status === 'in_progress' ? 'In Progress' : module.status.charAt(0).toUpperCase() + module.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{module.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {getTypeIcon(module.type)}
                      {module.type.charAt(0).toUpperCase() + module.type.slice(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {module.duration}
                    </span>
                    {module.is_required && (
                      <span className="text-amber-400">Required</span>
                    )}
                    {module.score !== null && (
                      <span className="text-green-400">Score: {module.score}%</span>
                    )}
                  </div>
                  
                  {/* Progress Bar for In Progress */}
                  {module.status === 'in_progress' && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-black-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${module.progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full bg-gold-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="sm:ml-4">
                  {module.status === 'completed' ? (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                      <CheckCircle size={16} />
                      Review
                    </button>
                  ) : module.status === 'in_progress' ? (
                    <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-black rounded-lg text-sm hover:bg-gold-500 transition-colors font-medium">
                      <Play size={16} />
                      Continue
                    </button>
                  ) : module.status === 'available' ? (
                    <button 
                      onClick={() => handleStartModule(module.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-black rounded-lg text-sm hover:bg-amber-500 transition-colors font-medium"
                    >
                      <Play size={16} />
                      Start
                    </button>
                  ) : (
                    <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-500 rounded-lg text-sm cursor-not-allowed">
                      <Lock size={16} />
                      Locked
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 flex items-start gap-3">
          <BookOpen className="text-gold-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-gold-300 font-medium">Complete modules in order</p>
            <p className="text-gold-400/70 text-sm mt-1">
              Some modules require completing previous ones before they become available. 
              Finish all modules to earn your OJT completion certificate.
            </p>
          </div>
        </div>
      </div>
    </OJTLayout>
  );
};

export default OJTModules;



