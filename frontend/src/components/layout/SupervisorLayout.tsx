import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Calendar
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../ui/NotificationDropdown';

interface SupervisorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const SupervisorLayout = ({ children, title = 'Supervisor Dashboard' }: SupervisorLayoutProps) => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  // Handle window resize for responsive margin
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('supervisorSidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('supervisorSidebarCollapsed', JSON.stringify(newState));
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/supervisor' },
    { label: 'My Trainees', icon: Users, path: '/supervisor/trainees' },
    { label: 'Timesheet Approvals', icon: Clock, path: '/supervisor/timesheets', badge: 3 },
    { label: 'Task Management', icon: CheckSquare, path: '/supervisor/tasks' },
    { label: 'Attendance', icon: Calendar, path: '/supervisor/attendance' },
    { label: 'Reports', icon: BarChart3, path: '/supervisor/reports' },
    { label: 'Documents', icon: FileText, path: '/supervisor/documents' },
    { label: 'Settings', icon: Settings, path: '/supervisor/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/supervisor') {
      return location.pathname === '/supervisor';
    }
    return location.pathname.startsWith(path);
  };

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-950">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-black-800 border border-gold-500/30 rounded-lg text-gold-400 hover:bg-black-700 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 bottom-0 bg-black-900 border-r border-gold-500/20 z-40 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gold-500/20">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">S</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Supervisor Panel</p>
                  <p className="text-gold-400 text-xs">{user?.firstName} {user?.lastName}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-2 hover:bg-black-800 rounded-lg transition-colors text-gold-400"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-8rem)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                  ${active 
                    ? 'bg-gradient-to-r from-gold-500/20 to-transparent border-l-4 border-gold-500 text-gold-400' 
                    : 'text-gray-400 hover:bg-black-800 hover:text-white border-l-4 border-transparent'
                  }`}
              >
                <Icon size={22} className={active ? 'text-gold-400' : 'group-hover:text-gold-400 transition-colors'} />
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-gold-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black-800 text-white text-sm rounded 
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 bg-gold-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gold-500/20">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-400 
              hover:bg-red-500/10 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={22} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
            
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-black-800 text-red-400 text-sm rounded 
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: isDesktop ? (isCollapsed ? 80 : 280) : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {/* Top Bar */}
        <div className="h-16 bg-black-900/50 backdrop-blur-sm border-b border-gold-500/20 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            
            <div className="flex items-center gap-3 pl-4 border-l border-gold-500/20">
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-gold-400 text-xs">OJT Supervisor</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-black font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default SupervisorLayout;
