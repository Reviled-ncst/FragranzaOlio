import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Order, OrderItem } from '../services/orderService';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (reviews: ReviewData[]) => Promise<boolean>;
}

export interface ReviewData {
  product_id: number;
  order_id: number;
  order_item_id: number;
  rating: number;
  title?: string;
  review?: string;
  images?: string[];
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
            <motion.button
              key={star}
              type="button"
              disabled={readonly}
              whileHover={!readonly ? { scale: 1.2 } : undefined}
              whileTap={!readonly ? { scale: 0.9 } : undefined}
              onClick={() => onRatingChange?.(star)}
              onMouseEnter={() => !readonly && setHoveredStar(star)}
              onMouseLeave={() => !readonly && setHoveredStar(0)}
              className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <Star
                className={`${sizeClasses[size]} transition-all duration-200 ${
                  isActive 
                    ? 'fill-gold-500 text-gold-500 drop-shadow-[0_0_8px_rgba(212,175,95,0.5)]' 
                    : 'text-gray-600 hover:text-gray-500'
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      {!readonly && (hoveredStar || rating) > 0 && (
        <motion.p 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gold-400 text-sm font-medium"
        >
          {ratingLabels[hoveredStar || rating]}
        </motion.p>
      )}
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

  const handleRatingChange = (rating: number) => {
    onReviewChange({ ...review, rating });
    if (!isExpanded) setIsExpanded(true);
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

            {/* Image Upload Placeholder */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Add Photos (optional)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="w-16 h-16 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 hover:border-gold-500/50 hover:text-gold-500 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Rating Modal
const RatingModal = ({ isOpen, onClose, order, onSubmit }: RatingModalProps) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      setSubmitSuccess(false);
    }
  }, [order]);

  const updateReview = (index: number, data: ReviewData) => {
    setReviews(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const hasAnyRating = reviews.some(r => r.rating > 0);
  const allRated = reviews.every(r => r.rating > 0);
  const ratedCount = reviews.filter(r => r.rating > 0).length;

  const handleSubmit = async () => {
    const validReviews = reviews.filter(r => r.rating > 0);
    if (validReviews.length === 0) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(validReviews);
      if (success) {
        setSubmitSuccess(true);
        // Auto-close after success animation
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit reviews:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {/* Success State */}
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
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
              ) : (
                <motion.div key="form">
                  {/* Header */}
                  <div className="sticky top-0 bg-black-900/95 backdrop-blur-sm border-b border-gold-500/10 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-bold text-white">Rate Your Order</h2>
                        <p className="text-gray-500 text-sm">Order #{order.order_number}</p>
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
                        onClick={handleSubmit}
                        disabled={!hasAnyRating || isSubmitting}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                          hasAnyRating
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
                            Submit Reviews
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
