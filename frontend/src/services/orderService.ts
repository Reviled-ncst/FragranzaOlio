/**
 * Order Service
 * Handles customer order operations - create, view, track orders
 */

import api from './api';

// Types
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'in_transit' 
  | 'delivered' 
  | 'completed'
  | 'cancelled' 
  | 'return_requested' 
  | 'return_approved' 
  | 'returned' 
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
export type PaymentMethod = 'cod' | 'gcash' | 'maya' | 'bank_transfer' | 'card' | 'store_payment';

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  variation?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  
  // Shipping info
  shipping_address: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_zip?: string;
  shipping_method?: string; // 'delivery' | 'store_pickup'
  vehicle_type?: string;
  
  // Amounts
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  
  // Status
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  
  // Tracking
  tracking_number?: string;
  estimated_delivery?: string;
  
  // Items
  items: OrderItem[];
  
  // Invoice
  invoice_id?: number;
  invoice_number?: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  delivered_at?: string;
  notes?: string;
}

export interface CreateOrderData {
  // Customer info
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  user_id?: string;
  
  // Shipping
  shipping_address: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_zip?: string;
  shipping_method: 'delivery' | 'store_pickup';
  vehicle_type?: string;
  
  // Amounts
  subtotal: number;
  shipping_fee: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  
  // Payment
  payment_method: PaymentMethod;
  
  // Items
  items: Array<{
    product_id: number;
    product_name: string;
    variation?: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  
  notes?: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  stats?: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  order_number?: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount?: number;
  
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: string;
  
  notes?: string;
  terms?: string;
  
  items?: OrderItem[];
  created_at: string;
}

// Order Service Functions
const orderService = {
  /**
   * Get orders for the logged-in customer
   * Filters by customer email or user ID
   */
  async getMyOrders(email: string): Promise<OrdersResponse> {
    try {
      console.log('🔍 orderService.getMyOrders: Fetching orders for:', email);
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'orders',
          customer_email: email
        }
      });
      
      console.log('🔍 orderService.getMyOrders: Raw response:', response);
      
      return {
        success: response.success ?? true,
        data: response.data || [],
        stats: response.stats
      };
    } catch (error) {
      console.error('🔍 orderService.getMyOrders: Failed to fetch orders:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'order',
          id: orderId
        }
      });
      
      return {
        success: true,
        data: (response as any).data
      };
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return { 
        success: false, 
        data: {} as Order,
        message: 'Failed to fetch order'
      };
    }
  },

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    try {
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'order',
          order_number: orderNumber
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return { 
        success: false, 
        data: {} as Order,
        message: 'Failed to fetch order'
      };
    }
  },

  /**
   * Create a new order (customer checkout)
   */
  async createOrder(data: CreateOrderData): Promise<{ success: boolean; order_id?: number; order_number?: string; invoice_number?: string; message?: string }> {
    try {
      const response: any = await api.post('/sales.php?action=order', data);
      
      return {
        success: true,
        order_id: response.data?.id,
        order_number: response.data?.order_number,
        invoice_number: response.data?.invoice_number,
        message: response.message || 'Order placed successfully'
      };
    } catch (error: any) {
      console.error('Failed to create order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to place order'
      };
    }
  },

  /**
   * Track an order by order number (for guests)
   */
  async trackOrder(orderNumber: string, email: string): Promise<OrderResponse> {
    try {
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'track_order',
          order_number: orderNumber,
          email: email
        }
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Order,
        message: error.response?.data?.message || 'Order not found'
      };
    }
  },

  /**
   * Get invoice for an order
   */
  async getInvoice(orderId: number): Promise<{ success: boolean; data?: Invoice; message?: string }> {
    try {
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'invoice',
          order_id: orderId
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      return {
        success: false,
        message: 'Failed to fetch invoice'
      };
    }
  },

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<{ success: boolean; data?: Invoice; message?: string }> {
    try {
      const response: any = await api.get('/sales.php', {
        params: {
          action: 'invoice',
          invoice_number: invoiceNumber
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      return {
        success: false,
        message: 'Failed to fetch invoice'
      };
    }
  },

  /**
   * Cancel an order (if still pending)
   */
  async cancelOrder(orderId: number, reason?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response: any = await api.put('/sales.php?action=order-status', {
        id: orderId,
        status: 'cancelled',
        notes: reason
      });
      
      return {
        success: true,
        message: response.message || 'Order cancelled successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel order'
      };
    }
  },

  /**
   * Request a return/refund for a delivered or completed order
   */
  async requestReturn(orderId: number, reason?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response: any = await api.put('/sales.php?action=order-status', {
        id: orderId,
        status: 'return_requested',
        notes: reason || 'Return/refund requested by customer'
      });
      
      return {
        success: true,
        message: response.message || 'Return request submitted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to request return'
      };
    }
  },

  /**
   * Mark order as completed (by customer after receiving)
   */
  async completeOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response: any = await api.put('/sales.php?action=order-status', {
        id: orderId,
        status: 'completed'
      });
      
      return {
        success: true,
        message: response.message || 'Order marked as completed'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to complete order'
      };
    }
  }
};

export default orderService;
