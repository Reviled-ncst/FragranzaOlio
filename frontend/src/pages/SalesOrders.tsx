import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  RefreshCw,
  AlertCircle,
  QrCode,
  Printer,
  FileText,
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  User,
  Copy,
  CheckCheck,
  Camera,
  X
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

interface OrderItem {
  id: number;
  product_name: string;
  variation?: string;
  quantity: number;
  price: number;
  unit_price?: number;
  total_price?: number;
  image?: string;
}

interface OrderDetail {
  id: number;
  order_number: string;
  invoice_number?: string;
  customer_name: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_phone?: string;
  shipping_email?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_method?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  notes?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  item_count: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  shipping_city: string;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

const SalesOrders = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({ total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    orderNumber: string;
    customerName: string;
    total: number;
    status: 'pending' | 'success' | 'error' | 'already_completed';
    message?: string;
    orderId?: number;
  } | null>(null);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Physical barcode scanner support
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for physical barcode scanner input (keyboard emulation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except search which we handle)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== searchInputRef.current) return;
      if (target.tagName === 'TEXTAREA') return;
      
      // Clear timeout on each keypress
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
      
      // If Enter is pressed and we have buffer content, process it
      if (e.key === 'Enter' && barcodeBufferRef.current.length > 3) {
        e.preventDefault();
        const scannedData = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        
        // Process the barcode - check for order format
        if (scannedData.includes('|') || scannedData.startsWith('FO-') || scannedData.startsWith('ORD-') || /^[A-Z]{2,4}-\d/.test(scannedData)) {
          parseQRCode(scannedData);
        }
        return;
      }
      
