import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_BASE_URL } from '../services/api';
import { 
  Warehouse,
  Package,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  X,
  Check,
  Clock,
  MapPin,
  Building2,
  Truck,
  ClipboardList,
  History,
  ChevronDown,
  Plus,
  Edit3,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';
import inventoryService, { 
  Branch, 
  StockLevel, 
  InventoryTransaction, 
  StockAlert,
  DashboardStats 
} from '../services/inventoryService';
import { productService, Product } from '../services/productServicePHP';

type ModalType = 'stock-in' | 'stock-out' | 'transfer' | 'adjustment' | null;
type TabType = 'overview' | 'stock-levels' | 'transactions' | 'branches';

const SalesInventory = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  
  // Modals
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevel | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    branch_id: 0,
    product_id: 0,
    quantity: 0,
    source_branch_id: 0,
    destination_branch_id: 0,
    new_quantity: 0,
    reason: '',
    remarks: '',
    reference_number: '',
    supplier: '',
    unit_cost: 0,
    immediate: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth check
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

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'stock-levels') {
      loadStockLevels();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, selectedBranch, transactionTypeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchesData, statsData, alertsData, productsResponse] = await Promise.all([
        inventoryService.getBranches(),
        inventoryService.getDashboardStats(),
        inventoryService.getAlerts(),
        productService.getProducts(),
      ]);
      setBranches(branchesData);
      setStats(statsData);
      setAlerts(alertsData);
      setProducts(productsResponse.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockLevels = async () => {
    try {
      const data = await inventoryService.getStockLevels(selectedBranch || undefined);
      setStockLevels(data);
    } catch (err: any) {
      console.error('Failed to load stock levels:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const type = transactionTypeFilter === 'all' ? undefined : transactionTypeFilter;
      const data = await inventoryService.getTransactions(100, type, selectedBranch || undefined);
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    }
  };

  // Open modal with pre-selected data
  const openModal = (type: ModalType, stockLevel?: StockLevel) => {
    setActiveModal(type);
    setFormError(null);
    if (stockLevel) {
      setSelectedStockLevel(stockLevel);
      setFormData({
        ...formData,
        branch_id: stockLevel.branch_id,
        product_id: stockLevel.product_id,
        source_branch_id: stockLevel.branch_id,
        new_quantity: stockLevel.quantity,
      });
    } else {
      setSelectedStockLevel(null);
      setFormData({
        branch_id: branches[0]?.id || 0,
        product_id: products[0]?.id || 0,
        quantity: 0,
        source_branch_id: 0,
        destination_branch_id: 0,
        new_quantity: 0,
        reason: '',
        remarks: '',
        reference_number: '',
        supplier: '',
        unit_cost: 0,
        immediate: true,
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStockLevel(null);
    setFormError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      switch (activeModal) {
        case 'stock-in':
          if (!formData.branch_id || !formData.product_id || formData.quantity <= 0) {
            throw new Error('Please fill in all required fields');
          }
          await inventoryService.stockIn({
            branch_id: formData.branch_id,
            product_id: formData.product_id,
            quantity: formData.quantity,
            supplier: formData.supplier || undefined,
            unit_cost: formData.unit_cost || undefined,
            reference_number: formData.reference_number || undefined,
            remarks: formData.remarks || undefined,
            reason: formData.reason || 'Stock received',
          });
          break;

        case 'stock-out':
          if (!formData.branch_id || !formData.product_id || formData.quantity <= 0 || !formData.reason) {
            throw new Error('Please fill in all required fields including reason');
          }
          await inventoryService.stockOut({
            branch_id: formData.branch_id,
            product_id: formData.product_id,
            quantity: formData.quantity,
            reason: formData.reason,
            remarks: formData.remarks || undefined,
            reference_number: formData.reference_number || undefined,
          });
          break;

        case 'transfer':
          if (!formData.source_branch_id || !formData.destination_branch_id || !formData.product_id || formData.quantity <= 0) {
            throw new Error('Please fill in all required fields');
          }
          if (formData.source_branch_id === formData.destination_branch_id) {
            throw new Error('Source and destination must be different');
          }
          await inventoryService.transferStock({
            source_branch_id: formData.source_branch_id,
            destination_branch_id: formData.destination_branch_id,
            product_id: formData.product_id,
            quantity: formData.quantity,
            reason: formData.reason || undefined,
            remarks: formData.remarks || undefined,
            immediate: formData.immediate,
          });
          break;

        case 'adjustment':
          if (!formData.branch_id || !formData.product_id || !formData.reason) {
            throw new Error('Please fill in all required fields');
          }
          await inventoryService.adjustStock({
            branch_id: formData.branch_id,
            product_id: formData.product_id,
            new_quantity: formData.new_quantity,
            reason: formData.reason,
            remarks: formData.remarks || undefined,
          });
          break;
      }

      closeModal();
      loadData();
      if (activeTab === 'stock-levels') loadStockLevels();
      if (activeTab === 'transactions') loadTransactions();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter stock levels
  const filteredStockLevels = stockLevels.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.product_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.branch_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">In Stock</span>;
      case 'low_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Low Stock</span>;
      case 'out_of_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Out of Stock</span>;
      case 'overstock':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Overstock</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'stock_in':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400"><PackagePlus size={12} /> Stock In</span>;
      case 'stock_out':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400"><PackageMinus size={12} /> Stock Out</span>;
      case 'transfer':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400"><ArrowLeftRight size={12} /> Transfer</span>;
      case 'adjustment':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400"><Edit3 size={12} /> Adjustment</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">{type}</span>;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400"><CheckCircle size={12} /> Completed</span>;
      case 'in_transit':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400"><Truck size={12} /> In Transit</span>;
      case 'pending':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400"><Clock size={12} /> Pending</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black-950 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <SalesLayout title="Inventory Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm sm:text-base text-gray-400">
              Track stock levels, manage transfers, and monitor inventory across all branches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={() => openModal('stock-in')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-500 transition-colors"
            >
              <PackagePlus size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden min-[400px]:inline">Stock</span> In
            </button>
            <button 
              onClick={() => openModal('stock-out')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500 transition-colors"
            >
              <PackageMinus size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden min-[400px]:inline">Stock</span> Out
            </button>
            <button 
              onClick={() => openModal('transfer')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              <ArrowLeftRight size={14} className="sm:w-[18px] sm:h-[18px]" />
              Transfer
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'stock-levels', label: 'Stock Levels', shortLabel: 'Stock', icon: Package },
            { id: 'transactions', label: 'Transactions', shortLabel: 'History', icon: History },
            { id: 'branches', label: 'Branches', icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-black'
                  : 'bg-black-800 text-gray-400 hover:bg-black-700 hover:text-white'
              }`}
            >
              <tab.icon size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-gold-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] sm:text-xs">Inventory Value</p>
                <p className="text-base sm:text-xl font-bold text-white">₱{(stats.total_value / 1000000).toFixed(2)}M</p>
              </div>
              
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Warehouse className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] sm:text-xs">Total Units</p>
                <p className="text-base sm:text-xl font-bold text-white">{stats.total_units.toLocaleString()}</p>
              </div>

              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Package className="text-green-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] sm:text-xs">In Stock</p>
                <p className="text-base sm:text-xl font-bold text-green-400">{stats.stock_status.in_stock}</p>
              </div>

              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] sm:text-xs">Low Stock</p>
                <p className="text-base sm:text-xl font-bold text-yellow-400">{stats.stock_status.low_stock}</p>
              </div>

              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <XCircle className="text-red-400" size={20} />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Out of Stock</p>
                <p className="text-xl font-bold text-red-400">{stats.stock_status.out_of_stock}</p>
              </div>

              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="text-purple-400" size={20} />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Branches</p>
                <p className="text-xl font-bold text-white">{stats.branch_count}</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alerts */}
              <div className="lg:col-span-2 bg-black-900 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-yellow-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">Stock Alerts</h3>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    {alerts.length} alerts
                  </span>
                </div>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No stock alerts at this time</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-black-800 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            alert.alert_type === 'out_of_stock' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{alert.product_name}</p>
                            <p className="text-xs text-gray-400">
                              {alert.branch_name} • {alert.alert_type === 'out_of_stock' ? 'Out of stock' : `${alert.current_quantity} left (min: ${alert.threshold_quantity})`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setFormData({
                              ...formData,
                              branch_id: alert.branch_id,
                              product_id: alert.product_id,
                            });
                            openModal('stock-in');
                          }}
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-black rounded-lg text-xs font-medium hover:bg-gold-400 transition-colors"
                        >
                          <PackagePlus size={12} />
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Transfers */}
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="text-blue-400" size={20} />
                  <h3 className="text-lg font-semibold text-white">Pending Transfers</h3>
                </div>
                
                {stats.pending_transfers === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No pending transfers</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-blue-400">{stats.pending_transfers}</p>
                    <p className="text-gray-400 text-sm mt-1">transfers in transit</p>
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="mt-4 text-gold-500 text-sm hover:text-gold-400"
                    >
                      View Details →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stock Levels Tab */}
        {activeTab === 'stock-levels' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold text-white">Stock Levels by Branch</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 w-48"
                    />
                  </div>
                  <select
                    value={selectedBranch || ''}
                    onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-500/20">
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Product</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Branch</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Stock</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Min/Max</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Last Restocked</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockLevels.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No stock data found
                        </td>
                      </tr>
                    ) : (
                      filteredStockLevels.map((item) => (
                        <tr key={item.id} className="border-b border-gold-500/10 hover:bg-black-800/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {item.product_image && (
                                <img 
                                  src={item.product_image.startsWith('http') ? item.product_image : `${IMAGE_BASE_URL}${item.product_image}`}
                                  alt={item.product_name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="text-white font-medium text-sm">{item.product_name}</p>
                                <p className="text-gray-500 text-xs">{item.product_sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {item.is_warehouse && <Warehouse size={14} className="text-blue-400" />}
                              <span className="text-white text-sm">{item.branch_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-bold text-lg ${
                              item.quantity === 0 ? 'text-red-400' : 
                              item.quantity <= item.min_stock_level ? 'text-yellow-400' : 'text-white'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-sm">
                            {item.min_stock_level} / {item.max_stock_level}
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(item.stock_status)}
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-sm">
                            {item.last_restocked ? new Date(item.last_restocked).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => openModal('stock-in', item)}
                                className="p-1.5 text-gray-400 hover:text-green-500 transition-colors" 
                                title="Stock In"
                              >
                                <PackagePlus size={16} />
                              </button>
                              <button 
                                onClick={() => openModal('stock-out', item)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" 
                                title="Stock Out"
                              >
                                <PackageMinus size={16} />
                              </button>
                              <button 
                                onClick={() => openModal('transfer', item)}
                                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" 
                                title="Transfer"
                              >
                                <ArrowLeftRight size={16} />
                              </button>
                              <button 
                                onClick={() => openModal('adjustment', item)}
                                className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors" 
                                title="Adjust"
                              >
                                <Edit3 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={transactionTypeFilter}
                    onChange={(e) => setTransactionTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="all">All Types</option>
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                    <option value="transfer">Transfer</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                  <select
                    value={selectedBranch || ''}
                    onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-500/20">
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Transaction</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Type</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Product</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Quantity</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Location</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-gold-500/10 hover:bg-black-800/50">
                          <td className="py-3 px-3">
                            <p className="text-white font-mono text-sm">{txn.transaction_code}</p>
                            {txn.reference_number && (
                              <p className="text-gray-500 text-xs">Ref: {txn.reference_number}</p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {getTransactionTypeBadge(txn.transaction_type)}
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-white text-sm">{txn.product_name}</p>
                            <p className="text-gray-500 text-xs">{txn.product_sku}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-bold ${
                              txn.transaction_type === 'stock_in' ? 'text-green-400' : 
                              txn.transaction_type === 'stock_out' ? 'text-red-400' : 'text-white'
                            }`}>
                              {txn.transaction_type === 'stock_in' ? '+' : txn.transaction_type === 'stock_out' ? '-' : ''}{txn.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {txn.transaction_type === 'transfer' ? (
                              <div className="flex items-center gap-1 text-gray-300">
                                <span>{txn.source_branch_code}</span>
                                <ArrowLeftRight size={12} className="text-blue-400" />
                                <span>{txn.destination_branch_code}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">{txn.branch_name || txn.source_branch_name}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {getTransactionStatusBadge(txn.status)}
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-sm">
                            {new Date(txn.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-black-900 border border-gold-500/20 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        branch.is_warehouse ? 'bg-blue-500/20' : 'bg-gold-500/20'
                      }`}>
                        {branch.is_warehouse ? (
                          <Warehouse className="text-blue-400" size={24} />
                        ) : (
                          <Building2 className="text-gold-400" size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{branch.name}</h4>
                        <p className="text-gray-500 text-sm font-mono">{branch.code}</p>
                      </div>
                    </div>
                    {branch.is_warehouse && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Warehouse
                      </span>
                    )}
                  </div>
                  
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  
                  {branch.contact_person && (
                    <div className="text-sm text-gray-400">
                      <p>Contact: {branch.contact_person}</p>
                      {branch.contact_phone && <p>{branch.contact_phone}</p>}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gold-500/10">
                    <button 
                      onClick={() => {
                        setSelectedBranch(branch.id);
                        setActiveTab('stock-levels');
                      }}
                      className="text-gold-500 text-sm hover:text-gold-400"
                    >
                      View Stock Levels →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm" 
              onClick={closeModal} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-gradient-to-br from-black-900 via-black-900 to-black-800 border border-gold-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b border-gold-500/20 ${
                activeModal === 'stock-in' ? 'bg-gradient-to-r from-green-500/10 to-transparent' :
                activeModal === 'stock-out' ? 'bg-gradient-to-r from-red-500/10 to-transparent' :
                activeModal === 'transfer' ? 'bg-gradient-to-r from-blue-500/10 to-transparent' :
                'bg-gradient-to-r from-purple-500/10 to-transparent'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeModal === 'stock-in' ? 'bg-green-500/20' :
                    activeModal === 'stock-out' ? 'bg-red-500/20' :
                    activeModal === 'transfer' ? 'bg-blue-500/20' :
                    'bg-purple-500/20'
                  }`}>
                    {activeModal === 'stock-in' && <PackagePlus size={20} className="text-green-400" />}
                    {activeModal === 'stock-out' && <PackageMinus size={20} className="text-red-400" />}
                    {activeModal === 'transfer' && <ArrowLeftRight size={20} className="text-blue-400" />}
                    {activeModal === 'adjustment' && <Edit3 size={20} className="text-purple-400" />}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {activeModal === 'stock-in' && 'Receive Stock'}
                    {activeModal === 'stock-out' && 'Remove Stock'}
                    {activeModal === 'transfer' && 'Transfer Stock'}
                    {activeModal === 'adjustment' && 'Adjust Stock'}
                  </h3>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {/* Branch Selection */}
                {(activeModal === 'stock-in' || activeModal === 'stock-out' || activeModal === 'adjustment') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Branch *</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value={0}>Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Transfer: Source and Destination */}
                {activeModal === 'transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">From Branch *</label>
                      <select
                        value={formData.source_branch_id}
                        onChange={(e) => setFormData({ ...formData, source_branch_id: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      >
                        <option value={0}>Select Source Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">To Branch *</label>
                      <select
                        value={formData.destination_branch_id}
                        onChange={(e) => setFormData({ ...formData, destination_branch_id: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      >
                        <option value={0}>Select Destination Branch</option>
                        {branches.filter(b => b.id !== formData.source_branch_id).map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value={0}>Select Product</option>
                    {(products || []).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                {activeModal !== 'adjustment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}

                {/* Adjustment: New Quantity */}
                {activeModal === 'adjustment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Quantity * 
                      {selectedStockLevel && (
                        <span className="text-gray-500 ml-2">(Current: {selectedStockLevel.quantity})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.new_quantity}
                      onChange={(e) => setFormData({ ...formData, new_quantity: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      placeholder="Enter new quantity"
                    />
                  </div>
                )}

                {/* Stock In: Supplier & Cost */}
                {activeModal === 'stock-in' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Supplier</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Unit Cost (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_cost || ''}
                        onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        placeholder="Cost per unit"
                      />
                    </div>
                  </>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Reason {(activeModal === 'stock-out' || activeModal === 'adjustment') ? '*' : ''}
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">Select Reason</option>
                    {activeModal === 'stock-in' && (
                      <>
                        <option value="Purchase order received">Purchase order received</option>
                        <option value="Customer return">Customer return</option>
                        <option value="Transfer received">Transfer received</option>
                        <option value="Initial stock">Initial stock</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {activeModal === 'stock-out' && (
                      <>
                        <option value="Sold">Sold</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Expired">Expired</option>
                        <option value="Lost">Lost</option>
                        <option value="Sample/Tester">Sample/Tester</option>
                        <option value="Return to supplier">Return to supplier</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {activeModal === 'transfer' && (
                      <>
                        <option value="Branch request">Branch request</option>
                        <option value="Stock balancing">Stock balancing</option>
                        <option value="Promotional event">Promotional event</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {activeModal === 'adjustment' && (
                      <>
                        <option value="Physical count correction">Physical count correction</option>
                        <option value="System error correction">System error correction</option>
                        <option value="Inventory audit">Inventory audit</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    placeholder="PO#, Invoice#, etc."
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Transfer: Immediate toggle */}
                {activeModal === 'transfer' && (
                  <div className="flex items-center gap-3 p-3 bg-black-800 rounded-lg">
                    <input
                      type="checkbox"
                      id="immediate"
                      checked={formData.immediate}
                      onChange={(e) => setFormData({ ...formData, immediate: e.target.checked })}
                      className="w-5 h-5 rounded border-gold-500/30 bg-black-700 text-gold-500 focus:ring-gold-500"
                    />
                    <label htmlFor="immediate" className="text-sm text-gray-300">
                      <span className="font-medium">Immediate Transfer</span>
                      <p className="text-gray-500 text-xs">Stock will be added to destination immediately</p>
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gold-500/20">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-black-700 text-gray-300 rounded-lg hover:bg-black-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    activeModal === 'stock-in' ? 'bg-green-600 hover:bg-green-500 text-white' :
                    activeModal === 'stock-out' ? 'bg-red-600 hover:bg-red-500 text-white' :
                    activeModal === 'transfer' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                    'bg-purple-600 hover:bg-purple-500 text-white'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {activeModal === 'stock-in' && 'Receive Stock'}
                      {activeModal === 'stock-out' && 'Remove Stock'}
                      {activeModal === 'transfer' && 'Transfer Stock'}
                      {activeModal === 'adjustment' && 'Apply Adjustment'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </SalesLayout>
  );
};

export default SalesInventory;
