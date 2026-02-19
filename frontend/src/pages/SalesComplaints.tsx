import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  Send,
  User,
  Package,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

interface Complaint {
  id: number;
  ticket_number: string;
  customer_id: number | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  order_id: number | null;
  order_number: string | null;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  resolution: string | null;
  message_count: number;
  created_at: string;
}

interface ComplaintMessage {
  id: number;
  complaint_id: number;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

interface ComplaintStats {
  total: number;
  new: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

const SalesComplaints = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({ total: 0, new: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintMessages, setComplaintMessages] = useState<ComplaintMessage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'complaints' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await apiFetch(`${API_BASE_URL}/sales.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setComplaints(data.data || []);
        setStats(data.stats || { total: 0, new: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
      } else {
        setError(data.message || 'Failed to fetch complaints');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaintDetail = async (id: number) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=complaint&id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setComplaintMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching complaint detail:', err);
    }
  };

  const sendReply = async () => {
    if (!selectedComplaint || !replyMessage.trim()) return;
    
    setIsSending(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=complaint-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: selectedComplaint.id,
          user_id: user?.id,
          message: replyMessage,
          is_staff_reply: true
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setReplyMessage('');
        fetchComplaintDetail(selectedComplaint.id);
        fetchComplaints();
      } else {
        alert(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const updateComplaintStatus = async (id: number, status: string, resolution?: string) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=complaint-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          resolution,
          resolved_by: user?.id
        })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchComplaints();
        if (selectedComplaint) {
          setSelectedComplaint({ ...selectedComplaint, status: status as Complaint['status'] });
        }
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
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
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'open': return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'product_quality': 'Product Quality',
      'shipping': 'Shipping',
      'wrong_item': 'Wrong Item',
      'damaged': 'Damaged',
      'refund': 'Refund',
      'service': 'Service',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openComplaintDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
    fetchComplaintDetail(complaint.id);
  };

  const filteredComplaints = complaints.filter(complaint => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = `${complaint.customer_first_name || ''} ${complaint.customer_last_name || ''}`.toLowerCase();
    return complaint.ticket_number.toLowerCase().includes(searchLower) || 
           complaint.subject.toLowerCase().includes(searchLower) ||
           customerName.includes(searchLower);
  });

  return (
    <SalesLayout title="Complaints">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-gold-500" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">New</p>
                <p className="text-xl font-bold text-white">{stats.new}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Open</p>
                <p className="text-xl font-bold text-white">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-xl font-bold text-white">{stats.in_progress}</p>
              </div>
            </div>
          </div>
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-xl font-bold text-white">{stats.resolved}</p>
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
              placeholder="Search by ticket number, subject, or customer..."
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
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={fetchComplaints}
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
            <button onClick={fetchComplaints} className="ml-auto text-red-400 hover:text-red-300">
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
          /* Complaints List */
          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 text-center text-gray-400">
                No complaints found
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openComplaintDetail(complaint)}
                  className="bg-black-900 border border-gold-500/20 rounded-xl p-5 hover:border-gold-500/40 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gold-400 font-mono text-sm">{complaint.ticket_number}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-1">{complaint.subject}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {complaint.customer_first_name} {complaint.customer_last_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={14} />
                          {getCategoryLabel(complaint.category)}
                        </span>
                        {complaint.order_number && (
                          <span className="flex items-center gap-1">
                            Order: {complaint.order_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(complaint.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{complaint.message_count || 0}</p>
                        <p className="text-xs text-gray-400">Messages</p>
                      </div>
                      <button className="p-2 hover:bg-black-700 rounded-lg text-gray-400 hover:text-gold-400">
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Complaint Detail Modal */}
        {showModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black-900 border border-gold-500/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gold-500/20 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gold-400 font-mono">{selectedComplaint.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedComplaint.subject}</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 border-b border-gold-500/20 flex-shrink-0">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white ml-1">{selectedComplaint.customer_first_name} {selectedComplaint.customer_last_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white ml-1">{getCategoryLabel(selectedComplaint.category)}</span>
                  </div>
                  {selectedComplaint.order_number && (
                    <div>
                      <span className="text-gray-400">Order:</span>
                      <span className="text-gold-400 ml-1">{selectedComplaint.order_number}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['new', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateComplaintStatus(selectedComplaint.id, status)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedComplaint.status === status 
                          ? 'bg-gold-500 text-black' 
                          : 'bg-black-800 text-gray-400 hover:text-white border border-gold-500/30'
                      }`}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original Description */}
                <div className="bg-black-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Original Complaint:</p>
                  <p className="text-white">{selectedComplaint.description}</p>
                </div>

                {/* Message Thread */}
                {complaintMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.is_staff_reply 
                        ? 'bg-gold-500/10 border border-gold-500/30 ml-8' 
                        : 'bg-black-800 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.is_staff_reply ? 'bg-gold-500/20' : 'bg-blue-500/20'
                      }`}>
                        <User size={14} className={msg.is_staff_reply ? 'text-gold-400' : 'text-blue-400'} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {msg.is_staff_reply 
                            ? `${msg.first_name || 'Staff'} ${msg.last_name || ''}` 
                            : `${selectedComplaint.customer_first_name} ${selectedComplaint.customer_last_name}`}
                        </p>
                        <p className="text-gray-500 text-xs">{formatDate(msg.created_at)}</p>
                      </div>
                      {msg.is_staff_reply && (
                        <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded">
                          Staff Reply
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gold-500/20 flex-shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  />
                  <button
                    onClick={sendReply}
                    disabled={isSending || !replyMessage.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    {isSending ? 'Sending...' : 'Send'}
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

export default SalesComplaints;

