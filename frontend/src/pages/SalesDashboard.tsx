import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Search,
  Eye,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

interface DashboardStats {
  totalSales: number;
  monthlyTarget: number;
  ordersToday: number;
  newCustomers: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface RecentOrder {
  id: string | number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface TopCustomer {
  id: string | number;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

const SalesDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    monthlyTarget: 1500000,
    ordersToday: 0,
    newCustomers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, dateRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard stats
      const dashboardRes = await apiFetch(`${API_BASE_URL}/sales.php?action=dashboard&period=${dateRange}`);
      const dashboardData = await dashboardRes.json();
      
      if (dashboardData.success) {
        setStats({
          totalSales: parseFloat(dashboardData.data.total_sales) || 0,
          monthlyTarget: parseFloat(dashboardData.data.monthly_target) || 1500000,
          ordersToday: parseInt(dashboardData.data.orders_today) || 0,
          newCustomers: parseInt(dashboardData.data.new_customers) || 0,
          conversionRate: parseFloat(dashboardData.data.conversion_rate) || 0,
          averageOrderValue: parseFloat(dashboardData.data.average_order_value) || 0,
        });
        
        if (dashboardData.data.recent_orders) {
          setRecentOrders(dashboardData.data.recent_orders);
        }
        
        if (dashboardData.data.top_customers) {
          setTopCustomers(dashboardData.data.top_customers);
        }
      }
      
      // Fallback to fetch orders and customers separately if not included
      if (!dashboardData.data?.recent_orders) {
        const ordersRes = await apiFetch(`${API_BASE_URL}/sales.php?action=orders&limit=5`);
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setRecentOrders(ordersData.data.slice(0, 5));
        }
      }
      
      if (!dashboardData.data?.top_customers) {
        const customersRes = await apiFetch(`${API_BASE_URL}/sales.php?action=customers&limit=4`);
        const customersData = await customersRes.json();
        if (customersData.success) {
          setTopCustomers(customersData.data.slice(0, 4));
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (user.role !== 'sales' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'processing': case 'shipped': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const progressPercentage = stats.monthlyTarget > 0 ? (stats.totalSales / stats.monthlyTarget) * 100 : 0;

  const filteredOrders = recentOrders.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = topCustomers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SalesLayout title="Sales Dashboard">
      <div className="space-y-6">
        {/* Quick Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-400">
              Welcome back, {user.firstName}! Here's your sales performance overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-black-800 border border-gold-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-400 hover:text-gold-400"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchDashboardData} className="ml-auto text-red-400 hover:text-red-300">
              Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-black'
                  : 'bg-black-800 text-gray-400 hover:bg-black-700 hover:text-white'
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                  {/* Total Sales */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-gold-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      </div>
                      <span className="flex items-center gap-0.5 sm:gap-1 text-green-400 text-xs sm:text-sm">
                        <ArrowUpRight size={12} className="sm:w-4 sm:h-4" />
                        12%
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Total Sales</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">₱{stats.totalSales.toLocaleString()}</p>
                  </div>

                  {/* Orders Today */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      </div>
                      <span className="flex items-center gap-0.5 sm:gap-1 text-green-400 text-xs sm:text-sm">
                        <ArrowUpRight size={12} className="sm:w-4 sm:h-4" />
                        8%
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Orders Today</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">{stats.ordersToday}</p>
                  </div>

                  {/* New Customers */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Users className="text-green-400 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      </div>
                      <span className="flex items-center gap-0.5 sm:gap-1 text-green-400 text-xs sm:text-sm">
                        <ArrowUpRight size={12} className="sm:w-4 sm:h-4" />
                        15%
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">New Customers</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">{stats.newCustomers}</p>
                  </div>

                  {/* Average Order Value */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      </div>
                      <span className="flex items-center gap-0.5 sm:gap-1 text-red-400 text-xs sm:text-sm">
                        <ArrowDownRight size={12} className="sm:w-4 sm:h-4" />
                        2%
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Avg Order Value</p>
                    <p className="text-base sm:text-lg lg:text-2xl font-bold text-white">₱{stats.averageOrderValue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Monthly Target Progress */}
                <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Monthly Target</h3>
                    <span className="text-gold-500 font-medium text-sm sm:text-base">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 sm:h-4 bg-black-700 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">₱{stats.totalSales.toLocaleString()}</span>
                    <span className="text-gray-400">Target: ₱{stats.monthlyTarget.toLocaleString()}</span>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {/* Recent Orders */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-white">Recent Orders</h3>
                      <Link to="/sales/orders" className="text-gold-500 text-xs sm:text-sm hover:text-gold-400">View All</Link>
                    </div>
                    {recentOrders.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <ShoppingBag className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-4">
                        {recentOrders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-black-800 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-xs sm:text-sm truncate">{order.order_number}</p>
                              <p className="text-xs sm:text-sm text-gray-400 truncate">{order.customer_name}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-white font-medium text-xs sm:text-sm">₱{parseFloat(String(order.total_amount)).toLocaleString()}</p>
                              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Customers */}
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-white">Top Customers</h3>
                      <Link to="/sales/customers" className="text-gold-500 text-xs sm:text-sm hover:text-gold-400">View All</Link>
                    </div>
                    {topCustomers.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <Users className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No customers yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-4">
                        {topCustomers.slice(0, 4).map((customer, index) => (
                          <div key={customer.id} className="flex items-center justify-between p-2 sm:p-3 bg-black-800 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-500 font-bold text-xs sm:text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-xs sm:text-sm truncate">{customer.name}</p>
                                <p className="text-xs sm:text-sm text-gray-400">{customer.total_orders} orders</p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-white font-medium text-xs sm:text-sm">₱{parseFloat(String(customer.total_spent)).toLocaleString()}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400">
                                {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('en-PH') : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-white">All Orders</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Search orders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <Link to="/sales/orders" className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400">
                        <Eye size={18} />
                        View All
                      </Link>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <ShoppingBag className="mx-auto mb-4 opacity-50" size={48} />
                      <p>No orders found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gold-500/20">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Order ID</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="border-b border-gold-500/10 hover:bg-black-800/50">
                              <td className="py-4 px-4 text-white font-medium">{order.order_number}</td>
                              <td className="py-4 px-4 text-gray-300">{order.customer_name}</td>
                              <td className="py-4 px-4 text-gray-400">{new Date(order.created_at).toLocaleDateString('en-PH')}</td>
                              <td className="py-4 px-4 text-white">₱{parseFloat(String(order.total_amount)).toLocaleString()}</td>
                              <td className="py-4 px-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-white">Customer Management</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <Link to="/sales/customers" className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400">
                        View All
                      </Link>
                    </div>
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Users className="mx-auto mb-4 opacity-50" size={48} />
                      <p>No customers found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="p-4 bg-black-800 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center text-gold-500 font-bold text-lg">
                                {customer.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-400">{customer.total_orders} orders</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total Spent:</span>
                            <span className="text-gold-500 font-medium">₱{parseFloat(String(customer.total_spent)).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <a href={`tel:${customer.email}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-black-700 rounded-lg text-gray-400 hover:text-white text-sm">
                              <Phone size={14} />
                              Call
                            </a>
                            <a href={`mailto:${customer.email}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-black-700 rounded-lg text-gray-400 hover:text-white text-sm">
                              <Mail size={14} />
                              Email
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Sales Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Link to="/sales/analytics" className="p-4 bg-black-800 rounded-lg text-left hover:bg-black-700 transition-colors">
                      <BarChart3 className="text-gold-500 mb-2" size={24} />
                      <p className="text-white font-medium">Sales Analytics</p>
                      <p className="text-sm text-gray-400">View detailed charts</p>
                    </Link>
                    <Link to="/sales/orders" className="p-4 bg-black-800 rounded-lg text-left hover:bg-black-700 transition-colors">
                      <Calendar className="text-blue-400 mb-2" size={24} />
                      <p className="text-white font-medium">Order History</p>
                      <p className="text-sm text-gray-400">All orders by date</p>
                    </Link>
                    <Link to="/sales/invoices" className="p-4 bg-black-800 rounded-lg text-left hover:bg-black-700 transition-colors">
                      <TrendingUp className="text-green-400 mb-2" size={24} />
                      <p className="text-white font-medium">Invoice Reports</p>
                      <p className="text-sm text-gray-400">Payment & billing</p>
                    </Link>
                  </div>
                  <div className="text-center py-12 text-gray-400">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Click on a report type to view details</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </SalesLayout>
  );
};

export default SalesDashboard;

