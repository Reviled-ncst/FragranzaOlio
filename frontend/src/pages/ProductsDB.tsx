import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Grid3X3, List, X, ChevronLeft, ChevronRight } from 'lucide-react';

import ProductCard from '../components/ui/ProductCard';
import SectionHeader from '../components/ui/SectionHeader';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import productService, { Product, Category, ProductFilters } from '../services/productServicePHP';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
  { value: 'popular', label: 'Most Popular' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const hasFetchedOnce = useRef(false);
  
  // Filters - initialize from URL params once
  const [selectedCategory, setSelectedCategory] = useState<string>(() => 
    searchParams.get('category') || 'all'
  );
  const [sortBy, setSortBy] = useState<string>(() => 
    searchParams.get('sort') || 'featured'
  );
  const [searchQuery, setSearchQuery] = useState<string>(() => 
    searchParams.get('search') || ''
  );
  
  // View and UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
    // Prevent duplicate initial fetches
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const filters: ProductFilters = {
        page: currentPage,
        limit: productsPerPage,
        sort: sortBy as ProductFilters['sort'],
      };

      if (selectedCategory && selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await productService.getProducts(filters);

      if (response.success) {
        setProducts(response.data);
        setCategories(response.categories);
        setTotalPages(response.pagination.totalPages);
        setTotalProducts(response.pagination.total);
      } else {
        setError(response.error || 'Failed to load products');
      }
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortBy, searchQuery, currentPage]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL params when filters change (skip initial render)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    if (sortBy && sortBy !== 'featured') {
      params.set('sort', sortBy);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }
    setSearchParams(params, { replace: true });
  }, [selectedCategory, sortBy, searchQuery, currentPage]);

  // Handle search from header (external navigation)
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    
    // Only update if values actually differ (prevents loops)
    if (search !== searchQuery) {
      setSearchQuery(search);
    }
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [searchParams.get('search'), searchParams.get('category')]);

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Transform product for ProductCard component
  const transformProduct = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_main || '/assets/images/placeholder.png',
    category: product.category?.name || 'Uncategorized',
    isNew: product.is_new,
    isFeatured: product.is_featured,
  });

  return (
    <div className="pt-16 sm:pt-20">
      {/* Page Header */}
      <section className="bg-black-950 py-8 sm:py-12 lg:py-16">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Our Products"
            subtitle="Explore our complete collection of premium fragrances and beauty essentials"
            dark
          />
        </div>
      </section>

      {/* Filters Bar */}
      <section className="sticky top-16 sm:top-20 z-40 bg-black-900 border-b border-gold-500/20 shadow-dark">
        <div className="container-custom px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Results count */}
            <div className="text-gray-400 text-xs sm:text-sm">
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <span>Showing {products.length} of {totalProducts} products</span>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gold-500/30 rounded-sm text-white text-sm"
              >
                <SlidersHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Filters</span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-2 sm:px-4 py-2 sm:py-2.5 bg-black-800 border border-gold-500/30 rounded-sm text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 cursor-pointer flex-1 sm:flex-initial min-w-0"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="hidden md:flex border border-gold-500/30 rounded-sm overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:bg-black-800'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:bg-black-800'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="bg-black-900 border-b border-gold-500/10">
        <div className="container-custom px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm whitespace-nowrap transition-all text-xs sm:text-sm ${
                selectedCategory === 'all'
                  ? 'bg-gold-500 text-black font-medium'
                  : 'border border-gold-500/30 text-gray-400 hover:border-gold-500 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm whitespace-nowrap transition-all text-xs sm:text-sm ${
                  selectedCategory === category.slug
                    ? 'bg-gold-500 text-black font-medium'
                    : 'border border-gold-500/30 text-gray-400 hover:border-gold-500 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results Info */}
      {searchQuery && (
        <section className="bg-black-900">
          <div className="container-custom px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span>Search results for: </span>
              <span className="text-gold-500 font-medium">"{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 p-1 hover:bg-black-700 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="bg-black-950 py-6 sm:py-8 lg:py-12">
        <div className="container-custom px-4 sm:px-6">
          {isLoading ? (
            <ProductGridSkeleton count={productsPerPage} />
          ) : error ? (
            <div className="text-center py-8 sm:py-16">
              <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 sm:px-6 py-2 bg-gold-500 text-black rounded font-medium hover:bg-gold-400 text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 sm:py-16">
              <p className="text-gray-400 text-base sm:text-lg mb-2">No products found</p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'
                    : 'flex flex-col gap-3 sm:gap-4'
                }
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard {...transformProduct(product)} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 sm:mt-12">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded border border-gold-500/30 text-gray-400 hover:text-white hover:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <span key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded ${
                            currentPage === page
                              ? 'bg-gold-500 text-black font-medium'
                              : 'border border-gold-500/30 text-gray-400 hover:text-white hover:border-gold-500'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gold-500/30 text-gray-400 hover:text-white hover:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
