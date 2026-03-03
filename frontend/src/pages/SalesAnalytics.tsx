import { apiFetch, API_BASE_URL } from '../services/api';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
import SalesLayout from '../components/layout/SalesLayout';

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

const SalesAnalytics = () => {
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
      'Fragranza Olio - Sales Analytics Report',
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
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fragranza-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics, period]);

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

  const getMaxOrders = () => {
    if (!analytics?.daily || analytics.daily.length === 0) return 1;
    return Math.max(...analytics.daily.map(d => parseFloat(String(d.orders)) || 0));
  };

  const getCategoryTotal = () => {
    if (!analytics?.categories) return 1;
    return analytics.categories.reduce((sum, c) => sum + parseFloat(String(c.revenue)), 0);
  };

  const categoryColors = ['bg-gold-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];

  // Build hourly heatmap data - full 24h
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const hourTickLabels: Record<number, string> = { 0: '12a', 3: '3a', 6: '6a', 9: '9a', 12: '12p', 15: '3p', 18: '6p', 21: '9p' };

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

  const getHeatmapColor = (value: number, max: number): React.CSSProperties => {
    if (value === 0 || max === 0) return { backgroundColor: 'rgba(31,31,31,0.8)' };
    const t = value / max;
    const r = Math.round(31 + t * (245 - 31));
    const g = Math.round(31 + t * (158 - 31));
    const b = Math.round(31 + t * (11 - 31));
    return { backgroundColor: `rgb(${r},${g},${b})`, boxShadow: t > 0.6 ? `0 0 6px rgba(245,158,11,${t * 0.5})` : 'none' };
  };

  // Location map helpers
  const getMaxLocationOrders = (): number => {
    if (!analytics?.locationData || analytics.locationData.length === 0) return 1;
    return Math.max(...analytics.locationData.map(l => l.order_count));
  };

  // Philippine city/province coordinates lookup (lat, lng)
  const PH_COORDS: Record<string, [number, number]> = {
    'Manila': [14.5995, 120.9842], 'Quezon City': [14.6760, 121.0437], 'Makati': [14.5547, 121.0244],
    'Pasig': [14.5764, 121.0851], 'Taguig': [14.5243, 121.0792], 'Mandaluyong': [14.5794, 121.0359],
    'Caloocan': [14.7500, 121.0167], 'Marikina': [14.6507, 121.1029], 'Parañaque': [14.4793, 121.0198],
    'Pasay': [14.5378, 121.0014], 'Valenzuela': [14.7011, 120.9830], 'Las Piñas': [14.4453, 120.9830],
    'Muntinlupa': [14.4082, 121.0437], 'Malabon': [14.6625, 120.9628], 'Navotas': [14.6667, 120.9500],
    'San Juan': [14.6019, 121.0355], 'Pateros': [14.5447, 121.0681],
    'Antipolo': [14.5865, 121.1764], 'Biñan': [14.3387, 121.0814], 'Bacoor': [14.4624, 120.9645],
    'Santa Rosa': [14.3123, 121.1114], 'Batangas City': [13.7565, 121.0583], 'Lucena': [13.9317, 121.6179],
    'Dasmariñas': [14.3294, 120.9367], 'Imus': [14.4297, 120.9367], 'General Trias': [14.3867, 120.8817],
    'San Pedro': [14.3583, 121.0472], 'Lipa': [13.9411, 121.1608], 'Tanauan': [14.0859, 121.1508],
    'Baguio': [16.4023, 120.5960], 'San Fernando': [15.0289, 120.6899], 'Angeles': [15.1450, 120.5887],
    'Malolos': [14.8527, 120.8110], 'Meycauayan': [14.7356, 120.9597], 'San Jose del Monte': [14.8138, 121.0458],
    'Cabanatuan': [15.4892, 120.9709], 'Olongapo': [14.8296, 120.2842], 'Laoag': [18.1977, 120.5936],
    'Vigan': [17.5747, 120.3869], 'Tuguegarao': [17.6132, 121.7270], 'Legazpi': [13.1391, 123.7437],
    'Naga': [13.6192, 123.1814], 'Cebu City': [10.3157, 123.8854], 'Mandaue': [10.3236, 123.9223],
    'Lapu-Lapu': [10.3103, 123.9494], 'Talisay': [10.2443, 123.8495], 'Bacolod': [10.6767, 122.9570],
    'Iloilo City': [10.7202, 122.5621], 'Tacloban': [11.2442, 125.0036], 'Dumaguete': [9.3068, 123.3054],
    'Tagbilaran': [9.6500, 123.8500], 'Roxas City': [11.5858, 122.7514], 'Ormoc': [11.0054, 124.6079],
    'Davao City': [7.1907, 125.4553], 'Cagayan de Oro': [8.4542, 124.6319], 'Zamboanga City': [6.9214, 122.0790],
    'General Santos': [6.1164, 125.1716], 'Iligan': [8.2280, 124.2452], 'Butuan': [8.9475, 125.5406],
    'Cotabato City': [7.2236, 124.2530], 'Pagadian': [7.8277, 123.4367], 'Tagum': [7.4478, 125.8078],
    'Metro Manila': [14.5995, 120.9842], 'Cavite': [14.2456, 120.8786], 'Laguna': [14.2691, 121.4113],
    'Rizal': [14.6037, 121.3084], 'Bulacan': [14.7942, 120.8796], 'Pampanga': [15.0794, 120.6200],
    'Cebu': [10.3157, 123.8854], 'Iloilo': [10.7202, 122.5621], 'Negros Occidental': [10.6767, 122.9570],
    'Negros Oriental': [9.3068, 123.3054], 'Leyte': [10.8620, 124.8811], 'Samar': [11.2442, 125.0036],
    'Davao del Sur': [7.1907, 125.4553], 'Misamis Oriental': [8.4542, 124.6319], 'Lanao del Norte': [8.2280, 124.2452],
  };

  const getCoords = (city: string, province: string): [number, number] | null => {
    return PH_COORDS[city] || PH_COORDS[province] || null;
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
    <SalesLayout title="Analytics">
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gold-400" size={20} />
            <span className="text-white font-medium">Sales Analytics</span>
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
                <p className="text-gray-500 text-xs mb-4">Orders by day of week and time of day</p>
                {analytics.hourly ? (() => {
                  const max = getMaxHeatmapValue();
                  const peak = analytics.hourly!.reduce((a, b) => a.order_count >= b.order_count ? a : b, analytics.hourly![0]);
                  return (
                    <div className="overflow-x-auto">
                      <div style={{ minWidth: 520 }}>
                        <div className="flex items-center mb-1" style={{ marginLeft: 36 }}>
                          {allHours.map(h => (
                            <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: 9 }} className="text-gray-500">
                              {hourTickLabels[h] ?? null}
                            </div>
                          ))}
                        </div>
                        {dayLabels.map((day, dayIndex) => (
                          <div key={day} className="flex items-center mb-0.5" style={{ gap: 2 }}>
                            <div style={{ width: 34, fontSize: 11 }} className="text-gray-400 shrink-0 text-right pr-1">{day}</div>
                            {allHours.map((hour) => {
                              const value = getHeatmapValue(dayIndex + 1, hour);
                              const revenue = getHeatmapRevenue(dayIndex + 1, hour);
                              const isPeak = peak && peak.day_of_week === dayIndex + 1 && peak.hour === hour && value > 0;
                              return (
                                <div
                                  key={hour}
                                  style={{ flex: 1, height: 28, borderRadius: 4, position: 'relative', cursor: 'default', outline: isPeak ? '2px solid #F59E0B' : 'none', outlineOffset: 1, ...getHeatmapColor(value, max) }}
                                  className="group transition-transform hover:scale-110 hover:z-10"
                                >
                                  {value > 0 && (
                                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: value / max > 0.5 ? '#000' : '#F59E0B', fontWeight: 700, pointerEvents: 'none' }}>
                                      {value}
                                    </span>
                                  )}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 pointer-events-none">
                                    <div className="bg-black-800 border border-gold-500/30 rounded px-2 py-1 text-center whitespace-nowrap" style={{ fontSize: 11 }}>
                                      <p className="text-gray-300">{day} {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}</p>
                                      <p><span className="text-gold-400 font-bold">{value}</span> <span className="text-gray-400">orders</span></p>
                                      {revenue > 0 && <p className="text-green-400">{formatCurrency(revenue)}</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {peak && peak.order_count > 0 && (
                              <span className="text-xs text-gold-400">
                                ⚡ Peak: {dayLabels[peak.day_of_week - 1]} {peak.hour === 0 ? '12am' : peak.hour < 12 ? `${peak.hour}am` : peak.hour === 12 ? '12pm' : `${peak.hour - 12}pm`} ({peak.order_count} orders)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">0</span>
                            {[0.1, 0.3, 0.55, 0.75, 1].map(t => {
                              const r = Math.round(31 + t * (245 - 31));
                              const g = Math.round(31 + t * (158 - 31));
                              const b = Math.round(31 + t * (11 - 31));
                              return <div key={t} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: t === 0.1 ? 'rgba(31,31,31,0.8)' : `rgb(${r},${g},${b})` }} />;
                            })}
                            <span className="text-xs text-gray-500">High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-48 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No order activity data yet</p>
                      <p className="text-xs mt-1">Data will appear as orders come in</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Frequent Order Locations (Map) */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin size={20} className="text-gold-400" />
                  Frequent Order Locations
                </h3>
                <p className="text-gray-500 text-xs mb-4">Order volume by city — bubble size reflects order count</p>
                {analytics.locationData && analytics.locationData.length > 0 ? (() => {
                  const maxOrders = getMaxLocationOrders();
                  const mappable = (analytics.locationData ?? [])
                    .map(loc => ({ ...loc, coords: getCoords(loc.city, loc.province) }))
                    .filter(loc => loc.coords !== null) as Array<{ city: string; province: string; order_count: number; total_revenue: number; coords: [number, number] }>;
                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ height: 300 }}>
                        <MapContainer
                          center={[12.5, 122.0]}
                          zoom={6}
                          style={{ height: '100%', width: '100%', background: '#111' }}
                          scrollWheelZoom={false}
                          attributionControl={false}
                        >
                          <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com">CARTO</a>'
                          />
                          {mappable.map((loc) => {
                            const intensity = loc.order_count / maxOrders;
                            const radius = 8 + intensity * 22;
                            const color = intensity > 0.75 ? '#F59E0B' : intensity > 0.5 ? '#B45309' : intensity > 0.25 ? '#92400E' : '#78350F';
                            return (
                              <CircleMarker
                                key={`${loc.city}-${loc.province}`}
                                center={loc.coords}
                                radius={radius}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 1.5 }}
                              >
                                <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                                  <div className="text-xs leading-tight" style={{ minWidth: 130 }}>
                                    <p className="font-bold text-sm">{loc.city}</p>
                                    <p className="text-gray-300">{loc.province}</p>
                                    <p className="mt-1">🛒 {loc.order_count} orders</p>
                                    <p>💰 ₱{parseFloat(String(loc.total_revenue)).toLocaleString()}</p>
                                  </div>
                                </Tooltip>
                              </CircleMarker>
                            );
                          })}
                        </MapContainer>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-800 opacity-80" />
                          <div className="w-4 h-4 rounded-full bg-yellow-600 opacity-80" />
                          <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
                          <span className="text-xs text-gray-500 ml-1">Low → High volume</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto max-w-full pb-1">
                          {analytics.locationData.slice(0, 5).map((loc, i) => (
                            <div key={i} className="flex items-center gap-1 whitespace-nowrap">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                                i === 0 ? 'bg-gold-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-black-700 text-gray-400'
                              }`}>{i + 1}</span>
                              <span className="text-xs text-gray-300">{loc.city}</span>
                              <span className="text-xs text-gold-400 font-medium">·{loc.order_count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
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
    </SalesLayout>
  );
};

export default SalesAnalytics;

