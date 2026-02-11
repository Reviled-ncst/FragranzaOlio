import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  X,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/FragranzaWeb/backend/api';

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number | null;
  order_number: string | null;
  customer_id: number | null;
  customer_first_name: string;
  customer_last_name: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  issue_date: string;
  due_date: string;
  billing_name: string;
  billing_email: string;
  billing_phone: string;
  billing_address: string;
  notes: string;
  created_at: string;
}

interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  total_amount: number;
  paid_amount: number;
}

const SalesInvoices = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({ total: 0, paid: 0, pending: 0, overdue: 0, total_amount: 0, paid_amount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'invoices' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`${API_URL}/sales.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data || []);
        setStats(data.stats || { total: 0, paid: 0, pending: 0, overdue: 0, total_amount: 0, paid_amount: 0 });
      } else {
        setError(data.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/sales.php?action=invoice-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: newStatus })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchInvoices();
        setShowModal(false);
      } else {
        alert(data.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      alert('Failed to update invoice');
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
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'sent': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'sent': return <Send size={14} />;
      case 'draft': return <FileText size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'cancelled': return <X size={14} />;
      default: return <Clock size={14} />;
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

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled' || status === 'refunded') return false;
    return new Date(dueDate) < new Date();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = `${invoice.customer_first_name || ''} ${invoice.customer_last_name || ''}`.toLowerCase();
    return invoice.invoice_number.toLowerCase().includes(searchLower) || 
           customerName.includes(searchLower) ||
           (invoice.order_number || '').toLowerCase().includes(searchLower);
  });

  return (
    <SalesLayout title="Invoices">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                <FileText className="text-gold-500" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Invoices</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Paid</p>
                <p className="text-xl font-bold text-white">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Overdue</p>
                <p className="text-xl font-bold text-white">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-gold-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Invoice Amount</p>
                <p className="text-2xl font-bold text-white">₱{parseFloat(String(stats.total_amount || 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Paid</p>
                <p className="text-2xl font-bold text-green-400">₱{parseFloat(String(stats.paid_amount || 0)).toLocaleString()}</p>
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
              placeholder="Search by invoice number, customer, or order..."
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchInvoices}
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
            <button onClick={fetchInvoices} className="ml-auto text-red-400 hover:text-red-300">
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
          /* Invoices Table */
          <div className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-500/20">
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Invoice #</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Customer</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Order</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Amount</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Issue Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Due Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gold-500/10 hover:bg-black-800/50">
                        <td className="py-4 px-6 text-gold-400 font-medium">{invoice.invoice_number}</td>
                        <td className="py-4 px-6">
                          <p className="text-white">{invoice.customer_first_name} {invoice.customer_last_name}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-400">{invoice.order_number || '-'}</td>
                        <td className="py-4 px-6 text-white font-medium">₱{parseFloat(String(invoice.total_amount)).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-400">{formatDate(invoice.issue_date)}</td>
                        <td className="py-4 px-6">
                          <span className={isOverdue(invoice.due_date, invoice.status) ? 'text-red-400' : 'text-gray-400'}>
                            {formatDate(invoice.due_date)}
                            {isOverdue(invoice.due_date, invoice.status) && (
                              <AlertTriangle size={12} className="inline ml-1" />
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { setSelectedInvoice(invoice); setShowModal(true); }}
                              className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-gold-400"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-blue-400"
                              title="Send"
                            >
                              <Send size={18} />
                            </button>
                            <button 
                              className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-green-400"
                              title="Download"
                            >
                              <Download size={18} />
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
        )}

        {/* Invoice Detail Modal */}
        {showModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gold-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Invoice Details</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Invoice Number</p>
                    <p className="text-gold-400 font-medium">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Order</p>
                    <p className="text-white">{selectedInvoice.order_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Customer</p>
                    <p className="text-white">{selectedInvoice.billing_name || `${selectedInvoice.customer_first_name} ${selectedInvoice.customer_last_name}`}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white text-sm">{selectedInvoice.billing_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Issue Date</p>
                    <p className="text-white">{formatDate(selectedInvoice.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Due Date</p>
                    <p className={isOverdue(selectedInvoice.due_date, selectedInvoice.status) ? 'text-red-400' : 'text-white'}>
                      {formatDate(selectedInvoice.due_date)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gold-500/20 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">₱{parseFloat(String(selectedInvoice.subtotal)).toLocaleString()}</span>
                  </div>
                  {parseFloat(String(selectedInvoice.discount_amount)) > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Discount</span>
                      <span className="text-red-400">-₱{parseFloat(String(selectedInvoice.discount_amount)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Tax</span>
                    <span className="text-white">₱{parseFloat(String(selectedInvoice.tax_amount)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gold-500/20 pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-gold-400">₱{parseFloat(String(selectedInvoice.total_amount)).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['draft', 'sent', 'paid', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateInvoiceStatus(selectedInvoice.id, status)}
                        disabled={selectedInvoice.status === status}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedInvoice.status === status 
                            ? 'bg-gold-500 text-black' 
                            : 'bg-black-800 text-gray-400 hover:text-white border border-gold-500/30'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30">
                    <Send size={18} />
                    Send Invoice
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30">
                    <Download size={18} />
                    Download PDF
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

export default SalesInvoices;
