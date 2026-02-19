import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  X, 
  Camera, 
  Send, 
  Package, 
  CheckCircle,
  ImagePlus,
  Trash2,
  Sparkles,
  Store,
  ThumbsUp,
  ThumbsDown,
  Truck,
  Gift,
  HeadphonesIcon,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Heart,
  Video,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Order, OrderItem } from '../services/orderService';
import orderService from '../services/orderService';
import { getImageUrl } from '../services/api';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (reviews: ReviewData[], shopRating?: ShopRatingData) => Promise<boolean>;
  recommendations?: Array<{
    id: number;
    name: string;
    price: number;
    image?: string;
    category?: string;
  }>;
  onAddToCart?: (productId: number) => void;
}

type ModalPhase = 'products' | 'shop' | 'recommendations' | 'success';

export interface ReviewData {
  product_id: number;
  order_id: number;
  order_item_id: number;
  rating: number;
  title?: string;
  review?: string;
  images?: string[];
  videos?: string[];
}

export interface ShopRatingData {
  order_id: number;
  rating: number;
  service_rating?: number;
  delivery_rating?: number;
  packaging_rating?: number;
  feedback?: string;
  would_recommend?: boolean;
}

// Interactive Star Rating Component
const StarRating = ({ 
  rating, 
  onRatingChange, 
  size = 'lg',
  readonly = false 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredStar || rating);
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => onRatingChange?.(star)}
              onMouseEnter={() => !readonly && setHoveredStar(star)}
              onMouseLeave={() => !readonly && setHoveredStar(0)}
              className={`transition-transform duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125 active:scale-90'}`}
            >
              <Star
                className={`${sizeClasses[size]} transition-all duration-200 ${
                  isActive 
                    ? 'fill-gold-500 text-gold-500 drop-shadow-[0_0_8px_rgba(212,175,95,0.5)]' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              />
            </button>
          );
        })}
      </div>
      <div className="h-5">
        {!readonly && (hoveredStar || rating) > 0 && (
          <p className="text-gold-400 text-sm font-medium animate-fade-in">
            {ratingLabels[hoveredStar || rating]}
          </p>
        )}
      </div>
    </div>
  );
};

// Individual Product Review Card
const ProductReviewCard = ({ 
  item, 
  review, 
  onReviewChange 
}: { 
  item: OrderItem; 
  review: ReviewData;
  onReviewChange: (review: ReviewData) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(review.rating > 0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleRatingChange = (rating: number) => {
    onReviewChange({ ...review, rating });
    if (!isExpanded) setIsExpanded(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate: max 5 images total
    const currentImages = review.images?.length || 0;
    if (currentImages + files.length > 5) {
      setUploadError('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}`);
        return;
      }
      if (file.size > maxSize) {
        setUploadError(`File too large (max 10MB): ${file.name}`);
        return;
      }
      validFiles.push(file);
    }

    setUploadError(null);
    setIsUploadingImages(true);

    try {
      const result = await orderService.uploadReviewMedia(validFiles, 'images');
      if (result.success && result.urls) {
        const newImages = [...(review.images || []), ...result.urls];
        onReviewChange({ ...review, images: newImages });
      } else {
        setUploadError(result.error || 'Failed to upload images');
      }
    } catch (err) {
      setUploadError('Failed to upload images');
    } finally {
      setIsUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate: max 2 videos total
    const currentVideos = review.videos?.length || 0;
    if (currentVideos + files.length > 2) {
      setUploadError('Maximum 2 videos allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Invalid video type: ${file.name}`);
        return;
      }
      if (file.size > maxSize) {
        setUploadError(`Video too large (max 50MB): ${file.name}`);
        return;
      }
      validFiles.push(file);
    }

    setUploadError(null);
    setIsUploadingVideos(true);

    try {
      const result = await orderService.uploadReviewMedia(validFiles, 'videos');
      if (result.success && result.urls) {
        const newVideos = [...(review.videos || []), ...result.urls];
        onReviewChange({ ...review, videos: newVideos });
      } else {
        setUploadError(result.error || 'Failed to upload videos');
      }
    } catch (err) {
      setUploadError('Failed to upload videos');
    } finally {
      setIsUploadingVideos(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(review.images || [])];
    newImages.splice(index, 1);
    onReviewChange({ ...review, images: newImages });
  };

  const removeVideo = (index: number) => {
    const newVideos = [...(review.videos || [])];
    newVideos.splice(index, 1);
    onReviewChange({ ...review, videos: newVideos });
  };

  return (
    <motion.div
      layout
      className={`bg-gradient-to-br from-black-800/80 to-black-900/50 border rounded-xl p-4 transition-all duration-300 ${
        review.rating > 0 
          ? 'border-gold-500/30 shadow-lg shadow-gold-500/5' 
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Product Info */}
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 bg-black-900 rounded-lg overflow-hidden flex-shrink-0 border border-gold-500/10">
          {item.image ? (
            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="text-white font-medium truncate">{item.product_name}</h4>
          {item.variation && (
            <p className="text-gray-500 text-sm">{item.variation}</p>
          )}
          <p className="text-gold-500 text-sm font-medium">₱{item.price.toLocaleString()}</p>
        </div>
        {review.rating > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Star Rating */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Rate this product:</p>
        <StarRating 
          rating={review.rating} 
          onRatingChange={handleRatingChange}
        />
      </div>

      {/* Expanded Review Section */}
      <AnimatePresence>
        {isExpanded && review.rating > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Review Title */}
            <div className="mb-3">
              <label className="text-gray-400 text-sm mb-1 block">Review Title (optional)</label>
              <input
                type="text"
                placeholder="Sum up your experience..."
                value={review.title || ''}
                onChange={(e) => onReviewChange({ ...review, title: e.target.value })}
                className="w-full bg-black-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                maxLength={200}
              />
            </div>

            {/* Review Text */}
            <div className="mb-3">
              <label className="text-gray-400 text-sm mb-1 block">Your Review (optional)</label>
              <textarea
                placeholder="Share your experience with this product..."
                value={review.review || ''}
                onChange={(e) => onReviewChange({ ...review, review: e.target.value })}
                rows={3}
                className="w-full bg-black-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Upload Error */}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
                <button 
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Image Upload */}
            <div className="mb-3">
              <label className="text-gray-400 text-sm mb-2 block">
                Add Photos <span className="text-gray-600">(optional, max 5, 10MB each)</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                {/* Uploaded Images Preview */}
                {review.images?.map((url, index) => (
                  <div key={index} className="relative group w-16 h-16">
                    <img
                      src={getImageUrl(url)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                
                {/* Add Image Button */}
                {(review.images?.length || 0) < 5 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="w-16 h-16 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 hover:border-gold-500/50 hover:text-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImages ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ImagePlus className="w-6 h-6" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Add Videos <span className="text-gray-600">(optional, max 2, 50MB each)</span>
              </label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                {/* Uploaded Videos Preview */}
                {review.videos?.map((url, index) => (
                  <div key={index} className="relative group w-24 h-16">
                    <video
                      src={getImageUrl(url)}
                      className="w-full h-full object-cover rounded-lg border border-gray-700"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                
                {/* Add Video Button */}
                {(review.videos?.length || 0) < 2 && (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideos}
                    className="w-24 h-16 border border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-600 hover:border-gold-500/50 hover:text-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingVideos ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        <span className="text-xs">Add Video</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Rating Modal
const RatingModal = ({ isOpen, onClose, order, onSubmit, recommendations = [], onAddToCart }: RatingModalProps) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [shopRating, setShopRating] = useState<ShopRatingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<ModalPhase>('products');

  // Initialize reviews when order changes
  useEffect(() => {
    if (order?.items) {
      setReviews(
        order.items.map(item => ({
          product_id: item.product_id,
          order_id: order.id,
          order_item_id: item.id,
          rating: 0,
          title: '',
          review: ''
        }))
      );
      setShopRating({
        order_id: order.id,
        rating: 0,
        service_rating: 0,
        delivery_rating: 0,
        packaging_rating: 0,
        feedback: '',
        would_recommend: true
      });
      setPhase('products');
    }
  }, [order]);

  const updateReview = (index: number, data: ReviewData) => {
    setReviews(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const hasAnyProductRating = reviews.some(r => r.rating > 0);
  const allRated = reviews.every(r => r.rating > 0);
  const ratedCount = reviews.filter(r => r.rating > 0).length;
  const hasShopRating = (shopRating?.rating || 0) > 0;

  const handleSubmit = async () => {
    const validReviews = reviews.filter(r => r.rating > 0);
    const validShopRating = shopRating && shopRating.rating > 0 ? shopRating : undefined;
    
    if (validReviews.length === 0 && !validShopRating) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(validReviews, validShopRating);
      if (success) {
        // Show recommendations if available, otherwise success
        if (recommendations.length > 0) {
          setPhase('recommendations');
        } else {
          setPhase('success');
          setTimeout(() => onClose(), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to submit reviews:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPhase = () => {
    if (phase === 'products') {
      setPhase('shop');
    } else if (phase === 'shop') {
      handleSubmit();
    }
  };

  const handlePrevPhase = () => {
    if (phase === 'shop') {
      setPhase('products');
    }
  };

  const canProceed = phase === 'products' ? hasAnyProductRating : hasShopRating;

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gradient-to-b from-black-900 to-black-950 border border-gold-500/20 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {/* SUCCESS PHASE */}
              {phase === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Thank You!</h2>
                  <p className="text-gray-400">Your reviews have been submitted successfully.</p>
                  <div className="flex justify-center mt-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <Star className="w-6 h-6 fill-gold-500 text-gold-500" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* RECOMMENDATIONS PHASE */}
              {phase === 'recommendations' && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  {/* Header */}
                  <div className="sticky top-0 bg-black-900/95 backdrop-blur-sm border-b border-gold-500/10 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-bold text-white">You Might Also Like</h2>
                        <p className="text-gray-500 text-sm">Based on your purchase</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-black-800 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Recommendations Grid */}
                  <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-2 gap-4">
                      {recommendations.slice(0, 4).map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-black-800/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gold-500/30 transition-all group"
                        >
                          <div className="aspect-square bg-black-900 overflow-hidden">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-700" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-white text-sm font-medium truncate">{product.name}</p>
                            {product.category && (
                              <p className="text-gray-500 text-xs">{product.category}</p>
                            )}
                            <p className="text-gold-500 font-semibold mt-1">₱{product.price.toLocaleString()}</p>
                            {onAddToCart && (
                              <button
                                onClick={() => onAddToCart(product.id)}
                                className="w-full mt-2 px-3 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400 text-sm font-medium hover:bg-gold-500/30 transition-colors flex items-center justify-center gap-2"
                              >
                                <ShoppingBag size={14} />
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-black-900/95 backdrop-blur-sm border-t border-gold-500/10 px-6 py-4">
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-black rounded-lg font-semibold transition-all"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PRODUCTS PHASE */}
              {phase === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  {/* Header */}
                  <div className="sticky top-0 bg-black-900/95 backdrop-blur-sm border-b border-gold-500/10 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-bold text-white">Rate Products</h2>
                        <p className="text-gray-500 text-sm">Step 1 of 2 • Order #{order.order_number}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-black-800 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    {/* Progress */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">
                        {ratedCount} of {reviews.length} products rated
                      </p>
                      {allRated && (
                        <motion.span 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1 text-green-500 text-sm"
                        >
                          <CheckCircle size={14} />
                          All rated!
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1 bg-black-800 rounded-full overflow-hidden mb-4">
                      <motion.div
                        className="h-full bg-gradient-to-r from-gold-500 to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(ratedCount / reviews.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Product Review Cards */}
                    {order.items?.map((item, index) => (
                      <ProductReviewCard
                        key={item.id}
                        item={item}
                        review={reviews[index] || { product_id: item.product_id, order_id: order.id, order_item_id: item.id, rating: 0 }}
                        onReviewChange={(data) => updateReview(index, data)}
                      />
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-black-900/95 backdrop-blur-sm border-t border-gold-500/10 px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors font-medium"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={handleNextPhase}
                        disabled={!hasAnyProductRating}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                          hasAnyProductRating
                            ? 'bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-black shadow-lg shadow-gold-500/25'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SHOP RATING PHASE */}
              {phase === 'shop' && shopRating && (
                <motion.div
                  key="shop"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                >
                  {/* Header */}
                  <div className="sticky top-0 bg-black-900/95 backdrop-blur-sm border-b border-gold-500/10 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-bold text-white">Rate Our Service</h2>
                        <p className="text-gray-500 text-sm">Step 2 of 2 • Almost done!</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-black-800 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {/* Overall Shop Rating */}
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm mb-4">How was your overall experience?</p>
                      <StarRating
                        rating={shopRating.rating}
                        onRatingChange={(rating) => setShopRating({ ...shopRating, rating })}
                        size="lg"
                      />
                    </div>

                    {/* Detailed Ratings */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-800">
                      {/* Service */}
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <HeadphonesIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-gray-400 text-sm mb-2">Service</p>
                        <StarRating
                          rating={shopRating.service_rating || 0}
                          onRatingChange={(rating) => setShopRating({ ...shopRating, service_rating: rating })}
                          size="sm"
                        />
                      </div>
                      
                      {/* Delivery */}
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Truck className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-gray-400 text-sm mb-2">Delivery</p>
                        <StarRating
                          rating={shopRating.delivery_rating || 0}
                          onRatingChange={(rating) => setShopRating({ ...shopRating, delivery_rating: rating })}
                          size="sm"
                        />
                      </div>
                      
                      {/* Packaging */}
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Gift className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-gray-400 text-sm mb-2">Packaging</p>
                        <StarRating
                          rating={shopRating.packaging_rating || 0}
                          onRatingChange={(rating) => setShopRating({ ...shopRating, packaging_rating: rating })}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Would Recommend */}
                    <div className="py-4">
                      <p className="text-gray-400 text-sm text-center mb-4">Would you recommend us to friends?</p>
                      <div className="flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => setShopRating({ ...shopRating, would_recommend: true })}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl border transition-all ${
                            shopRating.would_recommend 
                              ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                              : 'border-gray-700 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          <ThumbsUp className="w-5 h-5" />
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setShopRating({ ...shopRating, would_recommend: false })}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl border transition-all ${
                            shopRating.would_recommend === false 
                              ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                              : 'border-gray-700 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          <ThumbsDown className="w-5 h-5" />
                          No
                        </button>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Additional Feedback (optional)</label>
                      <textarea
                        value={shopRating.feedback || ''}
                        onChange={(e) => setShopRating({ ...shopRating, feedback: e.target.value })}
                        placeholder="Tell us how we can improve..."
                        className="w-full bg-black-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-gold-500/50 focus:outline-none resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-black-900/95 backdrop-blur-sm border-t border-gold-500/10 px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrevPhase}
                        className="flex-1 px-4 py-3 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <ArrowLeft size={18} />
                        Back
                      </button>
                      <button
                        onClick={handleNextPhase}
                        disabled={!hasShopRating || isSubmitting}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                          hasShopRating
                            ? 'bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-black shadow-lg shadow-gold-500/25'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RatingModal;
