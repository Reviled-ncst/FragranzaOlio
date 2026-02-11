/**
 * Dashboard Service
 * Fragranza Olio - Customer Dashboard API
 */

import type { 
  Order, 
  Address, 
  WishlistItem, 
  RecentlyViewedItem, 
  DashboardStats,
  Notification,
  Activity
} from '../types/dashboard';
import { allProducts } from '../data/products';

// Simulated data for development - will be replaced with Supabase calls

// Mock Orders
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'FO-2026-001234',
    userId: '1',
    items: [
      {
        id: '1',
        productId: 1,
        productName: 'Blossom',
        productImage: "/assets/images/Women's Perfume/G1 Blossom.png",
        quantity: 1,
        price: 380,
        total: 380,
      },
      {
        id: '2',
        productId: 15,
        productName: 'Dark Oud',
        productImage: "/assets/images/Men's Perfume/B1 Dark Oud.png",
        quantity: 2,
        price: 450,
        total: 900,
      },
    ],
    subtotal: 1280,
    shippingFee: 150,
    tax: 153.6,
    discount: 0,
    total: 1583.6,
    status: 'shipped',
    paymentMethod: 'Credit Card',
    paymentStatus: 'paid',
    shippingAddress: {
      id: '1',
      userId: '1',
      label: 'Home',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: '123 Main Street, Barangay San Antonio',
      city: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines',
      isDefault: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    billingAddress: {
      id: '1',
      userId: '1',
      label: 'Home',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: '123 Main Street, Barangay San Antonio',
      city: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines',
      isDefault: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    trackingNumber: 'PH123456789',
    estimatedDelivery: '2026-02-08',
    createdAt: '2026-02-01T14:30:00Z',
    updatedAt: '2026-02-03T09:15:00Z',
  },
  {
    id: '2',
    orderNumber: 'FO-2026-001198',
    userId: '1',
    items: [
      {
        id: '3',
        productId: 5,
        productName: 'Bella',
        productImage: "/assets/images/Women's Perfume/G6 Bella.png",
        quantity: 1,
        price: 365,
        total: 365,
      },
    ],
    subtotal: 365,
    shippingFee: 150,
    tax: 43.8,
    discount: 50,
    total: 508.8,
    status: 'delivered',
    paymentMethod: 'GCash',
    paymentStatus: 'paid',
    shippingAddress: {
      id: '1',
      userId: '1',
      label: 'Home',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: '123 Main Street, Barangay San Antonio',
      city: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines',
      isDefault: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    billingAddress: {
      id: '1',
      userId: '1',
      label: 'Home',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: '123 Main Street, Barangay San Antonio',
      city: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines',
      isDefault: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-25T16:30:00Z',
  },
  {
    id: '3',
    orderNumber: 'FO-2026-001301',
    userId: '1',
    items: [
      {
        id: '4',
        productId: 2,
        productName: 'Aurora',
        productImage: "/assets/images/Women's Perfume/G3 Aurora.png",
        quantity: 1,
        price: 420,
        total: 420,
      },
    ],
    subtotal: 420,
    shippingFee: 0,
    tax: 50.4,
    discount: 0,
    total: 470.4,
    status: 'processing',
    paymentMethod: 'PayPal',
    paymentStatus: 'paid',
    shippingAddress: {
      id: '2',
      userId: '1',
      label: 'Office',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: 'BGC Corporate Center, 11th Floor',
      city: 'Taguig City',
      province: 'Metro Manila',
      zipCode: '1630',
      country: 'Philippines',
      isDefault: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    billingAddress: {
      id: '1',
      userId: '1',
      label: 'Home',
      firstName: 'Renz Russel',
      lastName: 'Bauto',
      phone: '+63 912 345 6789',
      address: '123 Main Street, Barangay San Antonio',
      city: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines',
      isDefault: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    createdAt: '2026-02-03T08:45:00Z',
    updatedAt: '2026-02-03T08:45:00Z',
  },
];

// Mock Addresses
const mockAddresses: Address[] = [
  {
    id: '1',
    userId: '1',
    label: 'Home',
    firstName: 'Renz Russel',
    lastName: 'Bauto',
    phone: '+63 912 345 6789',
    address: '123 Main Street, Barangay San Antonio',
    city: 'Makati City',
    province: 'Metro Manila',
    zipCode: '1200',
    country: 'Philippines',
    isDefault: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    label: 'Office',
    firstName: 'Renz Russel',
    lastName: 'Bauto',
    phone: '+63 912 345 6789',
    address: 'BGC Corporate Center, 11th Floor',
    city: 'Taguig City',
    province: 'Metro Manila',
    zipCode: '1630',
    country: 'Philippines',
    isDefault: false,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
];

// Mock Wishlist
const mockWishlist: WishlistItem[] = [
  { id: '1', userId: '1', productId: 3, addedAt: '2026-02-01T10:00:00Z' },
  { id: '2', userId: '1', productId: 8, addedAt: '2026-01-28T15:30:00Z' },
  { id: '3', userId: '1', productId: 12, addedAt: '2026-01-25T09:00:00Z' },
  { id: '4', userId: '1', productId: 18, addedAt: '2026-01-20T14:00:00Z' },
];

// Mock Recently Viewed
const mockRecentlyViewed: RecentlyViewedItem[] = [
  { id: '1', userId: '1', productId: 1, viewedAt: '2026-02-04T10:30:00Z' },
  { id: '2', userId: '1', productId: 15, viewedAt: '2026-02-04T10:15:00Z' },
  { id: '3', userId: '1', productId: 5, viewedAt: '2026-02-03T18:00:00Z' },
  { id: '4', userId: '1', productId: 9, viewedAt: '2026-02-03T12:00:00Z' },
  { id: '5', userId: '1', productId: 22, viewedAt: '2026-02-02T16:45:00Z' },
];

// Mock Notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'order',
    title: 'Order Shipped!',
    message: 'Your order FO-2026-001234 has been shipped and is on its way.',
    isRead: false,
    link: '/profile?tab=orders&order=1',
    createdAt: '2026-02-03T09:15:00Z',
  },
  {
    id: '2',
    userId: '1',
    type: 'promo',
    title: "Valentine's Day Sale 💕",
    message: 'Get 20% off on all fragrances! Use code LOVE20 at checkout.',
    isRead: false,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: '3',
    userId: '1',
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order FO-2026-001198 has been delivered. Enjoy your fragrance!',
    isRead: true,
    link: '/profile?tab=orders&order=2',
    createdAt: '2026-01-25T16:30:00Z',
  },
];

// Mock Activities
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'order_placed',
    title: 'Order Placed',
    description: 'You placed order #FO-2026-001301 for ₱470.40',
    timestamp: '2026-02-03T08:45:00Z',
  },
  {
    id: '2',
    type: 'wishlist_added',
    title: 'Added to Wishlist',
    description: 'Beatrice added to your wishlist',
    timestamp: '2026-02-01T10:00:00Z',
  },
  {
    id: '3',
    type: 'order_delivered',
    title: 'Order Delivered',
    description: 'Order #FO-2026-001198 was delivered',
    timestamp: '2026-01-25T16:30:00Z',
  },
  {
    id: '4',
    type: 'profile_updated',
    title: 'Profile Updated',
    description: 'You updated your shipping address',
    timestamp: '2026-01-20T10:00:00Z',
  },
];

// Dashboard Service
const dashboardService = {
  // Get dashboard stats
  async getStats(userId: string): Promise<DashboardStats> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const userOrders = mockOrders.filter(o => o.userId === userId);
    const completedOrders = userOrders.filter(o => o.status === 'delivered');
    const pendingOrders = userOrders.filter(o => 
      o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
    );
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const wishlistCount = mockWishlist.filter(w => w.userId === userId).length;
    
    return {
      totalOrders: userOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalSpent,
      wishlistCount,
      rewardPoints: Math.floor(totalSpent / 10), // 1 point per ₱10 spent
    };
  },

  // Get user orders
  async getOrders(userId: string, status?: string): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let orders = mockOrders.filter(o => o.userId === userId);
    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }
    return orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Get single order
  async getOrder(orderId: string): Promise<Order | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockOrders.find(o => o.id === orderId) || null;
  },

  // Get user addresses
  async getAddresses(userId: string): Promise<Address[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAddresses.filter(a => a.userId === userId);
  },

  // Add address
  async addAddress(address: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>> & { userId: string }): Promise<Address> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newAddress: Address = {
      id: String(mockAddresses.length + 1),
      userId: address.userId,
      label: address.label || 'Home',
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      province: address.province || '',
      zipCode: address.zipCode || '',
      country: address.country || 'Philippines',
      isDefault: address.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAddresses.push(newAddress);
    return newAddress;
  },

  // Update address
  async updateAddress(id: string, data: Partial<Address>): Promise<Address | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockAddresses.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    mockAddresses[index] = {
      ...mockAddresses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockAddresses[index];
  },

  // Delete address
  async deleteAddress(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockAddresses.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    mockAddresses.splice(index, 1);
    return true;
  },

  // Get wishlist
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const items = mockWishlist.filter(w => w.userId === userId);
    
    // Attach product data
    return items.map(item => ({
      ...item,
      product: allProducts.find(p => p.id === item.productId),
    }));
  },

  // Add to wishlist
  async addToWishlist(userId: string, productId: number): Promise<WishlistItem> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const existing = mockWishlist.find(
      w => w.userId === userId && w.productId === productId
    );
    if (existing) return existing;
    
    const newItem: WishlistItem = {
      id: String(mockWishlist.length + 1),
      userId,
      productId,
      addedAt: new Date().toISOString(),
      product: allProducts.find(p => p.id === productId),
    };
    mockWishlist.push(newItem);
    return newItem;
  },

  // Remove from wishlist
  async removeFromWishlist(userId: string, productId: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockWishlist.findIndex(
      w => w.userId === userId && w.productId === productId
    );
    if (index === -1) return false;
    
    mockWishlist.splice(index, 1);
    return true;
  },

  // Get recently viewed
  async getRecentlyViewed(userId: string, limit: number = 10): Promise<RecentlyViewedItem[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const items = mockRecentlyViewed
      .filter(r => r.userId === userId)
      .slice(0, limit);
    
    // Attach product data
    return items.map(item => ({
      ...item,
      product: allProducts.find(p => p.id === item.productId),
    }));
  },

  // Add to recently viewed
  async addToRecentlyViewed(userId: string, productId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Remove existing entry for this product
    const existingIndex = mockRecentlyViewed.findIndex(
      r => r.userId === userId && r.productId === productId
    );
    if (existingIndex !== -1) {
      mockRecentlyViewed.splice(existingIndex, 1);
    }
    
    // Add to beginning
    mockRecentlyViewed.unshift({
      id: String(Date.now()),
      userId,
      productId,
      viewedAt: new Date().toISOString(),
    });
    
    // Keep only last 20 items
    if (mockRecentlyViewed.length > 20) {
      mockRecentlyViewed.pop();
    }
  },

  // Get notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  // Mark notification as read
  async markNotificationRead(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const notification = mockNotifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  },

  // Mark all notifications as read
  async markAllNotificationsRead(userId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockNotifications
      .filter(n => n.userId === userId)
      .forEach(n => n.isRead = true);
    return true;
  },

  // Get activities
  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockActivities.slice(0, limit);
  },
};

export default dashboardService;
