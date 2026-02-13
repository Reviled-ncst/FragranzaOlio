import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/utils/ScrollToTop';
import { 
  ProtectedRoute, 
  AdminRoute, 
  SupervisorRoute, 
  OJTRoute, 
  SalesRoute,
  getDashboardForRole 
} from './components/utils/RoleBasedRoute';

// Context
import { AuthModalProvider } from './context/AuthModalContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AuthModal from './components/ui/AuthModal';

// Pages
import Home from './pages/Home';
import ProductsPage from './pages/ProductsDB';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/SalesDashboard';
import SalesProducts from './pages/SalesProducts';
import SalesInventory from './pages/SalesInventory';
import SalesOrders from './pages/SalesOrders';
import SalesCustomers from './pages/SalesCustomers';
import SalesAnalytics from './pages/SalesAnalytics';
import SalesInvoices from './pages/SalesInvoices';
import SalesSettings from './pages/SalesSettings';
import SalesComplaints from './pages/SalesComplaints';
import OJTDashboard from './pages/OJTDashboard';
import OJTTimesheet from './pages/OJTTimesheet';
import OJTTasks from './pages/OJTTasks';
import OJTProgress from './pages/OJTProgress';
import OJTDocuments from './pages/OJTDocuments';
import OJTModules from './pages/OJTModules';
import OJTAchievements from './pages/OJTAchievements';
import SupervisorDashboard from './pages/SupervisorDashboard';
import SupervisorTrainees from './pages/SupervisorTrainees';
import SupervisorTimesheets from './pages/SupervisorTimesheets';
import SupervisorTasks from './pages/SupervisorTasks';
import SupervisorReports from './pages/SupervisorReports';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import Addresses from './pages/Addresses';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOJT from './pages/AdminOJT';
import ResetPassword from './pages/ResetPassword';

// Smart Dashboard Redirect Component
const SmartDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const targetDashboard = getDashboardForRole(user?.role);
  
  // Redirect to role-specific dashboard
  if (targetDashboard !== '/dashboard') {
    return <Navigate to={targetDashboard} replace />;
  }
  
  // For customers or unknown roles, show the regular dashboard
  return <Dashboard />;
};

// App Content Component (needs to be inside AuthModalProvider)
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSupervisorRoute = location.pathname.startsWith('/supervisor');
  const isSalesRoute = location.pathname.startsWith('/sales');
  const isOjtRoute = location.pathname.startsWith('/ojt');

  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        {!isAdminRoute && !isSupervisorRoute && !isSalesRoute && !isOjtRoute && <Header />}
        <main className={`flex-grow ${isAdminRoute || isSupervisorRoute || isSalesRoute || isOjtRoute ? '' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected Customer Routes */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<SmartDashboard />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
            
            {/* Sales Routes - Protected */}
            <Route path="/sales" element={<SalesRoute><SalesDashboard /></SalesRoute>} />
            <Route path="/sales/orders" element={<SalesRoute><SalesOrders /></SalesRoute>} />
            <Route path="/sales/customers" element={<SalesRoute><SalesCustomers /></SalesRoute>} />
            <Route path="/sales/products" element={<SalesRoute><SalesProducts /></SalesRoute>} />
            <Route path="/sales/inventory" element={<SalesRoute><SalesInventory /></SalesRoute>} />
            <Route path="/sales/complaints" element={<SalesRoute><SalesComplaints /></SalesRoute>} />
            <Route path="/sales/analytics" element={<SalesRoute><SalesAnalytics /></SalesRoute>} />
            <Route path="/sales/reports" element={<SalesRoute><SalesDashboard /></SalesRoute>} />
            <Route path="/sales/invoices" element={<SalesRoute><SalesInvoices /></SalesRoute>} />
            <Route path="/sales/settings" element={<SalesRoute><SalesSettings /></SalesRoute>} />
            
            {/* OJT Routes - Protected */}
            <Route path="/ojt" element={<OJTRoute><OJTDashboard /></OJTRoute>} />
            <Route path="/ojt/tasks" element={<OJTRoute><OJTTasks /></OJTRoute>} />
            <Route path="/ojt/timesheet" element={<OJTRoute><OJTTimesheet /></OJTRoute>} />
            <Route path="/ojt/progress" element={<OJTRoute><OJTProgress /></OJTRoute>} />
            <Route path="/ojt/modules" element={<OJTRoute><OJTModules /></OJTRoute>} />
            <Route path="/ojt/documents" element={<OJTRoute><OJTDocuments /></OJTRoute>} />
            <Route path="/ojt/achievements" element={<OJTRoute><OJTAchievements /></OJTRoute>} />
            
            {/* OJT Supervisor Routes - Protected */}
            <Route path="/supervisor" element={<SupervisorRoute><SupervisorDashboard /></SupervisorRoute>} />
            <Route path="/supervisor/trainees" element={<SupervisorRoute><SupervisorTrainees /></SupervisorRoute>} />
            <Route path="/supervisor/timesheets" element={<SupervisorRoute><SupervisorTimesheets /></SupervisorRoute>} />
            <Route path="/supervisor/tasks" element={<SupervisorRoute><SupervisorTasks /></SupervisorRoute>} />
            <Route path="/supervisor/attendance" element={<SupervisorRoute><SupervisorDashboard /></SupervisorRoute>} />
            <Route path="/supervisor/reports" element={<SupervisorRoute><SupervisorReports /></SupervisorRoute>} />
            <Route path="/supervisor/documents" element={<SupervisorRoute><SupervisorDashboard /></SupervisorRoute>} />
            <Route path="/supervisor/settings" element={<SupervisorRoute><SupervisorDashboard /></SupervisorRoute>} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/ojt" element={<AdminRoute><AdminOJT /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><SalesProducts /></AdminRoute>} />
            <Route path="/admin/inventory" element={<AdminRoute><SalesInventory /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </main>
        {!isAdminRoute && !isSupervisorRoute && !isSalesRoute && !isOjtRoute && <Footer />}
      </div>
      <GlobalAuthModal />
    </>
  );
};

// Global Auth Modal that uses the context
import { useAuthModal } from './context/AuthModalContext';

const GlobalAuthModal = () => {
  const { isOpen, closeAuthModal } = useAuthModal();
  return <AuthModal isOpen={isOpen} onClose={closeAuthModal} />;
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out',
      once: true,
      offset: 50,
    });
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AuthModalProvider>
            <AppContent />
          </AuthModalProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