      // Add printable characters to buffer
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        
        // Clear buffer after 100ms of no input (barcode scanners type very fast)
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'orders' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await apiFetch(`${API_BASE_URL}/sales.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setStats(data.stats || { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if search query looks like a QR code scan (contains pipe separators)
    // or a barcode scan (starts with ORD- or INV-)
    if (searchQuery.includes('|') || searchQuery.startsWith('ORD-') || searchQuery.startsWith('INV-')) {
      parseQRCode(searchQuery);
    } else {
      fetchOrders();
    }
  };

  // Parse QR code data: FRAGRANZA|order_number|invoice_number|total|customer_name
  // Or barcode data: order_number (e.g., ORD-20250115-001)
  // Auto-completes the transaction when scanned
  const parseQRCode = useCallback((scanData: string) => {
    let orderNumber: string;
    
    // Check if it's a QR code format (FRAGRANZA|...)
    if (scanData.includes('|') && scanData.startsWith('FRAGRANZA')) {
      const parts = scanData.split('|');
      orderNumber = parts[1];
    } else if (scanData.startsWith('ORD-') || scanData.startsWith('INV-') || /^[A-Z]{2,4}-\d/.test(scanData)) {
      // It's a barcode with just the order/invoice number
      orderNumber = scanData;
    } else {
      // Unknown format, treat as search query
      setSearchQuery(scanData);
      setShowScanner(false);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      fetchOrders();
      return;
    }
    
    setSearchQuery(orderNumber);
    setShowScanner(false);
    
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
      
    // Search for the order and auto-complete
    setTimeout(async () => {
      try {
        const params = new URLSearchParams({ action: 'orders', search: orderNumber });
        const response = await apiFetch(`${API_BASE_URL}/sales.php?${params}`);
        const data = await response.json();
        
        if (data.success && data.data?.length > 0) {
          const foundOrder = data.data[0];
          setOrders(data.data);
          
          const customerName = `${foundOrder.customer_first_name || ''} ${foundOrder.customer_last_name || ''}`.trim() || 'Customer';
          const total = parseFloat(foundOrder.total_amount) || 0;
          
          // Check if order is already completed
          if (foundOrder.status === 'delivered' || foundOrder.status === 'completed') {
            setConfirmationData({
              orderNumber,
              customerName,
              total,
              status: 'already_completed'
            });
            setShowConfirmation(true);
            fetchOrderDetail(foundOrder.id);
            return;
          }
          
          // For pickup orders or any pending order, show confirmation dialog first
          if (foundOrder.shipping_method === 'store_pickup' || foundOrder.status === 'pending' || foundOrder.status === 'processing' || foundOrder.status === 'ready') {
            setConfirmationData({
              orderNumber,
              customerName,
              total,
              status: 'pending',
              orderId: foundOrder.id
            });
            setShowConfirmation(true);
            fetchOrderDetail(foundOrder.id);
            return;
          }
          
          // Auto-complete the transaction for other orders
          const completeResponse = await apiFetch(`${API_BASE_URL}/sales.php?action=order-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: foundOrder.id, 
              status: 'completed', 
              payment_status: 'paid' 
            })
          });
          const completeData = await completeResponse.json();
          
          if (completeData.success) {
            setConfirmationData({
              orderNumber,
              customerName,
              total,
              status: 'success'
            });
            setShowConfirmation(true);
            fetchOrders();
            fetchOrderDetail(foundOrder.id);
          } else {
            setConfirmationData({
              orderNumber,
              customerName,
              total,
              status: 'error',
              message: completeData.message || 'Failed to complete transaction'
            });
            setShowConfirmation(true);
          }
        } else {
          setConfirmationData({
            orderNumber,
            customerName: '',
            total: 0,
            status: 'error',
            message: `Order ${orderNumber} not found`
          });
          setShowConfirmation(true);
        }
      } catch (err) {
        console.error('Error processing order:', err);
        setConfirmationData({
          orderNumber: orderNumber,
          customerName: '',
          total: 0,
          status: 'error',
          message: 'Failed to process order. Please try again.'
        });
        setShowConfirmation(true);
      }
    }, 100);
  }, []);

  // Start QR code scanner
  const startScanner = async () => {
    setScannerError(null);
    setShowScanner(true);
    
    // Wait for DOM element to be ready
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            parseQRCode(decodedText);
          },
          () => {
            // Error callback (ignore scan failures)
          }
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        setScannerError(err.message || 'Failed to start camera. Please ensure camera permissions are granted.');
      }
    }, 100);
  };

  // Stop QR code scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setShowScanner(false);
    setScannerError(null);
  };

  // Fetch full order details
  const fetchOrderDetail = async (orderId: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=order&id=${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.data);
        setShowModal(true);
      } else {
        alert(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      alert('Failed to load order details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Copy order number to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print invoice in new window
  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${selectedOrder.invoice_number || selectedOrder.order_number}</title>
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
    .store-copy { margin-top: 20px; padding: 12px; background: #e0f2fe; border-radius: 8px; text-align: center; }
    .store-copy p { color: #0369a1; font-size: 12px; font-weight: 500; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #9ca3af; text-align: center; color: #6b7280; font-size: 14px; }
    .footer .thanks { font-family: 'Poppins', sans-serif; }
    @media print { body { padding: 0; } @page { margin: 0.5in; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p class="invoice-num">#${selectedOrder.invoice_number || selectedOrder.order_number}</p>
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
      <p class="customer-name">${selectedOrder.customer_name || `${selectedOrder.shipping_first_name || ''} ${selectedOrder.shipping_last_name || ''}`}</p>
      <p>${selectedOrder.shipping_address || ''}</p>
      ${selectedOrder.customer_phone || selectedOrder.shipping_phone ? `<p>${selectedOrder.customer_phone || selectedOrder.shipping_phone}</p>` : ''}
    </div>
    <div class="info-right">
      <p><span>Order:</span> #${selectedOrder.order_number}</p>
      <p><span>Date:</span> ${new Date(selectedOrder.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="text-transform: capitalize;"><span>Payment:</span> ${selectedOrder.payment_method?.replace('_', ' ')}</p>
      <p><span>Status:</span> ${selectedOrder.status}</p>
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
          <td>₱${(item.price || item.unit_price || 0).toLocaleString()}</td>
          <td>₱${((item.price || item.unit_price || 0) * item.quantity).toLocaleString()}</td>
        </tr>
      `).join('') || ''}
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
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`FRAGRANZA|${selectedOrder.order_number}|${selectedOrder.invoice_number || ''}|${selectedOrder.total_amount}|${selectedOrder.customer_name}`)}" alt="Order QR Code" />
    </div>
    <div class="qr-info">
      <p class="qr-title">Transaction Verified</p>
      <p class="qr-order">Order: ${selectedOrder.order_number}</p>
      <p class="qr-hint">This invoice confirms the transaction has been processed.</p>
    </div>
  </div>
  
  <!-- Store Copy Notice -->
  <div class="store-copy">
    <p>📋 STORE COPY - Keep for records</p>
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

  // Show confirmation modal for completing transaction
  const promptCompleteTransaction = (order: OrderDetail | Order) => {
    let customerName = '';
    if ('customer_first_name' in order) {
      customerName = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim();
    }
    if (!customerName && 'customer_name' in order && order.customer_name) {
      customerName = order.customer_name;
    }
    if (!customerName) {
      customerName = order.customer_email || 'Customer';
    }
    
    setConfirmationData({
      orderNumber: order.order_number,
      customerName: customerName,
      total: order.total_amount,
      status: 'pending',
      orderId: order.id
    });
    setShowConfirmation(true);
  };

  // Execute the transaction completion
  const executeCompleteTransaction = async () => {
    if (!confirmationData?.orderId) return;
    
    setIsProcessingTransaction(true);
    
    try {
      // Update order status to delivered
      await apiFetch(`${API_BASE_URL}/sales.php?action=order-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmationData.orderId, status: 'delivered', payment_status: 'paid' })
      });
      
      // Show success state
      setConfirmationData(prev => prev ? { ...prev, status: 'success' } : null);
      
      // Refresh orders
      fetchOrders();
      if (selectedOrder) {
        fetchOrderDetail(confirmationData.orderId);
      }
    } catch (err) {
      console.error('Error completing transaction:', err);
      setConfirmationData(prev => prev ? { ...prev, status: 'error', message: 'Failed to complete transaction' } : null);
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // Legacy function - kept for backward compatibility
  const completeTransaction = async (orderId: number) => {
    // Find the order data
    const order = orders.find(o => o.id === orderId);
    if (order) {
      promptCompleteTransaction(order);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=order-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchOrders();
        setShowModal(false);
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
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
      case 'ordered': return 'bg-blue-500/20 text-blue-400';
      case 'paid_waiting_approval': return 'bg-yellow-500/20 text-yellow-400';
      case 'cod_waiting_approval': return 'bg-yellow-500/20 text-yellow-400';
      case 'paid_ready_pickup': return 'bg-cyan-500/20 text-cyan-400';
      case 'processing': return 'bg-purple-500/20 text-purple-400';
      case 'in_transit': return 'bg-indigo-500/20 text-indigo-400';
      case 'waiting_client': return 'bg-orange-500/20 text-orange-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'picked_up': return 'bg-green-500/20 text-green-400';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'return_requested': return 'bg-orange-500/20 text-orange-400';
      case 'return_approved': return 'bg-yellow-500/20 text-yellow-400';
      case 'returned': return 'bg-gray-500/20 text-gray-400';
      case 'refund_requested': return 'bg-orange-500/20 text-orange-400';
      case 'refunded': return 'bg-gray-500/20 text-gray-400';
      // Legacy statuses
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed': return 'bg-cyan-500/20 text-cyan-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered': return <Package size={14} />;
      case 'paid_waiting_approval': return <Clock size={14} />;
      case 'cod_waiting_approval': return <Clock size={14} />;
      case 'paid_ready_pickup': return <CheckCircle size={14} />;
      case 'processing': return <RefreshCw size={14} />;
      case 'in_transit': return <Truck size={14} />;
      case 'waiting_client': return <Clock size={14} />;
      case 'delivered': return <CheckCircle size={14} />;
      case 'picked_up': return <CheckCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      case 'return_requested': return <RefreshCw size={14} />;
      case 'return_approved': return <CheckCircle size={14} />;
      case 'returned': return <RefreshCw size={14} />;
      case 'refund_requested': return <RefreshCw size={14} />;
      case 'refunded': return <RefreshCw size={14} />;
      // Legacy
      case 'pending': return <Clock size={14} />;
      case 'confirmed': return <CheckCircle size={14} />;
      case 'shipped': return <Truck size={14} />;
      default: return <Package size={14} />;
    }
  };

  // Get quick action for a status
  const getQuickAction = (status: string): { label: string; nextStatus: string; color: string } | null => {
    switch (status) {
      case 'pending': // Pending needs confirmation first
        return { label: 'Confirm', nextStatus: 'confirmed', color: 'bg-green-500 hover:bg-green-600' };
      case 'ordered':
      case 'confirmed': // Confirmed can be processed
        return { label: 'Process', nextStatus: 'processing', color: 'bg-purple-500 hover:bg-purple-600' };
      case 'paid_waiting_approval':
      case 'cod_waiting_approval':
        return { label: 'Approve', nextStatus: 'processing', color: 'bg-green-500 hover:bg-green-600' };
      case 'processing':
        return { label: 'Ship', nextStatus: 'in_transit', color: 'bg-indigo-500 hover:bg-indigo-600' };
      case 'in_transit':
      case 'shipped': // Legacy
        return { label: 'Delivered', nextStatus: 'delivered', color: 'bg-green-500 hover:bg-green-600' };
      case 'delivered':
      case 'picked_up':
        return { label: 'Complete', nextStatus: 'completed', color: 'bg-emerald-500 hover:bg-emerald-600' };
      case 'return_requested':
        return { label: 'Approve Return', nextStatus: 'returned', color: 'bg-orange-500 hover:bg-orange-600' };
      case 'refund_requested':
        return { label: 'Process Refund', nextStatus: 'refunded', color: 'bg-orange-500 hover:bg-orange-600' };
      default:
        return null;
    }
  };

  // Get all action buttons for a status
  type ActionButton = { label: string; status: string; color: string; icon: 'check' | 'cancel' | 'truck' | 'package' | 'clock' | 'refresh' };
  const getStatusActions = (status: string): ActionButton[] => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Confirm', status: 'confirmed', color: 'bg-green-500 hover:bg-green-600', icon: 'check' },
          { label: 'Cancel', status: 'cancelled', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', icon: 'cancel' }
        ];
      case 'ordered':
        return [
          { label: 'Process', status: 'processing', color: 'bg-purple-500 hover:bg-purple-600', icon: 'check' },
          { label: 'Cancel', status: 'cancelled', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', icon: 'cancel' }
        ];
      case 'confirmed':
        return [
          { label: 'Process', status: 'processing', color: 'bg-purple-500 hover:bg-purple-600', icon: 'check' },
          { label: 'Cancel', status: 'cancelled', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', icon: 'cancel' }
        ];
      case 'paid_waiting_approval':
      case 'cod_waiting_approval':
        return [
          { label: 'Approve', status: 'processing', color: 'bg-green-500 hover:bg-green-600', icon: 'check' },
          { label: 'Reject', status: 'cancelled', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', icon: 'cancel' }
        ];
      case 'paid_ready_pickup':
        return [
          { label: 'Picked Up', status: 'picked_up', color: 'bg-green-500 hover:bg-green-600', icon: 'check' }
        ];
      case 'processing':
        return [
          { label: 'Ship', status: 'in_transit', color: 'bg-indigo-500 hover:bg-indigo-600', icon: 'truck' },
          { label: 'Ready Pickup', status: 'paid_ready_pickup', color: 'bg-cyan-500 hover:bg-cyan-600', icon: 'package' }
        ];
      case 'in_transit':
      case 'shipped':
        return [
          { label: 'Delivered', status: 'delivered', color: 'bg-green-500 hover:bg-green-600', icon: 'check' },
          { label: 'Waiting', status: 'waiting_client', color: 'bg-orange-500 hover:bg-orange-600', icon: 'clock' }
        ];
      case 'waiting_client':
        return [
          { label: 'Delivered', status: 'delivered', color: 'bg-green-500 hover:bg-green-600', icon: 'check' },
          { label: 'Failed', status: 'cancelled', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', icon: 'cancel' }
        ];
      case 'delivered':
      case 'picked_up':
        return [
          { label: 'Complete', status: 'completed', color: 'bg-emerald-500 hover:bg-emerald-600', icon: 'check' }
        ];
      case 'return_requested':
        return [
          { label: 'Approve', status: 'return_approved', color: 'bg-orange-500 hover:bg-orange-600', icon: 'check' },
          { label: 'Reject', status: 'completed', color: 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30', icon: 'cancel' }
        ];
      case 'return_approved':
        return [
          { label: 'Returned', status: 'returned', color: 'bg-orange-500 hover:bg-orange-600', icon: 'refresh' }
        ];
      case 'refund_requested':
        return [
          { label: 'Refund', status: 'refunded', color: 'bg-orange-500 hover:bg-orange-600', icon: 'refresh' },
          { label: 'Reject', status: 'completed', color: 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30', icon: 'cancel' }
        ];
      default:
        return [];
    }
  };

  // Get final status message
  const getFinalStatusMessage = (status: string): { text: string; color: string; icon: 'check' | 'cancel' | 'refresh' } | null => {
    switch (status) {
      case 'completed': return { text: 'Order Completed', color: 'text-emerald-400', icon: 'check' };
      case 'cancelled': return { text: 'Order Cancelled', color: 'text-red-400', icon: 'cancel' };
      case 'returned': return { text: 'Item Returned', color: 'text-gray-400', icon: 'refresh' };
      case 'refunded': return { text: 'Refund Completed', color: 'text-gray-400', icon: 'refresh' };
      default: return null;
    }
  };

  // Render action icon
  const renderActionIcon = (icon: ActionButton['icon']) => {
    switch (icon) {
      case 'check': return <CheckCircle size={14} />;
      case 'cancel': return <XCircle size={14} />;
      case 'truck': return <Truck size={14} />;
      case 'package': return <Package size={14} />;
      case 'clock': return <Clock size={14} />;
      case 'refresh': return <RefreshCw size={14} />;
    }
  };

  // Render large action icon for modal
  const renderLargeActionIcon = (icon: ActionButton['icon']) => {
    switch (icon) {
      case 'check': return <CheckCircle size={16} />;
      case 'cancel': return <XCircle size={16} />;
      case 'truck': return <Truck size={16} />;
      case 'package': return <Package size={16} />;
      case 'clock': return <Clock size={16} />;
      case 'refresh': return <RefreshCw size={16} />;
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.toLowerCase();
    return customerName.includes(searchLower) || 
           order.order_number.toLowerCase().includes(searchLower) ||
           (order.customer_email || '').toLowerCase().includes(searchLower);
  });

  return (
    <SalesLayout title="Orders">
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-gold-500 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Total</p>
                <p className="text-lg sm:text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Pending</p>
                <p className="text-lg sm:text-xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Package className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Processing</p>
                <p className="text-lg sm:text-xl font-bold text-white">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Truck className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Shipped</p>
                <p className="text-lg sm:text-xl font-bold text-white">{stats.shipped}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Delivered</p>
                <p className="text-lg sm:text-xl font-bold text-white">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search order, customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Auto-detect QR code scan (contains pipe separator)
                  if (e.target.value.includes('|')) {
                    parseQRCode(e.target.value);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-black rounded-lg font-medium hover:bg-green-600"
            >
              <Camera size={18} />
              <span className="sm:inline">Scan QR</span>
            </button>
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none min-w-[120px] px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              onClick={fetchOrders}
              className="flex items-center gap-2 px-3 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 text-sm"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              type="button"
              className="flex items-center gap-2 px-3 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-400 hover:text-white text-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </form>

        {/* QR Scanner Modal */}
        <AnimatePresence>
          {showScanner && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-md overflow-hidden"
              >
                <div className="p-4 border-b border-gold-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="text-gold-500" size={20} />
                    <h3 className="text-lg font-bold text-white">Scan Order QR Code</h3>
                  </div>
                  <button onClick={stopScanner} className="text-gray-400 hover:text-white p-1">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
                  {scannerError && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{scannerError}</p>
                    </div>
                  )}
                  <p className="text-gray-400 text-sm mt-4 text-center">
                    Point your camera at the QR code on the customer's invoice
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Transaction Confirmation Modal */}
        <AnimatePresence>
          {showConfirmation && confirmationData && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmation(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-b from-black-800 to-black-900 border border-gold-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pending Confirmation State */}
                {confirmationData.status === 'pending' && (
                  <>
                    <div className="pt-8 pb-4 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", damping: 15, stiffness: 300 }}
                        className="w-20 h-20 mx-auto mb-4 bg-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-gold-500/30"
                      >
                        <CheckCheck className="w-10 h-10 text-black" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-white mb-2"
                      >
                        Complete Transaction?
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 text-sm mb-2"
                      >
                        This will mark the order as delivered and payment as received.
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-black-700/50 rounded-lg p-3 mt-3"
                      >
                        <p className="text-white font-medium">{confirmationData.orderNumber}</p>
                        <p className="text-gray-400 text-sm">{confirmationData.customerName}</p>
                        <p className="text-gold-400 font-bold text-lg mt-1">₱{confirmationData.total.toLocaleString()}</p>
                        {/* Barcode Display */}
                        <div className="mt-3 pt-3 border-t border-gold-500/20">
                          <img 
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(confirmationData.orderNumber)}&scale=3&height=18&includetext&backgroundcolor=1f1f1f&barcolor=d4af5f&textcolor=d4af5f`}
                            alt="Order Barcode"
                            className="mx-auto h-14"
                          />
                        </div>
                      </motion.div>
                    </div>
                    <div className="p-4 flex gap-3">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        disabled={isProcessingTransaction}
                        className="flex-1 px-4 py-3 bg-black-700 border border-gold-500/30 rounded-xl text-gray-300 font-semibold hover:bg-black-600 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={executeCompleteTransaction}
                        disabled={isProcessingTransaction}
                        className="flex-1 px-4 py-3 bg-gold-500 rounded-xl text-black font-semibold hover:bg-gold-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessingTransaction ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Confirm'
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Success State */}
                {confirmationData.status === 'success' && (
                  <>
                    <div className="pt-8 pb-4 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
                        className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                      >
                        <CheckCircle className="w-10 h-10 text-white" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white mb-1"
                      >
                        Complete!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-400"
                      >
                        {confirmationData.customerName} • <span className="text-green-400 font-semibold">₱{confirmationData.total.toLocaleString()}</span>
                      </motion.p>
                      {/* Barcode Display */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-black-700/50 rounded-lg p-3 mt-4"
                      >
                        <p className="text-gray-500 text-xs mb-2">Order #{confirmationData.orderNumber}</p>
                        <img 
                          src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(confirmationData.orderNumber)}&scale=3&height=18&includetext&backgroundcolor=1f1f1f&barcolor=22c55e&textcolor=22c55e`}
                          alt="Order Barcode"
                          className="mx-auto h-14"
                        />
                      </motion.div>
                    </div>
                    <div className="p-4">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="w-full px-4 py-3 bg-green-500 rounded-xl text-black font-semibold hover:bg-green-600 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}

                {/* Already Completed State */}
                {confirmationData.status === 'already_completed' && (
                  <>
                    <div className="pt-8 pb-4 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
                        className="w-20 h-20 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30"
                      >
                        <Package className="w-10 h-10 text-white" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white mb-1"
                      >
                        Already Received
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-400"
                      >
                        This item has already been picked up
                      </motion.p>
                      {/* Barcode Display */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-black-700/50 rounded-lg p-3 mt-4"
                      >
                        <p className="text-gray-500 text-xs mb-2">Order #{confirmationData.orderNumber}</p>
                        <img 
                          src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(confirmationData.orderNumber)}&scale=3&height=18&includetext&backgroundcolor=1f1f1f&barcolor=f59e0b&textcolor=f59e0b`}
                          alt="Order Barcode"
                          className="mx-auto h-14"
                        />
                      </motion.div>
                    </div>
                    <div className="p-4">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="w-full px-4 py-3 bg-amber-500 rounded-xl text-black font-semibold hover:bg-amber-600 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </>
                )}

                {/* Error State */}
                {confirmationData.status === 'error' && (
                  <>
                    <div className="pt-8 pb-4 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
                        className="w-20 h-20 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                      >
                        <XCircle className="w-10 h-10 text-white" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white mb-1"
                      >
                        Failed
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-400"
                      >
                        {confirmationData.message || 'Order not found'}
                      </motion.p>
                    </div>
                    <div className="p-4">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="w-full px-4 py-3 bg-red-500 rounded-xl text-white font-semibold hover:bg-red-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchOrders} className="ml-auto text-red-400 hover:text-red-300">
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
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center text-gray-400">
                  No orders found
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-gold-400 font-mono font-medium text-sm">{order.order_number}</p>
                        <p className="text-white text-sm mt-0.5">{order.customer_first_name} {order.customer_last_name}</p>
                        <p className="text-gray-500 text-xs">{order.customer_email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    
                    {/* Order Details */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                      <span>{order.item_count || 0} items</span>
                      <span>•</span>
                      <span className="text-white font-medium">₱{parseFloat(String(order.total_amount)).toLocaleString()}</span>
                      <span>•</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    
                    {/* Payment Status */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.payment_status === 'refunded' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          onClick={() => fetchOrderDetail(order.id)}
                          disabled={isLoadingDetail}
                          className="flex items-center gap-1 px-3 py-1.5 bg-black-800 rounded-lg text-gray-400 hover:text-gold-400 text-xs"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {/* Status-specific action buttons */}
                        {getStatusActions(order.status).map((action, idx) => (
                          <button 
                            key={idx}
                            onClick={() => updateOrderStatus(order.id, action.status)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${action.color} ${action.icon !== 'cancel' ? 'text-white' : ''}`}
                          >
                            {renderActionIcon(action.icon)}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-500/20">
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Order ID</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Customer</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Items</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Total</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Payment</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Date</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gold-500/10 hover:bg-black-800/50">
                          <td className="py-4 px-6 text-gold-400 font-medium">{order.order_number}</td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-white">{order.customer_first_name} {order.customer_last_name}</p>
                              <p className="text-gray-500 text-sm">{order.customer_email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-300">{order.item_count || 0} items</td>
                          <td className="py-4 px-6 text-white font-medium">₱{parseFloat(String(order.total_amount)).toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {formatStatus(order.status)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.payment_status === 'refunded' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-400">{formatDate(order.created_at)}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => fetchOrderDetail(order.id)}
                                disabled={isLoadingDetail}
                                className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-gold-400"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              {/* Status-specific action buttons */}
                              {getStatusActions(order.status).map((action, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => updateOrderStatus(order.id, action.status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${action.color} ${action.icon !== 'cancel' ? 'text-white' : ''}`}
                                  title={action.label}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Order Detail Modal */}
        <AnimatePresence>
          {showModal && selectedOrder && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gold-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Order Details
                        {isLoadingDetail && <RefreshCw className="animate-spin" size={16} />}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gold-400 font-mono">{selectedOrder.order_number}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedOrder.order_number)}
                          className="text-gray-500 hover:text-gold-400"
                        >
                          {copiedId === selectedOrder.order_number ? <CheckCheck size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">
                      <XCircle size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Status & Quick Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {formatStatus(selectedOrder.status)}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedOrder.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      selectedOrder.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Payment: {selectedOrder.payment_status}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={handlePrintInvoice}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black-800 border border-gold-500/30 rounded-lg text-gray-300 hover:text-white text-sm"
                      >
                        <Printer size={14} />
                        Print Invoice
                      </button>
                      {getQuickAction(selectedOrder.status) && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, getQuickAction(selectedOrder.status)!.nextStatus)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-medium text-sm ${getQuickAction(selectedOrder.status)!.color}`}
                        >
                          <CheckCircle size={14} />
                          {getQuickAction(selectedOrder.status)!.label}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer & Shipping Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-black-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <User size={16} className="text-gold-500" />
                        Customer
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-white">{selectedOrder.customer_name || `${selectedOrder.shipping_first_name || ''} ${selectedOrder.shipping_last_name || ''}`}</p>
                        <p className="text-gray-400">{selectedOrder.customer_email || selectedOrder.shipping_email}</p>
                        {(selectedOrder.customer_phone || selectedOrder.shipping_phone) && (
                          <p className="text-gray-400 flex items-center gap-1">
                            <Phone size={12} />
                            {selectedOrder.customer_phone || selectedOrder.shipping_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-black-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <MapPin size={16} className="text-gold-500" />
                        Shipping
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-400">{selectedOrder.shipping_address}</p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <CreditCard size={12} />
                          {selectedOrder.payment_method?.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Package size={16} className="text-gold-500" />
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-black-800 rounded-lg p-3">
                          <div className="w-12 h-12 bg-black-700 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                            {item.variation && <p className="text-gray-500 text-xs">{item.variation}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                            <p className="text-gold-400 text-sm font-medium">
                              ₱{((item.price || item.unit_price || 0) * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gold-500/20 pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>₱{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Shipping</span>
                        <span>{selectedOrder.shipping_fee === 0 ? 'FREE' : `₱${(selectedOrder.shipping_fee || 0).toLocaleString()}`}</span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount</span>
                          <span>-₱{selectedOrder.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gold-500/20">
                        <span>Total</span>
                        <span className="text-gold-400">₱{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions - Contextual buttons based on status */}
                  <div className="bg-gradient-to-r from-gold-500/10 to-amber-500/5 border border-gold-500/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-3">Order Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {/* Dynamic action buttons based on status */}
                      {getStatusActions(selectedOrder.status).map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => updateOrderStatus(selectedOrder.id, action.status)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium ${action.color} ${action.icon !== 'cancel' ? 'text-white' : ''}`}
                        >
                          {renderLargeActionIcon(action.icon)}
                          {action.label}
                        </button>
                      ))}

                      {/* Final status indicators (no actions) */}
                      {getFinalStatusMessage(selectedOrder.status) && (
                        <span className={`${getFinalStatusMessage(selectedOrder.status)!.color} font-medium flex items-center gap-2`}>
                          {renderLargeActionIcon(getFinalStatusMessage(selectedOrder.status)!.icon)}
                          {getFinalStatusMessage(selectedOrder.status)!.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-black-800 rounded-lg p-4">
                      <p className="text-gray-500 text-xs mb-1">Order Notes</p>
                      <p className="text-gray-300 text-sm">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </SalesLayout>
  );
};

export default SalesOrders;


