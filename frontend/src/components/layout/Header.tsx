import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  LayoutDashboard, 
  Heart, 
  Package,
  Users,
  BarChart3,
  Warehouse,
  DollarSign,
  Truck,
  Bell,
  MapPin,
  Shield,
  Sliders
} from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationDropdown from '../ui/NotificationDropdown';
import type { UserRole } from '../../services/authServicePHP';

// Role-based menu configurations for the user dropdown
const getRoleConfig = (role: UserRole) => {
  const configs: Record<UserRole, {
    label: string;
    color: string;
    dashboardPath: string;
    menuItems: Array<{ path: string; label: string; icon: React.ElementType }>;
  }> = {
    customer: {
      label: 'Customer',
      color: 'bg-blue-500',
      dashboardPath: '/products',
      menuItems: [
        { path: '/profile', label: 'My Profile', icon: User },
        { path: '/orders', label: 'My Orders', icon: Package },
        { path: '/addresses', label: 'My Addresses', icon: MapPin },
        { path: '/wishlist', label: 'Wishlist', icon: Heart },
        { path: '/cart', label: 'Shopping Cart', icon: ShoppingBag },
      ],
    },
    admin: {
      label: 'Admin',
      color: 'bg-red-500',
      dashboardPath: '/admin',
      menuItems: [
        { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'User Management', icon: Users },
        { path: '/sales/products', label: 'Products', icon: Package },
        { path: '/sales/inventory', label: 'Inventory', icon: Warehouse },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
      ],
    },
    sales: {
      label: 'Sales',
      color: 'bg-green-500',
      dashboardPath: '/sales',
      menuItems: [
        { path: '/sales', label: 'Sales Dashboard', icon: LayoutDashboard },
        { path: '/sales/products', label: 'Products', icon: Package },
        { path: '/sales/inventory', label: 'Inventory', icon: Warehouse },
        { path: '/dashboard?tab=profile', label: 'My Profile', icon: User },
      ],
    },
    ojt: {
      label: 'OJT Trainee',
      color: 'bg-blue-400',
      dashboardPath: '/ojt',
      menuItems: [
        { path: '/ojt', label: 'My Dashboard', icon: LayoutDashboard },
        { path: '/sales/products', label: 'Products', icon: Package },
        { path: '/sales/inventory', label: 'Inventory', icon: Warehouse },
        { path: '/ojt/tasks', label: 'My Tasks', icon: Package },
        { path: '/dashboard?tab=profile', label: 'My Profile', icon: User },
      ],
    },
    ojt_supervisor: {
      label: 'Supervisor',
      color: 'bg-purple-500',
      dashboardPath: '/supervisor',
      menuItems: [
        { path: '/supervisor', label: 'Supervisor Dashboard', icon: LayoutDashboard },
        { path: '/supervisor/trainees', label: 'My Trainees', icon: Users },
        { path: '/sales/products', label: 'Products', icon: Package },
        { path: '/sales/inventory', label: 'Inventory', icon: Warehouse },
        { path: '/dashboard?tab=profile', label: 'My Profile', icon: User },
      ],
    },
    hr: {
      label: 'HR Department',
      color: 'bg-pink-500',
      dashboardPath: '/hr',
      menuItems: [
        { path: '/hr', label: 'HR Dashboard', icon: LayoutDashboard },
        { path: '/hr/employees', label: 'Employees', icon: Users },
        { path: '/hr/interns', label: 'Interns', icon: Users },
        { path: '/dashboard?tab=profile', label: 'My Profile', icon: User },
      ],
    },
  };

  return configs[role] || configs.customer;
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { openAuthModal } = useAuthModal();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  const cartCount = getCartCount();

  // Debug: Log auth state
  useEffect(() => {
    console.log('🔐 Header Auth State:', { isAuthenticated, user: user?.email, role: user?.role, isLoading });
  }, [isAuthenticated, user, isLoading]);

  // Check if nav link is active - simple exact match for main nav
  const isNavLinkActive = (path: string) => {
    // For home, only match exact "/"
    if (path === '/') {
      return location.pathname === '/';
    }
    // For other paths, check if current path starts with the link path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Navigation links for unauthenticated users (landing page)
  const publicNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Shop' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' },
    { path: '/careers', label: 'Careers' },
  ];

  // Navigation links for authenticated users based on role
  const getAuthenticatedNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'sales':
        return [
          { path: '/sales', label: 'Dashboard' },
          { path: '/sales/products', label: 'Products' },
          { path: '/sales/inventory', label: 'Inventory' },
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard' },
          { path: '/admin/users', label: 'Users' },
          { path: '/admin/products', label: 'Products' },
        ];
      default: // customer - no navigation, focus on shopping
        return [];
    }
  };

  // Get role-specific config
  const roleConfig = user?.role ? getRoleConfig(user.role) : null;

  // Show different nav links based on auth status
  const navLinks = isAuthenticated ? getAuthenticatedNavLinks() : publicNavLinks;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isUserMenuOpen && !(e.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
    setIsUserMenuOpen(false);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getInitials = () => {
    if (!user) return '';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      customer: 'bg-blue-500/20 text-blue-400',
      admin: 'bg-red-500/20 text-red-400',
      sales: 'bg-green-500/20 text-green-400',
      ojt: 'bg-blue-400/20 text-blue-300',
      ojt_supervisor: 'bg-purple-500/20 text-purple-400',
      hr: 'bg-pink-500/20 text-pink-400',
    };
    return colors[role] || colors.customer;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black-950/95 backdrop-blur-md shadow-dark'
          : 'bg-black-950/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo - routes to shop for customers, dashboard for staff */}
          <Link to={user?.role === 'customer' ? '/products' : (user?.role ? getRoleConfig(user.role).dashboardPath : '/')} className="flex items-center gap-2 sm:gap-3">
            <img
              src="/assets/images/Fragranza LOGO.png"
              alt="Fragranza Logo"
              className="h-10 sm:h-12 w-auto"
            />
            <div className="hidden sm:block">
              <span className="font-display text-xl font-semibold text-white">
                Fragranza
              </span>
              <span className="block text-xs text-gold-500 font-accent tracking-wider">
                OLIO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-accent text-sm font-medium transition-colors duration-300 relative ${
                  isNavLinkActive(link.path) 
                    ? 'text-gold-500' 
                    : 'text-white/90 hover:text-gold-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Collapsible Search Bar - expands on hover/focus */}
            <form onSubmit={handleSearch} className="relative group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-10 group-hover:w-64 focus:w-64 px-4 py-2 pl-10 bg-black-800 border border-gold-500/30 rounded-full text-white text-sm placeholder-transparent group-hover:placeholder-gray-500 focus:placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-all duration-300 cursor-pointer"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-gold-400 transition-colors" />
            </form>
            
            {isAuthenticated && user && (
              <>
                {/* My Orders */}
                <Link 
                  to="/orders" 
                  className="p-2 text-white/80 hover:text-gold-400 transition-colors relative"
                  title="My Orders"
                >
                  <Package size={20} />
                </Link>
                
                {/* Wishlist / Favorites */}
                <Link 
                  to="/wishlist" 
                  className="p-2 text-white/80 hover:text-gold-400 transition-colors relative"
                  title="Favorites"
                >
                  <Heart size={20} />
                </Link>
                
                {/* Shopping Cart */}
                <Link 
                  to="/cart" 
                  className="p-2 text-white/80 hover:text-gold-400 transition-colors relative"
                  title="Shopping Cart"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications Bell */}
                <NotificationDropdown />
              </>
            )}
            
            {isLoading ? (
              /* Loading State */
              <div className="w-8 h-8 bg-black-800 rounded-full animate-pulse" />
            ) : isAuthenticated && user ? (
              /* User Menu (Logged In) */
              <div className="relative user-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-sm font-bold text-black">
                    {getInitials()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="font-accent text-sm text-white block max-w-[100px] truncate">
                      {user.firstName}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
                      {roleConfig?.label}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-black-900 border border-gold-500/20 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gold-500/10 bg-black-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-sm font-bold text-black">
                            {getInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {roleConfig?.label}
                          </span>
                          {user.emailVerified ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role-specific Menu Items */}
                      <div className="py-2">
                        {roleConfig?.menuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gold-500/10 hover:text-gold-400 transition-colors"
                          >
                            <item.icon size={18} />
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gold-500/10 py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={18} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Login Button (Not Logged In) */
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 px-4 py-2 border border-gold-500/50 rounded-lg text-white hover:bg-gold-500 hover:text-black transition-all"
              >
                <User size={18} />
                <span className="font-accent text-sm">Login</span>
              </button>
            )}
            
            {!isAuthenticated && (
              <button 
                onClick={() => openAuthModal('signup')}
                className="btn btn-primary hidden lg:flex"
              >
                Sign Up
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1 sm:gap-2">
            {isAuthenticated && user && (
              <>
                {/* Mobile Notifications */}
                <NotificationDropdown className="scale-90" />

                {/* Mobile Cart Icon */}
                <Link 
                  to="/cart" 
                  className="p-2 text-white/80 hover:text-gold-400 transition-colors relative"
                  title="Shopping Cart"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-xs font-bold text-black">
                  {getInitials()}
                </div>
              </>
            )}
            <button
              className="p-1.5 sm:p-2 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} className="sm:w-6 sm:h-6" /> : <Menu size={22} className="sm:w-6 sm:h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black-900 border-t border-gold-500/20 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="container-custom px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2.5 sm:py-3 pl-10 sm:pl-11 bg-black-800 border border-gold-500/30 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              </form>

              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block py-2 sm:py-2.5 font-accent text-base sm:text-lg ${
                    isNavLinkActive(link.path) ? 'text-gold-500' : 'text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* User Section */}
              <div className="pt-3 sm:pt-4 border-t border-gold-500/20 space-y-2 sm:space-y-3">
                {isAuthenticated && user ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center gap-3 py-2 sm:py-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-black">
                        {getInitials()}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white">{user.firstName} {user.lastName}</p>
                        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {roleConfig?.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role-specific Quick Links */}
                    <div className="space-y-1 py-1 sm:py-2">
                      {roleConfig?.menuItems.slice(0, 4).map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-3 py-2 text-sm sm:text-base text-gray-300 hover:text-gold-400"
                        >
                          <item.icon size={18} className="flex-shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-sm sm:text-base border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={18} />
                      <span className="font-accent">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-sm sm:text-base border border-gold-500/50 rounded-lg text-white hover:bg-gold-500 hover:text-black transition-all"
                    >
                      <User size={18} />
                      <span className="font-accent">Login</span>
                    </button>
                    <button 
                      onClick={() => openAuthModal('signup')}
                      className="btn btn-primary w-full text-center text-sm sm:text-base"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal - Rendered via Portal to escape header positioning */}
      {createPortal(
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              onClick={cancelLogout}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gold-500/10 flex items-center justify-center">
                    <LogOut size={24} className="text-gold-500 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-semibold text-white mb-1.5 sm:mb-2">
                    Confirm Logout
                  </h3>
                  <p className="text-sm sm:text-base text-white-600 mb-4 sm:mb-6">
                    Are you sure you want to logout from your account?
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={cancelLogout}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base border border-white-700 rounded-lg text-white hover:bg-white-800 transition-colors font-accent"
                    >
                      No, Cancel
                    </button>
                    <button
                      onClick={confirmLogout}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base bg-gold-500 rounded-lg text-black hover:bg-gold-600 transition-colors font-accent font-medium"
                    >
                      Yes, Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};

export default Header;
