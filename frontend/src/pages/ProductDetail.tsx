import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, FreeMode, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { 
  ChevronRight, 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  Star,
  ImageOff
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';

import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import { productService, Product as APIProduct, ProductVariation } from '../services/productServicePHP';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';

// Helper to get full image URL
const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads')) {
    return `http://localhost/FragranzaWeb/backend${imagePath}`;
  }
  return imagePath;
};

// Transform API product to display format
interface DisplayProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inspiredBy?: string;
  description?: string;
  short_description?: string;
  ingredients?: string;
  rating?: number;
  reviewCount?: number;
  volume?: string;
  concentration?: string;
  notes_top?: string;
  notes_middle?: string;
  notes_base?: string;
  variations?: ProductVariation[];
  image_gallery?: string[];
  sku?: string;
  stock_quantity?: number;
  stock_status?: string;
}

const transformAPIProduct = (product: APIProduct): DisplayProduct => ({
  id: product.id,
  name: product.name,
  price: product.price,
  image: getImageUrl(product.image_main),
  category: product.category?.name || 'Uncategorized',
  isNew: product.is_new,
  isFeatured: product.is_featured,
  description: product.description || product.short_description || undefined,
  short_description: product.short_description || undefined,
  ingredients: product.ingredients || undefined,
  rating: product.rating || 0,
  reviewCount: product.review_count || 0,
  volume: product.volume || undefined,
  concentration: product.concentration || undefined,
  notes_top: product.notes_top || undefined,
  notes_middle: product.notes_middle || undefined,
  notes_base: product.notes_base || undefined,
  variations: product.variations || [],
  image_gallery: product.image_gallery?.map(img => getImageUrl(img)) || [],
  sku: product.sku || undefined,
  stock_quantity: product.stock_quantity || 0,
  stock_status: product.stock_status || 'in_stock',
});

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<DisplayProduct[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const productId = parseInt(id || '1');
        const response = await productService.getProduct(productId);
        
        if (response.success && response.data) {
          const transformed = transformAPIProduct(response.data);
          setProduct(transformed);
          
          // Set default variation if available
          if (transformed.variations && transformed.variations.length > 0) {
            const defaultVariation = transformed.variations.find(v => v.isDefault) || transformed.variations[0];
            setSelectedVariation(defaultVariation);
          }
          
          // Fetch related products from same category
          if (response.data.category_id) {
            try {
              const relatedResponse = await productService.getProducts({ 
                category: response.data.category?.slug,
                limit: 4 
              });
              if (relatedResponse.success && relatedResponse.data) {
                const related = relatedResponse.data
                  .filter(p => p.id !== productId)
                  .slice(0, 4)
                  .map(transformAPIProduct);
                setRelatedProducts(related);
              }
            } catch {
              // Ignore related products error
            }
          }
        } else {
          setError(response.error || 'Product not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleVariationSelect = (variation: ProductVariation) => {
    setSelectedVariation(variation);
  };

  // Get current price (variation price or base price)
  const currentPrice = selectedVariation?.price || product?.price || 0;
  const comparePrice = selectedVariation?.comparePrice || null;
  const currentVolume = selectedVariation?.volume || product?.volume || '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal pt-20 sm:pt-24 pb-8 sm:pb-16 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-charcoal pt-20 sm:pt-24 pb-8 sm:pb-16 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">Product Not Found</h2>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{error || "The product you're looking for doesn't exist."}</p>
          <Link to="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Create image array for gallery
  const productImages = (() => {
    const images: string[] = [];
    
    // If a variation with image is selected, show that first
    if (selectedVariation?.image) {
      const variationImage = getImageUrl(selectedVariation.image);
      if (variationImage) images.push(variationImage);
    }
    
    // Add main image
    if (product.image && !images.includes(product.image)) {
      images.push(product.image);
    }
    
    // Add gallery images
    if (product.image_gallery && product.image_gallery.length > 0) {
      product.image_gallery.forEach((img: string) => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add variation images (not already included)
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach(v => {
        if (v.image) {
          const vImg = getImageUrl(v.image);
          if (vImg && !images.includes(vImg)) {
            images.push(vImg);
          }
        }
      });
    }
    
    return images;
  })();

  const hasImages = productImages.length > 0 && productImages[0] !== '';

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Breadcrumb */}
      <div className="bg-charcoal-light border-b border-gold-500/10 pt-16 sm:pt-20">
        <div className="container-custom py-3 sm:py-4 px-4 sm:px-6">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-x-auto whitespace-nowrap pb-1">
            <Link to="/" className="text-gray-400 hover:text-gold-500 transition-colors whitespace-nowrap">Home</Link>
            <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
            <Link to="/products" className="text-gray-400 hover:text-gold-500 transition-colors whitespace-nowrap">Products</Link>
            <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
            <Link 
              to={`/products?category=${encodeURIComponent(product.category)}`} 
              className="text-gray-400 hover:text-gold-500 transition-colors whitespace-nowrap hidden sm:inline"
            >
              {product.category}
            </Link>
            <ChevronRight size={12} className="text-gray-600 flex-shrink-0 hidden sm:inline" />
            <span className="text-gold-500 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Product Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Image */}
              <div className="relative bg-gradient-to-br from-charcoal-light to-charcoal rounded-lg overflow-hidden mb-4 border border-gold-500/20">
                {hasImages ? (
                  <Swiper
                    spaceBetween={10}
                    navigation={true}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="product-gallery-main"
                  >
                    {productImages.map((image, index) => (
                      <SwiperSlide key={index}>
                        <div className="aspect-square flex items-center justify-center p-8">
                          <img 
                            src={image} 
                            alt={`${product.name} - View ${index + 1}`}
                            className="max-w-full max-h-full object-contain drop-shadow-2xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center bg-black-800">
                    <ImageOff size={64} className="text-gray-600 mb-3" />
                    <span className="text-gray-500">No Image Available</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.isNew && (
                    <span className="bg-gold-500 text-charcoal px-3 py-1 text-xs font-semibold rounded-full">
                      NEW
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-gradient-to-r from-gold-600 to-gold-400 text-charcoal px-3 py-1 text-xs font-semibold rounded-full">
                      FEATURED
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {hasImages && productImages.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={12}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="product-gallery-thumbs"
                >
                  {productImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="aspect-square bg-charcoal-light rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-gold-500/50 transition-colors">
                        <img 
                          src={image} 
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Category & Title */}
              <div className="mb-6">
                <span className="text-gold-500 text-xs sm:text-sm font-medium tracking-wider uppercase">
                  {product.category}
                </span>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-1 sm:mt-2 mb-2 sm:mb-3">
                  {product.name}
                </h1>
                {product.sku && (
                  <p className="text-gray-500 text-sm">SKU: {product.sku}</p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating || 0) ? 'fill-gold-500 text-gold-500' : 'text-gray-600'}
                    />
                  ))}
                </div>
                <span className="text-white font-medium text-sm sm:text-base">{product.rating || 0}</span>
                <span className="text-gray-500 text-sm">({product.reviewCount || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline flex-wrap gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-gold-500">
                    ₱{currentPrice.toLocaleString()}
                  </span>
                  {comparePrice && comparePrice > currentPrice && (
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      ₱{comparePrice.toLocaleString()}
                    </span>
                  )}
                  {currentVolume && (
                    <span className="text-gray-500 text-xs sm:text-sm">/ {currentVolume}</span>
                  )}
                </div>
                {product.stock_status === 'out_of_stock' && (
                  <span className="inline-block mt-2 text-red-400 text-sm font-medium">Out of Stock</span>
                )}
              </div>

              {/* Variations */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-8">
                  <label className="block text-gray-400 text-sm mb-3">Select Size:</label>
                  <div className="flex flex-wrap gap-3">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.id}
                        onClick={() => handleVariationSelect(variation)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedVariation?.id === variation.id
                            ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                            : 'border-gold-500/30 text-gray-300 hover:border-gold-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {variation.image && (
                            <img 
                              src={getImageUrl(variation.image)} 
                              alt={variation.volume}
                              className="w-8 h-8 object-contain rounded"
                            />
                          )}
                          <div className="text-left">
                            <div className="font-medium">{variation.volume}</div>
                            <div className="text-sm text-gold-500">₱{variation.price.toLocaleString()}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {product.short_description && (
                <p className="text-gray-300 leading-relaxed mb-6">
                  {product.short_description}
                </p>
              )}

              {/* Concentration & Volume */}
              {(product.concentration || currentVolume) && (
                <div className="flex gap-6 mb-6 text-sm">
                  {product.concentration && (
                    <div>
                      <span className="text-gray-500">Concentration: </span>
                      <span className="text-white">{product.concentration}</span>
                    </div>
                  )}
                  {currentVolume && (
                    <div>
                      <span className="text-gray-500">Volume: </span>
                      <span className="text-white">{currentVolume}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                <div className="text-center p-2 sm:p-4 bg-charcoal-light rounded-lg border border-gold-500/10">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500 mx-auto mb-1 sm:mb-2" />
                  <span className="text-[10px] sm:text-xs text-gray-400">Free Shipping</span>
                </div>
                <div className="text-center p-2 sm:p-4 bg-charcoal-light rounded-lg border border-gold-500/10">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500 mx-auto mb-1 sm:mb-2" />
                  <span className="text-[10px] sm:text-xs text-gray-400">Authentic</span>
                </div>
                <div className="text-center p-2 sm:p-4 bg-charcoal-light rounded-lg border border-gold-500/10">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500 mx-auto mb-1 sm:mb-2" />
                  <span className="text-[10px] sm:text-xs text-gray-400">Easy Returns</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center flex-wrap gap-3 sm:gap-6 mb-6 sm:mb-8">
                <span className="text-gray-400 text-sm">Quantity:</span>
                <div className="flex items-center border border-gold-500/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2.5 sm:p-3 text-gold-500 hover:bg-gold-500/10 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 sm:w-14 text-center font-medium text-white text-sm">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2.5 sm:p-3 text-gold-500 hover:bg-gold-500/10 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {selectedVariation && (
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {selectedVariation.stock > 0 ? `${selectedVariation.stock} in stock` : 'Out of stock'}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-8">
                <Button 
                  variant="primary" 
                  className="flex-1 min-w-[140px] sm:min-w-[200px] text-sm sm:text-base"
                  disabled={product.stock_status === 'out_of_stock' || (selectedVariation ? selectedVariation.stock === 0 : false)}
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login');
                      return;
                    }
                    // TODO: Add to cart logic
                  }}
                >
                  <ShoppingBag size={16} className="mr-2" />
                  Add to Cart
                </Button>
                <button 
                  className="p-3 sm:p-4 border border-gold-500/30 rounded-lg text-gold-500 hover:bg-gold-500/10 transition-colors"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login');
                      return;
                    }
                    // TODO: Add to wishlist logic
                  }}
                >
                  <Heart size={18} />
                </button>
                <button className="p-3 sm:p-4 border border-gold-500/30 rounded-lg text-gold-500 hover:bg-gold-500/10 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>

              {/* Buy Now */}
              <Button 
                variant="outline" 
                className="w-full"
                disabled={product.stock_status === 'out_of_stock' || (selectedVariation ? selectedVariation.stock === 0 : false)}
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('login');
                    return;
                  }
                  // TODO: Buy now logic
                }}
              >
                Buy Now
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-6 sm:py-8 lg:py-12 bg-charcoal-light border-t border-b border-gold-500/10">
        <div className="container-custom px-4 sm:px-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gold-500/20 mb-6 sm:mb-8 overflow-x-auto">
            {['description', 'ingredients', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium capitalize transition-colors relative whitespace-nowrap ${
                  activeTab === tab 
                    ? 'text-gold-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'description' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl"
              >
                <h3 className="font-display text-xl font-semibold text-white mb-4">About {product.name}</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {product.description || product.short_description || 'A luxurious fragrance crafted with the finest ingredients, designed to leave a lasting impression.'}
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-charcoal rounded-lg p-6 border border-gold-500/10">
                    <h4 className="font-display text-gold-500 font-semibold mb-2">Longevity</h4>
                    <p className="text-gray-400 text-sm">8-10 hours of beautiful wear time</p>
                  </div>
                  <div className="bg-charcoal rounded-lg p-6 border border-gold-500/10">
                    <h4 className="font-display text-gold-500 font-semibold mb-2">Sillage</h4>
                    <p className="text-gray-400 text-sm">Moderate projection, perfect for all occasions</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ingredients' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl"
              >
                <h3 className="font-display text-xl font-semibold text-white mb-4">Key Ingredients</h3>
                {product.ingredients && (
                  <p className="text-gray-300 mb-8 text-sm">
                    {product.ingredients}
                  </p>
                )}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-6 bg-charcoal rounded-lg border border-gold-500/10">
                    <h4 className="font-display text-gold-500 font-medium mb-2">Top Notes</h4>
                    <p className="text-sm text-gray-400">{product.notes_top || 'Fresh & Vibrant'}</p>
                  </div>
                  <div className="p-6 bg-charcoal rounded-lg border border-gold-500/10">
                    <h4 className="font-display text-gold-500 font-medium mb-2">Heart Notes</h4>
                    <p className="text-sm text-gray-400">{product.notes_middle || 'Floral & Warm'}</p>
                  </div>
                  <div className="p-6 bg-charcoal rounded-lg border border-gold-500/10">
                    <h4 className="font-display text-gold-500 font-medium mb-2">Base Notes</h4>
                    <p className="text-sm text-gray-400">{product.notes_base || 'Rich & Lasting'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-center bg-charcoal rounded-lg p-6 border border-gold-500/10">
                    <div className="text-4xl font-display font-bold text-gold-500">{product.rating || 0}</div>
                    <div className="flex items-center justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(product.rating || 0) ? 'fill-gold-500 text-gold-500' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{product.reviewCount || 0} reviews</p>
                  </div>
                  <div className="flex-1">
                    <Button variant="outline" size="sm">Write a Review</Button>
                  </div>
                </div>
                <p className="text-gray-400">Customer reviews coming soon...</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="container-custom">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white text-center mb-10">
              You May Also <span className="text-gold-500">Like</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard 
                  key={relatedProduct.id} 
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={relatedProduct.price}
                  image={relatedProduct.image}
                  category={relatedProduct.category}
                  isNew={relatedProduct.isNew}
                  isFeatured={relatedProduct.isFeatured}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
