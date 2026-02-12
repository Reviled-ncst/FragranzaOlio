import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Crown,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  status: 'active' | 'inactive' | 'vip';
  customer_type: 'retail' | 'wholesale' | 'distributor';
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at: string;
}

interface CustomerStats {
  total: number;
  active: number;
  vip: number;
  inactive: number;
}

const SalesCustomers = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ total: 0, active: 0, vip: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'customers' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await apiFetch(`${API_BASE_URL}/sales.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCustomers(data.data || []);
        setStats(data.stats || { total: 0, active: 0, vip: 0, inactive: 0 });
      } else {
        setError(data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = async () => {
    if (!editForm.id) return;
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      
      if (data.success) {
        fetchCustomers();
        setShowEditModal(false);
        setEditForm({});
      } else {
        alert(data.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Failed to update customer');
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=customer&id=${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer');
    }
  };

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'sales' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-gold-500/20 text-gold-400';
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'inactive': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <Crown size={14} />;
      case 'active': return <UserCheck size={14} />;
      case 'inactive': return <UserX size={14} />;
      default: return <Users size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    return fullName.includes(searchLower) || 
           customer.email.toLowerCase().includes(searchLower) ||
           (customer.phone || '').includes(searchLower);
  });

  return (
    <SalesLayout title="Customers">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-gold-500" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Customers</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Crown className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">VIP</p>
                <p className="text-xl font-bold text-white">{stats.vip}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <UserX className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Inactive</p>
                <p className="text-xl font-bold text-white">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchCustomers} className="ml-auto text-red-400 hover:text-red-300">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : (
          /* Customers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center text-gray-400">
                No customers found
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black-900 border border-gold-500/20 rounded-xl p-5 hover:border-gold-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center">
                        <span className="text-gold-400 font-bold text-lg">
                          {customer.first_name[0]}{customer.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{customer.first_name} {customer.last_name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusIcon(customer.status)}
                          {customer.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
                        className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-gold-400"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => { setEditForm(customer); setShowEditModal(true); }}
                        className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-blue-400"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={14} />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone size={14} />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={14} />
                        <span>{customer.city}, {customer.province}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gold-500/10 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs">Total Orders</p>
                      <p className="text-white font-medium flex items-center gap-1">
                        <ShoppingBag size={14} className="text-gold-400" />
                        {customer.total_orders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Spent</p>
                      <p className="text-white font-medium">₱{parseFloat(String(customer.total_spent || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* View Customer Modal */}
        {showModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gold-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Customer Details</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center">
                    <span className="text-gold-400 font-bold text-2xl">
                      {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedCustomer.first_name} {selectedCustomer.last_name}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                      {getStatusIcon(selectedCustomer.status)}
                      {selectedCustomer.status.toUpperCase()} • {selectedCustomer.customer_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p className="text-white">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm">Address</p>
                    <p className="text-white">
                      {selectedCustomer.address ? `${selectedCustomer.address}, ` : ''}
                      {selectedCustomer.city}, {selectedCustomer.province} {selectedCustomer.zip_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-white font-bold">{selectedCustomer.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-white font-bold">₱{parseFloat(String(selectedCustomer.total_spent || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Last Order</p>
                    <p className="text-white">{formatDate(selectedCustomer.last_order_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Customer Since</p>
                    <p className="text-white">{formatDate(selectedCustomer.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => { setShowModal(false); setEditForm(selectedCustomer); setShowEditModal(true); }}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30"
                  >
                    Edit Customer
                  </button>
                  <button
                    onClick={() => { setShowModal(false); deleteCustomer(selectedCustomer.id); }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gold-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Edit Customer</h3>
                  <button onClick={() => { setShowEditModal(false); setEditForm({}); }} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Status</label>
                    <select
                      value={editForm.status || 'active'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    >
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Customer Type</label>
                    <select
                      value={editForm.customer_type || 'retail'}
                      onChange={(e) => setEditForm({ ...editForm, customer_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="distributor">Distributor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => { setShowEditModal(false); setEditForm({}); }}
                    className="flex-1 px-4 py-2 bg-black-800 border border-gold-500/30 text-gray-400 rounded-lg font-medium hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateCustomer}
                    className="flex-1 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </SalesLayout>
  );
};

export default SalesCustomers;

