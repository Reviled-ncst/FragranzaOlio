import { createContext, useContext, useState, ReactNode } from 'react';

export type AuthModalMode = 'login' | 'signup';

interface AuthModalContextType {
  isOpen: boolean;
  defaultMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultMode, setDefaultMode] = useState<AuthModalMode>('login');

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setDefaultMode(mode);
    setIsOpen(true);
  };
  const closeAuthModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, defaultMode, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
