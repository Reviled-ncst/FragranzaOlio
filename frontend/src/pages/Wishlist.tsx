import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

interface WishlistItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  inStock: boolean;
}

const Wishlist = () => {
  // TODO: Replace with actual wishlist state from context/API
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const removeFromWishlist = (id: number) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const addToCart = (item: WishlistItem) => {
    // TODO: Add to cart functionality
    console.log('Adding to cart:', item);
    removeFromWishlist(item.id);
  };

  return (
    <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
      <div className="container-custom px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gold-500" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white">My Wishlist</h1>
          {wishlistItems.length > 0 && (
            <span className="bg-gold-500/20 text-gold-500 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              {wishlistItems.length} items
            </span>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty Wishlist */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-16 lg:py-20"
          >
            <Heart className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">Your wishlist is empty</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Start adding fragrances you love! Click the heart icon on any product to save it here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors"
            >
              Explore Products
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black-900 border border-gold-500/20 rounded-lg sm:rounded-xl overflow-hidden group"
              >
                {/* Image */}
                <Link to={`/products/${item.id}`} className="block relative aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-semibold">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="p-3 sm:p-4">
                  <p className="text-gray-400 text-xs sm:text-sm">{item.brand}</p>
                  <Link to={`/products/${item.id}`}>
                    <h3 className="text-white text-sm sm:text-base font-semibold hover:text-gold-500 transition-colors line-clamp-2">{item.name}</h3>
                  </Link>
                  <p className="text-gold-500 text-sm sm:text-base font-bold mt-1.5 sm:mt-2">₱{item.price.toLocaleString()}</p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 sm:mt-4">
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.inStock}
                      className="flex-grow flex items-center justify-center gap-1 sm:gap-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 font-semibold py-2 text-xs sm:text-sm rounded-lg transition-colors"
                    >
                      <ShoppingBag size={14} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="p-2 bg-black-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
