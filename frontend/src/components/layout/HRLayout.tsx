import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  FileText,
  Bell,
  GraduationCap,
  Briefcase,
  Calendar
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HRLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const HRLayout = ({ children, title = 'HR Dashboard' }: HRLayoutProps) => {
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

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hrSidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('hrSidebarCollapsed', JSON.stringify(newState));
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hr' },
    { label: 'Employees', icon: Briefcase, path: '/hr/employees' },
    { label: 'OJT Interns', icon: GraduationCap, path: '/hr/interns' },
    { label: 'Attendance', icon: Calendar, path: '/hr/attendance' },
    { label: 'Timesheets', icon: Clock, path: '/hr/timesheets' },
    { label: 'Payroll', icon: DollarSign, path: '/hr/payroll' },
    { label: 'Reports', icon: BarChart3, path: '/hr/reports' },
    { label: 'Documents', icon: FileText, path: '/hr/documents' },
    { label: 'Settings', icon: Settings, path: '/hr/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/hr') {
      return location.pathname === '/hr';
    }
    return location.pathname.startsWith(path);
  };

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-950">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-black-800 border border-pink-500/30 rounded-lg text-pink-400 hover:bg-black-700 transition-colors"
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
        className={`fixed left-0 top-0 bottom-0 bg-black-900 border-r border-pink-500/20 z-40 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-pink-500/20">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">HR</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">HR Department</h2>
                  <p className="text-gray-400 text-xs">Human Resources</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-2 hover:bg-black-800 rounded-lg transition-colors text-gray-400 hover:text-pink-400"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive(item.path)
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'text-gray-400 hover:bg-black-800 hover:text-white border border-transparent'
                }`}
            >
              <item.icon size={20} className={isCollapsed ? 'mx-auto' : ''} />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !isCollapsed && (
                <span className="ml-auto bg-pink-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-pink-500/20 bg-black-900">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-pink-400 font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-white text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-black-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`min-h-screen transition-all duration-300 ${
          isDesktop ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]') : ''
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-black-900/80 backdrop-blur-sm border-b border-pink-500/20 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 ml-12 lg:ml-0">
            <h1 className="text-xl font-display font-bold text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-black-800 rounded-lg transition-colors text-gray-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            <Link to="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="text-pink-400 font-medium text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default HRLayout;
