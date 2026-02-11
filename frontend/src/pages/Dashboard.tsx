import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  User,
  Shield,
  Bell,
  LogOut,
  Camera,
  Package,
  Clock,
  TrendingUp,
  Star,
  ChevronRight,
  Eye,
  Trash2,
  Plus,
  Edit2,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Gift,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import type {
  Order,
  Address,
  WishlistItem,
  DashboardStats,
  Activity,
  OrderStatus,
} from '../types/dashboard';

type TabType = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'security' | 'preferences';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to overview
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Dashboard data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Profile form data
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    zipCode: user?.zipCode || '',
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const [statsData, ordersData, wishlistData, addressesData, activitiesData] = await Promise.all([
          dashboardService.getStats(user.id),
          dashboardService.getOrders(user.id),
          dashboardService.getWishlist(user.id),
          dashboardService.getAddresses(user.id),
          dashboardService.getActivities(user.id),
        ]);
        
        setStats(statsData);
        setOrders(ordersData);
        setWishlist(wishlistData);
        setAddresses(addressesData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-black-950 pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to access your dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedOrder(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const updatedUser = { ...user, ...formData };
    updateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthDate: user?.birthDate || '',
      gender: user?.gender || '',
      address: user?.address || '',
      city: user?.city || '',
      province: user?.province || '',
      zipCode: user?.zipCode || '',
    });
    setIsEditing(false);
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    await dashboardService.removeFromWishlist(user.id, productId);
    setWishlist(prev => prev.filter(item => item.productId !== productId));
  };

  const handleDeleteAddress = async (addressId: string) => {
    await dashboardService.deleteAddress(addressId);
    setAddresses(prev => prev.filter(a => a.id !== addressId));
  };

  const getInitials = () => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status];
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      pending: <Clock size={14} />,
      processing: <RefreshCw size={14} />,
      shipped: <Truck size={14} />,
      delivered: <CheckCircle size={14} />,
      cancelled: <X size={14} />,
      refunded: <AlertCircle size={14} />,
    };
    return icons[status];
  };

  const getActivityIcon = (type: Activity['type']) => {
    const icons: Record<Activity['type'], React.ReactNode> = {
      order_placed: <ShoppingBag size={16} className="text-blue-400" />,
      order_delivered: <CheckCircle size={16} className="text-green-400" />,
      wishlist_added: <Heart size={16} className="text-pink-400" />,
      review_posted: <Star size={16} className="text-yellow-400" />,
      profile_updated: <User size={16} className="text-gold-400" />,
    };
    return icons[type];
  };

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, badge: stats?.pendingOrders },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: stats?.wishlistCount },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  // Filter orders
  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  return (
    <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 pb-8 sm:pb-16">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-black-900 to-black-800 border border-gold-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
              {/* User Info */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
                  <div className="w-full h-full bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-black shadow-lg">
                    {getInitials()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 bg-black-800 border border-gold-500/30 rounded-full hover:bg-black-700 transition-colors">
                    <Camera size={10} className="sm:w-3 sm:h-3 text-gold-400" />
                  </button>
                </div>
                <h2 className="text-white font-semibold text-sm sm:text-base">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-400 text-xs sm:text-sm truncate">{user.email}</p>
                <div className="mt-2 flex justify-center">
                  <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${
                    user.emailVerified 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.emailVerified ? '✓ Verified' : '⏳ Unverified'}
                  </span>
                </div>
              </div>

              {/* Navigation - horizontal scroll on mobile */}
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as TabType)}
                    className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg transition-all whitespace-nowrap min-w-max lg:min-w-0 lg:w-full ${
                      activeTab === item.id
                        ? 'bg-gold-500/20 text-gold-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <item.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-gold-500/20 text-gold-400 rounded-full ml-2">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Dashboard Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Welcome Header */}
                    <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 border border-gold-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white mb-1 sm:mb-2">
                        Welcome back, {user.firstName}! 👋
                      </h1>
                      <p className="text-sm sm:text-base text-gray-400">
                        Here's what's happening with your account today.
                      </p>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                              <Package size={16} className="sm:w-5 sm:h-5 text-blue-400" />
                            </div>
                          </div>
                          <p className="text-lg sm:text-2xl font-bold text-white">{stats.totalOrders}</p>
                          <p className="text-xs sm:text-sm text-gray-400">Total Orders</p>
                        </div>
                        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg">
                              <Clock size={16} className="sm:w-5 sm:h-5 text-yellow-400" />
                            </div>
                          </div>
                          <p className="text-lg sm:text-2xl font-bold text-white">{stats.pendingOrders}</p>
                          <p className="text-xs sm:text-sm text-gray-400">Pending</p>
                        </div>
                        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                              <TrendingUp size={16} className="sm:w-5 sm:h-5 text-green-400" />
                            </div>
                          </div>
                          <p className="text-base sm:text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p>
                          <p className="text-xs sm:text-sm text-gray-400">Total Spent</p>
                        </div>
                        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className="p-1.5 sm:p-2 bg-gold-500/20 rounded-lg">
                              <Gift size={16} className="sm:w-5 sm:h-5 text-gold-400" />
                            </div>
                          </div>
                          <p className="text-lg sm:text-2xl font-bold text-white">{stats.rewardPoints}</p>
                          <p className="text-xs sm:text-sm text-gray-400">Points</p>
                        </div>
                      </div>
                    )}

                    {/* Recent Orders & Activity */}
                    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Recent Orders */}
                      <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                            <ShoppingBag size={18} className="sm:w-5 sm:h-5 text-gold-400" />
                            Recent Orders
                          </h2>
                          <button
                            onClick={() => handleTabChange('orders')}
                            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
                          >
                            View All <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {orders.slice(0, 3).map(order => (
                            <div
                              key={order.id}
                              onClick={() => {
                                setSelectedOrder(order);
                                handleTabChange('orders');
                              }}
                              className="flex items-center justify-between p-3 bg-black-800 rounded-lg hover:bg-black-700 cursor-pointer transition-colors"
                            >
                              <div>
                                <p className="text-white font-medium">{order.orderNumber}</p>
                                <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{formatCurrency(order.total)}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {orders.length === 0 && (
                            <p className="text-gray-400 text-center py-4">No orders yet</p>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                          <Clock size={20} className="text-gold-400" />
                          Recent Activity
                        </h2>
                        <div className="space-y-3">
                          {activities.slice(0, 5).map(activity => (
                            <div key={activity.id} className="flex items-start gap-3">
                              <div className="p-2 bg-black-800 rounded-lg">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">{activity.title}</p>
                                <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                                <p className="text-gray-500 text-xs mt-1">{formatDate(activity.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Wishlist Preview */}
                    {wishlist.length > 0 && (
                      <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Heart size={20} className="text-pink-400" />
                            Your Wishlist
                          </h2>
                          <button
                            onClick={() => handleTabChange('wishlist')}
                            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
                          >
                            View All ({wishlist.length}) <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {wishlist.slice(0, 4).map(item => (
                            <Link
                              key={item.id}
                              to={`/products/${item.productId}`}
                              className="group bg-black-800 rounded-lg p-3 hover:bg-black-700 transition-colors"
                            >
                              <div className="aspect-square bg-black-900 rounded-lg mb-2 overflow-hidden">
                                <img
                                  src={item.product?.image}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <p className="text-white text-sm font-medium truncate">{item.product?.name}</p>
                              <p className="text-gold-400 text-sm">{formatCurrency(item.product?.price || 0)}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h1 className="text-2xl font-display font-bold text-white">My Orders</h1>
                      
                      {/* Filter */}
                      <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                          value={orderFilter}
                          onChange={(e) => setOrderFilter(e.target.value)}
                          className="px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                        >
                          <option value="all">All Orders</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {selectedOrder ? (
                      /* Order Details View */
                      <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-4"
                        >
                          <ChevronRight size={18} className="rotate-180" />
                          Back to Orders
                        </button>

                        {/* Order Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gold-500/10">
                          <div>
                            <h2 className="text-xl font-semibold text-white">{selectedOrder.orderNumber}</h2>
                            <p className="text-gray-400 text-sm">Placed on {formatDate(selectedOrder.createdAt)}</p>
                          </div>
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                            {getStatusIcon(selectedOrder.status)}
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                        </div>

                        {/* Tracking Info */}
                        {selectedOrder.trackingNumber && (
                          <div className="mt-4 p-4 bg-black-800 rounded-lg">
                            <p className="text-sm text-gray-400 mb-1">Tracking Number</p>
                            <div className="flex items-center gap-2">
                              <code className="text-gold-400 font-mono">{selectedOrder.trackingNumber}</code>
                              <button
                                onClick={() => navigator.clipboard.writeText(selectedOrder.trackingNumber || '')}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            {selectedOrder.estimatedDelivery && (
                              <p className="text-sm text-gray-400 mt-2">
                                Estimated Delivery: <span className="text-white">{formatDate(selectedOrder.estimatedDelivery)}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="mt-6">
                          <h3 className="text-white font-medium mb-3">Order Items</h3>
                          <div className="space-y-3">
                            {selectedOrder.items.map(item => (
                              <div key={item.id} className="flex items-center gap-4 p-3 bg-black-800 rounded-lg">
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <p className="text-white font-medium">{item.productName}</p>
                                  <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-white font-medium">{formatCurrency(item.total)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 p-4 bg-black-800 rounded-lg">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-400">
                              <span>Subtotal</span>
                              <span>{formatCurrency(selectedOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Shipping</span>
                              <span>{selectedOrder.shippingFee === 0 ? 'Free' : formatCurrency(selectedOrder.shippingFee)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Tax</span>
                              <span>{formatCurrency(selectedOrder.tax)}</span>
                            </div>
                            {selectedOrder.discount > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Discount</span>
                                <span>-{formatCurrency(selectedOrder.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-white font-semibold pt-2 border-t border-gold-500/10">
                              <span>Total</span>
                              <span>{formatCurrency(selectedOrder.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mt-6 grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-black-800 rounded-lg">
                            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                              <Truck size={16} className="text-gold-400" />
                              Shipping Address
                            </h3>
                            <p className="text-gray-300">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.shippingAddress.address}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province}</p>
                            <p className="text-gray-400 text-sm">{selectedOrder.shippingAddress.zipCode}</p>
                          </div>
                          <div className="p-4 bg-black-800 rounded-lg">
                            <h3 className="text-white font-medium mb-2">Payment Method</h3>
                            <p className="text-gray-300">{selectedOrder.paymentMethod}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                              selectedOrder.paymentStatus === 'paid' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Orders List */
                      <div className="space-y-4">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map(order => (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="bg-black-900 border border-gold-500/20 rounded-xl p-5 hover:border-gold-500/40 cursor-pointer transition-all"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex -space-x-3">
                                    {order.items.slice(0, 3).map((item, idx) => (
                                      <img
                                        key={item.id}
                                        src={item.productImage}
                                        alt={item.productName}
                                        className="w-12 h-12 rounded-lg border-2 border-black-900 object-cover"
                                        style={{ zIndex: 3 - idx }}
                                      />
                                    ))}
                                    {order.items.length > 3 && (
                                      <div className="w-12 h-12 rounded-lg border-2 border-black-900 bg-black-800 flex items-center justify-center text-sm text-gray-400">
                                        +{order.items.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{order.orderNumber}</p>
                                    <p className="text-gray-400 text-sm">{order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatDate(order.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(order.total)}</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                                      {getStatusIcon(order.status)}
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </div>
                                  <ChevronRight size={20} className="text-gray-400" />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 bg-black-900 border border-gold-500/20 rounded-xl">
                            <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400 mb-4">No orders found</p>
                            <Link
                              to="/products"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                            >
                              Start Shopping
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-display font-bold text-white">My Wishlist</h1>

                    {wishlist.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {wishlist.map(item => (
                          <div key={item.id} className="group bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden hover:border-gold-500/40 transition-all">
                            <Link to={`/products/${item.productId}`} className="block">
                              <div className="aspect-square bg-black-800 relative overflow-hidden">
                                <img
                                  src={item.product?.image}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            </Link>
                            <div className="p-4">
                              <Link to={`/products/${item.productId}`}>
                                <h3 className="text-white font-medium truncate hover:text-gold-400 transition-colors">
                                  {item.product?.name}
                                </h3>
                              </Link>
                              <p className="text-gray-400 text-sm mb-2">{item.product?.category}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-gold-400 font-semibold">{formatCurrency(item.product?.price || 0)}</p>
                                <button
                                  onClick={() => handleRemoveFromWishlist(item.productId)}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black-900 border border-gold-500/20 rounded-xl">
                        <Heart size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                        <Link
                          to="/products"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                        >
                          Browse Products
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-display font-bold text-white">My Addresses</h1>
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setShowAddressModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                      >
                        <Plus size={18} />
                        Add Address
                      </button>
                    </div>

                    {addresses.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {addresses.map(address => (
                          <div
                            key={address.id}
                            className={`bg-black-900 border rounded-xl p-5 ${
                              address.isDefault ? 'border-gold-500/50' : 'border-gold-500/20'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{address.label}</span>
                                {address.isDefault && (
                                  <span className="px-2 py-0.5 text-xs bg-gold-500/20 text-gold-400 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingAddress(address);
                                    setShowAddressModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                {!address.isDefault && (
                                  <button
                                    onClick={() => handleDeleteAddress(address.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-white">{address.firstName} {address.lastName}</p>
                            <p className="text-gray-400 text-sm">{address.phone}</p>
                            <p className="text-gray-400 text-sm mt-2">{address.address}</p>
                            <p className="text-gray-400 text-sm">{address.city}, {address.province} {address.zipCode}</p>
                            <p className="text-gray-400 text-sm">{address.country}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black-900 border border-gold-500/20 rounded-xl">
                        <MapPin size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 mb-4">No addresses saved</p>
                        <button
                          onClick={() => setShowAddressModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                        >
                          <Plus size={18} />
                          Add Your First Address
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <User size={24} className="text-gold-400" />
                        Personal Information
                      </h1>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 transition-colors"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          />
                        ) : (
                          <p className="text-white py-2.5">{user.firstName}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          />
                        ) : (
                          <p className="text-white py-2.5">{user.lastName}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                          <Mail size={14} />
                          Email Address
                        </label>
                        <p className="text-white py-2.5">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                          <Phone size={14} />
                          Phone Number
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          />
                        ) : (
                          <p className="text-white py-2.5">{user.phone || 'Not set'}</p>
                        )}
                      </div>

                      {/* Birth Date */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                          <Calendar size={14} />
                          Birth Date
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          />
                        ) : (
                          <p className="text-white py-2.5">{formatDate(user.birthDate || '')}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Gender</label>
                        {isEditing ? (
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="text-white py-2.5 capitalize">{user.gender || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="pt-6 mt-6 border-t border-gold-500/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <MapPin size={20} className="text-gold-400" />
                        Primary Address
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-400 mb-1.5">Street Address</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          ) : (
                            <p className="text-white py-2.5">{user.address || 'Not set'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">City</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          ) : (
                            <p className="text-white py-2.5">{user.city || 'Not set'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Province</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="province"
                              value={formData.province}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          ) : (
                            <p className="text-white py-2.5">{user.province || 'Not set'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Zip Code</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                          ) : (
                            <p className="text-white py-2.5">{user.zipCode || 'Not set'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                    <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2 mb-6">
                      <Shield size={24} className="text-gold-400" />
                      Security Settings
                    </h1>

                    <div className="space-y-4">
                      {/* Change Password */}
                      <div className="p-5 bg-black-800 rounded-lg border border-gold-500/10">
                        <h3 className="font-medium text-white mb-2">Change Password</h3>
                        <p className="text-sm text-gray-400 mb-4">Update your password to keep your account secure.</p>
                        <button className="px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors">
                          Change Password
                        </button>
                      </div>

                      {/* Two-Factor Auth */}
                      <div className="p-5 bg-black-800 rounded-lg border border-gold-500/10">
                        <h3 className="font-medium text-white mb-2">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account.</p>
                        <button className="px-4 py-2 border border-gold-500/30 text-gold-400 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors">
                          Enable 2FA
                        </button>
                      </div>

                      {/* Login History */}
                      <div className="p-5 bg-black-800 rounded-lg border border-gold-500/10">
                        <h3 className="font-medium text-white mb-2">Recent Login Activity</h3>
                        <div className="space-y-3 mt-4">
                          <div className="flex items-center justify-between py-2 border-b border-gold-500/10">
                            <div>
                              <p className="text-white text-sm">Windows • Chrome</p>
                              <p className="text-gray-400 text-xs">Metro Manila, Philippines</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 text-sm">Current session</p>
                              <p className="text-gray-400 text-xs">Just now</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete Account */}
                      <div className="p-5 bg-red-500/5 rounded-lg border border-red-500/20">
                        <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <button className="px-4 py-2 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                    <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2 mb-6">
                      <Bell size={24} className="text-gold-400" />
                      Notification Preferences
                    </h1>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                        <div>
                          <h3 className="font-medium text-white">Newsletter</h3>
                          <p className="text-sm text-gray-400">Receive updates about new products and offers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={user.subscribeNewsletter}
                          className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                          readOnly
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                        <div>
                          <h3 className="font-medium text-white">Order Updates</h3>
                          <p className="text-sm text-gray-400">Get notified about your order status</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                        <div>
                          <h3 className="font-medium text-white">Promotional Emails</h3>
                          <p className="text-sm text-gray-400">Receive special discounts and promotions</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                        <div>
                          <h3 className="font-medium text-white">Wishlist Notifications</h3>
                          <p className="text-sm text-gray-400">Get alerts when wishlist items go on sale</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                        <div>
                          <h3 className="font-medium text-white">SMS Notifications</h3>
                          <p className="text-sm text-gray-400">Receive important updates via SMS</p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <AddressModal
            address={editingAddress}
            onClose={() => {
              setShowAddressModal(false);
              setEditingAddress(null);
            }}
            onSave={async (addressData) => {
              if (editingAddress) {
                const updated = await dashboardService.updateAddress(editingAddress.id, addressData);
                if (updated) {
                  setAddresses(prev => prev.map(a => a.id === editingAddress.id ? updated : a));
                }
              } else {
                const newAddress = await dashboardService.addAddress({
                  ...addressData,
                  userId: user.id,
                });
                setAddresses(prev => [...prev, newAddress]);
              }
              setShowAddressModal(false);
              setEditingAddress(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Address Modal Component
interface AddressModalProps {
  address: Address | null;
  onClose: () => void;
  onSave: (data: Partial<Address>) => void;
}

const AddressModal = ({ address, onClose, onSave }: AddressModalProps) => {
  const [formData, setFormData] = useState({
    label: address?.label || '',
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    phone: address?.phone || '',
    address: address?.address || '',
    city: address?.city || '',
    province: address?.province || '',
    zipCode: address?.zipCode || '',
    country: address?.country || 'Philippines',
    isDefault: address?.isDefault || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-black-900 border border-gold-500/20 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Address Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Home, Office"
              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Street Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Province</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Zip Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-white">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gold-500/30 text-gold-400 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              {address ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
