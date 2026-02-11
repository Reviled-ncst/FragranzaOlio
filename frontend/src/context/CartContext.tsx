import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  variation: string;
  variationId?: string;
  price: number;
  quantity: number;
  image: string;
  maxStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: number, variationId?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'fragranza_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedCart = localStorage.getItem(`${CART_STORAGE_KEY}_${user.id}`);
      if (storedCart) {
        try {
          setItems(JSON.parse(storedCart));
        } catch (e) {
          console.error('Failed to parse cart:', e);
        }
      }
    } else {
      setItems([]);
    }
  }, [isAuthenticated, user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && user && items.length > 0) {
      localStorage.setItem(`${CART_STORAGE_KEY}_${user.id}`, JSON.stringify(items));
    }
  }, [items, isAuthenticated, user]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setItems(prev => {
      // Check if item already exists (same product and variation)
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && i.variationId === item.variationId
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        const newQuantity = updated[existingIndex].quantity + item.quantity;
        updated[existingIndex].quantity = item.maxStock 
          ? Math.min(newQuantity, item.maxStock) 
          : newQuantity;
        return updated;
      }

      // Add new item with unique id
      const newItem: CartItem = {
        ...item,
        id: Date.now(),
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    // Update localStorage
    if (isAuthenticated && user) {
      const updatedItems = items.filter(item => item.id !== id);
      if (updatedItems.length === 0) {
        localStorage.removeItem(`${CART_STORAGE_KEY}_${user.id}`);
      }
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: item.maxStock ? Math.min(quantity, item.maxStock) : quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    if (isAuthenticated && user) {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${user.id}`);
    }
  };

  const getCartTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const isInCart = (productId: number, variationId?: string) => {
    return items.some(
      item => item.productId === productId && item.variationId === variationId
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
