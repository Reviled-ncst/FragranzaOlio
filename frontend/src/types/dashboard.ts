/**
 * Dashboard Types
 * Fragranza Olio - Customer Dashboard
 */

import type { Product } from '../data/products';

// Order Status Types
export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string; // "Home", "Office", etc.
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: number;
  product?: Product;
  addedAt: string;
}

export interface RecentlyViewedItem {
  id: string;
  userId: string;
  productId: number;
  product?: Product;
  viewedAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  wishlistCount: number;
  rewardPoints: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'promo' | 'system' | 'account';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'order_placed' | 'order_delivered' | 'wishlist_added' | 'review_posted' | 'profile_updated';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}
