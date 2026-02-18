import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Bell,
  Shield,
  Clock,
  Calendar,
  Users,
  Save,
  Toggle
} from 'lucide-react';
import HRLayout from '../components/layout/HRLayout';

const HRSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    attendanceAlerts: true,
    timesheetReminders: true,
    weeklyReports: false,
    defaultWorkHours: '8',
    overtimeThreshold: '40',
    lateGracePeriod: '15',
    autoApproveTimesheets: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleInputChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <HRLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">HR Settings</h1>
            <p className="text-gray-400">Configure HR module preferences</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all">
            <Save size={18} />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Bell className="text-pink-400" size={20} />
              </div>
              <h2 className="text-white font-semibold text-lg">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-pink-500/10">
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-gray-500 text-sm">Receive email updates for HR activities</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-pink-500/10">
                <div>
                  <p className="text-white">Attendance Alerts</p>
                  <p className="text-gray-500 text-sm">Get notified about late arrivals and absences</p>
                </div>
                <button
                  onClick={() => handleToggle('attendanceAlerts')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.attendanceAlerts ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.attendanceAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-pink-500/10">
                <div>
                  <p className="text-white">Timesheet Reminders</p>
                  <p className="text-gray-500 text-sm">Send reminders for pending timesheet approvals</p>
                </div>
                <button
                  onClick={() => handleToggle('timesheetReminders')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.timesheetReminders ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.timesheetReminders ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white">Weekly Reports</p>
                  <p className="text-gray-500 text-sm">Receive automated weekly HR summary reports</p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReports')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.weeklyReports ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.weeklyReports ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Work Hours Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Clock className="text-pink-400" size={20} />
              </div>
              <h2 className="text-white font-semibold text-lg">Work Hours</h2>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-pink-500/10">
                <label className="text-white block mb-2">Default Work Hours per Day</label>
                <input
                  type="number"
                  value={settings.defaultWorkHours}
                  onChange={(e) => handleInputChange('defaultWorkHours', e.target.value)}
                  className="w-full px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="py-3 border-b border-pink-500/10">
                <label className="text-white block mb-2">Overtime Threshold (hours/week)</label>
                <input
                  type="number"
                  value={settings.overtimeThreshold}
                  onChange={(e) => handleInputChange('overtimeThreshold', e.target.value)}
                  className="w-full px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="py-3">
                <label className="text-white block mb-2">Late Grace Period (minutes)</label>
                <input
                  type="number"
                  value={settings.lateGracePeriod}
                  onChange={(e) => handleInputChange('lateGracePeriod', e.target.value)}
                  className="w-full px-4 py-2.5 bg-black-800 border border-pink-500/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Automation Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Settings className="text-pink-400" size={20} />
              </div>
              <h2 className="text-white font-semibold text-lg">Automation</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white">Auto-approve Timesheets</p>
                  <p className="text-gray-500 text-sm">Automatically approve timesheets under 40 hours</p>
                </div>
                <button
                  onClick={() => handleToggle('autoApproveTimesheets')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoApproveTimesheets ? 'bg-pink-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoApproveTimesheets ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black-900 border border-pink-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Shield className="text-pink-400" size={20} />
              </div>
              <h2 className="text-white font-semibold text-lg">Quick Actions</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-black-800 hover:bg-pink-500/10 rounded-lg text-gray-300 hover:text-white transition-colors">
                Export All HR Data
              </button>
              <button className="w-full text-left px-4 py-3 bg-black-800 hover:bg-pink-500/10 rounded-lg text-gray-300 hover:text-white transition-colors">
                Generate Annual Report
              </button>
              <button className="w-full text-left px-4 py-3 bg-black-800 hover:bg-pink-500/10 rounded-lg text-gray-300 hover:text-white transition-colors">
                Sync with Payroll System
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRSettings;
