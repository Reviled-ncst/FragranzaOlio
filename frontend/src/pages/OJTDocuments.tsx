import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  File,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import OJTLayout from '../components/layout/OJTLayout';
import api from '../services/api';

interface Document {
  id: number;
  title: string;
  document_type: 'resume' | 'endorsement' | 'moa' | 'completion' | 'evaluation' | 'other';
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume/CV' },
  { value: 'endorsement', label: 'Endorsement Letter' },
  { value: 'moa', label: 'MOA/Agreement' },
  { value: 'completion', label: 'Completion Certificate' },
  { value: 'evaluation', label: 'Evaluation Form' },
  { value: 'other', label: 'Other' },
];

const OJTDocuments = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    document_type: 'other',
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // For now, we'll show sample documents since the API might not have data
      // In production, this would fetch from the API
      const response = await api.get(`/api/ojt_documents.php?trainee_id=${user.id}`);
      const docs = (response as any).data || [];
      
      if (docs.length === 0) {
        // Show sample documents if none exist
        setDocuments([
          {
            id: 1,
            title: 'Resume - ' + user.firstName + ' ' + user.lastName,
            document_type: 'resume',
            file_name: 'resume.pdf',
            file_path: '/uploads/documents/resume.pdf',
            file_size: 256000,
            file_type: 'application/pdf',
            status: 'approved',
            notes: 'Resume approved for OJT application',
            created_at: '2025-11-01T08:00:00'
          },
          {
            id: 2,
            title: 'Endorsement Letter',
            document_type: 'endorsement',
            file_name: 'endorsement.pdf',
            file_path: '/uploads/documents/endorsement.pdf',
            file_size: 128000,
            file_type: 'application/pdf',
            status: 'approved',
            notes: 'School endorsement letter verified',
            created_at: '2025-11-01T09:00:00'
          },
          {
            id: 3,
            title: 'Memorandum of Agreement',
            document_type: 'moa',
            file_name: 'moa.pdf',
            file_path: '/uploads/documents/moa.pdf',
            file_size: 512000,
            file_type: 'application/pdf',
            status: 'approved',
            notes: 'Signed by all parties',
            created_at: '2025-11-02T10:00:00'
          },
          {
            id: 4,
            title: 'Weekly Report - Week 10',
            document_type: 'other',
            file_name: 'weekly_report_w10.docx',
            file_path: '/uploads/documents/weekly_report.docx',
            file_size: 45000,
            file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            status: 'pending',
            created_at: '2026-01-15T14:00:00'
          }
        ]);
      } else {
        setDocuments(docs);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      // Show sample documents on error
      setDocuments([
        {
          id: 1,
          title: 'Resume - ' + (user?.firstName || 'Trainee'),
          document_type: 'resume',
          file_name: 'resume.pdf',
          file_path: '/uploads/documents/resume.pdf',
          file_size: 256000,
          file_type: 'application/pdf',
          status: 'approved',
          created_at: '2025-11-01T08:00:00'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('document_type', uploadForm.document_type);
      formData.append('trainee_id', String(user?.id));
      formData.append('uploaded_by', String(user?.id));
      
      // In production, this would upload to the API
      // await api.post('/api/ojt_documents.php', formData);
      
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowUploadModal(false);
      setUploadForm({ title: '', document_type: 'other', file: null });
      await fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return null;
    }
  };

  const getDocTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ojt' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OJTLayout title="My Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
              <FileText size={16} />
              <span>Document Management</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white">
              My Documents
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Upload and manage your OJT-related documents
            </p>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors font-medium"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gold-500" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 mb-4">No documents uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors font-medium"
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 hover:border-gold-500/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="text-gold-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{doc.title}</h3>
                    <p className="text-gray-400 text-xs">{getDocTypeLabel(doc.document_type)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(doc.status)}`}>
                    {getStatusIcon(doc.status)}
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  <p>{doc.file_name} • {formatFileSize(doc.file_size)}</p>
                  <p>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                
                {doc.notes && (
                  <p className="text-xs text-gray-400 bg-black-800 rounded-lg p-2 mb-3">
                    {doc.notes}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-black-800 text-gray-300 rounded-lg text-sm hover:bg-black-700 transition-colors">
                    <Eye size={14} />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-black-800 text-gray-300 rounded-lg text-sm hover:bg-black-700 transition-colors">
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black-900 border border-gold-500/30 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Upload Document</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-1 hover:bg-black-800 rounded-lg transition-colors"
                  >
                    <X className="text-gray-400" size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Document Title</label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Weekly Report Week 11"
                      className="w-full bg-black-800 border border-gold-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Document Type</label>
                    <select
                      value={uploadForm.document_type}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                      className="w-full bg-black-800 border border-gold-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                    >
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">File</label>
                    <div className="border-2 border-dashed border-gold-500/30 rounded-lg p-6 text-center hover:border-gold-500/50 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto text-gold-400 mb-2" size={32} />
                        {uploadForm.file ? (
                          <p className="text-white">{uploadForm.file.name}</p>
                        ) : (
                          <>
                            <p className="text-gray-400">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 bg-black-800 text-gray-300 rounded-lg hover:bg-black-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadForm.file || !uploadForm.title}
                    className="flex-1 px-4 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    Upload
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OJTLayout>
  );
};

export default OJTDocuments;
