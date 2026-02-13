import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Clock, CheckCircle, Target, Award, Medal, Crown, Zap, TrendingUp } from 'lucide-react';
import OJTLayout from '../components/layout/OJTLayout';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, apiFetch } from '../services/api';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  category: 'attendance' | 'tasks' | 'milestones' | 'special';
  requirement_type: string;
  requirement_value: number;
  points: number;
  is_earned?: boolean;
  earned_at?: string;
  current_progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface Stats {
  total_days: number;
  on_time_days: number;
  total_hours: number;
  total_tasks: number;
  approved_tasks: number;
  perfect_tasks: number;
  first_try_tasks: number;
  program_progress: number;
}

const categoryConfig = {
  attendance: { icon: Clock, label: 'Attendance', color: 'from-blue-500 to-blue-600' },
  tasks: { icon: CheckCircle, label: 'Tasks', color: 'from-green-500 to-green-600' },
  milestones: { icon: Target, label: 'Milestones', color: 'from-purple-500 to-purple-600' },
  special: { icon: Zap, label: 'Special', color: 'from-amber-500 to-amber-600' },
};

const badgeColors: Record<string, string> = {
  gold: 'from-yellow-400 to-yellow-600 border-yellow-500',
  blue: 'from-blue-400 to-blue-600 border-blue-500',
  green: 'from-green-400 to-green-600 border-green-500',
  purple: 'from-purple-400 to-purple-600 border-purple-500',
  orange: 'from-orange-400 to-orange-600 border-orange-500',
  teal: 'from-teal-400 to-teal-600 border-teal-500',
  emerald: 'from-emerald-400 to-emerald-600 border-emerald-500',
  amber: 'from-amber-400 to-amber-600 border-amber-500',
  pink: 'from-pink-400 to-pink-600 border-pink-500',
  red: 'from-red-400 to-red-600 border-red-500',
  yellow: 'from-yellow-400 to-yellow-600 border-yellow-500',
};

export default function OJTAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchAchievements();
    }
  }, [user?.id]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${API_BASE_URL}/ojt_achievements.php/progress?user_id=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAchievements(data.data.achievements || []);
        setStats(data.data.stats || null);
        
        // Calculate totals
        const earned = data.data.achievements.filter((a: Achievement) => a.is_earned);
        setEarnedCount(earned.length);
        setTotalPoints(earned.reduce((sum: number, a: Achievement) => sum + a.points, 0));
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const earnedAchievements = filteredAchievements.filter(a => a.is_earned);
  const lockedAchievements = filteredAchievements.filter(a => !a.is_earned);

  return (
    <OJTLayout title="Achievements">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 rounded-2xl p-6 text-black">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center">
                <Trophy size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Achievements</h1>
                <p className="text-gold-900/80">Track your progress and unlock badges</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{earnedCount}</div>
                <div className="text-sm text-gold-900/80">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{achievements.length}</div>
                <div className="text-sm text-gold-900/80">Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <Star size={20} className="text-gold-900" />
                  {totalPoints}
                </div>
                <div className="text-sm text-gold-900/80">Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gold-500 text-black'
                : 'bg-black-800 text-gray-400 hover:bg-black-700'
            }`}
          >
            All
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === key
                  ? 'bg-gold-500 text-black'
                  : 'bg-black-800 text-gray-400 hover:bg-black-700'
              }`}
            >
              <config.icon size={16} />
              {config.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Earned Achievements */}
            {earnedAchievements.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="text-gold-400" size={20} />
                  Unlocked Achievements ({earnedAchievements.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {earnedAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative overflow-hidden"
                    >
                      <div className={`bg-gradient-to-br ${badgeColors[achievement.badge_color] || badgeColors.gold} p-[2px] rounded-xl`}>
                        <div className="bg-black-900 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${badgeColors[achievement.badge_color] || badgeColors.gold} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                              {achievement.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold truncate">{achievement.name}</h3>
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{achievement.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                            <span className="text-gold-400 text-sm font-medium flex items-center gap-1">
                              <Star size={14} /> +{achievement.points} pts
                            </span>
                            {achievement.earned_at && (
                              <span className="text-gray-500 text-xs">
                                {new Date(achievement.earned_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shine_3s_infinite]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
                  <Target className="text-gray-500" size={20} />
                  In Progress ({lockedAchievements.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {lockedAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-black-900 border border-gray-800 rounded-xl p-4 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl grayscale opacity-50">
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-300 font-semibold truncate">{achievement.name}</h3>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{achievement.description}</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {achievement.current_progress && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{achievement.current_progress.current} / {achievement.current_progress.target}</span>
                            <span>{achievement.current_progress.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${achievement.current_progress.percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                        <span className="text-gray-500 text-sm flex items-center gap-1">
                          <Star size={14} /> {achievement.points} pts
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">
                          {achievement.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Summary */}
            {stats && (
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-gold-400" size={20} />
                  Your Progress Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black-800 rounded-xl p-4 text-center">
                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.total_hours.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">Total Hours</div>
                  </div>
                  <div className="bg-black-800 rounded-xl p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.approved_tasks}</div>
                    <div className="text-xs text-gray-400">Tasks Completed</div>
                  </div>
                  <div className="bg-black-800 rounded-xl p-4 text-center">
                    <Medal className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.on_time_days}</div>
                    <div className="text-xs text-gray-400">On-Time Days</div>
                  </div>
                  <div className="bg-black-800 rounded-xl p-4 text-center">
                    <Crown className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.program_progress}%</div>
                    <div className="text-xs text-gray-400">Program Progress</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </OJTLayout>
  );
}
