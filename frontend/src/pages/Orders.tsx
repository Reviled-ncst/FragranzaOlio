import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Eye, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  ShoppingBag,
  RefreshCw,
  FileText,
  Download,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Store,
  Bike,
  Car,
  AlertCircle,
  Search,
  Filter,
  X,
  Copy,
  CheckCheck,
  RotateCcw,
  PackageCheck,
  CircleDot,
  Undo2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import orderService, { Order, OrderStatus, Invoice } from '../services/orderService';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  ordered: { label: 'Ordered', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  paid_waiting_approval: { label: 'Payment Verification', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  cod_waiting_approval: { label: 'Awaiting Confirmation', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  paid_ready_pickup: { label: 'Ready for Pickup', icon: Store, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  processing: { label: 'Processing', icon: Package, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  in_transit: { label: 'In Transit', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  waiting_client: { label: 'Awaiting Client', icon: MapPin, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  delivered: { label: 'Delivered', icon: PackageCheck, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  picked_up: { label: 'Picked Up', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-600/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  return_requested: { label: 'Return Requested', icon: RotateCcw, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  return_approved: { label: 'Return Approved', icon: CircleDot, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  returned: { label: 'Returned', icon: Undo2, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  refund_requested: { label: 'Refund Requested', icon: RotateCcw, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  refunded: { label: 'Refunded', icon: RotateCcw, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  // Fetch orders on load
  useEffect(() => {
    const fetchOrders = async () => {
      console.log('📦 Orders: Starting fetch, user:', user?.email);
      
      if (!user?.email) {
        console.log('📦 Orders: No user email, skipping fetch');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('📦 Orders: Calling getMyOrders with email:', user.email);
        const response = await orderService.getMyOrders(user.email);
        console.log('📦 Orders: API Response:', response);
        
        if (response.success) {
          console.log('📦 Orders: Loaded', response.data?.length || 0, 'orders');
          setOrders(response.data || []);
          setFilteredOrders(response.data || []);
        } else {
          console.error('📦 Orders: Response not successful');
          setError('Failed to load orders');
        }
      } catch (err) {
        console.error('📦 Orders: Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.items?.some(item => item.product_name.toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  // Load invoice for order
  const loadInvoice = async (orderId: number) => {
    setIsLoadingInvoice(true);
    try {
      const response = await orderService.getInvoice(orderId);
      if (response.success && response.data) {
        setSelectedInvoice(response.data);
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  // Copy order number
  const copyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderNumber(orderNumber);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  // Refresh orders
  const refreshOrders = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const response = await orderService.getMyOrders(user.email);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Print invoice - opens in new window for reliable printing
  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${selectedOrder.invoice_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #fff; color: #000; padding: 32px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #9ca3af; padding-bottom: 24px; }
    .header h1 { font-size: 28px; font-weight: bold; font-family: 'Playfair Display', serif; }
    .header .invoice-num { color: #374151; margin-top: 4px; font-size: 16px; }
    .company { text-align: right; }
    .company img { width: 80px; height: auto; margin-bottom: 8px; }
    .company h2 { font-size: 20px; font-weight: bold; font-family: 'Playfair Display', serif; }
    .company .tagline { color: #4b5563; font-size: 14px; margin: 4px 0; font-family: 'Poppins', sans-serif; }
    .company .address { color: #6b7280; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .info-grid h3 { font-weight: 600; margin-bottom: 8px; font-family: 'Playfair Display', serif; }
    .info-grid p { color: #4b5563; font-size: 14px; margin: 4px 0; }
    .info-grid .customer-name { color: #1f2937; }
    .info-right { text-align: right; }
    .info-right span { font-weight: 600; }
    table { width: 100%; margin-bottom: 32px; border-collapse: collapse; }
    th { text-align: left; padding: 8px 0; font-weight: 600; border-bottom: 2px solid #9ca3af; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    td:nth-child(2) { text-align: center; color: #374151; }
    td:nth-child(3) { text-align: right; color: #374151; }
    td:nth-child(4) { text-align: right; font-weight: 500; }
    .variation { color: #6b7280; font-size: 14px; margin-top: 4px; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-box { width: 240px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; color: #4b5563; }
    .totals-row.discount { color: #16a34a; }
    .totals-row.total { border-top: 2px solid #9ca3af; font-weight: bold; font-size: 18px; color: #000; }
    .qr-section { display: flex; align-items: center; gap: 20px; margin-top: 32px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; }
    .qr-code img { width: 120px; height: 120px; }
    .qr-info { flex: 1; }
    .qr-title { font-weight: 600; font-size: 16px; color: #000; margin-bottom: 4px; }
    .qr-order { color: #4b5563; font-size: 14px; margin-bottom: 8px; }
    .qr-hint { color: #6b7280; font-size: 12px; }
    .reminder { display: flex; align-items: flex-start; gap: 12px; margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #f59e0b; }
    .reminder-icon { font-size: 24px; }
    .reminder-text { color: #92400e; font-size: 13px; line-height: 1.5; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #9ca3af; text-align: center; color: #6b7280; font-size: 14px; }
    .footer .thanks { font-family: 'Poppins', sans-serif; }
    @media print { body { padding: 0; } @page { margin: 0.5in; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p class="invoice-num">#${selectedOrder.invoice_number}</p>
    </div>
    <div class="company">
      <img src="${window.location.origin}/assets/images/Fragranza LOGO.png" alt="Fragranza Logo" />
      <h2>Fragranza Olio</h2>
      <p class="tagline">Premium Perfumes & Cosmetics</p>
      <p class="address">Blk 16 Lot1-A Brgy San Dionisio</p>
      <p class="address">Dasmariñas, Cavite</p>
    </div>
  </div>
  
  <div class="info-grid">
    <div>
      <h3>Bill To:</h3>
      <p class="customer-name">${selectedOrder.customer_name}</p>
      <p>${selectedOrder.shipping_address}</p>
      ${selectedOrder.customer_phone ? `<p>${selectedOrder.customer_phone}</p>` : ''}
    </div>
    <div class="info-right">
      <p><span>Order:</span> #${selectedOrder.order_number}</p>
      <p><span>Date:</span> ${new Date(selectedOrder.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="text-transform: capitalize;"><span>Payment:</span> ${selectedOrder.payment_method?.replace('_', ' ')}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${selectedOrder.items?.map(item => `
        <tr>
          <td>
            ${item.product_name}
            ${item.variation ? `<div class="variation">${item.variation}</div>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>₱${item.price?.toLocaleString()}</td>
          <td>₱${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>₱${(selectedOrder.subtotal || 0).toLocaleString()}</span>
      </div>
      <div class="totals-row">
        <span>Shipping</span>
        <span>${selectedOrder.shipping_fee === 0 ? 'FREE' : `₱${(selectedOrder.shipping_fee || 0).toLocaleString()}`}</span>
      </div>
      ${selectedOrder.discount_amount > 0 ? `
        <div class="totals-row discount">
          <span>Discount</span>
          <span>-₱${selectedOrder.discount_amount.toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total</span>
        <span>₱${(selectedOrder.total_amount || 0).toLocaleString()}</span>
      </div>
    </div>
  </div>
  
  <!-- QR Code Section -->
  <div class="qr-section">
    <div class="qr-code">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`FRAGRANZA|${selectedOrder.order_number}|${selectedOrder.invoice_number}|${selectedOrder.total_amount}|${selectedOrder.customer_name}`)}" alt="Order QR Code" />
    </div>
    <div class="qr-info">
      <p class="qr-title">Scan to Verify</p>
      <p class="qr-order">Order: ${selectedOrder.order_number}</p>
      <p class="qr-hint">Present this QR code to the cashier for pickup verification</p>
    </div>
  </div>
  
  <!-- Important Reminder -->
  <div class="reminder">
    <p class="reminder-icon">📱</p>
    <p class="reminder-text"><strong>Important:</strong> Please save or screenshot this invoice. Show the QR code to our cashier when picking up your order for quick transaction completion.</p>
  </div>
  
  <div class="footer">
    <p class="thanks">Thank you for shopping with Fragranza Olio!</p>
    <p style="margin-top: 4px;">For questions, contact us at fragranzaolio@gmail.com</p>
  </div>
  
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    }
  };

  // View invoice
  const handleViewInvoice = () => {
    setShowInvoice(true);
  };

  // Back to order details
  const handleBackToOrder = () => {
    setShowInvoice(false);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
    setShowInvoice(false);
  };

  // Open order details
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setSelectedInvoice(null);
    setShowInvoice(false);
    if (order.invoice_id) {
      loadInvoice(order.id);
    }
  };

  // Get vehicle/shipping icon
  const getShippingIcon = (method?: string, vehicleType?: string) => {
    if (method === 'store_pickup') return Store;
    switch (vehicleType) {
      case 'motorcycle': return Bike;
      case 'sedan': 
      case 'mpv': return Car;
      case 'pickup_truck': return Truck;
      default: return Package;
    }
  };

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-16 lg:py-20"
          >
            <Package className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">Sign in to view your orders</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
              Please sign in to your account to view your order history and track your deliveries.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors"
            >
              Sign In
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
      <div className={`container-custom px-4 sm:px-6 ${isPrinting ? 'no-print' : ''}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gold-500" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white">My Orders</h1>
          </div>
          
          <button
            onClick={refreshOrders}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black-900 border border-gold-500/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="appearance-none bg-black-900 border border-gold-500/20 rounded-lg pl-10 pr-10 py-2.5 text-white focus:border-gold-500/50 focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="ordered">Ordered</option>
              <option value="paid_waiting_approval">Payment Verification</option>
              <option value="cod_waiting_approval">Awaiting Confirmation</option>
              <option value="paid_ready_pickup">Ready for Pickup</option>
              <option value="processing">Processing</option>
              <option value="in_transit">In Transit</option>
              <option value="waiting_client">Awaiting Client</option>
              <option value="delivered">Delivered</option>
              <option value="picked_up">Picked Up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="return_requested">Return Requested</option>
              <option value="return_approved">Return Approved</option>
              <option value="returned">Returned</option>
              <option value="refund_requested">Refund Requested</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={refreshOrders}
              className="ml-auto text-red-400 hover:text-red-300 underline text-sm"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-16 lg:py-20"
          >
            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">
              {orders.length === 0 ? 'No orders yet' : 'No orders found'}
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {orders.length === 0 
                ? "You haven't placed any orders yet. Start shopping and your order history will appear here."
                : "No orders match your search or filter criteria."}
            </p>
            {orders.length === 0 ? (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors"
              >
                Start Shopping
                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
              </Link>
            ) : (
              <button
                onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                className="text-gold-500 hover:text-gold-400 underline"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Orders List */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order, index) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock;
              const statusStyle = statusConfig[order.status] || statusConfig.ordered;
              const ShippingIcon = getShippingIcon(order.shipping_method, order.vehicle_type);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-black-900 border border-gold-500/20 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-gold-500/40 transition-colors"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${statusStyle.bgColor} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${statusStyle.color}`} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm sm:text-base text-white font-semibold">
                            Order #{order.order_number}
                          </p>
                          <button
                            onClick={() => copyOrderNumber(order.order_number)}
                            className="text-gray-500 hover:text-gold-500 transition-colors"
                            title="Copy order number"
                          >
                            {copiedOrderNumber === order.order_number ? (
                              <CheckCheck size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString('en-PH', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${statusStyle.bgColor} ${statusStyle.color}`}>
                        <StatusIcon size={14} />
                        {statusStyle.label}
                      </span>
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gold-500 hover:text-gold-400 transition-colors"
                      >
                        <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <ShippingIcon size={14} />
                    <span>
                      {order.shipping_method === 'store_pickup' 
                        ? 'Store Pickup' 
                        : `Delivery - ${order.vehicle_type?.replace('_', ' ') || 'Standard'}`}
                    </span>
                    {order.tracking_number && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span>Tracking: {order.tracking_number}</span>
                      </>
                    )}
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {order.items?.slice(0, 4).map(item => (
                      <div key={item.id} className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-black-800 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items && order.items.length > 4 && (
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-black-800 rounded-lg flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold-500/10">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gold-500 text-sm sm:text-base font-semibold">
                      Total: ₱{(order.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Order Details Modal */}
        <AnimatePresence>
          {selectedOrder && !showInvoice && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white mb-1">
                      Order #{selectedOrder.order_number}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Status Banner */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-6 ${statusConfig[selectedOrder.status]?.bgColor}`}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedOrder.status]?.icon || Clock;
                    return <StatusIcon size={20} className={statusConfig[selectedOrder.status]?.color} />;
                  })()}
                  <span className={`font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                  {selectedOrder.tracking_number && (
                    <span className="ml-auto text-sm text-gray-400">
                      Tracking: {selectedOrder.tracking_number}
                    </span>
                  )}
                </div>

                {/* Shipping & Payment Info */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {/* Shipping */}
                  <div className="bg-black-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <MapPin size={16} className="text-gold-500" />
                      {selectedOrder.shipping_method === 'store_pickup' ? 'Pickup Location' : 'Delivery Address'}
                    </h3>
                    {selectedOrder.shipping_method === 'store_pickup' ? (
                      <p className="text-gray-400 text-sm">
                        Fragranza Store<br />
                        Blk 16 Lot1-A Brgy San Dionisio<br />
                        Dasmariñas, Cavite
                      </p>
                    ) : (
                      <div className="text-gray-400 text-sm space-y-1">
                        <p className="text-white">{selectedOrder.customer_name}</p>
                        <p>{selectedOrder.shipping_address}</p>
                        {selectedOrder.customer_phone && (
                          <p className="flex items-center gap-1">
                            <Phone size={12} /> {selectedOrder.customer_phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="bg-black-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <CreditCard size={16} className="text-gold-500" />
                      Payment
                    </h3>
                    <div className="text-gray-400 text-sm space-y-1">
                      <p>
                        <span className="text-gray-500">Method:</span>{' '}
                        <span className="text-white capitalize">
                          {selectedOrder.payment_method?.replace('_', ' ') || 'N/A'}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Status:</span>{' '}
                        <span className={
                          selectedOrder.payment_status === 'paid' ? 'text-green-500' :
                          selectedOrder.payment_status === 'pending' ? 'text-yellow-500' :
                          'text-red-500'
                        }>
                          {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Order Items</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="flex gap-3 sm:gap-4 bg-black-800 rounded-lg p-3">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm sm:text-base text-white font-medium truncate">{item.product_name}</h4>
                          {item.variation && <p className="text-gray-400 text-xs sm:text-sm">{item.variation}</p>}
                          <p className="text-gray-400 text-xs sm:text-sm">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-gold-500 text-sm sm:text-base font-semibold flex-shrink-0">
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gold-500/20 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span>₱{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Shipping</span>
                    <span>{selectedOrder.shipping_fee === 0 ? 'FREE' : `₱${(selectedOrder.shipping_fee || 0).toLocaleString()}`}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Discount</span>
                      <span>-₱{selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gold-500/10">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-gold-500 font-bold text-lg">₱{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Invoice Section */}
                {selectedOrder.invoice_number && (
                  <div className="mt-6 pt-4 border-t border-gold-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-gold-500" />
                        <span className="text-white font-medium">Invoice</span>
                        <span className="text-gray-400 text-sm">#{selectedOrder.invoice_number}</span>
                      </div>
                      <button
                        onClick={handleViewInvoice}
                        className="flex items-center gap-2 text-sm text-gold-500 hover:text-gold-400 transition-colors"
                      >
                        <FileText size={16} />
                        View Invoice
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mt-4 p-3 bg-black-800 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      <span className="text-gray-500">Notes:</span> {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
  {/* Cancel button for orders that haven't shipped yet */}
                  {['ordered', 'paid_waiting_approval', 'cod_waiting_approval'].includes(selectedOrder.status) && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to cancel this order?')) {
                          const result = await orderService.cancelOrder(selectedOrder.id);
                          if (result.success) {
                            handleCloseModal();
                            refreshOrders();
                          } else {
                            alert(result.message || 'Failed to cancel order');
                          }
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <XCircle size={18} />
                      Cancel Order
                    </button>
                  )}
                  
                  {/* Request Return/Refund for delivered or completed orders */}
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'completed') && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to request a return/refund for this order?')) {
                          const result = await orderService.requestReturn(selectedOrder.id);
                          if (result.success) {
                            alert('Return request submitted successfully. We will contact you shortly.');
                            handleCloseModal();
                            refreshOrders();
                          } else {
                            alert(result.message || 'Failed to request return');
                          }
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <RotateCcw size={18} />
                      Request Return/Refund
                    </button>
                  )}
                  
                  <button
                    onClick={handleCloseModal}
                    className="flex-grow bg-black-800 hover:bg-black-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Invoice View Modal */}
        <AnimatePresence>
          {showInvoice && selectedOrder && (
            <div
              className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 ${isPrinting ? 'no-print' : ''}`}
              onClick={handleBackToOrder}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-print"
                onClick={e => e.stopPropagation()}
              >
                {/* Action Buttons - Hidden when printing */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 no-print">
                  <button
                    onClick={handleBackToOrder}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    Back to Order
                  </button>
                  <button
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Print / Download
                  </button>
                </div>

                {/* Invoice Content */}
                <div className="print-invoice" style={{ padding: '32px', background: '#fff', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {/* Invoice Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid #9ca3af', paddingBottom: '24px' }}>
                    <div>
                      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#000000', margin: 0, fontFamily: "'Playfair Display', serif" }}>INVOICE</h1>
                      <p style={{ color: '#374151', marginTop: '4px', fontSize: '16px' }}>#{selectedOrder.invoice_number}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <img 
                        src="/assets/images/Fragranza LOGO.png" 
                        alt="Fragranza Logo" 
                        style={{ width: '80px', height: 'auto', marginLeft: 'auto', marginBottom: '8px' }}
                      />
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000', margin: 0, fontFamily: "'Playfair Display', serif" }}>Fragranza Olio</h2>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0', fontFamily: "'Poppins', sans-serif" }}>Premium Perfumes & Cosmetics</p>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Blk 16 Lot1-A Brgy San Dionisio</p>
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>Dasmariñas, Cavite</p>
                    </div>
                  </div>

                  {/* Order & Customer Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, color: '#000000', marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>Bill To:</h3>
                      <p style={{ color: '#1f2937', margin: '4px 0' }}>{selectedOrder.customer_name}</p>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0' }}>{selectedOrder.shipping_address}</p>
                      {selectedOrder.customer_phone && (
                        <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0' }}>{selectedOrder.customer_phone}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0' }}>
                        <span style={{ fontWeight: 600 }}>Order:</span> #{selectedOrder.order_number}
                      </p>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0' }}>
                        <span style={{ fontWeight: 600 }}>Date:</span>{' '}
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p style={{ color: '#4b5563', fontSize: '14px', margin: '4px 0', textTransform: 'capitalize' }}>
                        <span style={{ fontWeight: 600 }}>Payment:</span>{' '}
                        {selectedOrder.payment_method?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #9ca3af' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#000000', fontWeight: 600 }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '8px 0', color: '#000000', fontWeight: 600 }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', color: '#000000', fontWeight: 600 }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', color: '#000000', fontWeight: 600 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 0' }}>
                            <p style={{ color: '#000000', margin: 0 }}>{item.product_name}</p>
                            {item.variation && <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>{item.variation}</p>}
                          </td>
                          <td style={{ textAlign: 'center', padding: '12px 0', color: '#374151' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '12px 0', color: '#374151' }}>₱{item.price?.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', padding: '12px 0', color: '#000000', fontWeight: 500 }}>
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '240px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4b5563' }}>
                        <span>Subtotal</span>
                        <span>₱{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4b5563' }}>
                        <span>Shipping</span>
                        <span>{selectedOrder.shipping_fee === 0 ? 'FREE' : `₱${(selectedOrder.shipping_fee || 0).toLocaleString()}`}</span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#16a34a' }}>
                          <span>Discount</span>
                          <span>-₱{selectedOrder.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #9ca3af', fontWeight: 'bold', color: '#000000', fontSize: '18px' }}>
                        <span>Total</span>
                        <span>₱{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '32px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                    <div>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`FRAGRANZA|${selectedOrder.order_number}|${selectedOrder.invoice_number}|${selectedOrder.total_amount}|${selectedOrder.customer_name}`)}`} 
                        alt="Order QR Code" 
                        style={{ width: '120px', height: '120px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '16px', color: '#000', marginBottom: '4px' }}>Scan to Verify</p>
                      <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>Order: {selectedOrder.order_number}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px' }}>Present this QR code to the cashier for pickup verification</p>
                    </div>
                  </div>

                  {/* Reminder */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <p style={{ color: '#92400e', fontSize: '13px', lineHeight: 1.5 }}>
                      <strong>Important:</strong> Please save or screenshot this invoice. Show the QR code to our cashier when picking up your order for quick transaction completion.
                    </p>
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #9ca3af', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif" }}>Thank you for shopping with Fragranza Olio!</p>
                    <p style={{ marginTop: '4px' }}>For questions, contact us at fragranzaolio@gmail.com</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Orders;
