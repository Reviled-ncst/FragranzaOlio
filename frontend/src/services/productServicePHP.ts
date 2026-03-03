/**
 * Product Service - XAMPP/PHP Backend
 * Fragranza Olio - Products from Local MySQL
 */

import { API_BASE_URL, apiFetch, uploadFile } from './api';
import { getErrorMessage } from '../types/api';
import { apiCache, CACHE_TTL, cacheKeys } from './apiCache';

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
  // Flat category fields from API (before transform)
  category_name?: string;
  category_slug?: string;
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
    const cacheKey = cacheKeys.categories();
    const cached = apiCache.get<{ success: boolean; data: Category[]; error?: string }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiFetch(`${API_BASE_URL}/categories.php`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        apiCache.set(cacheKey, result, CACHE_TTL.LONG);
      }
      return result;
    } catch (error: unknown) {
      console.error('Categories error:', error);
      return { success: false, data: [], error: getErrorMessage(error) };
    }
  },

  /**
   * Get all products with filters
   */
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
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

    const cacheKey = cacheKeys.products(params.toString());
    const cached = apiCache.get<ProductsResponse>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${API_BASE_URL}/products.php${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiFetch(url, {
        credentials: 'include',
      });

      const result = await response.json();
      
      // Transform flat category fields into nested category object
      if (result.success && result.data) {
        result.data = result.data.map((product: Product) => ({
          ...product,
          category: product.category_id ? {
            id: product.category_id,
            name: product.category_name || 'Uncategorized',
            slug: product.category_slug || 'uncategorized',
          } : null,
        }));
        apiCache.set(cacheKey, result, CACHE_TTL.MEDIUM);
      }
      
      return result;
    } catch (error: unknown) {
      console.error(' Error fetching products:', error);
      return {
        success: false,
        data: [],
        categories: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        error: getErrorMessage(error),
      };
    }
  },

  /**
   * Get single product by ID
   */
  getProduct: async (id: number): Promise<ProductResponse> => {
    const cacheKey = cacheKeys.product(id);
    const cached = apiCache.get<ProductResponse>(cacheKey);
    if (cached) return cached;

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
        apiCache.set(cacheKey, result, CACHE_TTL.MEDIUM);
      }
      
      return result;
    } catch (error: unknown) {
      console.error('Product error:', error);
      return { success: false, data: null, error: getErrorMessage(error) };
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
    } catch (error: unknown) {
      console.error('Product error:', error);
      return { success: false, data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create new product
   */
  createProduct: async (data: Partial<Product>): Promise<{ success: boolean; data?: Product; error?: string }> => {
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
    } catch (error: unknown) {
      console.error('Create product error:', error);
      return { success: false, error: getErrorMessage(error) };
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
    } catch (error: unknown) {
      console.error('Update product error:', error);
      return { success: false, error: getErrorMessage(error) };
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
    } catch (error: unknown) {
      console.error('Delete product error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Upload product image.
   * Uses FormData multipart upload directly to Railway (bypasses the
   * Vercel proxy which has a 4.5 MB body limit).  The `uploadFile`
   * helper in api.ts automatically hits the Railway URL in production
   * and localhost in development.
   */
  uploadImage: async (file: File): Promise<{ success: boolean; data?: { filename: string; path: string; url: string }; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // uploadFile sends directly to Railway (not through Vercel proxy)
      const result = await uploadFile('/upload.php', formData) as { success: boolean; data?: { filename: string; path: string; url: string }; error?: string };
      return result;
    } catch (error: unknown) {
      console.error('Upload image error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },
};

export default productService;
