import api from './api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  product_count: number;
  created_at: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<CategoriesResponse> => {
    return api.get('/categories.php');
  },
};

export default categoryService;
