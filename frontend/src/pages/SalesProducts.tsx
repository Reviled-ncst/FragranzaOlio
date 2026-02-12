import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, IMAGE_BASE_URL } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit2, 
  Trash2, 
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  BarChart3,
  Image as ImageIcon,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Tag,
  Layers,
  Droplets,
  Check,
  Info,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import productService, { Product, Category } from '../services/productServicePHP';
import SalesLayout from '../components/layout/SalesLayout';

// SKU Prefix mapping for each category
const SKU_PREFIXES: Record<string, string> = {
  "Women's Perfume": 'WP',
  "Men's Perfume": 'MP',
  'Car Diffuser': 'CD',
  'Dish Washing': 'DW',
  'Soap': 'SP',
  'Alcohol': 'AL',
  'Helmet Spray': 'HS',
  'Disinfectants': 'DF',
};

// Smart compare price calculation (20-30% markup for "was" price)
const calculateComparePrice = (price: number): number => {
  if (price <= 0) return 0;
  // Round to nearest 5 or 10 for cleaner pricing
  const markup = price < 200 ? 1.25 : price < 500 ? 1.20 : 1.15; // 25%, 20%, or 15% higher
  const rawCompare = price * markup;
  // Round to nearest 5
  return Math.ceil(rawCompare / 5) * 5;
};

// Calculate discount percentage
const calculateDiscount = (price: number, comparePrice: number | null): number => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};

// Pre-filled product templates for each category
interface CategoryTemplate {
  price: number;
  volume: string;
  concentration: string;
  short_description: string;
  description: string;
  notes_top: string | null;
  notes_middle: string | null;
  notes_base: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  "Women's Perfume": {
    price: 380,
    volume: '50ml',
    concentration: 'Eau de Parfum',
    short_description: 'An elegant and captivating fragrance for the modern woman',
    description: 'A luxurious scent that embodies femininity and grace. Perfect for any occasion, from daily wear to special events.',
    notes_top: 'Bergamot, Pink Pepper, Pear',
    notes_middle: 'Rose, Jasmine, Peony',
    notes_base: 'Musk, Vanilla, Sandalwood',
    stock_quantity: 50,
    low_stock_threshold: 10,
  },
  "Men's Perfume": {
    price: 380,
    volume: '50ml',
    concentration: 'Eau de Parfum',
    short_description: 'A bold and sophisticated fragrance for the confident man',
    description: 'A powerful yet refined scent that commands attention. Designed for the modern gentleman who appreciates quality.',
    notes_top: 'Bergamot, Lemon, Grapefruit',
    notes_middle: 'Lavender, Geranium, Cardamom',
    notes_base: 'Cedarwood, Vetiver, Amber',
    stock_quantity: 50,
    low_stock_threshold: 10,
  },
  'Car Diffuser': {
    price: 250,
    volume: '10ml',
    concentration: 'Essential Oil Blend',
    short_description: 'Long-lasting car air freshener with premium fragrance',
    description: 'Transform your driving experience with our premium car diffuser. Lasts up to 30 days with adjustable intensity.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 100,
    low_stock_threshold: 20,
  },
  'Dish Washing': {
    price: 120,
    volume: '500ml',
    concentration: 'Concentrated Formula',
    short_description: 'Powerful grease-cutting dishwashing liquid',
    description: 'Effectively removes grease and grime while being gentle on hands. Pleasant scent that leaves dishes sparkling clean.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 100,
    low_stock_threshold: 25,
  },
  'Soap': {
    price: 85,
    volume: '100g',
    concentration: 'Bar Soap',
    short_description: 'Moisturizing bath soap with natural ingredients',
    description: 'Gentle cleansing bar enriched with natural oils and vitamins. Leaves skin soft, smooth, and delicately scented.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 150,
    low_stock_threshold: 30,
  },
  'Alcohol': {
    price: 95,
    volume: '500ml',
    concentration: '70% Isopropyl',
    short_description: 'Medical-grade disinfecting alcohol',
    description: 'Hospital-grade isopropyl alcohol for sanitization and disinfection. Quick-drying formula with added moisturizer.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 200,
    low_stock_threshold: 50,
  },
  'Helmet Spray': {
    price: 150,
    volume: '100ml',
    concentration: 'Antibacterial Formula',
    short_description: 'Odor-eliminating helmet sanitizer spray',
    description: 'Eliminates bacteria and odor from helmets and protective gear. Quick-drying, non-staining formula with fresh scent.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 80,
    low_stock_threshold: 15,
  },
  'Disinfectants': {
    price: 180,
    volume: '500ml',
    concentration: 'Multi-Surface',
    short_description: 'Hospital-grade multi-surface disinfectant',
    description: 'Kills 99.9% of germs and bacteria. Safe for use on all surfaces including countertops, floors, and bathroom fixtures.',
    notes_top: null,
    notes_middle: null,
    notes_base: null,
    stock_quantity: 100,
    low_stock_threshold: 25,
  },
};

// Generate SKU based on category and product name
const generateSKU = (categoryName: string, productName: string, existingProducts: Product[]): string => {
  const prefix = SKU_PREFIXES[categoryName] || 'PR';
  
  // Create a short code from product name (first 3-4 letters, uppercase)
  const nameCode = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
  
  // Find existing products with same prefix to determine next number
  const existingWithPrefix = existingProducts.filter(p => p.sku?.startsWith(prefix));
  const nextNumber = String(existingWithPrefix.length + 1).padStart(3, '0');
  
  return `${prefix}-${nameCode || 'NEW'}-${nextNumber}`;
};

