import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
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
  ArrowDown,
  Download,
  BarChart3,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';

interface AnalyticsData {
  revenue: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
  };
  previousRevenue?: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
  };
  changes?: {
    revenue: number;
    orders: number;
    avgOrder: number;
    customers: number;
  };
  daily: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  hourly?: Array<{
    day_of_week: number;
    hour: number;
    order_count: number;
    revenue: number;
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
  locationData?: Array<{
    city: string;
    province: string;
    order_count: number;
    total_revenue: number;
  }>;
}

const AdminAnalytics = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = useState('30days');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=analytics&period=${period}`);
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

  const exportCSV = useCallback(() => {
    if (!analytics) return;
    
    const rows: string[] = [
      'Fragranza Olio - Admin Analytics Report',
      `Period: ${period}`,
      `Generated: ${new Date().toLocaleString('en-PH')}`,
      '',
      'Summary',
      `Total Revenue,${analytics.revenue.total_revenue}`,
      `Total Orders,${analytics.revenue.total_orders}`,
      `Avg Order Value,${analytics.revenue.avg_order_value}`,
      `New Customers,${analytics.newCustomers}`,
      '',
      'Daily Revenue',
      'Date,Revenue,Orders',
      ...analytics.daily.map(d => `${d.date},${d.revenue},${d.orders}`),
      '',
      'Top Products',
      'Product,Units Sold,Revenue',
      ...analytics.topProducts.map(p => `"${p.product_name}",${p.total_sold},${p.total_revenue}`),
      '',
      'Category Breakdown',
      'Category,Orders,Revenue',
      ...analytics.categories.map(c => `"${c.category || 'Uncategorized'}",${c.orders},${c.revenue}`),
    ];

    if (analytics.locationData && analytics.locationData.length > 0) {
      rows.push('', 'Frequent Order Locations', 'City,Province,Orders,Revenue');
      analytics.locationData.forEach(loc => {
        rows.push(`"${loc.city}","${loc.province}",${loc.order_count},${loc.total_revenue}`);
      });
    }
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fragranza-admin-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics, period]);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const formatCurrency = (amount: number) => {
    return `₱${parseFloat(String(amount || 0)).toLocaleString()}`;
  };

  const getMaxRevenue = () => {
    if (!analytics?.daily || analytics.daily.length === 0) return 1;
    return Math.max(...analytics.daily.map(d => parseFloat(String(d.revenue)) || 0));
  };

  const getMaxOrders = () => {
    if (!analytics?.daily || analytics.daily.length === 0) return 1;
    return Math.max(...analytics.daily.map(d => parseFloat(String(d.orders)) || 0));
  };

  const getCategoryTotal = () => {
    if (!analytics?.categories) return 1;
    return analytics.categories.reduce((sum, c) => sum + parseFloat(String(c.revenue)), 0);
  };

  const categoryColors = ['bg-gold-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];

  // Build hourly heatmap data
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourLabels = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
  const hourValues = [6, 8, 10, 12, 14, 16, 18, 20, 22];

  const getHeatmapValue = (dayOfWeek: number, hour: number): number => {
    if (!analytics?.hourly) return 0;
    const entry = analytics.hourly.find(h => h.day_of_week === dayOfWeek && h.hour === hour);
    return entry ? entry.order_count : 0;
  };

  const getHeatmapRevenue = (dayOfWeek: number, hour: number): number => {
    if (!analytics?.hourly) return 0;
    const entry = analytics.hourly.find(h => h.day_of_week === dayOfWeek && h.hour === hour);
    return entry ? parseFloat(String(entry.revenue)) : 0;
  };

  const getMaxHeatmapValue = (): number => {
    if (!analytics?.hourly || analytics.hourly.length === 0) return 1;
    return Math.max(...analytics.hourly.map(h => h.order_count));
  };

  const getHeatmapColor = (value: number, max: number): string => {
    if (value === 0) return 'bg-black-700';
    const intensity = value / max;
    if (intensity > 0.75) return 'bg-gold-500';
    if (intensity > 0.5) return 'bg-gold-600';
    if (intensity > 0.25) return 'bg-gold-700';
    return 'bg-gold-800';
  };

  // Location heatmap helpers
  const getMaxLocationOrders = (): number => {
    if (!analytics?.locationData || analytics.locationData.length === 0) return 1;
    return Math.max(...analytics.locationData.map(l => l.order_count));
  };

  const getLocationBarColor = (count: number, max: number): string => {
    const intensity = count / max;
    if (intensity > 0.75) return 'from-gold-400 to-gold-500';
    if (intensity > 0.5) return 'from-gold-500 to-gold-600';
    if (intensity > 0.25) return 'from-gold-600 to-gold-700';
    return 'from-gold-700 to-gold-800';
  };

  const ChangeIndicator = ({ value }: { value?: number }) => {
    if (value === undefined || value === null) return null;
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {Math.abs(value)}%
      </span>
    );
  };

  const periodLabel = {
    '7days': 'vs previous 7 days',
    '30days': 'vs previous 30 days',
    '90days': 'vs previous 90 days',
    'year': 'vs previous year'
  }[period] || '';

  return (
    <AdminLayout title="Analytics & Reports">
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-gold-400" size={20} />
            <span className="text-white font-medium">Sales & Order Analytics</span>
            {periodLabel && (
              <span className="text-gray-500 text-xs ml-2">({periodLabel})</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
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
              onClick={exportCSV}
              className="p-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-400 hover:text-gold-400"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
            <button
              onClick={fetchAnalytics}
              className="p-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-400 hover:text-gold-400"
              title="Refresh"
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
                  <ChangeIndicator value={analytics.changes?.revenue} />
                </div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.total_revenue)}</p>
                {analytics.previousRevenue && (
                  <p className="text-gray-500 text-xs mt-1">
                    Prev: {formatCurrency(analytics.previousRevenue.total_revenue)}
                  </p>
                )}
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
                  <ChangeIndicator value={analytics.changes?.orders} />
                </div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{analytics.revenue.total_orders}</p>
                {analytics.previousRevenue && (
                  <p className="text-gray-500 text-xs mt-1">
                    Prev: {analytics.previousRevenue.total_orders}
                  </p>
                )}
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
                  <ChangeIndicator value={analytics.changes?.avgOrder} />
                </div>
                <p className="text-gray-400 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.avg_order_value)}</p>
                {analytics.previousRevenue && (
                  <p className="text-gray-500 text-xs mt-1">
                    Prev: {formatCurrency(analytics.previousRevenue.avg_order_value)}
                  </p>
                )}
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
                  <ChangeIndicator value={analytics.changes?.customers} />
                </div>
                <p className="text-gray-400 text-sm">New Customers</p>
                <p className="text-2xl font-bold text-white">{analytics.newCustomers}</p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue / Orders Chart */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-gold-400" />
                    {chartMode === 'revenue' ? 'Revenue Trend' : 'Orders Trend'}
                  </h3>
                  <div className="flex gap-1 bg-black-800 rounded-lg p-1">
                    <button
                      onClick={() => setChartMode('revenue')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        chartMode === 'revenue' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setChartMode('orders')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        chartMode === 'orders' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Orders
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  {analytics.daily.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No data available for this period
                    </div>
                  ) : (
                    <div className="h-full flex items-end gap-1">
                      {analytics.daily.map((day, index) => {
                        const value = chartMode === 'revenue' 
                          ? parseFloat(String(day.revenue)) 
                          : parseFloat(String(day.orders));
                        const max = chartMode === 'revenue' ? getMaxRevenue() : getMaxOrders();
                        const height = (value / max) * 100;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center group"
                          >
                            <div className="relative w-full">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(height, 2)}%` }}
                                transition={{ delay: index * 0.03 }}
                                className={`w-full rounded-t-sm min-h-[4px] cursor-pointer ${
                                  chartMode === 'revenue'
                                    ? 'bg-gradient-to-t from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300'
                                    : 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300'
                                }`}
                                style={{ height: `${Math.max(height, 2)}%` }}
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black-800 border border-gold-500/30 rounded-lg px-3 py-2 text-center whitespace-nowrap">
                                  <p className="text-gold-400 font-bold">{formatCurrency(day.revenue)}</p>
                                  <p className="text-blue-400 text-xs">{day.orders} orders</p>
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
                {analytics.daily.length > 0 && (
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>{new Date(analytics.daily[0]?.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                    <span>{new Date(analytics.daily[analytics.daily.length - 1]?.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
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

            {/* Heatmaps Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Order Activity Heatmap */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Clock size={20} className="text-gold-400" />
                  Order Activity Heatmap
                </h3>
                <p className="text-gray-500 text-xs mb-4">Frequent order times by day of week and hour</p>
                {analytics.hourly && analytics.hourly.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[400px]">
                      {/* Hour Labels */}
                      <div className="flex mb-1">
                        <div className="w-10 shrink-0" />
                        {hourLabels.map((label) => (
                          <div key={label} className="flex-1 text-center text-xs text-gray-500">
                            {label}
                          </div>
                        ))}
                      </div>
                      {/* Day rows */}
                      {dayLabels.map((day, dayIndex) => (
                        <div key={day} className="flex items-center gap-1 mb-1">
                          <div className="w-10 text-xs text-gray-400 shrink-0">{day}</div>
                          {hourValues.map((hour) => {
                            const value = getHeatmapValue(dayIndex + 1, hour);
                            const revenue = getHeatmapRevenue(dayIndex + 1, hour);
                            const max = getMaxHeatmapValue();
                            return (
                              <div
                                key={hour}
                                className={`flex-1 h-8 rounded ${getHeatmapColor(value, max)} transition-colors group relative cursor-default`}
                                title={`${day} ${hour}:00 - ${value} orders`}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                  <div className="bg-black-800 border border-gold-500/30 rounded px-2 py-1 text-center whitespace-nowrap text-xs">
                                    <p><span className="text-gold-400 font-medium">{value}</span><span className="text-gray-400"> orders</span></p>
                                    <p className="text-green-400">{formatCurrency(revenue)}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      {/* Legend */}
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <span className="text-xs text-gray-500">Less</span>
                        <div className="w-4 h-4 rounded bg-black-700" />
                        <div className="w-4 h-4 rounded bg-gold-800" />
                        <div className="w-4 h-4 rounded bg-gold-700" />
                        <div className="w-4 h-4 rounded bg-gold-600" />
                        <div className="w-4 h-4 rounded bg-gold-500" />
                        <span className="text-xs text-gray-500">More</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No order activity data yet</p>
                      <p className="text-xs mt-1">Data will appear as orders come in</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Frequent Order Locations (Geographic Heatmap) */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin size={20} className="text-gold-400" />
                  Frequent Order Locations
                </h3>
                <p className="text-gray-500 text-xs mb-4">Top cities and provinces by order volume</p>
                {analytics.locationData && analytics.locationData.length > 0 ? (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {analytics.locationData.map((loc, index) => {
                      const max = getMaxLocationOrders();
                      const percentage = (loc.order_count / max) * 100;
                      return (
                        <motion.div
                          key={`${loc.city}-${loc.province}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-gold-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-orange-600 text-white' :
                                'bg-black-700 text-gray-400'
                              }`}>
                                {index + 1}
                              </span>
                              <div>
                                <span className="text-white text-sm font-medium">{loc.city}</span>
                                <span className="text-gray-500 text-xs ml-1">({loc.province})</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-gold-400 text-sm font-medium">{loc.order_count} orders</span>
                              <span className="text-gray-500 text-xs ml-2">{formatCurrency(loc.total_revenue)}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-black-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.05 + 0.2 }}
                              className={`h-full rounded-full bg-gradient-to-r ${getLocationBarColor(loc.order_count, max)}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No location data yet</p>
                      <p className="text-xs mt-1">Location data comes from order shipping addresses</p>
                    </div>
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
                        <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm hidden sm:table-cell">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topProducts.map((product, index) => {
                        const totalProductRevenue = analytics.topProducts.reduce((s, p) => s + parseFloat(String(p.total_revenue)), 0);
                        const share = totalProductRevenue > 0 ? ((parseFloat(String(product.total_revenue)) / totalProductRevenue) * 100).toFixed(1) : '0';
                        return (
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
                            <td className="py-3 px-4 text-right hidden sm:table-cell">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-2 bg-black-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gold-500 rounded-full" 
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                                <span className="text-gray-400 text-xs w-10 text-right">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
