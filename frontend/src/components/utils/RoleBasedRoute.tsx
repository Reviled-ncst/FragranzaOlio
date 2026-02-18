/**
 * Role-Based Route Components
 * Handles automatic redirection based on user roles and protected routes
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

// Dashboard routes for each role
export const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin',
  hr: '/hr',
  ojt_supervisor: '/supervisor',
  ojt: '/ojt',
  sales: '/sales',
  customer: '/products',
};

// Allowed routes for each role
export const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  admin: ['/admin', '/hr', '/sales', '/supervisor', '/ojt', '/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
  hr: ['/hr', '/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
  ojt_supervisor: ['/supervisor', '/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
  ojt: ['/ojt', '/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
  sales: ['/sales', '/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
  customer: ['/dashboard', '/profile', '/products', '/cart', '/wishlist', '/orders', '/checkout', '/addresses'],
};

/**
 * Get the appropriate dashboard for a user role
 */
export const getDashboardForRole = (role?: string): string => {
  if (!role) return '/';
  return ROLE_DASHBOARDS[role] || '/dashboard';
};

/**
 * Check if a user can access a specific route
 */
export const canAccessRoute = (role: string | undefined, pathname: string): boolean => {
  if (!role) return false;
  
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || [];
  
  // Public routes anyone can access
  const publicRoutes = ['/', '/about', '/services', '/contact', '/careers'];
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return true;
  }
  
  // Check if the route matches any allowed pattern
  return allowedRoutes.some(route => pathname.startsWith(route));
};

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated, or to appropriate dashboard if role not allowed
 */
export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Not authenticated - redirect to home (will trigger login modal)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, requireAuth: true }} replace />;
  }

  // Check role access if roles specified
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard for their role
    const dashboard = redirectTo || getDashboardForRole(user.role);
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
};

/**
 * Role Redirect Component
 * Automatically redirects authenticated users to their appropriate dashboard
 * Use this on pages like /dashboard to redirect to role-specific dashboards
 */
export const RoleRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, requireAuth: true }} replace />;
  }

  const dashboard = getDashboardForRole(user?.role);
  
  // Avoid redirect loops
  if (location.pathname === dashboard) {
    return null;
  }
  
  return <Navigate to={dashboard} replace />;
};

/**
 * Admin Only Route
 */
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

/**
 * Supervisor Only Route
 */
export const SupervisorRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'ojt_supervisor']}>
    {children}
  </ProtectedRoute>
);

/**
 * OJT Only Route
 */
export const OJTRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'ojt_supervisor', 'ojt']}>
    {children}
  </ProtectedRoute>
);

/**
 * Sales Only Route
 */
export const SalesRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'sales']}>
    {children}
  </ProtectedRoute>
);

/**
 * HR Only Route
 */
export const HRRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'hr']}>
    {children}
  </ProtectedRoute>
);

export default {
  ProtectedRoute,
  RoleRedirect,
  AdminRoute,
  SupervisorRoute,
  OJTRoute,
  SalesRoute,
  HRRoute,
  getDashboardForRole,
  canAccessRoute,
};