const SalesProducts = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'notes' | 'pricing'>('basic');
  
  // View Product Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewGalleryIndex, setViewGalleryIndex] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Gallery images state
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  
  // Product Variations state - each variation has its own image, price, stock
  interface ProductVariation {
    id: string;
    volume: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    sku: string;
    image: string | null;      // URL or preview for variation image
    imageFile?: File | null;   // File to upload (for new images)
    description: string | null;
    isDefault: boolean;
  }
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  // Store all products for filtering
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Fetch products (no dependencies to prevent re-fetch loops)
  const fetchProducts = useCallback(async () => {
    console.log('📦 Fetching products from API...');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productService.getProducts({ limit: 100 });
      console.log('📦 API Response:', response);
      
      if (response.success) {
        console.log('✅ Products loaded:', response.data?.length, 'Categories:', response.categories?.length);
        setAllProducts(response.data || []);
        setCategories(response.categories || []);
        
        // Calculate stats
        const data = response.data || [];
        setStats({
          totalProducts: data.length,
          inStock: data.filter(p => p.stock_status === 'in_stock').length,
          lowStock: data.filter(p => p.stock_status === 'low_stock').length,
          outOfStock: data.filter(p => p.stock_status === 'out_of_stock').length,
          totalValue: data.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0),
        });
      } else {
        console.error('❌ API returned error:', response.error);
        setError(response.error || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters locally (no API calls)
  useEffect(() => {
    let filtered = [...allProducts];
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category?.slug === selectedCategory);
    }
    
    if (stockFilter !== 'all') {
      filtered = filtered.filter(p => p.stock_status === stockFilter);
    }
    
    setProducts(filtered);
  }, [allProducts, searchQuery, selectedCategory, stockFilter]);

  // Fetch once on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('📦 Component mounted, isAuthenticated:', isAuthenticated, 'hasFetched:', hasFetched.current);
      if (!hasFetched.current) {
        hasFetched.current = true;
        fetchProducts();
      }
    }
    
    // Reset on unmount so it fetches again next time
    return () => {
      hasFetched.current = false;
    };
  }, [isAuthenticated, authLoading, fetchProducts]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'sales' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">In Stock</span>;
      case 'low_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Low Stock</span>;
      case 'out_of_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Out of Stock</span>;
      case 'coming_soon':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Coming Soon</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  const handleAddProduct = () => {
    setIsNewProduct(true);
    setActiveTab('basic');
    setImagePreview(null);
    setImageFile(null);
    setGalleryPreviews([]);
    setGalleryFiles([]);
    setVariations([]);
    
    // Get first category and its template
    const firstCategory = categories.length > 0 ? categories[0] : null;
    const categoryName = firstCategory?.name || '';
    const template = CATEGORY_TEMPLATES[categoryName];
    
    setEditingProduct({
      id: 0,
      name: '',
      slug: '',
      price: template?.price || 0,
      stock_quantity: template?.stock_quantity || 0,
      stock_status: 'in_stock',
      low_stock_threshold: template?.low_stock_threshold || 10,
      is_active: true,
      is_featured: false,
      is_new: true,
      is_on_sale: false,
      rating: 0,
      review_count: 0,
      view_count: 0,
      sold_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: template?.description || null,
      short_description: template?.short_description || null,
      category_id: firstCategory?.id || null,
      compare_price: template?.price ? calculateComparePrice(template.price) : null,
      cost_price: null,
      sku: '',
      barcode: null,
      image_main: null,
      image_gallery: null,
      volume: template?.volume || '',
      concentration: template?.concentration || '',
      ingredients: null,
      notes_top: template?.notes_top || null,
      notes_middle: template?.notes_middle || null,
      notes_base: template?.notes_base || null,
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsNewProduct(false);
    setActiveTab('basic');
    setImagePreview(product.image_main ? `${IMAGE_BASE_URL}${product.image_main}` : null);
    setImageFile(null);
    // Load existing gallery images
    if (product.image_gallery && product.image_gallery.length > 0) {
      setGalleryPreviews(product.image_gallery.map(img => 
        img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`
      ));
    } else {
      setGalleryPreviews([]);
    }
    setGalleryFiles([]);
    // Load existing variations
    if (product.variations && product.variations.length > 0) {
      setVariations(product.variations.map(v => ({
        ...v,
        imageFile: null, // No file to upload for existing images
      })));
    } else {
      setVariations([]);
    }
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, image_main: null });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    // Validate required fields
    if (!editingProduct.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (editingProduct.price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    // Generate slug from name if new product
    if (isNewProduct && !editingProduct.slug) {
      editingProduct.slug = editingProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    setIsSaving(true);
    try {
      let imageUrl = editingProduct.image_main;
      let galleryUrls: string[] = editingProduct.image_gallery || [];
      
      // Upload main image first if there's a new file
      if (imageFile) {
        setIsUploading(true);
        const uploadResponse = await productService.uploadImage(imageFile);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        } else {
          alert(uploadResponse.error || 'Failed to upload image');
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
      }
      
      // Upload gallery images if there are new files
      if (galleryFiles.length > 0) {
        setIsUploading(true);
        const uploadPromises = galleryFiles.map(file => productService.uploadImage(file));
        const uploadResults = await Promise.all(uploadPromises);
        
        const newGalleryUrls = uploadResults
          .filter(r => r.success && r.data)
          .map(r => r.data!.url);
        
        galleryUrls = [...galleryUrls, ...newGalleryUrls];
      }
      
      // Upload variation images if there are new files
      const processedVariations = await Promise.all(
        variations.map(async (variation) => {
          let variationImageUrl = variation.image;
          
          // Check if it's a blob/data URL (new upload) and has a file
          if (variation.imageFile) {
            const uploadResponse = await productService.uploadImage(variation.imageFile);
            if (uploadResponse.success && uploadResponse.data) {
              variationImageUrl = uploadResponse.data.url;
            }
          }
          
          // Return clean variation object without imageFile
          return {
            id: variation.id,
            volume: variation.volume,
            price: variation.price,
            comparePrice: variation.comparePrice,
            stock: variation.stock,
            sku: variation.sku,
            image: variationImageUrl,
            description: variation.description,
            isDefault: variation.isDefault,
          };
        })
      );
      
      setIsUploading(false);
      
      let response;
      
      if (isNewProduct) {
        // Create new product
        response = await productService.createProduct({
          name: editingProduct.name,
          slug: editingProduct.slug,
          description: editingProduct.description,
          short_description: editingProduct.short_description,
          price: editingProduct.price,
          compare_price: editingProduct.compare_price,
          cost_price: editingProduct.cost_price,
          stock_quantity: editingProduct.stock_quantity,
          category_id: editingProduct.category_id,
          volume: editingProduct.volume,
          concentration: editingProduct.concentration,
          sku: editingProduct.sku,
          barcode: editingProduct.barcode,
          image_main: imageUrl,
          image_gallery: galleryUrls.length > 0 ? galleryUrls : null,
          variations: processedVariations.length > 0 ? processedVariations : null,
          notes_top: editingProduct.notes_top,
          notes_middle: editingProduct.notes_middle,
          notes_base: editingProduct.notes_base,
          ingredients: editingProduct.ingredients,
          is_featured: editingProduct.is_featured,
          is_new: editingProduct.is_new,
          is_on_sale: editingProduct.is_on_sale,
          is_active: editingProduct.is_active,
        });
      } else {
        // Update existing product
        response = await productService.updateProduct(editingProduct.id, {
          name: editingProduct.name,
          description: editingProduct.description,
          short_description: editingProduct.short_description,
          price: editingProduct.price,
          compare_price: editingProduct.compare_price,
          cost_price: editingProduct.cost_price,
          stock_quantity: editingProduct.stock_quantity,
          volume: editingProduct.volume,
          concentration: editingProduct.concentration,
          category_id: editingProduct.category_id,
          sku: editingProduct.sku,
          barcode: editingProduct.barcode,
          image_main: imageUrl,
          image_gallery: galleryUrls.length > 0 ? galleryUrls : null,
          variations: processedVariations.length > 0 ? processedVariations : null,
          notes_top: editingProduct.notes_top,
          notes_middle: editingProduct.notes_middle,
          notes_base: editingProduct.notes_base,
          ingredients: editingProduct.ingredients,
          is_featured: editingProduct.is_featured,
          is_new: editingProduct.is_new,
          is_on_sale: editingProduct.is_on_sale,
          is_active: editingProduct.is_active,
        });
      }
      
      if (response.success) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setIsNewProduct(false);
        setImageFile(null);
        setImagePreview(null);
        setGalleryFiles([]);
        setGalleryPreviews([]);
        hasFetched.current = false; // Reset to allow re-fetch
        fetchProducts();
      } else {
        alert(response.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SalesLayout title="Product Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400">
              Manage your product catalog, pricing, and inventory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-black-800 border border-gold-500/30 rounded-lg text-gray-400 hover:text-white">
              <Download size={18} />
              Export
            </button>
            <button 
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-gold-500" size={20} />
              <span className="text-gray-400 text-sm">Total Products</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
          </div>
          
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-400" size={20} />
              <span className="text-gray-400 text-sm">In Stock</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.inStock}</p>
          </div>
          
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="text-yellow-400" size={20} />
              <span className="text-gray-400 text-sm">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.lowStock}</p>
          </div>
          
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="text-red-400" size={20} />
              <span className="text-gray-400 text-sm">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.outOfStock}</p>
          </div>
          
          <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-gold-500" size={20} />
              <span className="text-gray-400 text-sm">Inventory Value</span>
            </div>
            <p className="text-2xl font-bold text-white">₱{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            
            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-black-900 border border-gold-500/20 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-gold-500 text-black rounded font-medium hover:bg-gold-400"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black-800">
                  <tr>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Product</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">SKU</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Category</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Stock</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-gold-500/10 hover:bg-black-800/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-black-700 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image_main ? (
                              <img
                                src={product.image_main.startsWith('http') ? product.image_main : `${IMAGE_BASE_URL}${product.image_main}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="text-gray-500" size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.volume}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{product.sku || '-'}</td>
                      <td className="py-4 px-4 text-gray-400">{product.category?.name || '-'}</td>
                      <td className="py-4 px-4 text-white font-medium">₱{product.price.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${
                          product.stock_quantity <= 0 ? 'text-red-400' :
                          product.stock_quantity <= product.low_stock_threshold ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4">{getStockStatusBadge(product.stock_status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-gray-400 hover:text-gold-500 rounded hover:bg-black-700"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setViewingProduct(product);
                              setViewGalleryIndex(0);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-400 rounded hover:bg-black-700"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit/Add Product Modal */}
        <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-gradient-to-br from-black-900 via-black-900 to-black-800 border border-gold-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-gold-500/10"
            >
              {/* Modal Header - Enhanced */}
              <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-gold-500/10 to-transparent border-b border-gold-500/20">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gold-500/20 rounded-xl">
                    {isNewProduct ? <Plus size={20} className="sm:w-6 sm:h-6 text-gold-500" /> : <Edit2 size={20} className="sm:w-6 sm:h-6 text-gold-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-display font-bold text-white">
                      {isNewProduct ? 'Add New Product' : 'Edit Product'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">
                      {isNewProduct ? 'Create a new product for your inventory' : `Updating: ${editingProduct.name}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setIsNewProduct(false);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="p-2 sm:p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all hover:rotate-90 duration-300"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Step Progress Indicator */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-black-800/80 to-black-900/80 border-b border-gold-500/10 overflow-x-auto">
                <div className="flex items-center justify-between max-w-2xl mx-auto min-w-max sm:min-w-0">
                  {(() => {
                    // Validation status for each step
                    const stepValidation = {
                      basic: !!(editingProduct.name?.trim() && editingProduct.category_id && editingProduct.price > 0),
                      details: !!(editingProduct.volume?.trim()),
                      notes: true,
                      pricing: editingProduct.stock_quantity >= 0,
                    };
                    
                    return [
                      { id: 'basic', label: 'Basic Info', shortLabel: 'Basic', icon: Package, step: 1, isValid: stepValidation.basic },
                      { id: 'details', label: 'Details', shortLabel: 'Details', icon: Layers, step: 2, isValid: stepValidation.details },
                      { id: 'notes', label: 'Fragrance', shortLabel: 'Scent', icon: Droplets, step: 3, isValid: stepValidation.notes },
                      { id: 'pricing', label: 'Pricing', shortLabel: 'Price', icon: Tag, step: 4, isValid: stepValidation.pricing },
                    ].map((tab, index, arr) => {
                      const tabs = ['basic', 'details', 'notes', 'pricing'];
                      const currentIndex = tabs.indexOf(activeTab);
                      const isActive = activeTab === tab.id;
                      const isCompleted = tab.isValid && currentIndex > index;
                      const canClick = index === 0 || arr.slice(0, index).every(t => t.isValid);
                      
                      return (
                        <div key={tab.id} className="flex items-center">
                          <button
                            onClick={() => {
                              if (canClick) {
                                setActiveTab(tab.id as typeof activeTab);
                              }
                            }}
                            disabled={!canClick}
                            className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${!canClick ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isActive 
                                ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/30 scale-110' 
                                : isCompleted
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                  : tab.isValid
                                    ? 'bg-black-700 text-gray-400 border border-gold-500/30 group-hover:border-gold-500/50 group-hover:text-gray-300'
                                    : 'bg-black-700 text-gray-600 border border-gray-700'
                            }`}>
                              {isCompleted ? <Check size={14} className="sm:w-[18px] sm:h-[18px]" /> : <tab.icon size={14} className="sm:w-[18px] sm:h-[18px]" />}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                              isActive ? 'text-gold-400' : isCompleted ? 'text-green-400' : canClick ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-600'
                            }`}>
                              <span className="hidden sm:inline">{tab.label}</span>
                              <span className="sm:hidden">{tab.shortLabel}</span>
                            </span>
                            {!tab.isValid && !isActive && index < currentIndex && (
                              <span className="absolute -top-1 -right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-yellow-500 rounded-full" />
                            )}
                          </button>
                          {index < 3 && (
                            <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 mt-[-18px] transition-colors ${
                              isCompleted ? 'bg-green-500/50' : canClick ? 'bg-gold-500/20' : 'bg-gray-700'
                            }`} />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    {/* Unified Image Upload Section */}
                    <div className="bg-gradient-to-br from-black-800/80 to-black-900/60 rounded-2xl p-6 border border-gold-500/20 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gold-500/10 rounded-lg">
                            <ImageIcon size={20} className="text-gold-500" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">Product Images</h4>
                            <p className="text-xs text-gray-500">First image = main, rest = gallery (up to 6 total)</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">{(imagePreview ? 1 : 0) + galleryPreviews.length}/6</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {/* Main Image (First) */}
                        {imagePreview && (
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gold-500/50 shadow-lg group">
                            <img src={imagePreview} alt="Main" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gold-500 rounded text-[10px] text-black font-semibold">
                              MAIN
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  // Move first gallery image to main if available
                                  if (galleryPreviews.length > 0) {
                                    setImagePreview(galleryPreviews[0]);
                                    setImageFile(galleryFiles[0] || null);
                                    setGalleryPreviews(prev => prev.slice(1));
                                    setGalleryFiles(prev => prev.slice(1));
                                  } else {
                                    setImagePreview(null);
                                    setImageFile(null);
                                  }
                                }}
                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                title="Remove"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Gallery Images */}
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gold-500/20 group">
                            <img src={preview} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-gray-300">
                              {index + 2}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {/* Make Main Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  // Swap with main
                                  const currentMain = imagePreview;
                                  const currentMainFile = imageFile;
                                  setImagePreview(preview);
                                  setImageFile(galleryFiles[index] || null);
                                  if (currentMain) {
                                    setGalleryPreviews(prev => {
                                      const updated = [...prev];
                                      updated[index] = currentMain;
                                      return updated;
                                    });
                                    setGalleryFiles(prev => {
                                      const updated = [...prev];
                                      updated[index] = currentMainFile!;
                                      return updated;
                                    });
                                  } else {
                                    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
                                    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
                                  }
                                }}
                                className="p-1.5 bg-gold-500 text-black rounded-lg hover:bg-gold-400"
                                title="Make main image"
                              >
                                <Star size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
                                  setGalleryFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add Image Button */}
                        {((imagePreview ? 1 : 0) + galleryPreviews.length) < 6 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-xl border-2 border-dashed border-gold-500/30 hover:border-gold-500/50 hover:bg-black-700/50 transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                              <Plus size={20} className="text-gold-500" />
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-gray-400">Add Image</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Hidden File Input - supports multiple */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const currentTotal = (imagePreview ? 1 : 0) + galleryPreviews.length;
                          const remainingSlots = 6 - currentTotal;
                          const filesToAdd = files.slice(0, remainingSlots);
                          
                          filesToAdd.forEach((file, idx) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              // First file goes to main if no main exists
                              if (!imagePreview && idx === 0) {
                                setImagePreview(reader.result as string);
                                setImageFile(file);
                              } else {
                                setGalleryPreviews(prev => [...prev, reader.result as string]);
                                setGalleryFiles(prev => [...prev, file]);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      
                      {/* Tips */}
                      <div className="mt-4 p-3 bg-black-700/30 rounded-lg border border-gold-500/10">
                        <p className="text-xs text-gray-500">
                          <span className="text-gold-400">Tip:</span> Drag images to reorder. Click ★ to set as main image. Formats: JPEG, PNG, WebP, GIF (max 5MB each)
                        </p>
                      </div>
                      
                      {/* Variations Preview Section */}
                      {variations.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-gold-500/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Layers size={16} className="text-gold-500" />
                              <span className="text-sm font-medium text-gray-300">Size Variations ({variations.length})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('details')}
                              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                            >
                              Manage Variations
                              <ChevronRight size={14} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {variations.map((variation, index) => (
                              <button
                                key={variation.id}
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className="relative bg-black-700/50 rounded-xl border border-gold-500/20 hover:border-gold-500/40 p-2 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Variation Image Thumbnail */}
                                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
                                    {variation.image ? (
                                      <img 
                                        src={variation.image.startsWith('http') || variation.image.startsWith('data:') || variation.image.startsWith('blob:') 
                                          ? variation.image 
                                          : `${IMAGE_BASE_URL}${variation.image}`}
                                        alt={variation.volume}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <ImageIcon size={16} className="text-gray-600" />
                                        <span className="text-[8px] text-gray-600 mt-0.5">No img</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Variation Info */}
                                  <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium text-white">{variation.volume || `Var ${index + 1}`}</span>
                                      {variation.isDefault && (
                                        <span className="px-1 py-0.5 bg-gold-500/20 text-gold-400 text-[8px] font-bold rounded">DEFAULT</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gold-400">₱{variation.price.toLocaleString()}</span>
                                    <span className={`block text-[10px] ${variation.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {variation.stock} in stock
                                    </span>
                                  </div>
                                </div>
                                {/* Hover indicator */}
                                <div className="absolute inset-0 rounded-xl bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[10px] text-gold-400 bg-black-900/80 px-2 py-1 rounded">Click to edit</span>
                                </div>
                              </button>
                            ))}
                            {/* Add Variation Quick Button */}
                            <button
                              type="button"
                              onClick={() => setActiveTab('details')}
                              className="w-14 h-[74px] rounded-xl border-2 border-dashed border-gold-500/20 hover:border-gold-500/40 flex flex-col items-center justify-center gap-1 transition-colors"
                            >
                              <Plus size={16} className="text-gold-500/60" />
                              <span className="text-[9px] text-gray-500">Add</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Basic Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Product Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            // Auto-generate SKU for new products when name changes
                            if (isNewProduct && editingProduct.category_id) {
                              const categoryName = categories.find(c => c.id === editingProduct.category_id)?.name || '';
                              const newSku = generateSKU(categoryName, newName, allProducts);
                              setEditingProduct({ ...editingProduct, name: newName, sku: newSku });
                            } else {
                              setEditingProduct({ ...editingProduct, name: newName });
                            }
                          }}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SKU <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingProduct.sku || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                            className="flex-1 px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            placeholder="Auto-generated or enter manually"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const categoryName = categories.find(c => c.id === editingProduct.category_id)?.name || '';
                              const newSku = generateSKU(categoryName, editingProduct.name, allProducts);
                              setEditingProduct({ ...editingProduct, sku: newSku });
                            }}
                            className="px-3 py-2 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/20 text-sm whitespace-nowrap"
                            title="Generate SKU automatically"
                          >
                            Generate
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Format: {SKU_PREFIXES[categories.find(c => c.id === editingProduct.category_id)?.name || ''] || 'XX'}-NAME-001
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                          value={editingProduct.category_id || ''}
                          onChange={(e) => {
                            const newCategoryId = e.target.value ? parseInt(e.target.value) : null;
                            const categoryName = categories.find(c => c.id === newCategoryId)?.name || '';
                            const template = CATEGORY_TEMPLATES[categoryName];
                            const newSku = isNewProduct && editingProduct.name 
                              ? generateSKU(categoryName, editingProduct.name, allProducts)
                              : editingProduct.sku;
                            
                            // Apply template for new products when category changes
                            if (isNewProduct && template) {
                              setEditingProduct({ 
                                ...editingProduct, 
                                category_id: newCategoryId,
                                sku: newSku,
                                price: template.price,
                                compare_price: calculateComparePrice(template.price),
                                volume: template.volume,
                                concentration: template.concentration,
                                short_description: template.short_description,
                                description: template.description,
                                notes_top: template.notes_top,
                                notes_middle: template.notes_middle,
                                notes_base: template.notes_base,
                                stock_quantity: template.stock_quantity,
                                low_stock_threshold: template.low_stock_threshold,
                              });
                            } else {
                              setEditingProduct({ 
                                ...editingProduct, 
                                category_id: newCategoryId,
                                sku: newSku
                              });
                            }
                          }}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Short Description</label>
                        <textarea
                          value={editingProduct.short_description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                          rows={2}
                          placeholder="Brief product description (displayed on product cards)"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
                        <textarea
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                          rows={4}
                          placeholder="Detailed product description (displayed on product detail page)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Product Variations Section */}
                    <div className="bg-gradient-to-br from-black-800/80 to-black-900/60 rounded-2xl p-6 border border-gold-500/20 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gold-500/10 rounded-lg">
                            <Layers size={20} className="text-gold-500" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">Volume & Size Variations</h4>
                            <p className="text-xs text-gray-500">Add different sizes with their prices</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariation: ProductVariation = {
                              id: `var-${Date.now()}`,
                              volume: '',
                              price: editingProduct?.price || 0,
                              comparePrice: null,
                              stock: 50,
                              sku: `${editingProduct?.sku || 'NEW'}-V${variations.length + 1}`,
                              image: null,
                              imageFile: null,
                              description: null,
                              isDefault: variations.length === 0, // First one is default
                            };
                            setVariations([...variations, newVariation]);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/20 transition-colors text-sm font-medium"
                        >
                          <Plus size={16} />
                          Add Variation
                        </button>
                      </div>

                      {/* Default/Main Product Size */}
                      <div className="mb-4 p-4 bg-black-700/50 rounded-xl border border-gold-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-medium rounded">DEFAULT</span>
                          <span className="text-sm text-gray-400">Main product size</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Volume/Size</label>
                            <input
                              type="text"
                              value={editingProduct?.volume || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct!, volume: e.target.value })}
                              className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                              placeholder="e.g., 50ml"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Price (₱)</label>
                            <input
                              type="number"
                              value={editingProduct?.price || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct!, price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Compare Price</label>
                            <input
                              type="number"
                              value={editingProduct?.compare_price || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct!, compare_price: parseFloat(e.target.value) || null })}
                              className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Stock</label>
                            <input
                              type="number"
                              value={editingProduct?.stock_quantity || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct!, stock_quantity: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Variations */}
                      {variations.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-gray-300">Additional Sizes</p>
                          {variations.map((variation, index) => (
                            <div key={variation.id} className="bg-black-700/30 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition-colors overflow-hidden">
                              {/* Variation Header */}
                              <div className="flex items-center justify-between px-4 py-3 bg-black-800/50 border-b border-gold-500/10">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-white">Variation {index + 1}</span>
                                  {variation.isDefault && (
                                    <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-medium rounded">DEFAULT</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!variation.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = variations.map(v => ({ ...v, isDefault: v.id === variation.id }));
                                        setVariations(updated);
                                      }}
                                      className="px-2 py-1 text-xs text-gold-400 hover:bg-gold-500/10 rounded transition-colors"
                                      title="Set as default"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setVariations(variations.filter(v => v.id !== variation.id))}
                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Remove variation"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Variation Content */}
                              <div className="p-4">
                                <div className="flex gap-4">
                                  {/* Variation Image */}
                                  <div className="flex-shrink-0">
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Image</label>
                                    <div className="relative w-24 h-24 bg-black-800 rounded-lg border border-gold-500/20 overflow-hidden group">
                                      {variation.image ? (
                                        <>
                                          <img 
                                            src={variation.image.startsWith('http') || variation.image.startsWith('data:') || variation.image.startsWith('blob:') 
                                              ? variation.image 
                                              : `${IMAGE_BASE_URL}${variation.image}`} 
                                            alt={variation.volume} 
                                            className="w-full h-full object-cover" 
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = variations.map(v => 
                                                v.id === variation.id ? { ...v, image: null, imageFile: null } : v
                                              );
                                              setVariations(updated);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X size={10} className="text-white" />
                                          </button>
                                        </>
                                      ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gold-500/5 transition-colors">
                                          <ImageIcon size={20} className="text-gray-600 mb-1" />
                                          <span className="text-xs text-gray-500">Add</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const preview = URL.createObjectURL(file);
                                                const updated = variations.map(v => 
                                                  v.id === variation.id ? { ...v, image: preview, imageFile: file } : v
                                                );
                                                setVariations(updated);
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Variation Fields */}
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Volume/Size</label>
                                      <input
                                        type="text"
                                        value={variation.volume}
                                        onChange={(e) => {
                                          const updated = variations.map(v => 
                                            v.id === variation.id ? { ...v, volume: e.target.value } : v
                                          );
                                          setVariations(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                        placeholder="e.g., 100ml"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Price (₱)</label>
                                      <input
                                        type="number"
                                        value={variation.price}
                                        onChange={(e) => {
                                          const updated = variations.map(v => 
                                            v.id === variation.id ? { ...v, price: parseFloat(e.target.value) || 0 } : v
                                          );
                                          setVariations(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Compare Price</label>
                                      <input
                                        type="number"
                                        value={variation.comparePrice || ''}
                                        onChange={(e) => {
                                          const updated = variations.map(v => 
                                            v.id === variation.id ? { ...v, comparePrice: parseFloat(e.target.value) || null } : v
                                          );
                                          setVariations(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                        placeholder="Optional"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Stock</label>
                                      <input
                                        type="number"
                                        value={variation.stock}
                                        onChange={(e) => {
                                          const updated = variations.map(v => 
                                            v.id === variation.id ? { ...v, stock: parseInt(e.target.value) || 0 } : v
                                          );
                                          setVariations(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1.5">SKU</label>
                                      <input
                                        type="text"
                                        value={variation.sku}
                                        onChange={(e) => {
                                          const updated = variations.map(v => 
                                            v.id === variation.id ? { ...v, sku: e.target.value } : v
                                          );
                                          setVariations(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                        placeholder="Auto"
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Variation Description */}
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Description <span className="text-gray-600">(optional - specific to this size)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={variation.description || ''}
                                    onChange={(e) => {
                                      const updated = variations.map(v => 
                                        v.id === variation.id ? { ...v, description: e.target.value || null } : v
                                      );
                                      setVariations(updated);
                                    }}
                                    className="w-full px-3 py-2 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                                    placeholder="e.g., Travel size, perfect for on-the-go"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add Preset Sizes */}
                      <div className="mt-4 pt-4 border-t border-gold-500/10">
                        <p className="text-xs text-gray-500 mb-2">Quick add common sizes:</p>
                        <div className="flex flex-wrap gap-2">
                          {['30ml', '50ml', '100ml', '200ml', '500ml', '1L'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                // Calculate price based on size ratio
                                const basePrice = editingProduct?.price || 380;
                                const baseVolume = parseInt(editingProduct?.volume || '50') || 50;
                                const newVolume = parseInt(size) || 50;
                                const priceRatio = newVolume / baseVolume;
                                const calculatedPrice = Math.round(basePrice * priceRatio * 0.9); // 10% volume discount
                                
                                const newVariation: ProductVariation = {
                                  id: `var-${Date.now()}`,
                                  volume: size,
                                  price: calculatedPrice,
                                  comparePrice: calculateComparePrice(calculatedPrice),
                                  stock: 50,
                                  sku: `${editingProduct?.sku || 'NEW'}-${size.toUpperCase()}`,
                                  image: null,
                                  imageFile: null,
                                  description: null,
                                  isDefault: variations.length === 0, // First one is default
                                };
                                setVariations([...variations, newVariation]);
                              }}
                              disabled={variations.some(v => v.volume === size) || editingProduct?.volume === size}
                              className="px-3 py-1.5 bg-black-700 border border-gold-500/20 text-gray-300 rounded-lg text-xs hover:bg-gold-500/10 hover:border-gold-500/30 hover:text-gold-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              + {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Other Product Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Concentration/Type</label>
                        <input
                          type="text"
                          value={editingProduct.concentration || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, concentration: e.target.value })}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          placeholder="e.g., Eau de Parfum, Bar Soap, Liquid"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Barcode</label>
                        <input
                          type="text"
                          value={editingProduct.barcode || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                          placeholder="Enter barcode number"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ingredients</label>
                        <textarea
                          value={editingProduct.ingredients || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                          className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                          rows={2}
                          placeholder="Main ingredients (comma separated)"
                        />
                      </div>
                    </div>

                    {/* Product Flags */}
                    <div className="bg-black-800/50 rounded-xl p-6 border border-gold-500/10">
                      <h4 className="text-lg font-medium text-white mb-4">Product Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center gap-3 p-3 bg-black-700/50 rounded-lg cursor-pointer hover:bg-black-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={editingProduct.is_active}
                            onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                            className="w-5 h-5 accent-gold-500"
                          />
                          <div>
                            <span className="text-white font-medium">Active</span>
                            <p className="text-xs text-gray-500">Visible in store</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-black-700/50 rounded-lg cursor-pointer hover:bg-black-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={editingProduct.is_featured}
                            onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                            className="w-5 h-5 accent-gold-500"
                          />
                          <div>
                            <span className="text-white font-medium">Featured</span>
                            <p className="text-xs text-gray-500">Show on homepage</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-black-700/50 rounded-lg cursor-pointer hover:bg-black-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={editingProduct.is_new}
                            onChange={(e) => setEditingProduct({ ...editingProduct, is_new: e.target.checked })}
                            className="w-5 h-5 accent-gold-500"
                          />
                          <div>
                            <span className="text-white font-medium">New</span>
                            <p className="text-xs text-gray-500">New arrival badge</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-black-700/50 rounded-lg cursor-pointer hover:bg-black-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={editingProduct.is_on_sale}
                            onChange={(e) => setEditingProduct({ ...editingProduct, is_on_sale: e.target.checked })}
                            className="w-5 h-5 accent-gold-500"
                          />
                          <div>
                            <span className="text-white font-medium">On Sale</span>
                            <p className="text-xs text-gray-500">Show sale badge</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fragrance Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    <div className="bg-black-800/50 rounded-xl p-6 border border-gold-500/10">
                      <h4 className="text-lg font-medium text-white mb-2">Fragrance Pyramid</h4>
                      <p className="text-sm text-gray-400 mb-6">Define the scent profile for perfume products</p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                              Top Notes
                            </span>
                          </label>
                          <textarea
                            value={editingProduct.notes_top || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, notes_top: e.target.value })}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                            rows={2}
                            placeholder="First impression notes (e.g., Bergamot, Lemon, Pink Pepper)"
                          />
                          <p className="text-xs text-gray-500 mt-1">Initial scent that fades in 15-30 minutes</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                              Middle Notes (Heart)
                            </span>
                          </label>
                          <textarea
                            value={editingProduct.notes_middle || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, notes_middle: e.target.value })}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                            rows={2}
                            placeholder="Heart of the fragrance (e.g., Rose, Jasmine, Lavender)"
                          />
                          <p className="text-xs text-gray-500 mt-1">Core scent that emerges after top notes fade</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-amber-700"></span>
                              Base Notes
                            </span>
                          </label>
                          <textarea
                            value={editingProduct.notes_base || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, notes_base: e.target.value })}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                            rows={2}
                            placeholder="Foundation notes (e.g., Sandalwood, Musk, Vanilla)"
                          />
                          <p className="text-xs text-gray-500 mt-1">Long-lasting foundation that lingers for hours</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing & Stock Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Selling Price (₱) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editingProduct.price}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              // Auto-calculate compare price if "On Sale" is checked
                              const newComparePrice = editingProduct.is_on_sale 
                                ? calculateComparePrice(newPrice)
                                : editingProduct.compare_price;
                              setEditingProduct({ 
                                ...editingProduct, 
                                price: newPrice,
                                compare_price: newComparePrice
                              });
                            }}
                            className="w-full pl-8 pr-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Compare at Price (₱)
                          {editingProduct.is_on_sale && (
                            <span className="ml-2 text-xs text-gold-400">(auto-calculated)</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editingProduct.compare_price || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, compare_price: e.target.value ? parseFloat(e.target.value) : null })}
                              className="w-full pl-8 pr-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                              placeholder="Original price"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const suggested = calculateComparePrice(editingProduct.price);
                              setEditingProduct({ ...editingProduct, compare_price: suggested, is_on_sale: true });
                            }}
                            className="px-3 py-2 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/20 text-sm whitespace-nowrap"
                            title="Auto-calculate compare price"
                          >
                            Auto
                          </button>
                        </div>
                        {editingProduct.compare_price && editingProduct.compare_price > editingProduct.price && (
                          <p className="text-xs text-green-400 mt-1">
                            💰 {calculateDiscount(editingProduct.price, editingProduct.compare_price)}% OFF - Save ₱{(editingProduct.compare_price - editingProduct.price).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cost Price (₱)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editingProduct.cost_price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full pl-8 pr-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            placeholder="Cost to you"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">For profit calculation</p>
                      </div>
                    </div>

                    {/* Enhanced Price Preview Card - Product Card Style */}
                    {editingProduct.price > 0 && (
                      <div className="bg-gradient-to-br from-gold-500/10 via-gold-600/5 to-transparent rounded-2xl p-6 border border-gold-500/20 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap size={16} className="text-gold-500" />
                          <h4 className="text-sm font-semibold text-gold-400">Live Preview</h4>
                          <span className="text-xs text-gray-500">— How customers will see it</span>
                        </div>
                        
                        {/* Mini Product Card Preview */}
                        <div className="bg-black-800/80 rounded-xl p-4 border border-gold-500/10 max-w-xs">
                          <div className="flex gap-4">
                            {/* Mini Image */}
                            <div className="w-20 h-20 rounded-lg bg-black-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={24} className="text-gray-600" />
                              )}
                            </div>
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{editingProduct.name || 'Product Name'}</p>
                              <p className="text-xs text-gray-500 truncate">{editingProduct.volume || '50ml'}</p>
                              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                <span className="text-lg font-bold text-gold-400">₱{editingProduct.price.toLocaleString()}</span>
                                {editingProduct.compare_price && editingProduct.compare_price > editingProduct.price && (
                                  <span className="text-sm text-gray-500 line-through">₱{editingProduct.compare_price.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {editingProduct.is_new && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">NEW</span>
                            )}
                            {editingProduct.is_on_sale && editingProduct.compare_price && editingProduct.compare_price > editingProduct.price && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                                -{calculateDiscount(editingProduct.price, editingProduct.compare_price)}% OFF
                              </span>
                            )}
                            {editingProduct.is_featured && (
                              <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-medium rounded-full">FEATURED</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Savings Summary */}
                        {editingProduct.compare_price && editingProduct.compare_price > editingProduct.price && (
                          <div className="mt-4 flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle size={18} className="text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-green-400">
                                Customers save ₱{(editingProduct.compare_price - editingProduct.price).toLocaleString()}
                              </p>
                              <p className="text-xs text-green-400/70">
                                {calculateDiscount(editingProduct.price, editingProduct.compare_price)}% discount from original price
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-black-800/50 rounded-xl p-6 border border-gold-500/10">
                      <h4 className="text-lg font-medium text-white mb-4">Inventory</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Stock Quantity</label>
                          <input
                            type="number"
                            value={editingProduct.stock_quantity}
                            onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Alert</label>
                          <input
                            type="number"
                            value={editingProduct.low_stock_threshold}
                            onChange={(e) => setEditingProduct({ ...editingProduct, low_stock_threshold: parseInt(e.target.value) || 10 })}
                            className="w-full px-4 py-3 bg-black-800 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            placeholder="10"
                          />
                          <p className="text-xs text-gray-500 mt-1">Get notified when stock falls below this level</p>
                        </div>
                      </div>
                    </div>

                    {/* Profit Calculation Preview */}
                    {editingProduct.price > 0 && editingProduct.cost_price && editingProduct.cost_price > 0 && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-green-400">Profit per unit:</span>
                          <span className="text-xl font-semibold text-green-400">
                            ₱{(editingProduct.price - editingProduct.cost_price).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-green-400/70 text-sm">Margin:</span>
                          <span className="text-green-400/70">
                            {((editingProduct.price - editingProduct.cost_price) / editingProduct.price * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer with Navigation */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-t border-gold-500/20 bg-gradient-to-r from-black-800/80 to-black-900/80">
                {/* Step Navigation */}
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  {activeTab !== 'basic' && (
                    <button
                      onClick={() => {
                        const tabs = ['basic', 'details', 'notes', 'pricing'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1] as typeof activeTab);
                      }}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gold-500/30 text-gray-400 rounded-lg hover:text-white hover:border-gold-500/50 transition-colors text-sm sm:text-base"
                    >
                      <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Previous
                    </button>
                  )}
                </div>
                
                {/* Status & Actions */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 order-1 sm:order-2">
                  {/* Step Validation Status */}
                  {(() => {
                    // Define required fields for each step
                    const stepValidation = {
                      basic: {
                        isValid: !!(editingProduct.name?.trim() && editingProduct.category_id && editingProduct.price > 0),
                        message: !editingProduct.name?.trim() ? 'Product name required' : 
                                 !editingProduct.category_id ? 'Select a category' : 
                                 editingProduct.price <= 0 ? 'Enter a valid price' : '',
                      },
                      details: {
                        isValid: !!(editingProduct.volume?.trim()),
                        message: !editingProduct.volume?.trim() ? 'Volume/Size required' : '',
                      },
                      notes: {
                        isValid: true, // Notes are optional
                        message: '',
                      },
                      pricing: {
                        isValid: editingProduct.stock_quantity >= 0,
                        message: editingProduct.stock_quantity < 0 ? 'Stock cannot be negative' : '',
                      },
                    };
                    
                    const currentValidation = stepValidation[activeTab];
                    
                    return (
                      <div className="hidden lg:flex items-center gap-2 text-sm mr-2 sm:mr-4">
                        {currentValidation.isValid ? (
                          <span className="flex items-center gap-1.5 text-green-400">
                            <CheckCircle size={14} />
                            Step complete
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-yellow-400">
                            <AlertTriangle size={14} />
                            {currentValidation.message}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingProduct(null);
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 border border-gold-500/30 text-gray-400 rounded-xl hover:text-white hover:border-gold-500/50 transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  
                  {activeTab !== 'pricing' ? (
                    (() => {
                      // Validate current step before allowing next
                      const canProceed = {
                        basic: !!(editingProduct.name?.trim() && editingProduct.category_id && editingProduct.price > 0),
                        details: !!(editingProduct.volume?.trim()),
                        notes: true,
                        pricing: true,
                      };
                      
                      const isStepValid = canProceed[activeTab];
                      
                      return (
                        <button
                          onClick={() => {
                            if (!isStepValid) {
                              // Show validation error
                              const messages = {
                                basic: 'Please fill in product name, select a category, and set a price',
                                details: 'Please enter the volume/size',
                                notes: '',
                                pricing: '',
                              };
                              if (messages[activeTab]) {
                                alert(messages[activeTab]);
                              }
                              return;
                            }
                            const tabs = ['basic', 'details', 'notes', 'pricing'];
                            const currentIndex = tabs.indexOf(activeTab);
                            if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1] as typeof activeTab);
                          }}
                          disabled={!isStepValid}
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                            isStepValid 
                              ? 'bg-gold-500/20 border border-gold-500/50 text-gold-400 hover:bg-gold-500/30 hover:scale-105' 
                              : 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Next
                          <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      onClick={handleSaveProduct}
                      disabled={isSaving || isUploading || !editingProduct.name || editingProduct.price <= 0}
                      className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-xl font-semibold hover:from-gold-400 hover:to-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-lg hover:shadow-gold-500/25 text-sm sm:text-base whitespace-nowrap"
                    >
                      {isSaving || isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-black border-t-transparent" />
                          <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Saving...'}</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span className="hidden sm:inline">{isNewProduct ? 'Add Product' : 'Save Changes'}</span>
                          <span className="sm:hidden">{isNewProduct ? 'Add' : 'Save'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Product Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm" 
              onClick={() => setIsViewModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-gradient-to-br from-black-900 via-black-900 to-black-800 border border-gold-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-gold-500/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-gold-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Eye size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white">
                      Product Details
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {viewingProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Images */}
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-square bg-black-800 rounded-xl overflow-hidden border border-gold-500/20">
                      {(() => {
                        // Get selected variation's image or fallback to main images
                        const selectedVar = viewingProduct.variations?.find(v => v.id === selectedVariationId);
                        const variationImage = selectedVar?.image;
                        
                        const allImages = [
                          variationImage || viewingProduct.image_main,
                          ...(viewingProduct.image_gallery || [])
                        ].filter(Boolean) as string[];
                        const currentImage = allImages[viewGalleryIndex] || allImages[0];
                        
                        return currentImage ? (
                          <img
                            src={currentImage.startsWith('http') || currentImage.startsWith('data:') ? currentImage : `${IMAGE_BASE_URL}${currentImage}`}
                            alt={viewingProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="text-gray-600" size={64} />
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Gallery Thumbnails */}
                    {(() => {
                      const selectedVar = viewingProduct.variations?.find(v => v.id === selectedVariationId);
                      const variationImage = selectedVar?.image;
                      
                      const allImages = [
                        variationImage || viewingProduct.image_main,
                        ...(viewingProduct.image_gallery || [])
                      ].filter(Boolean) as string[];
                      
                      if (allImages.length <= 1) return null;
                      
                      return (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {allImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setViewGalleryIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                viewGalleryIndex === index 
                                  ? 'border-gold-500 ring-2 ring-gold-500/30' 
                                  : 'border-transparent hover:border-gray-600'
                              }`}
                            >
                              <img
                                src={img.startsWith('http') || img.startsWith('data:') ? img : `${IMAGE_BASE_URL}${img}`}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-5">
                    {/* Category & Status */}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm">
                        {viewingProduct.category?.name || 'Uncategorized'}
                      </span>
                      {getStockStatusBadge(viewingProduct.stock_status)}
                      {viewingProduct.is_featured && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">Featured</span>
                      )}
                      {viewingProduct.is_new && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">New</span>
                      )}
                      {viewingProduct.is_on_sale && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">On Sale</span>
                      )}
                    </div>

                    {/* Name & SKU */}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{viewingProduct.name}</h2>
                      {viewingProduct.sku && (
                        <p className="text-sm text-gray-500 mt-1">SKU: {viewingProduct.sku}</p>
                      )}
                    </div>

                    {/* Size/Variation Selector */}
                    {viewingProduct.variations && viewingProduct.variations.length > 0 && (
                      <div className="bg-black-800/50 rounded-xl p-4 border border-gold-500/20">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Available Sizes</h4>
                        <div className="flex flex-wrap gap-2">
                          {/* Main product size */}
                          <button
                            onClick={() => {
                              setSelectedVariationId(null);
                              setViewGalleryIndex(0);
                            }}
                            className={`relative px-4 py-3 rounded-lg border-2 transition-all ${
                              selectedVariationId === null
                                ? 'border-gold-500 bg-gold-500/10'
                                : 'border-gray-700 hover:border-gray-600 bg-black-700'
                            }`}
                          >
                            <span className="block text-sm font-medium text-white">{viewingProduct.volume || 'Default'}</span>
                            <span className="block text-xs text-gold-400 mt-0.5">₱{viewingProduct.price.toLocaleString()}</span>
                            <span className={`block text-xs mt-0.5 ${
                              viewingProduct.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {viewingProduct.stock_quantity > 0 ? `${viewingProduct.stock_quantity} in stock` : 'Out of stock'}
                            </span>
                          </button>
                          
                          {/* Variation sizes */}
                          {viewingProduct.variations.map((variation) => (
                            <button
                              key={variation.id}
                              onClick={() => {
                                setSelectedVariationId(variation.id);
                                setViewGalleryIndex(0);
                              }}
                              className={`relative px-4 py-3 rounded-lg border-2 transition-all ${
                                selectedVariationId === variation.id
                                  ? 'border-gold-500 bg-gold-500/10'
                                  : 'border-gray-700 hover:border-gray-600 bg-black-700'
                              }`}
                            >
                              {variation.isDefault && (
                                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gold-500 text-black text-[10px] font-bold rounded">
                                  DEFAULT
                                </span>
                              )}
                              {variation.image && (
                                <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <ImageIcon size={10} className="text-white" />
                                </div>
                              )}
                              <span className="block text-sm font-medium text-white">{variation.volume}</span>
                              <span className="block text-xs text-gold-400 mt-0.5">₱{variation.price.toLocaleString()}</span>
                              <span className={`block text-xs mt-0.5 ${
                                variation.stock > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {variation.stock > 0 ? `${variation.stock} in stock` : 'Out of stock'}
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Selected variation details */}
                        {selectedVariationId && (() => {
                          const selectedVar = viewingProduct.variations?.find(v => v.id === selectedVariationId);
                          if (!selectedVar) return null;
                          return (
                            <div className="mt-4 pt-4 border-t border-gold-500/10">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm text-gray-400">Selected: </span>
                                  <span className="text-white font-medium">{selectedVar.volume}</span>
                                  {selectedVar.sku && (
                                    <span className="text-xs text-gray-500 ml-2">SKU: {selectedVar.sku}</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-xl font-bold text-gold-500">₱{selectedVar.price.toLocaleString()}</span>
                                  {selectedVar.comparePrice && selectedVar.comparePrice > selectedVar.price && (
                                    <span className="text-sm text-gray-500 line-through ml-2">₱{selectedVar.comparePrice.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              {selectedVar.description && (
                                <p className="mt-2 text-sm text-gray-400">{selectedVar.description}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Price (when no variation selected) */}
                    {!selectedVariationId && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-gold-500">₱{viewingProduct.price.toLocaleString()}</span>
                        {viewingProduct.compare_price && viewingProduct.compare_price > viewingProduct.price && (
                          <>
                            <span className="text-lg text-gray-500 line-through">₱{viewingProduct.compare_price.toLocaleString()}</span>
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-sm font-medium">
                              -{Math.round(((viewingProduct.compare_price - viewingProduct.price) / viewingProduct.compare_price) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Volume & Concentration (only when no variations or nothing selected) */}
                    {(!viewingProduct.variations || viewingProduct.variations.length === 0) && (viewingProduct.volume || viewingProduct.concentration) && (
                      <div className="flex gap-4">
                        {viewingProduct.volume && (
                          <div className="flex items-center gap-2">
                            <Droplets size={16} className="text-blue-400" />
                            <span className="text-gray-300">{viewingProduct.volume}</span>
                          </div>
                        )}
                        {viewingProduct.concentration && (
                          <div className="flex items-center gap-2">
                            <Layers size={16} className="text-purple-400" />
                            <span className="text-gray-300">{viewingProduct.concentration}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {viewingProduct.short_description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Short Description</h4>
                        <p className="text-gray-300">{viewingProduct.short_description}</p>
                      </div>
                    )}

                    {viewingProduct.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Full Description</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{viewingProduct.description}</p>
                      </div>
                    )}

                    {/* Fragrance Notes */}
                    {(viewingProduct.notes_top || viewingProduct.notes_middle || viewingProduct.notes_base) && (
                      <div className="bg-black-800/50 rounded-xl p-4 border border-gold-500/10">
                        <h4 className="text-sm font-medium text-gold-400 mb-3">Fragrance Notes</h4>
                        <div className="space-y-2">
                          {viewingProduct.notes_top && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">TOP</span>
                              <span className="text-gray-300 text-sm">{viewingProduct.notes_top}</span>
                            </div>
                          )}
                          {viewingProduct.notes_middle && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded">HEART</span>
                              <span className="text-gray-300 text-sm">{viewingProduct.notes_middle}</span>
                            </div>
                          )}
                          {viewingProduct.notes_base && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">BASE</span>
                              <span className="text-gray-300 text-sm">{viewingProduct.notes_base}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stock Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black-800/50 rounded-lg p-3 border border-gold-500/10">
                        <p className="text-xs text-gray-500 mb-1">Stock Quantity</p>
                        <p className={`text-xl font-bold ${
                          viewingProduct.stock_quantity <= 0 ? 'text-red-400' :
                          viewingProduct.stock_quantity <= viewingProduct.low_stock_threshold ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{viewingProduct.stock_quantity}</p>
                      </div>
                      <div className="bg-black-800/50 rounded-lg p-3 border border-gold-500/10">
                        <p className="text-xs text-gray-500 mb-1">Low Stock Alert</p>
                        <p className="text-xl font-bold text-gray-300">{viewingProduct.low_stock_threshold}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-black-800/50 rounded-lg p-3 text-center border border-gold-500/10">
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="text-lg font-bold text-white">{viewingProduct.view_count}</p>
                      </div>
                      <div className="bg-black-800/50 rounded-lg p-3 text-center border border-gold-500/10">
                        <p className="text-xs text-gray-500">Sold</p>
                        <p className="text-lg font-bold text-white">{viewingProduct.sold_count}</p>
                      </div>
                      <div className="bg-black-800/50 rounded-lg p-3 text-center border border-gold-500/10">
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="text-lg font-bold text-white">⭐ {viewingProduct.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center p-6 bg-black-900/80 border-t border-gold-500/20">
                <div className="text-xs text-gray-500">
                  Created: {new Date(viewingProduct.created_at).toLocaleDateString()}
                  {viewingProduct.updated_at !== viewingProduct.created_at && (
                    <span className="ml-4">Updated: {new Date(viewingProduct.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditProduct(viewingProduct);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-xl font-semibold hover:from-gold-400 hover:to-gold-500 transition-all"
                  >
                    <Edit2 size={16} />
                    Edit Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </SalesLayout>
  );
};

export default SalesProducts;

