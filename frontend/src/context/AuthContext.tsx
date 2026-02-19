import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { User } from '../services/authServicePHP';
import { getStoredUser, removeStoredUser, setStoredUser } from '../services/authServicePHP';
import authService from '../services/authServicePHP';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// Session verification cache to prevent rapid re-verification
const SESSION_VERIFIED_KEY = 'fragranza_session_verified';
const VERIFICATION_COOLDOWN = 30000; // 30 seconds between verifications

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from stored user immediately (no loading flash)
  const storedUser = getStoredUser();
  const [user, setUser] = useState<User | null>(storedUser);
  const [isLoading, setIsLoading] = useState(!storedUser); // Only loading if no stored user
  const isMounted = useRef(true);
  const verificationInProgress = useRef(false);

  // Verify session in background and listen for auth changes
  useEffect(() => {
    isMounted.current = true;
    
    // Check if we recently verified the session
    const lastVerified = localStorage.getItem(SESSION_VERIFIED_KEY);
    const now = Date.now();
    
    if (lastVerified && now - parseInt(lastVerified) < VERIFICATION_COOLDOWN) {
      // Recently verified, skip API call
      setIsLoading(false);
      return;
    }
    
    // Verify session in background (don't block UI)
    const verifySession = async () => {
      // Prevent duplicate verification calls
      if (verificationInProgress.current) {
        setIsLoading(false);
        return;
      }
      
      verificationInProgress.current = true;
      
      try {
        const response = await authService.getCurrentUser();
        
        if (!isMounted.current) return;
        
        if (response.success && response.data?.user) {
          // Session is valid, update user data
          setUser(response.data.user);
          setStoredUser(response.data.user);
          // Mark as verified
          localStorage.setItem(SESSION_VERIFIED_KEY, now.toString());
        } else if (!response.success && user) {
          // No valid session but we have a user - clear it
          console.log('🔐 No valid session, clearing stored user');
          setUser(null);
          removeStoredUser();
          localStorage.removeItem(SESSION_VERIFIED_KEY);
        }
      } catch (error: unknown) {
        console.error('Session verification error:', error);
        // Don't clear user on network errors - they might just be offline
      } finally {
        verificationInProgress.current = false;
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Only verify if we have a stored user to validate
    if (storedUser) {
      verifySession();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const login = (user: User, token?: string) => {
    setUser(user);
    setStoredUser(user);
    // Mark session as verified
    localStorage.setItem(SESSION_VERIFIED_KEY, Date.now().toString());
  };

  const logout = async () => {
    setUser(null);
    removeStoredUser();
    localStorage.removeItem(SESSION_VERIFIED_KEY);
    try {
      // Logout from Firebase (used for email verification) and PHP backend
      await signOut(auth);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading,
        login, 
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mark as non-component export for Fast Refresh
// @refresh reset
export { AuthContext };