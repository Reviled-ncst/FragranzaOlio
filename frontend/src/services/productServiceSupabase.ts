/**
 * Product Service - Supabase
 * Fragranza Olio - Products from Database
 */

import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
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
      const page = filters?.page || 1;
      const limit = filters?.limit || 12;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.category && filters.category !== 'all') {
        // Get category by slug first
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .single();
        
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.isNew) {
        query = query.eq('is_new', true);
      }

      if (filters?.onSale) {
        query = query.eq('is_on_sale', true);
      }

      if (filters?.stockStatus) {
        query = query.eq('stock_status', filters.stockStatus);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters?.sort) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'popular':
          query = query.order('sold_count', { ascending: false });
          break;
        case 'featured':
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        return {
          success: false,
          data: [],
          categories: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          error: error.message,
        };
      }

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: data || [],
        categories: categories || [],
        pagination: { page, limit, total, totalPages },
      };
    } catch (error: any) {
      console.error('Products error:', error);
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
   * Get single product by ID or slug
   */
  getProduct: async (idOrSlug: number | string): Promise<ProductResponse> => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `);

      if (typeof idOrSlug === 'number') {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching product:', error);
        return { success: false, data: null, error: error.message };
      }

      // Increment view count
      if (data) {
        await supabase
          .from('products')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Product error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Get featured products
   */
  getFeaturedProducts: async (limit = 8): Promise<ProductsResponse> => {
    return productService.getProducts({ featured: true, limit, sort: 'featured' });
  },

  /**
   * Get new arrivals
   */
  getNewProducts: async (limit = 8): Promise<ProductsResponse> => {
    return productService.getProducts({ isNew: true, limit, sort: 'newest' });
  },

  /**
   * Search products
   */
  searchProducts: async (query: string, limit = 20): Promise<ProductsResponse> => {
    return productService.getProducts({ search: query, limit });
  },

  /**
   * Get related products (same category)
   */
  getRelatedProducts: async (productId: number, categoryId: number, limit = 4): Promise<ProductsResponse> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(id, name, slug)`)
        .eq('category_id', categoryId)
        .neq('id', productId)
        .eq('is_active', true)
        .limit(limit);

      if (error) {
        return { success: false, data: [], categories: [], pagination: { page: 1, limit, total: 0, totalPages: 0 }, error: error.message };
      }

      return {
        success: true,
        data: data || [],
        categories: [],
        pagination: { page: 1, limit, total: data?.length || 0, totalPages: 1 },
      };
    } catch (error: any) {
      return { success: false, data: [], categories: [], pagination: { page: 1, limit, total: 0, totalPages: 0 }, error: error.message };
    }
  },

  // =====================================================
  // SALES/ADMIN FUNCTIONS
  // =====================================================

  /**
   * Create a new product (Sales/Admin)
   */
  createProduct: async (product: Partial<Product>): Promise<ProductResponse> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Update a product (Sales/Admin)
   */
  updateProduct: async (id: number, updates: Partial<Product>): Promise<ProductResponse> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Delete a product (Admin only)
   */
  deleteProduct: async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update stock quantity (Inventory)
   */
  updateStock: async (id: number, quantity: number): Promise<ProductResponse> => {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('low_stock_threshold')
        .eq('id', id)
        .single();

      const threshold = product?.low_stock_threshold || 10;
      let stockStatus: string = 'in_stock';
      
      if (quantity <= 0) {
        stockStatus = 'out_of_stock';
      } else if (quantity <= threshold) {
        stockStatus = 'low_stock';
      }

      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: quantity, stock_status: stockStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Get low stock products (Inventory/Sales)
   */
  getLowStockProducts: async (): Promise<ProductsResponse> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(id, name, slug)`)
        .in('stock_status', ['low_stock', 'out_of_stock'])
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true });

      if (error) {
        return { success: false, data: [], categories: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }, error: error.message };
      }

      return {
        success: true,
        data: data || [],
        categories: [],
        pagination: { page: 1, limit: 100, total: data?.length || 0, totalPages: 1 },
      };
    } catch (error: any) {
      return { success: false, data: [], categories: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }, error: error.message };
    }
  },
};

export default productService;
