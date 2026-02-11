import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Heart, ImageOff, ShoppingCart, Zap, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { productService, ProductVariation } from '../../services/productServicePHP';

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

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inspiredBy?: string;
}

const ProductCard = ({ 
  id, 
  name, 
  price, 
  image, 
  category, 
  isNew = false, 
  isFeatured = false,
  inspiredBy
}: ProductCardProps) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [modalAction, setModalAction] = useState<'cart' | 'buy'>('cart');
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Get the resolved image URL
  const resolvedImage = getImageUrl(image);
  
  // Check if image is valid (not empty, null, or undefined)
  const hasValidImage = resolvedImage && resolvedImage.trim() !== '' && !imageError;

  // Fetch variations when modal opens
  useEffect(() => {
    if (showVariationModal && variations.length === 0) {
      fetchVariations();
    }
  }, [showVariationModal]);

  const fetchVariations = async () => {
    setLoadingVariations(true);
    try {
      const response = await productService.getProduct(id);
      if (response.success && response.data) {
        const productVariations = response.data.variations || [];
        setVariations(productVariations);
        if (productVariations.length > 0) {
          setSelectedVariation(productVariations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch variations:', error);
    } finally {
      setLoadingVariations(false);
    }
  };

  const openVariationModal = (action: 'cart' | 'buy') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalAction(action);
    setQuantity(1);
    setShowVariationModal(true);
  };

  const handleConfirmAction = () => {
    const variationToUse = selectedVariation;
    const variationImage = variationToUse?.image ? getImageUrl(variationToUse.image) : resolvedImage;
    
    addToCart({
      productId: id,
      name,
      variation: variationToUse?.volume || 'Default',
      variationId: variationToUse?.id,
      price: variationToUse?.price || price,
      quantity,
      image: variationImage,
      maxStock: variationToUse?.stock,
    });
    
    setShowVariationModal(false);
    
    if (modalAction === 'buy') {
      navigate('/checkout');
    } else {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const currentPrice = selectedVariation?.price || price;
  const currentStock = selectedVariation?.stock || 0;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group bg-black-800 border border-gold-500/20 rounded-sm overflow-hidden hover:border-gold-500/50 transition-all duration-300 hover:shadow-gold cursor-pointer"
        onClick={() => navigate(`/products/${id}`)}
      >
      {/* Image Container */}
      <Link to={`/products/${id}`} onClick={(e) => e.stopPropagation()} className="block relative overflow-hidden aspect-product bg-black-900">
        {hasValidImage ? (
          <img
            src={resolvedImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black-800">
            <ImageOff size={48} className="text-gray-600 mb-2" />
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {isNew && (
            <span className="bg-gold-500 text-black text-xs font-accent font-medium px-3 py-1 rounded-sm">
              NEW
            </span>
          )}
          {isFeatured && (
            <span className="bg-black-950 text-gold-400 border border-gold-500/50 text-xs font-accent font-medium px-3 py-1 rounded-sm">
              FEATURED
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 bg-black-900/90 border border-gold-500/30 rounded-full flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart size={16} />
          </button>
          <span
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 bg-black-900/90 border border-gold-500/30 rounded-full flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-colors cursor-pointer"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </span>
        </div>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/5 transition-colors duration-300 pointer-events-none" />
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] sm:text-xs text-gold-500/70 font-accent uppercase tracking-wider">
          {category}
        </span>
        <Link to={`/products/${id}`}>
          <h3 className="font-display text-sm sm:text-lg font-medium text-white mt-0.5 sm:mt-1 hover:text-gold-400 transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>
        {inspiredBy && (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 italic truncate">
            Inspired by: <span className="text-gold-400/80">{inspiredBy}</span>
          </p>
        )}
        
        <div className="mt-2 sm:mt-3">
          <span className="font-accent text-sm sm:text-lg font-semibold text-gold-500">
            ₱{price.toLocaleString()}
          </span>
        </div>

        {/* Authenticated User Actions */}
        {isAuthenticated ? (
          <div className="mt-3 flex gap-1.5 sm:gap-2">
            <button
              onClick={openVariationModal('cart')}
              disabled={addedToCart}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                addedToCart
                  ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                  : 'bg-black-700 text-gold-500 border border-gold-500/30 hover:bg-gold-500/10 hover:border-gold-500'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check size={14} className="sm:w-4 sm:h-4" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden min-[400px]:inline">Add to</span>
                  <span>Cart</span>
                </>
              )}
            </button>
            <button
              onClick={openVariationModal('buy')}
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-medium bg-gold-500 text-black hover:bg-gold-600 transition-colors"
            >
              <Zap size={14} className="sm:w-4 sm:h-4" />
              <span>Buy</span>
            </button>
          </div>
        ) : (
          /* Non-authenticated: View Details link - make it a full-width button for easier tapping */
          <div className="mt-2 sm:mt-3">
            <Link 
              to={`/products/${id}`}
              className="block w-full text-center py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-accent font-medium text-gold-400 hover:text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-500/50 rounded-lg transition-all"
            >
              View Details
            </Link>
          </div>
        )}
        </div>
      </motion.div>

      {/* Variation Selection Modal */}
      <AnimatePresence>
        {showVariationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVariationModal(false)}
              className="absolute inset-0 bg-black/80"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-black-900 border border-gold-500/30 rounded-xl p-6 max-h-[90vh] overflow-y-auto mx-4"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowVariationModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Product Info */}
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-black-800 rounded-lg overflow-hidden flex-shrink-0">
                  {hasValidImage ? (
                    <img src={resolvedImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={24} className="text-gray-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold line-clamp-2">{name}</h3>
                  <p className="text-gray-400 text-sm">{category}</p>
                  <p className="text-gold-500 font-semibold mt-1">₱{currentPrice.toLocaleString()}</p>
                </div>
              </div>

              {loadingVariations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                </div>
              ) : variations.length > 0 ? (
                <>
                  {/* Variation Selection */}
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-3">Select Volume</label>
                    <div className="grid grid-cols-2 gap-2">
                      {variations.map((variation) => (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedVariation(variation)}
                          disabled={variation.stock === 0}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedVariation?.id === variation.id
                              ? 'border-gold-500 bg-gold-500/10'
                              : variation.stock === 0
                              ? 'border-gray-700 bg-black-800 opacity-50 cursor-not-allowed'
                              : 'border-gold-500/30 bg-black-800 hover:border-gold-500/50'
                          }`}
                        >
                          <p className="text-white font-medium">{variation.volume}</p>
                          <p className="text-gold-500 text-sm">₱{variation.price.toLocaleString()}</p>
                          <p className={`text-xs mt-1 ${variation.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {variation.stock > 0 ? `${variation.stock} in stock` : 'Out of stock'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-3">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 bg-black-800 border border-gold-500/30 rounded-lg flex items-center justify-center text-white hover:border-gold-500 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                        disabled={quantity >= currentStock}
                        className="w-10 h-10 bg-black-800 border border-gold-500/30 rounded-lg flex items-center justify-center text-white hover:border-gold-500 transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                      <span className="text-gray-400 text-sm ml-2">Max: {currentStock}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-4 border-t border-gold-500/20 mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gold-500 font-bold text-xl">
                      ₱{(currentPrice * quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleConfirmAction}
                    disabled={!selectedVariation || currentStock === 0}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      modalAction === 'buy'
                        ? 'bg-gold-500 text-black hover:bg-gold-600'
                        : 'bg-black-700 text-gold-500 border border-gold-500 hover:bg-gold-500 hover:text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {modalAction === 'buy' ? (
                      <>
                        <Zap size={18} />
                        Buy Now • ₱{(currentPrice * quantity).toLocaleString()}
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* No variations - use default */
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">This product has no size variations.</p>
                  <button
                    onClick={handleConfirmAction}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      modalAction === 'buy'
                        ? 'bg-gold-500 text-black hover:bg-gold-600'
                        : 'bg-black-700 text-gold-500 border border-gold-500 hover:bg-gold-500 hover:text-black'
                    }`}
                  >
                    {modalAction === 'buy' ? (
                      <>
                        <Zap size={18} />
                        Buy Now • ₱{price.toLocaleString()}
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
