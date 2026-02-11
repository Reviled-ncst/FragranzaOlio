import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService, { Notification, NotificationCount } from '../../services/notificationService';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown = ({ className = '' }: NotificationDropdownProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCount>({ 
    total: 0, task: 0, timesheet: 0, attendance: 0, document: 0, module: 0, general: 0, system: 0 
  });
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    try {
      const [countData, notificationData] = await Promise.all([
        notificationService.getUnreadCount(userId),
        notificationService.getUnreadNotifications(userId, 10)
      ]);
      setCounts(countData);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user?.id]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setCounts(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        [notification.type]: Math.max(0, (prev[notification.type as keyof NotificationCount] as number) - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    setIsLoading(true);
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications([]);
      setCounts({ total: 0, task: 0, timesheet: 0, attendance: 0, document: 0, module: 0, general: 0, system: 0 });
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setCounts(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        [notification.type]: Math.max(0, (prev[notification.type as keyof NotificationCount] as number) - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Navigate if there's a link
    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const getIcon = (notification: Notification) => {
    return notificationService.getNotificationIcon(notification.type, notification.action_type || undefined);
  };

  const getColorClass = (notification: Notification) => {
    return notificationService.getNotificationColor(notification.action_type || undefined);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gold-400 hover:bg-black-800 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {counts.total > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {counts.total > 9 ? '9+' : counts.total}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-black-900 border border-gold-500/20 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-gold-400" />
                <h3 className="text-white font-semibold">Notifications</h3>
                {counts.total > 0 && (
                  <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full">
                    {counts.total} new
                  </span>
                )}
              </div>
              {counts.total > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={28} className="text-gold-500/50" />
                  </div>
                  <p className="text-gray-400">No new notifications</p>
                  <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gold-500/10">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => handleNotificationClick(notification)}
                      className="p-4 hover:bg-gold-500/5 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getColorClass(notification)}`}>
                          <span className="text-lg">{getIcon(notification)}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {notificationService.formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {notification.link && (
                            <span className="p-1 text-gray-400 hover:text-gold-400">
                              <ExternalLink size={14} />
                            </span>
                          )}
                          <button
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gold-500/20 bg-black-800/50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full py-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
