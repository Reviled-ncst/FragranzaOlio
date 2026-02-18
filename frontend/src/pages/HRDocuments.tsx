import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload,
  Download,
  Search,
  Folder,
  File,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

interface Document {
  id: number;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

const HRDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Documents', count: 15 },
    { id: 'policies', label: 'Policies', count: 5 },
    { id: 'contracts', label: 'Contracts', count: 4 },
    { id: 'forms', label: 'Forms & Templates', count: 3 },
    { id: 'reports', label: 'Reports', count: 3 },
  ];

  const documents: Document[] = [
    { id: 1, name: 'Employee Handbook 2026', type: 'PDF', category: 'policies', uploadedBy: 'Admin', uploadedAt: 'Feb 10, 2026', size: '2.4 MB' },
    { id: 2, name: 'OJT Agreement Template', type: 'DOCX', category: 'contracts', uploadedBy: 'HR Staff', uploadedAt: 'Feb 12, 2026', size: '156 KB' },
    { id: 3, name: 'Leave Request Form', type: 'PDF', category: 'forms', uploadedBy: 'HR Staff', uploadedAt: 'Jan 25, 2026', size: '89 KB' },
    { id: 4, name: 'Code of Conduct', type: 'PDF', category: 'policies', uploadedBy: 'Admin', uploadedAt: 'Jan 15, 2026', size: '1.2 MB' },
    { id: 5, name: 'Employment Contract Template', type: 'DOCX', category: 'contracts', uploadedBy: 'HR Staff', uploadedAt: 'Feb 5, 2026', size: '245 KB' },
    { id: 6, name: 'Monthly Attendance Report', type: 'XLSX', category: 'reports', uploadedBy: 'System', uploadedAt: 'Feb 15, 2026', size: '456 KB' },
  ];

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400"><FileText size={20} /></div>;
      case 'docx':
        return <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400"><FileText size={20} /></div>;
      case 'xlsx':
        return <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400"><FileText size={20} /></div>;
      default:
        return <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center text-gray-400"><File size={20} /></div>;
    }
  };

  const filteredDocuments = documents
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(d => selectedCategory === 'all' || d.category === selectedCategory);

  return (
    <HRLayout title="Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Document Management</h1>
            <p className="text-gray-400">Manage HR documents and templates</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all">
              <Upload size={18} />
              Upload Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'text-gray-400 hover:bg-black-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Folder size={16} />
                      {cat.label}
                    </span>
                    <span className="text-xs bg-black-800 px-2 py-0.5 rounded">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="bg-black-900 border border-pink-500/20 rounded-xl p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-black-900 border border-pink-500/20 rounded-xl overflow-hidden">
              <div className="divide-y divide-pink-500/10">
                {filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-black-800/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.type)}
                      <div>
                        <h4 className="text-white font-medium">{doc.name}</h4>
                        <p className="text-gray-500 text-sm">
                          {doc.type} • {doc.size} • Uploaded by {doc.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm mr-4">{doc.uploadedAt}</span>
                      <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
                        <Download size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDocuments;
