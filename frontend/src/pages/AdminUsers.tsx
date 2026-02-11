import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  GraduationCap,
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import adminUsersService, { 
  AdminUser, 
  UserRole, 
  UserStatus, 
  CreateUserData,
  UpdateUserData 
} from '../services/adminUsersService';

// Role configuration
const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: typeof Users }> = {
  admin: { label: 'Administrator', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Shield },
  sales: { label: 'Sales Staff', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Briefcase },
  ojt: { label: 'OJT Trainee', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: GraduationCap },
  ojt_supervisor: { label: 'OJT Supervisor', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: UserCheck },
  customer: { label: 'Customer', color: 'bg-gold-500/20 text-gold-400 border-gold-500/30', icon: Users },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
  inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' },
  suspended: { label: 'Suspended', color: 'bg-red-500/20 text-red-400' },
  pending_verification: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
};

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  department: string;
  position: string;
  supervisorId: string;
  hireDate: string;
  notes: string;
  status: UserStatus;
  // OJT-specific fields
  university: string;
  course: string;
  requiredHours: string;
  renderHours: string;
  ojtStartDate: string;
  ojtEndDate: string;
}

const initialFormData: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'ojt',
  birthDate: '',
  gender: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  zipCode: '',
  department: '',
  position: '',
  supervisorId: '',
  hireDate: new Date().toISOString().split('T')[0],
  notes: '',
  status: 'active',
  // OJT-specific fields
  university: '',
  course: '',
  requiredHours: '500',
  renderHours: '24',
  ojtStartDate: new Date().toISOString().split('T')[0],
  ojtEndDate: '',
};

// Common universities in the Philippines
const UNIVERSITIES = [
  'Polytechnic University of the Philippines (PUP)',
  'University of the Philippines (UP)',
  'De La Salle University (DLSU)',
  'Ateneo de Manila University',
  'University of Santo Tomas (UST)',
  'Far Eastern University (FEU)',
  'Adamson University',
  'Mapúa University',
  'Technological University of the Philippines (TUP)',
  'Pamantasan ng Lungsod ng Maynila (PLM)',
  'National University (NU)',
  'San Beda University',
  'Lyceum of the Philippines University',
  'Centro Escolar University (CEU)',
  'University of the East (UE)',
  'Other',
];

// Common courses
const COURSES = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Information Systems',
  'BS Business Administration',
  'BS Accountancy',
  'BS Marketing Management',
  'BS Hotel and Restaurant Management',
  'BS Tourism Management',
  'BS Office Administration',
  'BS Entrepreneurship',
  'Other',
];

// Pre-fill templates for quick account creation
const PREFILL_TEMPLATES: Record<string, Partial<UserFormData>> = {
  ojt: {
    role: 'ojt',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'ojt@fragranza.com',
    password: 'OJT@12345',
    phone: '09171234567',
    department: 'Operations',
    position: 'OJT Trainee',
    notes: 'Student trainee',
    status: 'active',
    university: 'Polytechnic University of the Philippines (PUP)',
    course: 'BS Information Technology',
    requiredHours: '500',
    renderHours: '24',
  },
  ojt_supervisor: {
    role: 'ojt_supervisor',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'supervisor@fragranza.com',
    password: 'Supervisor@123',
    phone: '09181234567',
    department: 'Operations',
    position: 'OJT Supervisor',
    notes: 'Supervises OJT trainees',
    status: 'active',
  },
  sales: {
    role: 'sales',
    firstName: 'Pedro',
    lastName: 'Garcia',
    email: 'sales@fragranza.com',
    password: 'Sales@12345',
    phone: '09191234567',
    department: 'Sales',
    position: 'Sales Representative',
    notes: 'Sales team member',
    status: 'active',
  },
  admin: {
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'newadmin@fragranza.com',
    password: 'Admin@12345',
    phone: '09201234567',
    department: 'Management',
    position: 'Administrator',
    notes: 'System administrator',
    status: 'active',
  },
};

