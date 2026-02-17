import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, Camera, LogOut, Edit2, Save, X, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OJTLayout from '../components/layout/OJTLayout';
import SupervisorLayout from '../components/layout/SupervisorLayout';
import AdminLayout from '../components/layout/AdminLayout';
import { firebaseEmailService } from '../services/firebaseEmailService';

// Helper component for role-based layout wrapper
const RoleBasedWrapper = ({ role, children }: { role: string | undefined, children: React.ReactNode }) => {
  if (role === 'ojt') {
    return <OJTLayout title="My Profile">{children}</OJTLayout>;
  }
  if (role === 'ojt_supervisor') {
    return <SupervisorLayout title="My Profile">{children}</SupervisorLayout>;
  }
  if (role === 'admin') {
    return <AdminLayout title="My Profile">{children}</AdminLayout>;
  }
  // For customer and other roles, use the standard layout
  return (
    <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
      {children}
    </div>
  );
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResendPassword, setShowResendPassword] = useState(false);
  const [resendPassword, setResendPassword] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    zipCode: user?.zipCode || '',
  });

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-black-950 pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your profile.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // TODO: Implement API call to update profile
    // For now, just update local state
    const updatedUser = {
      ...user,
      ...formData,
    };
    updateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthDate: user?.birthDate || '',
      gender: user?.gender || '',
      address: user?.address || '',
      city: user?.city || '',
      province: user?.province || '',
      zipCode: user?.zipCode || '',
    });
    setIsEditing(false);
  };

  const handleResendVerification = async () => {
    if (!resendPassword) {
      setVerificationMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }
    
    setIsResendingVerification(true);
    setVerificationMessage(null);
    
    try {
      const result = await firebaseEmailService.resendVerification(user.email, resendPassword);
      
      if (result.success) {
        setVerificationMessage({ type: 'success', text: result.message || 'Verification email sent!' });
        setShowResendPassword(false);
        setResendPassword('');
      } else {
        setVerificationMessage({ type: 'error', text: result.message || 'Failed to send verification email' });
      }
    } catch {
      setVerificationMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const getInitials = () => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <RoleBasedWrapper role={user.role}>
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-black-900 to-black-800 border border-gold-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-black shadow-lg">
                {getInitials()}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-black-800 border border-gold-500/30 rounded-full hover:bg-black-700 transition-colors">
                <Camera size={14} className="text-gold-400 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mb-2 sm:mb-3 break-all sm:break-normal">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  user.emailVerified 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {user.emailVerified ? '✓ Verified' : '⏳ Pending Verification'}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  Member since {formatDate(user.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                >
                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 transition-colors"
                  >
                    <Save size={14} className="sm:w-4 sm:h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gold-500/20 pb-2 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6"
        >
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <User size={18} className="text-gold-400 sm:w-5 sm:h-5" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1 sm:mb-1.5">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  ) : (
                    <p className="text-white py-2.5">{user.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  ) : (
                    <p className="text-white py-2.5">{user.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                    <Mail size={14} />
                    Email Address
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-white py-2.5">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    {/* Verification Status */}
                    <div className="flex flex-col gap-2">
                      {user.emailVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle size={14} />
                          Email Verified
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            <AlertCircle size={14} />
                            Not Verified
                          </span>
                          {!showResendPassword ? (
                            <button
                              onClick={() => setShowResendPassword(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gold-500/20 text-gold-400 border border-gold-500/30 hover:bg-gold-500/30 transition-colors"
                            >
                              <RefreshCw size={14} />
                              Resend Verification
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <input
                                type="password"
                                value={resendPassword}
                                onChange={(e) => setResendPassword(e.target.value)}
                                placeholder="Enter password"
                                className="px-3 py-1.5 text-sm bg-black-800 border border-gold-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleResendVerification}
                                  disabled={isResendingVerification}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gold-500 text-black hover:bg-gold-400 transition-colors disabled:opacity-50"
                                >
                                  {isResendingVerification ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    'Send'
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowResendPassword(false);
                                    setResendPassword('');
                                    setVerificationMessage(null);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Verification Message */}
                      {verificationMessage && (
                        <p className={`text-xs ${verificationMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {verificationMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                    <Phone size={14} />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  ) : (
                    <p className="text-white py-2.5">{user.phone || 'Not set'}</p>
                  )}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-2">
                    <Calendar size={14} />
                    Birth Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    />
                  ) : (
                    <p className="text-white py-2.5">{formatDate(user.birthDate || '')}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-white py-2.5 capitalize">{user.gender || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-4 sm:pt-6 border-t border-gold-500/10">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4">
                  <MapPin size={18} className="text-gold-400 sm:w-5 sm:h-5" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Street Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1.5">Street Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      />
                    ) : (
                      <p className="text-white py-2.5">{user.address || 'Not set'}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      />
                    ) : (
                      <p className="text-white py-2.5">{user.city || 'Not set'}</p>
                    )}
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Province</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      />
                    ) : (
                      <p className="text-white py-2.5">{user.province || 'Not set'}</p>
                    )}
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Zip Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      />
                    ) : (
                      <p className="text-white py-2.5">{user.zipCode || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-gold-400 sm:w-5 sm:h-5" />
                Security Settings
              </h2>

              {/* Change Password */}
              <div className="p-3 sm:p-4 bg-black-800 rounded-lg border border-gold-500/10">
                <h3 className="text-sm sm:text-base font-medium text-white mb-1.5 sm:mb-2">Change Password</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Update your password to keep your account secure.</p>
                <button className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors">
                  Change Password
                </button>
              </div>

              {/* Two-Factor Auth */}
              <div className="p-4 bg-black-800 rounded-lg border border-gold-500/10">
                <h3 className="font-medium text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account.</p>
                <button className="px-4 py-2 border border-gold-500/30 text-gold-400 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors">
                  Enable 2FA
                </button>
              </div>

              {/* Login History */}
              <div className="p-4 bg-black-800 rounded-lg border border-gold-500/10">
                <h3 className="font-medium text-white mb-2">Recent Login Activity</h3>
                <p className="text-sm text-gray-400">Last login: {formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell size={20} className="text-gold-400" />
                Notification Preferences
              </h2>

              {/* Email Notifications */}
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                  <div>
                    <h3 className="font-medium text-white">Newsletter</h3>
                    <p className="text-sm text-gray-400">Receive updates about new products and offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={user.subscribeNewsletter}
                    className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                    readOnly
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                  <div>
                    <h3 className="font-medium text-white">Order Updates</h3>
                    <p className="text-sm text-gray-400">Get notified about your order status</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-black-800 rounded-lg border border-gold-500/10 cursor-pointer hover:bg-black-700 transition-colors">
                  <div>
                    <h3 className="font-medium text-white">Promotional Emails</h3>
                    <p className="text-sm text-gray-400">Receive special discounts and promotions</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gold-500/30 bg-black-800 text-gold-500 focus:ring-gold-500"
                  />
                </label>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </RoleBasedWrapper>
  );
};

export default Profile;
