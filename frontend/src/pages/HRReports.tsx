import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

const HRReports = () => {
  const reports = [
    { 
      id: 1, 
      title: 'Monthly Attendance Summary', 
      description: 'Overview of attendance records for all employees',
      type: 'Attendance',
      lastGenerated: 'Feb 15, 2026',
      icon: Calendar
    },
    { 
      id: 2, 
      title: 'Payroll Report', 
      description: 'Detailed payroll breakdown by department',
      type: 'Payroll',
      lastGenerated: 'Feb 15, 2026',
      icon: DollarSign
    },
    { 
      id: 3, 
      title: 'OJT Hours Report', 
      description: 'Progress tracking for all OJT interns',
      type: 'OJT',
      lastGenerated: 'Feb 14, 2026',
      icon: Clock
    },
    { 
      id: 4, 
      title: 'Employee Performance', 
      description: 'Performance metrics and evaluations',
      type: 'Performance',
      lastGenerated: 'Feb 10, 2026',
      icon: TrendingUp
    },
    { 
      id: 5, 
      title: 'Headcount Report', 
      description: 'Current workforce breakdown by role',
      type: 'HR',
      lastGenerated: 'Feb 18, 2026',
      icon: Users
    },
    { 
      id: 6, 
      title: 'Overtime Analysis', 
      description: 'Overtime hours by employee and department',
      type: 'Time',
      lastGenerated: 'Feb 12, 2026',
      icon: Clock
    },
  ];

  return (
    <HRLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">HR Reports</h1>
            <p className="text-gray-400">Generate and download HR reports</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all">
              <FileText size={18} />
              Custom Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Reports Generated</p>
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-green-400 text-xs">This month</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-pink-400" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Scheduled Reports</p>
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-blue-400 text-xs">Auto-generated</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-400" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Downloads</p>
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-gray-500 text-xs">All time</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Download className="text-green-400" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, index) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-black-900 border border-pink-500/20 rounded-xl p-5 hover:border-pink-500/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="text-pink-400" size={24} />
                  </div>
                  <span className="px-2 py-1 text-xs bg-black-800 text-gray-400 rounded">
                    {report.type}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-2">{report.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Last: {report.lastGenerated}</span>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-all text-sm">
                    <Download size={14} />
                    Generate
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </HRLayout>
  );
};

export default HRReports;
