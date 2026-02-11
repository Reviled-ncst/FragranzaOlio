import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Users,
  Package,
  Calendar,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/FragranzaWeb/backend/api';

interface AnalyticsData {
  revenue: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
  };
  daily: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }>;
  categories: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
  newCustomers: number;
}

const SalesAnalytics = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = useState('30days');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/sales.php?action=analytics&period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
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

  const formatCurrency = (amount: number) => {
    return `₱${parseFloat(String(amount || 0)).toLocaleString()}`;
  };

  const getMaxRevenue = () => {
    if (!analytics?.daily || analytics.daily.length === 0) return 1;
    return Math.max(...analytics.daily.map(d => parseFloat(String(d.revenue)) || 0));
  };

  const getCategoryTotal = () => {
    if (!analytics?.categories) return 1;
    return analytics.categories.reduce((sum, c) => sum + parseFloat(String(c.revenue)), 0);
  };

  const categoryColors = ['bg-gold-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];

  return (
    <SalesLayout title="Analytics">
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gold-400" size={20} />
            <span className="text-white font-medium">Sales Analytics</span>
          </div>
          <div className="flex gap-2">
            {[
              { value: '7days', label: '7 Days' },
              { value: '30days', label: '30 Days' },
              { value: '90days', label: '90 Days' },
              { value: 'year', label: '1 Year' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value 
                    ? 'bg-gold-500 text-black' 
                    : 'bg-black-800 text-gray-400 hover:text-white border border-gold-500/30'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={fetchAnalytics}
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
            <button onClick={fetchAnalytics} className="ml-auto text-red-400 hover:text-red-300">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : analytics ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-gold-400" size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <ArrowUp size={14} />
                    12%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.total_revenue)}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-blue-400" size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <ArrowUp size={14} />
                    8%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{analytics.revenue.total_orders}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-purple-400" size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-red-400 text-sm">
                    <ArrowDown size={14} />
                    3%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.avg_order_value)}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="text-green-400" size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <ArrowUp size={14} />
                    15%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">New Customers</p>
                <p className="text-2xl font-bold text-white">{analytics.newCustomers}</p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
                <div className="h-64">
                  {analytics.daily.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No data available for this period
                    </div>
                  ) : (
                    <div className="h-full flex items-end gap-1">
                      {analytics.daily.map((day, index) => {
                        const height = (parseFloat(String(day.revenue)) / getMaxRevenue()) * 100;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center group"
                          >
                            <div className="relative w-full">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(height, 2)}%` }}
                                transition={{ delay: index * 0.05 }}
                                className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-sm min-h-[4px] cursor-pointer hover:from-gold-500 hover:to-gold-300"
                                style={{ height: `${Math.max(height, 2)}%` }}
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black-800 border border-gold-500/30 rounded-lg px-3 py-2 text-center whitespace-nowrap">
                                  <p className="text-gold-400 font-bold">{formatCurrency(day.revenue)}</p>
                                  <p className="text-gray-400 text-xs">{day.orders} orders</p>
                                  <p className="text-gray-500 text-xs">{new Date(day.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-500">
                  <span>{analytics.daily[0]?.date ? new Date(analytics.daily[0].date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : ''}</span>
                  <span>{analytics.daily[analytics.daily.length - 1]?.date ? new Date(analytics.daily[analytics.daily.length - 1].date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : ''}</span>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Sales by Category</h3>
                {analytics.categories.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.categories.map((cat, index) => {
                      const percentage = (parseFloat(String(cat.revenue)) / getCategoryTotal()) * 100;
                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-white text-sm">{cat.category || 'Uncategorized'}</span>
                            <span className="text-gray-400 text-sm">{formatCurrency(cat.revenue)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-3 bg-black-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.1 }}
                              className={`h-full rounded-full ${categoryColors[index % categoryColors.length]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Selling Products</h3>
              {analytics.topProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  No product data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gold-500/20">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">#</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Product</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Units Sold</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topProducts.map((product, index) => (
                        <tr key={index} className="border-b border-gold-500/10 hover:bg-black-800/50">
                          <td className="py-3 px-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-gold-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-black-700 text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center">
                                <Package className="text-gold-400" size={18} />
                              </div>
                              <span className="text-white font-medium">{product.product_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{product.total_sold}</td>
                          <td className="py-3 px-4 text-right text-gold-400 font-medium">{formatCurrency(product.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </SalesLayout>
  );
};

export default SalesAnalytics;
