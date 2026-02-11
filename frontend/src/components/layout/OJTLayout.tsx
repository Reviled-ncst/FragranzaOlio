import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Clock, 
  FileText,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Target,
  BookOpen,
  User
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../ui/NotificationDropdown';

interface OJTLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const OJTLayout = ({ children, title = 'OJT Dashboard' }: OJTLayoutProps) => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ojtSidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('ojtSidebarCollapsed', JSON.stringify(newState));
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/ojt' },
    { label: 'My Timesheet', icon: Clock, path: '/ojt/timesheet' },
    { label: 'My Tasks', icon: CheckSquare, path: '/ojt/tasks' },
    { label: 'Training Progress', icon: Target, path: '/ojt/progress' },
    { label: 'Learning Modules', icon: BookOpen, path: '/ojt/modules' },
    { label: 'Documents', icon: FileText, path: '/ojt/documents' },
    { label: 'My Profile', icon: User, path: '/profile' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/ojt') {
      return location.pathname === '/ojt';
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
                  <GraduationCap className="text-black" size={20} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">OJT Trainee</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${active 
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
                    : 'text-gray-400 hover:bg-black-800 hover:text-white border border-transparent'
                  }`}
              >
                <Icon size={20} className={active ? 'text-gold-400' : 'text-gray-500 group-hover:text-gold-400'} />
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge && !isCollapsed && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-gold-500 text-black rounded-full font-medium">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-black-800 text-white text-sm rounded-lg 
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                    whitespace-nowrap border border-gold-500/20 z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gold-500 text-black rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gold-500/20">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 
              hover:bg-red-500/10 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-black-800 text-red-400 text-sm rounded-lg 
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                whitespace-nowrap border border-red-500/20 z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen lg:ml-[280px]"
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-30 h-16 bg-black-900/80 backdrop-blur-lg border-b border-gold-500/20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white hidden sm:block">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-black font-medium text-sm">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-gold-400 text-xs">OJT Trainee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default OJTLayout;