const AdminUsers = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [supervisors, setSupervisors] = useState<Array<{ id: number; fullName: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check URL params for action
  useEffect(() => {
    const action = searchParams.get('action');
    const role = searchParams.get('role') as UserRole;
    
    if (action === 'add') {
      handleAddUser(role || 'ojt');
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  // Fetch supervisors for dropdown
  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminUsersService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      // Use the public auth endpoint to get supervisors
      const response = await fetch('http://localhost/FragranzaWeb/backend/api/auth.php?action=get-supervisors');
      const result = await response.json();
      if (result.success && result.data) {
        setSupervisors(result.data.map((s: any) => ({ id: s.id, fullName: s.name })));
      }
    } catch (err) {
      console.error('Failed to fetch supervisors');
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleAddUser = (defaultRole: UserRole = 'ojt') => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({ ...initialFormData, role: defaultRole });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      birthDate: user.birthDate || '',
      gender: user.gender || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      province: user.province || '',
      zipCode: user.zipCode || '',
      department: user.department || '',
      position: user.position || '',
      supervisorId: user.supervisorId?.toString() || '',
      hireDate: user.hireDate || '',
      notes: user.notes || '',
      status: user.status,
      // OJT-specific fields
      university: (user as any).university || '',
      course: (user as any).course || '',
      requiredHours: (user as any).requiredHours?.toString() || '500',
      renderHours: (user as any).renderHours?.toString() || '24',
      ojtStartDate: (user as any).ojtStartDate || '',
      ojtEndDate: (user as any).ojtEndDate || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleViewUser = (user: AdminUser) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (modalMode === 'add') {
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const createData: CreateUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          zipCode: formData.zipCode || undefined,
          department: formData.department || undefined,
          position: formData.position || undefined,
          supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : undefined,
          hireDate: formData.hireDate || undefined,
          notes: formData.notes || undefined,
        };
        
        const response = await adminUsersService.createUser(createData);
        if (response.success) {
          setShowModal(false);
          fetchUsers();
        } else {
          setFormErrors({ submit: response.message });
        }
      } else if (modalMode === 'edit' && selectedUser) {
        const updateData: UpdateUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          zipCode: formData.zipCode || undefined,
          department: formData.department || undefined,
          position: formData.position || undefined,
          supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : undefined,
          hireDate: formData.hireDate || undefined,
          notes: formData.notes || undefined,
          status: formData.status,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        const response = await adminUsersService.updateUser(selectedUser.id, updateData);
        if (response.success) {
          setShowModal(false);
          fetchUsers();
        } else {
          setFormErrors({ submit: response.message });
        }
      }
    } catch (err) {
      setFormErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await adminUsersService.deleteUser(userToDelete.id);
      if (response.success) {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Auth checks
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

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-400">
              Manage system users and their access permissions
            </p>
          </div>
          <button
            onClick={() => handleAddUser()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all"
          >
            <UserPlus size={18} />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
            >
              <option value="">All Roles</option>
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | '');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => handleAddUser()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all"
              >
                <UserPlus size={18} />
                Add First User
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black-800 border-b border-gold-500/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-500/10">
                    {users.map((u) => {
                      const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.customer;
                      const statusConfig = STATUS_CONFIG[u.status] || STATUS_CONFIG.inactive;
                      const RoleIcon = roleConfig.icon;
                      
                      return (
                        <tr key={u.id} className="hover:bg-black-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-500 font-medium">
                                {u.firstName[0]}{u.lastName[0]}
                              </div>
                              <div>
                                <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                                <p className="text-sm text-gray-400">{u.email}</p>
                                {u.employeeId && (
                                  <p className="text-xs text-gold-500">{u.employeeId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                              <RoleIcon size={12} />
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-white">{u.department || '-'}</p>
                            <p className="text-sm text-gray-400">{u.position || ''}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400">
                            {u.lastLogin 
                              ? new Date(u.lastLogin).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewUser(u)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-black-700 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditUser(u)}
                                className="p-2 text-gray-400 hover:text-gold-500 hover:bg-black-700 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-black-700 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gold-500/10">
                {users.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.customer;
                  const statusConfig = STATUS_CONFIG[u.status] || STATUS_CONFIG.inactive;
                  const RoleIcon = roleConfig.icon;
                  
                  return (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-500 font-medium">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-gray-400">{u.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${roleConfig.color}`}>
                          <RoleIcon size={10} />
                          {roleConfig.label}
                        </span>
                        {u.employeeId && (
                          <span className="text-xs text-gold-500">{u.employeeId}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUser(u)}
                          className="flex-1 py-2 text-sm text-gray-400 bg-black-800 rounded-lg hover:text-white transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditUser(u)}
                          className="flex-1 py-2 text-sm text-gold-500 bg-black-800 rounded-lg hover:bg-gold-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(u);
                            setShowDeleteConfirm(true);
                          }}
                          className="py-2 px-3 text-sm text-red-400 bg-black-800 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gold-500/20">
                  <p className="text-sm text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-white">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20">
                <h2 className="text-xl font-display font-semibold text-white">
                  {modalMode === 'add' && 'Add New User'}
                  {modalMode === 'edit' && 'Edit User'}
                  {modalMode === 'view' && 'User Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {modalMode === 'view' && selectedUser ? (
                  // View Mode
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-500 text-xl font-bold">
                        {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <p className="text-gray-400">{selectedUser.email}</p>
                        {selectedUser.employeeId && (
                          <p className="text-sm text-gold-500">{selectedUser.employeeId}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Role</p>
                        <p className="text-white">{ROLE_CONFIG[selectedUser.role]?.label}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <p className="text-white capitalize">{selectedUser.status.replace('_', ' ')}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Department</p>
                        <p className="text-white">{selectedUser.department || '-'}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Position</p>
                        <p className="text-white">{selectedUser.position || '-'}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Phone</p>
                        <p className="text-white">{selectedUser.phone || '-'}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Hire Date</p>
                        <p className="text-white">{selectedUser.hireDate || '-'}</p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Last Login</p>
                        <p className="text-white">
                          {selectedUser.lastLogin 
                            ? new Date(selectedUser.lastLogin).toLocaleString() 
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Login Count</p>
                        <p className="text-white">{selectedUser.loginCount}</p>
                      </div>
                    </div>
                    
                    {selectedUser.supervisorName && (
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Supervisor</p>
                        <p className="text-white">{selectedUser.supervisorName}</p>
                      </div>
                    )}
                    
                    {selectedUser.notes && (
                      <div className="p-4 bg-black-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-white whitespace-pre-wrap">{selectedUser.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Add/Edit Form
                  <div className="space-y-6">
                    {formErrors.submit && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {formErrors.submit}
                      </div>
                    )}

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(ROLE_CONFIG).filter(([key]) => key !== 'customer').map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, role: key as UserRole }))}
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                formData.role === key
                                  ? `${config.color} border-current`
                                  : 'border-gold-500/20 text-gray-400 hover:border-gold-500/40'
                              }`}
                            >
                              <Icon size={18} />
                              <span className="text-sm">{config.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Pre-fill Templates (only show in Add mode) */}
                    {modalMode === 'add' && (
                      <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gold-400">
                            ⚡ Quick Fill Template
                          </p>
                          <p className="text-xs text-gray-500">Click to auto-fill form</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              ...PREFILL_TEMPLATES.ojt,
                              hireDate: new Date().toISOString().split('T')[0]
                            }))}
                            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/30 transition-all"
                          >
                            <GraduationCap className="inline-block w-3 h-3 mr-1" />
                            OJT Trainee
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              ...PREFILL_TEMPLATES.ojt_supervisor,
                              hireDate: new Date().toISOString().split('T')[0]
                            }))}
                            className="px-3 py-1.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md hover:bg-purple-500/30 transition-all"
                          >
                            <UserCheck className="inline-block w-3 h-3 mr-1" />
                            OJT Supervisor
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              ...PREFILL_TEMPLATES.sales,
                              hireDate: new Date().toISOString().split('T')[0]
                            }))}
                            className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 transition-all"
                          >
                            <Briefcase className="inline-block w-3 h-3 mr-1" />
                            Sales Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              ...PREFILL_TEMPLATES.admin,
                              hireDate: new Date().toISOString().split('T')[0]
                            }))}
                            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/30 transition-all"
                          >
                            <Shield className="inline-block w-3 h-3 mr-1" />
                            Administrator
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ 
                              ...initialFormData,
                              hireDate: new Date().toISOString().split('T')[0]
                            })}
                            className="px-3 py-1.5 text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-md hover:bg-gray-500/30 transition-all"
                          >
                            <RefreshCw className="inline-block w-3 h-3 mr-1" />
                            Clear Form
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className={`w-full px-4 py-2.5 bg-black-800 border rounded-lg text-white focus:outline-none focus:border-gold-500 ${
                            formErrors.firstName ? 'border-red-500' : 'border-gold-500/20'
                          }`}
                        />
                        {formErrors.firstName && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className={`w-full px-4 py-2.5 bg-black-800 border rounded-lg text-white focus:outline-none focus:border-gold-500 ${
                            formErrors.lastName ? 'border-red-500' : 'border-gold-500/20'
                          }`}
                        />
                        {formErrors.lastName && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Email & Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full px-4 py-2.5 bg-black-800 border rounded-lg text-white focus:outline-none focus:border-gold-500 ${
                            formErrors.email ? 'border-red-500' : 'border-gold-500/20'
                          }`}
                        />
                        {formErrors.email && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Password {modalMode === 'add' && <span className="text-red-400">*</span>}
                          {modalMode === 'edit' && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className={`w-full px-4 py-2.5 bg-black-800 border rounded-lg text-white focus:outline-none focus:border-gold-500 ${
                            formErrors.password ? 'border-red-500' : 'border-gold-500/20'
                          }`}
                          placeholder={modalMode === 'edit' ? '••••••••' : ''}
                        />
                        {formErrors.password && (
                          <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>
                        )}
                      </div>
                    </div>

                    {/* Department & Position */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          placeholder="e.g., Sales, Marketing, IT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          placeholder="e.g., Manager, Supervisor, Trainee"
                        />
                      </div>
                    </div>

                    {/* Supervisor (for OJT) */}
                    {(formData.role === 'ojt' || formData.role === 'sales') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Supervisor {formData.role === 'ojt' && <span className="text-red-400">*</span>}
                        </label>
                        <select
                          value={formData.supervisorId}
                          onChange={(e) => setFormData(prev => ({ ...prev, supervisorId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        >
                          <option value="">Select Supervisor</option>
                          {supervisors.map((s) => (
                            <option key={s.id} value={s.id}>{s.fullName}</option>
                          ))}
                        </select>
                        {supervisors.length === 0 && (
                          <p className="text-yellow-400 text-xs mt-1">No supervisors found. Create an OJT Supervisor account first.</p>
                        )}
                      </div>
                    )}

                    {/* OJT-Specific Fields */}
                    {formData.role === 'ojt' && (
                      <div className="space-y-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                          <GraduationCap size={16} />
                          OJT Information
                        </h3>
                        
                        {/* University */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            University / School <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.university}
                            onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          >
                            <option value="">Select University</option>
                            {UNIVERSITIES.map((uni) => (
                              <option key={uni} value={uni}>{uni}</option>
                            ))}
                          </select>
                        </div>

                        {/* Course */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Course / Program <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.course}
                            onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          >
                            <option value="">Select Course</option>
                            {COURSES.map((course) => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        </div>

                        {/* Hours */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Required Hours <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.requiredHours}
                              onChange={(e) => setFormData(prev => ({ ...prev, requiredHours: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                              placeholder="e.g., 500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Render Period (hours)
                            </label>
                            <input
                              type="number"
                              value={formData.renderHours}
                              onChange={(e) => setFormData(prev => ({ ...prev, renderHours: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                              placeholder="e.g., 24 (3 days)"
                              min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default: 24 hours (3 days)</p>
                          </div>
                        </div>

                        {/* OJT Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              OJT Start Date
                            </label>
                            <input
                              type="date"
                              value={formData.ojtStartDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, ojtStartDate: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Expected End Date
                            </label>
                            <input
                              type="date"
                              value={formData.ojtEndDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, ojtEndDate: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          placeholder="09XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Hire Date</label>
                        <input
                          type="date"
                          value={formData.hireDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>

                    {/* Status (Edit mode only) */}
                    {modalMode === 'edit' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                          className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                        placeholder="Additional notes about this user..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {modalMode !== 'view' && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gold-500/20 bg-black-800">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {modalMode === 'view' && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gold-500/20 bg-black-800">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (selectedUser) handleEditUser(selectedUser);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 transition-all"
                  >
                    <Edit size={16} />
                    Edit User
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete User</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{userToDelete.firstName} {userToDelete.lastName}</span>? 
                Their account will be deactivated.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminUsers;
