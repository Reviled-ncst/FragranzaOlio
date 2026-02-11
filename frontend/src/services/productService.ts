import api from './api';

export interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  price: number;
  image_main: string;
  image_gallery: string[];
  ingredients: string;
  volume: string;
  concentration: string;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  featured: boolean;
  is_new: boolean;
  rating: number;
  review_count: number;
  related_products?: Product[];
  created_at: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductFilters {
  category?: string;
  featured?: boolean;
  new?: boolean;
  stock_status?: string;
  search?: string;
  sort?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'name';
  page?: number;
  limit?: number;
}

export const productService = {
  // Get all products with optional filters
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `/products.php?${queryString}` : '/products.php';
    
    return api.get(url);
  },

  // Get single product by ID
  getProduct: async (id: number): Promise<ProductResponse> => {
    return api.get(`/products.php?id=${id}`);
  },

  // Get featured products
  getFeaturedProducts: async (limit = 4): Promise<ProductsResponse> => {
    return api.get(`/products.php?featured=true&limit=${limit}`);
  },

  // Get new products
  getNewProducts: async (limit = 4): Promise<ProductsResponse> => {
    return api.get(`/products.php?new=true&limit=${limit}`);
  },

  // Search products
  searchProducts: async (query: string): Promise<ProductsResponse> => {
    return api.get(`/products.php?search=${encodeURIComponent(query)}`);
  },
};

export default productService;
