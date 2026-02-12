import { apiFetch, API_BASE_URL } from '../services/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Bell,
  Lock,
  Palette,
  Mail,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SalesLayout from '../components/layout/SalesLayout';

interface UserSettings {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  email_orders: boolean;
  email_reports: boolean;
  email_alerts: boolean;
  push_orders: boolean;
  push_customers: boolean;
  language: string;
  currency: string;
  date_format: string;
}

const SalesSettings = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailReports: true,
    emailAlerts: false,
    pushOrders: true,
    pushCustomers: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'PHP',
    dateFormat: 'YYYY-MM-DD',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Fetch user settings on mount
  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await apiFetch(`${API_BASE_URL}/sales.php?action=settings&user_id=${user?.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const settings = data.data;
        setProfile({
          firstName: settings.first_name || user?.firstName || '',
          lastName: settings.last_name || user?.lastName || '',
          email: settings.email || user?.email || '',
          phone: settings.phone || '',
        });
        setNotifications({
          emailOrders: settings.email_orders ?? true,
          emailReports: settings.email_reports ?? true,
          emailAlerts: settings.email_alerts ?? false,
          pushOrders: settings.push_orders ?? true,
          pushCustomers: settings.push_customers ?? false,
        });
        setPreferences({
          language: settings.language || 'en',
          currency: settings.currency || 'PHP',
          dateFormat: settings.date_format || 'YYYY-MM-DD',
        });
      } else {
        // Use user data as defaults if no settings exist
        setProfile({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: '',
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          user_id: user?.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          phone: profile.phone,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save profile' });
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          user_id: user?.id,
          email_orders: notifications.emailOrders,
          email_reports: notifications.emailReports,
          email_alerts: notifications.emailAlerts,
          push_orders: notifications.pushOrders,
          push_customers: notifications.pushCustomers,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Notification preferences saved!' });
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save notifications' });
      }
    } catch (err) {
      console.error('Error saving notifications:', err);
      setSaveMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          user_id: user?.id,
          language: preferences.language,
          currency: preferences.currency,
          date_format: preferences.dateFormat,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Preferences saved!' });
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save preferences' });
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setSaveMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwords.new.length < 6) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await apiFetch(`${API_BASE_URL}/sales.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          user_id: user?.id,
          current_password: passwords.current,
          new_password: passwords.new,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setSaveMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <SalesLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
              saveMessage.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-red-400" size={20} />
            )}
            <span className={saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {saveMessage.text}
            </span>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-black'
                  : 'bg-black-800 text-gray-400 hover:bg-black-700 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoadingSettings ? (
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-gold-500" size={32} />
          </div>
        ) : (
          <>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                    <span className="text-black font-bold text-2xl">
                      {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{profile.firstName} {profile.lastName}</p>
                    <p className="text-gray-400 text-sm">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+63 XXX XXX XXXX"
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Mail size={18} className="text-gold-500" />
                      Email Notifications
                    </h4>
                    <div className="space-y-4 pl-6">
                      {[
                        { key: 'emailOrders', label: 'New orders', desc: 'Get notified when a new order is placed' },
                        { key: 'emailReports', label: 'Weekly reports', desc: 'Receive weekly sales summary' },
                        { key: 'emailAlerts', label: 'Inventory alerts', desc: 'Low stock and reorder notifications' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-white">{item.label}</p>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key as keyof typeof notifications] ? 'bg-gold-500' : 'bg-black-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Bell size={18} className="text-gold-500" />
                      Push Notifications
                    </h4>
                    <div className="space-y-4 pl-6">
                      {[
                        { key: 'pushOrders', label: 'Order updates', desc: 'Real-time order status changes' },
                        { key: 'pushCustomers', label: 'New customers', desc: 'When new customers register' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-white">{item.label}</p>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key as keyof typeof notifications] ? 'bg-gold-500' : 'bg-black-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleSaveNotifications}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 pr-12"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 pr-12"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Password must be at least 6 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                    {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Display Preferences</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                    <select 
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
                    <select 
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="PHP">Philippine Peso (₱)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Date Format</label>
                    <select 
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="YYYY-MM-DD">2026-02-10</option>
                      <option value="MM/DD/YYYY">02/10/2026</option>
                      <option value="DD/MM/YYYY">10/02/2026</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </SalesLayout>
  );
};

export default SalesSettings;

