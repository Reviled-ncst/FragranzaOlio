import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, apiFetch } from '../services/api';
import { 
  GraduationCap, 
  Users, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserPlus,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';

interface OJTTrainee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  university: string;
  course: string;
  supervisorId: number;
  supervisorName: string;
  requiredHours: number;
  hoursCompleted: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface OJTSupervisor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  traineeCount: number;
}

interface OJTStats {
  totalTrainees: number;
  activeTrainees: number;
  completedTrainees: number;
  totalSupervisors: number;
  avgCompletionRate: number;
  totalHoursRendered: number;
}

export default function AdminOJT() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'trainees' | 'supervisors' | 'attendance'>('overview');
  const [trainees, setTrainees] = useState<OJTTrainee[]>([]);
  const [supervisors, setSupervisors] = useState<OJTSupervisor[]>([]);
  const [stats, setStats] = useState<OJTStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch trainees - only active ones
      const traineesRes = await apiFetch(`${API_BASE_URL}/admin_users.php?role=ojt&status=active`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const traineesData = await traineesRes.json();
      
      if (traineesData.success && traineesData.data?.users) {
        const mappedTrainees = traineesData.data.users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          department: u.department || 'N/A',
          university: u.university || 'N/A',
          course: u.course || 'N/A',
          supervisorId: u.supervisorId,
          supervisorName: u.supervisorName || 'Unassigned',
          requiredHours: u.requiredHours || 500,
          hoursCompleted: u.hoursCompleted || 0,
          startDate: u.ojtStartDate || u.hireDate,
          endDate: u.ojtEndDate,
          status: u.status
        }));
        setTrainees(mappedTrainees);
      }

      // Fetch supervisors
      const supervisorsRes = await apiFetch(`${API_BASE_URL}/admin_users.php?role=ojt_supervisor`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const supervisorsData = await supervisorsRes.json();
      
      if (supervisorsData.success && supervisorsData.data?.users) {
        const mappedSupervisors = supervisorsData.data.users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          department: u.department || 'N/A',
          traineeCount: 0
        }));
        setSupervisors(mappedSupervisors);
      }

      // Calculate stats
      if (traineesData.success && traineesData.data?.users) {
        const allTrainees = traineesData.data.users;
        const active = allTrainees.filter((t: any) => t.status === 'active').length;
        const totalHours = allTrainees.reduce((sum: number, t: any) => sum + (Number(t.hoursCompleted) || 0), 0);
        const avgCompletion = allTrainees.length > 0 
          ? allTrainees.reduce((sum: number, t: any) => {
              const required = t.requiredHours || 500;
              const completed = t.hoursCompleted || 0;
              return sum + (completed / required * 100);
            }, 0) / allTrainees.length
          : 0;

        setStats({
          totalTrainees: allTrainees.length,
          activeTrainees: active,
          completedTrainees: allTrainees.filter((t: any) => (t.hoursCompleted || 0) >= (t.requiredHours || 500)).length,
          totalSupervisors: supervisorsData.data?.users?.length || 0,
          avgCompletionRate: Math.round(avgCompletion),
          totalHoursRendered: Math.round(totalHours)
        });
      }
    } catch (error) {
      console.error('Error fetching OJT data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user, fetchData]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = !searchTerm || 
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDepartment || t.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(trainees.map(t => t.department).filter(d => d && d !== 'N/A'))];

  return (
    <AdminLayout title="OJT Management">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="text-gold-400" />
              OJT Management
            </h1>
            <p className="text-gray-400 mt-1">Manage trainees, supervisors, and attendance</p>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'trainees', label: 'Trainees', icon: Users },
            { id: 'supervisors', label: 'Supervisors', icon: Award },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="text-blue-400" size={24} />
                      <span className="text-xs text-gray-500">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalTrainees}</p>
                    <p className="text-sm text-gray-400 mt-1">OJT Trainees</p>
                  </div>

                  <div className="bg-black-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="text-green-400" size={24} />
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.activeTrainees}</p>
                    <p className="text-sm text-gray-400 mt-1">Currently Active</p>
                  </div>

                  <div className="bg-black-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Clock className="text-gold-400" size={24} />
                      <span className="text-xs text-gray-500">Hours</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalHoursRendered.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Hours Rendered</p>
                  </div>

                  <div className="bg-black-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="text-purple-400" size={24} />
                      <span className="text-xs text-gray-500">Avg</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.avgCompletionRate}%</p>
                    <p className="text-sm text-gray-400 mt-1">Avg Completion Rate</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 bg-black-800 rounded-lg hover:bg-black-700 transition-colors text-left">
                      <UserPlus className="text-blue-400" size={24} />
                      <div>
                        <p className="text-white font-medium">Add Trainee</p>
                        <p className="text-sm text-gray-400">Register new OJT</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-black-800 rounded-lg hover:bg-black-700 transition-colors text-left">
                      <FileText className="text-green-400" size={24} />
                      <div>
                        <p className="text-white font-medium">Generate Reports</p>
                        <p className="text-sm text-gray-400">Export attendance data</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-black-800 rounded-lg hover:bg-black-700 transition-colors text-left">
                      <Award className="text-gold-400" size={24} />
                      <div>
                        <p className="text-white font-medium">Assign Supervisor</p>
                        <p className="text-sm text-gray-400">Manage assignments</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent OJT Activity</h3>
                  <div className="space-y-3">
                    {trainees.slice(0, 5).map(trainee => (
                      <div key={trainee.id} className="flex items-center justify-between p-3 bg-black-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {trainee.firstName[0]}{trainee.lastName[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{trainee.firstName} {trainee.lastName}</p>
                            <p className="text-sm text-gray-400">{trainee.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
                                style={{ width: `${Math.min(100, (trainee.hoursCompleted / trainee.requiredHours) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-400">
                              {Math.round((trainee.hoursCompleted / trainee.requiredHours) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {trainee.hoursCompleted} / {trainee.requiredHours} hrs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trainees Tab */}
            {activeTab === 'trainees' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search trainees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-2 bg-black-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Trainees Table */}
                <div className="bg-black-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Trainee</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Supervisor</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Progress</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredTrainees.map(trainee => (
                          <tr key={trainee.id} className="hover:bg-black-800/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {trainee.firstName[0]}{trainee.lastName[0]}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{trainee.firstName} {trainee.lastName}</p>
                                  <p className="text-sm text-gray-400">{trainee.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-300">{trainee.department}</p>
                              <p className="text-sm text-gray-500">{trainee.university}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-300">{trainee.supervisorName}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
                                    style={{ width: `${Math.min(100, (trainee.hoursCompleted / trainee.requiredHours) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-400">
                                  {Math.round((trainee.hoursCompleted / trainee.requiredHours) * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {trainee.hoursCompleted} / {trainee.requiredHours} hrs
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                trainee.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {trainee.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-black-700 rounded-lg transition-colors">
                                  <Eye size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredTrainees.length === 0 && (
                    <div className="text-center py-10">
                      <AlertCircle className="mx-auto text-gray-500 mb-3" size={40} />
                      <p className="text-gray-400">No trainees found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Supervisors Tab */}
            {activeTab === 'supervisors' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supervisors.map(supervisor => (
                  <div key={supervisor.id} className="bg-black-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {supervisor.firstName[0]}{supervisor.lastName[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{supervisor.firstName} {supervisor.lastName}</p>
                        <p className="text-sm text-gray-400">{supervisor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Department</span>
                      <span className="text-gray-300">{supervisor.department}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-400">Trainees Assigned</span>
                      <span className="text-gold-400 font-medium">
                        {trainees.filter(t => t.supervisorId === supervisor.id).length}
                      </span>
                    </div>
                  </div>
                ))}
                {supervisors.length === 0 && (
                  <div className="col-span-full text-center py-10">
                    <AlertCircle className="mx-auto text-gray-500 mb-3" size={40} />
                    <p className="text-gray-400">No supervisors found</p>
                  </div>
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="bg-black-900 border border-gray-800 rounded-xl p-6">
                <div className="text-center py-10">
                  <Calendar className="mx-auto text-gray-500 mb-3" size={48} />
                  <h3 className="text-lg font-semibold text-white mb-2">Attendance Overview</h3>
                  <p className="text-gray-400 mb-4">View and manage OJT attendance records</p>
                  <p className="text-sm text-gray-500">Coming soon - Detailed attendance reports and analytics</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}



