/**
 * Inventory Service - Handles all inventory management API calls
 */

const API_URL = 'http://localhost/FragranzaWeb/backend/api';

// Types
export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_warehouse: boolean;
  is_active: boolean;
  created_at: string;
}

export interface StockLevel {
  id: number;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  is_warehouse: boolean;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  product_price: number;
  variation_id: string | null;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  last_restocked: string | null;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

export interface InventoryTransaction {
  id: number;
  transaction_code: string;
  transaction_type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment' | 'return' | 'damaged';
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  variation_id: string | null;
  quantity: number;
  source_branch_id: number | null;
  source_branch_name: string | null;
  source_branch_code: string | null;
  destination_branch_id: number | null;
  destination_branch_name: string | null;
  destination_branch_code: string | null;
  branch_id: number | null;
  branch_name: string | null;
  branch_code: string | null;
  reference_type: string;
  reference_number: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  supplier: string | null;
  remarks: string | null;
  reason: string | null;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

export interface StockAlert {
  id: number;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  product_id: number;
  product_name: string;
  product_sku: string;
  variation_id: string | null;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  current_quantity: number;
  threshold_quantity: number;
  is_resolved: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_value: number;
  total_units: number;
  stock_status: {
    out_of_stock: number;
    low_stock: number;
    in_stock: number;
  };
  branch_count: number;
  recent_transactions: { transaction_type: string; count: number }[];
  pending_transfers: number;
}

export interface StockInData {
  branch_id: number;
  product_id: number;
  variation_id?: string;
  quantity: number;
  reference_type?: 'purchase_order' | 'return' | 'other';
  reference_number?: string;
  unit_cost?: number;
  supplier?: string;
  remarks?: string;
  reason?: string;
}

export interface StockOutData {
  branch_id: number;
  product_id: number;
  variation_id?: string;
  quantity: number;
  reason: string;
  reference_type?: 'sales_order' | 'damaged' | 'other';
  reference_number?: string;
  remarks?: string;
}

export interface TransferData {
  source_branch_id: number;
  destination_branch_id: number;
  product_id: number;
  variation_id?: string;
  quantity: number;
  reason?: string;
  remarks?: string;
  immediate?: boolean;
}

export interface AdjustmentData {
  branch_id: number;
  product_id: number;
  variation_id?: string;
  new_quantity: number;
  reason: string;
  remarks?: string;
}

// API Functions
export const inventoryService = {
  // Get all branches
  async getBranches(): Promise<Branch[]> {
    const response = await fetch(`${API_URL}/inventory.php?action=branches`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Get stock levels
  async getStockLevels(branchId?: number, productId?: number): Promise<StockLevel[]> {
    let url = `${API_URL}/inventory.php?action=stock-levels`;
    if (branchId) url += `&branch_id=${branchId}`;
    if (productId) url += `&product_id=${productId}`;
    
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Get transactions
  async getTransactions(limit = 50, type?: string, branchId?: number): Promise<InventoryTransaction[]> {
    let url = `${API_URL}/inventory.php?action=transactions&limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (branchId) url += `&branch_id=${branchId}`;
    
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Get alerts
  async getAlerts(): Promise<StockAlert[]> {
    const response = await fetch(`${API_URL}/inventory.php?action=alerts`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/inventory.php?action=dashboard`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Stock In
  async stockIn(stockData: StockInData): Promise<{ transaction_code: string; quantity_added: number }> {
    const response = await fetch(`${API_URL}/inventory.php?action=stock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(stockData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Stock Out
  async stockOut(stockData: StockOutData): Promise<{ transaction_code: string; quantity_removed: number }> {
    const response = await fetch(`${API_URL}/inventory.php?action=stock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(stockData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Transfer Stock
  async transferStock(transferData: TransferData): Promise<{ transaction_code: string; status: string; quantity_transferred: number }> {
    const response = await fetch(`${API_URL}/inventory.php?action=transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transferData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Complete Transfer
  async completeTransfer(transactionCode: string, receivedRemarks?: string): Promise<void> {
    const response = await fetch(`${API_URL}/inventory.php?action=complete-transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ transaction_code: transactionCode, received_remarks: receivedRemarks }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },

  // Adjust Stock
  async adjustStock(adjustmentData: AdjustmentData): Promise<{ transaction_code: string; previous_quantity: number; new_quantity: number; difference: number }> {
    const response = await fetch(`${API_URL}/inventory.php?action=adjustment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(adjustmentData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // Create Branch
  async createBranch(branchData: Partial<Branch>): Promise<{ id: number }> {
    const response = await fetch(`${API_URL}/inventory.php?action=branch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(branchData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
};

export default inventoryService;
