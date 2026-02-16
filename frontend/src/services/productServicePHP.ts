/**
 * Product Service - XAMPP/PHP Backend
 * Fragranza Olio - Products from Local MySQL
 */

import { API_BASE_URL, apiFetch } from './api';

// Detect if we're on Vercel (production)
const isProduction = typeof window !== 'undefined' && 
  window.location.hostname.includes('vercel.app');

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
}

// Product Variation for different sizes/volumes
export interface ProductVariation {
  id: string;
  volume: string;           // e.g., "30ml", "50ml", "100ml"
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string;
  image: string | null;     // Variation-specific image
  description: string | null; // Optional variation-specific description
  isDefault: boolean;       // Is this the default displayed variation?
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: number | null;
  category?: Category;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  image_main: string | null;
  image_gallery: string[] | null;
  volume: string | null;
  concentration: string | null;
  ingredients: string | null;
  notes_top: string | null;
  notes_middle: string | null;
  notes_base: string | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock' | 'coming_soon';
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  rating: number;
  review_count: number;
  view_count: number;
  sold_count: number;
  variations?: ProductVariation[] | null;  // Size/volume variations
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  categoryId?: number;
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  stockStatus?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'name' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product | null;
  error?: string;
}

export const productService = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<{ success: boolean; data: Category[]; error?: string }> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/categories.php`, {
        credentials: 'include',
      });
      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Categories error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  /**
   * Get all products with filters
   */
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.categoryId) params.append('category_id', filters.categoryId.toString());
      if (filters?.category) params.append('category', filters.category);
      if (filters?.featured) params.append('featured', 'true');
      if (filters?.isNew) params.append('is_new', 'true');
      if (filters?.onSale) params.append('on_sale', 'true');
      if (filters?.stockStatus) params.append('stock_status', filters.stockStatus);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.minPrice) params.append('min_price', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('max_price', filters.maxPrice.toString());
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `${API_BASE_URL}/products.php${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiFetch(url, {
        credentials: 'include',
      });

      const result = await response.json();
      
      // Transform flat category fields into nested category object
      if (result.success && result.data) {
        result.data = result.data.map((product: any) => ({
          ...product,
          category: product.category_id ? {
            id: product.category_id,
            name: product.category_name || 'Uncategorized',
            slug: product.category_slug || 'uncategorized',
          } : null,
        }));
      }
      
      return result;
    } catch (error: any) {
      console.error(' Error fetching products:', error);
      return {
        success: false,
        data: [],
        categories: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        error: error.message,
      };
    }
  },

  /**
   * Get single product by ID
   */
  getProduct: async (id: number): Promise<ProductResponse> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/products.php?id=${id}`, {
        credentials: 'include',
      });
      const result = await response.json();
      
      // Transform flat category fields into nested category object
      if (result.success && result.data) {
        const product = result.data;
        result.data = {
          ...product,
          category: product.category_id ? {
            id: product.category_id,
            name: product.category_name || 'Uncategorized',
            slug: product.category_slug || 'uncategorized',
          } : null,
        };
      }
      
      return result;
    } catch (error: any) {
      console.error('Product error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Get single product by slug
   */
  getProductBySlug: async (slug: string): Promise<ProductResponse> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/products.php?slug=${slug}`, {
        credentials: 'include',
      });
      const result = await response.json();
      
      // Transform flat category fields into nested category object
      if (result.success && result.data) {
        const product = result.data;
        result.data = {
          ...product,
          category: product.category_id ? {
            id: product.category_id,
            name: product.category_name || 'Uncategorized',
            slug: product.category_slug || 'uncategorized',
          } : null,
        };
      }
      
      return result;
    } catch (error: any) {
      console.error('Product error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Create new product
   */
  createProduct: async (data: Partial<Product>): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Create product error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update product
   */
  updateProduct: async (id: number, data: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/products.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Update product error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete product (soft delete)
   */
  deleteProduct: async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/products.php?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Delete product error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload product image
   * In production, uses base64 JSON (via proxy). In dev, uses multipart/form-data.
   */
  uploadImage: async (file: File): Promise<{ success: boolean; data?: { filename: string; path: string; url: string }; error?: string }> => {
    try {
      if (isProduction) {
        // Convert file to base64 for proxy upload
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Send as JSON through the proxy
        const response = await apiFetch(`${API_BASE_URL}/upload.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64,
            filename: file.name,
          }),
        });

        const result = await response.json();
        return result;
      } else {
        // Development: use traditional multipart upload
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload.php`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        return result;
      }
    } catch (error: any) {
      console.error('Upload image error:', error);
      return { success: false, error: error.message };
    }
  },
};

export default productService;
